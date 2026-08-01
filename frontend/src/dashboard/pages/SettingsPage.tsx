import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { MessageCircle } from 'lucide-react'
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

interface Business {
  primary_color: string
}

// Curated, brand-friendly palette — first entry matches the platform's own default.
const PRESET_COLORS = [
  '#ff6b00', // Orange (default)
  '#7c3aed', // Violet
  '#4f46e5', // Indigo
  '#2563eb', // Blue
  '#0d9488', // Teal
  '#059669', // Emerald
  '#d97706', // Amber
  '#e11d48', // Rose
  '#1e293b', // Slate
]

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

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

  // Widget color lives on the Business resource (not BusinessSettings above), so it gets
  // its own query/mutation and its own save action.
  const { data: business } = useQuery<Business>({
    queryKey: ['business'],
    queryFn: () => api.get('/businesses/me').then((r) => r.data),
  })

  const [color, setColor] = useState('#ff6b00')
  useEffect(() => { if (business?.primary_color) setColor(business.primary_color) }, [business])
  const isValidColor = HEX_COLOR_REGEX.test(color)

  const colorMut = useMutation({
    mutationFn: (primary_color: string) => api.patch('/businesses/me', { primary_color }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business'] }),
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

      <Card title="Widget Appearance">
        <div className="space-y-4">
          <div>
            <label className="block text-base font-medium text-slate-700 mb-2">Widget color</label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Preset widget colors">
              {PRESET_COLORS.map((swatch) => {
                const active = color.toLowerCase() === swatch.toLowerCase()
                return (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setColor(swatch)}
                    aria-label={`Use ${swatch}`}
                    aria-pressed={active}
                    className={clsx(
                      'h-8 w-8 rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500',
                      active ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: swatch }}
                  />
                )
              })}
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div>
              <label htmlFor="custom-widget-color" className="block text-base font-medium text-slate-700 mb-1">
                Custom color
              </label>
              <input
                id="custom-widget-color"
                type="color"
                value={isValidColor ? color : '#ff6b00'}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Pick a custom widget color"
                className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300"
              />
            </div>

            <Input
              label="Hex value"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#ff6b00"
              error={!isValidColor ? 'Enter a valid hex color, e.g. #ff6b00' : undefined}
              className="w-32"
            />

            <div className="flex flex-col items-center gap-1 pb-1">
              <span className="text-sm text-slate-500">Preview</span>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm"
                style={{ backgroundColor: isValidColor ? color : '#e2e8f0' }}
              >
                <MessageCircle size={18} />
              </div>
            </div>
          </div>

          <Button loading={colorMut.isPending} disabled={!isValidColor} onClick={() => colorMut.mutate(color)}>
            Save appearance
          </Button>
          {colorMut.isSuccess && <p className="text-base text-green-600">Widget color saved!</p>}
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
