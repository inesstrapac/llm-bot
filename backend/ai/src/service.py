import os
import tempfile
from typing import Dict, List, Optional, Any, Tuple
 
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
        "chunk_size": int(os.getenv("CHUNK_SIZE", "800")),
        "chunk_overlap": int(os.getenv("CHUNK_OVERLAP", "100")),
    }

_EMB = None
_LLM = None
_SPLITTER = None
_STORES: Dict[Tuple[str, int, str], Chroma] = {}
 
def get_embeddings(ollama_base_url: str, model: str) -> OllamaEmbeddings:
    global _EMB
    if _EMB is None:
        _EMB = OllamaEmbeddings(base_url=ollama_base_url, model=model)
    return _EMB
 
def get_llm(ollama_base_url: str, model: str) -> ChatOllama:
    global _LLM
    if _LLM is None:
        _LLM = ChatOllama(base_url=ollama_base_url, model=model, temperature=0.1)
    return _LLM
 
def get_splitter(chunk_size: int, chunk_overlap: int) -> RecursiveCharacterTextSplitter:
    global _SPLITTER
    if _SPLITTER is None:
        _SPLITTER = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap
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
    """You are a helpful assistant. Use ONLY the provided context to answer the question.
If the answer cannot be found in the context, say you don't know.
Cite sources inline as [S1], [S2], ... (numbers map to context items).
 
Question: {question}
 
Context:
{context}
 
Answer:"""
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
    if collection_name:
        cfg["collection_name"] = collection_name
 
    emb = get_embeddings(cfg["ollama_base_url"], cfg["ollama_embed_model"])
    store = get_store(cfg["collection_name"], cfg["chroma_host"], cfg["chroma_port"], emb)
    splitter = get_splitter(cfg["chunk_size"], cfg["chunk_overlap"])
 
    # write file and load
    with tempfile.NamedTemporaryFile(delete=True, suffix=f"_{filename}") as tmp:
        tmp.write(file_bytes)
        tmp.flush()
        raw_docs = load_pdf(tmp.name)
 
    # split & enrich metadata
    docs = splitter.split_documents(raw_docs)
    for d in docs:
        md = d.metadata or {}
        if "source" not in md:
            md["source"] = os.path.basename(filename)
        if metadata:
            md = {**metadata, **md}
        d.metadata = md
 
    ids = store.add_documents(docs)
    return {"collection": cfg["collection_name"], "added": len(ids), "ids": ids}
 
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
 
def similarity_search_by_vector(
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
    qvec = emb.embed_query(query)
    docs = store.similarity_search_by_vector(qvec, k=k, filter=metadata_filter)
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
 
def ask(
    question: str,
    k: int = 4,
    collection_name: Optional[str] = None,
    metadata_filter: Optional[Dict[str, Any]] = None,
    by_vector: bool = False,
) -> Dict[str, Any]:
    cfg = get_config()
    if collection_name:
        cfg["collection_name"] = collection_name
 
    emb = get_embeddings(cfg["ollama_base_url"], cfg["ollama_embed_model"])
    llm = get_llm(cfg["ollama_base_url"], cfg["ollama_llm_model"])
    store = get_store(cfg["collection_name"], cfg["chroma_host"], cfg["chroma_port"], emb)
 
    if by_vector:
        qvec = emb.embed_query(question)
        docs = store.similarity_search_by_vector(qvec, k=k, filter=metadata_filter)
    else:
        docs = store.similarity_search(question, k=k, filter=metadata_filter)
 
    context = _format_context(docs)
    chain = RAG_PROMPT | llm | StrOutputParser()
    answer = chain.invoke({"question": question, "context": context}).strip()
 
    sources = [{"snippet": d.page_content[:500], "metadata": d.metadata} for d in docs]
    return {"collection": cfg["collection_name"], "k": k, "answer": answer, "sources": sources}