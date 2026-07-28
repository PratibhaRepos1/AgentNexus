import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import { Card } from '../../shared/components/Card'
import { Button } from '../../shared/components/Button'
import { Input } from '../../shared/components/Input'
import { Upload, Trash2, FileText, Link2, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface Doc {
  id: string
  filename: string
  file_type: string
  status: string
  created_at: string
}

const statusIcon = (status: string) => {
  if (status === 'embedded') return <CheckCircle size={14} className="text-green-500" />
  if (status === 'failed') return <AlertCircle size={14} className="text-red-500" />
  return <Loader2 size={14} className="text-slate-400 animate-spin" />
}

export function DocumentsPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')

  const { data: docs = [] } = useQuery<Doc[]>({
    queryKey: ['documents'],
    queryFn: () => api.get('/documents').then((r) => r.data),
  })

  const uploadMut = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })

  const urlMut = useMutation({
    mutationFn: (url: string) => api.post('/documents/from-url', { url }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      setUrl('')
      setUrlError('')
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setUrlError(detail || 'Could not fetch that URL.')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadMut.mutate(file)
    e.target.value = ''
  }

  const handleFetchUrl = () => {
    if (!url.trim()) return
    setUrlError('')
    urlMut.mutate(url.trim())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Documents</h1>
          <p className="text-base text-slate-500 mt-1">Upload PDF, Word, Excel, CSV, or TXT files to train your chatbot.</p>
        </div>
        <Button size="sm" loading={uploadMut.isPending} onClick={() => fileRef.current?.click()}>
          <Upload size={16} className="mr-1" /> Upload
        </Button>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.csv,.xlsx" className="hidden" onChange={handleFile} />
      </div>

      <Card title="Fetch from a web page">
        <p className="text-base text-slate-500 mb-3">
          Import the text content of a single page from your website (e.g. an About or FAQ page) directly into your chatbot's knowledge base.
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="https://your-site.com/about"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
            />
          </div>
          <Button size="sm" loading={urlMut.isPending} onClick={handleFetchUrl}>
            <Link2 size={16} className="mr-1" /> Fetch
          </Button>
        </div>
        {urlError && <p className="text-sm text-red-500 mt-2">{urlError}</p>}
      </Card>

      <div className="space-y-3">
        {docs.map((doc) => (
          <Card key={doc.id}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-slate-400" />
                <div>
                  <p className="text-lg font-medium text-slate-900">{doc.filename}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {statusIcon(doc.status)}
                    <span className="text-sm text-slate-500 capitalize">{doc.status}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => deleteMut.mutate(doc.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        ))}
        {docs.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-base">No documents uploaded yet.</div>
        )}
      </div>
    </div>
  )
}
