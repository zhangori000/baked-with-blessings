import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import type { CollectionSlug, Field, Plugin } from 'payload'
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
import {
  enforceOneActiveCartPerCustomer,
  preventPurchasedCartItemChanges,
} from '@/plugins/ecommerce/cartLifecycle'
import { idempotentStripeAdapter } from '@/plugins/ecommerce/idempotentStripeAdapter'
import { getRelationshipID } from '@/utilities/manualOrders'
import { sendCustomerOrderConfirmationAfterChange } from '@/utilities/email/sendCustomerOrderConfirmation'
import { sendOwnerOrderNotificationAfterChange } from '@/utilities/email/sendOwnerOrderNotification'

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

/**
 * The owner's workflow lane. Values extend the plugin's original enum
 * (processing/completed/cancelled/refunded) with two pickup-flow stops, so
 * every pre-existing order stays valid. 'processing' is kept as the entry
 * value every order-creation path already uses - it just reads as
 * "Requested" now.
 */
const ORDER_STATUS_OPTIONS = [
  { label: 'Requested (new order)', value: 'processing' },
  { label: 'Confirmed — will bake', value: 'confirmed' },
  { label: 'Ready for pickup', value: 'ready' },
  { label: 'Completed — handed over & paid', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
]

const enhanceOrderFields = (fields: Field[]): Field[] =>
  fields.map((field) => {
    if ('name' in field && field.name === 'status') {
      const statusField = field as Field & {
        access?: Record<string, unknown>
        admin?: Record<string, unknown>
      }

      return {
        ...statusField,
        access: {
          ...statusField.access,
          update: adminOnlyFieldAccess,
        },
        admin: {
          ...statusField.admin,
          description:
            'Where this order is in your workflow. New orders arrive as Requested. Move it to Confirmed when you commit to baking it, Ready for pickup once it is packed, and Completed when it is handed over and paid.',
        },
        options: ORDER_STATUS_OPTIONS,
      } as Field
    }

    return field
  })

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
                description:
                  'Guest cart IDs already merged into this cart. Used for retry-safe merges.',
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
          afterChange: [
            ...(defaultCollection.hooks?.afterChange ?? []),
            enforceOneActiveCartPerCustomer,
          ],
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
        admin: {
          ...defaultCollection.admin,
          defaultColumns: [
            'id',
            'customerName',
            'status',
            'amount',
            'manualPaymentMethod',
            'createdAt',
          ],
          description:
            'Customer orders. Open an order to move it through your workflow and review items and contact details. Pay-at-pickup orders are unpaid until you complete them.',
          listSearchableFields: [
            'id',
            'customerName',
            'customerEmail',
            'guestContactValue',
            'manualPaymentReference',
          ],
          useAsTitle: 'id',
        },
        fields: [
          ...extendCollectionItemsWithBatchSelections({
            fields: enhanceOrderFields(defaultCollection.fields),
          }),
          ...createGuestContactFields(),
          {
            name: 'customerName',
            type: 'text',
            admin: {
              description:
                'Copied from the customer account when the order is saved, so the orders list can show and search names at the market stand.',
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              beforeChange: [
                async ({ data, req, value }) => {
                  const customerID = getRelationshipID(data?.customer)

                  if (!customerID) {
                    // Guest order: fall back to whatever contact we have.
                    return value || data?.customerEmail || null
                  }

                  try {
                    const customer = await req.payload.findByID({
                      id: customerID,
                      collection: 'customers',
                      depth: 0,
                      overrideAccess: true,
                      select: {
                        email: true,
                        name: true,
                        phone: true,
                      },
                    })

                    // Name first, then email/phone so the orders list always
                    // shows something Kayla can recognize and search.
                    return customer?.name || customer?.email || customer?.phone || value || null
                  } catch {
                    return value ?? null
                  }
                },
              ],
            },
          },
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
            name: 'ownerNotificationSentAt',
            type: 'date',
            index: true,
            admin: {
              date: {
                pickerAppearance: 'dayAndTime',
              },
              description:
                'Set automatically after the new-order email is sent to the business owner.',
              position: 'sidebar',
              readOnly: true,
            },
          },
          {
            name: 'customerNotificationSentAt',
            type: 'date',
            admin: {
              date: {
                pickerAppearance: 'dayAndTime',
              },
              description:
                'Set automatically after the order confirmation email is sent to the customer. Stays empty for phone-only accounts with no email address.',
              position: 'sidebar',
              readOnly: true,
            },
          },
          {
            name: 'manualPaymentMethod',
            type: 'select',
            admin: {
              description:
                'Manual payment method reported by the customer. This does not mean payment has been verified.',
              position: 'sidebar',
              readOnly: true,
            },
            options: [
              {
                label: 'Venmo',
                value: 'venmo',
              },
              {
                label: 'Pay at pickup',
                value: 'in_person',
              },
            ],
          },
          {
            name: 'manualPaymentStatus',
            type: 'select',
            admin: {
              description:
                'Manual payment verification status. Update this after checking the external payment account.',
              position: 'sidebar',
            },
            options: [
              {
                label: 'Reported sent',
                value: 'reported_sent',
              },
              {
                label: 'Verified',
                value: 'verified',
              },
              {
                label: 'Rejected',
                value: 'rejected',
              },
            ],
          },
          {
            name: 'manualPaymentHandle',
            type: 'text',
            admin: {
              description: 'External account handle the customer was instructed to pay.',
              position: 'sidebar',
              readOnly: true,
            },
          },
          {
            name: 'manualPaymentReportedAt',
            type: 'date',
            admin: {
              date: {
                pickerAppearance: 'dayAndTime',
              },
              description: 'When the customer clicked that the manual payment was sent.',
              position: 'sidebar',
              readOnly: true,
            },
          },
          {
            name: 'manualPaymentReference',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              description: 'Internal idempotency reference for manual payment order creation.',
              position: 'sidebar',
              readOnly: true,
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
          afterChange: [
            ...(defaultCollection.hooks?.afterChange ?? []),
            sendOwnerOrderNotificationAfterChange,
            sendCustomerOrderConfirmationAfterChange,
          ],
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
