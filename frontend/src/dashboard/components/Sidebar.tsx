import { NavLink } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, BookOpen, FileText, ShoppingBag, Users, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '../../shared/store/authStore'
import { clsx } from 'clsx'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', color: 'text-violet-500' },
  { to: '/dashboard/conversations', icon: MessageSquare, label: 'Conversations', color: 'text-blue-500' },
  { to: '/dashboard/faqs', icon: BookOpen, label: 'FAQs', color: 'text-emerald-500' },
  { to: '/dashboard/documents', icon: FileText, label: 'Documents', color: 'text-amber-500' },
  { to: '/dashboard/products', icon: ShoppingBag, label: 'Products', color: 'text-indigo-500' },
  { to: '/dashboard/leads', icon: Users, label: 'Leads', color: 'text-pink-500' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings', color: 'text-slate-500' },
]

export function Sidebar() {
  const logout = useAuthStore((s) => s.logout)

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-100">
        <span className="text-2xl font-bold tracking-tight">
          Chat<span className="brand-gradient-text">Biz</span>
        </span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-base font-medium transition-colors',
                isActive
                  ? 'brand-gradient text-white shadow-sm shadow-brand-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-white' : color} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  )
}
