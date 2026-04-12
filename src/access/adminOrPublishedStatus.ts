import type { Access } from 'payload'

import { isAdminUser } from '@/access/utilities'

export const adminOrPublishedStatus: Access = ({ req: { user } }) => {
  if (user && isAdminUser(user)) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
