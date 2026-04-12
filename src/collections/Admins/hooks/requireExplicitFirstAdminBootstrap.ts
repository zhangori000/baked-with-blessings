import type { CollectionBeforeChangeHook } from 'payload'

import { ValidationError } from 'payload'

export const FIRST_ADMIN_BOOTSTRAP_CONTEXT = 'allowFirstAdminBootstrap'

export const requireExplicitFirstAdminBootstrap: CollectionBeforeChangeHook = async ({
  operation,
  req,
}) => {
  if (operation !== 'create') {
    return
  }

  const existingAdmins = await req.payload.find({
    collection: 'admins',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
  })

  if (existingAdmins.docs.length > 0) {
    return
  }

  if (req.context?.[FIRST_ADMIN_BOOTSTRAP_CONTEXT] === true) {
    return
  }

  throw new ValidationError(
    {
      collection: 'admins',
      errors: [
        {
          message:
            'The first admin must be created through the private bootstrap script (`pnpm bootstrap:admin`).',
          path: 'email',
        },
      ],
    },
    req.t,
  )
}
