import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'
import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import type { CollectionSlug, DefaultDocumentIDType, Where } from 'payload'
import Stripe from 'stripe'

import { ALLOW_CUSTOMER_STRIPE_CUSTOMER_ID_WRITE } from '@/collections/Customers/hooks/customerPhoneIdentity'
import { isUniqueConstraintError } from '@/utilities/idempotency'

type StripeAdapterArgs = Parameters<typeof stripeAdapter>[0]

type CartItemLike = Record<string, unknown> & {
  product?: DefaultDocumentIDType | { id?: DefaultDocumentIDType }
  quantity?: number
  variant?: DefaultDocumentIDType | { id?: DefaultDocumentIDType }
}

type CartLike = {
  id?: DefaultDocumentIDType
  items?: CartItemLike[]
  purchasedAt?: null | string
  subtotal?: number
}

type CustomerForStripe = {
  email?: null | string
  id?: DefaultDocumentIDType
  name?: null | string
  phone?: null | string
  stripeCustomerID?: null | string
}

type TransactionLike = {
  cart?: DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null
  customer?: DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null
  customerEmail?: null | string
  id?: DefaultDocumentIDType
  items?: CartItemLike[] | null
  order?: DefaultDocumentIDType | { accessToken?: null | string; id?: DefaultDocumentIDType } | null
  status?: null | string
}

type OrderLike = {
  accessToken?: null | string
  id?: DefaultDocumentIDType
}

type FinalizeOrderFromPaymentIntentArgs = {
  cartsSlug: CollectionSlug
  customerEmail?: string
  ordersSlug: CollectionSlug
  paymentIntent?: Stripe.PaymentIntent
  paymentIntentID: string
  req: Parameters<PaymentAdapter['confirmOrder']>[0]['req']
  stripe: Stripe
  transactionsSlug: CollectionSlug
}

type FinalizeOrderFromPaymentIntentResult = {
  created: boolean
  order: OrderLike
  transactionID?: DefaultDocumentIDType
}

const getRelationshipID = (
  value: DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null | undefined,
) => {
  if (!value) {
    return undefined
  }

  return typeof value === 'object' ? value.id : value
}

const findOrderByPaymentIntentID = async ({
  ordersSlug,
  paymentIntentID,
  req,
}: {
  ordersSlug: CollectionSlug
  paymentIntentID: string
  req: Parameters<PaymentAdapter['confirmOrder']>[0]['req']
}) => {
  const existingOrders = await req.payload.find({
    collection: ordersSlug,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      stripePaymentIntentID: {
        equals: paymentIntentID,
      },
    },
  })

  return existingOrders.docs[0] as OrderLike | undefined
}

const findTransactionByPaymentIntentID = async ({
  paymentIntentID,
  req,
  transactionsSlug,
}: {
  paymentIntentID: string
  req: Parameters<PaymentAdapter['confirmOrder']>[0]['req']
  transactionsSlug: CollectionSlug
}) => {
  const existingTransactions = await req.payload.find({
    collection: transactionsSlug,
    depth: 1,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      'stripe.paymentIntentID': {
        equals: paymentIntentID,
      },
    },
  })

  return existingTransactions.docs[0] as TransactionLike | undefined
}

const getString = (value: unknown) => (typeof value === 'string' && value.trim() ? value : '')

const createStripeClient = (args: StripeAdapterArgs) => {
  if (!args.secretKey) {
    throw new Error('Stripe secret key is required.')
  }

  return new Stripe(args.secretKey, {
    apiVersion: args.apiVersion,
    appInfo: args.appInfo || {
      name: 'Stripe Payload Plugin',
      url: 'https://payloadcms.com',
    },
  })
}

const assertCartIsActive = async ({
  cart,
  cartsSlug,
  req,
}: {
  cart: CartLike
  cartsSlug: CollectionSlug
  req: Parameters<PaymentAdapter['initiatePayment']>[0]['req']
}) => {
  if (!cart.id) {
    return
  }

  if (cart.purchasedAt) {
    throw new Error('This cart has already been purchased. Start a new cart before paying.')
  }

  const latestCart = (await req.payload.findByID({
    id: cart.id,
    collection: cartsSlug,
    depth: 0,
    overrideAccess: true,
    req,
    select: {
      purchasedAt: true,
    },
  })) as CartLike | null

  if (latestCart?.purchasedAt) {
    throw new Error('This cart has already been purchased. Start a new cart before paying.')
  }
}

