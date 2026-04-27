import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const PhoneVerificationStarts: CollectionConfig = {
  slug: 'phone-verification-starts',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['flow', 'phone', 'expiresAt', 'createdAt'],
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
        {
          label: 'Password reset',
          value: 'password-reset',
        },
      ],
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      index: true,
      required: true,
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
