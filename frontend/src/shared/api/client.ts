import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Routes that are meant to be visited while logged out -- a 401 from the
// silent checkAuth() call on these pages is expected, not a session expiry,
// so it must not bounce the user away before they can use the page (this
// used to nuke direct links to /register and /reset-password?token=...).
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !PUBLIC_ROUTES.includes(window.location.pathname)) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
