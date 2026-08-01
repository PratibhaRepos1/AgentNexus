import { create } from 'zustand'
import { api } from '../api/client'
import { queryClient } from '../queryClient'

interface AuthState {
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  business_name: string
  business_slug: string
  industry: string
  full_name: string
  email: string
  password: string
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('agentnexus_token'),

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    queryClient.clear()
    localStorage.setItem('agentnexus_token', data.access_token)
    set({ token: data.access_token })
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data)
    queryClient.clear()
    localStorage.setItem('agentnexus_token', res.data.access_token)
    set({ token: res.data.access_token })
  },

  logout: () => {
    queryClient.clear()
    localStorage.removeItem('agentnexus_token')
    set({ token: null })
  },
}))
