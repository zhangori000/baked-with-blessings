/**
 * Tags non-production emails so they can never be confused with a real customer
 * order or notification. Production emails pass through untouched.
 *
 * Detection:
 *   - VERCEL_ENV === 'production' → production (no tag)
 *   - VERCEL_ENV === 'preview'    → '[PREVIEW]' subject prefix + yellow banner
 *   - everything else (local dev, missing env) → '[LOCAL DEV]' prefix + red banner
 */

type EmailEnvironment = 'local' | 'preview' | 'production'

const detectEmailEnvironment = (): EmailEnvironment => {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase()
  if (vercelEnv === 'production') return 'production'
  if (vercelEnv === 'preview') return 'preview'
  return 'local'
}

const subjectPrefix: Record<EmailEnvironment, string> = {
  local: '[LOCAL DEV] ',
  preview: '[PREVIEW] ',
  production: '',
}

const textBanner: Record<EmailEnvironment, string> = {
  local:
    '⚠️ LOCAL DEV — NOT A REAL ORDER. This email was sent from a local development environment. Do not act on it as a real customer transaction.\n\n',
  preview:
    '⚠️ PREVIEW ENVIRONMENT — NOT A REAL ORDER. This email was sent from the preview/staging deployment. Do not act on it as a real customer transaction.\n\n',
  production: '',
}

const htmlBanner: Record<EmailEnvironment, string> = {
  local:
    '<div style="background:#fde2e1;border:2px solid #c14d2a;color:#7a1f0e;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.4;"><strong>⚠️ LOCAL DEV — NOT A REAL ORDER.</strong><br/>This email was sent from a local development environment. Do not act on it as a real customer transaction.</div>',
  preview:
    '<div style="background:#fff3cd;border:2px solid #d4a72c;color:#664d03;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.4;"><strong>⚠️ PREVIEW ENVIRONMENT — NOT A REAL ORDER.</strong><br/>This email was sent from the preview/staging deployment. Do not act on it as a real customer transaction.</div>',
  production: '',
}

type EmailEnvelopeShape = {
  html?: null | string
  subject: string
  text?: null | string
}

/**
 * Wrap an email envelope so non-production sends are visibly tagged.
 * Pass through the result to `payload.sendEmail({ ... })`.
 */
export const decorateEmailEnvelope = <T extends EmailEnvelopeShape>(envelope: T): T => {
  const env = detectEmailEnvironment()
  if (env === 'production') return envelope

  const next = { ...envelope } as T & EmailEnvelopeShape
  next.subject = `${subjectPrefix[env]}${envelope.subject}`
  if (typeof envelope.text === 'string') {
    next.text = `${textBanner[env]}${envelope.text}`
  }
  if (typeof envelope.html === 'string') {
    next.html = `${htmlBanner[env]}${envelope.html}`
  }
  return next
}
