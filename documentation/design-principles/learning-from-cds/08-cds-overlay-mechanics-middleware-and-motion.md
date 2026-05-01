# CDS Overlay Mechanics, Middleware, and Motion (Chapter 8)

Date: 2026-04-28  
Scope: overlay internals and practical hooks in `cds-web`

This chapter translates how CDS builds floating UI pieces like dropdowns and popover panels into a small mental model.

## 1) What is an overlay in CDS?

In CDS, an **overlay** is UI that renders above normal page content and is typically anchored to a trigger element.
That means the target screen content (header, grid, cards, etc.) still exists in document flow, while the overlay "floats" above it.

In this repo the pattern is used for interactions like panels, menus, and dropdowns; the same mechanism could host decorative content if needed.
So, overlays can technically host **anything** (including SVGs or animations), but they are usually for user-driven interaction surfaces.

Examples:

- menu popups
- action panels
- select/dropdown trays
- tooltip-like surfaces
- modal-like popovers in compact modes

The common requirements are:

1. position relative to a target
2. open/close lifecycle control (step-by-step: hidden -> open -> mounted -> focused -> close action -> unmounted)
3. focus trapping and keyboard behavior
4. optional backdrop/overlay scrim (a semi-transparent layer behind the popup that blocks background interaction)
5. animated mount/unmount (play transition as the overlay enters/leaves the tree)
6. responsive sizing (prevent overlay from growing taller than available viewport space)

That behavior lives in small reusable overlay primitives and then gets wrapped into concrete components.

## 2) Base engine vs concrete component

This section is the important one.

Use this rule:

- `Popover` = **engine only**
- `PopoverPanel` / `Dropdown` = **ready-to-use product components**

### What makes `Popover` an engine

`Popover` answers only:

1. Where should the floating content be attached?
2. When should it be visible?
3. How should focus and escape-key behavior work?
4. How does it render into a portal and animate mount/unmount?

It does not decide what your content looks like.

### What makes `PopoverPanel`/`Dropdown` concrete

Start with a simple analogy:
- `Popover` is the lift shaft: it owns when to open/close, where to attach, how to position, focus handling, and animation timing.
- `PopoverPanel` and `Dropdown` are finished cabins: they decide what the overlay should look like and how it should behave for a specific use case, while still using the same shaft underneath.

In practice, when you see this usage, you are using the raw engine directly:

```tsx
<Popover
  content={<Text>Profile shortcuts</Text>}
  contentPosition={{ placement: 'bottom-start', gap: 0.5 }}
  visible={isOpen}
  onPressSubject={() => setIsOpen(true)}
  onClose={() => setIsOpen(false)}
>
  <Button>Open</Button>
</Popover>
```

This has no built-in panel/menu contract. It only says: "render this floating content next to this trigger."  
`PopoverPanel` and `Dropdown` are two "concrete" versions of that same base idea:
- `PopoverPanel`: generic floating sheet/panel with a panel shell and caller-controlled close behavior.
- `Dropdown`: menu surface that manages selection, active state, and menu-sized defaults.

Those two components use the `Popover` engine in three concrete ways.

1. They decide which engine inputs they pass to `Popover` and what they hide from callers.

`Popover` expects generic props like `content`, `contentPosition`, `visible`, `onClose`, and `showOverlay`.

If you pass props to `PopoverPanel` in an app, you are not passing `contentPosition` or `onClose` directly most of the time. Those are "internalized" by `PopoverPanel` so consumers can use simpler options that match a panel use case.

Here, **public props** means: "the props you, as a caller, are allowed to pass."  
For `PopoverPanel`, public props include things like `panelWidth` and `maxPanelHeight` and they map to the engine behind the scenes as layout and behavior details.

- `PopoverPanel` takes panel-focused public props (`panelWidth`, `maxPanelHeight`, `enableMobileModal`) and translates them into:
  - `PopoverPanelContent` wrapper props (`width`, `maxHeight`, etc.),
  - `Popover` behavior props (`content`, `showOverlay`, `onClose`, `contentPosition`).
