import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import { Card } from '../../shared/components/Card'
import { Button } from '../../shared/components/Button'
import { Input } from '../../shared/components/Input'

interface Settings {
  tone: string
  welcome_message: string
  fallback_message: string
  contact_email: string | null
  contact_phone: string | null
  llm_provider: string
  llm_model: string | null
}

export function SettingsPage() {
  const qc = useQueryClient()
  const { data } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => api.get('/businesses/me/settings').then((r) => r.data),
  })

  const [form, setForm] = useState<Partial<Settings>>({})
  useEffect(() => { if (data) setForm(data) }, [data])

  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const mut = useMutation({
    mutationFn: (body: Partial<Settings>) => api.patch('/businesses/me/settings', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Chatbot Settings</h1>
        <p className="text-base text-slate-500 mt-1">Customize how your chatbot speaks and behaves.</p>
      </div>

      <Card title="Personality">
        <div className="space-y-4">
          <div>
            <label className="block text-base font-medium text-slate-700 mb-1">Tone</label>
            <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base" value={form.tone || 'friendly'} onChange={set('tone')}>
              {['friendly', 'formal', 'concise', 'playful'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-base font-medium text-slate-700 mb-1">Welcome message</label>
            <textarea className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base" rows={2}
              value={form.welcome_message || ''} onChange={set('welcome_message')} />
          </div>
          <div>
            <label className="block text-base font-medium text-slate-700 mb-1">Fallback message</label>
            <textarea className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base" rows={2}
              value={form.fallback_message || ''} onChange={set('fallback_message')} />
          </div>
        </div>
      </Card>

      <Card title="Contact info">
        <div className="space-y-3">
          <Input label="Contact email" type="email" value={form.contact_email || ''} onChange={set('contact_email')} />
          <Input label="Contact phone" value={form.contact_phone || ''} onChange={set('contact_phone')} />
        </div>
      </Card>

      <Card title="AI Provider">
        <div className="space-y-3">
          <div>
            <label className="block text-base font-medium text-slate-700 mb-1">LLM Provider</label>
            <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base" value={form.llm_provider || 'groq'} onChange={set('llm_provider')}>
              {['groq', 'gemini', 'ollama'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Input label="Model name (optional)" value={form.llm_model || ''} onChange={set('llm_model')} placeholder="e.g. llama-3.1-8b-instant" />
        </div>
      </Card>

      <Button loading={mut.isPending} onClick={() => mut.mutate(form)}>Save settings</Button>
      {mut.isSuccess && <p className="text-base text-green-600">Settings saved!</p>}
    </div>
  )
}
