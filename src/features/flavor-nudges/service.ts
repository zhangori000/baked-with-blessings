import type { Payload } from 'payload'

import { queryOldFlavorPosters } from '@/app/(app)/cookiePosterQueries'
import { relationID } from '@/features/flavor-polls/services'
import type { CookiePosterAsset } from '@/features/products/cookieDisplayData'
import type { FlavorNudge } from '@/payload-types'

import type { NudgeFlavor, NudgeSummaryRow } from './types'

export const NUDGE_OWNER_ALERTS_PER_HOUR = 30

export const toNudgeFlavors = (posters: CookiePosterAsset[]): NudgeFlavor[] =>
  posters.flatMap((poster) =>
    typeof poster.productId === 'number'
      ? [
          {
            fallbackSrc: poster.bodyFallbackSrc,
            image: poster.image,
            productId: poster.productId,
            title: poster.title,
          },
        ]
      : [],
  )

export const loadNudgeFlavors = async () => toNudgeFlavors(await queryOldFlavorPosters())

const findNudges = async (payload: Payload, voterKey: string, productIDs?: number[]) => {
  const result = await payload.find({
    collection: 'flavor-nudges',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { voterKey: { equals: voterKey } },
        ...(productIDs ? [{ product: { in: productIDs } }] : []),
      ],
    },
  })

  return result.docs as FlavorNudge[]
}

export const findVoterNudgeIDs = async (payload: Payload, voterKey: string | null) => {
  if (!voterKey) return []
  const docs = await findNudges(payload, voterKey)
  return docs.map((doc) => relationID(doc.product)).filter((id): id is number => id !== null)
}

export const submitNudges = async ({
  email,
  payload,
  productIDs,
  voterKey,
}: {
  email: string | null
  payload: Payload
  productIDs: number[]
  voterKey: string
}) => {
  const existing = await findNudges(payload, voterKey, productIDs)
  const existingByProduct = new Map(existing.map((doc) => [relationID(doc.product), doc]))
  const created: number[] = []

  for (const productID of productIDs) {
    const doc = existingByProduct.get(productID)

    if (doc) {
      if (email && doc.email !== email) {
        await payload.update({
          id: doc.id,
          collection: 'flavor-nudges',
          data: { email },
          depth: 0,
          overrideAccess: true,
        })
      }
      continue
    }

    try {
      await payload.create({
        collection: 'flavor-nudges',
        data: { email, product: productID, voterKey },
        depth: 0,
        overrideAccess: true,
      })
      created.push(productID)
    } catch (error) {
      const [raced] = await findNudges(payload, voterKey, [productID])
      if (!raced) throw error
    }
  }

  return { created, nudged: await findVoterNudgeIDs(payload, voterKey) }
}

export const countNudgesFor = async (payload: Payload, productIDs: number[]) => {
  const counts = await Promise.all(
    productIDs.map(async (productID) => {
      const { totalDocs } = await payload.count({
        collection: 'flavor-nudges',
        overrideAccess: true,
        where: { product: { equals: productID } },
      })
      return [productID, totalDocs] as const
    }),
  )

  return new Map(counts)
}

export const countRecentNudges = async (payload: Payload, since: Date) => {
  const { totalDocs } = await payload.count({
    collection: 'flavor-nudges',
    overrideAccess: true,
    where: { createdAt: { greater_than: since.toISOString() } },
  })
  return totalDocs
}

export const summarizeNudges = async (payload: Payload): Promise<NudgeSummaryRow[]> => {
  const result = await payload.find({
    collection: 'flavor-nudges',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    select: { createdAt: true, email: true, product: true },
    sort: '-createdAt',
  })
  const rows = new Map<number, { count: number; emails: Set<string>; lastNudgedAt: string }>()

  for (const doc of result.docs as FlavorNudge[]) {
    const productID = relationID(doc.product)
    if (productID === null) continue
    const row = rows.get(productID) ?? {
      count: 0,
      emails: new Set<string>(),
      lastNudgedAt: doc.createdAt,
    }
    row.count += 1
    if (doc.email) row.emails.add(doc.email)
    rows.set(productID, row)
  }

  if (rows.size === 0) return []

  const products = await payload.find({
    collection: 'products',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    select: { title: true },
    where: { id: { in: Array.from(rows.keys()) } },
  })
  const titleByID = new Map(products.docs.map((product) => [product.id, product.title]))

  return Array.from(rows.entries())
    .map(([productID, row]) => ({
      count: row.count,
      emails: Array.from(row.emails),
      lastNudgedAt: row.lastNudgedAt,
      productId: productID,
      title: titleByID.get(productID) ?? 'A deleted flavor',
    }))
    .sort(
      (left, right) =>
        right.count - left.count || right.lastNudgedAt.localeCompare(left.lastNudgedAt),
    )
}
