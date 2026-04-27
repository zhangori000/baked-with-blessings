import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

/*
 * Local usage:
 *   1. Set BOOTSTRAP_TEST_CUSTOMER_PASSWORD in .env.local
 *   2. Optionally override BOOTSTRAP_TEST_CUSTOMER_EMAIL / BOOTSTRAP_TEST_CUSTOMER_NAME
 *   3. Run: pnpm bootstrap:test-customer
 *
 * Hosted preview usage:
 *   vercel env run -e preview -- pnpm bootstrap:test-customer
 *
 * This intentionally bypasses the public signup route so test accounts do not
 * require Twilio verification or a deliverable email address.
 */

const defaultEmail = 'test.customer@baked-with-blessings.invalid'
const minPasswordLength = 16

const destroyWithTimeout = async (destroy: () => Promise<void>) => {
  await Promise.race([
    destroy(),
    new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn('Payload shutdown timed out after 2s. Forcing process exit.')
        resolve()
      }, 2000)
    }),
  ])
}

const normalizeEmail = (value: string) => value.trim().toLowerCase()
const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim())

const deploymentEnv = process.env.VERCEL_ENV || 'local'
const allowProduction = process.env.BOOTSTRAP_TEST_CUSTOMER_ALLOW_PRODUCTION === 'true'
const email = normalizeEmail(process.env.BOOTSTRAP_TEST_CUSTOMER_EMAIL || defaultEmail)
const name = process.env.BOOTSTRAP_TEST_CUSTOMER_NAME?.trim() || 'Test Customer'
const password = process.env.BOOTSTRAP_TEST_CUSTOMER_PASSWORD?.trim() || ''

if (deploymentEnv === 'production' && !allowProduction) {
  throw new Error(
    'Refusing to bootstrap a dummy customer in production. Set BOOTSTRAP_TEST_CUSTOMER_ALLOW_PRODUCTION=true only if you intentionally want this.',
  )
}

if (!isEmail(email)) {
  throw new Error(
    `BOOTSTRAP_TEST_CUSTOMER_EMAIL must be an email-shaped login identifier. Received: ${email}`,
  )
}

if (!password) {
  throw new Error('Missing BOOTSTRAP_TEST_CUSTOMER_PASSWORD. Set it before running this script.')
}

if (password.length < minPasswordLength) {
  throw new Error(
    `BOOTSTRAP_TEST_CUSTOMER_PASSWORD must be at least ${minPasswordLength} characters so preview test credentials are not trivial.`,
  )
}

const bootstrap = async () => {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  try {
    const existingCustomers = await payload.find({
      collection: 'customers',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        email: {
          equals: email,
        },
      },
    })

    const existingCustomer = existingCustomers.docs[0]

    if (existingCustomer) {
      const customer = await payload.update({
        id: existingCustomer.id,
        collection: 'customers',
        data: {
          email,
          lockUntil: null,
          loginAttempts: 0,
          name,
          password,
          phone: null,
          phoneVerifiedAt: null,
          username: null,
        },
        overrideAccess: true,
      })

      console.log(`Updated test customer: ${customer.email}`)
      console.log(`Login identifier: ${email}`)
      return
    }

    const customer = await payload.create({
      collection: 'customers',
      data: {
        email,
        name,
        password,
        phone: null,
        phoneVerifiedAt: null,
        username: null,
      },
      overrideAccess: true,
    })

    console.log(`Created test customer: ${customer.email}`)
    console.log(`Login identifier: ${email}`)
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void bootstrap()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
