import { createContext } from 'react'
import type { RoleNotarial, Utilisateur } from '../types/database'

export interface NeonAuthUser {
  id: string
  email?: string
}

export interface NeonAuthSession {
  user: NeonAuthUser
}

export interface AuthState {
  session: NeonAuthSession | null
  user: NeonAuthUser | null
  memberships: Utilisateur[]
  isPlatformAdmin: boolean
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  /** Role an administrateur is currently previewing the app as, per étude (EF-ROL testing aid). */
  activeRoles: Record<string, RoleNotarial>
  setActiveRole: (tenantId: string, role: RoleNotarial) => void
}

export const AuthContext = createContext<AuthState | undefined>(undefined)
