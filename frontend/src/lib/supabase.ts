import { createClient, defaultDeriveNeonUrls, SupabaseAuthAdapter } from '@neondatabase/neon-js'

const neonUrl = import.meta.env.VITE_NEON_URL

if (!neonUrl) {
  throw new Error('Missing VITE_NEON_URL env var')
}

const { auth, dataApi } = defaultDeriveNeonUrls(neonUrl)

export const supabase = createClient({
  // Frontend and Managed Better Auth live on different origins (Pages vs.
  // *.neonauth.*.aws.neon.tech) — without credentials: 'include', the
  // browser drops the session cookie on both the Set-Cookie response and
  // subsequent requests, and the user appears signed in (200 OK) but the
  // session never actually persists. See Neon's JWT plugin docs, "cross-
  // origin requests".
  auth: { url: auth, adapter: SupabaseAuthAdapter({ fetchOptions: { credentials: 'include' } }) },
  dataApi: { url: dataApi },
})

if (import.meta.env.DEV) {
  // Lets preview tooling sign in via window.supabase.auth.signInWithPassword(...) instead of driving the login form.
  ;(window as unknown as { supabase: typeof supabase }).supabase = supabase
}
