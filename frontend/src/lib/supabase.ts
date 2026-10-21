import { createClient, defaultDeriveNeonUrls, SupabaseAuthAdapter } from '@neondatabase/neon-js'

const neonUrl = import.meta.env.VITE_NEON_URL

if (!neonUrl) {
  throw new Error('Missing VITE_NEON_URL env var')
}

const { auth, dataApi } = defaultDeriveNeonUrls(neonUrl)

export const supabase = createClient({
  auth: { url: auth, adapter: SupabaseAuthAdapter() },
  dataApi: { url: dataApi },
})

if (import.meta.env.DEV) {
  // Lets preview tooling sign in via window.supabase.auth.signInWithPassword(...) instead of driving the login form.
  ;(window as unknown as { supabase: typeof supabase }).supabase = supabase
}
