import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import {
  applyMenuPlacementBeforeChange,
  menuPlacementAfterRead,
  syncMenuAutomationAfterChange,
} from '@/collections/Products/menuAutomation'
import { MINI_PRICE_RATIO } from '@/features/products/sizeVariants'
import { slugField } from 'payload'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { DefaultDocumentIDType, type Field, Where } from 'payload'

const hiddenProductDetailFields = new Set([
  'enableVariants',
  'inventory',
  'variantTypes',
  'variants',
])

// Mirrors the ecommerce plugin's default currency setup so custom price
// fields can reuse its dollar-formatted input and cell components.
const USD_CURRENCY = { code: 'USD', decimals: 2, label: 'US Dollar', symbol: '$' }
const CURRENCIES_CONFIG = { defaultCurrency: 'USD', supportedCurrencies: [USD_CURRENCY] }

const productDetailsFields = (defaultFields: Field[]): Field[] =>
  defaultFields.map(transformProductDetailField)

const transformProductDetailField = (field: Field): Field => {
  if (!field || typeof field !== 'object') {
    return field
  }

  const fieldWithChildren = field as Field & { fields?: Field[] }
  const childFields = Array.isArray(fieldWithChildren.fields)
    ? fieldWithChildren.fields.map(transformProductDetailField)
    : undefined
  const nextField = childFields ? ({ ...field, fields: childFields } as Field) : field

  if (!('name' in nextField) || typeof nextField.name !== 'string') {
    return nextField
  }

  if (hiddenProductDetailFields.has(nextField.name)) {
    return {
      ...nextField,
      admin: {
        ...(nextField.admin ?? {}),
        hidden: true,
      },
    } as Field
  }

  if (nextField.name === 'priceInUSDEnabled') {
    return {
      ...nextField,
      admin: {
        ...(nextField.admin ?? {}),
        hidden: true,
      },
      defaultValue: true,
    } as Field
  }

  if (nextField.name === 'priceInUSD') {
    return {
      ...nextField,
      admin: {
        ...(nextField.admin ?? {}),
        condition: () => true,
        description:
          'Customer-facing price. For cookie flavors sold individually, this is the Large size price.',
      },
      label: 'Price',
    } as Field
  }

  return nextField
}

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection?.admin,
    defaultColumns: [
      'title',
      'menuPlacement',
      'priceInUSD',
      'miniPriceInUSD',
      'categories',
      '_status',
    ],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'products',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
  },
  defaultPopulate: {
    ...defaultCollection?.defaultPopulate,
    title: true,
    slug: true,
    variantOptions: true,
    variants: true,
    enableVariants: true,
    gallery: true,
    menuBehavior: true,
    menuExpandedPitch: true,
    poster: true,
    menuPortionLabel: true,
    priceInUSD: true,
    inventory: true,
    meta: true,
    requiredSelectionCount: true,
    selectableProducts: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              admin: {
                description:
                  'General customer-facing description. Keep this short and clear; the menu can use it as fallback summary text when a shorter menu summary is not set.',
              },
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: 'Product Description',
              required: false,
            },
            {
              name: 'generateProductDescription',
              type: 'ui',
              admin: {
                components: {
                  Field:
                    '@/components/admin/ProductWritingGenerators#GenerateProductDescription',
                },
              },
            },
            {
              name: 'menuExpandedPitch',
              type: 'richText',
              admin: {
                description:
                  'When a customer clicks Expand on a /menu card, this longer blog-like section appears inside the opened card. Use it for selling points, serving ideas, and details that are too long for the collapsed card.',
              },
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: 'Expanded Menu Description',
              required: false,
            },
            {
              name: 'generateExpandedMenuDescription',
              type: 'ui',
              admin: {
                components: {
                  Field:
                    '@/components/admin/ProductWritingGenerators#GenerateExpandedMenuDescription',
                },
              },
            },
            {
              name: 'gallery',
              label: 'Product Photos',
              type: 'array',
              minRows: 1,
              admin: {
                description:
                  'Photos for this product. The first photo is the main storefront image, so put the best primary photo first.',
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                  admin: {
                    description: 'Choose the photo that should appear for this gallery item.',
                  },
                },
                {
                  name: 'variantOption',
                  type: 'relationship',
                  relationTo: 'variantOptions',
                  admin: {
                    description:
                      'Only use this when variants are enabled and the image belongs to one specific option.',
                    condition: (data) => {
                      return data?.enableVariants === true && data?.variantTypes?.length > 0
                    },
                  },
                  filterOptions: ({ data }) => {
                    if (data?.enableVariants && data?.variantTypes?.length) {
                      const variantTypeIDs = data.variantTypes.map((item: unknown) => {
                        if (item && typeof item === 'object' && 'id' in item && item.id) {
                          return item.id as DefaultDocumentIDType
                        }
                        return item
                      }) as DefaultDocumentIDType[]

                      if (variantTypeIDs.length === 0)
                        return {
                          variantType: {
                            in: [],
                          },
                        }

                      const query: Where = {
                        variantType: {
                          in: variantTypeIDs,
                        },
                      }

                      return query
                    }

                    return {
                      variantType: {
                        in: [],
                      },
                    }
                  },
                },
              ],
            },
            {
              name: 'bulkGalleryImages',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/ProductGalleryBulkPicker#ProductGalleryBulkPicker',
                },
              },
            },

            {
              name: 'layout',
              type: 'blocks',
              admin: {
                description:
                  'Internal legacy field from the original product-page template. Keep hidden unless the storefront gets a dedicated product detail page again.',
                hidden: true,
              },
              blocks: [CallToAction, Content, MediaBlock],
            },
            {
              name: 'poster',
              label: 'Product Info Popup',
              type: 'group',
              admin: {
                description:
                  'Reusable product information shown when customers click Info on rotating cookie pages and tray flavor choices. Use this for flavor notes, serving notes, ingredients, and allergy guidance.',
              },
              fields: [
                {
                  name: 'receiptBody',
                  label: 'Product Info Text',
                  type: 'richText',
                  admin: {
                    description:
                      'Rich text shown in the Info popup. This is reused on the rotating cookie page and in tray flavor choices. Use paragraphs and bold text for flavor notes, serving notes, ingredients, and allergy warnings.',
                  },
                  editor: lexicalEditor({
                    features: ({ rootFeatures }) => {
                      return [
                        ...rootFeatures,
                        HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
                        FixedToolbarFeature(),
                        InlineToolbarFeature(),
                      ]
                    },
                  }),
                  required: false,
                },
                {
                  name: 'generateProductInfoPopup',
                  type: 'ui',
                  admin: {
                    components: {
                      Field:
                        '@/components/admin/ProductWritingGenerators#GenerateProductInfoPopup',
                    },
                  },
                },
              ],
            },
          ],
          label: 'Description & Photos',
        },
        {
          fields: [
            ...productDetailsFields(defaultCollection.fields as Field[]),
            {
              name: 'miniPriceInUSD',
              label: 'Mini size price',
              type: 'number',
              admin: {
                components: {
                  Cell: {
                    clientProps: {
                      currenciesConfig: CURRENCIES_CONFIG,
                      currency: USD_CURRENCY,
                    },
                    path: '@payloadcms/plugin-ecommerce/client#PriceCell',
                  },
                  Field: {
                    clientProps: {
                      currenciesConfig: CURRENCIES_CONFIG,
                      currency: USD_CURRENCY,
                    },
                    path: '@payloadcms/plugin-ecommerce/rsc#PriceInput',
                  },
                },
                condition: (_, siblingData) => siblingData?.menuBehavior !== 'batchBuilder',
                description: `Only used for cookie flavors sold individually. Leave it empty and it fills in at ${Math.round(
                  MINI_PRICE_RATIO * 100,
                )}% of the main price when you save. The sizes customers see update automatically.`,
              },
              min: 0,
            },
            {
              name: 'menuPortionLabel',
              label: 'Menu Quantity Label',
              type: 'text',
              admin: {
                description:
                  'Short quantity label shown on menu cards, for example "10 jumbo cookies", "10 cups", or "One tray".',
              },
            },
            {
              name: 'menuBehavior',
              label: 'Can customers choose flavors for this item?',
              type: 'select',
              admin: {
                description:
                  'Use "Yes" for cookie trays or themed trays where the customer chooses from a list of products inside the expanded /menu card.',
              },
              defaultValue: 'simple',
              options: [
                {
                  label: 'No, simple product',
                  value: 'simple',
                },
                {
                  label: 'Yes, show flavor choices',
                  value: 'batchBuilder',
                },
              ],
            },
            {
              name: 'trayPlacement',
              type: 'ui',
              admin: {
                condition: (_, siblingData) => siblingData?.menuBehavior !== 'batchBuilder',
                components: {
                  Field: '@/components/admin/ProductTrayPlacementField#ProductTrayPlacementField',
                },
              },
            },
            {
              name: 'individualAvailability',
              type: 'select',
              admin: {
                description:
                  'Stored availability flag. Edit "Where does this flavor live right now?" instead — it sets this automatically.',
                hidden: true,
              },
              defaultValue: 'rotation',
              options: [
                {
                  label: 'Rotation only (default)',
                  value: 'rotation',
                },
                {
                  label: 'Always available on the menu',
                  value: 'always',
                },
              ],
            },
            {
              name: 'menuPlacement',
              label: 'Where does this flavor live right now?',
              type: 'select',
              admin: {
                condition: (_, siblingData) => siblingData?.menuBehavior !== 'batchBuilder',
                description:
                  'Only for cookie flavors. "Always available" puts it on the menu year-round. "In the current rotation" adds it to the active rotation and the /rotations page (arrange the order on the Flavor Rotations page). "Backlog" keeps it off the individual menu — customers can still get it inside catering trays. Saving applies the change everywhere.',
              },
              defaultValue: 'backlog',
              hooks: {
                afterRead: [menuPlacementAfterRead],
              },
              options: [
                {
                  label: 'Backlog — catering trays only',
                  value: 'backlog',
                },
                {
                  label: 'In the current rotation',
                  value: 'currentRotation',
                },
                {
                  label: 'Always available on the menu',
                  value: 'always',
                },
              ],
              virtual: true,
            },
            {
              name: 'flavorSelection',
              label: 'How do customers pick the flavors?',
              type: 'select',
              admin: {
                condition: (_, siblingData) => siblingData?.menuBehavior === 'batchBuilder',
                description:
                  'One flavor: the customer picks a single flavor and the whole tray is that flavor. Mix and match: the customer fills the box with any combination of flavors up to the quantity below (good for a build-your-own box).',
              },
              defaultValue: 'single',
              options: [
                {
                  label: 'One flavor for the whole tray',
                  value: 'single',
                },
                {
                  label: 'Mix and match (build-your-own box)',
                  value: 'mixAndMatch',
                },
              ],
            },
            {
              name: 'requiredSelectionCount',
              label: 'Tray quantity',
              type: 'number',
              admin: {
                condition: (_, siblingData) => siblingData?.menuBehavior === 'batchBuilder',
                description:
                  'How many cookies belong in the tray or box. For single-flavor trays this is the quantity of the chosen flavor; for a mix-and-match box it is the box capacity (e.g. 4).',
              },
              min: 1,
              validate: (
                value: unknown,
                {
                  siblingData,
                }: {
                  siblingData?: {
                    menuBehavior?: string | null
                  }
                },
              ) => {
                if (siblingData?.menuBehavior !== 'batchBuilder') {
                  return true
                }

                if (typeof value === 'number' && value >= 1) {
                  return true
                }

                return 'Batch-builder products require a selection count of at least 1.'
              },
            },
            {
              name: 'selectableProducts',
              label: 'Flavor choices for this tray',
              type: 'relationship',
              admin: {
                condition: (_, siblingData) => siblingData?.menuBehavior === 'batchBuilder',
                description:
                  'The cookie flavors customers can pick for this tray or box. Simplest approach: leave every cookie selected. For "mix and match" boxes the menu automatically shows only the flavors that are available right now (always-available + this month’s rotation), so rare and backlog flavors stay hidden until they return. One-flavor trays show every flavor selected here, including rare ones — that’s how customers order an out-of-season favorite.',
              },
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
              validate: (
                value: unknown,
                {
                  siblingData,
                }: {
                  siblingData?: {
                    menuBehavior?: string | null
                  }
                },
              ) => {
                if (siblingData?.menuBehavior !== 'batchBuilder') {
                  return true
                }

                if (Array.isArray(value) && value.length > 0) {
                  return true
                }

                return 'Batch-builder products need at least one selectable product.'
              },
            },
            {
              name: 'relatedProducts',
              type: 'relationship',
              admin: {
                hidden: true,
                description:
                  'Internal legacy field. Related product suggestions are not part of the current owner workflow.',
              },
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                // ID comes back as undefined during seeding so we need to handle that case
                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
          ],
          label: 'Price & Tray Choices',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),
            {
              name: 'copyProductDescriptionToSEO',
              type: 'ui',
              admin: {
                components: {
                  Field:
                    '@/components/admin/CopyProductDescriptionToSEO#CopyProductDescriptionToSEO',
                },
              },
            },
            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        description:
          'Categories group products on the /menu page and help organize the menu for customers and admins.',
        position: 'sidebar',
        sortOptions: 'title',
      },
      hasMany: true,
      relationTo: 'categories',
    },
    slugField(),
  ],
  hooks: {
    ...defaultCollection?.hooks,
    afterChange: [...(defaultCollection?.hooks?.afterChange ?? []), syncMenuAutomationAfterChange],
    beforeChange: [
      ...(defaultCollection?.hooks?.beforeChange ?? []),
      applyMenuPlacementBeforeChange,
    ],
  },
})
