import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { validateAuth } from '../utils/validation'
import { ErrorBox, Field, Logo } from '../components/ui'

function Shell({ title, children }) {
  const { configured } = useAuth()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4">
      <div className="mb-4"><Logo /></div>
      <div className="card w-full max-w-md"><h1 className="mb-4 text-xl font-bold text-navy-900">{title}</h1>
        {!configured && <div className="mb-3"><ErrorBox message="Supabase is not configured. Copy frontend/.env.example to frontend/.env and add your project URL and public key (see docs/SETUP.md)." /></div>}
        {children}</div>
    </div>)
}
const useForm = (init) => { const [v, set] = useState(init); return [v, (k) => (e) => set({ ...v, [k]: e.target.value })] }

export function Login() {
  const { signIn, session } = useAuth(); const nav = useNavigate(); const loc = useLocation()
  const [v, on] = useForm({ email: '', password: '' }); const [errs, setErrs] = useState({}); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false)
  if (session) return <Navigate to={loc.state?.from || '/app'} replace />
  async function submit(e) {
    e.preventDefault(); const val = validateAuth(v, 'login'); setErrs(val); setMsg(null); if (Object.keys(val).length) return
    setBusy(true); const { error } = await signIn(v.email.trim(), v.password); setBusy(false)
    if (error) setMsg(/confirm/i.test(error.message) ? 'Please verify your email first: open the confirmation link sent to your inbox, then log in.' : error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message)
    else nav(loc.state?.from || '/app', { replace: true })
  }
  return (<Shell title="Log in"><form onSubmit={submit} className="space-y-3" noValidate>
    {msg && <ErrorBox message={msg} />}
    <Field id="email" label="Email" error={errs.email}><input id="email" type="email" autoComplete="email" className="input" value={v.email} onChange={on('email')} /></Field>
    <Field id="password" label="Password" error={errs.password}><input id="password" type="password" autoComplete="current-password" className="input" value={v.password} onChange={on('password')} /></Field>
    <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
    <p className="text-sm"><Link className="text-blue-700 underline" to="/forgot-password">Forgot password?</Link> · <Link className="text-blue-700 underline" to="/register">Create account</Link></p></form></Shell>)
}

export function Register() {
  const { signUp } = useAuth()
  const [v, on] = useForm({ displayName: '', email: '', password: '', confirm: '' }); const [errs, setErrs] = useState({}); const [msg, setMsg] = useState(null); const [done, setDone] = useState(null); const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); const val = validateAuth(v, 'register'); setErrs(val); setMsg(null); if (Object.keys(val).length) return
    setBusy(true); const r = await signUp(v.email.trim(), v.password, v.displayName.trim()); setBusy(false)
    if (r.error) setMsg(r.error.message); else setDone(r.needsVerification ? 'verify' : 'ok')
  }
  if (done === 'verify') return <Shell title="Check your email"><p className="text-sm">We sent a verification link to <strong>{v.email}</strong>. Open it to confirm your account, then <Link className="text-blue-700 underline" to="/login">log in</Link>.</p></Shell>
  if (done === 'ok') return <Navigate to="/app" replace />
  return (<Shell title="Create your account"><form onSubmit={submit} className="space-y-3" noValidate>
    {msg && <ErrorBox message={msg} />}
    <Field id="dn" label="Display name" error={errs.displayName}><input id="dn" className="input" value={v.displayName} onChange={on('displayName')} /></Field>
    <Field id="email" label="Email" error={errs.email}><input id="email" type="email" autoComplete="email" className="input" value={v.email} onChange={on('email')} /></Field>
    <Field id="password" label="Password (min 8 characters)" error={errs.password}><input id="password" type="password" autoComplete="new-password" className="input" value={v.password} onChange={on('password')} /></Field>
    <Field id="confirm" label="Confirm password" error={errs.confirm}><input id="confirm" type="password" autoComplete="new-password" className="input" value={v.confirm} onChange={on('confirm')} /></Field>
    <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
    <p className="text-sm">Already registered? <Link className="text-blue-700 underline" to="/login">Log in</Link></p></form></Shell>)
}

export function ForgotPassword() {
  const { requestReset } = useAuth(); const [email, setEmail] = useState(''); const [msg, setMsg] = useState(null); const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); if (Object.keys(validateAuth({ email }, 'reset-request')).length) { setMsg('Enter a valid email address.'); return }
    setBusy(true); const { error } = await requestReset(email.trim()); setBusy(false); if (error) setMsg(error.message); else { setSent(true); setMsg(null) }
  }
  return (<Shell title="Reset password">{sent ? <p className="text-sm">If an account exists for that email, a reset link has been sent. Open it to choose a new password.</p> :
    <form onSubmit={submit} className="space-y-3" noValidate>{msg && <ErrorBox message={msg} />}
      <Field id="email" label="Email"><input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button></form>}</Shell>)
}

export function ResetPassword() {
  const { updatePassword, session, loading } = useAuth(); const nav = useNavigate()
  const [p, setP] = useState(''); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); if (p.length < 8) { setMsg('Password must be at least 8 characters.'); return }
    setBusy(true); const { error } = await updatePassword(p); setBusy(false); if (error) setMsg(error.message); else nav('/app', { replace: true })
  }
  return (<Shell title="Choose a new password">
    {!loading && !session ? <ErrorBox message="This reset link is invalid or expired. Request a new one from the Forgot password page." /> :
      <form onSubmit={submit} className="space-y-3" noValidate>{msg && <ErrorBox message={msg} />}
        <Field id="np" label="New password"><input id="np" type="password" autoComplete="new-password" className="input" value={p} onChange={(e) => setP(e.target.value)} /></Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button></form>}</Shell>)
}
