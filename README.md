# SuperSchedule
* DISCLAIMER: This is all vibe-coded with GrokBot, none of this is my own work. *
Student-schedule optimizer scaffold. Sign in with Google (via Supabase Auth), import Google Calendar, and save lifestyle preferences. The weekly optimizer is still a stub.

## Stack

- Frontend: Vite + React + TypeScript (`@supabase/supabase-js`, `react-router-dom`)
- Backend: FastAPI stub (`/health`, `/optimize`)
- Data: Supabase Postgres + Auth (Google provider)

No hosted Supabase project is created by this repo. Fill env files after you create one.

## Run locally

Copy frontend/.env.example to frontend/.env and backend/.env.example to backend/.env.

Frontend env (required for auth, calendar import, and DB):

- VITE_SUPABASE_URL: Project URL
- VITE_SUPABASE_ANON_KEY: anon public key

### 2. Create a Supabase project (dashboard; this repo does not create one)

1. Create a project at supabase.com
2. Enable the Google provider under Authentication, Providers
3. Set Site URL to http://localhost:5173 and allow that origin as a redirect
4. Run supabase/migrations/20260903233000_init.sql in the SQL editor
5. Copy the Project URL and anon key into the env files

See supabase/README.md for the same notes.

### 3. Google Cloud console (manual; the app cannot do this)

1. Create or reuse an OAuth 2.0 Web application client
2. Authorized JavaScript origins: http://localhost:5173
3. Authorized redirect URIs: the Supabase auth callback (https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback) and http://localhost:5173 if asked
4. Enable Google Calendar API
5. Consent screen: add calendar.readonly plus email/profile
6. Paste the client id and client secret into the Supabase Google provider settings

Until those console steps are done, Google sign-in and Calendar import will fail even with a filled env file.

### 4. Start the apps
Backend lives in backend/ (uvicorn, port 8000). Frontend lives in frontend/ (Vite, port 5173).
The UI still boots without env files and shows a setup banner.

## App flow

1. /login: Google Sign In with Calendar readonly scope
2. /calendar: Import Google Calendar, upsert into calendar_events
3. /preferences: sleep, commute, meals, clubs, workouts, other constraints
4. /optimize: existing stub; not the real algorithm

Row Level Security keeps each user on their own rows.

## Schema

- profiles (trigger on auth.users insert)
- calendar_events (imported Google events)
- scheduling_preferences (one row per user)

## Out of scope

- Creating a hosted Supabase project
- The real schedule optimizer
- Google Cloud console and OAuth consent verification

Backend env is optional; see backend/.env.example.
