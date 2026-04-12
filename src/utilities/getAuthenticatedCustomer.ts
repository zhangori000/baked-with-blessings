import type { Payload } from 'payload'

import { isCustomerUser, type CollectionAuthUser } from '@/access/utilities'

export const getAuthenticatedCustomer = async (
  payload: Payload,
  headers: Request['headers'],
): Promise<CollectionAuthUser | null> => {
  const { user } = await payload.auth({ headers })

  return isCustomerUser(user) ? user : null
}
