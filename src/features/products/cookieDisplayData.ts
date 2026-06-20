import type { Media, Product } from '@/payload-types'
import { extractRichTextPlainText } from '@/utilities/extractRichTextPlainText'

export type CookieInfoRichText = {
  root?: {
    children?: Array<Record<string, unknown>>
  }
}

export type CookiePosterMeta = {
  bodyFallbackSrc: string
  receiptBody: CookieInfoRichText
  slug: string
  summary: string
  title: string
}

export type CookiePosterAsset = CookiePosterMeta & {
  /** Variant added when a surface adds to cart without a size picker (the carousel). */
  addToCartSizeLabel?: null | string
  addToCartVariantId?: null | number
  allergens: string[]
  amount: string
  canBuyCatering?: boolean
  canBuyIndividually?: boolean
  href: string
  image: Media | null
  /** Mirrors products.individualAvailability: 'always' = standing menu, 'rotation' = gated by the active rotation. */
  individualAvailability?: Product['individualAvailability'] | null
  infoButtonLabel: string
  isMonthlyFlavor?: boolean
  lockedDescription?: string
  lockedLabel?: string
  menuHref?: string
  menuLinkLabel?: string
  monthlyFlavorLabel?: string
  productId?: number
}

const ALLERGENS_BY_SLUG: Record<string, string[]> = {
  'apple-snickerdoodle': ['wheat', 'eggs', 'milk'],
  'banana-choc-chip-walnut': ['wheat', 'eggs', 'milk', 'soy', 'tree nuts (walnut)'],
  'banana-crumble': ['wheat', 'eggs', 'milk'],
  biscoff: ['wheat', 'eggs', 'milk', 'soy'],
  brookie: ['wheat', 'eggs', 'milk', 'soy'],
  'cinnamon-roll': ['wheat', 'eggs', 'milk'],
  'dubai-chocolate': ['wheat', 'eggs', 'milk', 'soy', 'tree nuts (pistachio)'],
  'oreo-cheesecake': ['wheat', 'eggs', 'milk', 'soy'],
  'peanut-butter-cup': ['wheat', 'eggs', 'milk', 'soy', 'peanuts'],
  'salted-caramel-nest': ['wheat', 'eggs', 'milk', 'soy'],
  smores: ['wheat', 'eggs', 'milk', 'soy'],
  'strawberry-cheesecake': ['wheat', 'eggs', 'milk', 'soy'],
  'strawberry-matcha': ['wheat', 'eggs', 'milk', 'soy'],
  'strawberry-matcha-marble': ['wheat', 'eggs', 'milk', 'soy'],
}

const FALLBACK_ALLERGENS = ['wheat', 'eggs', 'milk']
const defaultInfoButtonLabel = 'Info'

export const getCookieAllergens = (slug: string): string[] =>
  ALLERGENS_BY_SLUG[slug] ?? FALLBACK_ALLERGENS

const createTextNode = (text: string, bold = false) => ({
  detail: 0,
  format: bold ? 1 : 0,
  mode: 'normal' as const,
  style: '',
  text,
  type: 'text' as const,
  version: 1,
})

const createParagraph = (children: ReturnType<typeof createTextNode>[]) => ({
  children,
  direction: 'ltr' as const,
  format: '',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  type: 'paragraph' as const,
  version: 1,
})

const createFallbackReceiptBody = (summary: string): CookieInfoRichText => ({
  root: {
    children: [
      createParagraph([createTextNode(summary)]),
      createParagraph([createTextNode('Best served warm when possible.')]),
      createParagraph([
        createTextNode('Allergy: ', true),
        createTextNode(
          'baked in a shared kitchen with wheat, milk, eggs, soy, peanuts, and tree nuts.',
        ),
      ]),
    ],
  },
})

const formatAmount = (priceInUSD?: number | null) => {
  if (typeof priceInUSD !== 'number') {
    return 'TBD'
  }

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(priceInUSD / 100)
}

