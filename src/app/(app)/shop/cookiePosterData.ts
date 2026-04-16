import type { Media, Product } from '@/payload-types'

export type CookiePosterMeta = {
  bodyFallbackSrc: string
  chips: string[]
  label: string
  labelTone: string
  slug: string
  subtitle: string
  summary: string
  title: string
}

export type CookiePosterAsset = CookiePosterMeta & {
  amount: string
  href: string
  image: Media | null
  productHref: string
  productId?: number
}

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

const resolveSummary = (product: Partial<Product>, meta: CookiePosterMeta) => {
  if (typeof product.meta === 'object' && product.meta?.description?.trim()) {
    return product.meta.description.trim()
  }

  return meta.summary
}

export const cookiePosterMetas: CookiePosterMeta[] = [
  {
    bodyFallbackSrc: '/cookie-singular-brookie.svg',
    chips: ['BROWN BUTTER', 'FUDGY', 'CHOCOLATE'],
    label: 'BROOKIE',
    labelTone: '#f2e35b',
    slug: 'brookie',
    subtitle: 'Brownie cookie mashup',
    summary: 'Brownie depth and chocolate chip chew packed into one oversized cookie.',
    title: 'Brookie',
  },
  {
    bodyFallbackSrc: '/cookie-singular-oreo-cheesecake.svg',
    chips: ['OREO', 'CREAM CHEESE', 'WHITE CHOC'],
    label: 'OREO CHEESECAKE',
    labelTone: '#f08e94',
    slug: 'oreo-cheesecake',
    subtitle: 'Creamy Oreo center',
    summary: 'Cheesecake filling layered into a brown butter Oreo cookie.',
    title: 'Oreo Cheesecake',
  },
  {
    bodyFallbackSrc: '/cookie-singular-apple-snickerdoodle.svg',
    chips: ['APPLE PIE', 'CINNAMON', 'CARAMEL'],
    label: 'APPLE SNICKERDOODLE',
    labelTone: '#f6c58f',
    slug: 'apple-snickerdoodle',
    subtitle: 'Apple pie meets snickerdoodle',
    summary: 'Warm cinnamon sugar with apple pie filling and caramel glaze.',
    title: 'Apple Snickerdoodle',
  },
  {
    bodyFallbackSrc: '/cookie-singular-smores.svg',
    chips: ['GRAHAM', 'MARSHMALLOW', 'CHOCOLATE'],
    label: "S'MORES",
    labelTone: '#f3deb0',
    slug: 'smores',
    subtitle: 'Campfire cookie',
    summary: 'Brown butter dough packed with graham, marshmallow, and chocolate.',
    title: "S'mores",
  },
  {
    bodyFallbackSrc: '/cookie-singular-banana-chocolate-chip-walnut.svg',
    chips: ['BANANA', 'WALNUT', 'CHOC CHIP'],
    label: 'BANANA WALNUT',
    labelTone: '#d8ea94',
    slug: 'banana-choc-chip-walnut',
    subtitle: 'Banana bread cookie',
    summary: 'Toasted walnut crunch and melty chocolate tucked into banana dough.',
    title: 'Banana Choc-Chip Walnut',
  },
  {
    bodyFallbackSrc: '/cookie-singular-cinnamon-roll.svg',
    chips: ['CINNAMON', 'BROWN SUGAR', 'ICING'],
    label: 'CINNAMON ROLL',
    labelTone: '#f0d6a8',
    slug: 'cinnamon-roll',
    subtitle: 'Bakery roll in cookie form',
    summary: 'Swirled brown sugar cinnamon cookie finished with brown butter icing.',
    title: 'Cinnamon Roll',
  },
  {
    bodyFallbackSrc: '/cookie-singular-biscoff.svg',
    chips: ['BISCOFF', 'COOKIE BUTTER', 'SPICE'],
    label: 'BISCOFF',
    labelTone: '#f0c589',
    slug: 'biscoff',
    subtitle: 'Cookie butter loaded',
    summary: 'Warm spiced dough stacked with Biscoff flavor and cookie butter richness.',
    title: 'Biscoff',
  },
  {
    bodyFallbackSrc: '/cookie-singular-banana-crumble.svg',
    chips: ['BANANA', 'CRUMBLE', 'BROWN SUGAR'],
    label: 'BANANA CRUMBLE',
    labelTone: '#e6d98a',
    slug: 'banana-crumble',
    subtitle: 'Soft banana streusel cookie',
    summary: 'Banana-forward dough topped with crumble texture and brown sugar warmth.',
    title: 'Banana Crumble',
  },
  {
    bodyFallbackSrc: '/cookie-singular-chocolate-peanut-butter.svg',
    chips: ['PEANUT BUTTER', 'CHOCOLATE', 'BROWN BUTTER'],
    label: 'PEANUT BUTTER CUP',
    labelTone: '#f2c66c',
    slug: 'peanut-butter-cup',
    subtitle: 'Chocolate peanut butter cookie',
    summary: 'Chocolate dough loaded with peanut butter cup pieces and brown butter richness.',
    title: 'Peanut Butter Cup',
  },
  {
    bodyFallbackSrc: '/cookie-singular-dubai-chocolate.svg',
    chips: ['PISTACHIO', 'KATAIFI', 'CHOCOLATE'],
    label: 'DUBAI CHOCOLATE',
    labelTone: '#d7d28a',
    slug: 'dubai-chocolate',
    subtitle: 'Pistachio chocolate cookie',
    summary: 'A rich chocolate cookie layered with pistachio notes and crunchy texture.',
    title: 'Dubai Chocolate',
  },
  {
    bodyFallbackSrc: '/cookie-singular-salted-caramel-nest.svg',
    chips: ['SALTED', 'CARAMEL', 'CRUNCH'],
    label: 'SALTED CARAMEL',
    labelTone: '#f0c073',
    slug: 'salted-caramel-nest',
    subtitle: 'Salted caramel nest cookie',
    summary: 'Sticky caramel depth with a salted edge and crunchy topping throughout.',
    title: 'Salted Caramel Nest',
  },
  {
    bodyFallbackSrc: '/cookie-singular-strawberry-cheesecake.svg',
    chips: ['STRAWBERRY', 'CHEESECAKE', 'GRAHAM'],
    label: 'STRAWBERRY CHEESECAKE',
    labelTone: '#f3adb4',
    slug: 'strawberry-cheesecake',
    subtitle: 'Berry cheesecake cookie',
    summary: 'Strawberry sweetness and cheesecake richness with a graham-style finish.',
    title: 'Strawberry Cheesecake',
  },
  {
    bodyFallbackSrc: '/cookie-singular-strawberry-matcha.svg',
    chips: ['STRAWBERRY', 'MATCHA', 'WHITE CHOC'],
    label: 'STRAWBERRY MATCHA',
    labelTone: '#d7efaa',
    slug: 'strawberry-matcha',
    subtitle: 'Matcha berry swirl',
    summary: 'Fresh strawberry notes layered with matcha flavor in a bright soft cookie.',
    title: 'Strawberry Matcha',
  },
  {
    bodyFallbackSrc: '/cookie-singular-strawberry-matcha-marble.svg',
    chips: ['STRAWBERRY', 'MATCHA', 'MARBLE'],
    label: 'MATCHA MARBLE',
    labelTone: '#d8efc3',
    slug: 'strawberry-matcha-marble',
    subtitle: 'Marbled berry matcha cookie',
    summary: 'A marbled cookie with strawberry brightness and matcha depth baked together.',
    title: 'Strawberry Matcha Marble',
  },
]

