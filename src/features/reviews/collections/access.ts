import type { Access } from 'payload'

import { isAdminUser } from '@/access/utilities'

export const adminOrPublishedReview: Access = ({ req: { user } }) => {
  if (isAdminUser(user)) return true

  return {
    publicStatus: {
      equals: 'published',
    },
  }
}
