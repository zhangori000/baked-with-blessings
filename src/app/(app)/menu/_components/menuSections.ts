export const shopSectionGroups = [
  {
    id: 'sweets',
    label: 'Sweets',
    detail: 'Cookies',
    categorySlugs: ['cookies'],
  },
  {
    id: 'sips-snacks',
    label: 'Sips + Snacks',
    detail: 'Drinks + bites',
    categorySlugs: ['drinks', 'snacks-and-dips'],
  },
  {
    id: 'meals',
    label: 'Meals',
    detail: 'Breads + entrees',
    categorySlugs: ['breads', 'entrees'],
  },
] as const

export type ShopSectionGroup = (typeof shopSectionGroups)[number]
