import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOrSelf } from '@/access/adminOrSelf'
import { isAdminUser } from '@/access/utilities'

import { requireExplicitFirstAdminBootstrap } from './hooks/requireExplicitFirstAdminBootstrap'

export const Admins: CollectionConfig = {
  slug: 'admins',
  access: {
    admin: ({ req: { user } }) => isAdminUser(user),
    create: adminOnly,
    delete: adminOnly,
    read: adminOrSelf,
    unlock: adminOnly,
    update: adminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    group: 'Access',
    useAsTitle: 'name',
  },
  auth: {
    lockTime: 15 * 60 * 1000,
    maxLoginAttempts: 12,
    tokenExpiration: 2592000,
    useSessions: false,
  },
  hooks: {
    beforeChange: [requireExplicitFirstAdminBootstrap],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
}
