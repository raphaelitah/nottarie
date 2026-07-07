export type MailboxProviderName = 'outlook'

export interface MailboxConnectionSummary {
  emailAddress: string
  status: 'active' | 'revoked' | 'error'
}

export interface SendMailInput {
  tenantId: string
  utilisateurId: string
  to: string[]
  cc?: string[]
  subject: string
  bodyHtml: string
}

export interface SendMailResult {
  providerMessageId: string | null
}
