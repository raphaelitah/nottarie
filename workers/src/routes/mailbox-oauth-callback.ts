import { Hono } from 'hono'
import type { Env } from '../shared/env'

// This is the Azure-registered redirect URI itself: Azure sends the browser
// here directly (a top-level GET navigation) with ?code=&state= or
// ?error=&error_description=. It carries no Authorization header (the
// browser navigated here, it didn't call it), and the code_verifier needed
// to finish the exchange only ever exists in the frontend's sessionStorage —
// so this function can't complete the token exchange itself. It just
// forwards everything to the frontend, which pairs the forwarded code/state
// with its stored verifier and calls mailbox-oauth-exchange (authenticated).
const app = new Hono<{ Bindings: Env }>()

app.get('/', (c) => {
  const configuredFrontendUrl = c.env.FRONTEND_URL
  if (!configuredFrontendUrl) {
    return c.text(
      "Configuration incomplète : le secret FRONTEND_URL n'est pas défini sur ce projet Supabase.",
      500,
    )
  }

  const url = new URL(c.req.url)
  const frontendUrl = new URL(configuredFrontendUrl)

  frontendUrl.searchParams.set('mailbox_oauth', '1')
  for (const key of ['code', 'state', 'error', 'error_description']) {
    const value = url.searchParams.get(key)
    if (value) frontendUrl.searchParams.set(key, value)
  }

  return c.redirect(frontendUrl.toString(), 302)
})

export default app
