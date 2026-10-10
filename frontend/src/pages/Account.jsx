import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { ErrorBox, Field } from '../components/ui'

export function Profile() {
  const { user } = useAuth(); const toast = useToast()
  const [name, setName] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(null)
  useEffect(() => { supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle().then(({ data }) => setName(data?.display_name || user.user_metadata?.display_name || '')) }, [user])
  async function save(e) {
    e.preventDefault(); if (!name.trim() || name.length > 60) return setErr('Display name is required (max 60 characters).')
    setBusy(true); setErr(null)
    const { error } = await supabase.from('profiles').upsert({ id: user.id, display_name: name.trim() })
    setBusy(false); if (error) setErr(error.message); else toast('Profile updated')
  }
  return (<div className="space-y-4"><h1 className="text-2xl font-bold text-navy-900">Profile</h1>
    <form onSubmit={save} className="card max-w-md space-y-3" noValidate>{err && <ErrorBox message={err} />}
      <Field id="pf-name" label="Display name"><input id="pf-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field id="pf-mail" label="Email"><input id="pf-mail" className="input bg-slate-100" value={user.email} readOnly /></Field>
      <p className="text-sm text-slate-600">Account created: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Data unavailable'}</p>
      <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></form></div>)
}

export function SettingsPage() {
  const { updatePassword } = useAuth(); const toast = useToast()
  const [pw, setPw] = useState(''); const [err, setErr] = useState(null)
  const [period, setPeriod] = useState(localStorage.getItem('stockshield_default_period') || '1y')
  async function change(e) {
    e.preventDefault(); if (pw.length < 8) return setErr('Password must be at least 8 characters.')
    const { error } = await updatePassword(pw); if (error) setErr(error.message); else { setErr(null); setPw(''); toast('Password updated') }
  }
  return (<div className="space-y-4"><h1 className="text-2xl font-bold text-navy-900">Settings</h1>
    <section className="card max-w-md space-y-3"><h2 className="font-semibold">Default analysis period</h2>
      <label htmlFor="dp" className="sr-only">Default period</label>
      <select id="dp" className="input" value={period} onChange={(e) => { setPeriod(e.target.value); localStorage.setItem('stockshield_default_period', e.target.value); toast('Default period saved') }}>
        {['1m', '3m', '6m', '1y', '5y'].map((p) => <option key={p} value={p}>{p}</option>)}</select>
      <p className="text-xs text-slate-500">Stored in this browser only (not sensitive).</p></section>
    <form onSubmit={change} className="card max-w-md space-y-3" noValidate><h2 className="font-semibold">Change password</h2>{err && <ErrorBox message={err} />}
      <Field id="npw" label="New password (min 8 characters)"><input id="npw" type="password" autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
      <button className="btn-primary">Update password</button></form></div>)
}
