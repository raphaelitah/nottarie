import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { RoleNotarial, Utilisateur } from '../types/database'
import { AuthContext } from './authContextObject'

const ACTIVE_ROLE_STORAGE_KEY = 'nottarie:active-roles'

function loadStoredActiveRoles(): Record<string, RoleNotarial> {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [memberships, setMemberships] = useState<Utilisateur[]>([])
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false)
  const [activeRoles, setActiveRoles] = useState<Record<string, RoleNotarial>>(loadStoredActiveRoles)

  const setActiveRole = (tenantId: string, role: RoleNotarial) => {
    setActiveRoles(prev => {
      const next = { ...prev, [tenantId]: role }
      localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    // Capture invite type from URL hash before Supabase clears it
    const isInvite = window.location.hash.includes('type=invite')

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if ((event === 'SIGNED_IN' && isInvite) || event === 'PASSWORD_RECOVERY') {
        setNeedsPasswordChange(true)
      }
      if (event === 'USER_UPDATED') {
        setNeedsPasswordChange(false)
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setMemberships([])
      setIsPlatformAdmin(false)
      return
    }

    supabase
      .from('utilisateurs')
      .select('*, etude:etudes(raison_sociale)')
      .eq('auth_user_id', session.user.id)
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load tenant memberships', error)
          return
        }
        setMemberships(data ?? [])
      })

    supabase
      .from('platform_admins')
      .select('auth_user_id')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsPlatformAdmin(!!data))
  }, [session?.user])

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }

  const setNewPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (!error) setNeedsPasswordChange(false)
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        memberships,
        isPlatformAdmin,
        loading,
        needsPasswordChange,
        signInWithPassword,
        signUp,
        setNewPassword,
        signOut,
        activeRoles,
        setActiveRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
