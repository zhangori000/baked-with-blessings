import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { isAdminUser, isCustomerUser } from '@/access/utilities'

export const COMMUNITY_NOTE_BODY_MAX_LENGTH = 500
export const COMMUNITY_NOTE_PSEUDONYM_MAX_LENGTH = 60

export const CommunityNotes: CollectionConfig = {
  slug: 'community-notes',
  labels: {
    plural: 'Post-it Notes',
    singular: 'Post-it Note',
  },
  access: {
    create: ({ req: { user } }) => isCustomerUser(user) || isAdminUser(user),
    delete: adminOnly,
    read: () => true,
    update: ({ req: { user } }) => isAdminUser(user) || isCustomerUser(user),
  },
  admin: {
    defaultColumns: ['body', 'isHidden', 'likeCount', 'dislikeCount', 'createdAt'],
    description:
      'Customer-written post-it notes shown on the Community Post-it Wall. Toggle "isHidden" to take a note off the public wall without deleting it.',
    group: 'Community',
    useAsTitle: 'body',
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      admin: {
        description: 'The order this note was written for. One note per order.',
        position: 'sidebar',
      },
      index: true,
      relationTo: 'orders',
      required: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      admin: {
        description: 'The logged-in customer who posted this note.',
        position: 'sidebar',
      },
      index: true,
      relationTo: 'customers',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      admin: {
        description: `The handwritten message body, ${COMMUNITY_NOTE_BODY_MAX_LENGTH} characters max.`,
      },
      maxLength: COMMUNITY_NOTE_BODY_MAX_LENGTH,
      required: true,
    },
    {
      name: 'isAnonymous',
      type: 'checkbox',
      admin: {
        description: 'When on, the customer is shown as their pseudonym (or "Anonymous").',
      },
      defaultValue: false,
    },
    {
      name: 'pseudonym',
      type: 'text',
      admin: {
        condition: (_data, siblingData) => Boolean(siblingData?.isAnonymous),
        description: 'Pseudonym shown when posting anonymously. Blank → "Anonymous".',
      },
      maxLength: COMMUNITY_NOTE_PSEUDONYM_MAX_LENGTH,
    },
    {
      name: 'orderItemSnapshot',
      type: 'array',
      admin: {
        description:
          'Snapshot of the order items at the moment the note was posted. Frozen so wall content stays stable even if the order changes later.',
      },
      fields: [
        { name: 'productTitle', type: 'text', required: true },
        { name: 'quantity', type: 'number', defaultValue: 1, min: 1, required: true },
      ],
      minRows: 1,
    },
    {
      name: 'isHidden',
      type: 'checkbox',
      admin: {
        description: 'Hide from the public Post-it Wall (admin moderation). Does not delete.',
        position: 'sidebar',
      },
      defaultValue: false,
      index: true,
    },
    {
      name: 'likeCount',
      type: 'number',
      admin: { position: 'sidebar', readOnly: true },
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'dislikeCount',
      type: 'number',
      admin: { position: 'sidebar', readOnly: true },
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'votes',
      type: 'array',
      admin: {
        description: 'Per-customer like/dislike. Maintained by the vote endpoint.',
        readOnly: true,
      },
      fields: [
        {
          name: 'customer',
          type: 'relationship',
          relationTo: 'customers',
          required: true,
        },
        {
          name: 'value',
          type: 'select',
          options: [
            { label: 'Like', value: 'like' },
            { label: 'Dislike', value: 'dislike' },
          ],
          required: true,
        },
      ],
    },
  ],
  timestamps: true,
}