const normalizeImage = (product: Partial<Product>): Media | null => {
  if (!product.gallery?.[0] || typeof product.gallery[0] === 'string') {
    return null
  }

  const firstImage = product.gallery[0].image

  return firstImage && typeof firstImage === 'object' ? firstImage : null
}

const formatTitleFromSlug = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const resolveProductSummary = (product: Partial<Product>) => {
  if (typeof product.meta === 'object' && product.meta?.description?.trim()) {
    return product.meta.description.trim()
  }

  const plainDescription = extractRichTextPlainText(product.description)

  return plainDescription
}

const resolveSummary = (product: Partial<Product>, meta: CookiePosterMeta) => {
  return resolveProductSummary(product) || meta.summary
}

const resolveInfoBody = (product: Partial<Product>, fallback: CookieInfoRichText) => {
  const productInfo =
    'poster' in product && typeof product.poster === 'object' ? product.poster : null

  return hasReceiptBody(productInfo?.receiptBody) ? productInfo.receiptBody : fallback
}

export const hasReceiptBody = (value: unknown): value is CookieInfoRichText =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'root' in value &&
      value.root &&
      typeof value.root === 'object',
  )

const cookieFallbacks = [
  {
    bodyFallbackSrc: '/cookie-singular-brookie.svg',
    slug: 'brookie',
    summary: 'Brownie depth and chocolate chip chew packed into one oversized cookie.',
    title: 'Brookie',
  },
  {
    bodyFallbackSrc: '/cookie-singular-oreo-cheesecake.svg',
    slug: 'oreo-cheesecake',
    summary: 'Cheesecake filling layered into a brown butter Oreo cookie.',
    title: 'Oreo Cheesecake',
  },
  {
    bodyFallbackSrc: '/cookie-singular-apple-snickerdoodle.svg',
    slug: 'apple-snickerdoodle',
    summary: 'Warm cinnamon sugar with apple pie filling and caramel glaze.',
    title: 'Apple Snickerdoodle',
  },
  {
    bodyFallbackSrc: '/cookie-singular-smores.svg',
    slug: 'smores',
    summary: 'Brown butter dough packed with graham, marshmallow, and chocolate.',
    title: "S'mores",
  },
  {
    bodyFallbackSrc: '/cookie-singular-banana-chocolate-chip-walnut.svg',
    slug: 'banana-choc-chip-walnut',
    summary: 'Toasted walnut crunch and melty chocolate tucked into banana dough.',
    title: 'Banana Choc-Chip Walnut',
  },
  {
    bodyFallbackSrc: '/cookie-singular-cinnamon-roll.svg',
    slug: 'cinnamon-roll',
    summary: 'Swirled brown sugar cinnamon cookie finished with brown butter icing.',
    title: 'Cinnamon Roll',
  },
  {
    bodyFallbackSrc: '/cookie-singular-biscoff.svg',
    slug: 'biscoff',
    summary: 'Warm spiced dough stacked with Biscoff flavor and cookie butter richness.',
    title: 'Biscoff',
  },
  {
    bodyFallbackSrc: '/cookie-singular-banana-crumble.svg',
    slug: 'banana-crumble',
    summary: 'Banana-forward dough topped with crumble texture and brown sugar warmth.',
    title: 'Banana Crumble',
  },
  {
    bodyFallbackSrc: '/cookie-singular-chocolate-peanut-butter.svg',
    slug: 'peanut-butter-cup',
    summary: 'Chocolate dough loaded with peanut butter cup pieces and brown butter richness.',
    title: 'Peanut Butter Cup',
  },
  {
    bodyFallbackSrc: '/cookie-singular-dubai-chocolate.svg',
    slug: 'dubai-chocolate',
    summary: 'A rich chocolate cookie layered with pistachio notes and crunchy texture.',
    title: 'Dubai Chocolate',
  },
  {
    bodyFallbackSrc: '/cookie-singular-salted-caramel-nest.svg',
    slug: 'salted-caramel-nest',
    summary: 'Sticky caramel depth with a salted edge and crunchy topping throughout.',
    title: 'Salted Caramel Nest',
  },
  {
    bodyFallbackSrc: '/cookie-singular-strawberry-cheesecake.svg',
    slug: 'strawberry-cheesecake',
    summary: 'Strawberry sweetness and cheesecake richness with a graham-style finish.',
    title: 'Strawberry Cheesecake',
  },
  {
    bodyFallbackSrc: '/cookie-singular-strawberry-matcha.svg',
    slug: 'strawberry-matcha',
    summary: 'Fresh strawberry notes layered with matcha flavor in a bright soft cookie.',
    title: 'Strawberry Matcha',
  },
  {
    bodyFallbackSrc: '/cookie-singular-strawberry-matcha-marble.svg',
    slug: 'strawberry-matcha-marble',
    summary: 'A marbled cookie with strawberry brightness and matcha depth baked together.',
    title: 'Strawberry Matcha Marble',
  },
] satisfies Array<Omit<CookiePosterMeta, 'receiptBody'>>

