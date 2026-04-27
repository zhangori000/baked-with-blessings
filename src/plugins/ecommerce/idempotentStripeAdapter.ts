import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'
import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import type { CollectionSlug, DefaultDocumentIDType } from 'payload'
import Stripe from 'stripe'

import { isUniqueConstraintError } from '@/utilities/idempotency'

type StripeAdapterArgs = Parameters<typeof stripeAdapter>[0]

type TransactionLike = {
  id?: DefaultDocumentIDType
  order?: DefaultDocumentIDType | { accessToken?: null | string; id?: DefaultDocumentIDType } | null
  status?: null | string
}

type OrderLike = {
  accessToken?: null | string
  id?: DefaultDocumentIDType
}

const getRelationshipID = (
  value: DefaultDocumentIDType | { id?: DefaultDocumentIDType } | null | undefined,
) => {
  if (!value) {
    return undefined
  }

  return typeof value === 'object' ? value.id : value
}

const parseJSON = (value: null | string | undefined) => {
  if (!value) {
    return undefined
  }

  try {
    return JSON.parse(value) as unknown
  } catch {
    return undefined
  }
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

const toReplayResponse = (order: OrderLike) => ({
  ...(order.accessToken ? { accessToken: order.accessToken } : {}),
  message: 'Order already confirmed.',
  orderID: order.id as DefaultDocumentIDType,
  transactionID: undefined as unknown as DefaultDocumentIDType,
})

export const idempotentStripeAdapter = (args: StripeAdapterArgs): PaymentAdapter => {
  const adapter = stripeAdapter(args)

  return {
    ...adapter,
    confirmOrder: async (confirmArgs) => {
      const paymentIntentID =
        typeof confirmArgs.data.paymentIntentID === 'string' ? confirmArgs.data.paymentIntentID : ''
      const ordersSlug = (confirmArgs.ordersSlug || 'orders') as CollectionSlug
      const transactionsSlug = (confirmArgs.transactionsSlug || 'transactions') as CollectionSlug
      const cartsSlug = (confirmArgs.cartsSlug || 'carts') as CollectionSlug

      if (paymentIntentID) {
        const existingOrder = await findOrderByPaymentIntentID({
          ordersSlug,
          paymentIntentID,
          req: confirmArgs.req,
        })

        if (existingOrder?.id) {
          return toReplayResponse(existingOrder)
        }

        const existingTransactions = await confirmArgs.req.payload.find({
          collection: transactionsSlug,
          depth: 1,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          req: confirmArgs.req,
          where: {
            'stripe.paymentIntentID': {
              equals: paymentIntentID,
            },
          },
        })
        const existingTransaction = existingTransactions.docs[0] as TransactionLike | undefined
        const existingOrderID = getRelationshipID(existingTransaction?.order)

        if (existingTransaction?.status === 'succeeded' && existingOrderID) {
          const order =
            typeof existingTransaction.order === 'object' && existingTransaction.order
              ? existingTransaction.order
              : await confirmArgs.req.payload.findByID({
                  id: existingOrderID,
                  collection: ordersSlug,
                  depth: 0,
                  overrideAccess: true,
                  req: confirmArgs.req,
                })

          return toReplayResponse({
            ...(order && typeof order === 'object' && 'accessToken' in order
              ? { accessToken: order.accessToken }
              : {}),
            id: existingOrderID,
          })
        }

        const transaction = existingTransaction

        if (!transaction?.id) {
          throw new Error('No transaction found for the provided PaymentIntent ID')
        }

        if (!args.secretKey) {
          throw new Error('Stripe secret key is required')
        }

        const stripe = new Stripe(args.secretKey, {
          apiVersion: args.apiVersion,
          appInfo: args.appInfo || {
            name: 'Stripe Payload Plugin',
            url: 'https://payloadcms.com',
          },
        })
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentID)

        if (paymentIntent.status !== 'succeeded') {
          throw new Error('Payment not completed.')
        }

        const cartID = paymentIntent.metadata.cartID
        const cartItemsSnapshot = parseJSON(paymentIntent.metadata.cartItemsSnapshot)
        const shippingAddress = parseJSON(paymentIntent.metadata.shippingAddress)

        if (!cartID) {
          throw new Error('Cart ID not found in the PaymentIntent metadata')
        }

        if (!Array.isArray(cartItemsSnapshot)) {
          throw new Error('Cart items snapshot not found or invalid in the PaymentIntent metadata')
        }

        let order: OrderLike

        try {
          order = (await confirmArgs.req.payload.create({
            collection: ordersSlug,
            data: {
              amount: paymentIntent.amount,
              currency: paymentIntent.currency.toUpperCase() as 'USD',
              ...(confirmArgs.req.user
                ? {
                    customer: confirmArgs.req.user.id,
                  }
                : {
                    customerEmail: confirmArgs.data.customerEmail,
                  }),
              items: cartItemsSnapshot as never,
              shippingAddress: shippingAddress as never,
              status: 'processing',
              stripePaymentIntentID: paymentIntentID,
              transactions: [transaction.id],
            },
            overrideAccess: true,
            req: confirmArgs.req,
          })) as OrderLike
        } catch (error) {
          if (isUniqueConstraintError(error)) {
            const duplicateOrder = await findOrderByPaymentIntentID({
              ordersSlug,
              paymentIntentID,
              req: confirmArgs.req,
            })

            if (duplicateOrder?.id) {
              return toReplayResponse(duplicateOrder)
            }
          }

          throw error
        }

        const timestamp = new Date().toISOString()

        await confirmArgs.req.payload.update({
          id: cartID,
          collection: cartsSlug,
          data: {
            purchasedAt: timestamp,
          },
          overrideAccess: true,
          req: confirmArgs.req,
        })
        await confirmArgs.req.payload.update({
          id: transaction.id,
          collection: transactionsSlug,
          data: {
            order: order.id,
            status: 'succeeded',
          },
          overrideAccess: true,
          req: confirmArgs.req,
        })

        return {
          ...(order.accessToken ? { accessToken: order.accessToken } : {}),
          message: 'Payment confirmed successfully',
          orderID: order.id as DefaultDocumentIDType,
          transactionID: transaction.id,
        }
      }

      return adapter.confirmOrder(confirmArgs)
    },
  }
}
