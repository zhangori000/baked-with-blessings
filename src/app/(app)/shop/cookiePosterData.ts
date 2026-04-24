import type { Media, Product } from '@/payload-types'

export type CookiePosterMeta = {
  bodyFallbackSrc: string
  chips: string[]
  infoButtonLabel: string
  ingredients: Array<{
    detail?: string
    name: string
  }>
  ingredientsIntro: string
  ingredientsNoteTitle: string
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

const cookiePosterDisplayPriceInUSD = 750

const defaultInfoButtonLabel = 'Info'
const defaultIngredientsNoteTitle = 'Baker Notes'

const toFallbackIngredients = (chips: string[]) =>
  chips.map((chip) => ({
    detail: 'featured note',
    name: chip
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  }))

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
  const poster = 'poster' in product && typeof product.poster === 'object' ? product.poster : null

  if (poster?.summary?.trim()) {
    return poster.summary.trim()
  }

  if (typeof product.meta === 'object' && product.meta?.description?.trim()) {
    return product.meta.description.trim()
  }

  return meta.summary
}

const resolvePosterChips = (product: Partial<Product>, meta: CookiePosterMeta) => {
  const poster = 'poster' in product && typeof product.poster === 'object' ? product.poster : null
  const chips =
    poster?.chips
      ?.map((chip) => (typeof chip === 'object' && chip?.text ? chip.text.trim() : ''))
      .filter(Boolean) ?? []

  return chips.length > 0 ? chips : meta.chips
}

const resolvePosterIngredients = (product: Partial<Product>, meta: CookiePosterMeta) => {
  const poster = 'poster' in product && typeof product.poster === 'object' ? product.poster : null
  const ingredients =
    poster?.ingredients
      ?.map((ingredient) => {
        if (!ingredient || typeof ingredient !== 'object' || !ingredient.name?.trim()) {
          return null
        }

        return {
          detail: ingredient.detail?.trim() || undefined,
          name: ingredient.name.trim(),
        }
      })
      .filter((ingredient): ingredient is NonNullable<typeof ingredient> => Boolean(ingredient)) ?? []

  return ingredients.length > 0 ? ingredients : meta.ingredients
}

const resolvePosterText = ({
  fallback,
  product,
  key,
}: {
  fallback: string
  key:
    | 'infoButtonLabel'
    | 'ingredientsIntro'
    | 'ingredientsNoteTitle'
    | 'label'
    | 'labelTone'
    | 'subtitle'
  product: Partial<Product>
}) => {
  const poster = 'poster' in product && typeof product.poster === 'object' ? product.poster : null
  const value = poster?.[key]

  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export const cookiePosterMetas: CookiePosterMeta[] = [
  {
    bodyFallbackSrc: '/cookie-singular-brookie.svg',
    chips: ['BROWN BUTTER', 'FUDGY', 'CHOCOLATE'],
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['BROWN BUTTER', 'FUDGY', 'CHOCOLATE']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['OREO', 'CREAM CHEESE', 'WHITE CHOC']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['APPLE PIE', 'CINNAMON', 'CARAMEL']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['GRAHAM', 'MARSHMALLOW', 'CHOCOLATE']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['BANANA', 'WALNUT', 'CHOC CHIP']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['CINNAMON', 'BROWN SUGAR', 'ICING']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['BISCOFF', 'COOKIE BUTTER', 'SPICE']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['BANANA', 'CRUMBLE', 'BROWN SUGAR']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['PEANUT BUTTER', 'CHOCOLATE', 'BROWN BUTTER']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['PISTACHIO', 'KATAIFI', 'CHOCOLATE']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['SALTED', 'CARAMEL', 'CRUNCH']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['STRAWBERRY', 'CHEESECAKE', 'GRAHAM']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['STRAWBERRY', 'MATCHA', 'WHITE CHOC']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    infoButtonLabel: defaultInfoButtonLabel,
    ingredients: toFallbackIngredients(['STRAWBERRY', 'MATCHA', 'MARBLE']),
    ingredientsIntro: 'Little bakery note: the admin can replace this with the real ingredient list in Payload.',
    ingredientsNoteTitle: defaultIngredientsNoteTitle,
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
    amount: formatAmount(cookiePosterDisplayPriceInUSD),
    href: `/cookies/${meta.slug}`,
    image: normalizeImage(product),
    infoButtonLabel: resolvePosterText({
      fallback: meta.infoButtonLabel,
      key: 'infoButtonLabel',
      product,
    }),
    ingredients: resolvePosterIngredients(product, meta),
    ingredientsIntro: resolvePosterText({
      fallback: meta.ingredientsIntro,
      key: 'ingredientsIntro',
      product,
    }),
    ingredientsNoteTitle: resolvePosterText({
      fallback: meta.ingredientsNoteTitle,
      key: 'ingredientsNoteTitle',
      product,
    }),
    chips: resolvePosterChips(product, meta),
    label: resolvePosterText({
      fallback: meta.label,
      key: 'label',
      product,
    }),
    labelTone: resolvePosterText({
      fallback: meta.labelTone,
      key: 'labelTone',
      product,
    }),
    productHref: `/products/${meta.slug}`,
    productId: typeof product.id === 'number' ? product.id : undefined,
    summary: resolveSummary(product, meta),
    subtitle: resolvePosterText({
      fallback: meta.subtitle,
      key: 'subtitle',
      product,
    }),
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
