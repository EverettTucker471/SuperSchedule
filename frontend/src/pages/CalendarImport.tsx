import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import {
  fetchGoogleCalendarEvents,
  getProviderToken,
  listImportedEvents,
  persistImportedEvents,
} from "../lib/calendar"
import type { CalendarEventRow } from "../lib/types"

function formatWhen(row: CalendarEventRow) {
  if (!row.start_at) return "No start time"
  const start = new Date(row.start_at)
  if (row.all_day) return start.toLocaleDateString() + " (all day)"
  const end = row.end_at ? new Date(row.end_at) : null
  const date = start.toLocaleDateString()
  const startTime = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const endTime = end
    ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : ""
  return endTime ? `${date} ${startTime} – ${endTime}` : `${date} ${startTime}`
}

export default function CalendarImport() {
  const { user, session, configured, signInWithGoogle } = useAuth()
  const [events, setEvents] = useState<CalendarEventRow[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "importing">("idle")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const load = useCallback(async () => {
    if (!configured || !user) return
    setStatus("loading")
    setError("")
    try {
      const rows = await listImportedEvents(user.id)
      setEvents(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load events")
    } finally {
      setStatus("idle")
    }
  }, [configured, user])

  useEffect(() => {
    void load()
  }, [load])

  async function onImport() {
    if (!user) {
      setError("Sign in with Google first.")
      return
    }
    const token = getProviderToken(session?.provider_token)
    if (!token) {
      setError("No Google Calendar token. Sign in again to grant calendar access.")
      return
    }
    setStatus("importing")
    setError("")
    setNotice("")
    try {
      const googleEvents = await fetchGoogleCalendarEvents(token)
      const saved = await persistImportedEvents(user.id, googleEvents)
      await load()
      setNotice(
        saved
          ? `Imported ${saved} event${saved === 1 ? "" : "s"} from Google Calendar (primary, past 7 days through next 60).`
          : "Google Calendar returned no events in the import window.",
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed"
      setError(message)
    } finally {
      setStatus("idle")
    }
  }

  return (
    <section>
      <h1>Google Calendar</h1>
      <p className="subtitle">
        Import events from your primary Google Calendar. SuperSchedule stores a
        copy in Postgres so the future optimizer can read them.
      </p>
      <div className="actions">
        <button type="button" onClick={() => void onImport()} disabled={!configured || !user || status === "importing"}>
          {status === "importing" ? "Importing..." : "Import Google Calendar"}
        </button>
        {configured && user && !getProviderToken(session?.provider_token) ? (
          <button type="button" className="ghost" onClick={() => void signInWithGoogle()}>
            Re-authorize Google Calendar
          </button>
        ) : null}
      </div>
      {error ? <p className="error">{error}</p> : null}
      {notice ? <p className="notice">{notice}</p> : null}
      {status === "loading" ? <p>Loading imported events...</p> : null}
      {!events.length && status === "idle" ? (
        <p className="empty">No imported events yet.</p>
      ) : (
        <ul className="event-list">
          {events.map((event) => (
            <li key={event.id}>
              <strong>{event.title}</strong>
              <span>{formatWhen(event)}</span>
              {event.location ? <span className="muted">{event.location}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
