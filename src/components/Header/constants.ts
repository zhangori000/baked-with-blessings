import type { Header } from '@/payload-types'
import {
  blessingsNetworkHref,
  blogHref,
  communityHref,
  contactHref,
  discussionBoardHref,
  isContactLinkHint,
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
    href: contactHref,
    id: 'contact',
    label: 'Contact',
    panel: {
      eyebrow: 'Direct message',
      description:
        'Send a note to the bakery owner for custom orders, pickup questions, event details, or anything that needs a real reply.',
      cards: [
        {
          description:
            'Open the message envelope, write a contact note, and send it to the configured owner inbox.',
          eyebrow: 'Owner inbox',
          href: contactHref,
          title: 'Write a message',
          tone: 'light',
        },
      ],
      links: [
        {
          description: 'Go to the contact page.',
          href: contactHref,
          label: 'Write a message',
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
            'Tiny letters from people who just ordered with us — react, scroll, and leave one of your own after you order.',
          eyebrow: 'Community',
          href: communityHref,
          title: 'Open the Post-it Wall',
          tone: 'light',
        },
        {
          description:
            'Read public reviews, see what changed in response, and submit a text review.',
          eyebrow: 'Review transparency',
          href: reviewsHref,
          title: 'Open reviews',
          tone: 'dark',
        },
        {
          description:
            'Read or draft something while your order is coming together — notes about school, business, community, and the bakery. Limit testing this one, just for fun.',
          eyebrow: 'Writing',
          href: blogHref,
          title: 'Read the blog',
          tone: 'light',
        },
        {
          description:
            'Drop a question, weigh in, or just lurk while you wait — structured questions, claims, support, and replies. Limit testing this one, just for fun.',
          eyebrow: 'Public reasoning',
          href: discussionBoardHref,
          title: 'Open discussion board',
          tone: 'dark',
        },
        {
          description:
            'Browse practical advice from food and cafe owners while you wait — and discover the businesses behind each answer. Limit testing this one, just for fun.',
          eyebrow: 'Community advice',
          href: blessingsNetworkHref,
          title: 'Open Community Advice',
          tone: 'light',
        },
      ],
      links: [
        {
          description: 'Go to the Community Post-it Wall.',
          href: communityHref,
          label: 'Open the Post-it Wall',
        },
        {
          description: 'Go to public reviews.',
          href: reviewsHref,
          label: 'Open reviews',
        },
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
          description: 'Go to Community Advice.',
          href: blessingsNetworkHref,
          label: 'Open Community Advice',
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
  'contact',
  'more',
]

export const headerAnnouncement =
  'Fresh bakes daily. Custom cake orders and pickup help are one click away.'

export const buildHeaderNavigation = (menu: Header['navItems']) => {
  if (!menu?.length) return fallbackHeaderNavigation

  const items = menu
    .map((item) => {
      const label = item.link.label?.trim()
      if (!label) return null

      const fallbackItem = isContactLinkHint({ label })
        ? fallbackItemById.get('contact')
        : labelToFallbackItem.get(label.toLowerCase())
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

  if (isRouteActive(pathname, blessingsNetworkHref)) {
    return item.id === 'more'
  }

  if (isRouteActive(pathname, reviewsHref)) {
    return item.id === 'more'
  }

  if (isRouteActive(pathname, communityHref)) {
    return item.id === 'more'
  }

  return isRouteActive(pathname, item.href)
}
