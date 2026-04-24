import type { Category, Media, Product } from '@/payload-types'
import { type Payload, type PayloadRequest, RequiredDataFromCollectionSlug } from 'payload'

import { cookieCatalog, cookieCategory, type CookieSeedSpec } from './cookie-catalog'
import { createParagraphRichText } from './richText'

const posterContentBySlug: Record<
  string,
  {
    chips: string[]
    infoButtonLabel: string
    ingredients: Array<{ detail?: string; name: string }>
    ingredientsIntro: string
    ingredientsNoteTitle: string
    label: string
    labelTone: string
    subtitle: string
    summary: string
  }
> = {
  'apple-snickerdoodle': {
    chips: ['APPLE PIE', 'CINNAMON', 'CARAMEL'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'the warm cookie base', name: 'Brown butter dough' },
      { detail: 'for cozy spice all through the bite', name: 'Cinnamon sugar' },
      { detail: 'spooned over the top', name: 'Apple pie filling' },
      { detail: 'finished in thin ribbons', name: 'Caramel glaze' },
    ],
    ingredientsIntro: 'Little bakery note: this one is built to taste like apple pie tucked into a soft cookie.',
    ingredientsNoteTitle: 'Baker Notes',
    label: 'APPLE SNICKERDOODLE',
    labelTone: '#f6c58f',
    subtitle: 'Apple pie meets snickerdoodle',
    summary: 'Warm cinnamon sugar with apple pie filling and caramel glaze.',
  },
  'banana-choc-chip-walnut': {
    chips: ['BANANA', 'WALNUT', 'CHOC CHIP'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'for that banana-bread softness', name: 'Banana dough' },
      { detail: 'to add toasty crunch', name: 'Walnuts' },
      { detail: 'folded through the base', name: 'Chocolate chips' },
      { detail: 'the cozy backbone', name: 'Brown sugar + vanilla' },
    ],
    ingredientsIntro: 'Little bakery note: think banana bread, but with more melty chocolate tucked into every corner.',
    ingredientsNoteTitle: 'Baker Notes',
    label: 'BANANA WALNUT',
    labelTone: '#d8ea94',
    subtitle: 'Banana bread cookie',
    summary: 'Toasted walnut crunch and melty chocolate tucked into banana dough.',
  },
  'banana-crumble': {
    chips: ['BANANA', 'CRUMBLE', 'BROWN SUGAR'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'soft and banana-forward', name: 'Banana cookie dough' },
      { detail: 'for golden caramel warmth', name: 'Brown sugar' },
      { detail: 'sprinkled generously on top', name: 'Buttery crumble' },
      { detail: 'to keep it cozy', name: 'Vanilla + spice' },
    ],
    ingredientsIntro: 'Little bakery note: this one leans soft, tender, and streusel-y rather than crisp.',
    ingredientsNoteTitle: 'Baker Notes',
    label: 'BANANA CRUMBLE',
    labelTone: '#e6d98a',
    subtitle: 'Soft banana streusel cookie',
    summary: 'Banana-forward dough topped with crumble texture and brown sugar warmth.',
  },
  biscoff: {
    chips: ['BISCOFF', 'COOKIE BUTTER', 'SPICE'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'the main flavor thread', name: 'Cookie butter spread' },
      { detail: 'mixed into the dough', name: 'Biscoff cookie pieces' },
      { detail: 'for the warm bakery profile', name: 'Brown butter + spice' },
      { detail: 'what keeps it extra soft', name: 'Brown sugar dough base' },
    ],
    ingredientsIntro: 'Little bakery note: everything here is built around that warm spiced cookie-butter flavor.',
    ingredientsNoteTitle: 'Baker Notes',
    label: 'BISCOFF',
    labelTone: '#f0c589',
    subtitle: 'Cookie butter loaded',
    summary: 'Warm spiced dough stacked with Biscoff flavor and cookie butter richness.',
  },
  brookie: {
    chips: ['BROWN BUTTER', 'FUDGY', 'CHOCOLATE'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'the brownie-cookie mashup base', name: 'Chocolate dough' },
      { detail: 'for the glossy chewy center', name: 'Brownie batter notes' },
      { detail: 'mixed throughout', name: 'Chocolate chips' },
      { detail: 'for extra depth', name: 'Brown butter' },
    ],
    ingredientsIntro: 'Little bakery note: this is the richest one in the box, with brownie energy all the way through.',
    ingredientsNoteTitle: 'Baker Notes',
    label: 'BROOKIE',
    labelTone: '#f2e35b',
    subtitle: 'Brownie cookie mashup',
    summary: 'Brownie depth and chocolate chip chew packed into one oversized cookie.',
  },
  'cinnamon-roll': {
    chips: ['CINNAMON', 'BROWN SUGAR', 'ICING'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'the soft cookie base', name: 'Brown butter dough' },
      { detail: 'swirled through the center', name: 'Brown sugar cinnamon filling' },
      { detail: 'drizzled over the top', name: 'Brown butter icing' },
      { detail: 'for bakery warmth', name: 'Vanilla + cinnamon' },
    ],
    ingredientsIntro: 'Little bakery note: we wanted this to read like the middle of a cinnamon roll, not just a cinnamon cookie.',
    ingredientsNoteTitle: 'Baker Notes',
    label: 'CINNAMON ROLL',
    labelTone: '#f0d6a8',
    subtitle: 'Bakery roll in cookie form',
    summary: 'Swirled brown sugar cinnamon cookie finished with brown butter icing.',
  },
  'dubai-chocolate': {
    chips: ['PISTACHIO', 'KATAIFI', 'CHOCOLATE'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'rich and deeply cocoa-forward', name: 'Chocolate cookie base' },
      { detail: 'for the signature nuttiness', name: 'Pistachio cream' },
      { detail: 'adds delicate crunch', name: 'Toasted kataifi' },
      { detail: 'for a glossy finish', name: 'Chocolate topping' },
    ],
    ingredientsIntro: 'Little bakery note: this one is all about rich chocolate with crunchy pistachio contrast.',
    ingredientsNoteTitle: 'Baker Notes',
    label: 'DUBAI CHOCOLATE',
    labelTone: '#d7d28a',
    subtitle: 'Pistachio chocolate cookie',
    summary: 'A rich chocolate cookie layered with pistachio notes and crunchy texture.',
  },
  'oreo-cheesecake': {
    chips: ['OREO', 'CREAM CHEESE', 'WHITE CHOC'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'the cookie shell', name: 'Brown butter Oreo dough' },
      { detail: 'for the creamy center', name: 'Cheesecake filling' },
      { detail: 'for crunch and cookie flavor', name: 'Oreo pieces' },
      { detail: 'for extra sweetness', name: 'White chocolate' },
    ],
    ingredientsIntro: 'Little bakery note: the goal here was cookies-and-cream with an actual cheesecake middle.',
    ingredientsNoteTitle: 'Baker Notes',
    label: 'OREO CHEESECAKE',
    labelTone: '#f08e94',
    subtitle: 'Creamy Oreo center',
    summary: 'Cheesecake filling layered into a brown butter Oreo cookie.',
  },
  'peanut-butter-cup': {
    chips: ['PEANUT BUTTER', 'CHOCOLATE', 'BROWN BUTTER'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'dark and fudgy', name: 'Chocolate cookie base' },
      { detail: 'melted into pockets throughout', name: 'Peanut butter cups' },
      { detail: 'for extra nuttiness', name: 'Peanut butter swirl' },
      { detail: 'to deepen the finish', name: 'Brown butter + sea salt' },
    ],
    ingredientsIntro: 'Little bakery note: this one is meant to feel like a candy bar tucked inside a bakery cookie.',
    ingredientsNoteTitle: 'Baker Notes',
    label: 'PEANUT BUTTER CUP',
    labelTone: '#f2c66c',
    subtitle: 'Chocolate peanut butter cookie',
    summary: 'Chocolate dough loaded with peanut butter cup pieces and brown butter richness.',
  },
  'salted-caramel-nest': {
    chips: ['SALTED', 'CARAMEL', 'CRUNCH'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'the chewy buttery base', name: 'Brown sugar dough' },
      { detail: 'for sticky caramel depth', name: 'Caramel center' },
      { detail: 'for texture on top', name: 'Crunch topping' },
      { detail: 'to balance the sweetness', name: 'Flaky sea salt' },
    ],
    ingredientsIntro: 'Little bakery note: sweet first, then a salty edge at the finish so it does not feel flat.',
    ingredientsNoteTitle: 'Baker Notes',
    label: 'SALTED CARAMEL',
    labelTone: '#f0c073',
    subtitle: 'Salted caramel nest cookie',
    summary: 'Sticky caramel depth with a salted edge and crunchy topping throughout.',
  },
  smores: {
    chips: ['GRAHAM', 'MARSHMALLOW', 'CHOCOLATE'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'the warm chewy base', name: 'Brown butter dough' },
      { detail: 'for campfire flavor', name: 'Graham cracker crumbs' },
      { detail: 'folded through and toasted', name: 'Marshmallow' },
      { detail: 'for the classic finish', name: 'Chocolate chunks' },
    ],
    ingredientsIntro: 'Little bakery note: this one is meant to feel gooey and nostalgic, not overly neat.',
    ingredientsNoteTitle: 'Baker Notes',
    label: "S'MORES",
    labelTone: '#f3deb0',
    subtitle: 'Campfire cookie',
    summary: 'Brown butter dough packed with graham, marshmallow, and chocolate.',
  },
  'strawberry-cheesecake': {
    chips: ['STRAWBERRY', 'CHEESECAKE', 'GRAHAM'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'for bright berry flavor', name: 'Strawberry swirl' },
      { detail: 'the creamy middle', name: 'Cheesecake filling' },
      { detail: 'for cheesecake-crust notes', name: 'Graham crumbs' },
      { detail: 'the soft bakery base', name: 'Vanilla cookie dough' },
    ],
    ingredientsIntro: 'Little bakery note: berry first, creamy second, with enough graham to still feel like cheesecake.',
    ingredientsNoteTitle: 'Baker Notes',
    label: 'STRAWBERRY CHEESECAKE',
    labelTone: '#f3adb4',
    subtitle: 'Berry cheesecake cookie',
    summary: 'Strawberry sweetness and cheesecake richness with a graham-style finish.',
  },
  'strawberry-matcha': {
    chips: ['STRAWBERRY', 'MATCHA', 'WHITE CHOC'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'the green tea backbone', name: 'Matcha dough' },
      { detail: 'for bright fruit ribbons', name: 'Strawberry swirl' },
      { detail: 'adds soft sweetness', name: 'White chocolate' },
      { detail: 'to keep the finish creamy', name: 'Vanilla glaze' },
    ],
    ingredientsIntro: 'Little bakery note: this one should feel bright and fresh, with matcha balancing the sweetness.',
    ingredientsNoteTitle: 'Baker Notes',
    label: 'STRAWBERRY MATCHA',
    labelTone: '#d7efaa',
    subtitle: 'Matcha berry swirl',
    summary: 'Fresh strawberry notes layered with matcha flavor in a bright soft cookie.',
  },
  'strawberry-matcha-marble': {
    chips: ['STRAWBERRY', 'MATCHA', 'MARBLE'],
    infoButtonLabel: 'Info',
    ingredients: [
      { detail: 'for the two-tone cookie base', name: 'Marbled strawberry-matcha dough' },
      { detail: 'keeps the berry side bright', name: 'Strawberry pieces' },
      { detail: 'adds depth to the green side', name: 'Matcha' },
      { detail: 'for a soft bakery finish', name: 'White chocolate drizzle' },
    ],
    ingredientsIntro: 'Little bakery note: the marble look is part of the charm, so the flavors stay distinct instead of blending flat.',
    ingredientsNoteTitle: 'Baker Notes',
    label: 'MATCHA MARBLE',
    labelTone: '#d8efc3',
    subtitle: 'Marbled berry matcha cookie',
    summary: 'A marbled cookie with strawberry brightness and matcha depth baked together.',
  },
}

