# Stripe, Payload Ecommerce, Carts, Webhooks, and Order Flow

This document records the payment concepts and design decisions for the Baked with Blessings storefront.

The goal is not to build a generic ecommerce textbook. The goal is to explain how our current Payload CMS ecommerce plugin, Stripe Payment Element, cart modal, orders, transactions, webhooks, and owner notifications fit together.

## The core objects

### Cart

A cart is temporary shopping state.

A customer or guest uses a cart while deciding what to buy.

Example:

```txt
cart 8
items:
- Cookie Tray x3
- Banana Choc-Chip Walnut x1
- Banana Crumble x1
subtotal: 10500 cents
customer: 12
purchasedAt: null
```

Important idea:

```txt
Cart is not the legal purchase record.
Cart is not the payment record.
Cart is the working basket.
```

### Transaction

A transaction represents a payment attempt.

In our Stripe flow, a transaction links Payload to a Stripe PaymentIntent.

Example:

```txt
transaction 15
cart: 8
customer: 12
status: pending
amount: 10500
stripe.paymentIntentID: pi_...
items: snapshot copied from cart
```

The transaction matters because it freezes the cart items at payment initiation time. That protects us if the cart later changes.

### Order

An order is the permanent business record.

Example:

```txt
order 3
customer: 12
status: processing
amount: 10500
items:
- Cookie Tray x3
- Banana Choc-Chip Walnut x1
- Banana Crumble x1
transactions: [15]
stripePaymentIntentID: pi_...
```

Important idea:

```txt
Orders are authoritative for the bakery.
Transactions are authoritative for payment attempts.
Stripe is authoritative for whether money moved.
Carts are temporary customer state.
```

## Current successful payment path

When the customer clicks Pay now and the card succeeds inline, the flow is:

```txt
Browser
-> Stripe Payment Element validates card data
-> stripe.confirmPayment(...)
-> Stripe confirms PaymentIntent
-> Browser calls /api/payments/stripe/confirm-order
-> Payload creates order
-> Payload marks transaction succeeded
-> Payload marks cart purchasedAt
-> Frontend clears or resets cart state
-> Customer views /orders/:id?accessToken=...
```

From local logs, a successful order looked like:

```txt
POST /api/payments/stripe/initiate 200
POST /api/payments/stripe/confirm-order 200
POST /api/carts/8/clear 200
GET /orders/3?accessToken=... 200
```

Order 3 existed in local Postgres:

```txt
orders.id: 3
status: processing
amount: 10500
currency: USD
customer_id: 12
```

Customer 12 existed in local Postgres:

```txt
customers.id: 12
email: test@test.com
name: Test
phone: blank
```

## What `/api/payments/stripe/initiate` does

This is our own Payload/Next.js API route, not Stripe's server.

The browser calls:

```txt
POST /api/payments/stripe/initiate
```

Then our server calls Stripe.

Conceptual flow:

```txt
Browser
-> Payload ecommerce initiate endpoint
-> idempotentStripeAdapter.initiatePayment
-> Stripe PaymentIntent create, retrieve, or update
-> Payload transaction create or update
-> return clientSecret to browser
```

The returned `clientSecret` is what allows Stripe's Payment Element to render a secure payment form for that specific PaymentIntent.

Example response shape:

```json
{
  "clientSecret": "pi_..._secret_...",
  "paymentIntentID": "pi_...",
  "transactionID": 15,
  "message": "Payment initiated successfully"
}
```

## What `/api/payments/stripe/confirm-order` does

This is also our own Payload/Next.js API route.

The browser calls it after Stripe says the payment succeeded.

Conceptual flow:

```txt
Browser
-> stripe.confirmPayment succeeds
-> Payload ecommerce confirm-order endpoint
-> idempotentStripeAdapter.confirmOrder
-> server retrieves/checks Stripe PaymentIntent
-> server finds Payload transaction
-> server creates Payload order
-> server links transaction to order
-> server marks transaction succeeded
-> server marks cart purchasedAt
```

This is why raw card data never touches our server. Stripe handles card data inside its iframe.

## Payment Element

The Stripe Payment Element is Stripe's embedded secure payment UI.

It can show multiple payment methods in one component, such as:

```txt
Card
Bank
Cash App Pay
Klarna
Apple Pay or wallet methods when eligible
```

