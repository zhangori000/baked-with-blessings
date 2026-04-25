export type CookieSeedSpec = {
  mediaAlt: string
  metaDescription: string
  priceInUSD: number
  slug: string
  sourceFilename: string
  summary: string
  title: string
}

const defaultCookiePriceInUSD = 750

export const cookieCategory = {
  menuOrder: 0,
  slug: 'cookies',
  title: 'Cookies',
} as const

export const cookieCatalog: CookieSeedSpec[] = [
  {
    mediaAlt: 'Apple Snickerdoodle cookie',
    metaDescription: 'Warm cinnamon sugar with apple pie filling and caramel glaze.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'apple-snickerdoodle',
    sourceFilename: 'cookie-singular-apple-snickerdoodle.png',
    summary: 'Warm cinnamon sugar with apple pie filling and caramel glaze.',
    title: 'Apple Snickerdoodle',
  },
  {
    mediaAlt: 'Banana Choc-Chip Walnut cookie',
    metaDescription: 'Toasted walnut crunch and melty chocolate tucked into banana dough.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'banana-choc-chip-walnut',
    sourceFilename: 'cookie-singular-banana-chocolate-chip-walnut.png',
    summary: 'Toasted walnut crunch and melty chocolate tucked into banana dough.',
    title: 'Banana Choc-Chip Walnut',
  },
  {
    mediaAlt: 'Banana Crumble cookie',
    metaDescription: 'Banana-forward dough topped with crumble texture and brown sugar warmth.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'banana-crumble',
    sourceFilename: 'cookie-singular-banana-crumble.png',
    summary: 'Banana-forward dough topped with crumble texture and brown sugar warmth.',
    title: 'Banana Crumble',
  },
  {
    mediaAlt: 'Biscoff cookie',
    metaDescription: 'Warm spiced dough stacked with Biscoff flavor and cookie butter richness.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'biscoff',
    sourceFilename: 'cookie-singular-biscoff.png',
    summary: 'Warm spiced dough stacked with Biscoff flavor and cookie butter richness.',
    title: 'Biscoff',
  },
  {
    mediaAlt: 'Brookie cookie',
    metaDescription: 'Brownie depth and chocolate chip chew packed into one oversized cookie.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'brookie',
    sourceFilename: 'cookie-singular-brookie.png',
    summary: 'Brownie depth and chocolate chip chew packed into one oversized cookie.',
    title: 'Brookie',
  },
  {
    mediaAlt: 'Cinnamon Roll cookie',
    metaDescription: 'Swirled brown sugar cinnamon cookie finished with brown butter icing.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'cinnamon-roll',
    sourceFilename: 'cookie-singular-cinnamon-roll.png',
    summary: 'Swirled brown sugar cinnamon cookie finished with brown butter icing.',
    title: 'Cinnamon Roll',
  },
  {
    mediaAlt: 'Dubai Chocolate cookie',
    metaDescription: 'A rich chocolate cookie layered with pistachio notes and crunchy texture.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'dubai-chocolate',
    sourceFilename: 'cookie-singular-dubai-chocolate.png',
    summary: 'A rich chocolate cookie layered with pistachio notes and crunchy texture.',
    title: 'Dubai Chocolate',
  },
  {
    mediaAlt: 'Oreo Cheesecake cookie',
    metaDescription: 'Cheesecake filling layered into a brown butter Oreo cookie.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'oreo-cheesecake',
    sourceFilename: 'cookie-singular-oreo-cheesecake.png',
    summary: 'Cheesecake filling layered into a brown butter Oreo cookie.',
    title: 'Oreo Cheesecake',
  },
  {
    mediaAlt: 'Peanut Butter Cup cookie',
    metaDescription:
      'Chocolate dough loaded with peanut butter cup pieces and brown butter richness.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'peanut-butter-cup',
    sourceFilename: 'cookie-singular-chocolate-peanut-butter.png',
    summary: 'Chocolate dough loaded with peanut butter cup pieces and brown butter richness.',
    title: 'Peanut Butter Cup',
  },
  {
    mediaAlt: 'Salted Caramel Nest cookie',
    metaDescription: 'Sticky caramel depth with a salted edge and crunchy topping throughout.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'salted-caramel-nest',
    sourceFilename: 'cookie-singular-salted-caramel-nest.png',
    summary: 'Sticky caramel depth with a salted edge and crunchy topping throughout.',
    title: 'Salted Caramel Nest',
  },
  {
    mediaAlt: "S'mores cookie",
    metaDescription: 'Brown butter dough packed with graham, marshmallow, and chocolate.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'smores',
    sourceFilename: 'cookie-singular-smores.png',
    summary: 'Brown butter dough packed with graham, marshmallow, and chocolate.',
    title: "S'mores",
  },
  {
    mediaAlt: 'Strawberry Cheesecake cookie',
    metaDescription: 'Strawberry sweetness and cheesecake richness with a graham-style finish.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'strawberry-cheesecake',
    sourceFilename: 'cookie-singular-strawberry-cheesecake.png',
    summary: 'Strawberry sweetness and cheesecake richness with a graham-style finish.',
    title: 'Strawberry Cheesecake',
  },
  {
    mediaAlt: 'Strawberry Matcha cookie',
    metaDescription:
      'Fresh strawberry notes layered with matcha flavor in a bright soft cookie.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'strawberry-matcha',
    sourceFilename: 'cookie-singular-strawberry-matcha.png',
    summary: 'Fresh strawberry notes layered with matcha flavor in a bright soft cookie.',
    title: 'Strawberry Matcha',
  },
  {
    mediaAlt: 'Strawberry Matcha Marble cookie',
    metaDescription:
      'A marbled cookie with strawberry brightness and matcha depth baked together.',
    priceInUSD: defaultCookiePriceInUSD,
    slug: 'strawberry-matcha-marble',
    sourceFilename: 'cookie-singular-strawberry-matcha-marble.png',
    summary: 'A marbled cookie with strawberry brightness and matcha depth baked together.',
    title: 'Strawberry Matcha Marble',
  },
]
