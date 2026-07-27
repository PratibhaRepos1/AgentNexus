import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import { Card } from '../../shared/components/Card'
import { MessageSquare, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'

interface Message {
  id: string
  sender: string
  content: string
  created_at: string
}

interface Conversation {
  id: string
  session_id: string
  status: string
  started_at: string
  messages: Message[]
}

export function ConversationsPage() {
  const qc = useQueryClient()
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/chat/conversations').then((r) => r.data),
  })
  const [open, setOpen] = useState<string | null>(null)

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/chat/conversations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      // Deleting a conversation changes message/lead counts and top-question
      // rankings on the Overview page -- without this it shows stale data
      // until a manual refresh.
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <p className="text-sm text-gray-500 mt-1">All chat sessions with your website visitors.</p>
      </div>

      <div className="space-y-3">
        {conversations.map((conv) => (
          <Card key={conv.id}>
            <button
              onClick={() => setOpen(open === conv.id ? null : conv.id)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <MessageSquare size={18} className="text-brand-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Session {conv.session_id.slice(0, 8)}…</p>
                  <p className="text-xs text-gray-400">{new Date(conv.started_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx('text-xs px-2 py-0.5 rounded-full', conv.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                  {conv.status}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Delete this conversation? This cannot be undone.')) {
                      deleteMut.mutate(conv.id)
                    }
                  }}
                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={14} />
                </button>
                {open === conv.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </div>
            </button>

            {open === conv.id && conv.messages.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                {conv.messages.map((msg) => (
                  <div key={msg.id} className={clsx('flex', msg.sender === 'visitor' ? 'justify-start' : 'justify-end')}>
                    <div className={clsx('max-w-xs px-3 py-2 rounded-2xl text-sm', msg.sender === 'visitor' ? 'bg-gray-100 text-gray-800' : 'bg-brand-500 text-white')}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
        {conversations.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No conversations yet.</div>
        )}
      </div>
    </div>
  )
}