const buildPosterData = (spec: CookieSeedSpec) => {
  const poster = posterContentBySlug[spec.slug]

  if (!poster) {
    return undefined
  }

  return {
    chips: poster.chips.map((text) => ({ text })),
    infoButtonLabel: poster.infoButtonLabel,
    ingredients: poster.ingredients,
    ingredientsIntro: poster.ingredientsIntro,
    ingredientsNoteTitle: poster.ingredientsNoteTitle,
    label: poster.label,
    labelTone: poster.labelTone,
    subtitle: poster.subtitle,
    summary: poster.summary,
  }
}

const buildCookieProductData = ({
  category,
  image,
  spec,
}: {
  category: Category
  image: Media
  spec: CookieSeedSpec
}): RequiredDataFromCollectionSlug<'products'> => {
  return {
    _status: 'published',
    categories: [category],
    description: createParagraphRichText(spec.summary),
    gallery: [{ image }],
    layout: [],
    meta: {
      description: spec.metaDescription,
      image,
      title: `${spec.title} | Baked with Blessings`,
    },
    poster: buildPosterData(spec),
    priceInUSD: spec.priceInUSD,
    priceInUSDEnabled: true,
    relatedProducts: [],
    slug: spec.slug,
    title: spec.title,
  }
}

export const seedCookieProducts = async ({
  mediaBySlug,
  payload,
  req,
}: {
  mediaBySlug: Record<string, Media>
  payload: Payload
  req: PayloadRequest
}) => {
  const category = await payload.create({
    collection: 'categories',
    data: cookieCategory,
    depth: 0,
    req,
  })
  const productsBySlug: Record<string, Product> = {}

  for (const spec of cookieCatalog) {
    const image = mediaBySlug[spec.slug]

    if (!image) {
      throw new Error(`Missing media document for cookie slug "${spec.slug}".`)
    }

    const product = await payload.create({
      collection: 'products',
      data: buildCookieProductData({
        category,
        image,
        spec,
      }),
      depth: 0,
      req,
    })

    productsBySlug[spec.slug] = product

    payload.logger.info(`- Seeded product ${spec.slug}`)
  }

  return {
    category,
    productsBySlug,
  }
}
