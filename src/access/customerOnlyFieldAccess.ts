import type { FieldAccess } from 'payload'

import { isCustomerUser } from '@/access/utilities'

export const customerOnlyFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (user) return isCustomerUser(user)

  return false
}
