from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import verify_supabase_jwt_optional
from .models import OptimizeRequest, OptimizeResponse
from .optimizer import optimize_schedule

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

app = FastAPI(title="SuperSchedule")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "SuperSchedule"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/optimize", response_model=OptimizeResponse)
def optimize(
    request: OptimizeRequest,
    _user=Depends(verify_supabase_jwt_optional),
) -> OptimizeResponse:
    return optimize_schedule(request)
