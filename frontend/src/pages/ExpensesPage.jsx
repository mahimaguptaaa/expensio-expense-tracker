import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Trash2, Pencil, Receipt, ScanLine } from 'lucide-react'
import toast from 'react-hot-toast'
import { expenseAPI, aiAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate, getCategoryColor, EXPENSE_CATEGORIES } from '../utils/formatters'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import { SkeletonTable } from '../components/common/Skeleton'

const BLANK = { title: '', amount: '', category: 'Food & Dining', date: new Date().toISOString().split('T')[0], notes: '' }

export default function ExpensesPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showScanModal, setShowScanModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [scanFile, setScanFile] = useState(null)
  const [scanning, setScanning] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await expenseAPI.getAll({ page, limit: 15, search, category })
      setExpenses(res.data.expenses)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
    } catch { toast.error('Failed to load expenses') }
    finally { setLoading(false) }
  }, [page, search, category])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])
  useEffect(() => { setPage(1) }, [search, category])

  const openAdd = () => { setForm(BLANK); setEditingExpense(null); setShowModal(true) }
  const openEdit = (e) => {
    setForm({ title: e.title, amount: e.amount, category: e.category, date: e.date.split('T')[0], notes: e.notes || '' })
    setEditingExpense(e)
    setShowModal(true)
  }

  const handleSave = async (ev) => {
    ev.preventDefault()
    setSaving(true)
    try {
      if (editingExpense) {
        await expenseAPI.update(editingExpense.id, form)
        toast.success('Expense updated')
      } else {
        await expenseAPI.create(form)
        toast.success('Expense added')
      }
      setShowModal(false)
      fetchExpenses()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save expense')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await expenseAPI.delete(deleteTarget.id)
      toast.success('Expense deleted')
      setDeleteTarget(null)
      fetchExpenses()
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  const handleScanReceipt = async () => {
    if (!scanFile) return
    setScanning(true)
    try {
      const fd = new FormData()
      fd.append('receipt', scanFile)
      const res = await aiAPI.scanReceipt(fd)
      const { extracted } = res.data
      setForm({
        title: extracted.title || '',
        amount: extracted.amount || '',
        category: extracted.category || 'Other',
        date: extracted.date || new Date().toISOString().split('T')[0],
        notes: 'Scanned from receipt',
      })
      setShowScanModal(false)
      setShowModal(true)
      toast.success('Receipt scanned! Review and save.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to scan receipt')
    } finally { setScanning(false); setScanFile(null) }
  }

  const currency = user?.currency || 'USD'
  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-gray-400 text-sm mt-1">{total} total expenses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScanModal(true)} className="btn-secondary flex items-center gap-2">
            <ScanLine size={16} /> Scan Receipt
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9 py-2.5" placeholder="Search expenses..." />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="input pl-9 py-2.5 sm:w-48">
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card py-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Showing</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totalAmount, currency)}</p>
          </div>
          <div className="card py-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Count</p>
            <p className="text-lg font-bold text-white">{expenses.length}</p>
          </div>
          <div className="card py-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Average</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totalAmount / expenses.length, currency)}</p>
          </div>
        </div>
      )}

      {loading ? <SkeletonTable rows={8} /> : expenses.length === 0 ? (
        <EmptyState icon={Receipt} title="No expenses found"
          description={search || category ? 'Try adjusting your filters' : 'Start tracking by adding your first expense'}
          action={!search && !category && (
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add First Expense
            </button>
          )} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs text-gray-500 font-medium px-6 py-4">EXPENSE</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-4 hidden sm:table-cell">CATEGORY</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-4 hidden md:table-cell">DATE</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-6 py-4">AMOUNT</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-6 py-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <motion.tr key={e.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-white/3 hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                          style={{ background: getCategoryColor(e.category) + '22', color: getCategoryColor(e.category) }}>
                          {e.category[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{e.title}</p>
                          {e.notes && <p className="text-xs text-gray-500 truncate max-w-[180px]">{e.notes}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="badge text-xs" style={{ background: getCategoryColor(e.category) + '22', color: getCategoryColor(e.category) }}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-400">{formatDate(e.date)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-red-400">-{formatCurrency(e.amount, currency)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(e)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(e)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
              <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingExpense ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="input" placeholder="e.g. Dinner at Restaurant" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount ({currency})</label>
              <input type="number" step="0.01" min="0.01" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="input" placeholder="0.00" required />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="input" required />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input">
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="input resize-none" rows={2} placeholder="Add any notes..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editingExpense ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Scan Receipt Modal */}
      <Modal isOpen={showScanModal} onClose={() => setShowScanModal(false)} title="Scan Receipt">
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">Upload a receipt image to automatically extract expense details using AI.</p>
          <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
            {scanFile ? (
              <div className="space-y-3">
                <p className="text-brand-green font-medium">{scanFile.name}</p>
                <p className="text-gray-500 text-sm">{(scanFile.size / 1024).toFixed(1)} KB</p>
                <button onClick={() => setScanFile(null)} className="text-red-400 text-sm hover:underline">Remove</button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <ScanLine className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Click to upload or drag & drop</p>
                <p className="text-gray-600 text-xs mt-1">PNG, JPG, WEBP up to 5MB</p>
                <input type="file" accept="image/*" className="hidden" onChange={e => setScanFile(e.target.files?.[0])} />
              </label>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowScanModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleScanReceipt} disabled={!scanFile || scanning} className="btn-primary flex-1">
              {scanning ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scanning...
                </span>
              ) : 'Scan Receipt'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Expense" message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        loading={deleting} />
    </div>
  )
}
