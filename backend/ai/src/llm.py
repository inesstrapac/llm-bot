import os, requests

OLLAMA_BASE = os.getenv("OLLAMA_BASE", "http://host.docker.internal:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3:mini")

def local_llm(prompt: str, max_new_tokens: int = 256) -> str:
    r = requests.post(
        f"{OLLAMA_BASE}/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {"num_predict": max_new_tokens}
        },
        timeout=300
    )
    r.raise_for_status()
    return r.json()["response"]
