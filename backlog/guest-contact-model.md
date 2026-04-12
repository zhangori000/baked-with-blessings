# Guest Contact Model

## Goal

Support guest checkout with a contact method that can be:

- email
- phone
- another verified contact type later

## What was prepared in this app

- The app now stores derived `guestContactMethod` and `guestContactValue` fields on orders and transactions through collection overrides in [src/plugins/index.ts](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/baked-with-blessings/src/plugins/index.ts).
- Local address forms already support phone numbers, so the UI data is partially available.

## What still blocks true phone-only guest checkout

The official ecommerce plugin still hard-requires `customerEmail` for guest purchases in its shared payment endpoints.

Relevant upstream files in the sibling Payload repo:

- [initiatePayment.ts](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/payload/packages/plugin-ecommerce/src/endpoints/initiatePayment.ts)
- [confirmOrder.ts](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/payload/packages/plugin-ecommerce/src/endpoints/confirmOrder.ts)
- [stripe/initiatePayment.ts](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/payload/packages/plugin-ecommerce/src/payments/adapters/stripe/initiatePayment.ts)
- [stripe/confirmOrder.ts](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/payload/packages/plugin-ecommerce/src/payments/adapters/stripe/confirmOrder.ts)

## Recommended next step

Fork or replace the guest payment flow so it accepts a generic guest contact payload, for example:

- `guestContactType`
- `guestContactValue`

Then update:

- checkout submission
- payment initiation
- order confirmation
- guest order lookup and recovery

## Design note

Treat these as separate concerns:

- login identity
- checkout contact
- order recovery / verification channel

That lets you support things like GitHub login without pretending GitHub is a receipt or recovery channel.
