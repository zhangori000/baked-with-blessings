import type {
  CollectionBeforeChangeHook,
  CollectionConfig,
  DefaultDocumentIDType,
  PayloadRequest,
  Where,
} from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { isAdminUser } from '@/access/utilities'
import {
  bakerDailyWorkGroup,
  cookieLineupLabels,
  multipleActiveLineupsError,
} from '@/utilities/bakerMenuAdmin'

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
    throw new Error(multipleActiveLineupsError)
  }

  return data
}

export const FlavorRotations: CollectionConfig = {
  slug: 'flavor-rotations',
  labels: cookieLineupLabels,
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
    defaultColumns: ['title', 'status', 'individualFlavors', 'updatedAt'],
    description:
      "This week's specials. The live lineup is what customers see on Specials of the Week.",
    group: bakerDailyWorkGroup,
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      label: 'Admin name',
      type: 'text',
      admin: {
        description:
          'Internal name so you can recognize this lineup later. Customers do not see this.',
      },
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        description:
          'Set exactly one lineup to Live now. Not-live and past lineups stay off the storefront.',
      },
      defaultValue: 'draft',
      options: [
        {
          label: 'Not live yet',
          value: 'draft',
        },
        {
          label: 'Live now',
          value: 'active',
        },
        {
          label: 'Past lineup',
          value: 'archived',
        },
      ],
      required: true,
    },
    {
      name: 'rotationType',
      label: 'For your notes',
      type: 'select',
      admin: {
        description:
          'Optional label for monthly, seasonal, or one-off lineups. It does not change the public page by itself.',
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
      name: 'showcaseProducts',
      label: 'Cookies you might rotate this month',
      type: 'relationship',
      admin: {
        components: {
          Field: '@/components/admin/RotationShowcaseProductsField#RotationShowcaseProductsField',
        },
        description:
          "Check the cookies you are considering. Customers do not see this list until you pick them as this week's specials below.",
      },
      filterOptions: async ({ req }) => buildRotationEligibleProductWhere(req),
      hasMany: true,
      relationTo: 'products',
      required: true,
      validate: async (value, { req }) => {
        const selectedIDs = getRelationshipIDs(value)

        if (selectedIDs.length === 0) {
          return 'Choose at least one cookie you might rotate this month.'
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

        return `Remove tray, catering-pack, or build-your-own items from this list: ${productNames}.`
      },
    },
    {
      name: 'individualFlavors',
      label: "This week's specials",
      type: 'relationship',
      admin: {
        description:
          'Choose any number from the list above. These cookies appear on Specials of the Week, in the order shown here.',
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
          return "Choose at least one cookie for this week's specials."
        }

        const missingFromShowcase = selectedIDs.filter((id) => !showcaseIDs.has(id))

        if (missingFromShowcase.length === 0) {
          return true
        }

        return "Every cookie in this week's specials must also be checked in the list above."
      },
    },
    {
      name: 'monthlyFlavorLabel',
      label: "Badge on this week's specials",
      type: 'text',
      admin: {
        description:
          'Small label on Specials of the Week, for example "This week\'s special" or "Available individually".',
      },
      defaultValue: "This month's flavor",
    },
    {
      name: 'lockedLabel',
      label: 'Badge on catering-only flavors',
      type: 'text',
      admin: {
        description:
          "Short label used when a flavor is outside this week's specials and only available through catering.",
      },
      defaultValue: 'Catering only this month',
    },
    {
      name: 'lockedDescription',
      label: 'Catering-only explanation',
      type: 'textarea',
      admin: {
        description:
          "Message used when a customer opens a flavor that is not in this week's specials.",
      },
      defaultValue: defaultLockedDescription,
    },
    {
      name: 'menuLinkLabel',
      label: 'Catering menu button text',
      type: 'text',
      admin: {
        description: 'Button label for catering-only flavors. It always goes to the Menu page.',
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
  },
}
