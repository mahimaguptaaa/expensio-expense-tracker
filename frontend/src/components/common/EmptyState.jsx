import { motion } from 'framer-motion'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green/10 to-brand-blue/10 border border-white/5 flex items-center justify-center mb-5">
          <Icon className="w-8 h-8 text-gray-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-gray-400 text-sm max-w-xs mb-6">{description}</p>}
      {action && action}
    </motion.div>
  )
}
