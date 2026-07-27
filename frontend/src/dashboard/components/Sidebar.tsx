import { NavLink } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, BookOpen, FileText, ShoppingBag, Users, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '../../shared/store/authStore'
import { clsx } from 'clsx'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/conversations', icon: MessageSquare, label: 'Conversations' },
  { to: '/dashboard/faqs', icon: BookOpen, label: 'FAQs' },
  { to: '/dashboard/documents', icon: FileText, label: 'Documents' },
  { to: '/dashboard/products', icon: ShoppingBag, label: 'Products' },
  { to: '/dashboard/leads', icon: Users, label: 'Leads' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const logout = useAuthStore((s) => s.logout)

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-xl font-bold text-brand-600">ChatBiz</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  )
}
