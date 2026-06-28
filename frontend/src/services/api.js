import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
}

export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getCategories: () => api.get('/expenses/categories'),
}

export const incomeAPI = {
  getAll: (params) => api.get('/incomes', { params }),
  create: (data) => api.post('/incomes', data),
  update: (id, data) => api.put(`/incomes/${id}`, data),
  delete: (id) => api.delete(`/incomes/${id}`),
}

export const budgetAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
}

export const dashboardAPI = {
  get: (params) => api.get('/dashboard', { params }),
  getMonthlyReport: (year, month) => api.get(`/dashboard/report/${year}/${month}`),
}

export const groupAPI = {
  getAll: () => api.get('/groups'),
  create: (data) => api.post('/groups', data),
  getById: (id) => api.get(`/groups/${id}`),
  delete: (id) => api.delete(`/groups/${id}`),
  addMember: (id, data) => api.post(`/groups/${id}/members`, data),
  removeMember: (id, memberId) => api.delete(`/groups/${id}/members/${memberId}`),
  addExpense: (id, data) => api.post(`/groups/${id}/expenses`, data),
  getBalances: (id) => api.get(`/groups/${id}/balances`),
  settleUp: (id, data) => api.post(`/groups/${id}/settle`, data),
}

export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
  getChatHistory: () => api.get('/ai/chat/history'),
  clearHistory: () => api.delete('/ai/chat/history'),
  getGroupInsights: (groupId) => api.get(`/ai/group/${groupId}/insights`),
  scanReceipt: (formData) => api.post('/ai/scan-receipt', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export default api