const getPaymentCustomer = async ({
  customersSlug,
  req,
}: {
  customersSlug: CollectionSlug
  req: Parameters<PaymentAdapter['initiatePayment']>[0]['req']
}) => {
  if (!req.user?.id) {
    return undefined
  }

  if (req.user.collection && req.user.collection !== customersSlug) {
    throw new Error('A customer account is required to make a purchase.')
  }

  const customer = await req.payload.findByID({
    id: req.user.id,
    collection: customersSlug,
    depth: 0,
    overrideAccess: true,
    req,
    select: {
      email: true,
      name: true,
      phone: true,
      stripeCustomerID: true,
    },
  })

  return customer as CustomerForStripe
}

const setStripeCustomerID = async ({
  customersSlug,
  payloadCustomerID,
  req,
  stripeCustomerID,
}: {
  customersSlug: CollectionSlug
  payloadCustomerID: DefaultDocumentIDType
  req: Parameters<PaymentAdapter['initiatePayment']>[0]['req']
  stripeCustomerID: string
}) => {
  req.context = {
    ...(req.context || {}),
    [ALLOW_CUSTOMER_STRIPE_CUSTOMER_ID_WRITE]: true,
  }

  await req.payload.update({
    id: payloadCustomerID,
    collection: customersSlug,
    data: {
      stripeCustomerID,
    },
    overrideAccess: true,
    req,
  })
}

const ensureStripeCustomer = async ({
  args,
  customersSlug,
  payloadCustomer,
  req,
}: {
  args: StripeAdapterArgs
  customersSlug: CollectionSlug
  payloadCustomer?: CustomerForStripe
  req: Parameters<PaymentAdapter['initiatePayment']>[0]['req']
}) => {
  const stripe = createStripeClient(args)
  const email = getString(payloadCustomer?.email)
  const phone = getString(payloadCustomer?.phone)
  const name = getString(payloadCustomer?.name)
  const existingStripeCustomerID = getString(payloadCustomer?.stripeCustomerID)
  const payloadCustomerID = payloadCustomer?.id

  if (!payloadCustomerID && !email) {
    throw new Error('A customer account or email is required to make a purchase.')
  }

  const customerParams: Stripe.CustomerCreateParams = {
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(name ? { name } : {}),
    metadata: {
      ...(payloadCustomerID ? { payloadCustomerID: String(payloadCustomerID) } : {}),
      ...(email ? { customerEmail: email } : {}),
      ...(phone ? { customerPhone: phone } : {}),
    },
  }

  if (existingStripeCustomerID) {
    try {
      const existingStripeCustomer = await stripe.customers.retrieve(existingStripeCustomerID)

      if (!('deleted' in existingStripeCustomer && existingStripeCustomer.deleted)) {
        const updateParams: Stripe.CustomerUpdateParams = {
          ...(email && existingStripeCustomer.email !== email ? { email } : {}),
          ...(phone && existingStripeCustomer.phone !== phone ? { phone } : {}),
          ...(name && existingStripeCustomer.name !== name ? { name } : {}),
          metadata: {
            ...existingStripeCustomer.metadata,
            ...(payloadCustomerID ? { payloadCustomerID: String(payloadCustomerID) } : {}),
            ...(email ? { customerEmail: email } : {}),
            ...(phone ? { customerPhone: phone } : {}),
          },
        }

        if (
          updateParams.email ||
          updateParams.phone ||
          updateParams.name ||
          Object.keys(updateParams.metadata || {}).length
        ) {
          await stripe.customers.update(existingStripeCustomerID, updateParams)
        }

        return {
          stripe,
          stripeCustomerID: existingStripeCustomerID,
        }
      }
    } catch (error) {
      req.payload.logger.warn({
        err: error,
        msg: 'Stored Stripe customer could not be retrieved. Creating a replacement customer.',
        stripeCustomerID: existingStripeCustomerID,
      })
    }
  }

  const stripeCustomer = await stripe.customers.create(customerParams)

  if (payloadCustomerID) {
    await setStripeCustomerID({
      customersSlug,
      payloadCustomerID,
      req,
      stripeCustomerID: stripeCustomer.id,
    })
  }

  return {
    stripe,
    stripeCustomerID: stripeCustomer.id,
  }
}

const stripArrayRowIDs = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return value
  }

  return value.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return stripArrayRowIDs(entry)
    }

    const { id: _id, ...rest } = entry as Record<string, unknown>

    return Object.fromEntries(
      Object.entries(rest).map(([key, nestedValue]) => [key, stripArrayRowIDs(nestedValue)]),
    )
  })
}

