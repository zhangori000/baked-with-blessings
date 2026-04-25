import type { Header } from '@/payload-types'
import { menuHref, rotatingCookieFlavorsHref } from '@/utilities/routes'

export type HeaderPanelLink = {
  href: string
  label: string
  description: string
}

export type HeaderPanelCard = {
  href: string
  eyebrow: string
  title: string
  description: string
  tone?: 'dark' | 'light' | 'muted'
}

export type HeaderNavigationItem = {
  id: string
  href: string
  label: string
  panel: {
    eyebrow: string
    description: string
    cards: HeaderPanelCard[]
    links: HeaderPanelLink[]
  }
}

const fallbackHeaderNavigation: HeaderNavigationItem[] = [
  {
    href: rotatingCookieFlavorsHref,
    id: 'cookies-of-the-month',
    label: 'Cookies of the Month',
    panel: {
      eyebrow: 'Rotating lineup',
      description:
        'Start with the current cookie lineup. This is the page we can rotate weekly, monthly, or whenever the bakery decides to change the featured flavors.',
      cards: [
        {
          description:
            'See the featured cookie lineup first, with the current flavors and direct add-to-cart actions in one place.',
          eyebrow: 'Featured first',
          href: rotatingCookieFlavorsHref,
          title: 'View rotating cookie flavors',
          tone: 'dark',
        },
      ],
      links: [
        {
          description: 'Open the current cookie lineup.',
          href: rotatingCookieFlavorsHref,
          label: 'View rotating cookie flavors',
        },
      ],
    },
  },
  {
    href: menuHref,
    id: 'menu',
    label: 'Menu',
    panel: {
      eyebrow: 'Catering Menu',
      description:
        'The menu route is now the dedicated catering experience, with the customer-facing sheet image and expandable order rows.',
      cards: [
        {
          description:
            'Open the catering menu page with the tray builder, the honest product notes, and the full row-by-row ordering layout.',
          eyebrow: 'Menu landing',
          href: menuHref,
          title: 'Open the catering menu',
          tone: 'dark',
        },
      ],
      links: [
        {
          description: 'Go to the dedicated catering menu page.',
          href: menuHref,
          label: 'Open the menu',
        },
      ],
    },
  },
  {
    href: rotatingCookieFlavorsHref,
    id: 'words-of-affection',
    label: 'Words of Affection',
    panel: {
      eyebrow: 'Words of Affection',
      description:
        'This will eventually become the public note wall. For now it still routes back to the rotating cookie page while the storefront sections are being staged in.',
      cards: [
        {
          description:
            'Keep this label in the nav now, but send visitors to the same current storefront landing page.',
          eyebrow: 'Coming soon',
          href: rotatingCookieFlavorsHref,
          title: 'Open the current storefront page',
          tone: 'dark',
        },
      ],
      links: [
        {
          description: 'Return to the rotating cookie page.',
          href: rotatingCookieFlavorsHref,
          label: 'Open the storefront page',
        },
      ],
    },
  },
  {
    href: rotatingCookieFlavorsHref,
    id: 'calling-for-help',
    label: 'Calling for Help',
    panel: {
      eyebrow: 'Calling for Help',
      description:
        'This label is reserved in the nav now, but for the moment it also routes back to the rotating cookie page until the dedicated page is ready.',
      cards: [
        {
          description:
            'Keep the future support/help destination visible without splitting the live navigation yet.',
          eyebrow: 'Reserved slot',
          href: rotatingCookieFlavorsHref,
          title: 'Open the storefront page',
          tone: 'dark',
        },
      ],
      links: [
        {
          description: 'Return to the rotating cookie page.',
          href: rotatingCookieFlavorsHref,
          label: 'Open the storefront page',
        },
      ],
    },
  },
]

const labelToFallbackItem = new Map(
  fallbackHeaderNavigation.map((item) => [item.label.toLowerCase(), item] as const),
)

const fallbackItemById = new Map(fallbackHeaderNavigation.map((item) => [item.id, item] as const))

const navItemPriority: Array<HeaderNavigationItem['id']> = [
  'cookies-of-the-month',
  'menu',
  'words-of-affection',
  'calling-for-help',
]

export const headerAnnouncement =
  'Fresh bakes daily. Custom cake orders and pickup help are one click away.'

export const buildHeaderNavigation = (menu: Header['navItems']) => {
  if (!menu?.length) return fallbackHeaderNavigation

  const items = menu
    .map((item) => {
      const label = item.link.label?.trim()
      if (!label) return null

      const fallbackItem = labelToFallbackItem.get(label.toLowerCase())
      if (!fallbackItem) return null

      return fallbackItem
    })
    .filter(Boolean) as HeaderNavigationItem[]

  const itemById = new Map(items.map((item) => [item.id, item] as const))

  const prioritizedItems = navItemPriority
    .map((id) => itemById.get(id) ?? fallbackItemById.get(id))
    .filter(Boolean) as HeaderNavigationItem[]

  return prioritizedItems.length ? prioritizedItems : fallbackHeaderNavigation
}

const isRouteActive = (pathname: string, href: string) => {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export const isHeaderNavigationItemActive = (
  pathname: string,
  item: Pick<HeaderNavigationItem, 'href' | 'id'>,
) => {
  if (isRouteActive(pathname, rotatingCookieFlavorsHref)) {
    return item.id === 'cookies-of-the-month'
  }

  return isRouteActive(pathname, item.href)
}
