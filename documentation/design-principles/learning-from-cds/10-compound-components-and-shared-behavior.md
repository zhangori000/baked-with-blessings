# 10. Compound Components And Shared Behavior In CDS

Date: 2026-04-28

Scope: learning note only. This is Chapter 10. It picks up from the foundational chapters (1 through 5 and 7), continuing the slow walk through CDS concepts. Chapter 9 was an ad-hoc chapter pulled from recent PRs; this one returns to the fundamental progression.

The earlier chapters covered:

```txt
chapter 1: tokens, theme pipeline, primitives, Box/Text/Pressable composition
chapter 2: deeper theme logic, getStyles, Interactable, Button, TextInput
chapter 3: engineering patterns — polymorphism, controlled inputs, contexts
chapter 4: applying that styling system to the bakery app
chapter 5: behavior layer — AccessibilityAnnouncer, MediaQueryProvider
chapter 7: polymorphic page primitives — wrapper layer above Box/Text
```

This chapter looks at a different lesson:

```txt
some components have many pieces that need to share state
CDS solves that with a pattern called compound components
```

That matters for the bakery app because many flows involve a parent component coordinating multiple children — modals with headers, bodies, and footers, toasts that come and go, accordions that open and close, tabs that switch. The same pattern shows up over and over.

Primary CDS source files sampled in this chapter:

- `packages/web/src/overlays/modal/Modal.tsx`
- `packages/web/src/overlays/modal/ModalHeader.tsx`
- `packages/web/src/overlays/modal/ModalBody.tsx`
- `packages/web/src/overlays/modal/ModalFooter.tsx`
- `packages/common/src/overlays/ModalContext.ts`
- `packages/web/src/overlays/Toast.tsx`
- `packages/common/src/overlays/ToastProvider.tsx`
- `packages/web/src/overlays/popover/PopoverPanel.tsx`

---

## 1. What A Compound Component Is

A compound component is a single conceptual UI made of more than one component working together.

The pieces look separate in JSX, but they coordinate behind the scenes.

The smallest example you might already know is `<select>` and `<option>`:

```html
<select>
  <option value="vanilla">Vanilla</option>
  <option value="lavender">Lavender</option>
</select>
```

The `<select>` element manages the open/closed state, keyboard handling, and which option is highlighted. Each `<option>` only needs to know its own value and label. The browser does the coordination behind the scenes.

CDS does the same thing in JavaScript. A `Modal` is one conceptual component, but it is built out of pieces:

```tsx
<Modal visible={visible} onRequestClose={close}>
  <ModalHeader title="Order placed" />
  <ModalBody>You will get a confirmation email shortly.</ModalBody>
  <ModalFooter
    primaryAction={<Button onClick={close}>Done</Button>}
  />
</Modal>
```

The pieces look like siblings. The parent `Modal` is the one that knows whether the modal is visible, which element should receive focus, and what to do when you press Escape. The children read from that parent without having those values passed in as props.

A compound component is two ideas at once:

```txt
1. a parent component that holds shared state
2. one or more child components that read from that shared state
```

The link between them is React context.

---

## 2. The Prop Explosion Smell

Before reading the CDS code, it helps to see why compound components exist at all.

Imagine a hypothetical "all-in-one" Modal API:

```tsx
<Modal
  visible={visible}
  onRequestClose={close}
  title="Order placed"
  body="You will get a confirmation email shortly."
  primaryActionLabel="Done"
  onPrimaryActionClick={close}
  secondaryActionLabel="Print receipt"
  onSecondaryActionClick={print}
  hideDividers
  hideCloseButton
  headerProps={{...}}
  bodyProps={{...}}
  footerProps={{...}}
/>
```

This works for very simple cases. It falls over fast.

What if the title needs to include a small icon next to the text? You add `titleIcon`. What if some modals need a back button instead of a close button? You add `onBackButtonClick`. What if the body has two columns? You add `bodyLayout`. What if the footer has a third action? You add `tertiaryAction`.

Every new design need adds a prop. The prop list grows. Two-thirds of consumers do not need any of these extras, but they all appear in the type. Discovery becomes hard. Combinations stop making sense.

