import { useState, useEffect } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler } from 'chart.js'
import { BarChart3, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { dashboardAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, getCategoryColor, getCurrentMonthYear } from '../utils/formatters'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler)

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function ReportsPage() {
  const { user } = useAuth()
  const { month: cm, year: cy } = getCurrentMonthYear()
  const [month, setMonth] = useState(cm)
  const [year, setYear] = useState(cy)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const currency = user?.currency || 'USD'

  useEffect(() => {
    setLoading(true)
    dashboardAPI.getMonthlyReport(year, month)
      .then(res => setReport(res.data))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false))
  }, [month, year])

  const chartDefaults = { plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } } } }

  const barData = report ? {
    labels: report.byCategory.map(c => c.category),
    datasets: [{
      label: 'Spent',
      data: report.byCategory.map(c => c.total),
      backgroundColor: report.byCategory.map(c => getCategoryColor(c.category) + 'cc'),
      borderRadius: 8,
    }]
  } : null

  const pieData = report ? {
    labels: report.byCategory.map(c => c.category),
    datasets: [{
      data: report.byCategory.map(c => c.total),
      backgroundColor: report.byCategory.map(c => getCategoryColor(c.category) + 'cc'),
      borderColor: report.byCategory.map(c => getCategoryColor(c.category)),
      borderWidth: 1,
    }]
  } : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Monthly Report</h1>
          <p className="text-gray-400 text-sm mt-1">Detailed financial breakdown</p>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input py-2 text-sm w-36">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input py-2 text-sm w-24">
            {[cy - 1, cy, cy + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({length:3}).map((_,i) => <div key={i} className="card h-28 shimmer" />)}
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card border-brand-green/20 bg-gradient-to-br from-brand-green/10 to-transparent">
              <p className="text-xs text-gray-400 mb-1">Income</p>
              <p className="text-xl font-bold text-white">{formatCurrency(report.summary.totalIncome, currency)}</p>
            </div>
            <div className="card border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent">
              <p className="text-xs text-gray-400 mb-1">Expenses</p>
              <p className="text-xl font-bold text-white">{formatCurrency(report.summary.totalExpenses, currency)}</p>
            </div>
            <div className={`card ${report.summary.savings >= 0 ? 'border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent' : 'border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent'}`}>
              <p className="text-xs text-gray-400 mb-1">Savings</p>
              <p className="text-xl font-bold text-white">{formatCurrency(report.summary.savings, currency)}</p>
            </div>
          </div>

          {report.byCategory.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="font-semibold text-white mb-4">Spending by Category</h2>
                <div className="h-64">
                  <Bar data={barData} options={{ ...chartDefaults, maintainAspectRatio: false, scales: { x: { ticks: { color: '#64748b' }, grid: { display: false } }, y: { ticks: { color: '#64748b', callback: v => `${v}` }, grid: { color: 'rgba(255,255,255,0.05)' } } } }} />
                </div>
              </div>
              <div className="card">
                <h2 className="font-semibold text-white mb-4">Category Distribution</h2>
                <div className="h-52">
                  <Doughnut data={pieData} options={{ ...chartDefaults, maintainAspectRatio: false, cutout: '60%' }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="w-12 h-12 text-gray-600 mb-4" />
              <p className="text-gray-400">No expense data for {MONTHS[month-1]} {year}</p>
            </div>
          )}

          {report.byCategory.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-white mb-4">Category Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs text-gray-500 font-medium py-3">CATEGORY</th>
                      <th className="text-right text-xs text-gray-500 font-medium py-3">TRANSACTIONS</th>
                      <th className="text-right text-xs text-gray-500 font-medium py-3">AMOUNT</th>
                      <th className="text-right text-xs text-gray-500 font-medium py-3">% OF TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byCategory.map(c => (
                      <tr key={c.category} className="border-b border-white/3">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: getCategoryColor(c.category) }} />
                            <span className="text-sm text-white">{c.category}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right text-sm text-gray-400">{c.count}</td>
                        <td className="py-3 text-right text-sm font-medium text-white">{formatCurrency(c.total, currency)}</td>
                        <td className="py-3 text-right text-sm text-gray-400">{c.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-12 text-gray-400">Failed to load report data</div>
      )}
    </div>
  )
}