The actual card fields live inside Stripe-owned iframes. We can style the Payment Element using Stripe's Appearance API, and we can show our own loader around it, but we cannot directly edit the internals of the secure card iframe.

Example frontend shape:

```tsx
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

<Elements stripe={stripePromise} options={{ clientSecret }}>
  <CheckoutForm />
</Elements>
```

`stripePromise` is the browser-side Stripe.js instance. It uses the publishable key, not the secret key.

## Stripe keys

Stripe has two important key types.

```txt
Publishable key
- Used in browser
- Starts with pk_test_ or pk_live_
- Safe to expose publicly
- Used by loadStripe(...)
```

```txt
Secret key
- Used only on server
- Starts with sk_test_ or sk_live_
- Must never be exposed to browser
- Used to create/retrieve/update PaymentIntents
```

The webhook signing secret is separate:

```txt
STRIPE_WEBHOOKS_SIGNING_SECRET
```

It verifies that webhook calls really came from Stripe.

## Test cards

Stripe test mode accepts test card values.

Normal successful test payment:

```txt
Card number: 4242 4242 4242 4242
Expiration: any future date, for example 12 / 34
CVC: any 3 digits, for example 123
ZIP: any valid-looking ZIP, for example 12345
```

Useful failure and redirect cards:

```txt
Generic decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
3D Secure/authentication: 4000 0025 0000 3155
```

## Redirects and `redirect: 'if_required'`

Some payments complete inline.

Inline means:

```txt
Customer stays in the modal.
Stripe confirms payment.
Browser receives result.
Browser calls confirm-order.
```

Some payment methods require a redirect.

Redirect means:

```txt
Customer leaves our page temporarily.
Customer goes to Klarna, a bank page, Cash App, or 3D Secure.
Customer approves.
Stripe sends customer back to our return_url.
```

In our Stripe confirm call, this option is important:

```ts
redirect: 'if_required'
```

It means:

```txt
Stay inline when possible.
Redirect only when the selected payment method requires it.
```

The modal will not survive a full redirect. Browser navigation reloads the app. Therefore, redirect-capable payments need a real return page that can finish/reconcile the order.

Good return URL pattern:

```txt
/orders/confirm?payment_intent=pi_...
```

or:

```txt
/checkout/confirm-order?payment_intent=pi_...
```

The return page should show:

```txt
Finishing your order...
```

Then it should call the same order-finalization logic and redirect to the final order page.

## Why webhooks matter

A webhook is Stripe calling our server directly.

Example:

```txt
Stripe
-> POST /api/payments/stripe/webhooks
-> event: payment_intent.succeeded
```

This is different from the browser calling our server.

The browser path is fast UX:

```txt
Customer pays
-> browser gets success
-> browser calls /confirm-order
-> customer sees order page quickly
```

The webhook path is reliability:

```txt
Customer pays
-> browser closes, reloads, loses network, or redirects away
-> Stripe still calls our webhook
-> server can finalize or reconcile the order
```

Without webhook finalization, there is a possible gap:

```txt
Stripe payment succeeds
but browser never calls /confirm-order
so Payload order may not be created
```

That gap is small for normal card payments but real.

## Webhook vs `afterChange`

A webhook is external:

```txt
Stripe -> our app
```

A Payload `afterChange` hook is internal:

```txt
Payload document changed -> our code runs
```

They solve different problems.

Webhook example:

```txt
Stripe says payment_intent.succeeded
Our app verifies event
Our app finalizes order
```

Payload `afterChange` example:

```txt
Order is created with status processing
orders.afterChange runs
Send owner email or SMS
```

They can work together.

Recommended architecture:

```txt
Browser confirm-order path -> finalizeOrderFromPaymentIntent
Stripe webhook path -> finalizeOrderFromPaymentIntent
Order afterChange hook -> notify owner
```

## Shared idempotent finalization

The safest design is one shared function:

```ts
async function finalizeOrderFromPaymentIntent(paymentIntentID: string) {
  const existingOrder = await findOrderByPaymentIntentID(paymentIntentID)

  if (existingOrder) {
    return existingOrder
  }

  const transaction = await findTransactionByPaymentIntentID(paymentIntentID)

  if (transaction.order) {
    return loadOrder(transaction.order)
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentID)

  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment not completed')
  }

  const order = await createOrderFromTransactionSnapshot(transaction)

  await markTransactionSucceeded(transaction.id, order.id)
  await markCartPurchased(transaction.cart)

  return order
}
```