```txt
all-in-one props:
  start small
  grow forever
  combinatorial complexity
```

Compound components flip this around. Instead of one component with many props, you split the responsibility:

```txt
parent component:
  state, lifecycle, accessibility contract

child components:
  one piece of the UI each
  free to compose however you need
```

The parent stays small. The child components stay small. The consumer composes them.

---

## 3. React Context In Plain Words

Context is the React feature that lets a parent share a value with descendants without passing it as a prop at every level.

Three pieces:

```ts
// 1. create the context with a default value
const ModalContext = createContext({
  visible: false,
  onRequestClose: () => {},
});

// 2. a parent provides a value
<ModalContext.Provider value={{ visible, onRequestClose }}>
  {children}
</ModalContext.Provider>

// 3. a descendant reads the value
const { onRequestClose } = useContext(ModalContext);
```

The benefit is the third piece. The descendant does not care how deep it is in the tree. As long as some ancestor provided a value, it can read it.

A small analogy: imagine a bakery where the store-wide playlist is set by the manager in the back office. Every speaker in the building plays the same song without each speaker having to be told individually. The manager publishes; the speakers subscribe.

```txt
context = a shared room any descendant can listen into
provider = the parent that puts a value in the room
useContext = a child reaching in and reading the value
```

Context is not a global variable. It is scoped to a subtree. Two `<Modal>`s in the same app each have their own `ModalContext` value. Children read whichever provider is closest above them.

This is the mechanism that makes compound components work.

---

## 4. The CDS Modal As A Compound Component

Read these three CDS files together to see the pattern:

- `packages/common/src/overlays/ModalContext.ts`
- `packages/web/src/overlays/modal/Modal.tsx`
- `packages/web/src/overlays/modal/ModalHeader.tsx`

### 4.1 The context file

```ts
// ModalContext.ts (simplified)
export type ModalContextValue = {
  visible: boolean;
  onRequestClose: () => void;
  hideDividers?: boolean;
  hideCloseButton?: boolean;
  accessibilityLabelledBy?: string;
};

export const ModalContext = createContext<ModalContextValue>({
  visible: false,
  onRequestClose: () => {},
  hideDividers: false,
  hideCloseButton: false,
});

export const useModalContext = () => useContext(ModalContext);
```

This file owns:

- the **shape** of the shared state (`ModalContextValue`)
- the **default values** for that state when there is no provider
- a **convenience hook** so descendants do not have to import `useContext` and the context separately

That is the entire context layer. Tiny file. Lives in `common/` so both the web Modal and the mobile Modal can share it.

### 4.2 The parent (Modal)

The `Modal` component is the provider. It holds the actual state, decides whether the dialog is visible, manages focus and scroll, listens for Escape, and provides everything its children need.

Conceptually:

```tsx
export const Modal = ({ visible, onRequestClose, hideDividers, hideCloseButton, children }) => {
  const accessibilityLabelledBy = useId();

  const contextValue = useMemo(
    () => ({ visible, onRequestClose, hideDividers, hideCloseButton, accessibilityLabelledBy }),
    [visible, onRequestClose, hideDividers, hideCloseButton, accessibilityLabelledBy]
  );

  return (
    <ModalContext.Provider value={contextValue}>
      <ModalWrapper visible={visible} onOverlayPress={onRequestClose}>
        <FocusTrap>
          {children}
        </FocusTrap>
      </ModalWrapper>
    </ModalContext.Provider>
  );
};
```

`useMemo` here is important. Every time the parent re-renders, the value object would normally be a fresh `{}`, which would force every consuming child to re-render too. `useMemo` keeps the object identity stable as long as the inner values are stable.

The parent does not render the title, the body, or the footer. Those come from the children prop. The parent only renders the structural shell — the wrapper, the focus trap, and the context provider.

### 4.3 The children (ModalHeader, ModalBody, ModalFooter)

A child reads exactly what it needs from the context.

