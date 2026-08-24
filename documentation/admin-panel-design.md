# Admin panel design contract

The admin panel is for a non-technical bakery owner. Its home screen should answer two questions quickly:

1. What needs attention now?
2. Where do I go to complete the next task?

## Technology-product references

- [Shopify Home](https://help.shopify.com/en/manual/shopify-admin/shopify-home) is the primary model: operational tasks and business activity lead to the relevant workflow.
- [Shopify's resource index](https://polaris-react.shopify.com/patterns/resource-index-layout) keeps products, orders, and customers scannable, searchable, sortable, and linked to their detail pages.
- [Stripe deep links](https://docs.stripe.com/stripe-apps/deep-links) support direct routes that remove unnecessary navigation steps.
- [GitHub Primer confirmation dialogs](https://primer.style/product/components/confirmation-dialog/) add deliberate friction before important wide-impact actions.
- [GitHub Primer accessibility guidance](https://primer.style/product/components/action-menu/accessibility) requires descriptive text, keyboard operation, visible focus, and usable targets.
- [Atlassian empty states](https://atlassian.design/components/empty-state) explain what happened and provide a useful next action.
- [IBM Carbon status indicators](https://carbondesignsystem.com/patterns/status-indicator-pattern/) use color according to workflow meaning instead of styling every state as success.

## Decisions

- The dashboard is an operational overview, not a second copy of Payload's full navigation.
- Daily workflows are one click from the dashboard and no more than two clicks from an inner admin screen.
- The oldest unfinished orders appear first. Completed and cancelled orders do not compete for attention.
- Each dashboard data source fails independently so one unavailable preview does not block other work.
- Search uses owner-known terms: customer name, email, or phone; product title or slug.
- Important bulk updates require a review step that states their scope and resulting prices.
- Requested, confirmed, and ready orders remain distinguishable without relying on color alone.
- Owner-facing order dates use the bakery's Central time zone, not the deployment server's locale.
- The left nav shows bakery work only. Discussion graph, blessings-network, and verification logs stay hidden. Ecommerce internals (carts, variants, transactions) stay in an Advanced group so Payload can still build the login client config.
- Specials of the Week has one owner path: **Cookie lineups**. The standing menu lives on **Cookies and menu**. A single cookie can still move onto the lineup from its product form; rearranging the public set happens on the lineup.
- The default product edit leads with placement, price, and photos. Writing, trays, and SEO stay on later tabs.

## Deliberate non-goals

- Do not replace Payload's collection or document screens with a parallel CMS.
- Do not add charts without a concrete owner decision they help make.
- Do not add global search until its indexed content, permissions, and keyboard behavior can be implemented as one coherent feature.
