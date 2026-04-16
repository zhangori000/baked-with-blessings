# DDoS And Billing Protection

## Why this is in backlog

The storefront is moving toward public product media, ecommerce traffic, and eventually a production Vercel deployment. Before launch, the project needs an explicit traffic-protection plan so accidental spikes, hostile scraping, or bot abuse do not translate into runaway origin usage or an ugly Vercel bill.

## What to evaluate later

Start by comparing Vercel-native protection and an external CDN/WAF layer instead of assuming Cloudflare is automatically the best answer. The evaluation should include Vercel Firewall and managed bot protection, rate limiting on expensive routes, cache strategy for public assets, and whether a Cloudflare proxy adds enough value to justify the extra layer of complexity.

## Scope to revisit

This should cover at least the storefront pages, product/media delivery, API routes, checkout-related endpoints, and any future auth or search endpoints. The review should also include operational guardrails such as usage alerts, spend monitoring, and a clear answer for how high-risk routes are throttled before production traffic is invited in.
