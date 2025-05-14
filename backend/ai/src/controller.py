from .service import run_ai_logic

def handle_prediction(input_text: str) -> str:
    # You can add logging, validation, or preprocessing here
    result = run_ai_logic(input_text)
    return result

def predict(data: dict):
    # Here, run your AI model logic
    # e.g. model_output = my_model.predict(data["input"])
    return {"prediction": "some output from AI model"}

def read_root():
    return {"message": "Hello from Python microservice!"}