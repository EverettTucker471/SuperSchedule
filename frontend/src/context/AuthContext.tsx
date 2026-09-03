import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import { isSupabaseConfigured, supabase } from "../lib/supabase"
import {
  CALENDAR_SCOPE,
  clearProviderToken,
  rememberProviderToken,
} from "../lib/calendar"

type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
  configured: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function upsertProfile(user: User) {
  if (!supabase) return
  const meta = user.user_metadata || {}
  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: meta.full_name || meta.name || null,
    avatar_url: meta.avatar_url || meta.picture || null,
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      rememberProviderToken(data.session?.provider_token)
      if (data.session?.user) void upsertProfile(data.session.user)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      rememberProviderToken(next?.provider_token)
      if (next?.user) void upsertProfile(next.user)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      configured: isSupabaseConfigured,
      signInWithGoogle: async () => {
        if (!supabase) throw new Error("Supabase is not configured. Copy frontend/.env.example to frontend/.env.")
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
            scopes: `email profile ${CALENDAR_SCOPE}`,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        })
        if (error) throw error
      },
      signOut: async () => {
        clearProviderToken()
        if (supabase) await supabase.auth.signOut()
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
