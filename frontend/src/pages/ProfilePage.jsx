import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Globe, Lock, Save, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const CURRENCIES = ['USD','EUR','GBP','INR','CAD','AUD','JPY','CHF','SGD','AED']

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', currency: user?.currency || 'USD' })
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPass, setSavingPass] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault(); setSavingProfile(true)
    try {
      const res = await authAPI.updateProfile(profileForm)
      updateUser(res.data.user)
      toast.success('Profile updated!')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update') }
    finally { setSavingProfile(false) }
  }

  const handlePassSave = async (e) => {
    e.preventDefault()
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Passwords do not match')
    if (passForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    setSavingPass(true)
    try {
      await authAPI.changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword })
      toast.success('Password changed!')
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to change password') }
    finally { setSavingPass(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account preferences</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center text-2xl font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user?.name}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className="text-xs text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-md mt-1 inline-block">Free Plan</span>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2"><User size={16} className="text-brand-green" /> Personal Info</h3>
          <div>
            <label className="label">Full Name</label>
            <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
              className="input" placeholder="Your full name" required />
          </div>
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input value={user?.email} disabled className="input pl-10 opacity-50 cursor-not-allowed" />
            </div>
            <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="label flex items-center gap-2"><Globe size={14} /> Default Currency</label>
            <select value={profileForm.currency} onChange={e => setProfileForm(f => ({ ...f, currency: e.target.value }))} className="input">
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <form onSubmit={handlePassSave} className="space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2"><Shield size={16} className="text-brand-green" /> Change Password</h3>
          <div>
            <label className="label">Current Password</label>
            <input type="password" value={passForm.currentPassword}
              onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="input" placeholder="••••••••" required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" value={passForm.newPassword}
              onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
              className="input" placeholder="Min. 6 characters" required />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" value={passForm.confirmPassword}
              onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className="input" placeholder="Repeat new password" required />
          </div>
          <button type="submit" disabled={savingPass} className="btn-primary flex items-center gap-2">
            <Lock size={16} />
            {savingPass ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card border-white/5">
        <h3 className="font-semibold text-white mb-3">Account Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Member since</span><span className="text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Plan</span><span className="text-brand-green font-medium">Free</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Currency</span><span className="text-white">{user?.currency}</span></div>
        </div>
      </motion.div>
    </div>
  )
}
