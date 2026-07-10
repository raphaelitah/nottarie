export type MailboxProviderName = 'outlook'

export interface MailboxConnectionSummary {
  emailAddress: string
  status: 'active' | 'revoked' | 'error'
}

export interface MailAttachment {
  filename: string
  contentType: string
  contentBase64: string
}

export interface SendMailInput {
  tenantId: string
  utilisateurId: string
  to: string[]
  cc?: string[]
  subject: string
  bodyHtml: string
  attachments?: MailAttachment[]
}

export interface SendMailResult {
  providerMessageId: string | null
}

export interface CreateCalendarEventInput {
  tenantId: string
  utilisateurId: string
  titre: string
  lieu: string | null
  debut: string
  fin: string
  attendees: string[]
}

export interface CreateCalendarEventResult {
  eventId: string
}
