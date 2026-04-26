import type { Access } from 'payload'

import { isAdminUser } from '@/access/utilities'

export const adminOrVisible: Access = ({ req: { user } }) => {
  if (isAdminUser(user)) return true

  return {
    moderationStatus: {
      equals: 'visible',
    },
  }
}

export const authenticatedOnly: Access = ({ req: { user } }) => Boolean(user)