const flattenCartItems = (cart: CartLike) =>
  (cart.items || []).map((item) => {
    const productID =
      item.product && typeof item.product === 'object' ? item.product.id : item.product
    const variantID =
      item.variant && typeof item.variant === 'object' ? item.variant.id : item.variant
    const { id: _id, product: _product, variant: _variant, ...customProperties } = item

    return {
      ...Object.fromEntries(
        Object.entries(customProperties).map(([key, value]) => [key, stripArrayRowIDs(value)]),
      ),
      product: productID,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
      ...(variantID ? { variant: variantID } : {}),
    }
  })

const getStripePaymentIntentID = (transaction: Record<string, unknown>) => {
  const stripeData = transaction.stripe

  if (!stripeData || typeof stripeData !== 'object') {
    return ''
  }

  const paymentIntentID = (stripeData as { paymentIntentID?: unknown }).paymentIntentID

  return typeof paymentIntentID === 'string' ? paymentIntentID : ''
}

const isReusablePaymentIntentStatus = (status: Stripe.PaymentIntent.Status) =>
  status === 'requires_payment_method' ||
  status === 'requires_confirmation' ||
  status === 'requires_action'

const isStripePaymentIntent = (value: unknown): value is Stripe.PaymentIntent =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'id' in value &&
      typeof (value as { id?: unknown }).id === 'string' &&
      'object' in value &&
      (value as { object?: unknown }).object === 'payment_intent',
  )

export const finalizeOrderFromPaymentIntent = async ({
  cartsSlug,
  customerEmail,
  ordersSlug,
  paymentIntent: providedPaymentIntent,
  paymentIntentID,
  req,
  stripe,
  transactionsSlug,
}: FinalizeOrderFromPaymentIntentArgs): Promise<FinalizeOrderFromPaymentIntentResult> => {
  const existingOrder = await findOrderByPaymentIntentID({
    ordersSlug,
    paymentIntentID,
    req,
  })

  if (existingOrder?.id) {
    return {
      created: false,
      order: existingOrder,
    }
  }

  const transaction = await findTransactionByPaymentIntentID({
    paymentIntentID,
    req,
    transactionsSlug,
  })
  const existingOrderID = getRelationshipID(transaction?.order)

  if (transaction?.status === 'succeeded' && existingOrderID) {
    const order =
      typeof transaction.order === 'object' && transaction.order
        ? transaction.order
        : ((await req.payload.findByID({
            id: existingOrderID,
            collection: ordersSlug,
            depth: 0,
            overrideAccess: true,
            req,
          })) as OrderLike)

    return {
      created: false,
      order: {
        ...(order && typeof order === 'object' && 'accessToken' in order
          ? { accessToken: order.accessToken }
          : {}),
        id: existingOrderID,
      },
    }
  }

  if (!transaction?.id) {
    throw new Error('No transaction found for the provided PaymentIntent ID')
  }

  const paymentIntent =
    providedPaymentIntent || (await stripe.paymentIntents.retrieve(paymentIntentID))

  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment not completed.')
  }

  const cartID = paymentIntent.metadata.cartID || getRelationshipID(transaction.cart)
  const cartItemsSnapshot = transaction.items

  if (!cartID) {
    throw new Error('Cart ID not found in the PaymentIntent metadata')
  }

  if (!Array.isArray(cartItemsSnapshot)) {
    throw new Error('Cart items snapshot not found or invalid in the transaction snapshot')
  }

  let order: OrderLike

  try {
    const transactionCustomerID = getRelationshipID(transaction.customer)
    const requestCustomerID = req.user?.id
    const orderCustomerID = transactionCustomerID || requestCustomerID
    const orderCustomerEmail =
      transaction.customerEmail || customerEmail || paymentIntent.metadata.customerEmail

    order = (await req.payload.create({
      collection: ordersSlug,
      data: {
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase() as 'USD',
        ...(orderCustomerID
          ? {
              customer: orderCustomerID,
            }
          : {
              customerEmail: orderCustomerEmail,
            }),
        items: cartItemsSnapshot as never,
        status: 'processing',
        stripePaymentIntentID: paymentIntentID,
        transactions: [transaction.id],
      },
      overrideAccess: true,
      req,
    })) as OrderLike
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const duplicateOrder = await findOrderByPaymentIntentID({
        ordersSlug,
        paymentIntentID,
        req,
      })

      if (duplicateOrder?.id) {
        return {
          created: false,
          order: duplicateOrder,
        }
      }
    }

    throw error
  }

  const timestamp = new Date().toISOString()

  await req.payload.update({
    id: cartID,
    collection: cartsSlug,
    data: {
      purchasedAt: timestamp,
    },
    overrideAccess: true,
    req,
  })
  await req.payload.update({
    id: transaction.id,
    collection: transactionsSlug,
    data: {
      order: order.id,
      status: 'succeeded',
    },
    overrideAccess: true,
    req,
  })

  return {
    created: true,
    order,
    transactionID: transaction.id,
  }
}

