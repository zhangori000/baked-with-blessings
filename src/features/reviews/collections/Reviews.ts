import type { CollectionConfig } from 'payload'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { adminOnly } from '@/access/adminOnly'
import { REVIEW_TENANT_ID, reviewResponseStatuses, reviewStatuses } from '../types'
import { adminOrPublishedReview } from './access'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublishedReview,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['title', 'publicStatus', 'responseStatus', 'createdAt'],
    group: 'Review System',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'tenantId',
      type: 'text',
      defaultValue: REVIEW_TENANT_ID,
      index: true,
      required: true,
    },
    {
      name: 'customerName',
      type: 'text',
      defaultValue: 'Bakery guest',
      required: true,
    },
    {
      name: 'customerEmail',
      type: 'email',
      admin: {
        description: 'Private. Used only if the bakery needs to follow up.',
      },
    },
    {
      name: 'instagramHandle',
      type: 'text',
      admin: {
        description: 'Optional Instagram handle from the public review form.',
      },
      label: 'Instagram handle',
    },
    {
      name: 'instagramHandlePublic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show the Instagram handle on the public review.',
      },
      label: 'Show Instagram publicly',
    },
    {
      name: 'linkedinUrl',
      type: 'text',
      admin: {
        description: 'Optional LinkedIn URL from the public review form.',
      },
      label: 'LinkedIn URL',
    },
    {
      name: 'linkedinUrlPublic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show the LinkedIn URL on the public review.',
      },
      label: 'Show LinkedIn publicly',
    },
    {
      name: 'discordUsername',
      type: 'text',
      admin: {
        description: 'Optional Discord username from the public review form.',
      },
      label: 'Discord username',
    },
    {
      name: 'discordUsernamePublic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show the Discord username on the public review.',
      },
      label: 'Show Discord publicly',
    },
    {
      name: 'leagueUsername',
      type: 'text',
      admin: {
        description: 'Optional League username from the public review form.',
      },
      label: 'League username',
    },
    {
      name: 'leagueUsernamePublic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show the League username on the public review.',
      },
      label: 'Show League publicly',
    },
    {
      name: 'nintendoId',
      type: 'text',
      admin: {
        description: 'Optional Nintendo ID from the public review form.',
      },
      label: 'Nintendo ID',
    },
    {
      name: 'nintendoIdPublic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show the Nintendo ID on the public review.',
      },
      label: 'Show Nintendo ID publicly',
    },
    {
      name: 'ptcgId',
      type: 'text',
      admin: {
        description: 'Optional PTCG ID from the public review form.',
      },
      label: 'PTCG ID',
    },
    {
      name: 'ptcgIdPublic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show the PTCG ID on the public review.',
      },
      label: 'Show PTCG ID publicly',
    },
    {
      name: 'otherContact',
      type: 'textarea',
      admin: {
        description: 'Optional extra contact details from the public review form.',
      },
      label: 'Other contact',
    },
    {
      name: 'otherContactPublic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show other contact details on the public review.',
      },
      label: 'Show other contact publicly',
    },
    {
      name: 'reviewTone',
      type: 'select',
      defaultValue: 'loved_it',
      options: [
        { label: 'Loved it', value: 'loved_it' },
        { label: 'I have a suggestion', value: 'suggestion' },
      ],
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'visitContext',
      type: 'text',
      admin: {
        description: 'Optional public context, for example pickup order, catering, or cafe visit.',
      },
    },
    {
      name: 'photos',
      type: 'relationship',
      hasMany: true,
      relationTo: 'media',
    },
    {
      name: 'publicStatus',
      type: 'select',
      defaultValue: 'published',
      index: true,
      options: reviewStatuses.map((value) => ({ label: value, value })),
      required: true,
    },
    {
      name: 'moderationActions',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/reviews/ReviewModerationActions#ReviewModerationActions',
        },
        position: 'sidebar',
      },
      // No data is stored; this field is only for quick moderation from within Payload admin.
      label: 'Moderation',
    },
    {
      name: 'moderationNote',
      type: 'textarea',
      admin: {
        description: 'Private admin note for spam, abuse, unverifiable claims, or unfair framing.',
      },
    },
    {
      name: 'fairnessNote',
      type: 'textarea',
      admin: {
        description:
          'Public note when the bakery needs to add context, boundaries, or a factual correction.',
      },
    },
    {
      name: 'responseStatus',
      type: 'select',
      defaultValue: 'listening',
      index: true,
      options: reviewResponseStatuses.map((value) => ({ label: value, value })),
      required: true,
    },
    {
      name: 'businessResponse',
      type: 'textarea',
      admin: {
        description: 'Plain-text fallback for the public response.',
      },
    },
    {
      name: 'businessResponseRichText',
      type: 'richText',
      admin: {
        description: 'Public bakery reply. Use this when the reply needs formatting.',
      },
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: 'actionLog',
      type: 'array',
      admin: {
        description: 'Public changes or decisions made in response to the review.',
      },
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'detail',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
  timestamps: true,
}
