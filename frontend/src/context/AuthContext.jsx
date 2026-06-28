import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authAPI.getProfile()
        .then(res => { setUser(res.data.user); localStorage.setItem('user', JSON.stringify(res.data.user)) })
        .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null) })
        .finally(() => setInitializing(false))
    } else {
      setInitializing(false)
    }
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await authAPI.login({ email, password })
      const { user, token } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      toast.success(`Welcome back, ${user.name}!`)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed'
      toast.error(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (data) => {
    setLoading(true)
    try {
      const res = await authAPI.signup(data)
      const { user, token } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      toast.success('Account created successfully!')
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.error || 'Signup failed'
      toast.error(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateUser = (updated) => {
    setUser(updated)
    localStorage.setItem('user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, loading, initializing, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
