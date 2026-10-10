import { Link } from 'react-router-dom'
import { Activity, Briefcase, Calculator, FileText, HeartPulse, TrendingUp } from 'lucide-react'
import { Disclaimer, Logo } from '../components/ui'

const FEATURES = [
  [Activity, 'Statistical Risk Analysis', 'Annualised volatility and maximum drawdown computed from daily closing prices.'],
  [TrendingUp, 'Historical Performance', 'Interactive price charts and 1-month, 3-month and 1-year returns.'],
  [HeartPulse, 'Financial Health Indicators', 'P/E, margins and growth shown only when the data provider supplies them.'],
  [FileText, 'Transparent Risk Reports', 'Plain-English reports built from real calculations, with every limitation listed.'],
  [Calculator, 'Investment Scenario Simulator', 'Explore hypothetical outcomes, such as a 15% price decline, without predicting anything.'],
  [Briefcase, 'Personal Watchlist and Portfolio', 'Save stocks and record holdings, stored privately in your account.'],
]
const STEPS = ['Search for a stock.', 'Analyse its historical performance.', 'Review risk metrics and financial indicators.', 'Explore hypothetical investment outcomes.', 'Save the stock for further monitoring.']

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-navy-900"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 p-4">
        <Logo light />
        <nav className="flex flex-wrap items-center gap-4 text-sm text-slate-200" aria-label="Public">
          <a href="#features" className="hover:text-white">Features</a><a href="#how" className="hover:text-white">How It Works</a><a href="#about" className="hover:text-white">About</a>
          <Link to="/login" className="hover:text-white">Login</Link><Link to="/register" className="btn-primary">Create Account</Link></nav></div></header>
      <section className="bg-navy-900 pb-16 pt-10 text-white"><div className="mx-auto max-w-6xl px-4">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">Understand the Risk Before You Invest.</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-200">Explore historical stock performance, evaluate volatility, examine financial indicators, and make more informed investment decisions.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link to="/app/analysis" className="btn-primary">Explore Stock Analysis</Link><Link to="/register" className="btn bg-white text-navy-900 hover:bg-slate-100">Create Free Account</Link></div></div></section>
      <section id="features" className="mx-auto max-w-6xl px-4 py-12"><h2 className="mb-6 text-2xl font-bold text-navy-900">Features</h2>
        <div className="grid gap-4 md:grid-cols-3">{FEATURES.map(([Icon, t, d]) => <div key={t} className="card"><Icon className="mb-2 h-6 w-6 text-blue-700" /><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p></div>)}</div></section>
      <section id="how" className="bg-white py-12"><div className="mx-auto max-w-6xl px-4"><h2 className="mb-6 text-2xl font-bold text-navy-900">How It Works</h2>
        <ol className="grid gap-4 md:grid-cols-5">{STEPS.map((s, i) => <li key={s} className="rounded-xl border border-slate-200 p-4"><span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">{i + 1}</span><p className="text-sm"><strong>Step {i + 1}:</strong> {s}</p></li>)}</ol></div></section>
      <section id="about" className="mx-auto max-w-6xl space-y-4 px-4 py-12"><h2 className="text-2xl font-bold text-navy-900">About</h2>
        <p className="max-w-3xl text-slate-700">StockShield is an educational risk-assessment project. It uses standard formulas (returns, standard deviation of daily returns, maximum drawdown) and fixed rules, not a prediction model or a generative AI service. A "Historical Risk Profile" describes what happened in the past data, nothing more.</p>
        <Disclaimer /></section>
      <footer className="border-t bg-white py-4 text-center text-xs text-slate-500">StockShield — educational project. Not financial advice.</footer>
    </div>
  )
}
