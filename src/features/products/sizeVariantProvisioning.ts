import type { Payload, PayloadRequest } from 'payload'

import type { Variant } from '@/payload-types'

import { SIZE_OPTIONS, SIZE_VARIANT_TYPE } from './sizeVariants'

/**
 * Server-side plumbing that keeps the plugin's variant documents in step
 * with the simple fields the owner edits on the product form. The product
 * form is the source of truth: Price = Large, Mini size price = Mini.
 * Shared by the products afterChange hook and the update:flavor-lineup
 * script so the two can never drift.
 */

type SizeAxis = {
  optionIDByValue: Map<string, number>
  sizeTypeID: number
}

type EnsureArgs = {
  payload: Payload
  /** Pass the hook's req so writes join the caller's transaction. */
  req?: PayloadRequest
}

export const ensureSizeAxis = async ({ payload, req }: EnsureArgs): Promise<SizeAxis> => {
  const existingType = await payload.find({
    collection: 'variantTypes',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: { name: { equals: SIZE_VARIANT_TYPE.name } },
  })

  const sizeType =
    existingType.docs[0] ??
    (await payload.create({
      collection: 'variantTypes',
      data: { label: SIZE_VARIANT_TYPE.label, name: SIZE_VARIANT_TYPE.name },
      overrideAccess: true,
      req,
    }))

  const optionIDByValue = new Map<string, number>()

  for (const option of SIZE_OPTIONS) {
    const existingOption = await payload.find({
      collection: 'variantOptions',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        and: [{ value: { equals: option.value } }, { variantType: { equals: sizeType.id } }],
      },
    })

    const optionDoc =
      existingOption.docs[0] ??
      (await payload.create({
        collection: 'variantOptions',
        data: { label: option.label, value: option.value, variantType: sizeType.id },
        overrideAccess: true,
        req,
      }))

    optionIDByValue.set(option.value, optionDoc.id)
  }

  return { optionIDByValue, sizeTypeID: sizeType.id }
}

type SizePriceSpec = {
  /** Cents. */
  priceInUSD: number
  /** When false, an existing variant's price is left alone (create-only). */
  syncPrice: boolean
  value: string
}

type EnsureVariantsArgs = EnsureArgs & {
  axis: SizeAxis
  log?: (message: string) => void
  productID: number
  productTitle: null | string | undefined
  sizes: SizePriceSpec[]
}

/**
 * Creates missing size variants (published) and, for sizes with
 * syncPrice=true, keeps existing variant prices equal to the spec.
 */
export const ensureProductSizeVariants = async ({
  axis,
  log,
  payload,
  productID,
  productTitle,
  req,
  sizes,
}: EnsureVariantsArgs) => {
  const existingVariants = await payload.find({
    collection: 'variants',
    depth: 0,
    limit: 0,
    overrideAccess: true,
    pagination: false,
    req,
    where: { product: { equals: productID } },
  })

  const findByOptionID = (optionID: number) =>
    (existingVariants.docs as Variant[]).find((variant) =>
      (Array.isArray(variant.options) ? variant.options : []).some(
        (option) => (typeof option === 'object' && option ? option.id : option) === optionID,
      ),
    )

  for (const size of sizes) {
    const optionID = axis.optionIDByValue.get(size.value)
    const sizeLabel = SIZE_OPTIONS.find((option) => option.value === size.value)?.label ?? size.value

    if (optionID == null || !(size.priceInUSD > 0)) {
      continue
    }

    const existing = findByOptionID(optionID)

    if (!existing) {
      const created = await payload.create({
        collection: 'variants',
        data: {
          _status: 'published',
          options: [optionID],
          priceInUSD: size.priceInUSD,
          priceInUSDEnabled: true,
          product: productID,
          title: `${productTitle ?? `Product ${productID}`} — ${sizeLabel}`,
        },
        depth: 0,
        overrideAccess: true,
        req,
      })

      log?.(`created ${sizeLabel} variant #${created.id} at ${size.priceInUSD} cents`)
      continue
    }

    if (size.syncPrice && existing.priceInUSD !== size.priceInUSD) {
      await payload.update({
        id: existing.id,
        collection: 'variants',
        data: { _status: 'published', priceInUSD: size.priceInUSD, priceInUSDEnabled: true },
        depth: 0,
        overrideAccess: true,
        req,
      })

      log?.(
        `updated ${sizeLabel} variant: ${existing.priceInUSD ?? 'unset'} -> ${size.priceInUSD} cents`,
      )
    }
  }
}
