import { AuthProvider, useAuth } from './auth/AuthContext'
import { LoginPage } from './auth/LoginPage'
import { SetPasswordPage } from './auth/SetPasswordPage'
import { Dashboard } from './Dashboard'
import { AdminPage } from './admin/AdminPage'
import './App.css'

function AppRoutes() {
  const { session, isPlatformAdmin, loading, needsPasswordChange, setNewPassword } = useAuth()

  if (loading) return <p>Chargement…</p>
  if (!session) return <LoginPage />
  if (needsPasswordChange) return <SetPasswordPage onSubmit={setNewPassword} />
  if (isPlatformAdmin) return <AdminPage />
  return <Dashboard />
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
