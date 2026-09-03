# SuperSchedule

SuperSchedule is a student-schedule optimizer that takes class blocks, commute, meal plan, clubs, workouts, and other lifestyle factors and algorithmically builds a weekly plan around them.

## Stack

FastAPI backend + Vite / React / TypeScript frontend.

## Run locally

Backend (from `backend/`):

    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000

Frontend (from `frontend/`):

    npm install
    npm run dev

The API stub listens on http://localhost:8000. The UI (http://localhost:5173) POSTs to `/optimize` and displays the placeholder schedule. The optimizer is not implemented yet.
