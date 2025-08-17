from fastapi import APIRouter, Request

from .models import RequestData, ResponseData
from .models import IngestReq, ChatReq, ChatResp, Source
from .llm import local_llm

from .controller import handle_prediction, read_root

router = APIRouter()

@router.get("/hello")
def getHelloWorld(): 
    result = read_root()
    return result

@router.post("/predict", response_model=ResponseData)
def predict(data: RequestData):
    result = handle_prediction(data.input)
    return ResponseData(result=result)


def local_llm(prompt: str) -> str:
    # TODO: replace with a real LLM call (OpenAI, Azure, Ollama, etc.)
    return "Placeholder answer based on retrieved context. [1]"+prompt

@router.post("/ingest")
async def ingest(req: IngestReq, request: Request):
    rag = request.app.state.rag  # RAGService singleton
    result = rag.ingest_repo(req.repo_path, req.exts)
    return result

@router.post("/chat", response_model=ChatResp)
async def chat(req: ChatReq, request: Request):
    rag = request.app.state.rag
    rows = rag.retrieve(req.question, req.k)
    contexts = [r[2] for r in rows]
    sources  = [Source(rank=i+1, source=r[0], chunk_id=r[1]) for i, r in enumerate(rows)]
    prompt = rag.build_prompt(req.question, contexts)
    answer = local_llm(prompt, max_new_tokens=250)
    return ChatResp(answer=answer, sources=sources, used_k=req.k)
