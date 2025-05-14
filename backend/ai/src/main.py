from fastapi import FastAPI
from .routes import router

app = FastAPI(
    title="AI Microservice",
    description="Handles AI-based requests",
    version="1.0.0"
)

app.include_router(router)