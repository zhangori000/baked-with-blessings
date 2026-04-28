import type { Category, Media, Product } from '@/payload-types'
import { type Payload, type PayloadRequest, RequiredDataFromCollectionSlug } from 'payload'

import { cateringCatalog, cateringCategory, type CateringSeedSpec } from './catering-catalog'
import { createHeadingAndParagraphsRichText, createParagraphRichText } from './richText'

const buildCateringProductData = ({
  category,
  galleryImages,
  metaImage,
  relatedProducts,
  selectableProducts,
  spec,
}: {
  category: Category
  galleryImages: Media[]
  metaImage: Media
  relatedProducts: Product[]
  selectableProducts: Product[]
  spec: CateringSeedSpec
}): RequiredDataFromCollectionSlug<'products'> => {
  return {
    _status: 'published',
    categories: [category],
    description: createParagraphRichText(spec.summary),
    gallery: galleryImages.map((image) => ({ image })),
    layout: [],
    menuBehavior: spec.menuBehavior,
    menuExpandedPitch: createHeadingAndParagraphsRichText({
      heading: `Why order the ${spec.title}?`,
      paragraphs: spec.expandedPitchParagraphs,
    }),
    menuPortionLabel: spec.menuPortionLabel,
    meta: {
      description: spec.metaDescription,
      image: metaImage,
      title: `${spec.title} | Baked with Blessings`,
    },
    priceInUSD: spec.priceInUSD,
    priceInUSDEnabled: true,
    relatedProducts,
    ...(spec.menuBehavior === 'batchBuilder'
      ? {
          requiredSelectionCount: spec.requiredSelectionCount,
          selectableProducts,
        }
      : {}),
    slug: spec.slug,
    title: spec.title,
  }
}

const resolveMedia = ({
  mediaBySlug,
  slug,
}: {
  mediaBySlug: Record<string, Media>
  slug: string
}) => {
  const image = mediaBySlug[slug]

  if (!image) {
    throw new Error(`Missing media document for catering image slug "${slug}".`)
  }

  return image
}

export const seedCateringProducts = async ({
  cookieProductsBySlug,
  mediaBySlug,
  payload,
  req,
}: {
  cookieProductsBySlug: Record<string, Product>
  mediaBySlug: Record<string, Media>
  payload: Payload
  req: PayloadRequest
}) => {
  const category = await payload.create({
    collection: 'categories',
    data: cateringCategory,
    depth: 0,
    req,
  })

  for (const spec of cateringCatalog) {
    const metaImage = resolveMedia({ mediaBySlug, slug: spec.imageSlug })
    const galleryImages = (spec.galleryImageSlugs ?? [spec.imageSlug]).map((slug) =>
      resolveMedia({ mediaBySlug, slug }),
    )

    const selectableProducts = (spec.selectableProductSlugs ?? []).map((slug) => {
      const product = cookieProductsBySlug[slug]

      if (!product) {
        throw new Error(`Missing seeded cookie product for selectable slug "${slug}".`)
      }

      return product
    })

    const relatedProducts =
      spec.menuBehavior === 'batchBuilder' ? selectableProducts.slice(0, 4) : selectableProducts

    await payload.create({
      collection: 'products',
      data: buildCateringProductData({
        category,
        galleryImages,
        metaImage,
        relatedProducts,
        selectableProducts,
        spec,
      }),
      depth: 0,
      req,
    })

    payload.logger.info(`- Seeded catering product ${spec.slug}`)
  }
}
