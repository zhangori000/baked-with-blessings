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
 * Developer/owner monitoring inbox. Always included on owner alerts alongside
 * the bakery inbox so a misconfigured env var cannot drop the only copy.
 */
export const OWNER_MONITOR_INBOX = 'zhangorienspam@gmail.com'

/** Co-owner inbox. Always included on owner alerts with the other two. */
export const CO_OWNER_INBOX = 'adultkaylaluo@gmail.com'

/**
 * Hard-required destinations for every customer→owner alert. These three always
 * receive contact, review, feature-request, and (when enabled) order alerts.
 * Env lists may still add more people; they cannot remove these.
 */
export const ALWAYS_OWNER_ALERT_RECIPIENTS = [
  BAKERY_INBOX,
  OWNER_MONITOR_INBOX,
  CO_OWNER_INBOX,
] as const

const withAlwaysOwnerAlertRecipients = (configured: string[] = []): string[] =>
  parseEmailRecipients([...configured, ...ALWAYS_OWNER_ALERT_RECIPIENTS].join(','))

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
 * always plus the bakery + owner-monitor inboxes so the main accounts never
 * miss an order. Stays empty when ORDER_NOTIFICATION_TO is unset, preserving
 * the local-dev behaviour of skipping the owner email entirely.
 */
export const getOwnerNotificationRecipients = (): string[] => {
  const configured = parseEmailRecipients(process.env.ORDER_NOTIFICATION_TO)
  if (!configured.length) {
    return []
  }

  return withAlwaysOwnerAlertRecipients(configured)
}

/**
 * Recipients of a website contact-form alert. CONTACT_NOTIFICATION_TO wins when
 * set, then falls back to ORDER_NOTIFICATION_TO. Env may add co-owners; the
 * bakery + owner-monitor inboxes are always included so a blank Vercel env
 * cannot drop customer messages.
 */
export const getOwnerContactNotificationRecipients = (): string[] => {
  const configured = getFirstConfiguredEmailRecipients(
    process.env.CONTACT_NOTIFICATION_TO,
    process.env.ORDER_NOTIFICATION_TO,
  )

  return withAlwaysOwnerAlertRecipients(configured)
}

/**
 * Recipients of a feature-request alert. FEATURE_REQUEST_NOTIFICATION_TO wins
 * when set, then falls back to ORDER_NOTIFICATION_TO. Always includes the
 * bakery + owner-monitor inboxes.
 */
export const getOwnerFeatureRequestNotificationRecipients = (): string[] => {
  const configured = getFirstConfiguredEmailRecipients(
    process.env.FEATURE_REQUEST_NOTIFICATION_TO,
    process.env.ORDER_NOTIFICATION_TO,
  )

  return withAlwaysOwnerAlertRecipients(configured)
}

/**
 * Recipients of a new-review alert. The review-specific list wins when set,
 * then falls back to the contact and order lists. The bakery + owner-monitor
 * inboxes are always included, including local development and test sends.
 */
export const getOwnerReviewNotificationRecipients = (): string[] => {
  const configured = getFirstConfiguredEmailRecipients(
    process.env.REVIEW_NOTIFICATION_TO,
    process.env.CONTACT_NOTIFICATION_TO,
    process.env.ORDER_NOTIFICATION_TO,
  )

  return withAlwaysOwnerAlertRecipients(configured)
}
