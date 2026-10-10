import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { money } from '../utils/format'

export default function PriceChart({ points, currency }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Line chart of daily closing prices">
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={40} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={60} />
          <Tooltip formatter={(v) => [money(v, currency), 'Daily close']} />
          <Legend />
          <Line type="monotone" dataKey="close" name="Daily closing price" stroke="#1d4ed8" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
