import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import Landing from './pages/Landing'
import { ForgotPassword, Login, Register, ResetPassword } from './pages/AuthPages'
import Overview from './pages/Overview'
import StockAnalysis from './pages/StockAnalysis'
import { ReportDetail, Reports } from './pages/Reports'
import Watchlist from './pages/Watchlist'
import Portfolio from './pages/Portfolio'
import { Profile, SettingsPage } from './pages/Account'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Overview />} />
        <Route path="analysis" element={<StockAnalysis />} />
        <Route path="analysis/:symbol" element={<StockAnalysis />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/:id" element={<ReportDetail />} />
        <Route path="watchlist" element={<Watchlist />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
