// This is the Azure-registered redirect URI itself: Azure sends the browser
// here directly (a top-level GET navigation) with ?code=&state= or
// ?error=&error_description=. It carries no Authorization header (the
// browser navigated here, it didn't call it), and the code_verifier needed
// to finish the exchange only ever exists in the frontend's sessionStorage —
// so this function can't complete the token exchange itself. It just
// forwards everything to the frontend, which pairs the forwarded code/state
// with its stored verifier and calls mailbox-oauth-exchange (authenticated).
Deno.serve((req) => {
  const configuredFrontendUrl = Deno.env.get('FRONTEND_URL')
  if (!configuredFrontendUrl) {
    return new Response(
      "Configuration incomplète : le secret FRONTEND_URL n'est pas défini sur ce projet Supabase.",
      { status: 500 },
    )
  }

  const url = new URL(req.url)
  const frontendUrl = new URL(configuredFrontendUrl)

  frontendUrl.searchParams.set('mailbox_oauth', '1')
  for (const key of ['code', 'state', 'error', 'error_description']) {
    const value = url.searchParams.get(key)
    if (value) frontendUrl.searchParams.set(key, value)
  }

  return new Response(null, { status: 302, headers: { Location: frontendUrl.toString() } })
})
