import { defaultMiniPriceInUSD } from '@/features/products/sizeVariants'

const BUNDLE_SIZE_BY_SLUG = {
  'build-your-own-cookie-box': 'large',
  'build-your-own-mini-box': 'mini',
  'cookie-tray': 'large',
  'mini-cookie-tray': 'mini',
} as const

export const BUNDLE_SLUGS = Object.keys(BUNDLE_SIZE_BY_SLUG)

export type BundlePricing = {
  count: number
  price: number
  size: 'large' | 'mini'
  title: string
}

type BundlePricingCheck = {
  bundles: BundlePricing[]
  complete: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const parseBundlePricingResponse = (value: unknown): BundlePricingCheck => {
  if (!isRecord(value) || !Array.isArray(value.docs)) {
    return { bundles: [], complete: false }
  }

  let complete = true
  const bundles: BundlePricing[] = []

  if ('hasNextPage' in value && typeof value.hasNextPage !== 'boolean') {
    complete = false
  } else if (value.hasNextPage === true) {
    complete = false
  }

  if (
    'totalDocs' in value &&
    (!Number.isInteger(value.totalDocs) || value.totalDocs !== value.docs.length)
  ) {
    complete = false
  }

  for (const doc of value.docs) {
    if (!isRecord(doc)) {
      complete = false
      continue
    }

    const slug = typeof doc.slug === 'string' ? doc.slug : ''
    const size = BUNDLE_SIZE_BY_SLUG[slug as keyof typeof BUNDLE_SIZE_BY_SLUG]
    const count = doc.requiredSelectionCount
    const price = doc.priceInUSD

    if (
      !size ||
      !Number.isInteger(count) ||
      (count as number) <= 0 ||
      !Number.isInteger(price) ||
      (price as number) <= 0
    ) {
      complete = false
      continue
    }

    bundles.push({
      count: count as number,
      price: price as number,
      size,
      title: typeof doc.title === 'string' && doc.title.trim() ? doc.title : slug,
    })
  }

  return { bundles, complete }
}

export const getBundlePricingWarnings = ({
  bundles,
  largePriceInCents,
  updateMiniPrices,
}: {
  bundles: BundlePricing[]
  largePriceInCents: number
  updateMiniPrices: boolean
}): string[] => {
  const miniPriceInCents = defaultMiniPriceInUSD(largePriceInCents)

  return bundles.flatMap((bundle) => {
    if (bundle.size === 'mini' && !updateMiniPrices) {
      return []
    }

    const unitPriceInCents = bundle.size === 'mini' ? miniPriceInCents : largePriceInCents
    const individualPriceInCents = unitPriceInCents * bundle.count

    if (bundle.price < individualPriceInCents) {
      return []
    }

    return [
      `${bundle.title} (${formatUSDFromCents(bundle.price)}) would be no cheaper than buying ${bundle.count} ${bundle.size} cookies individually (${formatUSDFromCents(individualPriceInCents)}).`,
    ]
  })
}

const formatUSDFromCents = (value: number) =>
  new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(value / 100)
