from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, payments, reviews, schools, shifts
from app.core.config import settings

app = FastAPI(title="School Police API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")
api.include_router(auth.router)
api.include_router(schools.router)
api.include_router(shifts.router)
api.include_router(payments.router)
api.include_router(reviews.router)
app.include_router(api)


@app.get("/health")
async def health():
    return {"status": "ok"}