```tsx
// ModalHeader.tsx (simplified)
export const ModalHeader = ({ title, onBackButtonClick }) => {
  const { onRequestClose, accessibilityLabelledBy, hideCloseButton, hideDividers } = useModalContext();

  if (!title && !onBackButtonClick && !onRequestClose) return null;

  return (
    <HStack borderedBottom={!hideDividers}>
      {onBackButtonClick && <IconButton name="backArrow" onClick={onBackButtonClick} />}
      <Box flexGrow={1}>
        {typeof title === 'string'
          ? <Text as="h2" id={accessibilityLabelledBy}>{title}</Text>
          : title}
      </Box>
      {!hideCloseButton && <IconButton name="close" onClick={onRequestClose} />}
    </HStack>
  );
};
```

Notice what is **not** in the props:

- `onRequestClose` — pulled from context
- `hideDividers` — pulled from context
- `hideCloseButton` — pulled from context
- `accessibilityLabelledBy` — pulled from context

The parent set those values once. Every header instance reads them automatically.

A consumer using `ModalHeader` does not have to remember to pass `onRequestClose` down — it is already there. They only pass the things that are specific to *this* header: the title, optionally a back button.

### 4.4 What the consumer writes

The whole picture from the outside:

```tsx
const [visible, setVisible] = useState(false);
const close = () => setVisible(false);

<Modal visible={visible} onRequestClose={close}>
  <ModalHeader title="Order placed" />
  <ModalBody>You will get a confirmation email shortly.</ModalBody>
  <ModalFooter primaryAction={<Button onClick={close}>Done</Button>} />
</Modal>
```

The consumer never touches `useContext` or `Provider`. They just compose pieces. The wiring is internal to the design system.

---

## 5. Two Shapes Of Compound Components

Compound components in CDS come in two shapes. It helps to see them side by side.

### 5.1 Shape A: parent owns one instance (Modal, Popover, Tooltip)

```txt
<Parent>
  <Header />
  <Body />
  <Footer />
</Parent>
```

There is exactly one logical thing — one modal, one popover, one tooltip. The parent holds that thing's state. Children describe its parts.

This is the shape covered in Section 4.

### 5.2 Shape B: provider owns a queue (Toast, Notification)

A toast is different. There is not "one toast" — there is a stream of toasts that come and go. The user might trigger five toasts in a row, and each one needs to mount, animate in, sit for a few seconds, animate out, and unmount.

CDS solves this with a provider that holds the **queue**, plus a hook for triggering new entries:

```tsx
// at app root
<ToastProvider>
  <App />
</ToastProvider>

// inside any component
const { addToast } = useToast();
addToast({ text: 'Order placed', variant: 'positive' });
```

Now `addToast` is available anywhere in the tree. The provider keeps track of which toasts are currently visible. When you call `addToast`, the provider adds it to the queue and renders it. When the toast's timer expires or the user dismisses it, the provider removes it.

The shapes share a core idea but differ in what they manage:

```txt
Shape A — single instance
  parent state  = is this thing visible right now
  children      = parts of that one thing

Shape B — queue / dispatcher
  provider state = an array of active items
  hook           = imperative API to add or remove
  rendering      = provider maps over the queue
```

Both are compound components. Both rely on context. The difference is whether the parent is structural (Modal) or queue-based (Toast).

---

## 6. The Provider Stack At The App Root

Compound components imply providers. When you have several of them, those providers stack at the root of your app.

A typical CDS-using app's root looks roughly like this:

```tsx
<ThemeProvider theme={theme} activeColorScheme="light">
  <MediaQueryProvider>
    <ComponentConfigProvider config={...}>
      <PortalProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </PortalProvider>
    </ComponentConfigProvider>
  </MediaQueryProvider>
</ThemeProvider>
```

Each provider supplies one specific kind of shared knowledge:

```txt
ThemeProvider          → which theme + light/dark are active
MediaQueryProvider     → current breakpoints (isPhone, isTablet, ...)
ComponentConfigProvider → app-wide default props per component
PortalProvider         → where modal / toast / popover content gets rendered
ToastProvider          → the toast queue + addToast/removeToast API
```

