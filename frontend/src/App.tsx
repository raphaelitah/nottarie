import { useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { LoginPage } from './auth/LoginPage'
import { SetPasswordPage } from './auth/SetPasswordPage'
import { Dashboard } from './Dashboard'
import { AdminPage } from './admin/AdminPage'
import './App.css'

function AppRoutes() {
  const { session, isPlatformAdmin, loading, needsPasswordChange, setNewPassword } = useAuth()
  const [view, setView] = useState<'admin' | 'dashboard'>('admin')

  if (loading) return <p>Chargement…</p>
  if (!session) return <LoginPage />
  if (needsPasswordChange) return <SetPasswordPage onSubmit={setNewPassword} />
  if (!isPlatformAdmin) return <Dashboard />
  return view === 'admin'
    ? <AdminPage onSwitchToDashboard={() => setView('dashboard')} />
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
