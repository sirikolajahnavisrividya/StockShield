import { Link, useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { api } from '../services/api'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../components/Toast'
import ReportView from '../components/ReportView'
import { Empty, ErrorBox, Skeleton } from '../components/ui'
import { dateTime } from '../utils/format'

export function Reports() {
  const list = useAsync(() => api.listReports(), []); const toast = useToast()
  async function del(id) {
    if (!window.confirm('Delete this saved report?')) return
    try { await api.deleteReport(id); toast('Report deleted'); list.reload() } catch (e) { toast(e.message, 'error') }
  }
  return (<div className="space-y-4"><h1 className="text-2xl font-bold text-navy-900">Risk Reports</h1>
    {list.loading ? <Skeleton /> : list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : !list.data.length ?
      <Empty title="No saved reports">Open <Link className="text-blue-700 underline" to="/app/analysis">Stock Analysis</Link>, pick a stock and choose "Save report".</Empty> :
      <div className="card divide-y">{list.data.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
          <Link to={`/app/reports/${r.id}`} className="text-blue-700"><span className="font-semibold">{r.symbol}</span> {r.company_name && r.company_name !== r.symbol ? `· ${r.company_name}` : ''} · {r.analysis_period}</Link>
          <span className="flex items-center gap-3 text-sm text-slate-500">{dateTime(r.created_at)}<button className="btn-danger" aria-label={`Delete report for ${r.symbol}`} onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></button></span></div>))}</div>}</div>)
}

export function ReportDetail() {
  const { id } = useParams(); const nav = useNavigate()
  const rep = useAsync(() => api.getReport(id), [id])
  return (<div className="space-y-4"><button className="btn-secondary no-print" onClick={() => nav('/app/reports')}>← All reports</button>
    {rep.loading ? <Skeleton h="h-64" /> : rep.error ? <ErrorBox message={rep.error} onRetry={rep.reload} /> : <ReportView r={rep.data.report_data} />}</div>)
}