const cookiePosterMetaBySlug = new Map(cookiePosterMetas.map((meta) => [meta.slug, meta]))

export const getCookiePosterMeta = (slug: string) => {
  return cookiePosterMetaBySlug.get(slug)
}

export const buildCookiePosterAsset = (product: Partial<Product>): CookiePosterAsset | null => {
  if (typeof product.slug !== 'string') {
    return null
  }

  const meta = getCookiePosterMeta(product.slug)

  if (!meta) {
    return null
  }

  return {
    ...meta,
    amount: formatAmount(product.priceInUSD),
    href: `/cookies/${meta.slug}`,
    image: normalizeImage(product),
    productHref: `/products/${meta.slug}`,
    productId: typeof product.id === 'number' ? product.id : undefined,
    summary: resolveSummary(product, meta),
    title: product.title || meta.title,
  }
}

export const buildCookiePosterAssets = (products: Partial<Product>[]) => {
  const productsBySlug = new Map(
    products
      .filter((product) => typeof product.slug === 'string')
      .map((product) => [product.slug as string, product]),
  )

  return cookiePosterMetas
    .map((meta) => {
      const product = productsBySlug.get(meta.slug)

      if (!product) {
        return null
      }

      return buildCookiePosterAsset(product)
    })
    .filter((poster): poster is CookiePosterAsset => Boolean(poster))
}
