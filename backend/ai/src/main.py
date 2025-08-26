# src/main.py
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from dotenv import load_dotenv

from .service import SentenceTfmEmbedder, ChromaStore, RAGService
from .routes import router

load_dotenv()


def _default_embed_model() -> str:
    """
    Choose a default model that matches the selected embedding backend.
    - fastembed: small + fast default
    - ollama: default to nomic-embed-text (ships with Ollama)
    """
    backend = os.getenv("EMBEDDING_BACKEND", "fastembed").lower()
    if backend == "ollama":
        return os.getenv("EMBED_MODEL", "nomic-embed-text")
    # fastembed
    return os.getenv("EMBED_MODEL", "BAAI/bge-small-en-v1.5")


@asynccontextmanager
async def lifespan(app: FastAPI):
    embedder = SentenceTfmEmbedder(_default_embed_model())
    store = ChromaStore(
        url=os.getenv("CHROMA_URL", "http://chroma:8000"),
        collection=os.getenv("CHROMA_COLLECTION", "repo"),
    )
    app.state.rag = RAGService(embedder, store)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Microservice",
        description="Handles AI-based requests",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.include_router(router)
    return app


app = create_app()
