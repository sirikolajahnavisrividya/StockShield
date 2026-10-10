import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const need = () => ({ error: new Error('Supabase is not configured. Copy frontend/.env.example to .env and fill it in.') })
  const value = {
    session, user: session?.user ?? null, loading, configured: !!supabase,
    async signUp(email, password, displayName) {
      if (!supabase) return need()
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName }, emailRedirectTo: `${window.location.origin}/login` } })
      if (error) return { error }
      // With email confirmation on, Supabase returns an empty identities list for an already-registered email
      if (data.user && data.user.identities && data.user.identities.length === 0) return { error: new Error('An account with this email already exists. Try logging in or resetting your password.') }
      return { error: null, needsVerification: !data.session }
    },
    async signIn(email, password) { if (!supabase) return need(); const { error } = await supabase.auth.signInWithPassword({ email, password }); return { error } },
    async signOut() { if (supabase) await supabase.auth.signOut() },
    async requestReset(email) { if (!supabase) return need(); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); return { error } },
    async updatePassword(password) { if (!supabase) return need(); const { error } = await supabase.auth.updateUser({ password }); return { error } },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
