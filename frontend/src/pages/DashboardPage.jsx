import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Doughnut, Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, Filler
} from 'chart.js'
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, Receipt, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatShortDate, getCategoryColor, getCurrentMonthYear } from '../utils/formatters'
import StatCard from '../components/common/StatCard'
import { SkeletonDashboard } from '../components/common/Skeleton'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler)

const CHART_DEFAULTS = {
  plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } } },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { month, year } = getCurrentMonthYear()

  useEffect(() => {
    dashboardAPI.get({ month, year })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SkeletonDashboard />

  const currency = user?.currency || 'USD'
  const { summary = {}, expensesByCategory = [], monthlyTrend = [], recentExpenses = [], budgets = [] } = data || {}

  const pieData = {
    labels: expensesByCategory.map(e => e.category),
    datasets: [{
      data: expensesByCategory.map(e => e.total),
      backgroundColor: expensesByCategory.map(e => getCategoryColor(e.category) + 'cc'),
      borderColor: expensesByCategory.map(e => getCategoryColor(e.category)),
      borderWidth: 1,
    }],
  }

  const trendLabels = monthlyTrend.map(m => new Date(m.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
  const lineData = {
    labels: trendLabels,
    datasets: [{
      label: 'Monthly Expenses',
      data: monthlyTrend.map(m => m.total),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.08)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#10b981',
      pointRadius: 4,
    }],
  }

  const budgetCategories = budgets.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Here's your financial overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={formatCurrency(summary.totalIncome, currency)} icon={TrendingUp} color="green" delay={0} trendLabel="This month" />
        <StatCard title="Total Expenses" value={formatCurrency(summary.totalExpenses, currency)} icon={TrendingDown} color="red" delay={0.05} trendLabel="This month" />
        <StatCard title="Net Savings" value={formatCurrency(summary.savings, currency)} icon={PiggyBank} color={summary.savings >= 0 ? 'blue' : 'red'} delay={0.1} trendLabel={`${summary.savingsRate}% rate`} />
        <StatCard title="Transactions" value={recentExpenses.length + '+'} icon={Receipt} color="purple" delay={0.15} trendLabel="Recent activity" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Breakdown Pie */}
        <div className="card lg:col-span-1">
          <h2 className="font-semibold text-white mb-4">Expense Breakdown</h2>
          {expensesByCategory.length > 0 ? (
            <>
              <div className="h-48">
                <Doughnut data={pieData} options={{ ...CHART_DEFAULTS, maintainAspectRatio: false, cutout: '65%' }} />
              </div>
              <div className="mt-4 space-y-2">
                {expensesByCategory.slice(0, 5).map(e => (
                  <div key={e.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: getCategoryColor(e.category) }} />
                      <span className="text-gray-400 truncate max-w-[120px]">{e.category}</span>
                    </div>
                    <span className="text-white font-medium">{formatCurrency(e.total, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-gray-500 text-sm">No expenses this month</p>
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-white mb-4">Spending Trend</h2>
          <div className="h-64">
            {monthlyTrend.length > 0 ? (
              <Line data={lineData} options={{
                ...CHART_DEFAULTS,
                maintainAspectRatio: false,
                scales: {
                  x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
                  y: { ticks: { color: '#64748b', font: { size: 11 }, callback: v => `${currency === 'USD' ? '$' : ''}${v}` }, grid: { color: 'rgba(255,255,255,0.05)' } },
                },
              }} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-sm">No trend data available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Expenses</h2>
            <Link to="/expenses" className="text-brand-green text-sm hover:text-brand-green-light flex items-center gap-1 transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {recentExpenses.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                    style={{ background: getCategoryColor(e.category) + '22', color: getCategoryColor(e.category) }}>
                    {e.category[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{e.title}</p>
                    <p className="text-xs text-gray-500">{e.category} · {formatShortDate(e.date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-400 shrink-0">-{formatCurrency(e.amount, currency)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">No recent expenses</p>
              <Link to="/expenses" className="text-brand-green text-sm mt-2 inline-block hover:underline">Add your first expense</Link>
            </div>
          )}
        </div>

        {/* Budget Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Budget Progress</h2>
            <Link to="/budget" className="text-brand-green text-sm hover:text-brand-green-light flex items-center gap-1 transition-colors">
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          {budgetCategories.length > 0 ? (
            <div className="space-y-4">
              {budgetCategories.map(b => {
                const spent = expensesByCategory.find(e => e.category === b.category)?.total || 0
                const pct = Math.min((spent / b.amount) * 100, 100)
                const over = spent > b.amount
                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-300 font-medium">{b.category}</span>
                      <span className={over ? 'text-red-400' : 'text-gray-400'}>
                        {formatCurrency(spent, currency)} / {formatCurrency(b.amount, currency)}
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-full rounded-full ${over ? 'bg-red-500' : pct > 75 ? 'bg-yellow-500' : 'bg-brand-green'}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">No budgets set</p>
              <Link to="/budget" className="text-brand-green text-sm mt-2 inline-block hover:underline">Create a budget</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
