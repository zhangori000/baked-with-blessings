import type {
  CollectionBeforeChangeHook,
  CollectionConfig,
  DefaultDocumentIDType,
  PayloadRequest,
  Where,
} from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { isAdminUser } from '@/access/utilities'

const defaultLockedDescription =
  'Outside the monthly rotation, this flavor is available through larger catering batches only. Making a separate dough batch for one small order creates too much waste, and the bakery is not set up with the equipment or production space to do that efficiently yet.'

type ProductRelationship = DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null | undefined

const getRelationshipID = (value: ProductRelationship) => {
  if (!value) {
    return undefined
  }

  return typeof value === 'object' ? value.id : value
}

const getRelationshipIDs = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => getRelationshipID(item as ProductRelationship))
    .filter((id): id is DefaultDocumentIDType => id != null)
    .map((id) => String(id))
}

const queryCateringCategoryID = async (req: PayloadRequest) => {
  const categoryResult = await req.payload.find({
    collection: 'categories',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      slug: {
        equals: 'catering',
      },
    },
  })

  return categoryResult.docs[0]?.id ?? null
}

const buildRotationEligibleProductWhere = async (req: PayloadRequest): Promise<Where> => {
  const and: Where[] = [
    {
      menuBehavior: {
        not_equals: 'batchBuilder',
      },
    },
  ]
  const cateringCategoryID = await queryCateringCategoryID(req)

  if (cateringCategoryID != null) {
    and.push({
      categories: {
        not_in: [cateringCategoryID],
      },
    })
  }

  return {
    and,
  }
}

const buildRotationIneligibleProductWhere = async (req: PayloadRequest): Promise<Where> => {
  const or: Where[] = [
    {
      menuBehavior: {
        equals: 'batchBuilder',
      },
    },
  ]
  const cateringCategoryID = await queryCateringCategoryID(req)

  if (cateringCategoryID != null) {
    or.push({
      categories: {
        contains: cateringCategoryID,
      },
    })
  }

  return {
    or,
  }
}

const enforceSingleActiveFlavorRotation: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const nextStatus = data?.status ?? originalDoc?.status

  if (nextStatus !== 'active') {
    return data
  }

  const currentID = operation === 'update' ? originalDoc?.id : undefined
  const where: Where =
    currentID != null
      ? {
          and: [
            {
              status: {
                equals: 'active',
              },
            },
            {
              id: {
                not_equals: currentID,
              },
            },
          ],
        }
      : {
          status: {
            equals: 'active',
          },
        }

  const existingActiveRotation = await req.payload.find({
    collection: 'flavor-rotations',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where,
  })

  if (existingActiveRotation.docs.length > 0) {
    throw new Error(
      'Only one flavor rotation can be active at a time. Archive the current active rotation before activating another one.',
    )
  }

  return data
}

