/**
 * Collection slugs that products (or checkout) still relate to.
 * Collection-level `admin.hidden: true` on these is a Payload 3.84 footgun:
 * unauthenticated admin bootstrap can fail before login mounts.
 *
 * Field-level `admin.hidden` on product form fields is fine.
 */
export const relatedEcommerceCollectionSlugs = [
  'addresses',
  'carts',
  'transactions',
  'variantOptions',
  'variantTypes',
  'variants',
] as const

export const isCollectionHidden = (collection: {
  admin?: { hidden?: unknown } | null
  slug?: string
}) => collection.admin?.hidden === true