export const cookiePosterMetas: CookiePosterMeta[] = cookieFallbacks.map((fallback) => ({
  ...fallback,
  receiptBody: createFallbackReceiptBody(fallback.summary),
}))

const cookiePosterMetaBySlug = new Map(cookiePosterMetas.map((meta) => [meta.slug, meta]))

export const getCookiePosterMeta = (slug: string) => {
  return cookiePosterMetaBySlug.get(slug)
}

const buildProductCookieMeta = (product: Partial<Product> & { slug: string }): CookiePosterMeta => {
  const title = product.title || formatTitleFromSlug(product.slug)
  const summary = resolveProductSummary(product) || `Fresh bakery flavor: ${title}.`

  return {
    bodyFallbackSrc: '/cookie-singular-brookie.svg',
    receiptBody: createFallbackReceiptBody(summary),
    slug: product.slug,
    summary,
    title,
  }
}

export const buildCookiePosterAsset = (product: Partial<Product>): CookiePosterAsset | null => {
  if (typeof product.slug !== 'string') {
    return null
  }

  const meta = getCookiePosterMeta(product.slug) ?? buildProductCookieMeta({ ...product, slug: product.slug })

  return {
    ...meta,
    allergens: getCookieAllergens(meta.slug),
    amount: formatAmount(product.priceInUSD),
    canBuyCatering: true,
    canBuyIndividually: true,
    href: `/cookies/${meta.slug}`,
    individualAvailability: product.individualAvailability ?? null,
    image: normalizeImage(product),
    infoButtonLabel: defaultInfoButtonLabel,
    isMonthlyFlavor: true,
    lockedDescription:
      'Outside the current rotation, this flavor is available through larger catering batches only. Making a separate dough batch for one small order creates too much waste, and the bakery is not set up with the equipment or production space to do that efficiently yet.',
    lockedLabel: 'Catering only',
    // Where "on the menu" / "View on menu" points. Focaccia lives on the menu as
    // its tray; everything else lands on the menu (regular orders) tab.
    menuHref: meta.slug === 'roasted-pesto-focaccia' ? '/menu#bundle-focaccia-tray' : '/menu',
    menuLinkLabel: 'View on menu',
    monthlyFlavorLabel: "This week's special",
    productId: typeof product.id === 'number' ? product.id : undefined,
    receiptBody: resolveInfoBody(product, meta.receiptBody),
    summary: resolveSummary(product, meta),
    title: product.title || meta.title,
  }
}

export const buildCookiePosterAssets = (products: Partial<Product>[]) => {
  return products
    .map((product) => buildCookiePosterAsset(product))
    .filter((poster): poster is CookiePosterAsset => Boolean(poster))
}
