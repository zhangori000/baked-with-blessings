import type { Category, Media, Product } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

import { createParagraphRichText } from './richText'

type CafeProductSpec = {
  title: string
  slug: string
  priceInUSD: number
  description: string
  metaDescription: string
  categorySlugs: string[]
  imageKey: 'hero' | 'hat' | 'black' | 'white'
}

export const cafeCategories = [
  { title: 'Cookies', slug: 'cookies', menuOrder: 0 },
  { title: 'Drinks', slug: 'drinks', menuOrder: 10 },
  { title: 'Snacks & Dips', slug: 'snacks-and-dips', menuOrder: 20 },
  { title: 'Breads', slug: 'breads', menuOrder: 30 },
  { title: 'Entrees', slug: 'entrees', menuOrder: 40 },
  { title: 'Cakes', slug: 'cakes', menuOrder: 50 },
] as const

export const cafeCatalog = {
  roseCardamomLatte: {
    title: 'Rose Cardamom Latte',
    slug: 'rose-cardamom-latte',
    priceInUSD: 675,
    description:
      'A warm espresso latte scented with cardamom and finished with a soft rose cream that feels a little dressed up without losing its comfort.',
    metaDescription:
      'Espresso, cardamom, and rose cream in a warm signature latte from Baked with Blessings.',
    categorySlugs: ['drinks'],
    imageKey: 'hero',
  },
  strawberryMatchaCloud: {
    title: 'Strawberry Matcha Cloud',
    slug: 'strawberry-matcha-cloud',
    priceInUSD: 725,
    description:
      'Bright ceremonial-style matcha layered with strawberry and a silky milk cap for the kind of drink people photograph before they sip.',
    metaDescription:
      'A layered strawberry matcha drink with a soft cloud top and a clean green finish.',
    categorySlugs: ['drinks'],
    imageKey: 'white',
  },
  vietnameseCoffee: {
    title: 'Vietnamese Coffee',
    slug: 'vietnamese-coffee',
    priceInUSD: 650,
    description:
      'Dark roast coffee with sweet condensed milk and a bold finish that is intentionally richer and sharper than a standard cafe latte.',
    metaDescription:
      'Strong Vietnamese coffee with condensed milk for customers who want a bolder sweet finish.',
    categorySlugs: ['drinks'],
    imageKey: 'black',
  },
  blessingBites: {
    title: 'Blessing Bites',
    slug: 'blessing-bites',
    priceInUSD: 475,
    description:
      'A chewy snack made from peanut butter, dates, and dark chocolate that reads like a treat but still feels snackable enough for the car ride home.',
    metaDescription:
      'Peanut butter, dates, and dark chocolate in a grab-and-go cafe snack.',
    categorySlugs: ['snacks-and-dips'],
    imageKey: 'hat',
  },
  caramelPretzelDip: {
    title: 'Caramel Pretzel Dip',
    slug: 'caramel-pretzel-dip',
    priceInUSD: 950,
    description:
      'Salted caramel folded into a cream-cheese style dip with crunchy pretzel pieces and enough sweetness to hold its own on a dessert table.',
    metaDescription:
      'Salted caramel pretzel dip seeded as a shareable dessert-style cafe item.',
    categorySlugs: ['snacks-and-dips'],
    imageKey: 'black',
  },
  brownButterChocolateChipCookies: {
    title: 'Brown Butter Chocolate Chip Cookies',
    slug: 'brown-butter-chocolate-chip-cookies',
    priceInUSD: 600,
    description:
      'Crisp-edged, soft-centered cookies with browned butter depth, bittersweet chocolate, and enough salt to keep them from drifting into one-note sweetness.',
    metaDescription:
      'Brown butter chocolate chip cookies with crisp edges and soft centers.',
    categorySlugs: ['cookies'],
    imageKey: 'white',
  },
  rosemaryFocacciaLoaf: {
    title: 'Rosemary Focaccia Loaf',
    slug: 'rosemary-focaccia-loaf',
    priceInUSD: 900,
    description:
      'An olive-oil focaccia with rosemary, blistered crust, and a soft interior that works for dinner, sandwiches, or tearing apart in the kitchen.',
    metaDescription:
      'Rosemary focaccia loaf with olive oil, airy crumb, and a blistered crust.',
    categorySlugs: ['breads'],
    imageKey: 'hat',
  },
  slowRoastedTomatoPasta: {
    title: 'Slow-Roasted Tomato Pasta',
    slug: 'slow-roasted-tomato-pasta',
    priceInUSD: 1650,
    description:
      'Tomato pasta with deeply cooked onions and a sauce meant to feel homemade rather than overworked, seeded as the first entree-style anchor for the menu.',
    metaDescription:
      'Slow-roasted tomato pasta with onions and a rich house-style sauce.',
    categorySlugs: ['entrees'],
    imageKey: 'hero',
  },
  pistachioCelebrationCakeSlice: {
    title: 'Pistachio Celebration Cake Slice',
    slug: 'pistachio-celebration-cake-slice',
    priceInUSD: 1400,
    description:
      'A bakery-case cake slice with pistachio cream, a tender crumb, and enough polish to suggest the larger custom-cake direction without needing the full system yet.',
    metaDescription:
      'Pistachio celebration cake slice seeded for the cakes section of the cafe menu.',
    categorySlugs: ['cakes'],
    imageKey: 'hero',
  },
} as const satisfies Record<string, CafeProductSpec>

export const buildCafeProductData = ({
  spec,
  galleryImage,
  metaImage,
  categories,
  relatedProducts = [],
}: {
  spec: CafeProductSpec
  galleryImage: Media
  metaImage: Media
  categories: Category[]
  relatedProducts?: Product[]
}): RequiredDataFromCollectionSlug<'products'> => {
  return {
    meta: {
      title: `${spec.title} | Baked with Blessings`,
      image: metaImage,
      description: spec.metaDescription,
    },
    _status: 'published',
    layout: [],
    categories,
    description: createParagraphRichText(spec.description),
    gallery: [{ image: galleryImage }],
    title: spec.title,
    slug: spec.slug,
    priceInUSDEnabled: true,
    priceInUSD: spec.priceInUSD,
    relatedProducts,
  }
}
