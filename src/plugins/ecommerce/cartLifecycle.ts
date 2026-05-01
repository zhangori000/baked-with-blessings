import type { CollectionBeforeChangeHook } from 'payload'
import { ValidationError } from 'payload'

type CartLifecycleData = {
  items?: unknown
}

type CartLifecycleDocument = {
  purchasedAt?: null | string
}

export const preventPurchasedCartItemChanges: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update' || !data || !originalDoc) {
    return data
  }

  const purchasedAt = (originalDoc as CartLifecycleDocument).purchasedAt
  const itemsWereTouched = 'items' in (data as CartLifecycleData)

  if (!purchasedAt || !itemsWereTouched) {
    return data
  }

  throw new ValidationError(
    {
      collection: 'carts',
      errors: [
        {
          message: 'This cart has already been purchased. Start a new cart before changing items.',
          path: 'items',
        },
      ],
    },
    req.t,
  )
}
