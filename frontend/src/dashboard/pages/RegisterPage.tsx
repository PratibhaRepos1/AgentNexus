import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../shared/store/authStore'
import { Input } from '../../shared/components/Input'
import { Button } from '../../shared/components/Button'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    business_name: '', business_slug: '', industry: 'retail',
    full_name: '', email: '', password: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
        <p className="text-sm text-gray-500 mb-6">Start your free ChatBiz trial today</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Business name" value={form.business_name} onChange={set('business_name')} required />
          <Input label="Business slug (URL-friendly)" value={form.business_slug} onChange={set('business_slug')} placeholder="my-shop" required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.industry} onChange={set('industry')}>
              {['retail', 'restaurant', 'clinic', 'real_estate', 'service', 'other'].map((i) => (
                <option key={i} value={i}>{i.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <Input label="Your name" value={form.full_name} onChange={set('full_name')} required />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
          <Input label="Password" type="password" value={form.password} onChange={set('password')} required />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">Create account</Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
