import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
Activity,
BarChart3,
Briefcase,
FileText,
LayoutDashboard,
LogOut,
Menu,
Settings as SettingsIcon,
Star,
User,
X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { api } from '../services/api'
import { DemoBanner, Disclaimer, Logo } from '../components/ui'

const NAV = [
['/app', 'Overview', LayoutDashboard, true],
['/app/analysis', 'Stock Analysis', BarChart3],
['/app/reports', 'Risk Reports', FileText],
['/app/watchlist', 'Watchlist', Star],
['/app/portfolio', 'My Portfolio', Briefcase],
['/app/profile', 'Profile', User],
['/app/settings', 'Settings', SettingsIcon],
]

export default function AppLayout() {
const [open, setOpen] = useState(false)
const { signOut } = useAuth()
const nav = useNavigate()
const health = useAsync(() => api.health(), [])

const links = ( <nav className="space-y-1.5" aria-label="Main">
{NAV.map(([to, label, Icon, end]) => (
<NavLink
key={to}
to={to}
end={end}
onClick={() => setOpen(false)}
className={({ isActive }) =>
`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-[#dcebe1] text-[#174c3c] shadow-sm'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`
}
> <Icon className="h-[18px] w-[18px] shrink-0" />
{label} </NavLink>
))}


  <div className="my-4 border-t border-white/10" />

  <button
    onClick={async () => {
      await signOut()
      nav('/')
    }}
    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-200"
  >
    <LogOut className="h-[18px] w-[18px]" />
    Logout
  </button>
</nav>


)

return ( <div className="min-h-screen bg-[#f5f6f3] md:flex"> <aside className="hidden w-[250px] shrink-0 flex-col border-r border-white/10 bg-[#173b30] p-5 md:flex"> <div className="mb-9 border-b border-white/10 pb-6"> <Logo light /> <p className="mt-3 pl-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/60">
Understand the risk </p> <p className="mt-1 pl-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/60">
Before you invest </p> </div>


    <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100/50">
      Workspace
    </p>

    {links}

    <div className="mt-auto pt-8">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-100">
          <Activity className="h-4 w-4" />
          Risk-aware investing
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-300/70">
          Review market information and understand potential risks before making investment decisions.
        </p>
      </div>
    </div>
  </aside>

  <div className="min-w-0 flex-1">
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e3e7e1] bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <Logo />
      <button
        className="rounded-lg p-2 text-[#174c3c] transition hover:bg-[#edf3ee]"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>

    {open && (
      <div className="relative z-20 border-b border-white/10 bg-[#173b30] p-4 md:hidden">
        {links}
      </div>
    )}

    <main className="mx-auto min-w-0 max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      {health.data?.demo && <DemoBanner />}

      {health.data && !health.data.market_data_configured && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
          role="alert"
        >
          Market data is not configured. Set{' '}
          <code>MARKET_DATA_API_KEY</code> in <code>backend/.env</code>{' '}
          and restart the backend.
        </div>
      )}

      {health.error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {health.error}
        </div>
      )}

      <Outlet />

      <Disclaimer />
    </main>
  </div>
</div>

)
}
