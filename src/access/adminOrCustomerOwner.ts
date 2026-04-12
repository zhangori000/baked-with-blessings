import type { Access } from 'payload'

import { isAdminUser } from '@/access/utilities'

export const adminOrCustomerOwner: Access = ({ req: { user } }) => {
  if (user && isAdminUser(user)) {
    return true
  }

  if (user?.id) {
    return {
      customer: {
        equals: user.id,
      },
    }
  }

  return false
}
