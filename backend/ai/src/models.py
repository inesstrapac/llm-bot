# backend/ai/src/models.py
from typing import List, Optional
from pydantic import BaseModel

class RequestData(BaseModel):
    input: str

class ResponseData(BaseModel):
    result: str

class IngestReq(BaseModel):
    repo_path: str
    exts: List[str] = [".md", ".txt", ".py", ".ts", ".js"]

class ChatReq(BaseModel):
    question: str
    k: int = 5

class Source(BaseModel):
    rank: int
    source: str
    chunk_id: int

class ChatResp(BaseModel):
    answer: str
    sources: List[Source]
    used_k: int
