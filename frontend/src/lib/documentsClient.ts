import { supabase } from './supabase'
import { WORKER_URL } from './workerFunctions'

/**
 * Drop-in replacement for `supabase.storage.from('documents')`, backed by
 * the Cloudflare Worker's /documents routes (R2 under the hood). Keeps the
 * same {data, error} shape so call sites barely change.
 */
async function authHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

export const documentsStorage = {
  async upload(path: string, file: File | Blob) {
    const headers = await authHeader()
    const contentType = 'type' in file ? file.type : undefined
    const url = `${WORKER_URL}/documents/upload?path=${encodeURIComponent(path)}${contentType ? `&contentType=${encodeURIComponent(contentType)}` : ''}`
    const response = await fetch(url, { method: 'POST', headers, body: file })
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: `Upload failed (${response.status})` }))
      return { error: { message: body.error ?? `Upload failed (${response.status})` } }
    }
    return { error: null }
  },

  async createSignedUrl(path: string, expiresInSeconds: number) {
    const headers = await authHeader()
    const response = await fetch(`${WORKER_URL}/documents/signed-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ path, expiresInSeconds }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: `Signed URL failed (${response.status})` }))
      return { data: null, error: { message: body.error ?? `Signed URL failed (${response.status})` } }
    }
    const data = await response.json()
    return { data: { signedUrl: data.signedUrl as string }, error: null }
  },

  async remove(paths: string[]) {
    const headers = await authHeader()
    for (const path of paths) {
      const response = await fetch(`${WORKER_URL}/documents/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ path }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: `Delete failed (${response.status})` }))
        return { error: { message: body.error ?? `Delete failed (${response.status})` } }
      }
    }
    return { error: null }
  },
}
