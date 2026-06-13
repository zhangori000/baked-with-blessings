import type { Header } from '@/payload-types'
import type { SitePagesFlags } from '@/utilities/getSitePages'
import {
  blessingsNetworkHref,
  blogHref,
  communityHref,
  contactHref,
  discussionBoardHref,
  featureRequestsHref,
  isContactLinkHint,
  menuHref,
  reviewsHref,
  rotationsHref,
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

export type HeaderAppPageIcon =
  | 'book-open-text'
  | 'clipboard-check'
  | 'handshake'
  | 'lightbulb'
  | 'message-square-text'
  | 'sticky-note'

export type HeaderAppPage = {
  id: string
  description: string
  /** Pages without a flag are always enabled. */
  enabledFlag?: keyof SitePagesFlags
  eyebrow: string
  href: string
  icon: HeaderAppPageIcon
  mobileDescription?: string
  mobileTitle?: string
  title: string
  tone?: HeaderPanelCard['tone']
}

export type HeaderNavigationItem = {
  id: string
  href: string
  label: string
  kind?: 'link' | 'apps' | 'announcements'
  panel: {
    eyebrow: string
    description: string
    cards: HeaderPanelCard[]
    links: HeaderPanelLink[]
  }
}

export const headerAppPages: HeaderAppPage[] = [
  {
    description:
      'Send a note to the bakery owner for custom orders, pickup questions, event details, or anything that needs a real reply.',
    eyebrow: 'Direct message',
    href: contactHref,
    icon: 'message-square-text',
    id: 'contact',
    mobileTitle: 'Contact',
    title: 'Contact',
    tone: 'light',
  },
  {
    description:
      'Tiny letters from people who just ordered with us - react, scroll, and leave one of your own after you order.',
    enabledFlag: 'communityEnabled',
    eyebrow: 'Community',
    href: communityHref,
    icon: 'sticky-note',
    id: 'community',
    mobileTitle: 'Open the Post-it Wall',
    title: 'Post-it Wall',
    tone: 'light',
  },
  {
    description:
      'Reviews with photos, public responses, action logs, and boundaries around unfair claims.',
    enabledFlag: 'reviewsEnabled',
    eyebrow: 'Transparency',
    href: reviewsHref,
    icon: 'clipboard-check',
    id: 'reviews',
    mobileDescription:
      'Read public reviews, see what changed in response, and submit a text review.',
    mobileTitle: 'Open reviews',
    title: 'Reviews',
    tone: 'dark',
  },
  {
    description:
      'Suggest pages, food, packaging, anything. Public requests get rated and replied to; private DMs go straight to the bakery owner.',
    enabledFlag: 'featureRequestsEnabled',
    eyebrow: 'Tell us what to build',
    href: featureRequestsHref,
    icon: 'lightbulb',
    id: 'feature-requests',
    title: 'Request Features',
    tone: 'light',
  },
  {
    description: 'Notes and essays about school, business, community, and building the bakery.',
    enabledFlag: 'blogEnabled',
    eyebrow: 'Writing',
    href: blogHref,
    icon: 'book-open-text',
    id: 'blog',
    mobileDescription:
      'Read or draft something while your order is coming together - notes about school, business, community, and the bakery. Limit testing this one, just for fun.',
    mobileTitle: 'Read the blog',
    title: 'Blog',
    tone: 'light',
  },
  {
    description: 'Open questions, replies, support paths, and challenges in one structured board.',
    enabledFlag: 'discussionBoardEnabled',
    eyebrow: 'Public reasoning',
    href: discussionBoardHref,
    icon: 'message-square-text',
    id: 'discussion-board',
    mobileDescription:
      'Drop a question, weigh in, or just lurk while you wait - structured questions, claims, support, and replies. Limit testing this one, just for fun.',
    mobileTitle: 'Open discussion board',
    title: 'Discussion Board',
    tone: 'dark',
  },
  {
    description: 'Practical owner advice paired with public business profiles and links.',
    enabledFlag: 'blessingsNetworkEnabled',
    eyebrow: 'Community advice',
    href: blessingsNetworkHref,
    icon: 'handshake',
    id: 'blessings-network',
    mobileDescription:
      'Browse practical advice from food and cafe owners while you wait - and discover the businesses behind each answer. Limit testing this one, just for fun.',
    mobileTitle: 'Open Community Advice',
    title: 'Community Advice',
    tone: 'light',
  },
]

const appPageEnabledFlagByHref = new Map(
  headerAppPages.map((page) => [page.href, page.enabledFlag] as const),
)

const isHeaderAppPageEnabled = (href: string, sitePages: SitePagesFlags) => {
  const enabledFlag = appPageEnabledFlagByHref.get(href)
  return enabledFlag ? sitePages[enabledFlag] : true
}

export const getEnabledHeaderAppPages = (sitePages: SitePagesFlags) => {
  return headerAppPages.filter((page) => (page.enabledFlag ? sitePages[page.enabledFlag] : true))
}

const buildAppPanelCard = (page: HeaderAppPage): HeaderPanelCard => ({
  description: page.mobileDescription ?? page.description,
  eyebrow: page.eyebrow,
  href: page.href,
  title: page.mobileTitle ?? page.title,
  tone: page.tone,
})

const buildAppPanelLink = (page: HeaderAppPage): HeaderPanelLink => ({
  description: `Go to ${page.title}.`,
  href: page.href,
  label: page.mobileTitle ?? page.title,
})

const fallbackHeaderNavigation: HeaderNavigationItem[] = [
  {
    href: rotationsHref,
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
          href: rotationsHref,
          title: 'View rotating cookie flavors',
          tone: 'dark',
        },
      ],
      links: [
        {
          description: 'Open the current cookie lineup.',
          href: rotationsHref,
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
      eyebrow: 'Menu',
      description:
        'Regular orders of single cookies in large or mini, plus build-your-own boxes, trays, and ten-packs.',
      cards: [
        {
          description:
            'Order always-available and seasonal flavors as single cookies, or switch to the Bundles tab for build-your-own boxes, trays, and honest product notes.',
          eyebrow: 'Menu landing',
          href: menuHref,
          title: 'Open the menu',
          tone: 'dark',
        },
      ],
      links: [
        {
          description: 'Go to the menu page for regular orders and bundles.',
          href: menuHref,
          label: 'Open the menu',
        },
      ],
    },
  },
  {
    href: '#announcements',
    id: 'announcements',
    kind: 'announcements',
    label: 'Announcements',
    panel: {
      eyebrow: 'From the baker',
      description:
        'Bake days, market dates, pickup windows, and other news straight from the bakery.',
      cards: [],
      links: [],
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
      cards: headerAppPages.map(buildAppPanelCard),
      links: headerAppPages.map(buildAppPanelLink),
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
  'announcements',
  'more',
]

const filterNavigationItemForSitePages = (
  item: HeaderNavigationItem,
  sitePages: SitePagesFlags,
): HeaderNavigationItem => {
  if (item.kind !== 'apps') return item

  return {
    ...item,
    panel: {
      ...item.panel,
      cards: item.panel.cards.filter((card) => isHeaderAppPageEnabled(card.href, sitePages)),
      links: item.panel.links.filter((link) => isHeaderAppPageEnabled(link.href, sitePages)),
    },
  }
}

export const headerAnnouncement =
  'Fresh bakes daily. Custom cake orders and pickup help are one click away.'

export const buildHeaderNavigation = (menu: Header['navItems'], sitePages?: SitePagesFlags) => {
  if (!menu?.length) {
    return sitePages
      ? fallbackHeaderNavigation.map((item) => filterNavigationItemForSitePages(item, sitePages))
      : fallbackHeaderNavigation
  }

  const items = menu
    .map((item) => {
      const label = item.link.label?.trim()
      if (!label) return null

      // Contact moved out of the main nav into the Other pages panel, so a
      // header-global nav item labeled "Contact" maps to the announcements
      // slot that replaced it.
      const fallbackItem = isContactLinkHint({ label })
        ? fallbackItemById.get('announcements')
        : labelToFallbackItem.get(label.toLowerCase())
      if (!fallbackItem) return null

      return fallbackItem
    })
    .filter(Boolean) as HeaderNavigationItem[]

  const itemById = new Map(items.map((item) => [item.id, item] as const))

  const prioritizedItems = navItemPriority
    .map((id) => itemById.get(id) ?? fallbackItemById.get(id))
    .filter(Boolean) as HeaderNavigationItem[]

  const navigationItems = prioritizedItems.length ? prioritizedItems : fallbackHeaderNavigation

  return sitePages
    ? navigationItems.map((item) => filterNavigationItemForSitePages(item, sitePages))
    : navigationItems
}

const isRouteActive = (pathname: string, href: string) => {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export const isHeaderNavigationItemActive = (
  pathname: string,
  item: Pick<HeaderNavigationItem, 'href' | 'id'>,
) => {
  if (isRouteActive(pathname, rotationsHref)) {
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

  if (isRouteActive(pathname, featureRequestsHref)) {
    return item.id === 'more'
  }

  if (isRouteActive(pathname, contactHref)) {
    return item.id === 'more'
  }

  return isRouteActive(pathname, item.href)
}
