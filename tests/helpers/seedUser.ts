import { getPayload } from 'payload'

import { FIRST_ADMIN_BOOTSTRAP_CONTEXT } from '../../src/collections/Admins/hooks/requireExplicitFirstAdminBootstrap.js'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: 'admins',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create fresh test user
  await payload.create({
    collection: 'admins',
    context: {
      [FIRST_ADMIN_BOOTSTRAP_CONTEXT]: true,
    },
    data: {
      ...testUser,
      name: 'Dev Admin',
    },
    overrideAccess: true,
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'admins',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}
