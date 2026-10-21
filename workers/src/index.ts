import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './shared/env'

import acteSignature from './routes/acte-signature'
import adminUserAction from './routes/admin-user-action'
import createCalendarEvent from './routes/create-calendar-event'
import documents from './routes/documents'
import generateActe from './routes/generate-acte'
import getEtudeUsers from './routes/get-etude-users'
import inviteUser from './routes/invite-user'
import mailboxDisconnect from './routes/mailbox-disconnect'
import mailboxOauthCallback from './routes/mailbox-oauth-callback'
import mailboxOauthExchange from './routes/mailbox-oauth-exchange'
import mailboxOauthStart from './routes/mailbox-oauth-start'
import sendEmail from './routes/send-email'
import { dbPool } from './shared/db'
import { processOutlookSyncOutbox } from './shared/outlookSync'

const app = new Hono<{ Bindings: Env }>()

// Matches the corsHeaders constant repeated in every Supabase Edge Function
// being ported here (Access-Control-Allow-Origin: *, Allow-Headers:
// authorization, x-client-info, apikey, content-type). mailbox-oauth-callback
// is a plain browser redirect (no CORS needed) but this is harmless there.
app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type'],
  }),
)

app.route('/acte-signature', acteSignature)
app.route('/admin-user-action', adminUserAction)
app.route('/create-calendar-event', createCalendarEvent)
app.route('/documents', documents)
app.route('/generate-acte', generateActe)
app.route('/get-etude-users', getEtudeUsers)
app.route('/invite-user', inviteUser)
app.route('/mailbox-disconnect', mailboxDisconnect)
app.route('/mailbox-oauth-callback', mailboxOauthCallback)
app.route('/mailbox-oauth-exchange', mailboxOauthExchange)
app.route('/mailbox-oauth-start', mailboxOauthStart)
app.route('/send-email', sendEmail)

// Manual trigger for testing the outbox processor without waiting for the
// cron schedule. Guarded by a shared secret (not caller identity, since it
// does no tenant-scoped work of its own, only drains a backend-internal
// queue) to keep it off the open internet.
app.post('/internal/process-outlook-sync', async (c) => {
  if (c.req.header('x-webhook-secret') !== c.env.OUTLOOK_SYNC_WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const pool = dbPool(c.env.DATABASE_URL)
  const result = await processOutlookSyncOutbox(pool, {
    encryptionKey: c.env.DOCUMENTS_ENCRYPTION_KEY,
    outlookClientId: c.env.OUTLOOK_CLIENT_ID,
    outlookClientSecret: c.env.OUTLOOK_CLIENT_SECRET,
  })
  return c.json(result)
})

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env) {
    const pool = dbPool(env.DATABASE_URL)
    await processOutlookSyncOutbox(pool, {
      encryptionKey: env.DOCUMENTS_ENCRYPTION_KEY,
      outlookClientId: env.OUTLOOK_CLIENT_ID,
      outlookClientSecret: env.OUTLOOK_CLIENT_SECRET,
    })
  },
}
