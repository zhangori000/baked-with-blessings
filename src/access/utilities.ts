export type CollectionAuthUser = {
  collection?: null | string
  email?: null | string
  id?: number | string
  name?: null | string
  phone?: null | string
  username?: null | string
}

export const isAdminUser = (user?: CollectionAuthUser | null): boolean =>
  user?.collection === 'admins'

export const isCustomerUser = (user?: CollectionAuthUser | null): boolean =>
  user?.collection === 'customers'
