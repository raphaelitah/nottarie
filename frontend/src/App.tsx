import { lazy, Suspense, useState } from 'react'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import { LoginPage } from './auth/LoginPage'
import { SetPasswordPage } from './auth/SetPasswordPage'
import { Dashboard } from './Dashboard'
import './App.css'

const AdminPage = lazy(() => import('./admin/AdminPage').then((m) => ({ default: m.AdminPage })))

function AppRoutes() {
  const { session, isPlatformAdmin, loading, needsPasswordChange, setNewPassword } = useAuth()
  const [view, setView] = useState<'admin' | 'dashboard'>('admin')

  if (loading) return <p>Chargement…</p>
  if (!session) return <LoginPage />
  if (needsPasswordChange) return <SetPasswordPage onSubmit={setNewPassword} />
  if (!isPlatformAdmin) return <Dashboard />
  return view === 'admin'
    ? <Suspense fallback={<p>Chargement…</p>}><AdminPage onSwitchToDashboard={() => setView('dashboard')} /></Suspense>
    : <Dashboard onSwitchToAdmin={() => setView('admin')} />
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
