import {
  getFirstConfiguredEmailRecipients,
  parseEmailRecipients,
} from '@/utilities/email/recipients'

/**
 * The bakery's real, monitored inbox. This is a Gmail account and is DISTINCT
 * from the send-only `hello@bakedwithblessings.com` Resend "from" address (which
 * has no inbox). Because it actually receives mail, it is safe to use as the
 * customer Reply-To and to BCC a copy of customer mail to. It is the main way
 * customers reach a human until there is a paid business mailbox.
 */
export const BAKERY_INBOX = 'bakedwithblessings@gmail.com'

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

  // Reuse the parser's trim-aware, case-insensitive dedup instead of a second copy.
  return parseEmailRecipients([...configured, BAKERY_INBOX].join(','))
}

/**
 * Recipients of a new-review alert. The review-specific list wins when set,
 * then falls back to the contact and order lists. Any configured route always
 * includes the bakery inbox so review feedback reaches the monitored account.
 */
export const getOwnerReviewNotificationRecipients = (): string[] => {
  const configured = getFirstConfiguredEmailRecipients(
    process.env.REVIEW_NOTIFICATION_TO,
    process.env.CONTACT_NOTIFICATION_TO,
    process.env.ORDER_NOTIFICATION_TO,
  )

  if (!configured.length) {
    return []
  }

  return parseEmailRecipients([...configured, BAKERY_INBOX].join(','))
}