Idempotent means:

```txt
Call once -> creates order 3
Call twice -> returns order 3 again
Call from browser and webhook -> still one order
```

This prevents duplicate orders.

## Cart lifecycle discussion

We debated whether a customer should receive a brand-new cart after checkout.

Two models are valid.

### Model A: reuse and clear cart

Payload ecommerce currently behaves like this through `clearCart()`:

```txt
cart 8 has items
order 3 is created
cart 8 items are cleared
frontend keeps cartID 8
customer shops again in cart 8
```

This is simple and acceptable for many stores.

Pros:

```txt
Simple implementation
Matches the idea of an emptied physical shopping cart
Works if orders and transactions are authoritative
Less custom code
```

Cons:

```txt
Harder abandoned-cart analytics
Cart ID is not one checkout attempt
Payment idempotency must avoid stale pending transactions
Purchased cart can be accidentally reused if not guarded
```

### Model B: retire purchased cart and start fresh

Alternative flow:

```txt
cart 8 has items
order 3 is created
cart 8 gets purchasedAt timestamp
frontend forgets cart 8 using clearSession()
next add-to-cart creates cart 9
```

Pros:

```txt
Cleaner cart analytics
Cleaner abandoned-cart analysis
One cart maps more closely to one shopping session
Purchased carts remain historical artifacts
```

Cons:

```txt
More custom behavior
Need to handle active cart lookup carefully
Need to prevent resuming purchased carts
Potentially more DB rows
```

Conclusion for this bakery:

```txt
Reusing carts is not automatically wrong.
The must-have is reliable orders and transactions.
Fresh carts are useful if we want stronger cart analytics later.
```

## `clearCart()` vs `clearSession()`

`clearCart()` mutates the database cart:

```txt
POST /api/carts/8/clear
cart 8 items = []
client still remembers cartID 8
```

`clearSession()` resets frontend ecommerce state:

```txt
client forgets cartID
client forgets guest cart secret
client forgets ecommerce addresses/user state inside the ecommerce provider
DB cart remains saved
```

Payload docs describe `clearSession()` as clearing cart data, cart ID, cart secret, addresses, and user state from memory/localStorage.

Use cases:

```txt
Use clearCart when customer intentionally empties cart before checkout.
Use clearSession after successful checkout if we want next add-to-cart to create a new cart.
```

## Guest carts

Guest carts persist through browser storage.

For guests, Payload stores:

```txt
cartID
cartSecret
```

The DB has:

```txt
cart 123
secret: abc...
items: [...]
customer: null
```

The browser has:

```txt
cartID = 123
cartSecret = abc...
```

When the guest returns on the same browser:

```txt
frontend reads cartID/cartSecret
GET /api/carts/123?secret=abc...
cart is restored
```

If the guest clears browser storage, switches devices, or uses incognito, the guest cart is not recoverable unless they log in or provide contact info for cart recovery.

## Logged-in customer carts

Logged-in customers can have carts joined through the customer record.

Payload customer join field:

```ts
{
  name: 'cart',
  type: 'join',
  collection: 'carts',
  on: 'customer',
}
```

This means:

```txt
Find carts where carts.customer = this customer.id
```

The plugin sometimes looks at:

```ts
user.cart.docs[0]
```

That means:

```txt
Use the first joined cart returned by Payload
```

This is only safe if the join returns the correct active cart first.

Ideal active cart query:

```ts
const activeCartResult = await payload.find({
  collection: 'carts',
  depth: 2,
  limit: 1,
  sort: '-createdAt',
  where: {
    and: [
      {
        customer: {
          equals: user.id,
        },
      },
      {
        purchasedAt: {
          exists: false,
        },
      },
    ],
  },
})

const activeCart = activeCartResult.docs[0]
```

Business rule:

```txt
Resume active carts.
Do not resume purchased carts.
```

## PaymentIntent reuse and pending transaction reuse

Clicking Start secure payment creates or resumes a payment attempt.

We do not want every click to create a new transaction and PaymentIntent.

Better behavior:

```txt
Find pending transaction for same cart/customer
Retrieve its Stripe PaymentIntent
If reusable, return its clientSecret
If amount changed and PaymentIntent allows update, update it
If not reusable, create a new PaymentIntent and transaction
```

Reusable statuses include:

