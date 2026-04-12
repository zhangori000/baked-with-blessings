import type { FieldAccess } from 'payload'

import { isAdminUser } from '@/access/utilities'

export const adminOnlyFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (user) return isAdminUser(user)

  return false
}
