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
  /** Graph category to tag the event with, e.g. "Nottarie - Étude" for étude-wide events. */
  category?: string
  /** Graph structured recurrence, when the source evenement has an rrule Nottarie can translate. */
  recurrence?: GraphRecurrence
}

export interface CreateCalendarEventResult {
  eventId: string
}

export interface UpdateCalendarEventInput {
  tenantId: string
  utilisateurId: string
  eventId: string
  titre: string
  lieu: string | null
  debut: string
  fin: string
  category?: string
  recurrence?: GraphRecurrence
}

export interface DeleteCalendarEventInput {
  tenantId: string
  utilisateurId: string
  eventId: string
}

/** Subset of Microsoft Graph's event recurrence object this app can produce from an rrule. */
export interface GraphRecurrence {
  pattern: {
    type: 'daily' | 'weekly' | 'absoluteMonthly'
    interval: number
    daysOfWeek?: string[]
    dayOfMonth?: number
  }
  range: {
    type: 'endDate' | 'numbered' | 'noEnd'
    startDate: string
    endDate?: string
    numberOfOccurrences?: number
  }
}
