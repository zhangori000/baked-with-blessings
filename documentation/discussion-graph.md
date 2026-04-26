# Discussion Graph Product Notes

## Goal

The discussion graph is a reusable system for structured public discussions. It should support conversations where users create questions or statements, then other users can respond with regular replies or follow-up questions. The product should be organized so it can start inside this Next.js/Payload app, but later be extracted into a shared package or separate API service for unrelated products like a baking site, DJ app, blog, or local discussion site.

The main product idea is not a normal Reddit-style comment tree. It is closer to structured reasoning. Users create discussion nodes, and each node can contain labeled text blocks so conclusions, premises, and uncertainty are separated clearly. Internally these are still stored as `claim`, `evidence`, and `uncertainty` blocks for now.

## Core Concepts

There are only two node types:

- `question`
- `statement`

A reply is not a separate node type. A reply is a relationship between nodes. For example, if a user answers a question, the answer is a `statement` node connected to the original `question` node by an edge. If a user asks a follow-up, the follow-up is a `question` node connected to the original node by an edge.

The important mental model is:

```txt
Node = one user-created discussion unit
Node type = question or statement
Edge = how one node relates to another node
Content blocks = labeled parts inside a node's text
```

## Node Content Blocks

Each node stores structured content internally. The node is still one node, but its body contains blocks that the UI can label and validate.

Recommended first content block types:

```ts
type ContentBlock =
  | {
      id: string
      type: 'claim'
      text: string
    }
  | {
      id: string
      type: 'evidence'
      evidenceKind: 'source' | 'direct_experience' | 'reasoning'
      text: string
      url?: string
    }
  | {
      id: string
      type: 'uncertainty'
      text: string
    }
```

Evidence includes sourced evidence, direct experience, and reasoning. We intentionally removed separate `hunch`, `estimate`, and `context` block types for now. If a user is reasoning without a source, that should be labeled as `evidence` with `evidenceKind: 'reasoning'`. If they are unsure, they should label that part as `uncertainty`.

Example node content:

```json
{
  "blocks": [
    {
      "id": "claim_1",
      "type": "claim",
      "text": "Boba is overpriced compared with its raw ingredients."
    },
    {
      "id": "evidence_1",
      "type": "evidence",
      "evidenceKind": "reasoning",
      "text": "Tea, milk, syrup, and tapioca appear cheap in bulk compared with the menu price."
    },
    {
      "id": "uncertainty_1",
      "type": "uncertainty",
      "text": "I do not know the store's rent, labor cost, waste, or delivery fees."
    }
  ]
}
```

## Edges

Use an `edges` table or collection to store relationships between nodes. The user-facing API does not need to expose the word "edge"; the app can expose simple actions like reply, ask, support, and challenge. Internally, those actions create nodes and edges.

Recommended edge direction:

```txt
from_node_id = child/source/new node
to_node_id = parent/target node
```

This makes edges read like normal sentences:

```txt
Node B responds_to Node A
Node C asks_about Node A
Node D supports Node A
Node E challenges Node A
```

Recommended edge types:

```txt
responds_to
asks_about
supports
challenges
```

We do not need a `references` edge type yet because source URLs can live inside evidence blocks.

## Replying To A Whole Node Or Specific Blocks

Users should be able to respond to a whole node or to one or more specific content blocks inside that node. This is useful when someone wants to challenge only one claim, ask about one piece of evidence, or support several parts at once.

Recommended edge shape:

```txt
edges
- id
- tenant_id
- from_node_id
- to_node_id
- to_block_ids nullable
- type
- created_at
```

`to_block_ids` behavior:

```txt
null = responding to the whole parent node
["claim_1"] = responding to one block
["claim_1", "evidence_1"] = responding to multiple blocks
```

In Postgres, `to_block_ids` can be a `text[]` column because it is just an array of block ID strings. The main node body should use `jsonb` because it stores structured JSON content.

## Database Shape

Recommended first relational model:

```txt
nodes
- id
- tenant_id
- author_id
- type: question | statement
- title
- content_json jsonb
- support_count
- challenge_count
- response_count
- question_count
- awareness_count
- created_at
- updated_at

edges
- id
- tenant_id
- from_node_id
- to_node_id
- to_block_ids text[] nullable
- type: responds_to | asks_about | supports | challenges
- created_at

awareness_marks
- id
- tenant_id
- node_id
- user_id
- created_at
```

The `edges` table is the source of truth for relationships. Counts on `nodes` are cached summaries for speed. For example, `support_count` can be incremented when a `supports` edge is created, but if counts ever drift, they can be recalculated from `edges`.

