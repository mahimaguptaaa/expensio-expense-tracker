import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Receipt, TrendingUp, Target, Users, Bot,
  BarChart3, User, LogOut, Menu, X, Zap, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/income', icon: TrendingUp, label: 'Income' },
  { to: '/budget', icon: Target, label: 'Budget' },
  { to: '/groups', icon: Users, label: 'Groups' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/ai', icon: Bot, label: 'AI Assistant' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">Expensio</h1>
            <p className="text-brand-green text-xs font-medium">AI Finance</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
            <span>{label}</span>
            {label === 'AI Assistant' && (
              <span className="ml-auto text-xs bg-brand-green/20 text-brand-green px-1.5 py-0.5 rounded-md font-semibold">AI</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-1">
        <NavLink to="/profile" onClick={() => setSidebarOpen(false)}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={18} />
          <span>Profile</span>
        </NavLink>
        <button onClick={handleLogout} className="nav-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-dark-500">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-dark-200 border-r border-white/5 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-dark-200 border-r border-white/5 z-50 lg:hidden flex flex-col">
              <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10">
                <X size={18} className="text-gray-400" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden bg-dark-200 border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/10">
            <Menu size={20} className="text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white">Expensio AI</span>
          </div>
          <NavLink to="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </NavLink>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
