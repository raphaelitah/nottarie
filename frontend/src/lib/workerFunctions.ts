import { supabase } from './supabase'

/** Base URL of the Cloudflare Worker that replaces Supabase Edge Functions. */
export const WORKER_URL = import.meta.env.VITE_WORKER_URL as string

interface InvokeResult<T = unknown> {
  data: T | null
  error: { message: string; context?: Response } | null
}

/**
 * Drop-in replacement for `supabase.functions.invoke(name, { body })`, so call
 * sites only need their import/call changed, not their error-handling shape.
 */
export async function invokeWorkerFunction<T = unknown>(
  name: string,
  options: { body?: unknown; headers?: Record<string, string> } = {}
): Promise<InvokeResult<T>> {
  const { data: { session } } = await supabase.auth.getSession()
  try {
    const response = await fetch(`${WORKER_URL}/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...options.headers,
      },
      body: JSON.stringify(options.body ?? {}),
    })
    if (!response.ok) {
      return { data: null, error: { message: `Worker function '${name}' failed (${response.status})`, context: response } }
    }
    const data = await response.json()
    return { data, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : String(err) } }
  }
}
