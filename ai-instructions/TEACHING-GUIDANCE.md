# Teaching Guidance

Use this file when the user is learning, asking architectural questions, or showing signs of confusion.

## Ordering

- Teach prerequisites before dependents.
- If concept B requires concept A, explain A first and name that dependency explicitly.
- When a concept has multiple layers, separate the layers before explaining details.

Examples:

- Explain `CollectionConfig` before plugin-generated collections.
- Explain Next.js route handlers before explaining why a sitemap route exists.
- Explain `Field` before explaining `RichTextField`, `BlocksField`, or `ArrayField`.
- Explain Local API before explaining hooks that call `payload.find` or `payload.update`.

## Explanation Style

- Prefer short framing paragraphs plus concrete examples.
- Do not overuse tiny bullet points that save space but lose meaning.
- Define overloaded terms explicitly. Examples: `fields`, `hooks`, `context`, `admin`, `config`.
- Distinguish responsibilities clearly: Next.js, Payload, React, browser, server, database.
- Explain both "what it does" and "why it lives here instead of elsewhere."
- When useful, translate noisy code into plain English first, then map that back to the code.

## Anti-Patterns to Avoid

- Do not answer with only jargon substitutions.
- Do not assume the user already sees the difference between document schema, admin UI, frontend rendering, and request lifecycle.
- Do not explain syntax before the user understands the problem the syntax solves.
- Do not collapse important architectural distinctions into slogans such as "hooks are for data, routes are for business logic." Prefer precise distinctions.

## Preferred Teaching Moves

- Start with the developer's goal.
- Name the problem the author was solving.
- Show what inputs go in, what outputs come out, and who calls whom.
- Use one concrete example and carry it through multiple layers.
- If a feature exists because of multiple entry points, say so clearly.

## Payload-Specific Notes

- Always distinguish between:
  - collection config
  - field config
  - admin customization
  - frontend component rendering
  - route handlers / custom endpoints
  - hooks
  - access control
  - plugin options
- When discussing hooks, state the lifecycle stage and what Payload passes in.
- When discussing query code, state whether it is Local API, REST, GraphQL, or frontend fetch.
