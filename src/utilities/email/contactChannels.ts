import { parseEmailRecipients } from '@/utilities/email/recipients'

/**
 * The bakery's real, monitored inbox. This is a Gmail account and is DISTINCT
 * from the send-only `hello@bakedwithblessings.com` Resend "from" address (which
 * has no inbox). Because it actually receives mail, it is safe to use as the
 * customer Reply-To and to BCC a copy of customer mail to. It is the main way
 * customers reach a human until there is a paid business mailbox.
 */
export const BAKERY_INBOX = 'bakedwithblessings@gmail.com'

const dedupeEmails = (emails: string[]): string[] => {
  const seen = new Set<string>()

  return emails.filter((email) => {
    const key = email.trim().toLowerCase()
    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

/**
 * Addresses a customer's reply should reach. Defaults to the bakery inbox;
 * override with the CUSTOMER_CONTACT_EMAILS env var (comma/semicolon/newline
 * separated) if more humans should receive replies.
 */
export const getCustomerContactEmails = (): string[] => {
  const fromEnv = parseEmailRecipients(process.env.CUSTOMER_CONTACT_EMAILS)
  return fromEnv.length ? fromEnv : [BAKERY_INBOX]
}

/**
 * Recipients of the owner new-order alert: whatever ORDER_NOTIFICATION_TO lists,
 * always plus the bakery inbox so the main account never misses an order. Stays
 * empty when ORDER_NOTIFICATION_TO is unset, preserving the local-dev behaviour
 * of skipping the owner email entirely.
 */
export const getOwnerNotificationRecipients = (): string[] => {
  const configured = parseEmailRecipients(process.env.ORDER_NOTIFICATION_TO)
  if (!configured.length) {
    return []
  }

  return dedupeEmails([...configured, BAKERY_INBOX])
}
