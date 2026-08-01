import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './dashboard/pages/LoginPage'
import { RegisterPage } from './dashboard/pages/RegisterPage'
import { ForgotPasswordPage } from './dashboard/pages/ForgotPasswordPage'
import { ResetPasswordPage } from './dashboard/pages/ResetPasswordPage'
import { DashboardPage } from './dashboard/pages/DashboardPage'
import { FAQsPage } from './dashboard/pages/FAQsPage'
import { DocumentsPage } from './dashboard/pages/DocumentsPage'
import { ProductsPage } from './dashboard/pages/ProductsPage'
import { LeadsPage } from './dashboard/pages/LeadsPage'
import { ConversationsPage } from './dashboard/pages/ConversationsPage'
import { SettingsPage } from './dashboard/pages/SettingsPage'
import { Sidebar } from './dashboard/components/Sidebar'
import { useAuthStore } from './shared/store/authStore'

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout><DashboardPage /></DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/faqs"
        element={
          <RequireAuth>
            <DashboardLayout><FAQsPage /></DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/documents"
        element={
          <RequireAuth>
            <DashboardLayout><DocumentsPage /></DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/products"
        element={
          <RequireAuth>
            <DashboardLayout><ProductsPage /></DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/leads"
        element={
          <RequireAuth>
            <DashboardLayout><LeadsPage /></DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/conversations"
        element={
          <RequireAuth>
            <DashboardLayout><ConversationsPage /></DashboardLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/settings"
        element={
          <RequireAuth>
            <DashboardLayout><SettingsPage /></DashboardLayout>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
