# CDS Patterns For Accessibility, Responsive State, And Slots

Date: 2026-04-28

Scope: learning note plus migration guidance. This is Chapter 5 after `04-cds-patterns-for-bakery-styling-system.md`.

The earlier chapters focused on theme tokens, style props, primitives, and scene rendering.

This chapter looks at a different CDS lesson:

```txt
a design system is also a shared behavior system
```

That matters for this bakery app because many visual changes are also state changes:

```txt
change scenery
open photos
return to details
open cart
open mobile navigation
switch a header panel
spawn decorative assets
```

Some of those are purely decorative. Some should be announced or controlled consistently.

## 1. AccessibilityAnnouncer

CDS has an `AccessibilityAnnouncer` component.

It is visually hidden, but screen readers can hear it because it uses an ARIA live region:

```tsx
<div aria-atomic aria-live="polite">
  <p>Scenery changed to Medieval fantasy.</p>
</div>
```

The interesting detail is that CDS clears the message after a short delay.

Why clear it?

Because screen readers can ignore repeated messages if the live region text never really changes.

So the pattern is:

```txt
receive message
show message in hidden live region
wait briefly
remove message
```

That makes repeated state changes more reliable.

Bakery app use cases:

```txt
Scenery changed to Moonlit.
Opening photos for Cookie Tray.
Back to details for Cookie Tray.
Cart opened.
Mobile navigation opened.
```

This is not about adding visible text. It is a parallel behavior layer for assistive technology.

## 2. MediaQueryProvider

CDS also has a `MediaQueryProvider`.

Instead of every component calling `window.matchMedia` on its own, CDS creates a central store:

```txt
subscribe(query, callback)
getSnapshot(query)
getServerSnapshot(query)
```

Then hooks can use `useSyncExternalStore` to read the current answer.

The important design-system lesson:

```txt
responsive state should be a shared service
not scattered resize listeners
```

This app currently has several viewport-dependent systems:

```txt
hero flower density
panel flower density
mobile sky images
header mobile menu behavior
scenery object positions
cart/footer compact scene behavior
```

Some of those are fine as CSS media queries.

But when JavaScript needs viewport facts, the CDS pattern suggests a shared bakery provider:

```tsx
const isPhone = useBakeryMediaQuery('(max-width: 767px)')
```

Then the app can avoid each component inventing its own resize listener.

## 3. Slot APIs

CDS components often expose `classNames` and `styles` objects for named internal pieces.

Example pattern from CDS visualizations:

```tsx
<ProgressCircle
  classNames={{
    root: 'myRoot',
    svg: 'mySvg',
    circle: 'myTrack',
    progress: 'myProgress',
  }}
  styles={{
    progress: { strokeLinecap: 'round' },
  }}
/>
```

The useful part is not the exact API.

The useful part is that the component names its internal regions:

```txt
root
svg
circle
progress
```

For this app, slot APIs would be useful for:

```txt
MenuHero
PersuasionGardenPanel
FooterSurface
Header panels
SceneAsset layers
Cookie card media
```

Without slots, a styling request like "move the photo button" forces the editor to search through a giant component.

With slots, the component can expose:

```ts
type PersuasionPanelSlots = {
  root?: string
  detailFace?: string
  galleryFace?: string
  actionRow?: string
  meadowLayer?: string
  flowerLayer?: string
}
```

That gives humans and AI a safer target.

## 4. Loading And Progress Are Product Behavior

CDS buttons can render loading state internally.

The caller can say:

```tsx
<Button loading>Save</Button>
```

Then the design system handles:

```txt
disabled interaction
loading label
spinner placement
icon hiding
minimum button width
visual consistency
```

The bakery equivalent:

```tsx
<SceneButton loading>Changing scenery</SceneButton>
```

or:

```tsx
<SceneButton loading progressLabel="Opening photos">
  See photos
</SceneButton>
```

This is worth learning because loading behavior is easy to implement inconsistently when every component invents its own spinner.

## 5. What We Implemented From This Chapter

This migration added a bakery version of the CDS announcer pattern:

```txt
BakeryAnnouncerProvider
BakeryAccessibilityAnnouncer
useBakeryAnnouncer
```

The app now has a shared behavior primitive for screen-reader announcements.

Current announced actions:

```txt
changing menu scenery
opening menu-item photos
returning from photos to details
```

