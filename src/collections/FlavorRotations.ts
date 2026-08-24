import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
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

/** Public lineup cookies must also live in the planning pool. Staff only pick the public set. */
export const ensureShowcaseContainsPublicCookies: CollectionBeforeValidateHook = ({
  data,
  originalDoc,
}) => {
  if (!data || typeof data !== 'object') {
    return data
  }

  const publicIDs = getRelationshipIDs(
    data.individualFlavors !== undefined ? data.individualFlavors : originalDoc?.individualFlavors,
  )
  const showcaseIDs = getRelationshipIDs(
    data.showcaseProducts !== undefined ? data.showcaseProducts : originalDoc?.showcaseProducts,
  )
  const merged = Array.from(new Set([...showcaseIDs, ...publicIDs]))

  if (merged.length > 0) {
    data.showcaseProducts = merged
  }

  return data
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
  labels: {
    plural: 'Cookie lineups',
    singular: 'Cookie lineup',
  },
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
    components: {
      beforeList: ['@/components/admin/FlavorRotationListIntro#FlavorRotationListIntro'],
    },
    defaultColumns: ['title', 'status', 'rotationType', 'individualFlavors', 'updatedAt'],
    description:
      'This is the current cookie lineup. The Active lineup is what customers see on Specials of the Week (/rotations) and the homepage.',
    group: 'Daily work',
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
        position: 'sidebar',
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
      name: 'individualFlavors',
      label: 'Cookies on Specials of the Week',
      type: 'relationship',
      admin: {
        description:
          'These cookies appear on Specials of the Week and the homepage. Drag to change the order. Saving updates the public site.',
      },
      filterOptions: async ({ req }) => buildRotationEligibleProductWhere(req),
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
          return 'Choose at least one cookie for Specials of the Week.'
        }

        const missingFromShowcase = selectedIDs.filter((id) => !showcaseIDs.has(id))

        if (missingFromShowcase.length === 0) {
          return true
        }

        return 'Every public lineup cookie must also be in the optional considering list below. Save again if you just added a cookie — it is added automatically.'
      },
    },
    {
      name: 'showcaseProducts',
      label: 'Also considering (not on the site yet)',
      type: 'relationship',
      admin: {
        components: {
          Field: '@/components/admin/RotationShowcaseProductsField#RotationShowcaseProductsField',
        },
        description:
          'Optional extra flavors you are thinking about. Cookies you pick for Specials of the Week are added here automatically. This list does not appear on the public site by itself.',
      },
      filterOptions: async ({ req }) => buildRotationEligibleProductWhere(req),
      hasMany: true,
      relationTo: 'products',
      required: true,
      validate: async (value, { req }) => {
        const selectedIDs = getRelationshipIDs(value)

        if (selectedIDs.length === 0) {
          return 'Choose at least one cookie for Specials of the Week. It will be added here automatically.'
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

        return `Remove tray, catering-pack, or batch-builder products from this list: ${productNames}.`
      },
    },
    {
      name: 'monthlyFlavorLabel',
      label: 'Badge on public rotation cookies',
      type: 'text',
      admin: {
        description:
          'Small label shown on /rotations cookies, for example "This month\'s flavor" or "Available individually".',
      },
      defaultValue: "This month's flavor",
    },
    {
      name: 'lockedLabel',
      label: 'Badge on catering-only flavors',
      type: 'text',
      admin: {
        description:
          'Short label used by broader cookie showcases when a flavor is outside the public rotation and only available through catering.',
      },
      defaultValue: 'Catering only this month',
    },
    {
      name: 'lockedDescription',
      label: 'Catering-only explanation',
      type: 'textarea',
      admin: {
        description:
          'Message used by broader cookie showcases when a customer opens a flavor outside the public rotation.',
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
        description: 'Private notes for planning. Customers never see this.',
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [enforceSingleActiveFlavorRotation],
    beforeValidate: [ensureShowcaseContainsPublicCookies],
  },
}
