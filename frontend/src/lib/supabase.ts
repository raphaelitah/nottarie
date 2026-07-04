import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY env vars')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

if (import.meta.env.DEV) {
  // Lets preview tooling sign in via window.supabase.auth.signInWithPassword(...) instead of driving the login form.
  ;(window as unknown as { supabase: typeof supabase }).supabase = supabase
}
