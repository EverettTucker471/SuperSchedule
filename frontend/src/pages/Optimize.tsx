import { FormEvent, useState } from "react"
import { useAuth } from "../context/AuthContext"

type ScheduleBlock = {
  day: string
  start_time: string
  end_time: string
  title: string
  kind: string
}

type OptimizeResponse = {
  note: string
  weekly_schedule: ScheduleBlock[]
}

function splitList(value: FormDataEntryValue | null): string[] {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function optionalNamed<T>(value: FormDataEntryValue | null, item: T): T[] {
  return String(value || "").trim() ? [item] : []
}

export default function Optimize() {
  const { session } = useAuth()
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [error, setError] = useState("")
  const [result, setResult] = useState<OptimizeResponse | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const body = {
      classes: [
        {
          name: String(form.get("class_name") || "Untitled class"),
          days: splitList(form.get("class_days")),
          start_time: String(form.get("class_start") || "09:00"),
          end_time: String(form.get("class_end") || "10:00"),
          location: String(form.get("class_location") || "") || null,
        },
      ],
      commute: {
        mode: String(form.get("commute_mode") || "walk"),
        minutes: Number(form.get("commute_minutes") || 0),
        notes: String(form.get("commute_notes") || "") || null,
      },
      meal_plan: {
        dining_hall: String(form.get("dining_hall") || "") || null,
        preferred_times: splitList(form.get("meal_times")),
        restrictions: splitList(form.get("meal_restrictions")),
      },
      clubs: optionalNamed(form.get("club_name"), {
        name: String(form.get("club_name") || ""),
        days: splitList(form.get("club_days")),
        start_time: String(form.get("club_start") || "") || null,
        end_time: String(form.get("club_end") || "") || null,
      }),
      workouts: optionalNamed(form.get("workout_activity"), {
        activity: String(form.get("workout_activity") || ""),
        days: splitList(form.get("workout_days")),
        duration_minutes: Number(form.get("workout_duration") || 45),
        preferred_time: String(form.get("workout_time") || "") || null,
      }),
      other_constraints: optionalNamed(form.get("other_label"), {
        label: String(form.get("other_label") || ""),
        days: splitList(form.get("other_days")),
        notes: String(form.get("other_notes") || "") || null,
      }),
    }

    setStatus("loading")
    setError("")
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }
      const response = await fetch("http://localhost:8000/optimize", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        throw new Error("Request failed with status " + response.status)
      }
      const data = (await response.json()) as OptimizeResponse
      setResult(data)
      setStatus("idle")
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Request failed")
    }
  }

  return (
    <section>
      <h1>Optimize (stub)</h1>
      <p className="subtitle">
        Placeholder request to the FastAPI <code>/optimize</code> endpoint. The
        real algorithm is not implemented yet.
      </p>
      <form onSubmit={onSubmit}>
        <fieldset>
          <legend>Class block</legend>
          <label>
            Name
            <input name="class_name" defaultValue="CS 101" />
          </label>
          <label>
            Days (comma-separated)
            <input name="class_days" defaultValue="Monday, Wednesday" />
          </label>
          <label>
            Start
            <input name="class_start" type="time" defaultValue="09:00" />
          </label>
          <label>
            End
            <input name="class_end" type="time" defaultValue="10:15" />
          </label>
          <label>
            Location
            <input name="class_location" defaultValue="Science Hall" />
          </label>
        </fieldset>
        <fieldset>
          <legend>Commute</legend>
          <label>
            Mode
            <input name="commute_mode" defaultValue="bus" />
          </label>
          <label>
            Minutes
            <input name="commute_minutes" type="number" min={0} defaultValue={20} />
          </label>
          <label>
            Notes
            <input name="commute_notes" defaultValue="Campus loop" />
          </label>
        </fieldset>
        <fieldset>
          <legend>Meal plan</legend>
          <label>
            Dining hall
            <input name="dining_hall" defaultValue="Main cafeteria" />
          </label>
          <label>
            Preferred times
            <input name="meal_times" defaultValue="12:00, 18:00" />
          </label>
          <label>
            Restrictions
            <input name="meal_restrictions" defaultValue="vegetarian" />
          </label>
        </fieldset>
        <fieldset>
          <legend>Club</legend>
          <label>
            Name
            <input name="club_name" defaultValue="Robotics" />
          </label>
          <label>
            Days
            <input name="club_days" defaultValue="Thursday" />
          </label>
          <label>
            Start
            <input name="club_start" type="time" defaultValue="17:00" />
          </label>
          <label>
            End
            <input name="club_end" type="time" defaultValue="19:00" />
          </label>
        </fieldset>
        <fieldset>
          <legend>Workout</legend>
          <label>
            Activity
            <input name="workout_activity" defaultValue="gym" />
          </label>
          <label>
            Days
            <input name="workout_days" defaultValue="Tuesday, Friday" />
          </label>
          <label>
            Duration (minutes)
            <input name="workout_duration" type="number" min={0} defaultValue={45} />
          </label>
          <label>
            Preferred time
            <input name="workout_time" type="time" defaultValue="07:00" />
          </label>
        </fieldset>
        <fieldset>
          <legend>Other constraint</legend>
          <label>
            Label
            <input name="other_label" defaultValue="Study hall" />
          </label>
          <label>
            Days
            <input name="other_days" defaultValue="Sunday" />
          </label>
          <label>
            Notes
            <input name="other_notes" defaultValue="Quiet hours after 22:00" />
          </label>
        </fieldset>
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Optimizing..." : "Optimize schedule"}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {result ? (
        <section>
          <h2>Result</h2>
          <p>{result.note}</p>
          <pre>{JSON.stringify(result.weekly_schedule, null, 2)}</pre>
        </section>
      ) : null}
    </section>
  )
}
