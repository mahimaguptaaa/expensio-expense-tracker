export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export const formatShortDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const formatMonthYear = (date) => {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

export const formatRelativeTime = (date) => {
  const now = new Date()
  const d = new Date(date)
  const diff = now - d
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return formatDate(date)
}

export const CATEGORY_COLORS = {
  'Food & Dining': '#f59e0b',
  'Transportation': '#3b82f6',
  'Shopping': '#ec4899',
  'Entertainment': '#8b5cf6',
  'Healthcare': '#ef4444',
  'Utilities': '#06b6d4',
  'Housing': '#10b981',
  'Education': '#f97316',
  'Travel': '#6366f1',
  'Personal Care': '#14b8a6',
  'Subscriptions': '#a855f7',
  'Other': '#64748b',
  'General': '#94a3b8',
  'Salary': '#10b981',
  'Freelance': '#3b82f6',
  'Investment': '#8b5cf6',
  'Business': '#f59e0b',
}

export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || '#64748b'
}

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Business', 'Rental', 'Gift', 'Other']
export const EXPENSE_CATEGORIES = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare', 'Utilities', 'Housing', 'Education', 'Travel', 'Personal Care', 'Subscriptions', 'Other']

export const getCurrentMonthYear = () => {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}
