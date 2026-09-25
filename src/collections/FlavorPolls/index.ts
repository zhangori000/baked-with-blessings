import type { CollectionConfig, PayloadRequest, Where } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { isAdminUser } from '@/access/utilities'
import { CATERING_FLAVOR_CATEGORY_SLUG } from '@/features/products/cateringPackages'
import {
  FLAVOR_POLL_DEFAULT_TITLE,
  FLAVOR_POLL_DEFAULT_VOTES_PER_PERSON,
  FLAVOR_POLL_MAX_VOTES_PER_PERSON,
} from '@/features/flavor-polls/constants'
import { getNextScheduledPollClose } from '@/features/flavor-polls/schedule'
import type { FlavorPoll } from '@/payload-types'

const buildBallotProductWhere = async (req: PayloadRequest): Promise<Where> => {
  const categoryResult = await req.payload.find({
    collection: 'categories',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    select: { slug: true },
    where: { slug: { equals: CATERING_FLAVOR_CATEGORY_SLUG } },
  })
  const categoryID = categoryResult.docs[0]?.id
  const and: Where[] = [{ menuBehavior: { not_equals: 'batchBuilder' } }]

  if (categoryID != null) {
    and.push({ categories: { contains: categoryID } })
  }

  return { and }
}

export const FlavorPolls: CollectionConfig = {
  slug: 'flavor-polls',
  labels: {
    plural: 'Flavor Votes',
    singular: 'Flavor Vote',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: ({ req: { user } }) => {
      if (isAdminUser(user)) {
        return true
      }

      return { status: { equals: 'live' } }
    },
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['title', 'status', 'closesAt', 'updatedAt'],
    description:
      'Weekly flavor votes for /vote. Make a new one each week: pick the flavors and set it to Live. It opens and closes on its own. After it closes, its results stay on /vote until the next vote opens, and they always stay at their own results link.',
    group: 'Content',
    useAsTitle: 'title',
  },
  defaultSort: '-closesAt',
  hooks: {
    beforeDelete: [
      async ({ id, req }) => {
        await req.payload.delete({
          collection: 'flavor-poll-votes',
          overrideAccess: true,
          req,
          where: { poll: { equals: id } },
        })
      },
    ],
  },
  fields: [
    {
      name: 'title',
      label: 'Headline',
      type: 'text',
      admin: {
        description: 'The big heading customers see on the vote page.',
      },
      defaultValue: FLAVOR_POLL_DEFAULT_TITLE,
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        description:
          'Keep it Hidden while you set it up. Switch to Live to put it on the site. Voting starts at the opening time below, or right away if that is empty.',
        position: 'sidebar',
      },
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Hidden (setting up)', value: 'draft' },
        { label: 'Live on the site', value: 'live' },
      ],
      required: true,
    },
    {
      name: 'opensAt',
      label: 'Voting opens',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description:
          'Leave empty to open as soon as it is Live. Pick a time to set it up early: the vote page counts down to it and opens on its own.',
        position: 'sidebar',
      },
      index: true,
      validate: (
        value: Date | string | null | undefined,
        { siblingData }: { siblingData: Partial<FlavorPoll> },
      ) => {
        if (!value || !siblingData?.closesAt) return true
        return new Date(value).getTime() < new Date(siblingData.closesAt).getTime()
          ? true
          : 'Voting has to open before it closes.'
      },
    },
    {
      name: 'closesAt',
      label: 'Voting closes',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description:
          'Filled in with the next Sunday at 8pm Central. Only change it if this week is different.',
        position: 'sidebar',
      },
      defaultValue: () => getNextScheduledPollClose().toISOString(),
      index: true,
      required: true,
    },
    {
      name: 'options',
      label: 'Flavors on the ballot',
      type: 'relationship',
      admin: {
        description:
          'Pick the flavors people can vote for. Any cookie works, including old flavors that are not on the menu right now.',
      },
      filterOptions: async ({ req }) => buildBallotProductWhere(req),
      hasMany: true,
      minRows: 2,
      relationTo: 'products',
      required: true,
    },
    {
      name: 'results',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/FlavorPollResultsField#FlavorPollResultsField',
        },
      },
    },
    {
      type: 'collapsible',
      label: 'More options',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'votesPerPerson',
          label: 'Votes per person',
          type: 'number',
          admin: {
            description:
              'How many cookie tokens each person gets. They can stack them on one flavor.',
          },
          defaultValue: FLAVOR_POLL_DEFAULT_VOTES_PER_PERSON,
          max: FLAVOR_POLL_MAX_VOTES_PER_PERSON,
          min: 1,
          required: true,
        },
        {
          name: 'showStandingsAfterVoting',
          label: 'Show standings after someone votes',
          type: 'checkbox',
          admin: {
            description:
              'People see the current totals only after they vote, so the first votes are not swayed. Untick to keep totals secret until voting closes.',
          },
          defaultValue: true,
        },
        {
          name: 'allowFlavorIdeas',
          label: 'Ask for new flavor ideas',
          type: 'checkbox',
          admin: {
            description:
              'Shows an optional “What flavor would you love to see?” box on the ballot.',
          },
          defaultValue: true,
        },
      ],
    },
  ],
}
