import { isSupabaseConfigured } from "../lib/supabase"

export default function ConfigBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div className="banner">
      Supabase env vars are missing. Copy <code>frontend/.env.example</code> to{" "}
      <code>frontend/.env</code>, fill <code>VITE_SUPABASE_URL</code> and{" "}
      <code>VITE_SUPABASE_ANON_KEY</code>, then restart Vite. Auth and Calendar
      import stay disabled until then.
    </div>
  )
}
