export type CollectionAuthUser = {
  collection?: null | string
  email?: null | string
  emailOk?: boolean | null
  id?: number | string
  name?: null | string
  phone?: null | string
  smsOk?: boolean | null
  username?: null | string
}

export const isAdminUser = (user?: CollectionAuthUser | null): boolean =>
  user?.collection === 'admins'

export const isCustomerUser = (user?: CollectionAuthUser | null): boolean =>
  user?.collection === 'customers'
