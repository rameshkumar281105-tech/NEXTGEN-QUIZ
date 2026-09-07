import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signUp: (email: string, password: string, extra: { name: string; mobile: string; address: string }) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(data as Profile | null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) fetchProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  const signUp: AuthContextValue['signUp'] = async (email, password, extra) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: extra.name } },
    })
    if (error) return { error: error.message }

    // Profile is also auto-created by a DB trigger (see schema.sql).
    // We upsert here too so mobile/address are captured even if the
    // trigger only sets name/email, and to be resilient if email
    // confirmation delays the trigger's effect.
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: extra.name,
        email,
        mobile: extra.mobile || null,
        address: extra.address || null,
      })
    }
    return { error: null }
  }

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const requestPasswordReset: AuthContextValue['requestPasswordReset'] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error ? error.message : null }
  }

  const updatePassword: AuthContextValue['updatePassword'] = async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error ? error.message : null }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, refreshProfile, signUp, signIn, signOut, requestPasswordReset, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
