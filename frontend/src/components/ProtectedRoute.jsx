import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './ui'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="p-8"><Spinner label="Checking your session…" /></div>
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return children
}