- `Dropdown` takes menu-focused public props like `value`, `onChange`, `enableMobileModal`, `maxHeight` and translates them into:
  - `DropdownContent` wrapper props (`maxHeight`, `maxWidth`, `minWidth`, `placement`),
  - `Popover` engine props (`content`, `onClose`, `onPressSubject`, `contentPosition`, `showOverlay`).

2. They decide how the **shell** looks.

Here, **shell** means the visible surface around your content: border, radius, background, elevation, scroll area, and accessible roles.

- `PopoverPanel` uses:
  - [`PopoverPanelContent`](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/overlays/popover/PopoverPanelContent.tsx) for border radius, elevation, role, background, and max size.
- `Dropdown` uses:
  - [`DropdownContent`](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/dropdown/DropdownContent.tsx) for bordered menu surface, role `"menu"`, overflow behavior, and border radius.

3. They choose default interactions that fit the component type.

- `PopoverPanel`: no automatic close on item click because content is arbitrary, so it exposes `closePopover` in the content render prop so the parent can decide when to close.
- `Dropdown`: menu-like behavior, so it closes through select-related flows and can auto-close on option changes unless disabled.

So:  
`Popover` provides the mechanism.  
`PopoverPanel` and `Dropdown` provide a **product contract** (API + shell + expected behavior).

### Concrete implementation sketch (how they call Popover)

`PopoverPanel` takes panel props, builds panel content, then passes it into `Popover`:

```tsx
// simplified shape from packages/web/src/overlays/popover/PopoverPanel.tsx
const memoizedContent = (
  <PopoverPanelContent
    width={panelWidth ?? triggerWidth}
    height={height}
    maxHeight={maxPanelHeight}
    maxWidth={maxPanelWidth}
    minWidth={minPanelWidth}
    placement={combinedContentPosition.placement}
  >
    {resolvedContent}
  </PopoverPanelContent>
)

<Popover
  content={memoizedContent}
  contentPosition={combinedContentPosition}
  visible={visible}
  onClose={handleClosePopover}
  onPressSubject={!visible ? handleOpenPopover : undefined}
  showOverlay={showOverlay}
>
  {children}
</Popover>
```

`Dropdown` builds dropdown content, applies menu sizing hooks, then passes content into `Popover`:

```tsx
// simplified shape from packages/web/src/dropdown/Dropdown.tsx
const { dropdownHeight } = useResponsiveHeight({...})

const memoizedContent = (
  <DropdownContent
    ref={dropdownRef}
    maxHeight={dropdownHeight}
    maxWidth={maxWidth}
    minWidth={minWidth}
    placement={combinedContentPosition.placement}
    width={block ? subjectBounds.width : width}
  >
    {content}
  </DropdownContent>
)

<Popover
  content={disabled ? undefined : memoizedContent}
  contentPosition={combinedContentPosition}
  visible={disabled ? false : visible}
  onClose={onCloseMenu}
  onPressSubject={!visible ? onOpenMenu : undefined}
  showOverlay={showOverlay}
  disablePortal={disablePortal}
/>
```

### Side-by-side relation (same engine, different wrappers)

```tsx
// Engine-level usage: you control visibility yourself
const [open, setOpen] = useState(false)

<Popover
  visible={open}
  onPressSubject={() => setOpen(true)}   // trigger click
  onClose={() => setOpen(false)}         // close callback
  contentPosition={{ placement: 'bottom-start', gap: 0.5 }}
  content={<Text>Panel body</Text>}
>
  <Button>Open with raw Popover</Button>
</Popover>
```

```tsx
// Concrete wrapper usage: `Dropdown` manages its own open/closed state
<Dropdown
  value={value}
  onChange={setValue}
  content={content}
  enableMobileModal={false}
  onCloseMenu={() => console.log('dropdown requested close')}
>
  <Button endIcon="caretDown">Open as menu</Button>
</Dropdown>
```

- In the first case, `visible` is passed by you (engine usage).
- In the second case, `Dropdown` owns the open/closed state internally and forwards the event to `onCloseMenu`.
- Both still rely on `Popover` under the hood for anchor/position/focus/motion.

Concretely:

- `PopoverPanel` = `Popover` + panel shell + render-prop (`content({ closePopover })`) + mobile modal option.
- `Dropdown` = `Popover` + menu sizing hooks + menu-specific content wrapper + select context.