## Tenant ID

Use `tenant_id` internally so the discussion graph can support multiple unrelated products later. Example tenants could be:

```txt
baked-with-blessings
dj-app
boba-blog
local-minnesota-discussions
```

The UI does not need to show the word tenant. It is a backend isolation key that lets one reusable discussion system serve multiple apps without mixing their discussions.

## API And Service Design

The public code should not force normal app code to think in graph terminology. Hide edge creation behind service functions.

Recommended service functions:

```ts
createRootNode(...)
replyToNode(...)
askAboutNode(...)
markReplyAsSupport(...)
markReplyAsChallenge(...)
markNodeImportant(...)
getNodeGraph(...)
```

Example:

```ts
await replyToNode({
  tenantId,
  parentNodeId,
  parentBlockIds: ['claim_1', 'evidence_1'],
  replyIntent: 'challenge',
  nodeType: 'statement',
  content,
})
```

Internally this would:

```txt
1. create the new statement node
2. create an edge from the new node to the parent node
3. increment the parent's challenge_count
4. return the new node and edge
```

## Where This Should Live In This Repo

Start with a feature module inside this app, not a separate service yet:

```txt
src/features/discussion-graph/
  types/
  services/
  collections/
  components/
  api/
```

Suggested responsibilities:

```txt
src/features/discussion-graph/types/
```

Shared TypeScript types like node type, edge type, content block type, and API input/output shapes.

```txt
src/features/discussion-graph/services/
```

Business logic such as `createRootNode`, `replyToNode`, `supportNode`, `challengeNode`, count updates, validation, and graph fetching. This is the most important folder to keep clean because it is what can later move to a package or separate service.

```txt
src/features/discussion-graph/collections/
```

Payload collection configs for `DiscussionNodes`, `DiscussionEdges`, and `AwarenessMarks`, if this is implemented through Payload collections.

```txt
src/features/discussion-graph/components/
```

Reusable UI components such as a graph view, node composer, block editor, evidence block editor, node card, and awareness button.

```txt
src/features/discussion-graph/api/
```

Route handlers or server-action wrappers that call the service layer. These should stay thin.

Later extraction path:

```txt
src/features/discussion-graph
  -> packages/discussion-graph
  -> discussion-api.yourdomain.com
```

The main rule is to keep product-specific UI and branding outside the core service logic. The discussion graph service should understand tenants, nodes, edges, blocks, awareness marks, and permissions. It should not know whether it is being used by a bakery app, DJ app, or blog.

## V1 Product Scope

For the first launch, keep the system editorially controlled instead of fully open. Only admins can create root topics/questions. Regular users can reply to existing nodes, ask follow-up questions under existing nodes, and react with exclamation, sobbing, or wilted rose. V1 should present replies like Reddit-style replies instead of asking users to classify everything as support or challenge. This keeps the initial graph from becoming chaotic while still allowing the community to build out the reasoning around admin-curated topics.

Recommended v1 permissions:

```txt
Admin:
- create root question nodes
- create root statement nodes
- reply anywhere
- hide or restore nodes
- assign moderator roles
- manage tags if needed

Moderator:
- hide or restore nodes
- review questionable content
- optionally adjust tags later

User:
- reply to existing nodes
- ask follow-up questions under existing nodes
- mark nodes with exclamation, sobbing, or wilted rose reactions
- mark their own node reconsidered

User cannot:
- create root topics
- edit after publishing
- hide content from everyone else
- assign roles
```

V1 should avoid normal editing after publish. Since replies may target specific claims or evidence blocks, changing a node after others respond can confuse the graph. Instead, users can create a new reply and mark their earlier node as reconsidered because of that later node.

Recommended author correction fields:

```txt
author_state: current | reconsidered
reconsidered_due_to_node_id nullable
```

This is different from moderation. Author correction is the author saying "I no longer fully stand by this." Moderation is the platform saying "this should not be visible to everyone."

Recommended moderation fields:

```txt
moderation_status: visible | hidden
moderation_reason nullable
moderated_by nullable
moderated_at nullable
```

Do not automatically mark child subgraphs as reconsidered when a parent is reconsidered. Child replies may still be useful. Instead, the UI can show a warning that a node responds to content the author later reconsidered.

## Identity And Display Names

Moderators should be designated through accounts, preferably in the Payload admin panel. Users do not need separate moderator accounts. An account can simply have a role.

Recommended account shape:

```txt
roles: user | moderator | admin
display_name
display_name_history optional
```

