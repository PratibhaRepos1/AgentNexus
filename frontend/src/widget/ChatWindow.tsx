import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { LeadForm } from './LeadForm'
import { MarkdownText } from './MarkdownText'

interface Message {
  sender: 'visitor' | 'ai'
  content: string
}

interface Props {
  businessId: string
  welcomeMessage?: string
  primaryColor?: string
  apiBaseUrl?: string
}

const genSession = () => `sess_${Math.random().toString(36).slice(2, 10)}`
const SESSION_KEY = 'chatbiz_session'
const DEFAULT_API_BASE_URL = 'http://localhost:8000'

export function ChatWindow({
  businessId,
  welcomeMessage = 'Hi! How can I help you today?',
  primaryColor = '#6366f1',
  apiBaseUrl = DEFAULT_API_BASE_URL,
}: Props) {
  const sessionId = useRef(sessionStorage.getItem(SESSION_KEY) || (() => {
    const s = genSession(); sessionStorage.setItem(SESSION_KEY, s); return s
  })())

  const [messages, setMessages] = useState<Message[]>([{ sender: 'ai', content: welcomeMessage }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages((m) => [...m, { sender: 'visitor', content: msg }])
    setLoading(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, session_id: sessionId.current, message: msg }),
      })
      if (res.status === 429) {
        setMessages((m) => [...m, { sender: 'ai', content: "You're sending messages a bit too fast — please wait a moment and try again." }])
        return
      }
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setMessages((m) => [...m, { sender: 'ai', content: data.reply }])
      if (data.suggest_lead_capture) setShowLeadForm(true)
    } catch {
      setMessages((m) => [...m, { sender: 'ai', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'visitor'
                  ? 'text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
              style={msg.sender === 'visitor' ? { backgroundColor: primaryColor } : undefined}
            >
              {msg.sender === 'ai' ? <MarkdownText text={msg.content} /> : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        {showLeadForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-sm font-medium text-gray-800 mb-2">Leave your contact details and we'll get back to you:</p>
            <LeadForm
              businessId={businessId}
              sessionId={sessionId.current}
              apiBaseUrl={apiBaseUrl}
              onSubmitted={() => {
                setShowLeadForm(false)
                setMessages((m) => [...m, { sender: 'ai', content: "Thanks! We'll be in touch soon." }])
              }}
            />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 px-3 py-3 flex gap-2">
        <input
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-brand-400"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="w-9 h-9 flex items-center justify-center rounded-full text-white disabled:opacity-40 flex-shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