Reference files:

- Engine: [packages/web/src/overlays/popover/Popover.tsx](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/overlays/popover/Popover.tsx).
- Concrete panel: [packages/web/src/overlays/popover/PopoverPanel.tsx](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/overlays/popover/PopoverPanel.tsx).
- Concrete menu: [packages/web/src/dropdown/Dropdown.tsx](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/dropdown/Dropdown.tsx).

### Minimal example: same trigger, two different concrete consumers

```tsx
// Concrete wrapper 1: arbitrary panel content
<PopoverPanel
  content={({ closePopover }) => (
    <VStack>
      <Text>Arbitrary floating panel body</Text>
      <Button onClick={closePopover}>Done</Button>
    </VStack>
  )}
>
  <Button>Open panel</Button>
</PopoverPanel>
```

```tsx
// Concrete wrapper 2: menu-like dropdown
const content = useMemo(
  () => options.map((option) => <SelectOption key={option} value={option} title={option} />),
  [options],
)

;<Dropdown value={value} onChange={setValue} content={content} enableMobileModal>
  <Button endIcon="caretDown">Open menu</Button>
</Dropdown>
```

Both examples still depend on the same underlying position/state machinery (`Popover`), but they expose different public contracts.

## 3) Is CDS “heavy” on overlays?

Yes in UI primitives, overlays are a reused foundation rather than duplicated logic.

Observed usage patterns in this repo:

- `Dropdown` is used directly by select-like components and navigation:
  - [packages/web/src/chips/SelectChip.tsx](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/chips/SelectChip.tsx)
  - [packages/web/src/controls/Select.tsx](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/controls/Select.tsx)
  - [packages/web/src/navigation/NavigationTitleSelect.tsx](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/navigation/NavigationTitleSelect.tsx)
  - [packages/web/src/navigation/SidebarMoreMenu.tsx](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/navigation/SidebarMoreMenu.tsx)
- `PopoverPanel` is exported as a first-class overlay and is the recommended replacement for more arbitrary floating panel cases.
- The overlay modules are also imported and exported in central registries:
  [packages/web/src/overlays/index.ts](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/overlays/index.ts).

So overlays are not a corner case; they are the pattern for menus, surfaces, and panel interactions.

## 4) Middleware in `Popover`: what it is and why it matters

`Placement` is not just one `x/y`; it is a constraint-solving step.
Floating UI calls this through **middleware**: each middleware function can adjust the popover position.

From `Popover`:

```tsx
const middleware = useMemo(() => {
  const middlewareList = [
    offset({
      crossAxis: computedSkid,
      mainAxis: getOffsetGap ?? computedGap,
    }),
  ]

  if (isAutoPlacement) {
    const alignment =
      rawPlacement === 'auto-start' ? 'start' : rawPlacement === 'auto-end' ? 'end' : undefined
    middlewareList.push(autoPlacement(alignment ? { alignment } : undefined))
  } else {
    middlewareList.push(flip())
    middlewareList.push(shift({ crossAxis: true, limiter: limitShift() }))
  }

  return middlewareList
}, [...deps])
```

Then `useFloating` consumes:

```tsx
const { refs, floatingStyles } = useFloating({
  placement: isAutoPlacement ? undefined : rawPlacement,
  strategy,
  middleware,
  whileElementsMounted: autoUpdate,
})
```

Interpretation:

- `offset` keeps a gap/offset from the trigger.
- `flip` moves to the opposite side when the preferred side has no room.
- `shift` nudges inside viewport bounds.
- `autoPlacement` chooses a side/axis automatically and can align start/end.
- `autoUpdate` recomputes on scroll/resize/layout changes.
- `floatingStyles` is applied as inline style to the overlay root.

## 5) `useResponsiveHeight` hook (height behavior, not just “xy coordinates”)

`useResponsiveHeight` is the responsive-height utility used by `Dropdown`:
`[packages/web/src/dropdown/useResponsiveHeight.ts](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/dropdown/useResponsiveHeight.ts)`.

Its job:

1. Read viewport height in state (`windowHeight`).
2. Derive desired max height:
   - if `maxHeight` is number: use that directly
   - if percent string: convert to px from current `windowHeight`