Nodes should store `author_id`, then display the author's current display name when rendering. This means if a user changes their display name, all their existing nodes visually update to the new name, which avoids making the same author look like multiple different authors across the graph. If name changes become a moderation issue, keep display name history for admin review.

## Topic List First, Graph Detail Second

The first screen should probably be a row-based topic list instead of a giant graph canvas. Row-by-row content is easier to scan, sort, and compare. The graph should be the detail experience after a user chooses a topic.

Useful topic-list sorts:

```txt
recent
newly_active
most_discussed
most_challenged
most_supported
most_questions
most_awareness
unanswered
reconsidered
```

Recommended v1 sorts:

```txt
recent
newly_active
most_discussed
most_challenged
most_awareness
```

Each topic row can show:

```txt
title
short preview
tags
created date
last active date
reply count
support count
challenge count
awareness count
```

When a user clicks a row, the UI can transition into the graph view. The desired feel is not a literal morph of every row element. Instead, the visible rows could rattle, fall apart, or disintegrate out of the way, then the selected row becomes the focused graph with nodes and edges. This is a visual effect layered on top of the normal state transition:

```txt
topic list
  -> click row
  -> surrounding rows disintegrate / fall away
  -> selected topic becomes center graph node
  -> child nodes animate outward
```

The app should remember the topic list scroll position so "Back to topic list" returns the user to where they were.

## Graph Navigation

The graph view should not fetch or display the entire graph. It should show a neighborhood around the selected node or root topic.

Recommended graph fetches:

```ts
getRootNodes({ tenantId })

getGraphNeighborhood({
  tenantId,
  nodeId,
  depth: 2,
})
```

The graph view should include orientation tools so users do not get lost:

```txt
Back to topic list
Topic title
Focused node indicator
Path / trail tracker
Reset view button
Mini map later
```

The path tracker can behave like a table of contents or navigation history:

```txt
Are boba overpriced?
> Ingredient costs
> Rent and labor challenge
> Author reconsideration
```

The full content of a node should not live inside tiny graph bubbles. Graph nodes should show a title, preview, counts, and relationship type. Full structured content should appear in a side panel, drawer, or focused detail area.

## Discovery, Tags, And Search

Use tags rather than one required topic category. A discussion can belong to multiple ideas at once, such as `umn`, `housing`, `construction`, `money`, and `local-business`.

Recommended fields:

```txt
tags text[]
search_text text
```

`search_text` is derived data created by code from the title, content block text, and tags. It makes normal search easier even though the source content lives in structured JSON.

Example:

```txt
title: "Are boba overpriced?"
tags: ["boba", "pricing", "food"]
content_json blocks:
- "Boba is overpriced compared with its ingredients."
- "Tea, milk, syrup, and tapioca are cheap in bulk."

search_text:
"Are boba overpriced? Boba is overpriced compared with its ingredients. Tea, milk, syrup, and tapioca are cheap in bulk. boba pricing food"
```

For v1, similar-topic detection can use `search_text` and tags. Later, semantic search could use embeddings with Postgres plus `pgvector`, but that should not be required for the first implementation.

## Similar Topics And Related Nodes

When an admin starts a new root question, the UI can suggest similar existing nodes before publishing. Do not block publishing; just suggest related discussions.

Recommended service:

```ts
findSimilarNodes({
  tenantId,
  title,
  contentPreview,
  tags,
  limit: 5,
})
```

For v1, implement this with normal text search. Later it can be upgraded internally to use embeddings without changing the service API.

If someone posts something similar anyway, users or moderators should be able to link discussions. This may require adding a softer relationship type later:

```txt
related_to
```

This is friendlier than `duplicate_of` and can be shown in the UI as "Related discussion."

Every node should have its own URL:

```txt
/discussions/[nodeId]
```

Specific content blocks can be focused with a query param or hash:

```txt
/discussions/[nodeId]?block=claim_1
/discussions/[nodeId]#claim_1
```

## Daily Moderator Reports

A moderator should eventually have a "copy daily activity" or "copy report" button. The report should be based on activity during a date window, not only topics created that day. A seven-day-old discussion that received new replies today should appear in today's report with enough context plus a summary of today's activity.

Daily report inputs:

```txt
nodes created during the day
edges created during the day
awareness marks during the day
nodes marked reconsidered during the day
moderation actions during the day
topics that became newly active during the day
```

Possible future table:

```txt
daily_reports
- id
- tenant_id
- report_date
- generated_by
- content_json
- markdown
- created_at
```

