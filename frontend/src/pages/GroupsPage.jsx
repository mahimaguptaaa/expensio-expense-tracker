import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Users, ArrowRight, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { groupAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/formatters'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'

export default function GroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const res = await groupAPI.getAll()
      setGroups(res.data.groups)
    } catch { toast.error('Failed to load groups') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchGroups() }, [])

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await groupAPI.create(form)
      toast.success('Group created!')
      setShowModal(false)
      setForm({ name: '', description: '' })
      fetchGroups()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await groupAPI.delete(deleteTarget.id); toast.success('Group deleted'); setDeleteTarget(null); fetchGroups() }
    catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  const COLORS = ['from-brand-green to-brand-blue', 'from-purple-500 to-pink-500', 'from-orange-500 to-yellow-500', 'from-blue-500 to-cyan-500']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Groups</h1>
          <p className="text-gray-400 text-sm mt-1">Split expenses with friends and family</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Group
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length:3}).map((_,i) => <div key={i} className="card h-40 shimmer" />)}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState icon={Users} title="No groups yet"
          description="Create a group to split expenses with friends, roommates, or family"
          action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Create Group</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g, i) => (
            <motion.div key={g.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="card hover:border-white/15 transition-all duration-200 group relative">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-xl font-bold text-white mb-4`}>
                {g.name[0].toUpperCase()}
              </div>
              <h3 className="font-semibold text-white mb-1">{g.name}</h3>
              {g.description && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{g.description}</p>}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {g.members.slice(0, 3).map(m => (
                      <div key={m.userId} className={`w-7 h-7 rounded-full bg-gradient-to-br ${COLORS[i % COLORS.length]} border-2 border-dark-200 flex items-center justify-center text-xs font-bold text-white`}>
                        {m.user.name[0].toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{g.members.length} member{g.members.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  {g.createdBy === user?.id && (
                    <button onClick={(e) => { e.preventDefault(); setDeleteTarget(g) }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={13} />
                    </button>
                  )}
                  <Link to={`/groups/${g.id}`} className="flex items-center gap-1 text-brand-green text-sm hover:text-brand-green-light transition-colors">
                    Open <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Created {formatDate(g.createdAt)}</p>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Group">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Group Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input" placeholder="e.g. Roommates, Trip to Paris" required />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input resize-none" rows={2} placeholder="What's this group for?" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Group" message={`Delete "${deleteTarget?.name}"? This will remove all shared expenses and data.`} loading={deleting} />
    </div>
  )
}
