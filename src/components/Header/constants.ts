import type { Header } from '@/payload-types'

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
    href: '/shop',
    id: 'menu',
    label: 'Menu',
    panel: {
      eyebrow: 'Our story',
      description:
        'Baked with Blessings serves a wide variety of food! We have weekly cookie flavors, dips for pretzels, all kinds of bread, cake, and even savory food like pasta!',
      cards: [
        {
          description:
            'Browse breads, cakes, savory bites, pastries, pretzel dips, and rotating weekly specials from one menu.',
          eyebrow: 'Menu focus',
          href: '/shop',
          title: 'Explore the menu',
          tone: 'dark',
        },
      ],
      links: [
        {
          description: 'Browse the full collection.',
          href: '/shop',
          label: 'Explore the menu',
        },
      ],
    },
  },
  {
    href: '/market-research',
    id: 'market-research',
    label: 'Market Research',
    panel: {
      eyebrow: 'Coming soon',
      description: 'Placeholder page for future market research notes, findings, and experiments.',
      cards: [],
      links: [],
    },
  },
  {
    href: '/contact',
    id: 'words-of-affection',
    label: 'Words of Affection',
    panel: {
      eyebrow: 'Words of Affection',
      description:
        "Once you buy one of our products, please leave a posted note (it can be anonymous) for the world to see! It can be anything; whether you had a bad day, a word of affirmation, or quotes that have stuck with you, or even a struggle, or even a deep philosophical question!",
      cards: [
        {
          description:
            'A space for your honest notes, soft reminders, and honest questions to the community.',
          eyebrow: 'Community wall',
          href: '/contact',
          title: 'View/Post words of affirmation',
          tone: 'dark',
        },
      ],
      links: [
        {
          description: 'Share a note for everyone to see.',
          href: '/contact',
          label: 'View/Post words of affirmation',
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
  'menu',
  'market-research',
  'words-of-affection',
]

export const headerAnnouncement =
  'Fresh bakes daily. Custom cake orders and pickup help are one click away.'

export const buildHeaderNavigation = (menu: Header['navItems']) => {
  if (!menu?.length) return fallbackHeaderNavigation

  const items = menu
    .map((item) => {
      const label = item.link.label?.trim()
      const href = item.link.url?.trim()
      if (!label || !href) return null

      const fallbackItem = labelToFallbackItem.get(label.toLowerCase())
      if (!fallbackItem) return null

      return {
        ...fallbackItem,
        href,
      }
    })
    .filter(Boolean) as HeaderNavigationItem[]

  const itemById = new Map(items.map((item) => [item.id, item] as const))

  const prioritizedItems = navItemPriority
    .map((id) => itemById.get(id) ?? fallbackItemById.get(id))
    .filter(Boolean) as HeaderNavigationItem[]

  return prioritizedItems.length ? prioritizedItems : fallbackHeaderNavigation
}
