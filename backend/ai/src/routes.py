from fastapi import APIRouter

from .models import RequestData, ResponseData

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