3. Compute when overlay would exceed available space (`verticalBreakpoint`) based on:
   - dropdown bounds (`dropdownBounds.top` / `.bottom`)
   - placement (`top`/`bottom`)
   - gutter + gap
4. Compute fallback responsive cap:
   - `calc(100vh - triggerEdge - gutter)`
5. On resize or visibility changes:
   - if content would overflow (`windowHeight <= verticalBreakpoint`) use responsive calc
   - else use calculated height

Code summary:

```tsx
const calculatedMaxHeight = useMemo(() => {
  if (typeof maxHeight === 'number') return maxHeight
  if (maxHeight === undefined) return 0
  return ((windowHeight ?? 0) * parseInt(maxHeight, 10)) / 100
}, [maxHeight, windowHeight])

const responsivePopoverMenuHeight = useMemo(() => {
  if (placement?.includes('bottom')) {
    return `calc(100vh - ${dropdownBounds.top}px - ${bottomGutter}px)`
  }
  if (placement?.includes('top')) {
    return `calc(100vh - ${dropdownBounds.bottom}px - ${bottomGutter}px)`
  }
}, [placement, dropdownBounds, bottomGutter])
```

This gives “menu never runs off screen” behavior while preserving configured default height when possible.

This hook is paired with `Dropdown` measurement using `react-use-measure`:

```tsx
const [dropdownRef, dropdownBounds] = useMeasure()
const [subjectRef, subjectBounds] = useMeasure()
const { dropdownHeight } = useResponsiveHeight({
  gap: combinedContentPosition.gap,
  dropdownBounds,
  maxHeight,
  visible,
  placement: combinedContentPosition.placement,
})
```

## 6) Motion centralized and reused

CDS keeps menu/dropdown motion in one shared module:

- [packages/common/src/animation/dropdown.ts](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/common/src/animation/dropdown.ts)

It exports reusable config:

- `animateDropdownOpacityInConfig`
- `animateDropdownOpacityOutConfig`
- `animateDropdownTransformInConfig`
- `animateDropdownTransformOutConfig`

Both concrete surfaces import and combine those config objects through `useMotionProps`:

- [packages/web/src/dropdown/DropdownContent.tsx](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/dropdown/DropdownContent.tsx)
- [packages/web/src/overlays/popover/PopoverPanelContent.tsx](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/overlays/popover/PopoverPanelContent.tsx)

Key trick:

- Axis is chosen from placement:
  - `left`/`right` → `x`
  - default/top/bottom → `y`
- So one shared config family animates correctly for side popups and top/bottom popups.

`useMotionProps` turns CDS motion config into Framer Motion variants using token-based conversion:

- duration token `moderate3` → token ms from [packages/common/src/motion/tokens.ts](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/common/src/motion/tokens.ts)
- easing token `global` → bezier curve map from the same token file
- conversions happen in [packages/web/src/motion/utils.ts](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/motion/utils.ts)

That is why both `DropdownContent` and `PopoverPanelContent` can feel visually consistent without duplicate transition math.

## 7) Real code map for study (fast reference)

- Base engine:
  [Popover.tsx](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/overlays/popover/Popover.tsx)
- Position props:
  [PopoverProps.ts](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/overlays/popover/PopoverProps.ts)
- Concrete panel:
  [PopoverPanel.tsx](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/overlays/popover/PopoverPanel.tsx)
- Concrete dropdown:
  [Dropdown.tsx](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/dropdown/Dropdown.tsx)
- Responsive height:
  [useResponsiveHeight.ts](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/dropdown/useResponsiveHeight.ts)
- Shared motion constants:
  [animation/dropdown.ts](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/common/src/animation/dropdown.ts)
- Motion conversion:
  [motion/utils.ts](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/motion/utils.ts)
- Docs with usage examples:
  [PopoverPanel examples](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/apps/docs/docs/components/overlay/PopoverPanel/_webExamples.mdx)
  [Dropdown examples](C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/apps/docs/docs/components/layout/Dropdown/_webExamples.mdx)

This chapter should give you a reusable mental template: separate **mechanics** (placement/state/focus/overlay) from **surface contract** (what the component exposes to callers).
