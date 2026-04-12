import type { Access } from 'payload'

import { isAdminUser } from '@/access/utilities'

export const adminOnly: Access = ({ req: { user } }) => {
  if (user) return isAdminUser(user)

  return false
}
