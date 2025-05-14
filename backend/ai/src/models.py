from pydantic import BaseModel

class RequestData(BaseModel):
    input: str

class ResponseData(BaseModel):
    result: str
