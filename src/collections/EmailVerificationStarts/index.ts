import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const EmailVerificationStarts: CollectionConfig = {
  slug: 'email-verification-starts',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['flow', 'email', 'expiresAt', 'createdAt'],
    group: 'Security',
    useAsTitle: 'key',
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'flow',
      type: 'select',
      index: true,
      options: [
        {
          label: 'Signup',
          value: 'signup',
        },
      ],
      required: true,
    },
    {
      name: 'email',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'codeHash',
      type: 'text',
      required: true,
    },
    {
      name: 'attempts',
      type: 'number',
      defaultValue: 0,
      index: true,
      required: true,
    },
    {
      name: 'consumedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      index: true,
      required: true,
    },
  ],
  timestamps: true,
}
