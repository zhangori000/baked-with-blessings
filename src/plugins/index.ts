import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { CollectionSlug, Plugin } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import type { ProductsValidation } from '@payloadcms/plugin-ecommerce/types'

import type { Page, Post, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { ProductsCollection } from '@/collections/Products'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import {
  createTrayAwareMergeCartEndpoint,
  createTrayBuilderValidationHook,
  extendCollectionItemsWithBatchSelections,
  trayAwareCartItemMatcher,
} from '@/plugins/ecommerce/trayBuilder'
import { preventPurchasedCartItemChanges } from '@/plugins/ecommerce/cartLifecycle'
import { idempotentStripeAdapter } from '@/plugins/ecommerce/idempotentStripeAdapter'

const getPhoneFromAddress = (address: unknown): null | string => {
  if (!address || typeof address !== 'object' || !('phone' in address)) {
    return null
  }

  const phone = address.phone

  if (typeof phone !== 'string') {
    return null
  }

  const trimmedPhone = phone.trim()

  return trimmedPhone || null
}

const deriveGuestContact = (siblingData: Record<string, unknown>) => {
  if (siblingData.customer) {
    return {
      method: null as null | 'email' | 'phone',
      value: null as null | string,
    }
  }

  const email =
    typeof siblingData.customerEmail === 'string' ? siblingData.customerEmail.trim() : ''
  const billingPhone = getPhoneFromAddress(siblingData.billingAddress)
  const shippingPhone = getPhoneFromAddress(siblingData.shippingAddress)

  if (email) {
    return {
      method: 'email' as const,
      value: email,
    }
  }

  if (billingPhone || shippingPhone) {
    return {
      method: 'phone' as const,
      value: billingPhone || shippingPhone,
    }
  }

  return {
    method: null as null | 'email' | 'phone',
    value: null as null | string,
  }
}

const createGuestContactFields = () => [
  {
    name: 'guestContactMethod',
    type: 'select' as const,
    admin: {
      description:
        'Derived guest checkout contact method. The official ecommerce plugin still requires email for guest purchases.',
      position: 'sidebar' as const,
      readOnly: true,
    },
    hooks: {
      beforeValidate: [
        ({ siblingData }: { siblingData: Record<string, unknown> }) =>
          deriveGuestContact(siblingData).method,
      ],
    },
    options: [
      {
        label: 'Email',
        value: 'email',
      },
      {
        label: 'Phone',
        value: 'phone',
      },
    ],
  },
  {
    name: 'guestContactValue',
    type: 'text' as const,
    admin: {
      description:
        'Derived guest checkout contact value. This is app-level groundwork for a future email-or-phone guest flow.',
      position: 'sidebar' as const,
      readOnly: true,
    },
    hooks: {
      beforeValidate: [
        ({ siblingData }: { siblingData: Record<string, unknown> }) =>
          deriveGuestContact(siblingData).value,
      ],
    },
  },
]

const generateTitle: GenerateTitle<Product | Page | Post> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Baked with Blessings` : 'Baked with Blessings'
}

const generateURL: GenerateURL<Product | Page | Post> = ({ collectionConfig, doc }) => {
  const url = getServerSideURL()

  if (!doc?.slug) return url

  if (collectionConfig?.slug === 'posts') {
    return `${url}/blog/${doc.slug}`
  }

  if (collectionConfig?.slug === 'products') {
    return `${url}/menu`
  }

  return doc.slug === 'home' ? url : `${url}/${doc.slug}`
}

const validateMadeToOrderPricing: ProductsValidation = ({ currency, product, variant }) => {
  if (!currency) {
    throw new Error('Currency must be provided for product validation.')
  }

  const priceField = `priceIn${currency.toUpperCase()}`
  const pricedItem = variant || product
  const price = (pricedItem as unknown as Record<string, unknown> | undefined)?.[priceField]

  if (typeof price !== 'number' || price <= 0) {
    throw new Error('Product or variant is missing a valid price.')
  }
}

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
      },
      admin: {
        group: 'Content',
      },
    },
    formOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
        create: isAdmin,
      },
      admin: {
        group: 'Content',
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  ecommercePlugin({
    access: {
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isAdmin,
      isDocumentOwner,
    },
    carts: {
      allowGuestCarts: true,
      cartItemMatcher: trayAwareCartItemMatcher,
      cartsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        endpoints: Array.isArray(defaultCollection.endpoints)
          ? defaultCollection.endpoints.map((endpoint) =>
              endpoint.path === '/:id/merge'
                ? createTrayAwareMergeCartEndpoint({
                    cartsSlug: defaultCollection.slug as CollectionSlug,
                  })
                : endpoint,
            )
          : [],
        fields: extendCollectionItemsWithBatchSelections({
          fields: [
            ...defaultCollection.fields,
            {
              name: 'mergedSourceCartIDs',
              type: 'array',
              admin: {
                description: 'Guest cart IDs already merged into this cart. Used for retry-safe merges.',
                initCollapsed: true,
                readOnly: true,
              },
              fields: [
                {
                  name: 'sourceCartID',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        }),
        hooks: {
          ...defaultCollection.hooks,
          beforeChange: [
            ...(defaultCollection.hooks?.beforeChange ?? []),
            preventPurchasedCartItemChanges,
          ],
          beforeValidate: [
            ...(defaultCollection.hooks?.beforeValidate ?? []),
            createTrayBuilderValidationHook(),
          ],
        },
      }),
    },
    customers: {
      slug: 'customers',
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [
          ...extendCollectionItemsWithBatchSelections({
            fields: defaultCollection.fields,
          }),
          ...createGuestContactFields(),
          {
            name: 'accessToken',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              beforeValidate: [
                ({ value, operation }) => {
                  if (operation === 'create' || !value) {
                    return crypto.randomUUID()
                  }
                  return value
                },
              ],
            },
          },
          {
            name: 'stripePaymentIntentID',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              description: 'Stripe PaymentIntent used as the checkout idempotency key.',
              position: 'sidebar',
              readOnly: true,
            },
          },
        ],
        hooks: {
          ...defaultCollection.hooks,
          beforeValidate: [
            ...(defaultCollection.hooks?.beforeValidate ?? []),
            createTrayBuilderValidationHook(),
          ],
        },
      }),
    },
    payments: {
      paymentMethods: [
        idempotentStripeAdapter({
          secretKey: process.env.STRIPE_SECRET_KEY!,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
          webhookSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET!,
        }),
      ],
    },
    products: {
      productsCollectionOverride: ProductsCollection,
      validation: validateMadeToOrderPricing,
    },
    transactions: {
      transactionsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [
          ...extendCollectionItemsWithBatchSelections({
            fields: defaultCollection.fields,
          }),
          ...createGuestContactFields(),
        ],
        hooks: {
          ...defaultCollection.hooks,
          beforeValidate: [
            ...(defaultCollection.hooks?.beforeValidate ?? []),
            createTrayBuilderValidationHook(),
          ],
        },
      }),
    },
  }),
]
