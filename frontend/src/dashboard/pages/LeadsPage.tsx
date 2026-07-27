import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import { Card } from '../../shared/components/Card'
import { clsx } from 'clsx'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  message: string | null
  status: string
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-500',
}
const STATUSES = ['new', 'contacted', 'won', 'lost']

export function LeadsPage() {
  const qc = useQueryClient()
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: () => api.get('/leads').then((r) => r.data),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/leads/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-sm text-gray-500 mt-1">Contacts captured by your chatbot.</p>
      </div>

      <div className="space-y-3">
        {leads.map((lead) => (
          <Card key={lead.id}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{lead.name}</p>
                <div className="flex gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                  {lead.email && <span>{lead.email}</span>}
                  {lead.phone && <span>{lead.phone}</span>}
                </div>
                {lead.message && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{lead.message}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">{new Date(lead.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx('text-xs px-2 py-1 rounded-full font-medium', STATUS_COLORS[lead.status] || STATUS_COLORS.new)}>
                  {lead.status}
                </span>
                <select
                  value={lead.status}
                  onChange={(e) => updateMut.mutate({ id: lead.id, status: e.target.value })}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </Card>
        ))}
        {leads.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No leads yet. They'll appear here when visitors contact you.</div>
        )}
      </div>
    </div>
  )
}
