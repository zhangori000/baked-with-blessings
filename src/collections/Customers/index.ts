import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOrSelf } from '@/access/adminOrSelf'
import { isAdminUser } from '@/access/utilities'
import {
  restrictCustomerIdentityChanges,
  syncCustomerPhoneIdentity,
} from '@/collections/Customers/hooks/customerPhoneIdentity'

export const Customers: CollectionConfig = {
  slug: 'customers',
  access: {
    admin: ({ req: { user } }) => isAdminUser(user),
    create: adminOnly,
    delete: adminOnly,
    read: adminOrSelf,
    unlock: adminOnly,
    update: adminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email', 'phone', 'phoneVerifiedAt'],
    group: 'Users',
    useAsTitle: 'name',
  },
  auth: {
    lockTime: 15 * 60 * 1000,
    loginWithUsername: {
      allowEmailLogin: true,
      requireEmail: false,
      requireUsername: false,
    },
    maxLoginAttempts: 12,
    tokenExpiration: 2592000,
  },
  hooks: {
    beforeChange: [restrictCustomerIdentityChanges],
    beforeValidate: [syncCustomerPhoneIdentity],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Stored in normalized international format for phone login and verification.',
      },
    },
    {
      name: 'phoneVerifiedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'stripeCustomerID',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Stripe Customer ID used to link this Payload customer to Stripe payments.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'cart',
      type: 'join',
      collection: 'carts',
      defaultLimit: 1,
      defaultSort: '-createdAt',
      on: 'customer',
      where: {
        purchasedAt: {
          exists: false,
        },
      },
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'addresses',
      type: 'join',
      collection: 'addresses',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id'],
      },
    },
  ],
}
