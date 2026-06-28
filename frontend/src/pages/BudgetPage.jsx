import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Target, AlertTriangle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { budgetAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, EXPENSE_CATEGORIES, getCurrentMonthYear } from '../utils/formatters'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'

const { month: currentMonth, year: currentYear } = getCurrentMonthYear()

export default function BudgetPage() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear)
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState({ category: 'Food & Dining', amount: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const currency = user?.currency || 'USD'

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await budgetAPI.getAll({ month, year })
      setBudgets(res.data.budgets)
    } catch { toast.error('Failed to load budgets') }
    finally { setLoading(false) }
  }, [month, year])

  useEffect(() => { fetchBudgets() }, [fetchBudgets])

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await budgetAPI.create({ ...form, month, year })
      toast.success('Budget saved')
      setShowModal(false)
      setForm({ category: 'Food & Dining', amount: '' })
      fetchBudgets()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await budgetAPI.delete(deleteTarget.id); toast.success('Budget deleted'); setDeleteTarget(null); fetchBudgets() }
    catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0)
  const overBudget = budgets.filter(b => (b.spent || 0) > b.amount)

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Budget</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your monthly spending limits</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input py-2 text-sm w-36">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input py-2 text-sm w-24">
            {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Budget
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent">
          <p className="text-xs text-gray-400 mb-1">Total Budget</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalBudget, currency)}</p>
        </div>
        <div className="card border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent">
          <p className="text-xs text-gray-400 mb-1">Total Spent</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalSpent, currency)}</p>
        </div>
        <div className="card border-brand-green/20 bg-gradient-to-br from-brand-green/10 to-transparent">
          <p className="text-xs text-gray-400 mb-1">Remaining</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalBudget - totalSpent, currency)}</p>
        </div>
        <div className={`card ${overBudget.length > 0 ? 'border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent' : 'border-brand-green/20 bg-gradient-to-br from-brand-green/10 to-transparent'}`}>
          <p className="text-xs text-gray-400 mb-1">Over Budget</p>
          <p className="text-xl font-bold text-white">{overBudget.length} categories</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length:4}).map((_,i) => <div key={i} className="card h-36 shimmer" />)}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState icon={Target} title="No budgets for this month"
          description="Set spending limits to stay on track with your finances"
          action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Create Budget</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b, i) => {
            const pct = Math.min(((b.spent || 0) / b.amount) * 100, 100)
            const over = (b.spent || 0) > b.amount
            const warning = pct > 75 && !over
            return (
              <motion.div key={b.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`card relative ${over ? 'border-red-500/30' : warning ? 'border-yellow-500/20' : 'border-white/5'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-white">{b.category}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{MONTHS[month - 1]} {year}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {over ? <AlertTriangle size={16} className="text-red-400" /> : <CheckCircle size={16} className="text-brand-green" />}
                    <button onClick={() => setDeleteTarget(b)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors ml-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{formatCurrency(b.spent || 0, currency)} spent</span>
                    <span className={over ? 'text-red-400 font-semibold' : 'text-gray-400'}>
                      {over ? `${formatCurrency((b.spent || 0) - b.amount, currency)} over` : `${formatCurrency(b.amount - (b.spent || 0), currency)} left`}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.05 + 0.2 }}
                      className={`h-full rounded-full ${over ? 'bg-red-500' : warning ? 'bg-yellow-500' : 'bg-brand-green'}`}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{pct.toFixed(0)}% used</span>
                  <span className="text-sm font-semibold text-white">/{formatCurrency(b.amount, currency)}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Budget">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input">
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Monthly Budget Limit ({currency})</label>
            <input type="number" step="0.01" min="1" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input" placeholder="500.00" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Set Budget'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Budget" message={`Remove budget for "${deleteTarget?.category}"?`} loading={deleting} />
    </div>
  )
}
