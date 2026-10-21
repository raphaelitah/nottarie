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

export default app
