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
    defaultColumns: ['title', 'rating', 'publicStatus', 'responseStatus', 'createdAt'],
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
      name: 'rating',
      type: 'number',
      admin: {
        description: '1 to 5 rating. Half-step values like 4.5 are allowed.',
      },
      max: 5,
      min: 1,
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
      defaultValue: 'under_review',
      index: true,
      options: reviewStatuses.map((value) => ({ label: value, value })),
      required: true,
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
