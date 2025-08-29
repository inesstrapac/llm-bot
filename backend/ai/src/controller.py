from .service import run_ai_logic

def handle_prediction(input_text: str) -> str:
    result = run_ai_logic(input_text)
    return result

def predict(data: dict):
    return {"prediction": "some output from AI model"}

def read_root():
    return {"message": "Hello from Python microservice!"}