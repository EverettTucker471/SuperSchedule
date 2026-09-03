from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import OptimizeRequest, OptimizeResponse
from .optimizer import optimize_schedule

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
def optimize(request: OptimizeRequest) -> OptimizeResponse:
    return optimize_schedule(request)
