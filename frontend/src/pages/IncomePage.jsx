import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Pencil, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { incomeAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate, INCOME_CATEGORIES } from '../utils/formatters'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import { SkeletonTable } from '../components/common/Skeleton'

const BLANK = { title: '', amount: '', category: 'Salary', date: new Date().toISOString().split('T')[0], notes: '' }

export default function IncomePage() {
  const { user } = useAuth()
  const [incomes, setIncomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const currency = user?.currency || 'USD'

  const fetchIncomes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await incomeAPI.getAll({ limit: 50 })
      setIncomes(res.data.incomes)
    } catch { toast.error('Failed to load income') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchIncomes() }, [fetchIncomes])

  const openAdd = () => { setForm(BLANK); setEditing(null); setShowModal(true) }
  const openEdit = (i) => {
    setForm({ title: i.title, amount: i.amount, category: i.category, date: i.date.split('T')[0], notes: i.notes || '' })
    setEditing(i); setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editing) { await incomeAPI.update(editing.id, form); toast.success('Income updated') }
      else { await incomeAPI.create(form); toast.success('Income added') }
      setShowModal(false); fetchIncomes()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await incomeAPI.delete(deleteTarget.id); toast.success('Income deleted'); setDeleteTarget(null); fetchIncomes() }
    catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const CATEGORY_COLORS = { Salary: '#10b981', Freelance: '#3b82f6', Investment: '#8b5cf6', Business: '#f59e0b', Rental: '#06b6d4', Gift: '#ec4899', Other: '#64748b' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Income</h1>
          <p className="text-gray-400 text-sm mt-1">{incomes.length} income records</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Income</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card border-brand-green/20 bg-gradient-to-br from-brand-green/10 to-transparent">
          <p className="text-sm text-gray-400 mb-2">Total Income</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalIncome, currency)}</p>
        </div>
        <div className="card border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent">
          <p className="text-sm text-gray-400 mb-2">Records</p>
          <p className="text-2xl font-bold text-white">{incomes.length}</p>
        </div>
      </div>

      {loading ? <SkeletonTable rows={5} /> : incomes.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No income records" description="Track your income to see your full financial picture"
          action={<button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Income</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs text-gray-500 font-medium px-6 py-4">INCOME</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-4 hidden sm:table-cell">CATEGORY</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-4 hidden md:table-cell">DATE</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-6 py-4">AMOUNT</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-6 py-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((item, i) => (
                  <motion.tr key={item.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-white/3 hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                          style={{ background: (CATEGORY_COLORS[item.category] || '#64748b') + '22', color: CATEGORY_COLORS[item.category] || '#64748b' }}>
                          {item.category[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{item.title}</p>
                          {item.notes && <p className="text-xs text-gray-500 truncate">{item.notes}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="badge text-xs" style={{ background: (CATEGORY_COLORS[item.category] || '#64748b') + '22', color: CATEGORY_COLORS[item.category] || '#64748b' }}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-400">{formatDate(item.date)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-brand-green">+{formatCurrency(item.amount, currency)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(item)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Income' : 'Add Income'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="e.g. Monthly Salary" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount ({currency})</label>
              <input type="number" step="0.01" min="0.01" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input" placeholder="0.00" required />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input" required />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input">
              {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input resize-none" rows={2} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editing ? 'Update' : 'Add Income'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Income" message={`Delete "${deleteTarget?.title}"?`} loading={deleting} />
    </div>
  )
}