```txt
requires_payment_method
requires_confirmation
requires_action
```

Not reusable:

```txt
succeeded
canceled
processing in many cases
```

This prevents normal customer behavior from flooding the database with abandoned pending transactions.

## Stripe Customer

A Stripe Customer is Stripe's saved customer object.

It can store:

```txt
email
phone
name
metadata
payment methods if saved later
```

A PaymentIntent can be linked to a Stripe Customer:

```txt
PaymentIntent.customer = cus_...
```

We store the Stripe Customer ID on the Payload customer:

```txt
customers.stripeCustomerID = cus_...
```

This is better than repeatedly searching Stripe by email or phone.

Why not only search by phone every time:

```txt
phone formatting can vary
search can be ambiguous
stored stripeCustomerID is direct and stable
```

## Email, phone, and receipts

Stripe and many ecommerce systems prefer email because it supports:

```txt
receipts
order confirmation
refund communication
support lookup
account recovery
```

Phone can also support communication through SMS, but SMS is a separate product and consent/compliance matter.

For our storefront:

```txt
Customer auth can support email or phone.
Stripe customer can store email and/or phone.
Owner notifications can use email or SMS.
Customer receipts should eventually support email and possibly SMS.
```

## Owner notifications

There are several notification layers.

### Stripe Dashboard emails

Stripe can email account/team members when a payment succeeds.

Pros:

```txt
No code
Reliable from Stripe
Good payment backup notification
```

Cons:

```txt
Payment-focused, not bakery-order-focused
May not include tray/flavor details cleanly
Not a substitute for operational order notifications
```

### Payload order notifications with `afterChange`

A Payload `orders.afterChange` hook can notify the owner when an order is created.

Example:

```ts
const notifyOwnerAfterOrderCreate = async ({ doc, operation }) => {
  if (operation !== 'create') return
  if (doc.status !== 'processing') return

  await sendOwnerEmail({
    subject: `New order #${doc.id}`,
    order: doc,
  })
}
```

This is the best place for a bakery workflow email because it has the actual order document.

### SMS through Twilio

SMS can be useful for immediate owner alerts.

Example message:

```txt
New Baked with Blessings order #3: $105.00, 5 items, status processing.
```

SMS should be short and link to the admin/order page.

Recommended owner notification strategy:

```txt
Enable Stripe payment emails as backup.
Add Payload orders.afterChange owner email for full order details.
Add SMS later if the bakery needs immediate alerts.
```

## Security notes

Do not trust client totals.

The server should calculate or validate:

```txt
cart items
product prices
quantities
currency
customer identity
payment status from Stripe
```

Never expose:

```txt
STRIPE_SECRET_KEY
STRIPE_WEBHOOKS_SIGNING_SECRET
Payload admin secrets
```

Safe to expose:

```txt
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

Order URLs with integer IDs need access control.

Guest order links should include an access token:

```txt
/orders/3?accessToken=...
```

Integer DB IDs are fine in production because Postgres guarantees uniqueness. The security boundary should be access control and unguessable tokens, not hiding every primary key.

## Local development notes

Stripe allows localhost HTTP in test mode.

Console warning:

```txt
You may test your Stripe.js integration over HTTP. However, live Stripe.js integrations must use HTTPS.
```

This is fine locally.

Production and preview deployments should use HTTPS.

Blocked console messages like this are usually browser privacy/adblock telemetry blocking:

```txt
POST https://r.stripe.com/b net::ERR_BLOCKED_BY_CLIENT
```

Usually harmless if the Payment Element renders and payments succeed.

## Practical roadmap

### Already working

```txt
Stripe Payment Element renders in cart modal
PaymentIntent initiation works
Orders are created after successful payment
Cart modal shows order received state
Order page exists
Orders and items are saved in Postgres
```

### Important next hardening

```txt
Create shared finalizeOrderFromPaymentIntent
Use same finalization from confirm-order and webhook
Make finalization idempotent
Prevent purchased carts from being reused accidentally
Decide whether to keep clearCart or switch to clearSession after order
Add owner notification with orders.afterChange
```

### Later improvements

```txt
Better redirect return page for Klarna, bank, and 3D Secure methods
Apple Pay domain setup for production domain
Customer receipt emails
Owner SMS alerts
Abandoned cart analytics
Cart recovery flow
Shipping/delivery address decision
Tax/shipping calculation if needed
```
