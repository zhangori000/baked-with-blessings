import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

type EnvRule = {
  key: string
  minLength?: number
  note: string
  placeholders?: RegExp[]
  productionPrefix?: string
  requiredInProduction?: boolean
  sensitiveOnVercel?: boolean
}

const deploymentEnv = process.env.VERCEL_ENV || 'local'
const strict = deploymentEnv === 'production' || process.env.CHECK_ENV_SECURITY_STRICT === 'true'
const allowTestStripeInProduction = process.env.ALLOW_TEST_STRIPE_IN_PRODUCTION === 'true'

const commonPlaceholders = [/^$/, /^change-me$/i, /^changeme$/i, /replace-with/i, /example/i]
const localOnlyValues = [/localhost/i, /127\.0\.0\.1/i]

const requiredProductionRules: EnvRule[] = [
  {
    key: 'PAYLOAD_SECRET',
    minLength: 32,
    note: 'Payload auth/session signing secret.',
    placeholders: commonPlaceholders,
    requiredInProduction: true,
    sensitiveOnVercel: true,
  },
  {
    key: 'DATABASE_URL',
    note: 'Postgres connection string.',
    placeholders: [...commonPlaceholders, ...localOnlyValues, /postgres:postgres/i],
    requiredInProduction: true,
    sensitiveOnVercel: true,
  },
  {
    key: 'PREVIEW_SECRET',
    minLength: 32,
    note: 'Draft preview token.',
    placeholders: [...commonPlaceholders, /^demo/i],
    requiredInProduction: true,
    sensitiveOnVercel: true,
  },
  {
    key: 'PAYLOAD_PUBLIC_SERVER_URL',
    note: 'Canonical Payload/server URL.',
    placeholders: [...commonPlaceholders, ...localOnlyValues],
    requiredInProduction: true,
  },
  {
    key: 'NEXT_PUBLIC_SERVER_URL',
    note: 'Canonical public site URL used by browser code.',
    placeholders: [...commonPlaceholders, ...localOnlyValues],
    requiredInProduction: true,
  },
  {
    key: 'BLOB_READ_WRITE_TOKEN',
    note: 'Vercel Blob read/write token for Payload media uploads.',
    placeholders: commonPlaceholders,
    requiredInProduction: true,
    sensitiveOnVercel: true,
  },
  {
    key: 'STRIPE_SECRET_KEY',
    note: 'Stripe server API key for checkout.',
    placeholders: [...commonPlaceholders, /^sk_test_?$/i],
    productionPrefix: 'sk_live_',
    requiredInProduction: true,
    sensitiveOnVercel: true,
  },
  {
    key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    note: 'Stripe browser publishable key.',
    placeholders: [...commonPlaceholders, /^pk_test_?$/i],
    productionPrefix: 'pk_live_',
    requiredInProduction: true,
  },
  {
    key: 'STRIPE_WEBHOOKS_SIGNING_SECRET',
    note: 'Stripe webhook verification secret.',
    placeholders: [...commonPlaceholders, /^whsec_?$/i],
    requiredInProduction: true,
    sensitiveOnVercel: true,
  },
]

const optionalSensitiveRules: EnvRule[] = [
  {
    key: 'BOOTSTRAP_ADMIN_PASSWORD',
    minLength: 16,
    note: 'Temporary first-admin bootstrap password. Remove after bootstrap if possible.',
    placeholders: commonPlaceholders,
    sensitiveOnVercel: true,
  },
  {
    key: 'BOOTSTRAP_TEST_CUSTOMER_PASSWORD',
    minLength: 16,
    note: 'Temporary dummy customer bootstrap password. Keep out of production unless intentionally testing.',
    placeholders: commonPlaceholders,
    sensitiveOnVercel: true,
  },
  {
    key: 'TWILIO_ACCOUNT_SID',
    note: 'Twilio account identifier.',
    placeholders: commonPlaceholders,
    sensitiveOnVercel: true,
  },
  {
    key: 'TWILIO_AUTH_TOKEN',
    note: 'Twilio auth token.',
    placeholders: commonPlaceholders,
    sensitiveOnVercel: true,
  },
  {
    key: 'TWILIO_VERIFY_SERVICE_SID',
    note: 'Twilio Verify service identifier.',
    placeholders: commonPlaceholders,
    sensitiveOnVercel: true,
  },
  {
    key: 'RESEND_API_KEY',
    note: 'Resend API key.',
    placeholders: commonPlaceholders,
    sensitiveOnVercel: true,
  },
  {
    key: 'RESEND_FROM_EMAIL',
    note: 'Verified sender address used for outbound email.',
    placeholders: [...commonPlaceholders, ...localOnlyValues],
  },
]

