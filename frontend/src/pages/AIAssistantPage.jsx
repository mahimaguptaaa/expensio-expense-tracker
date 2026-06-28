import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Trash2, User, Sparkles, TrendingDown, PiggyBank, BarChart3, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'
import { aiAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const QUICK_PROMPTS = [
  { icon: TrendingDown, label: 'Top spending categories', prompt: 'Where am I spending the most money?' },
  { icon: PiggyBank, label: 'Save more tips', prompt: 'How can I save more money based on my spending?' },
  { icon: BarChart3, label: 'Monthly analysis', prompt: 'Analyze my monthly spending patterns' },
  { icon: Lightbulb, label: 'Budget suggestion', prompt: 'Suggest a budget plan for me based on my income and expenses' },
]

export default function AIAssistantPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    aiAPI.getChatHistory()
      .then(res => setMessages(res.data.messages))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { id: Date.now(), role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res = await aiAPI.chat({ message: msg, history })
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: res.data.response }])
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to get response'
      toast.error(errMsg)
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: `Sorry, I couldn't process your request: ${errMsg}` }])
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    try {
      await aiAPI.clearHistory()
      setMessages([])
      toast.success('Chat history cleared')
    } catch { toast.error('Failed to clear history') }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 140px)' }}>
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Financial Assistant</h1>
            <p className="text-gray-400 text-xs">Your personal assistant</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory} className="btn-secondary flex items-center gap-2 text-sm py-2">
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-green/20 to-brand-blue/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-brand-green" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Your AI Finance Coach</h2>
              <p className="text-gray-400 text-sm max-w-sm">
                Ask me anything about your finances. I have access to your expense data and can provide personalized advice.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
              {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                <button key={label} onClick={() => sendMessage(prompt)}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-green/30 transition-all text-left group">
                  <div className="w-9 h-9 rounded-lg bg-brand-green/10 flex items-center justify-center shrink-0 group-hover:bg-brand-green/20 transition-colors">
                    <Icon size={16} className="text-brand-green" />
                  </div>
                  <span className="text-sm text-gray-300 font-medium">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-brand-green to-brand-blue text-white text-xs font-bold'
                    : 'bg-gradient-to-br from-brand-green/20 to-brand-blue/20 border border-white/10'
                }`}>
                  {msg.role === 'user' ? user?.name?.[0]?.toUpperCase() : <Bot size={14} className="text-brand-green" />}
                </div>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-brand-green to-brand-blue text-white rounded-tr-sm'
                    : 'bg-dark-100 border border-white/5 text-gray-200 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-green/20 to-brand-blue/20 border border-white/10 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-brand-green" />
                </div>
                <div className="bg-dark-100 border border-white/5 px-5 py-4 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1.5">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <motion.div key={i} className="w-2 h-2 bg-brand-green rounded-full"
                        animate={{ y: [-4, 0, -4] }} transition={{ repeat: Infinity, duration: 0.8, delay: d }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-4 border-t border-white/5">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your finances... (Enter to send)"
            rows={1}
            className="input flex-1 resize-none min-h-[46px] max-h-32 py-3"
            style={{ height: 'auto' }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px' }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="btn-primary w-12 h-12 !p-0 flex items-center justify-center shrink-0 rounded-xl disabled:opacity-40">
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          AI responses are based on your financial data. Always verify important financial decisions.
        </p>
      </div>
    </div>
  )
}
