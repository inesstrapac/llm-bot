import os
from pathlib import Path
from typing import List, Tuple, Dict, Protocol
from urllib.parse import urlparse

import requests
import chromadb
from chromadb import HttpClient


# ---------- simple placeholder ----------
def run_ai_logic(input_text: str) -> str:
    return f"Processed by AI: {input_text}"


# ---------- Protocols ----------
class Embedder(Protocol):
    def encode(self, texts: List[str]) -> List[List[float]]: ...


class VectorStore(Protocol):
    def upsert_many(self, rows: List[Tuple[str, int, str, List[float]]]) -> None: ...
    def search(self, q_vec: List[float], k: int = 5) -> List[Tuple[str, int, str]]: ...


# ---------- Embedding backends ----------
BACKEND = os.getenv("EMBEDDING_BACKEND", "fastembed").lower()


class SentenceTfmEmbedder:
    """
    Lightweight, backend-agnostic embedder:
      - fastembed (default): uses the TextEmbedding model locally
      - ollama: calls /api/embeddings on the Ollama server
    Always returns List[List[float]].
    """

    def __init__(self, model_name: str):
        self.model_name = model_name
        if BACKEND == "fastembed":
            from fastembed import TextEmbedding  # small dependency, fast to install
            self._embedder = TextEmbedding(model_name=model_name)
            self._mode = "fastembed"
        elif BACKEND == "ollama":
            self._mode = "ollama"
            self._ollama_url = os.getenv("OLLAMA_URL", "http://ollama:11434")
            self._ollama_model = model_name or os.getenv("EMBED_MODEL", "nomic-embed-text")
        else:
            raise ValueError(f"Unknown EMBEDDING_BACKEND={BACKEND}")

    def encode(self, texts: List[str]) -> List[List[float]]:
        if isinstance(texts, str):
            texts = [texts]

        if self._mode == "fastembed":
            # fastembed returns a generator of arrays; cast to list[list[float]]
            return [list(vec) for vec in self._embedder.embed(texts)]

        # ollama
        resp = requests.post(
            f"{self._ollama_url}/api/embeddings",
            json={"model": self._ollama_model, "input": texts},
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        # Ollama returns a single "embedding" for str; "embeddings" for list
        if "embedding" in data:
            return [data["embedding"]]
        return [item["embedding"] for item in data.get("embeddings", [])]


# ---------- Chroma store ----------
class ChromaStore:
    """Works with Chroma v2 server."""
    def __init__(self, url: str, collection: str):
        parsed = urlparse(url)
        host = parsed.hostname or "chroma"
        port = int(parsed.port or 8000)
        tenant = os.getenv("CHROMA_TENANT", "default_tenant")
        database = os.getenv("CHROMA_DATABASE", "default_database")
        self.client: HttpClient = chromadb.HttpClient(
            host=host, port=port, tenant=tenant, database=database
        )
        self.col = self.client.get_or_create_collection(name=collection)

    def upsert_many(self, rows: List[Tuple[str, int, str, List[float]]]) -> None:
        """
        rows: list of (path, chunk_id, content, embedding_list)
        """
        if not rows:
            return
        ids, docs, metas, embs = [], [], [], []
        for path, chunk_id, content, emb in rows:
            ids.append(f"{path}:{chunk_id}")
            docs.append(content)
            metas.append({"path": path, "chunk_id": chunk_id})
            embs.append(emb)
        self.col.add(ids=ids, documents=docs, metadatas=metas, embeddings=embs)

    def search(self, q_vec: List[float], k: int = 5) -> List[Tuple[str, int, str]]:
        res = self.col.query(query_embeddings=[q_vec], n_results=k)
        out: List[Tuple[str, int, str]] = []
        if res and res.get("ids"):
            n = len(res["ids"][0])
            for i in range(n):
                meta = res["metadatas"][0][i]
                doc = res["documents"][0][i]
                out.append((meta["path"], meta["chunk_id"], doc))
        return out


# ---------- RAG orchestration ----------
def chunk_text(text: str, size: int = 800, overlap: int = 120) -> List[str]:
    chunks, start = [], 0
    step = max(size - overlap, 1)
    while start < len(text):
        chunks.append(text[start : start + size])
        start += step
    return chunks


class RAGService:
    def __init__(self, embedder: Embedder, store: VectorStore):
        self.embedder = embedder
        self.store = store

    def ingest_repo(self, repo_path: str, exts: List[str]) -> Dict:
        repo = Path(repo_path)
        files: List[Path] = []
        for ext in exts:
            files += list(repo.rglob(f"*{ext}"))

        chunks: List[str] = []
        metas: List[Tuple[str, int]] = []

        for fp in files:
            try:
                text = Path(fp).read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            for i, ch in enumerate(chunk_text(text)):
                chunks.append(ch)
                metas.append((str(fp), i))

        if not chunks:
            return {"ok": False, "message": "No chunks ingested."}

        embs = self.embedder.encode(chunks)  # List[List[float]]
        rows = [(metas[i][0], metas[i][1], chunks[i], embs[i]) for i in range(len(chunks))]
        self.store.upsert_many(rows)
        return {"ok": True, "files": len(files), "chunks": len(chunks)}

    def retrieve(self, question: str, k: int = 5) -> List[Tuple[str, int, str]]:
        q_emb = self.embedder.encode([question])[0]
        return self.store.search(q_emb, k)

    @staticmethod
    def build_prompt(question: str, contexts: List[str]) -> str:
        joined = "\n\n".join([f"[{i+1}] {c}" for i, c in enumerate(contexts)])
        return (
            "You are a helpful assistant that ONLY uses the provided context.\n"
            "If the answer cannot be found in the context, say you don't know.\n\n"
            f"Question: {question}\n\nContext:\n{joined}\n\n"
            "Answer concisely and include citations like [1], [2]."
        )
