import { useState } from 'react'

interface Props {
  businessId: string
  sessionId: string
  primaryColor?: string
  apiBaseUrl?: string
  onSubmitted: () => void
}

const DEFAULT_API_BASE_URL = 'http://localhost:8000'
const DEFAULT_PRIMARY_COLOR = '#ff6b00'

export function LeadForm({ businessId, sessionId, primaryColor = DEFAULT_PRIMARY_COLOR, apiBaseUrl = DEFAULT_API_BASE_URL, onSubmitted }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return
    setLoading(true)
    try {
      await fetch(`${apiBaseUrl}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, session_id: sessionId, ...form }),
      })
      onSubmitted()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <input className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm" placeholder="Your name *" required
        value={form.name} onChange={set('name')} />
      <input className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm" placeholder="Email" type="email"
        value={form.email} onChange={set('email')} />
      <input className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm" placeholder="Phone"
        value={form.phone} onChange={set('phone')} />
      <input className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm" placeholder="Message (optional)"
        value={form.message} onChange={set('message')} />
      <button type="submit" disabled={loading}
        className="w-full text-white text-sm py-1.5 rounded-lg transition-[filter] hover:brightness-90 disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}>
        {loading ? 'Sending…' : 'Send'}
      </button>
    </form>
  )
}
