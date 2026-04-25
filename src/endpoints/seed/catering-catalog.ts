import { cookieCatalog } from './cookie-catalog'

export type CateringSeedSpec = {
  expandedPitchParagraphs: string[]
  imageSlug: string
  menuBehavior: 'batchBuilder' | 'simple'
  menuPortionLabel: string
  metaDescription: string
  priceInUSD: number
  requiredSelectionCount?: number
  selectableProductSlugs?: string[]
  slug: string
  summary: string
  title: string
}

export const cateringCategory = {
  menuOrder: 5,
  slug: 'catering',
  title: 'Catering',
} as const

const cookieFlavorSlugs = cookieCatalog.map((cookie) => cookie.slug)

export const cateringCatalog: CateringSeedSpec[] = [
  {
    expandedPitchParagraphs: [
      'Build one tray with ten jumbo cookies and mix flavors however you like. It is the easiest way to share the big bakery flavors without over-ordering individual cookies.',
      'The tray price gives customers a better catering value, and the cookies still taste rich without feeling too sweet. This is the item for office drops, Bible study tables, and birthdays when people want variety.',
    ],
    imageSlug: 'brookie',
    menuBehavior: 'batchBuilder',
    menuPortionLabel: '10 jumbo cookies',
    metaDescription:
      'A catering tray of ten jumbo cookies with mix-and-match flavor selection.',
    priceInUSD: 3000,
    requiredSelectionCount: 10,
    selectableProductSlugs: cookieFlavorSlugs,
    slug: 'cookie-tray',
    summary: 'Choose any ten jumbo cookies for a crowd-friendly tray at a better catering price.',
    title: 'Cookie Tray',
  },
  {
    expandedPitchParagraphs: [
      'This tray keeps the same mix-and-match flexibility but in a mini-cookie format that is easier to pass around at meetings, showers, and dessert tables.',
      'It is a strong value option when you want the variety and bakery look of a cookie assortment while keeping portions lighter and more budget-friendly.',
    ],
    imageSlug: 'biscoff',
    menuBehavior: 'batchBuilder',
    menuPortionLabel: '10 mini cookies',
    metaDescription:
      'A catering tray of ten mini cookies with mix-and-match flavor selection.',
    priceInUSD: 2000,
    requiredSelectionCount: 10,
    selectableProductSlugs: cookieFlavorSlugs,
    slug: 'mini-cookie-tray',
    summary: 'Choose any ten mini cookies for a lighter tray that still feels festive.',
    title: 'Mini Cookie Tray',
  },
  {
    expandedPitchParagraphs: [
      'Ten cups of banana pudding make it easy to serve a full group without scooping or plating anything yourself.',
      'It is rich, familiar, and crowd-pleasing, with a catering format that saves time and usually lands as a better value than ordering individual dessert cups one by one.',
    ],
    imageSlug: 'catering-menu-april-2026',
    menuBehavior: 'simple',
    menuPortionLabel: '10 cups',
    metaDescription: 'Ten individual banana pudding cups packaged for catering orders.',
    priceInUSD: 3000,
    slug: 'banana-pudding-10-pack',
    summary: 'Ten banana pudding cups packaged for easy group serving.',
    title: 'Banana Pudding 10-Pack',
  },
  {
    expandedPitchParagraphs: [
      'Sticky toffee pudding in a ten-cup catering format is an easy dessert upgrade when you want something warm, comforting, and a little more special than the usual sheet-pan option.',
      'The format keeps serving simple, and the flavor feels homemade instead of generic party dessert.',
    ],
    imageSlug: 'catering-menu-april-2026',
    menuBehavior: 'simple',
    menuPortionLabel: '10 cups',
    metaDescription: 'Ten sticky toffee pudding cups prepared for catering pickup.',
    priceInUSD: 3500,
    slug: 'sticky-toffee-pudding-10-pack',
    summary: 'Ten sticky toffee pudding cups for a warm, comforting dessert option.',
    title: 'Sticky Toffee Pudding 10-Pack',
  },
  {
    expandedPitchParagraphs: [
      'A full focaccia tray works well when the table needs something savory, shareable, and bakery-made instead of a generic store-bought side.',
      'It is easy to pair with soups, salads, dips, or entrees, and the full-tray format keeps catering orders simple for the business owner and the customer.',
    ],
    imageSlug: 'catering-menu-april-2026',
    menuBehavior: 'simple',
    menuPortionLabel: 'One tray',
    metaDescription: 'A full tray of focaccia prepared for catering service.',
    priceInUSD: 2000,
    slug: 'focaccia-tray',
    summary: 'A savory focaccia tray built for sharing alongside meals or dips.',
    title: 'Focaccia Tray',
  },
]
