import type { CollectionBeforeChangeHook, CollectionConfig, Where } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { isAdminUser } from '@/access/utilities'

const defaultLockedDescription =
  'Outside the monthly rotation, this flavor is available through larger catering batches only. Making a separate dough batch for one small order creates too much waste, and the bakery is not set up with the equipment or production space to do that efficiently yet.'

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
    defaultColumns: ['title', 'status', 'rotationType', 'individualFlavorSlots', 'updatedAt'],
    description:
      'Manual storefront flavor rotations. The active rotation controls which cookie products can be ordered individually; all other cookie flavors stay visible and link customers to /menu for catering trays.',
    group: 'Content',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Internal admin title, for example "May 2026 Cookie Rotation".',
      },
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        description:
          'Only one rotation should be active. Draft and archived rotations are invisible to customers.',
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
      type: 'select',
      admin: {
        description:
          'This keeps the model flexible for future seasonal or special flavor lineups without changing the storefront API.',
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
      label: 'Public rotation name',
      type: 'text',
      admin: {
        description:
          'Optional name for this lineup, such as "May cookie rotation" or "Spring specials". Leave blank if you do not want to name the whole lineup.',
      },
    },
    {
      name: 'individualFlavorSlots',
      label: 'Rotation size',
      type: 'number',
      admin: {
        description:
          'How many flavors can be ordered individually for this rotation. Use 3 for the normal monthly model, or raise it before selecting flavors when the owner wants 5, 6, or a larger special lineup.',
      },
      defaultValue: 3,
      max: 24,
      min: 1,
      required: true,
    },
    {
      name: 'individualFlavors',
      type: 'relationship',
      admin: {
        description:
          'Choose exactly the number of cookie products set in Rotation size. These are the only cookies customers can order one at a time; every other cookie remains visible and links to /menu for catering trays.',
      },
      hasMany: true,
      relationTo: 'products',
      required: true,
      validate: (value, { siblingData }) => {
        const rotationSiblingData = siblingData as
          | {
              individualFlavorSlots?: unknown
            }
          | undefined
        const individualFlavorSlots =
          typeof rotationSiblingData?.individualFlavorSlots === 'number'
            ? rotationSiblingData.individualFlavorSlots
            : 3
        const selectedCount = Array.isArray(value) ? value.length : 0

        if (selectedCount === individualFlavorSlots) {
          return true
        }

        return `Choose exactly ${individualFlavorSlots} individual flavor(s) for this rotation.`
      },
    },
    {
      name: 'monthlyFlavorLabel',
      label: 'Selected-flavor badge text',
      type: 'text',
      admin: {
        description:
          'Short badge text for cookies included in this rotation. The default is fine unless you want wording like "Spring special" or "Available individually".',
      },
      defaultValue: "This month's flavor",
    },
    {
      name: 'lockedLabel',
      type: 'text',
      admin: {
        description: 'Short label shown beside the lock icon on non-rotation cookie cards.',
      },
      defaultValue: 'Catering only this month',
    },
    {
      name: 'lockedDescription',
      type: 'textarea',
      admin: {
        description:
          'Plain-English explanation shown for non-rotation cookies. Keep it short so it fits on small cards.',
      },
      defaultValue: defaultLockedDescription,
    },
    {
      name: 'menuLinkLabel',
      type: 'text',
      admin: {
        description: 'CTA label for catering-only cookies. The link destination remains /menu.',
      },
      defaultValue: 'View menu',
    },
    {
      name: 'ownerNotes',
      type: 'textarea',
      admin: {
        description:
          'Internal notes for the business owner. Not shown on the storefront; useful for future discount or seasonal planning.',
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [enforceSingleActiveFlavorRotation],
  },
}
