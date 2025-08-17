
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from dotenv import load_dotenv

from .service import SentenceTfmEmbedder, ChromaStore, RAGService
from .routes import router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    embedder = SentenceTfmEmbedder(os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2"))
    store = ChromaStore(
        host=os.getenv("CHROMA_HOST", "chroma"),
        port=int(os.getenv("CHROMA_PORT", "8000")),
        collection=os.getenv("CHROMA_COLLECTION", "repo"),
    )
    app.state.rag = RAGService(embedder, store)
    yield

def create_app() -> FastAPI:
    app = FastAPI(title="AI Microservice",
    description="Handles AI-based requests",
    version="1.0.0", lifespan=lifespan)
    app.include_router(router)
    return app

app = create_app()
