import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import { Card } from '../../shared/components/Card'
import { Button } from '../../shared/components/Button'
import { Input } from '../../shared/components/Input'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  price: number | null
  currency: string
  category: string | null
  is_active: boolean
}

const emptyForm = { name: '', description: '', price: '', currency: 'USD', category: '' }

export function ProductsPage() {
  const qc = useQueryClient()
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data),
  })

  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const createMut = useMutation({
    mutationFn: (body: typeof emptyForm) =>
      api.post('/products', { ...body, price: body.price ? parseFloat(body.price) : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setAdding(false); setForm(emptyForm) },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & typeof emptyForm) =>
      api.patch(`/products/${id}`, { ...body, price: body.price ? parseFloat(body.price) : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setEditId(null) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const startEdit = (p: Product) => {
    setEditId(p.id)
    setForm({ name: p.name, description: p.description || '', price: p.price?.toString() || '', currency: p.currency, category: p.category || '' })
  }

  const FormFields = () => (
    <div className="grid grid-cols-2 gap-3">
      <Input label="Name" value={form.name} onChange={set('name')} className="col-span-2" />
      <Input label="Description" value={form.description} onChange={set('description')} className="col-span-2" />
      <Input label="Price" type="number" value={form.price} onChange={set('price')} />
      <Input label="Currency" value={form.currency} onChange={set('currency')} />
      <Input label="Category" value={form.category} onChange={set('category')} className="col-span-2" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products & Services</h1>
          <p className="text-sm text-gray-500 mt-1">Help your chatbot answer product questions.</p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}><Plus size={16} className="mr-1" />Add</Button>
      </div>

      {adding && (
        <Card title="New product / service">
          <div className="space-y-3">
            <FormFields />
            <div className="flex gap-2">
              <Button size="sm" loading={createMut.isPending} onClick={() => createMut.mutate(form)}>Save</Button>
              <Button size="sm" variant="secondary" onClick={() => { setAdding(false); setForm(emptyForm) }}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <Card key={p.id}>
            {editId === p.id ? (
              <div className="space-y-3">
                <FormFields />
                <div className="flex gap-2">
                  <Button size="sm" loading={updateMut.isPending} onClick={() => updateMut.mutate({ id: p.id, ...form })}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(p)} className="p-1 rounded hover:bg-gray-100 text-gray-400"><Pencil size={13} /></button>
                    <button onClick={() => deleteMut.mutate(p.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
                {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                {p.price != null && (
                  <p className="mt-2 text-sm font-medium text-brand-600">{p.currency} {Number(p.price).toFixed(2)}</p>
                )}
                {p.category && <span className="mt-1 inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.category}</span>}
              </div>
            )}
          </Card>
        ))}
      </div>
      {products.length === 0 && !adding && (
        <div className="text-center py-12 text-gray-400 text-sm">No products yet.</div>
      )}
    </div>
  )
}