export const FlavorRotations: CollectionConfig = {
  slug: 'flavor-rotations',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: ({ req: { user } }) => {
      if (user && isAdminUser(user)) {
        return true
      }

      return {
        status: {
          equals: 'active',
        },
      }
    },
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['title', 'status', 'rotationType', 'individualFlavors', 'updatedAt'],
    description:
      'Controls the /rotations page. Choose every flavor customers should see, then choose which of those are available for individual orders right now.',
    group: 'Content',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      label: 'Admin name',
      type: 'text',
      admin: {
        description:
          'Internal name so you can recognize this rotation later. Customers do not see this.',
      },
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        description:
          'Set exactly one rotation to Active. Draft and Archived rotations do not control the storefront.',
      },
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      required: true,
    },
    {
      name: 'rotationType',
      label: 'Schedule type',
      type: 'select',
      admin: {
        description:
          'Internal organizer for monthly, seasonal, or special lineups. It does not change the page by itself.',
      },
      defaultValue: 'monthly',
      options: [
        {
          label: 'Monthly',
          value: 'monthly',
        },
        {
          label: 'Seasonal',
          value: 'seasonal',
        },
        {
          label: 'Special',
          value: 'special',
        },
      ],
      required: true,
    },
    {
      name: 'displayLabel',
      label: 'Legacy public rotation name',
      type: 'text',
      admin: {
        hidden: true,
        description:
          'Legacy field kept for old data. Use the badge and catering-only fields below for customer-facing text.',
      },
    },
    {
      name: 'showcaseProducts',
      label: 'All flavors shown on /rotations',
      type: 'relationship',
      admin: {
        components: {
          Field:
            '@/components/admin/RotationShowcaseProductsField#RotationShowcaseProductsField',
        },
        description:
          'Every normal product selected here appears on the /rotations page. Tray, catering-pack, and batch-builder products are intentionally excluded.',
      },
      filterOptions: async ({ req }) => buildRotationEligibleProductWhere(req),
      hasMany: true,
      relationTo: 'products',
      required: true,
      validate: async (value, { req }) => {
        const selectedIDs = getRelationshipIDs(value)

        if (selectedIDs.length === 0) {
          return 'Choose at least one flavor/product to show on /rotations.'
        }

        const ineligibleProductWhere = await buildRotationIneligibleProductWhere(req)
        const ineligibleProducts = await req.payload.find({
          collection: 'products',
          depth: 0,
          limit: selectedIDs.length,
          overrideAccess: true,
          pagination: false,
          req,
          select: {
            title: true,
          },
          where: {
            and: [
              {
                id: {
                  in: selectedIDs,
                },
              },
              ineligibleProductWhere,
            ],
          },
        })

        if (ineligibleProducts.docs.length === 0) {
          return true
        }

        const productNames = ineligibleProducts.docs
          .map((product) => product.title)
          .filter(Boolean)
          .join(', ')

        return `Remove tray, catering-pack, or batch-builder products from /rotations: ${productNames}.`
      },
    },
    {
      name: 'individualFlavors',
      label: 'Available for individual orders right now',
      type: 'relationship',
      admin: {
        description:
          'Choose from the list above. These flavors appear first and customers can add them directly to cart; the other shown flavors become catering-only.',
      },
      filterOptions: async ({ req, siblingData }) => {
        const showcaseIDs = getRelationshipIDs(
          (siblingData as { showcaseProducts?: unknown } | undefined)?.showcaseProducts,
        )
        const rotationEligibleProductWhere = await buildRotationEligibleProductWhere(req)

        if (showcaseIDs.length > 0) {
          return {
            and: [
              {
                id: {
                  in: showcaseIDs,
                },
              },
              rotationEligibleProductWhere,
            ],
          }
        }

        return rotationEligibleProductWhere
      },
      hasMany: true,
      relationTo: 'products',
      required: true,
      validate: (value, { siblingData }) => {
        const selectedIDs = getRelationshipIDs(value)
        const showcaseIDs = new Set(
          getRelationshipIDs(
            (siblingData as { showcaseProducts?: unknown } | undefined)?.showcaseProducts,
          ),
        )

        if (selectedIDs.length === 0) {
          return 'Choose at least one flavor that can be ordered individually.'
        }

        const missingFromShowcase = selectedIDs.filter((id) => !showcaseIDs.has(id))

        if (missingFromShowcase.length === 0) {
          return true
        }

        return 'Every individually available flavor must also be selected in "All flavors shown on /rotations".'
      },
    },
    {
      name: 'monthlyFlavorLabel',
      label: 'Badge on individually available flavors',
      type: 'text',
      admin: {
        description:
          'Small label shown on flavors customers can order one at a time, for example "This month\'s flavor" or "Available individually".',
      },
      defaultValue: "This month's flavor",
    },
    {
      name: 'lockedLabel',
      label: 'Badge on catering-only flavors',
      type: 'text',
      admin: {
        description:
          'Short label shown on flavors that are visible on /rotations but cannot be ordered one at a time.',
      },
      defaultValue: 'Catering only this month',
    },
    {
      name: 'lockedDescription',
      label: 'Catering-only explanation',
      type: 'textarea',
      admin: {
        description:
          'Message shown when a customer opens a visible flavor that is not available for individual ordering.',
      },
      defaultValue: defaultLockedDescription,
    },
    {
      name: 'menuLinkLabel',
      label: 'Catering menu button text',
      type: 'text',
      admin: {
        description:
          'Button label for catering-only flavors. The destination is always the /menu page.',
      },
      defaultValue: 'View menu',
    },
    {
      name: 'ownerNotes',
      type: 'textarea',
      admin: {
        description:
          'Private notes for planning. Customers never see this.',
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [enforceSingleActiveFlavorRotation],
  },
}
