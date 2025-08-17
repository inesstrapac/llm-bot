# backend/ai/src/service.py
import os
from pathlib import Path
from typing import List, Tuple, Dict, Protocol

import chromadb
from chromadb import HttpClient
from chromadb.utils import embedding_functions  # optional alt approach
from sentence_transformers import SentenceTransformer


def run_ai_logic(input_text: str) -> str:
    # Replace with actual model prediction logic
    return f"Processed by AI: {input_text}"


# -------- Config --------
CHROMA_HOST = os.getenv("CHROMA_HOST", "chroma")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "repo")

EMBED_MODEL = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
EMBED_DIM = int(os.getenv("EMBED_DIM", "384"))

# -------- Protocols (interfaces) --------
class Embedder(Protocol):
    def encode(self, texts: List[str]): ...

class VectorStore(Protocol):
    def upsert_many(self, rows: List[Tuple[str, int, str, list]]) -> None: ...
    def search(self, q_vec, k: int = 5) -> List[Tuple[str, int, str]]: ...

from fastembed import TextEmbedding

class FastEmbedder:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model = TextEmbedding(model_name)
    def encode(self, texts):
        # TextEmbedding returns a generator of arrays — collect into a list
        return [vec for vec in self.model.embed(texts)]

class ChromaStore:
    """Thin wrapper over Chroma HTTP client."""
    def __init__(self, host: str = CHROMA_HOST, port: int = CHROMA_PORT, collection: str = CHROMA_COLLECTION):
        self.client: HttpClient = chromadb.HttpClient(host=host, port=port)
        # When using HttpClient, we embed on our side; don't pass embedding_function here.
        self.col = self.client.get_or_create_collection(name=collection)

    def upsert_many(self, rows: List[Tuple[str, int, str, list]]) -> None:
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

    def search(self, q_vec, k: int = 5) -> List[Tuple[str, int, str]]:
        res = self.col.query(query_embeddings=[q_vec.tolist()], n_results=k)
        out: List[Tuple[str, int, str]] = []
        if res and res.get("ids"):
            for i in range(len(res["ids"][0])):
                meta = res["metadatas"][0][i]
                doc = res["documents"][0][i]
                out.append((meta["path"], meta["chunk_id"], doc))
        return out

# -------- RAG orchestration --------
def chunk_text(text: str, size: int = 800, overlap: int = 120) -> List[str]:
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start:start+size])
        start += max(size - overlap, 1)
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

        embs = self.embedder.encode(chunks)
        rows = [(metas[i][0], metas[i][1], chunks[i], embs[i].tolist()) for i in range(len(chunks))]
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
