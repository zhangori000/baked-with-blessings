import config from '@payload-config'
import { headers } from 'next/headers'
import { createLocalReq, getPayload, type DefaultDocumentIDType, type Payload } from 'payload'

import { isAdminUser } from '@/access/utilities'
import type { Product } from '@/payload-types'

export const maxDuration = 300

type BulkCookiePriceRequest = {
  priceInUSD?: unknown
}

type UpdatedCookieProduct = {
  id: Product['id']
  nextPrice: number
  previousPrice: number | null
  slug: string | null
  title: string
}

const cookieProductPageSize = 100

const parsePriceInUSDCents = (value: unknown): number | null => {
  const price =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : NaN

  if (!Number.isFinite(price) || price <= 0) {
    return null
  }

  return Math.round(price * 100)
}

const getCookieCategoryID = async (payload: Payload): Promise<DefaultDocumentIDType | null> => {
  const categoryResult = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: 'cookies',
      },
    },
  })

  return categoryResult.docs[0]?.id ?? null
}

const findCookieProducts = async ({
  cookieCategoryID,
  payload,
}: {
  cookieCategoryID: DefaultDocumentIDType
  payload: Payload
}) => {
  const products: Product[] = []
  let page = 1
  let totalPages = 1

  do {
    const productsResult = await payload.find({
      collection: 'products',
      depth: 0,
      draft: true,
      limit: cookieProductPageSize,
      overrideAccess: true,
      page,
      pagination: true,
      select: {
        id: true,
        priceInUSD: true,
        priceInUSDEnabled: true,
        slug: true,
        title: true,
      },
      where: {
        and: [
          {
            categories: {
              contains: cookieCategoryID,
            },
          },
          {
            menuBehavior: {
              not_equals: 'batchBuilder',
            },
          },
        ],
      },
    })

    products.push(...productsResult.docs)
    totalPages = productsResult.totalPages
    page += 1
  } while (page <= totalPages)

  return products
}

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !isAdminUser(user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  let body: BulkCookiePriceRequest

  try {
    body = (await request.json()) as BulkCookiePriceRequest
  } catch {
    return Response.json(
      {
        error: 'Send a JSON body with priceInUSD.',
        success: false,
      },
      { status: 400 },
    )
  }

  const priceInUSD = parsePriceInUSDCents(body.priceInUSD)

  if (priceInUSD === null) {
    return Response.json(
      {
        error: 'Enter a price greater than 0.',
        success: false,
      },
      { status: 400 },
    )
  }

  const cookieCategoryID = await getCookieCategoryID(payload)

  if (!cookieCategoryID) {
    return Response.json(
      {
        error: 'Could not find the cookies category.',
        success: false,
      },
      { status: 404 },
    )
  }

  try {
    const payloadReq = await createLocalReq({ user }, payload)
    const products = await findCookieProducts({
      cookieCategoryID,
      payload,
    })

    const updatedProducts: UpdatedCookieProduct[] = []
    let skippedCount = 0

    for (const product of products) {
      if (product.priceInUSD === priceInUSD && product.priceInUSDEnabled === true) {
        skippedCount += 1
        continue
      }

      await payload.update({
        id: product.id,
        collection: 'products',
        data: {
          priceInUSD,
          priceInUSDEnabled: true,
        },
        depth: 0,
        overrideAccess: true,
        req: payloadReq,
      })

      updatedProducts.push({
        id: product.id,
        nextPrice: priceInUSD,
        previousPrice: product.priceInUSD ?? null,
        slug: product.slug ?? null,
        title: product.title,
      })
    }

    return Response.json({
      matchedCount: products.length,
      priceInUSD,
      products: updatedProducts,
      skippedCount,
      success: true,
      updatedCount: updatedProducts.length,
    })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown cookie price update error'

    payload.logger.error({ err: e, message: `Error updating cookie prices: ${errorMessage}` })

    return Response.json(
      {
        error: errorMessage,
        success: false,
      },
      { status: 500 },
    )
  }
}
