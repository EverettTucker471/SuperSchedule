import { FormEvent, useState } from "react"
import { Navigate } from "react-router-dom"
import ConfigBanner from "../components/ConfigBanner"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const { user, loading, configured, signInWithGoogle } = useAuth()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  if (!loading && user) return <Navigate to="/calendar" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setPending(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed")
      setPending(false)
    }
  }

  return (
    <div className="login">
      <h1>SuperSchedule</h1>
      <p className="subtitle">
        Sign in with Google to import your calendar and save scheduling
        preferences. The optimizer is still a stub.
      </p>
      <ConfigBanner />
      <form onSubmit={onSubmit}>
        <button type="submit" disabled={!configured || pending || loading}>
          {pending ? "Redirecting to Google..." : "Sign in with Google"}
        </button>
      </form>
      {!configured ? (
        <p className="hint">
          Fill <code>frontend/.env</code> from <code>.env.example</code> after
          you create a Supabase project with the Google provider enabled.
        </p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  )
}
