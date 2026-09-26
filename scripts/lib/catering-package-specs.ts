export type CateringPackageSpec = {
  capacity: number
  galleryFromSlug: string
  priceCents: number
  slug: string
  summary: string
  title: string
  unit: 'large' | 'mini'
}

const buildSpec = (
  unit: 'large' | 'mini',
  slugSize: 'small' | 'large' | 'xl',
  capacity: number,
  priceCents: number,
): CateringPackageSpec => {
  const isMini = unit === 'mini'
  const noun = isMini ? 'mini cookies' : 'full-size cookies'

  return {
    capacity,
    galleryFromSlug: isMini ? 'mini-cookie-tray' : 'cookie-tray',
    priceCents,
    slug: `${unit}-cookie-catering-${slugSize}`,
    summary: `${capacity} ${noun} in any mix of flavors — this week’s lineup or past favorites from the Hall of Fame.`,
    title: isMini ? `Mini Cookies — ${capacity} Minis` : `Full-Size Cookies — ${capacity} Cookies`,
    unit,
  }
}

export const CATERING_PACKAGE_SPECS: CateringPackageSpec[] = [
  buildSpec('mini', 'small', 30, 4500),
  buildSpec('mini', 'large', 60, 8500),
  buildSpec('mini', 'xl', 100, 14000),
  buildSpec('large', 'small', 18, 7500),
  buildSpec('large', 'large', 36, 15000),
  buildSpec('large', 'xl', 60, 24000),
]
