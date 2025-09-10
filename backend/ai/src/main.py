
import json
import os
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from .service import *
 
app = FastAPI(title="Chroma PDF Ingestion & RAG API")

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/collections")
def fetch_collections():
    collections = get_collections()

    return [
            {
                "id": getattr(col, "id", None),
                "name": getattr(col, "name", None),
                "metadata": getattr(col, "metadata", None),
                "documents": getattr(col, "documents", None),
            }
            for col in collections
        ]

@app.get("/collections/{collection_name}")
def fetch_collection_data(collection_name):
    return get_collection_data(str(collection_name))

@app.post("/collections")
def create_collections(body: dict):
    created_collection = create_collection(body["name"])
    return created_collection
 
@app.post("/ingest")
async def ingest_pdf(
    file: UploadFile = File(...),
    collection: Optional[str] = Form(None),
    metadata_json: Optional[str] = Form(None),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    try:
        metadata: Optional[Dict[str, Any]] = json.loads(metadata_json) if metadata_json else None
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="metadata_json must be valid JSON.")
    content = await file.read()
    res = ingest_pdf_bytes(content, file.filename, collection_name=collection, metadata=metadata)
    return JSONResponse(res)
 
@app.post("/query")
async def query(payload: Dict[str, Any]):
    query = payload.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Missing 'query' field.")
    k = int(payload.get("k", 4))
    collection = payload.get("collection")
    metadata_filter = payload.get("filter")
    by_vector = bool(payload.get("by_vector", False))
 
    if by_vector:
        return similarity_search_by_vector(query, k=k, collection_name=collection, metadata_filter=metadata_filter)
    return similarity_search(query, k=k, collection_name=collection, metadata_filter=metadata_filter)
 
@app.post("/delete")
async def delete_ids(payload: Dict[str, Any]):
    ids: List[str] = payload.get("ids") or []
    if not ids:
        raise HTTPException(status_code=400, detail="Provide 'ids' to delete.")
    collection = payload.get("collection")
    return delete_ids(ids, collection_name=collection)
 
@app.post("/ask")
async def askQuestion(payload: Dict[str, Any]):
    question = payload.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="Missing 'question' field.")
    k = int(payload.get("k", 10))
    collection = payload.get("collection")
    metadata_filter = payload.get("filter")
    history = payload.get("history") or []

    if not isinstance(history, list):
        raise HTTPException(status_code=400, detail="'history' must be a list of messages.")
 
    return ask(
        question=question,
        k=k,
        collection_name=collection,
        metadata_filter=metadata_filter,
        history=history,
    )