Order matters. Inner providers can read from outer ones. `ToastProvider` lives inside `PortalProvider` because toasts get rendered into a portal node owned by the portal layer. `ComponentConfigProvider` lives inside `ThemeProvider` because component configs may reference theme values.

This is not unique to CDS — most React apps end up with a stack like this. CDS is just disciplined about putting one specific concern in each provider.

---

## 7. Why This Beats Configuration Props

It is worth saying out loud: compound components feel like more code at first. Why not just have a single `<Modal>` with twelve props?

Three reasons.

### 7.1 The pieces become independently extensible

When CDS wanted to let consumers customize the title font of `ModalHeader` (the recent PR #613 in Chapter 9), they only had to extend `ModalHeader`. They did not have to add a prop to `Modal`. Future Modal users who never customize the title were not affected.

```txt
extending Modal       → touches every Modal user
extending ModalHeader → touches only the headers that opt in
```

### 7.2 Composition is open-ended

If you need a custom layout for one specific modal — say the order confirmation modal needs a flower illustration above the title — you can drop into the `title` slot or replace the whole header:

```tsx
<Modal visible={visible} onRequestClose={close}>
  <BakeryFlowerSpinner />     {/* custom — no header */}
  <ModalBody>...</ModalBody>
  <ModalFooter primaryAction={<Button>Continue</Button>} />
</Modal>
```

A configuration-prop API would have to invent a `headerOverride` prop. Compound components let you simply not render `ModalHeader` and put something else there instead.

### 7.3 The data flow is local

A child component asking for `onRequestClose` from context says exactly what it needs. The parent declares what it provides. There is no chain of `<Modal onRequestClose={...} headerProps={{ onRequestClose: ...}} />` where you have to remember which level expects which prop.

```txt
parent declares:  here is what I share
child declares:   here is what I need
```

That is a small but real win for readability.

---

## 8. When Not To Use This Pattern

Compound components are not the right tool for every component. Some signs you do not need them:

- **The component has only one piece.** A `Button` is just a button. There is nothing to coordinate. Adding `<Button.Label>...</Button.Label>` would be silly.
- **The pieces would have no behavior in common.** If the title and the body would not share *any* state, you do not need context at all — just regular children.
- **The component is rendered at most once and used in just a few places.** The complexity does not pay off until reuse is high enough.

CDS is disciplined about this. Most components are not compound components. `Box`, `HStack`, `Text`, `Button`, `IconButton`, `TextInput` are all single components with regular props. The compound pattern only shows up where there are real coordination needs: modals, toasts, popovers, dropdowns, tabs, accordions.

```txt
default: regular component with regular props
upgrade to compound component when:
  multiple pieces share lifecycle or accessibility state
  consumers will compose those pieces in different ways
```

---

## 9. Bakery App Translation

Most of the bakery app's UI does not need compound components. But a few flows naturally fit.

### 9.1 Order confirmation modal

The clearest case. The bakery has at least one moment where a customer places an order and needs to see a confirmation. CDS-style:

```tsx
<Modal visible={confirmingOrder} onRequestClose={dismissConfirm}>
  <ModalHeader title="Order placed" />
  <ModalBody>
    <Text font="body">
      Thanks! We will start baking your cookies.
    </Text>
  </ModalBody>
  <ModalFooter
    primaryAction={<Button onClick={dismissConfirm}>Continue shopping</Button>}
    secondaryAction={
      <Button variant="secondary" onClick={viewReceipt}>
        View receipt
      </Button>
    }
  />
</Modal>
```

If the design wants a celebratory flower glyph above the title, swap the header:

```tsx
<Modal visible={confirmingOrder} onRequestClose={dismissConfirm}>
  <NavbarFlowerCelebration />
  <ModalBody>...</ModalBody>
  <ModalFooter ... />
</Modal>
```

### 9.2 Mobile navigation drawer

A drawer that slides in from the side is structurally a modal:

```tsx
<MobileNav visible={navOpen} onRequestClose={closeNav}>
  <MobileNavHeader title="Menu" />
  <MobileNavBody>
    <MobileNavLink href="/menu">Cookies</MobileNavLink>
    <MobileNavLink href="/seasonal">Seasonal</MobileNavLink>
    <MobileNavLink href="/about">About us</MobileNavLink>
  </MobileNavBody>
</MobileNav>
```

The body and links are siblings to the header. A `MobileNavContext` would carry `closeNav` so that each link can dismiss the drawer when clicked, without each link needing `onClose` as a prop.

### 9.3 Order flow steps

If a checkout flow has multiple steps — items, delivery, payment, review — that is a natural fit:

```tsx
<OrderFlow currentStep={step} onStepChange={setStep}>
  <OrderStep id="items">...</OrderStep>
  <OrderStep id="delivery">...</OrderStep>
  <OrderStep id="payment">...</OrderStep>
  <OrderStep id="review">...</OrderStep>
</OrderFlow>
```

`OrderFlow` provides the current step. Each `OrderStep` reads the current step from context and renders only when it matches.

### 9.4 Toast for storefront notifications

If the storefront ever needs short messages — "Added to cart," "Promo code applied," "Out of stock today" — a toast queue is the right shape:

```tsx
// at the root layout
<ToastProvider>
  <PageLayout>...</PageLayout>
</ToastProvider>

// anywhere inside
const { addToast } = useToast();
addToast({ text: 'Added 6 lavender shortbread to cart', variant: 'positive' });
```

Note that you do not need to render a `<Toast />` everywhere it is shown. The provider renders them for you, in a portal, with animation. That is a common surprise: the `<ToastProvider>` does *more* than supply context — it also owns the rendering of the queue.

---

## 10. A Light Bridge To Recent CDS PRs

Two recent PRs continue this exact pattern. Worth knowing they exist; not necessary to read in detail right now.

**PR #613 — ModalHeader text customization.** The recent PR added `font` and `fontSize` props to `ModalHeader`, plus the option to pass a full React node as `title`. That extension worked precisely because the compound shape isolates `ModalHeader` from `Modal`. Adding header customization did not touch the parent's API.

**PR #566 — PopoverPanel + Dropdown deprecation.** CDS replaced an older `Dropdown` with a more composable `PopoverPanel` + `PopoverPanelContent` pair. Same compound shape, broader: `PopoverPanel` provides the open/close state and the floating positioning, while `PopoverPanelContent` is a slot consumers fill in however they want. The deprecation is essentially: *we want users to compose, not configure.*

The deeper trend across the recent PRs:

```txt
the pieces inside a compound component keep growing more flexible
the parent's API stays small
the design system keeps absorbing more shapes without growing more props
```

That is the trajectory the bakery app's components can borrow.

---

## 11. Key Takeaways

1. A compound component is a single conceptual UI made of multiple pieces that share state.
2. The parent component holds the state. The children read from it.
3. The link between parent and child is React context.
4. Context lets a parent share a value with any descendant without prop drilling.
5. Compound components solve the "prop explosion" problem that all-in-one components grow into.
6. There are two shapes: parent-owns-instance (Modal, Popover) and provider-owns-queue (Toast, Notification).
7. CDS uses `useMemo` on context values so children do not re-render every time the parent does.
8. CDS uses a small convenience hook (`useModalContext`) so children do not have to import the context object directly.
9. Provider stacks at the app root reflect the product's shared concerns: theme, breakpoints, component config, portals, toasts.
10. Compound components are not the right tool for every component. They earn their keep when several pieces coordinate.
11. The pattern keeps a component extensible without touching the parent — adding to a child does not affect existing consumers.
12. A child component reading from context is, in plain words, saying: "I do not care which parent it is, I just need this value to be here."
13. CDS recent PRs (`#613`, `#566`) extend pieces of compound components without changing their parents — that is the pattern paying off.
14. For the bakery app, the natural compound-component fits are: order confirmation modal, mobile nav drawer, multi-step order flow, and toast notifications.

Next chapter (TBD): another foundational topic in this same slow-walk style. Candidates for Chapter 11 include — focus management and keyboard handling in CDS (`FocusTrap`, `Pressable`, `useA11yControlledVisibility`), the icon and illustration system, or the controlled vs uncontrolled input pattern.