const errors: string[] = []
const warnings: string[] = []

const getEnvValue = (key: string) => process.env[key]?.trim() ?? ''

const hasPlaceholderValue = (value: string, rule: EnvRule) =>
  Boolean(value) && rule.placeholders?.some((pattern) => pattern.test(value))

const report = (message: string) => {
  if (strict) {
    errors.push(message)
  } else {
    warnings.push(message)
  }
}

const warn = (message: string) => {
  warnings.push(message)
}

for (const rule of requiredProductionRules) {
  const value = getEnvValue(rule.key)

  if (!value) {
    if (rule.requiredInProduction) {
      report(`${rule.key} is required for a production deployment. ${rule.note}`)
    }
    continue
  }

  if (hasPlaceholderValue(value, rule)) {
    report(`${rule.key} still looks like a placeholder or local-only value. ${rule.note}`)
  }

  if (rule.minLength && value.length < rule.minLength) {
    report(`${rule.key} should be at least ${rule.minLength} characters.`)
  }

  if (strict && rule.productionPrefix && !value.startsWith(rule.productionPrefix)) {
    const isStripeKey =
      rule.key === 'STRIPE_SECRET_KEY' || rule.key === 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    const isStripeTestKey =
      (rule.key === 'STRIPE_SECRET_KEY' && value.startsWith('sk_test_')) ||
      (rule.key === 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY' && value.startsWith('pk_test_'))

    if (allowTestStripeInProduction && isStripeKey && isStripeTestKey) {
      warnings.push(
        `${rule.key} is using a Stripe test-mode value in production because ALLOW_TEST_STRIPE_IN_PRODUCTION=true. Replace it with ${rule.productionPrefix} before accepting real payments.`,
      )
      continue
    }

    errors.push(`${rule.key} should use a ${rule.productionPrefix} production value in production.`)
  }
}

for (const rule of optionalSensitiveRules) {
  const value = getEnvValue(rule.key)

  if (!value) continue

  if (hasPlaceholderValue(value, rule)) {
    warn(`${rule.key} is configured but still looks like a placeholder. ${rule.note}`)
  }

  if (rule.minLength && value.length < rule.minLength) {
    warn(`${rule.key} is configured but shorter than ${rule.minLength} characters.`)
  }
}

const resendApiKey = getEnvValue('RESEND_API_KEY')
const resendFromEmail = getEnvValue('RESEND_FROM_EMAIL')

if (resendApiKey && !resendFromEmail) {
  report('RESEND_FROM_EMAIL is required when RESEND_API_KEY is configured. Payload email falls back without both values.')
}

if (resendFromEmail && !resendApiKey) {
  report('RESEND_API_KEY is required when RESEND_FROM_EMAIL is configured. Payload email falls back without both values.')
}

const allowedPublicEnv = new Set([
  'NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY',
  'NEXT_PUBLIC_SERVER_URL',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_VERCEL_GIT_COMMIT_AUTHOR_LOGIN',
  'NEXT_PUBLIC_VERCEL_GIT_COMMIT_AUTHOR_NAME',
])

const publicSecretLikeKeys = Object.keys(process.env)
  .filter((key) => key.startsWith('NEXT_PUBLIC_'))
  .filter((key) => !allowedPublicEnv.has(key))
  .filter((key) => /SECRET|TOKEN|PASSWORD|PRIVATE|DATABASE|AUTH|API[_-]?KEY/i.test(key))
  .sort()

if (publicSecretLikeKeys.length) {
  report(
    `These NEXT_PUBLIC_* variables look secret-like and would be exposed to browsers: ${publicSecretLikeKeys.join(
      ', ',
    )}`,
  )
}

const sensitiveKeys = [...requiredProductionRules, ...optionalSensitiveRules]
  .filter((rule) => rule.sensitiveOnVercel)
  .map((rule) => rule.key)

if (warnings.length) {
  console.log('Environment security warnings:')
  for (const warning of warnings) {
    console.log(`- ${warning}`)
  }
}

if (errors.length) {
  console.error('Environment security check failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  console.error(
    'Fix these variables before production deploys. For a trusted local diagnostic run, leave VERCEL_ENV unset and omit CHECK_ENV_SECURITY_STRICT.',
  )
  process.exit(1)
}

console.log(
  `Environment security check passed for ${deploymentEnv} mode${warnings.length ? ' with warnings' : ''}.`,
)
console.log(
  `Mark these Vercel variables as Sensitive and rotate any real values that were previously non-sensitive: ${sensitiveKeys.join(
    ', ',
  )}`,
)
