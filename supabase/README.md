# Supabase

This folder holds SQL that you apply to a Supabase project. SuperSchedule does **not** create a hosted project for you.

1. Create a project at https://supabase.com
2. Enable the **Google** auth provider (Authentication → Providers)
3. Paste the Google OAuth client ID and secret from Google Cloud
4. Run `migrations/20260903233000_init.sql` in the SQL editor (or `supabase db push` if you use the CLI)
5. Copy the project URL and anon key into `frontend/.env` and `backend/.env` (see the repo README)

Redirect URLs to allow:

- `http://localhost:5173`
- `http://localhost:5173/**` (Site URL / additional redirects as prompted)
- Supabase callback: `https://<project-ref>.supabase.co/auth/v1/callback` (Google Cloud Authorized redirect URI)

Required Google Cloud APIs: **Google Calendar API**. OAuth scope used by the app: `https://www.googleapis.com/auth/calendar.readonly`.
