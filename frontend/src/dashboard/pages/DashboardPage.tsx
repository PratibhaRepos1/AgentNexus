import { useQuery } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import { Card } from '../../shared/components/Card'
import { MessageSquare, Users, TrendingUp, Code } from 'lucide-react'

interface Summary {
  conversation_count: number
  lead_count: number
  message_count: number
  top_questions: { question: string; count: number }[]
}

interface Business {
  id: string
  name: string
  slug: string
}

export function DashboardPage() {
  const { data: summary } = useQuery<Summary>({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics/summary').then((r) => r.data),
  })
  const { data: business } = useQuery<Business>({
    queryKey: ['business'],
    queryFn: () => api.get('/businesses/me').then((r) => r.data),
  })

  const embedScript = business
    ? `<script src="${window.location.origin}/widget.js" data-business="${business.id}"></script>`
    : ''

  const stats = [
    { label: 'Conversations', value: summary?.conversation_count ?? '—', icon: MessageSquare, bg: 'bg-blue-100', fg: 'text-blue-600' },
    { label: 'Leads captured', value: summary?.lead_count ?? '—', icon: Users, bg: 'bg-emerald-100', fg: 'text-emerald-600' },
    { label: 'Visitor messages', value: summary?.message_count ?? '—', icon: TrendingUp, bg: 'bg-violet-100', fg: 'text-violet-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="brand-gradient rounded-2xl p-6 shadow-sm shadow-brand-200 sm:p-8">
        <h1 className="text-4xl font-bold text-white">
          {business ? `${business.name} Dashboard` : 'Dashboard'}
        </h1>
        <p className="text-base text-brand-50 mt-1">Welcome back! Here's your chatbot at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, bg, fg }) => (
          <Card key={label}>
            <div className="flex items-center gap-4">
              <div className={`grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl ${bg}`}>
                <Icon className={fg} size={22} />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
                <p className="text-base text-slate-500">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {summary && summary.top_questions.length > 0 && (
        <Card title="Top visitor questions">
          <ul className="space-y-2">
            {summary.top_questions.map((q, i) => (
              <li key={i} className="flex items-center justify-between gap-4 text-base">
                <span className="text-slate-700 flex-1">{q.question}</span>
                <span
                  className={
                    i === 0
                      ? 'brand-gradient flex-shrink-0 rounded-full px-2.5 py-1 text-sm font-bold text-white shadow-sm shadow-brand-200'
                      : 'flex-shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-sm font-bold text-violet-700'
                  }
                >
                  {q.count}×
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Embed your chatbot">
        <p className="text-base text-slate-600 mb-3">
          Copy this snippet and paste it before <code className="bg-slate-100 px-1 rounded">&lt;/body&gt;</code> on your website.
        </p>
        <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
          <Code size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <code className="text-sm text-slate-700 break-all">{embedScript}</code>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(embedScript)}
          className="mt-3 text-sm text-brand-600 hover:underline"
        >
          Copy to clipboard
        </button>
      </Card>
    </div>
  )
}
