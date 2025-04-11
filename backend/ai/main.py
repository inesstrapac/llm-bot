from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from Python microservice!"}

@app.post("/predict")
def predict(data: dict):
    # Here, run your AI model logic
    # e.g. model_output = my_model.predict(data["input"])
    return {"prediction": "some output from AI model"}
