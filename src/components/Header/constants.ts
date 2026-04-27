import type { Header } from '@/payload-types'
import {
  blogHref,
  discussionBoardHref,
  menuHref,
  reviewsHref,
  rotatingCookieFlavorsHref,
} from '@/utilities/routes'

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
  kind?: 'link' | 'apps'
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
    href: blogHref,
    id: 'more',
    kind: 'apps',
    label: 'Apps',
    panel: {
      eyebrow: 'Bakery apps',
      description:
        'Open public tools connected to the bakery: writing, structured discussions, review transparency, and reusable customer-facing systems.',
      cards: [
        {
          description:
            'Read compact notes and essays from the bakery about school, business, community, and what is being learned along the way.',
          eyebrow: 'Writing',
          href: blogHref,
          title: 'Read the blog',
          tone: 'light',
        },
        {
          description:
            'Browse the current discussion prompts and open a tree view for replies, questions, support, and challenges.',
          eyebrow: 'Public reasoning',
          href: discussionBoardHref,
          title: 'Open discussion board',
          tone: 'dark',
        },
        {
          description:
            'Read public reviews, see what changed in response, and submit a text review.',
          eyebrow: 'Review transparency',
          href: reviewsHref,
          title: 'Open reviews',
          tone: 'light',
        },
      ],
      links: [
        {
          description: 'Go to the blog.',
          href: blogHref,
          label: 'Read the blog',
        },
        {
          description: 'Go to the discussion board.',
          href: discussionBoardHref,
          label: 'Open discussion board',
        },
        {
          description: 'Go to public reviews.',
          href: reviewsHref,
          label: 'Open reviews',
        },
      ],
    },
  },
]

const labelToFallbackItem = new Map(
  fallbackHeaderNavigation.map((item) => [item.label.toLowerCase(), item] as const),
)

const fallbackItemById = new Map(fallbackHeaderNavigation.map((item) => [item.id, item] as const))

const navItemPriority: Array<HeaderNavigationItem['id']> = ['cookies-of-the-month', 'menu', 'more']

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

  if (isRouteActive(pathname, blogHref)) {
    return item.id === 'more'
  }

  if (isRouteActive(pathname, discussionBoardHref)) {
    return item.id === 'more'
  }

  if (isRouteActive(pathname, reviewsHref)) {
    return item.id === 'more'
  }

  return isRouteActive(pathname, item.href)
}