For v1, this does not need to be built immediately, but the timestamps on nodes, edges, awareness marks, and moderation actions should be reliable so this feature is easy later.

## Graph Rendering: Library Or Custom

Creating a node-and-edge graph does not strictly require an npm graph library. A custom implementation is possible, especially for a small v1 graph neighborhood. The simplest custom approach is to render nodes as absolutely positioned React elements and render edges as SVG lines behind them.

Custom graph rendering is reasonable if v1 needs:

```txt
small graph neighborhoods
fixed depth like 1-2 levels
simple click/zoom behavior
custom pixel-art styling
basic pan/zoom or no pan/zoom at first
```

Custom graph rendering gets hard when the app needs:

```txt
automatic graph layout for messy graphs
dragging nodes
collision avoidance
large graph performance
touch gestures
mini maps
edge routing around nodes
keyboard accessibility
selection boxes
zoom/pan physics
```

The pragmatic path is:

```txt
V1: custom graph renderer may be fine if the graph is small and controlled.
Later: use @xyflow/react or Cytoscape.js if layout, interaction, or graph size becomes complex.
```

Pixel art does not require a special graph library. It can be a CSS and asset direction:

```css
.pixel-node {
  border: 3px solid #1b1b1b;
  border-radius: 0;
  box-shadow: 4px 4px 0 #1b1b1b;
  image-rendering: pixelated;
}
```

Edges can use straight or stepped SVG lines instead of smooth curves to create a retro computer-graph look. The visual goal can reference game-like pixel art, but the UI should stay readable: compact node previews in the graph, full content in a detail panel, and clear edge labels or icons.

## Implemented First Pass

The first implementation is intentionally an HTML tree interface, not a freeform graph canvas. The backend still uses nodes and edges, but the first UI starts as a sortable topic list and opens a top-down tree for the selected topic. This matches the later decision that row-by-row scanning is easier for topic discovery and that top-down tree structure is more mobile-friendly.

Implemented v1 pieces:

```txt
Payload collections:
- discussion-nodes
- discussion-edges
- awareness-marks

Route:
- /discussion-board

API routes:
- POST /api/discussions/reply
- POST /api/discussions/awareness

Navigation:
- "Words of Affection" became "Discussion Board"
- "Calling for Help" was removed from the fallback nav
```

The current UI supports:

```txt
sortable topic rows
row click transition into a tree view
top-down child groups for replies and follow-up questions
visible child-group labels
focus view for a child node
parent/path navigation for getting unstuck in deep threads
depth controls
collapse/expand controls for child branches
path/trail navigation
sticky discussion header with the current path
reply composer with fixed structured sections
solid connector lines between parents and children
simple reply / ask question creation actions
exclamation-mark reaction button
sobbing reaction button
wilted rose reaction button
```

Current composer direction:

```txt
Questions:
- one required question textarea
- one optional background textarea

Statements:
- one large freeform reply textarea
- later enhancement: highlight text and label selected spans as conclusion or premise

Source URLs are pasted directly into the freeform reply textarea instead of separate URL fields.
The backend still stores structured content blocks so published nodes render with labels.
```

The starter root questions are seeded automatically when the discussion board first loads and an admin exists:

```txt
Can I-94 near UMN be made less clogged without making the city worse?
If you wanted to start a cafe or bakery in Minnesota, how would you buy property?
If a friend visited Minnesota for the first time, where should you take them?
Who gets to replace Dinkytown commercial strips with apartments, and how does the money work?
```

The starter questions use researched source/evidence blocks from MnDOT, Minnesota DEED, City of Minneapolis, Meet Minneapolis, Explore Minnesota, and Minneapolis planning documents. These are seed prompts, not final reporting pages.

The I-94 starter topic also seeds a few example child replies for UI testing:

```txt
- a first reply quoting the ArcGIS Rethinking I-94 page and asking why congestion is not named directly
- a nested follow-up question linking the Evaluation Summary and asking someone to explain the graph
- a response explaining that the rows are alternatives and the columns are grading criteria
- a response explaining the construction and maintenance cost columns in plain language
```

Current v1 constraint:

```txt
Admins seed/create root topics.
Anonymous posting is enabled for early testing under existing nodes.
The exclamation, sobbing, and wilted rose reactions increment counts directly in v1.
Logged-in customer/admin reactions can later use reaction records for duplicate protection.
```

The current implementation keeps core logic in:

```txt
src/features/discussion-graph/
```

That keeps the code organized for a future extraction into a package or separate API if this discussion graph becomes reusable across other products.
