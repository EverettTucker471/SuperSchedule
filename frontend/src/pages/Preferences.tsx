import { FormEvent, useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../lib/supabase"
import type { SchedulingPreferences } from "../lib/types"

const emptyPrefs: Omit<SchedulingPreferences, "user_id"> = {
  sleep_start: "23:00",
  sleep_end: "07:00",
  commute_mode: "walk",
  commute_minutes: 15,
  meal_plan: {
    dining_hall: "",
    preferred_times: ["12:00", "18:00"],
    restrictions: [],
  },
  clubs: [{ name: "", days: [], start_time: "", end_time: "" }],
  workouts: [{ activity: "", days: [], duration_minutes: 45, preferred_time: "" }],
  other_constraints: [{ label: "", days: [], notes: "" }],
}

function splitList(value: FormDataEntryValue | null): string[] {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function joinList(value: string[] | undefined): string {
  return (value || []).join(", ")
}

function asTimeInput(value: string | null | undefined, fallback: string) {
  if (!value) return fallback
  return value.slice(0, 5)
}

export default function Preferences() {
  const { user, configured } = useAuth()
  const [prefs, setPrefs] = useState(emptyPrefs)
  const [status, setStatus] = useState<"idle" | "loading" | "saving">("idle")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (!configured || !user || !supabase) return
    let cancelled = false
    setStatus("loading")
    supabase
      .from("scheduling_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (cancelled) return
        if (loadError) setError(loadError.message)
        else if (data) {
          setPrefs({
            sleep_start: asTimeInput(data.sleep_start, "23:00"),
            sleep_end: asTimeInput(data.sleep_end, "07:00"),
            commute_mode: data.commute_mode || "walk",
            commute_minutes: data.commute_minutes ?? 15,
            meal_plan: {
              dining_hall: data.meal_plan?.dining_hall || "",
              preferred_times: data.meal_plan?.preferred_times || [],
              restrictions: data.meal_plan?.restrictions || [],
            },
            clubs: data.clubs?.length ? data.clubs : emptyPrefs.clubs,
            workouts: data.workouts?.length ? data.workouts : emptyPrefs.workouts,
            other_constraints: data.other_constraints?.length
              ? data.other_constraints
              : emptyPrefs.other_constraints,
          })
        }
        setStatus("idle")
      })
    return () => {
      cancelled = true
    }
  }, [configured, user])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !user) {
      setError("Sign in and configure Supabase before saving.")
      return
    }
    const form = new FormData(event.currentTarget)
    const payload: SchedulingPreferences = {
      user_id: user.id,
      sleep_start: String(form.get("sleep_start") || "") || null,
      sleep_end: String(form.get("sleep_end") || "") || null,
      commute_mode: String(form.get("commute_mode") || "walk"),
      commute_minutes: Number(form.get("commute_minutes") || 0),
      meal_plan: {
        dining_hall: String(form.get("dining_hall") || ""),
        preferred_times: splitList(form.get("meal_times")),
        restrictions: splitList(form.get("meal_restrictions")),
      },
      clubs: String(form.get("club_name") || "").trim()
        ? [
            {
              name: String(form.get("club_name") || ""),
              days: splitList(form.get("club_days")),
              start_time: String(form.get("club_start") || ""),
              end_time: String(form.get("club_end") || ""),
            },
          ]
        : [],
      workouts: String(form.get("workout_activity") || "").trim()
        ? [
            {
              activity: String(form.get("workout_activity") || ""),
              days: splitList(form.get("workout_days")),
              duration_minutes: Number(form.get("workout_duration") || 45),
              preferred_time: String(form.get("workout_time") || ""),
            },
          ]
        : [],
      other_constraints: String(form.get("other_label") || "").trim()
        ? [
            {
              label: String(form.get("other_label") || ""),
              days: splitList(form.get("other_days")),
              notes: String(form.get("other_notes") || ""),
            },
          ]
        : [],
    }
    setStatus("saving")
    setError("")
    setNotice("")
    const { error: saveError } = await supabase.from("scheduling_preferences").upsert(payload)
    if (saveError) {
      setError(saveError.message)
      setStatus("idle")
      return
    }
    setPrefs(payload)
    setNotice("Preferences saved.")
    setStatus("idle")
  }

  const club = prefs.clubs[0]
  const workout = prefs.workouts[0]
  const other = prefs.other_constraints[0]

  return (
    <section>
      <h1>Scheduling preferences</h1>
      <p className="subtitle">
        Scaffold for sleep, commute, meals, clubs, workouts, and other
        constraints. Saved to <code>scheduling_preferences</code> — the
        optimizer is not wired up yet.
      </p>
      <form onSubmit={onSubmit}>
        <fieldset>
          <legend>Sleep window</legend>
          <label>
            Sleep start
            <input name="sleep_start" type="time" defaultValue={asTimeInput(prefs.sleep_start, "23:00")} key={`ss-${prefs.sleep_start}`} />
          </label>
          <label>
            Sleep end
            <input name="sleep_end" type="time" defaultValue={asTimeInput(prefs.sleep_end, "07:00")} key={`se-${prefs.sleep_end}`} />
          </label>
        </fieldset>
        <fieldset>
          <legend>Commute</legend>
          <label>
            Mode
            <input name="commute_mode" defaultValue={prefs.commute_mode} key={`cm-${prefs.commute_mode}`} />
          </label>
          <label>
            Minutes
            <input name="commute_minutes" type="number" min={0} defaultValue={prefs.commute_minutes} key={`cmin-${prefs.commute_minutes}`} />
          </label>
        </fieldset>
        <fieldset>
          <legend>Meal plan</legend>
          <label>
            Dining hall
            <input name="dining_hall" defaultValue={prefs.meal_plan.dining_hall} key={`dh-${prefs.meal_plan.dining_hall}`} />
          </label>
          <label>
            Preferred times (comma-separated)
            <input name="meal_times" defaultValue={joinList(prefs.meal_plan.preferred_times)} key={`mt-${joinList(prefs.meal_plan.preferred_times)}`} />
          </label>
          <label>
            Restrictions
            <input name="meal_restrictions" defaultValue={joinList(prefs.meal_plan.restrictions)} key={`mr-${joinList(prefs.meal_plan.restrictions)}`} />
          </label>
        </fieldset>
        <fieldset>
          <legend>Club</legend>
          <label>
            Name
            <input name="club_name" defaultValue={club?.name || ""} key={`cn-${club?.name}`} />
          </label>
          <label>
            Days
            <input name="club_days" defaultValue={joinList(club?.days)} key={`cd-${joinList(club?.days)}`} />
          </label>
          <label>
            Start
            <input name="club_start" type="time" defaultValue={club?.start_time || ""} key={`cs-${club?.start_time}`} />
          </label>
          <label>
            End
            <input name="club_end" type="time" defaultValue={club?.end_time || ""} key={`ce-${club?.end_time}`} />
          </label>
        </fieldset>
        <fieldset>
          <legend>Workout</legend>
          <label>
            Activity
            <input name="workout_activity" defaultValue={workout?.activity || ""} key={`wa-${workout?.activity}`} />
          </label>
          <label>
            Days
            <input name="workout_days" defaultValue={joinList(workout?.days)} key={`wd-${joinList(workout?.days)}`} />
          </label>
          <label>
            Duration (minutes)
            <input name="workout_duration" type="number" min={0} defaultValue={workout?.duration_minutes ?? 45} key={`wdu-${workout?.duration_minutes}`} />
          </label>
          <label>
            Preferred time
            <input name="workout_time" type="time" defaultValue={workout?.preferred_time || ""} key={`wt-${workout?.preferred_time}`} />
          </label>
        </fieldset>
        <fieldset>
          <legend>Other constraints</legend>
          <label>
            Label
            <input name="other_label" defaultValue={other?.label || ""} key={`ol-${other?.label}`} />
          </label>
          <label>
            Days
            <input name="other_days" defaultValue={joinList(other?.days)} key={`od-${joinList(other?.days)}`} />
          </label>
          <label>
            Notes
            <textarea name="other_notes" rows={3} defaultValue={other?.notes || ""} key={`on-${other?.notes}`} />
          </label>
        </fieldset>
        <button type="submit" disabled={!configured || !user || status === "saving"}>
          {status === "saving" ? "Saving..." : "Save preferences"}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {notice ? <p className="notice">{notice}</p> : null}
    </section>
  )
}
