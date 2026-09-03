export type CalendarEventRow = {
  id: string
  user_id: string
  google_event_id: string
  title: string
  description: string | null
  location: string | null
  start_at: string | null
  end_at: string | null
  all_day: boolean
  raw: unknown
  imported_at: string
}

export type MealPlan = {
  dining_hall: string
  preferred_times: string[]
  restrictions: string[]
}

export type ClubPref = {
  name: string
  days: string[]
  start_time: string
  end_time: string
}

export type WorkoutPref = {
  activity: string
  days: string[]
  duration_minutes: number
  preferred_time: string
}

export type OtherConstraintPref = {
  label: string
  days: string[]
  notes: string
}

export type SchedulingPreferences = {
  user_id: string
  sleep_start: string | null
  sleep_end: string | null
  commute_mode: string
  commute_minutes: number
  meal_plan: MealPlan
  clubs: ClubPref[]
  workouts: WorkoutPref[]
  other_constraints: OtherConstraintPref[]
  updated_at?: string
}

export type GoogleCalendarEvent = {
  id?: string
  summary?: string
  description?: string
  location?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
}
