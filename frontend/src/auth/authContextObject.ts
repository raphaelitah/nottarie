import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { RoleNotarial, Utilisateur } from '../types/database'

export interface AuthState {
  session: Session | null
  user: User | null
  memberships: Utilisateur[]
  isPlatformAdmin: boolean
  loading: boolean
  needsPasswordChange: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  setNewPassword: (password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  /** Role an administrateur is currently previewing the app as, per étude (EF-ROL testing aid). */
  activeRoles: Record<string, RoleNotarial>
  setActiveRole: (tenantId: string, role: RoleNotarial) => void
}

export const AuthContext = createContext<AuthState | undefined>(undefined)
