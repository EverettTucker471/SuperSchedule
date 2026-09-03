import { supabase } from "./supabase"
import type { CalendarEventRow, GoogleCalendarEvent } from "./types"

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly"
const TOKEN_KEY = "superschedule_google_provider_token"

export { CALENDAR_SCOPE }

export function rememberProviderToken(token: string | null | undefined) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token)
  }
}

export function clearProviderToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function getProviderToken(sessionToken?: string | null) {
  return sessionToken || sessionStorage.getItem(TOKEN_KEY)
}

function toIso(value?: { dateTime?: string; date?: string } | null): string | null {
  if (!value) return null
  if (value.dateTime) return new Date(value.dateTime).toISOString()
  if (value.date) return `${value.date}T00:00:00.000Z`
  return null
}

export async function fetchGoogleCalendarEvents(accessToken: string): Promise<GoogleCalendarEvent[]> {
  const timeMin = new Date()
  timeMin.setDate(timeMin.getDate() - 7)
  const timeMax = new Date()
  timeMax.setDate(timeMax.getDate() + 60)

  const events: GoogleCalendarEvent[] = []
  let pageToken: string | undefined

  do {
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events")
    url.searchParams.set("singleEvents", "true")
    url.searchParams.set("orderBy", "startTime")
    url.searchParams.set("maxResults", "250")
    url.searchParams.set("timeMin", timeMin.toISOString())
    url.searchParams.set("timeMax", timeMax.toISOString())
    if (pageToken) url.searchParams.set("pageToken", pageToken)

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = (await response.json()) as {
      error?: { message?: string }
      items?: GoogleCalendarEvent[]
      nextPageToken?: string
    }
    if (!response.ok) {
      const message = data.error?.message || `Google Calendar API error (${response.status})`
      throw new Error(message)
    }
    events.push(...(data.items || []))
    pageToken = data.nextPageToken
  } while (pageToken && events.length < 500)

  return events
}

export function mapGoogleEvent(userId: string, event: GoogleCalendarEvent) {
  const allDay = Boolean(event.start?.date && !event.start?.dateTime)
  return {
    user_id: userId,
    google_event_id: event.id || crypto.randomUUID(),
    title: event.summary || "(no title)",
    description: event.description || null,
    location: event.location || null,
    start_at: toIso(event.start),
    end_at: toIso(event.end),
    all_day: allDay,
    raw: event,
  }
}

export async function persistImportedEvents(
  userId: string,
  events: GoogleCalendarEvent[],
): Promise<number> {
  if (!supabase) throw new Error("Supabase is not configured")
  const rows = events.filter((event) => event.id).map((event) => mapGoogleEvent(userId, event))
  if (!rows.length) return 0
  const { error } = await supabase.from("calendar_events").upsert(rows, {
    onConflict: "user_id,google_event_id",
  })
  if (error) throw error
  return rows.length
}

export async function listImportedEvents(userId: string): Promise<CalendarEventRow[]> {
  if (!supabase) throw new Error("Supabase is not configured")
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .order("start_at", { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data || []) as CalendarEventRow[]
}
