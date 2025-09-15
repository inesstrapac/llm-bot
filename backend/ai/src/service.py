import os
import tempfile
from typing import Dict, List, Optional, Any, Tuple
import re
 
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter

 
def get_config() -> Dict[str, Any]:
    return {
        "chroma_host": os.getenv("CHROMA_HOST", "chroma"),
        "chroma_port": int(os.getenv("CHROMA_PORT", "8000")),
        "collection_name": os.getenv("CHROMA_COLLECTION", "my_collection"),
        "ollama_base_url": os.getenv("OLLAMA_BASE_URL", "http://192.168.88.224:11434"),
        "ollama_embed_model": os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text"),
        "ollama_llm_model": os.getenv("OLLAMA_LLM_MODEL", "llama3.1:8b"),
        "chunk_size": int(os.getenv("CHUNK_SIZE", "900")),
        "chunk_overlap": int(os.getenv("CHUNK_OVERLAP", "150")),
        "add_start_index": os.getenv("ADD_START_INDEX", "true").lower() == "true",
    }

_EMB = None
_LLM = None
_SPLITTER = None
_STORES: Dict[Tuple[str, int, str], Chroma] = {}

from chromadb import Client
from chromadb.config import Settings

chroma_client = Client(Settings(
    chroma_api_impl="chromadb.api.fastapi.FastAPI",
    chroma_server_host=os.getenv("CHROMA_HOST", "chroma"),
    chroma_server_http_port=int(os.getenv("CHROMA_PORT", "8000")),
    allow_reset=False,
))

def create_collection(collection_name):
    collection = chroma_client.get_or_create_collection(name=collection_name)
    return {
        "id": collection.id,"name": collection.name
    }

def get_collections():
    collections = chroma_client.list_collections()
    return collections

def get_collection_data(collection_name):
    collection = chroma_client.get_or_create_collection(name=collection_name)
    collection_data = collection.get(include=["documents", "metadatas", "uris"])

    return collection_data

def get_embeddings(ollama_base_url: str, model: str) -> OllamaEmbeddings:
    global _EMB
    if _EMB is None:
        _EMB = OllamaEmbeddings(base_url=ollama_base_url, model=model)
    return _EMB
 
def get_llm(ollama_base_url: str, model: str) -> ChatOllama:
    global _LLM
    if _LLM is None:
        _LLM = ChatOllama(base_url=ollama_base_url, model=model, temperature=0.0)
    return _LLM
 
def get_splitter(chunk_size: int, chunk_overlap: int, add_start_index: bool) -> RecursiveCharacterTextSplitter:
    global _SPLITTER
    if _SPLITTER is None:
        _SPLITTER = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap, add_start_index=add_start_index,
        )
    return _SPLITTER
 
def get_store(
    collection_name: str,
    chroma_host: str,
    chroma_port: int,
    embeddings: OllamaEmbeddings
) -> Chroma:
    key = (chroma_host, chroma_port, collection_name)
    if key not in _STORES:
        _STORES[key] = Chroma(
            collection_name=collection_name,
            embedding_function=embeddings,
            host=chroma_host,
            port=chroma_port,
        )
    return _STORES[key]
 
def load_pdf(path: str) -> List[Document]:
    try:
        from langchain_community.document_loaders import PyMuPDFLoader 
        loader = PyMuPDFLoader(path)
        return loader.load()
    except Exception:
        from langchain_community.document_loaders import PyPDFLoader
        loader = PyPDFLoader(path)
        return loader.load()

RAG_PROMPT = ChatPromptTemplate.from_template(
    """You are a helpful math assistant.

Strict language policy:
- ALWAYS answer in ENGLISH, regardless of the user's language.
- Do NOT translate or alter LaTeX/math notation; only write English prose around it.
- Keep all math symbols, variable names, and formulas exactly as in the sources or as standard LaTeX.

Use ONLY the provided context to answer the question. If the answer cannot be found in the context, say you don't know.

Citations:
- Cite sources inline as [S1], [S2], ... right after the sentence or formula they support.
- [S#] indices map to the numbered items in Document context. Never invent citations.

Chat history (reference only — do NOT cite or copy it as a source):
{chat_history}

Math formatting rules:
- Use LaTeX. Do NOT put math in code fences or backticks.
- Inline math: \\( ... \\)
- Display math (preferred): \\[ ... \\]
- Vectors: \\vec{{a}}
- Dot product: \\cdot
- Norms: \\lVert ... \\rVert
- Do not double-escape backslashes (write \\(, not \\\\( ).

If sources disagree, mention the discrepancy and cite each claim.

Question: {question}

Context:
{context}

Answer (in ENGLISH only):"""
)

 
def _format_context(docs: List[Document]) -> str:
    lines = []
    for i, d in enumerate(docs, start=1):
        md = d.metadata or {}
        src = md.get("source") or md.get("file_path") or md.get("source_id") or "doc"
        page = md.get("page")
        heading = f"[S{i}] source={src}" + (f" page={page}" if page is not None else "")
        lines.append(f"{heading}\n{d.page_content}\n")
    return "\n".join(lines)