This is the same layered idea as the visual design system:

```txt
provider
  owns shared behavior state

hook
  exposes a small API

components
  request behavior through a stable contract
```

This follow-up migration added the bakery version of the CDS media-query pattern:

```txt
BakeryMediaQueryProvider
createBakeryMediaQueryStore
useBakeryMediaQuery
bakeryMediaQueries
```

The important internal pieces are:

```txt
defaultValues
  the server-safe answer for simple queries before the browser exists

subscribe(query, callback)
  registers one shared browser listener for a query

getSnapshot(query)
  reads the current browser answer

getServerSnapshot(query)
  solves the query from defaultValues during server rendering
```

The first real migration is the mobile header menu. It no longer owns its own `window.resize`
listener. It asks the design system:

```tsx
const isTabletUp = useBakeryMediaQuery(bakeryMediaQueries.tabletUp)
```

Then the component reacts to that shared answer. This is the same design-system ladder again:

```txt
provider
  owns shared responsive behavior

hook
  exposes a tiny query API

component
  asks a named question instead of manually reading window.innerWidth
```

This next migration added the bakery version of the CDS slot pattern for the persuasion/photo
panel:

```txt
BakerySlotClassNames
BakerySlotStyles
PersuasionGardenPanelClassNames
PersuasionGardenPanelStyles
persuasionGardenPanelSlots
```

Instead of the parent needing to know a giant pile of internal classes, it can now target named
regions:

```tsx
<PersuasionGardenPanel
  classNames={{
    root: 'cateringMenuPersuasionRoot',
    actionRow: 'cateringMenuPersuasionActionRow',
    galleryFace: 'cateringMenuPersuasionGalleryFace',
    photoBoard: 'cateringMenuPersuasionPhotoBoard',
  }}
/>
```

The important idea is not those exact class names. The important idea is that the component exposes
a controlled styling vocabulary:

```txt
root
viewport
detailFace
galleryFace
foreground
actionRow
meadowLayer
flower
photoBoard
transitionLine
```

That makes future styling requests safer. A request like "move the photo button row" can target
`actionRow`. A request like "make the photo board taller" can target `photoBoard`. A request like
"tune the flowers" can target `flower`, `wildflower`, or `spawnedFlower`.

This next migration added the bakery version of CDS-style button loading behavior:

```txt
SceneButton loading
SceneButton loadingLabel
SceneButton progressLabel
```

The button now owns the repeated loading decisions:

```txt
disable interaction while loading
set aria-busy
provide an accessible loading label
hide the normal label visually
center one consistent spinner
keep the button's layout stable
```

So callers can write:

```tsx
<SceneButton loading={isPending} loadingLabel="Adding tray to cart">
  Add Banana Crumble Tray to cart
</SceneButton>
```

The caller still decides when the action is pending. The design system decides how pending buttons
look and behave.

This next migration connected the announcer to the header and mobile navigation:

```txt
mobile navigation opened
mobile navigation closed
account menu opened
account menu closed
sign-in menu opened
sign-in menu closed
other pages menu opened
other pages menu closed
cart opened with item count
```

The point is not that every click needs a visible toast. The point is that layout-level actions can
now report important state changes through the same hidden live-region system:

```tsx
const { announce } = useBakeryAnnouncer()

announce('Other pages menu opened.')
```

This is the behavior equivalent of tokens. Components stop inventing separate announcement logic and
use one shared contract.

This next migration connected the announcer to cart item controls:

```txt
item removed from cart
item quantity increased
item quantity reduced
cart item update failed
```

The cart buttons now also use product-aware labels:

```txt
Remove Cookie Tray from cart
Increase Cookie Tray quantity
Reduce Cookie Tray quantity
```

The small implementation detail that matters:

```txt
DeleteItemButton
EditItemQuantityButton
  ask a shared helper for the item title
  perform the cart mutation
  announce the result through useBakeryAnnouncer
```

This keeps the behavior attached to the reusable cart controls. The cart modal and the header quick
cart both benefit because they use the same buttons.

## 6. Good Future Chapter-5 Migrations

The next useful migrations from this chapter would be:

```txt
menu form announcements
  announce ingredient receipt opened, tray flavor selected, and add-to-cart failures
```

The broader CDS lesson:

```txt
mature design systems reduce repeated behavioral decisions
not only repeated CSS decisions
```