export const idempotentStripeAdapter = (args: StripeAdapterArgs): PaymentAdapter => {
  const existingPaymentIntentSucceededWebhook = args.webhooks?.['payment_intent.succeeded']
  const adapter = stripeAdapter({
    ...args,
    webhooks: {
      ...args.webhooks,
      'payment_intent.succeeded': async ({ event, req, stripe }) => {
        const paymentIntent = event.data.object

        if (!isStripePaymentIntent(paymentIntent)) {
          req.payload.logger.warn({
            eventID: event.id,
            eventType: event.type,
            msg: 'Stripe webhook did not include a PaymentIntent payload.',
          })
          return
        }

        await finalizeOrderFromPaymentIntent({
          cartsSlug: 'carts' as CollectionSlug,
          ordersSlug: 'orders' as CollectionSlug,
          paymentIntent,
          paymentIntentID: paymentIntent.id,
          req,
          stripe,
          transactionsSlug: 'transactions' as CollectionSlug,
        })

        await existingPaymentIntentSucceededWebhook?.({ event, req, stripe })
      },
    },
  })

  return {
    ...adapter,
    initiatePayment: async (initiateArgs) => {
      const payload = initiateArgs.req.payload
      const customersSlug = 'customers' as CollectionSlug
      const transactionsSlug = (initiateArgs.transactionsSlug || 'transactions') as CollectionSlug
      const cart = initiateArgs.data.cart as CartLike | undefined
      const currency =
        typeof initiateArgs.data.currency === 'string'
          ? initiateArgs.data.currency.toLowerCase()
          : ''
      const amount = cart?.subtotal
      const payloadCustomer = await getPaymentCustomer({
        customersSlug,
        req: initiateArgs.req,
      })
      const guestEmail = getString(initiateArgs.data.customerEmail)
      const paymentCustomer = payloadCustomer || (guestEmail ? { email: guestEmail } : undefined)

      if (!currency) {
        throw new Error('Currency is required.')
      }

      if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error('Cart is empty or not provided.')
      }

      await assertCartIsActive({
        cart,
        cartsSlug: 'carts' as CollectionSlug,
        req: initiateArgs.req,
      })

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new Error('A valid amount is required to initiate a payment.')
      }

      if (!paymentCustomer) {
        throw new Error('A customer account or email is required to make a purchase.')
      }

      try {
        const { stripe, stripeCustomerID } = await ensureStripeCustomer({
          args,
          customersSlug,
          payloadCustomer: paymentCustomer,
          req: initiateArgs.req,
        })
        const flattenedCart = flattenCartItems(cart)
        const customerEmail = getString(paymentCustomer.email)
        const customerPhone = getString(paymentCustomer.phone)
        const customerWhere: Where =
          paymentCustomer.id && String(paymentCustomer.id)
            ? {
                customer: {
                  equals: paymentCustomer.id,
                },
              }
            : {
                customerEmail: {
                  equals: customerEmail,
                },
              }
        const existingPendingTransactions = await payload.find({
          collection: transactionsSlug,
          depth: 0,
          limit: 5,
          overrideAccess: true,
          pagination: false,
          req: initiateArgs.req,
          sort: '-createdAt',
          where: {
            and: [
              {
                cart: {
                  equals: cart.id,
                },
              },
              {
                paymentMethod: {
                  equals: 'stripe',
                },
              },
              {
                status: {
                  equals: 'pending',
                },
              },
              customerWhere,
            ],
          },
        })

        for (const existingTransaction of existingPendingTransactions.docs) {
          const paymentIntentID = getStripePaymentIntentID(
            existingTransaction as unknown as Record<string, unknown>,
          )

          if (!paymentIntentID) {
            continue
          }

          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentID)

          if (
            !isReusablePaymentIntentStatus(paymentIntent.status) ||
            paymentIntent.currency !== currency ||
            paymentIntent.customer !== stripeCustomerID
          ) {
            continue
          }

          const reusablePaymentIntent =
            paymentIntent.amount === amount
              ? paymentIntent
              : await stripe.paymentIntents.update(paymentIntent.id, {
                  amount,
                  metadata: {
                    cartID: String(cart.id),
                    ...(paymentCustomer.id
                      ? { payloadCustomerID: String(paymentCustomer.id) }
                      : {}),
                    ...(customerEmail ? { customerEmail } : {}),
                    ...(customerPhone ? { customerPhone } : {}),
                  },
                })

          await payload.update({
            id: existingTransaction.id,
            collection: transactionsSlug,
            data: {
              ...(paymentCustomer.id
                ? {
                    customer: paymentCustomer.id,
                  }
                : {
                    customerEmail,
                  }),
              amount: reusablePaymentIntent.amount,
              billingAddress: initiateArgs.data.billingAddress,
              cart: cart.id,
              currency: reusablePaymentIntent.currency.toUpperCase() as 'USD',
              items: flattenedCart as never,
              paymentMethod: 'stripe',
              status: 'pending',
              stripe: {
                customerID: stripeCustomerID,
                paymentIntentID: reusablePaymentIntent.id,
              },
            },
            overrideAccess: true,
            req: initiateArgs.req,
          })

          return {
            clientSecret: reusablePaymentIntent.client_secret || '',
            message: 'Payment resumed successfully',
            paymentIntentID: reusablePaymentIntent.id,
            transactionID: existingTransaction.id,
          }
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          automatic_payment_methods: {
            enabled: true,
          },
          currency,
          customer: stripeCustomerID,
          metadata: {
            cartID: String(cart.id),
            ...(paymentCustomer.id ? { payloadCustomerID: String(paymentCustomer.id) } : {}),
            ...(customerEmail ? { customerEmail } : {}),
            ...(customerPhone ? { customerPhone } : {}),
          },
        })

        const transaction = await payload.create({
          collection: transactionsSlug,
          data: {
            ...(paymentCustomer.id
              ? {
                  customer: paymentCustomer.id,
                }
              : {
                  customerEmail,
                }),
            amount: paymentIntent.amount,
            billingAddress: initiateArgs.data.billingAddress,
            cart: cart.id,
            currency: paymentIntent.currency.toUpperCase() as 'USD',
            items: flattenedCart as never,
            paymentMethod: 'stripe',
            status: 'pending',
            stripe: {
              customerID: stripeCustomerID,
              paymentIntentID: paymentIntent.id,
            },
          },
          req: initiateArgs.req,
        })

        return {
          clientSecret: paymentIntent.client_secret || '',
          message: 'Payment initiated successfully',
          paymentIntentID: paymentIntent.id,
          transactionID: transaction.id,
        }
      } catch (error) {
        payload.logger.error({
          err: error,
          msg: 'Error initiating payment with Stripe',
        })
        throw new Error(error instanceof Error ? error.message : 'Unknown error initiating payment')
      }
    },
    confirmOrder: async (confirmArgs) => {
      const paymentIntentID =
        typeof confirmArgs.data.paymentIntentID === 'string' ? confirmArgs.data.paymentIntentID : ''
      const ordersSlug = (confirmArgs.ordersSlug || 'orders') as CollectionSlug
      const transactionsSlug = (confirmArgs.transactionsSlug || 'transactions') as CollectionSlug
      const cartsSlug = (confirmArgs.cartsSlug || 'carts') as CollectionSlug

      if (paymentIntentID) {
        const stripe = createStripeClient(args)
        const { created, order, transactionID } = await finalizeOrderFromPaymentIntent({
          cartsSlug,
          customerEmail: confirmArgs.data.customerEmail,
          ordersSlug,
          paymentIntentID,
          req: confirmArgs.req,
          stripe,
          transactionsSlug,
        })

        const response = {
          ...(order.accessToken ? { accessToken: order.accessToken } : {}),
          message: created ? 'Payment confirmed successfully' : 'Order already confirmed.',
          orderID: order.id as DefaultDocumentIDType,
          ...(created && transactionID ? { transactionID } : {}),
        }

        return response as Awaited<ReturnType<PaymentAdapter['confirmOrder']>>
      }

      return adapter.confirmOrder(confirmArgs)
    },
  }
}