def ingest_pdf_bytes(
    file_bytes: bytes,
    filename: str,
    collection_name: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    cfg = get_config()
 
    emb = get_embeddings(cfg["ollama_base_url"], cfg["ollama_embed_model"])
    store = get_store(collection_name, cfg["chroma_host"], cfg["chroma_port"], emb)
    splitter = get_splitter(cfg["chunk_size"], cfg["chunk_overlap"], cfg["add_start_index"])
    with tempfile.NamedTemporaryFile(delete=True, suffix=f"_{filename}") as tmp:
        tmp.write(file_bytes)
        tmp.flush()
        raw_docs = load_pdf(tmp.name)

    docs = splitter.split_documents(raw_docs)
    for d in docs:
        md = d.metadata or {}
        if "source" not in md:
            md["source"] = os.path.basename(filename)
        if metadata:
            md = {**metadata, **md}
        d.metadata = md
 
    ids = store.add_documents(docs)
    return {"collection": collection_name, "added": len(ids), "ids": ids}
 
def similarity_search(
    query: str,
    k: int = 4,
    collection_name: Optional[str] = None,
    metadata_filter: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    cfg = get_config()
    if collection_name:
        cfg["collection_name"] = collection_name
 
    emb = get_embeddings(cfg["ollama_base_url"], cfg["ollama_embed_model"])
    store = get_store(cfg["collection_name"], cfg["chroma_host"], cfg["chroma_port"], emb)
    docs = store.similarity_search(query, k=k, filter=metadata_filter)
    return {
        "collection": cfg["collection_name"],
        "k": k,
        "matches": [{"page_content": d.page_content, "metadata": d.metadata} for d in docs],
    }
 
def delete_ids(
    ids: List[str],
    collection_name: Optional[str] = None,
) -> Dict[str, Any]:
    cfg = get_config()
    if collection_name:
        cfg["collection_name"] = collection_name
 
    emb = get_embeddings(cfg["ollama_base_url"], cfg["ollama_embed_model"])
    store = get_store(cfg["collection_name"], cfg["chroma_host"], cfg["chroma_port"], emb)
    store.delete(ids=ids)
    return {"collection": cfg["collection_name"], "deleted": ids}

def _format_chat_history(history: List[Dict[str, str]], limit:int=12) -> str:
    out = []
    for m in (history or [])[-limit:]:
        role = (m.get("role") or "user").upper()
        content = (m.get("content") or "").strip()
        if content:
            out.append(f"{role}: {content}")
    return "\n".join(out)

from .latex_postprocess import enforce_tex

def ask(
    question: str,
    k: int = 4,
    collection_name: Optional[str] = None,
    metadata_filter: Optional[Dict[str, Any]] = None,
    history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    cfg = get_config()
    if collection_name:
        cfg["collection_name"] = collection_name
 
    emb = get_embeddings(cfg["ollama_base_url"], cfg["ollama_embed_model"])
    llm = get_llm(cfg["ollama_base_url"], cfg["ollama_llm_model"])
    store = get_store(cfg["collection_name"], cfg["chroma_host"], cfg["chroma_port"], emb)
 
    docs = store.similarity_search(question, k=k, filter=metadata_filter)
    chat_history_str = _format_chat_history(history or [])

    context = _format_context(docs)
    chain = RAG_PROMPT | llm | StrOutputParser()
    answer = chain.invoke({"question": question, "context": context, "chat_history": chat_history_str}).strip()
    answer = enforce_tex(answer)
 
    sources = [{"snippet": d.page_content[:500], "metadata": d.metadata} for d in docs]
    return {"collection": cfg["collection_name"], "k": k, "answer": answer, "sources": sources}
