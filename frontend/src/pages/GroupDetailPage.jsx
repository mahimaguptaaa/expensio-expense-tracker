import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, UserPlus, DollarSign, Bot, Receipt, Users, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { groupAPI, aiAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate } from '../utils/formatters'
import Modal from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'

export default function GroupDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [group, setGroup] = useState(null)
  const [balances, setBalances] = useState(null)
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState('')
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [activeTab, setActiveTab] = useState('expenses')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [settleTarget, setSettleTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [expenseForm, setExpenseForm] = useState({
    title: '', amount: '', category: 'General', date: new Date().toISOString().split('T')[0], splitType: 'equal', notes: ''
  })

  const fetchGroup = async () => {
    try {
      const [gRes, bRes] = await Promise.all([groupAPI.getById(id), groupAPI.getBalances(id)])
      setGroup(gRes.data.group)
      setBalances(bRes.data)
    } catch { toast.error('Failed to load group') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchGroup() }, [id])

  const handleAddExpense = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await groupAPI.addExpense(id, expenseForm)
      toast.success('Expense added and split!')
      setShowExpenseModal(false)
      setExpenseForm({ title: '', amount: '', category: 'General', date: new Date().toISOString().split('T')[0], splitType: 'equal', notes: '' })
      fetchGroup()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add expense') }
    finally { setSaving(false) }
  }

  const handleAddMember = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await groupAPI.addMember(id, { email: memberEmail })
      toast.success('Member added!')
      setShowMemberModal(false)
      setMemberEmail('')
      fetchGroup()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add member') }
    finally { setSaving(false) }
  }

  const handleSettle = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await groupAPI.settleUp(id, { toUserId: settleTarget.to.id, amount: settleTarget.amount })
      toast.success('Settlement recorded!')
      setShowSettleModal(false)
      fetchGroup()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to settle') }
    finally { setSaving(false) }
  }

  const fetchInsights = async () => {
    setLoadingInsights(true)
    try {
      const res = await aiAPI.getGroupInsights(id)
      setInsights(res.data.insights)
    } catch (err) { setInsights(err.response?.data?.error || 'Failed to get insights') }
    finally { setLoadingInsights(false) }
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 shimmer rounded-xl" />
      <div className="grid grid-cols-3 gap-4">{Array.from({length:3}).map((_,i) => <div key={i} className="card h-24 shimmer" />)}</div>
    </div>
  )

  if (!group) return <div className="text-center py-16 text-gray-400">Group not found</div>

  const myDebts = balances?.simplifiedDebts?.filter(d => d.from.id === user?.id) || []
  const owedToMe = balances?.simplifiedDebts?.filter(d => d.to.id === user?.id) || []
  const currency = user?.currency || 'USD'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/groups" className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{group.name}</h1>
          {group.description && <p className="text-gray-400 text-sm mt-1">{group.description}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowMemberModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <UserPlus size={15} /> Add Member
          </button>
          <button onClick={() => setShowExpenseModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="card py-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-500 uppercase font-medium mr-1">Members</span>
          {group.members.map(m => (
            <div key={m.userId} className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center text-xs font-bold text-white">
                {m.user.name[0]}
              </div>
              <span className="text-sm text-gray-300">{m.user.name}</span>
              {m.role === 'admin' && <span className="text-xs text-brand-green">Admin</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Balance Summary */}
      {(myDebts.length > 0 || owedToMe.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {myDebts.length > 0 && (
            <div className="card border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
              <h3 className="text-sm font-medium text-gray-400 mb-3">You owe</h3>
              <div className="space-y-2">
                {myDebts.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-white">{d.to.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-red-400">{formatCurrency(d.amount, currency)}</span>
                      <button onClick={() => { setSettleTarget(d); setShowSettleModal(true) }}
                        className="text-xs bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-lg hover:bg-brand-green/20 transition-colors">
                        Settle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {owedToMe.length > 0 && (
            <div className="card border-brand-green/20 bg-gradient-to-br from-brand-green/5 to-transparent">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Owed to you</h3>
              <div className="space-y-2">
                {owedToMe.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-white">{d.from.name}</span>
                    <span className="text-sm font-semibold text-brand-green">{formatCurrency(d.amount, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-300 p-1 rounded-xl w-fit">
        {['expenses', 'settlements', 'insights'].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'insights' && !insights) fetchInsights() }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
            {tab === 'insights' && <Bot size={14} className="inline mr-1.5" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'expenses' && (
        group.expenses.length === 0 ? (
          <EmptyState icon={Receipt} title="No expenses yet" description="Add the first expense for this group"
            action={<button onClick={() => setShowExpenseModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Expense</button>} />
        ) : (
          <div className="space-y-3">
            {group.expenses.map((e, i) => (
              <motion.div key={e.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card flex items-center gap-4 py-4">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shrink-0">
                  <DollarSign size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{e.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Paid by <span className="text-brand-green">{e.paidBy.name}</span> · {e.splitType} split · {formatDate(e.date)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-white">{formatCurrency(e.amount, currency)}</p>
                  <p className="text-xs text-gray-500">{e.splits.length} splits</p>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {activeTab === 'settlements' && (
        balances?.settlements?.length === 0 ? (
          <EmptyState icon={CheckCircle} title="No settlements yet" description="Settle up with group members to clear debts" />
        ) : (
          <div className="space-y-3">
            {balances?.settlements?.map((s, i) => (
              <div key={s.id} className="card flex items-center gap-4 py-4">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                  <CheckCircle size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">
                    <span className="text-brand-green font-medium">{s.fromUser.name}</span> paid{' '}
                    <span className="text-blue-400 font-medium">{s.toUser.name}</span>
                  </p>
                  {s.note && <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>}
                </div>
                <span className="font-semibold text-brand-green">{formatCurrency(s.amount, currency)}</span>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'insights' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="text-brand-green" size={20} />
            <h3 className="font-semibold text-white">AI Group Insights</h3>
          </div>
          {loadingInsights ? (
            <div className="flex items-center gap-3 py-8 justify-center">
              <div className="w-5 h-5 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Analyzing group expenses...</p>
            </div>
          ) : insights ? (
            <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{insights}</div>
          ) : (
            <div className="text-center py-8">
              <button onClick={fetchInsights} className="btn-primary flex items-center gap-2 mx-auto">
                <Bot size={16} /> Get AI Insights
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Add Group Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="label">Description</label>
            <input value={expenseForm.title} onChange={e => setExpenseForm(f => ({ ...f, title: e.target.value }))}
              className="input" placeholder="e.g. Dinner for everyone" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount ({currency})</label>
              <input type="number" step="0.01" min="0.01" value={expenseForm.amount}
                onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} className="input" placeholder="0.00" required />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} className="input" required />
            </div>
          </div>
          <div>
            <label className="label">Split Type</label>
            <select value={expenseForm.splitType} onChange={e => setExpenseForm(f => ({ ...f, splitType: e.target.value }))} className="input">
              <option value="equal">Equal Split</option>
              <option value="custom">Custom Amounts</option>
              <option value="percentage">By Percentage</option>
            </select>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input value={expenseForm.notes} onChange={e => setExpenseForm(f => ({ ...f, notes: e.target.value }))} className="input" placeholder="Any notes..." />
          </div>
          <p className="text-xs text-gray-500">
            You will be recorded as the payer. The amount will be split among all {group.members.length} members.
          </p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowExpenseModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding...' : 'Add & Split'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title="Add Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <p className="text-gray-400 text-sm">Enter the email address of the person you want to add. They must have an Expensio AI account.</p>
          <div>
            <label className="label">Email Address</label>
            <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)}
              className="input" placeholder="friend@example.com" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowMemberModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Settle Modal */}
      <Modal isOpen={showSettleModal} onClose={() => setShowSettleModal(false)} title="Settle Up">
        <form onSubmit={handleSettle} className="space-y-4">
          {settleTarget && (
            <>
              <p className="text-gray-300">
                Confirm payment of <span className="text-brand-green font-semibold">{formatCurrency(settleTarget.amount, currency)}</span> to{' '}
                <span className="text-white font-semibold">{settleTarget.to.name}</span>
              </p>
              <div>
                <label className="label">Note (optional)</label>
                <input className="input" placeholder="e.g. Paid via bank transfer" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSettleModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Recording...' : 'Mark as Settled'}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  )
}
