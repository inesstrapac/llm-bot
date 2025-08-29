
from .controller import read_root

router = APIRouter()

@router.get("/hello")
def getHelloWorld(): 
    result = read_root()
    return result
