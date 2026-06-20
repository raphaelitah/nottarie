import { AuthProvider, useAuth } from './auth/AuthContext'
import { LoginPage } from './auth/LoginPage'
import { Dashboard } from './Dashboard'
import './App.css'

function AppRoutes() {
  const { session, loading } = useAuth()

  if (loading) return <p>Chargement…</p>

  return session ? <Dashboard /> : <LoginPage />
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
