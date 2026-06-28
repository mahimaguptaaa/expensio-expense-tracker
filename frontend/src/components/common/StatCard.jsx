import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, color = 'green', delay = 0 }) {
  const colors = {
    green: 'from-brand-green/20 to-brand-green/5 border-brand-green/20',
    blue: 'from-brand-blue/20 to-brand-blue/5 border-brand-blue/20',
    red: 'from-red-500/20 to-red-500/5 border-red-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20',
  }
  const iconColors = {
    green: 'text-brand-green bg-brand-green/10',
    blue: 'text-brand-blue bg-brand-blue/10',
    red: 'text-red-400 bg-red-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 shadow-xl`}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-2">{value}</p>
      {(trend !== undefined || trendLabel) && (
        <div className="flex items-center gap-1.5">
          {trend !== undefined && (
            trend >= 0
              ? <TrendingUp size={14} className="text-brand-green" />
              : <TrendingDown size={14} className="text-red-400" />
          )}
          {trendLabel && <span className="text-xs text-gray-400">{trendLabel}</span>}
        </div>
      )}
    </motion.div>
  )
}
