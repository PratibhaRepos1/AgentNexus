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
    { label: 'Conversations', value: summary?.conversation_count ?? '—', icon: MessageSquare, color: 'text-blue-500' },
    { label: 'Leads captured', value: summary?.lead_count ?? '—', icon: Users, color: 'text-green-500' },
    { label: 'Visitor messages', value: summary?.message_count ?? '—', icon: TrendingUp, color: 'text-purple-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {business ? `${business.name} Dashboard` : 'Dashboard'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here's your chatbot at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center gap-4">
              <Icon className={color} size={28} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {summary && summary.top_questions.length > 0 && (
        <Card title="Top visitor questions">
          <ul className="space-y-2">
            {summary.top_questions.map((q, i) => (
              <li key={i} className="flex items-start justify-between text-sm">
                <span className="text-gray-700 flex-1 mr-4">{q.question}</span>
                <span className="text-gray-400 font-medium">{q.count}×</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Embed your chatbot">
        <p className="text-sm text-gray-600 mb-3">
          Copy this snippet and paste it before <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> on your website.
        </p>
        <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <Code size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <code className="text-xs text-gray-700 break-all">{embedScript}</code>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(embedScript)}
          className="mt-3 text-xs text-brand-600 hover:underline"
        >
          Copy to clipboard
        </button>
      </Card>
    </div>
  )
}
