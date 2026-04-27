import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
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

const productDetailsDescriptions: Record<string, string> = {
  inventory:
    'Stock count for simple products. If you enable variants, manage stock on each variant instead of here.',
  enableVariants:
    'Turn this on when one product needs selectable options such as size, flavor, filling, or color.',
  variantTypes:
    'Choose which kinds of options customers can pick, for example size, flavor, or pickup package.',
  variants:
    'After you choose variant types, create the actual purchasable combinations here with their own price and inventory.',
}

const productDetailsFields = (defaultFields: Field[]): Field[] =>
  defaultFields.map((field): Field => {
    if (!field || typeof field !== 'object' || !('name' in field)) {
      return field
    }

    const description = productDetailsDescriptions[field.name]

    if (description) {
      return {
        ...field,
        admin: {
          ...(field.admin ?? {}),
          description,
        },
      } as Field
    }

    return field
  })

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection?.admin,
    defaultColumns: ['title', 'categories', 'menuBehavior', 'priceInUSD', 'inventory', '_status'],
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
                  'Short product story for the product page and supporting storefront copy.',
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
              label: false,
              required: false,
            },
            {
              name: 'menuExpandedPitch',
              type: 'richText',
              admin: {
                description:
                  'Long-form copy shown inside expandable menu cards. Use this when you want a more persuasive, blog-like section without creating a dedicated product page.',
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
              label: 'Expanded Menu Pitch',
              required: false,
            },
            {
              name: 'gallery',
              type: 'array',
              minRows: 1,
              admin: {
                description:
                  'Product image gallery. The first image is the main storefront image, so put the best primary photo first.',
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
                  'Optional long-form sections below the main product details. Use these for ingredient notes, FAQs, extra selling copy, or supporting media.',
              },
              blocks: [CallToAction, Content, MediaBlock],
            },
            {
              name: 'poster',
              label: 'Cookie Card Details',
              type: 'group',
              admin: {
                description:
                  'Display details for the cookie cards and cookie detail art. This is where the business owner edits the short cookie tags, summary, and the handwritten-style ingredient note popup.',
              },
              fields: [
                {
                  name: 'subtitle',
                  type: 'text',
                  admin: {
                    description: 'Short line used under the cookie title on poster-style storefront cards.',
                  },
                },
                {
                  name: 'chips',
                  type: 'array',
                  admin: {
                    description:
                      'Short all-caps tags shown as visual pills, such as BROWN BUTTER or CHEWY.',
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      name: 'text',
                      type: 'text',
                      required: true,
                    },
                  ],
                },
                {
                  name: 'label',
                  type: 'text',
                  admin: {
                    description:
                      'Highlighted label shown above the cookie title on the poster detail page.',
                  },
                },
                {
                  name: 'labelTone',
                  type: 'text',
                  admin: {
                    description:
                      'Background color for the poster label, usually a hex value like #f6c58f.',
                  },
                },
                {
                  name: 'summary',
                  type: 'textarea',
                  admin: {
                    description:
                      'Short marketing summary used on the poster card and poster detail page.',
                  },
                },
                {
                  name: 'infoButtonLabel',
                  type: 'text',
                  admin: {
                    description:
                      'Small label for the translucent scene button that opens the baker-note ingredient popup.',
                  },
                },
                {
                  name: 'ingredientsNoteTitle',
                  type: 'text',
                  admin: {
                    description:
                      'Notebook-style heading shown inside the ingredient popup, for example Baker Notes.',
                  },
                },
                {
                  name: 'ingredientsIntro',
                  type: 'textarea',
                  admin: {
                    description:
                      'Optional handwritten-style intro sentence above the ingredients list in the popup.',
                  },
                },
                {
                  name: 'ingredients',
                  type: 'array',
                  admin: {
                    description:
                      'Ingredients or cookie components that should appear inside the popup note.',
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      required: true,
                    },
                    {
                      name: 'detail',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            ...productDetailsFields(defaultCollection.fields as Field[]),
            {
              name: 'menuPortionLabel',
              type: 'text',
              admin: {
                description:
                  'Short quantity label for menu cards, for example "10 jumbo cookies", "10 cups", or "One tray".',
              },
            },
            {
              name: 'menuBehavior',
              type: 'select',
              admin: {
                description:
                  'Use configurable tray when this product is built from child product flavors instead of being added directly. The storefront currently supports single-flavor trays, and custom mix trays can be enabled later without changing the relationship model.',
              },
              defaultValue: 'simple',
              options: [
                {
                  label: 'Simple Add To Cart',
                  value: 'simple',
                },
                {
                  label: 'Configurable Tray',
                  value: 'batchBuilder',
                },
              ],
            },
            {
              name: 'requiredSelectionCount',
              type: 'number',
              admin: {
                condition: (_, siblingData) => siblingData?.menuBehavior === 'batchBuilder',
                description:
                  'How many cookies belong in the tray. For today\'s single-flavor trays, this becomes the quantity of the chosen flavor.',
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
              type: 'relationship',
              admin: {
                condition: (_, siblingData) => siblingData?.menuBehavior === 'batchBuilder',
                description:
                  'Choose which cookie flavors are allowed for this tray. The storefront currently lets the customer pick one of these flavors for the full tray.',
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
                description:
                  'Pick other products that should be suggested alongside this one on the storefront.',
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
          label: 'Product Details',
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
})
