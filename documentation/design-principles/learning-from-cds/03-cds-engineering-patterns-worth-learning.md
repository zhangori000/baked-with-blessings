# CDS Engineering Patterns Worth Learning

Date: 2026-04-28

Scope: learning note only. This is Chapter 3 after `02-intermediate-cds-logic-and-composition.md`.

This chapter is about design-system engineering patterns in CDS, not about copying Coinbase's exact look.

Primary CDS source files sampled:

- `packages/web/src/layout/Box.tsx`
- `packages/web/src/layout/HStack.tsx`
- `packages/web/src/layout/VStack.tsx`
- `packages/web/src/typography/Text.tsx`
- `packages/web/src/system/Pressable.tsx`
- `packages/web/src/system/reakit-utils.ts`
- `packages/web/src/core/polymorphism.ts`
- `packages/web/src/controls/TextInput.tsx`
- `packages/web/src/controls/context.ts`
- `packages/web/src/styles/config.ts`

## 1. Polymorphic Components: The `as` Prop

CDS components often accept an `as` prop.

Example:

```tsx
<Box as="section" padding={4} />
<Text as="h1" font="display1" />
<Pressable as="a" href="/checkout" />
```

This means:

```txt
use the same design-system component
but render a different underlying HTML element
```

Why this matters:

```txt
visual system:
  still uses Box/Text/Pressable styling props

HTML meaning:
  can still be section, h1, a, button, span, div, etc.
```

That is useful because semantic HTML matters. A heading should be a heading. A link should be a link. A button should be a button.

CDS does not want engineers to duplicate styling logic just because the HTML tag changed.

So this:

```tsx
<Text as="h2" font="title2" color="fg">
  Account settings
</Text>
```

means:

```txt
render an h2
but keep CDS Text styling behavior
```

## 2. HStack And VStack Are Tiny Components On Purpose

`HStack` and `VStack` are almost comically small in CDS.

Simplified:

```tsx
export const HStack = ({ flexDirection = "row", ...props }) => {
  return <Box flexDirection={flexDirection} {...props} />;
};

export const VStack = ({ flexDirection = "column", ...props }) => {
  return <Box flexDirection={flexDirection} {...props} />;
};
```

That looks simple, but it teaches an important design-system habit:

```txt
name the common layout intention
instead of making every caller remember the raw CSS detail
```

Without a stack component:

```tsx
<Box display="flex" flexDirection="row" gap={2} alignItems="center" />
```

With `HStack`:

```tsx
<HStack gap={2} alignItems="center" />
```

The second version says the intent faster:

```txt
this is a horizontal stack of children
```

The pattern is not about saving many lines. It is about making layout intent obvious and repeatable.

## 3. Text Is Not Just A Styled Span

CDS `Text` renders through `Box`, but adds text-specific behavior.

Examples:

```tsx
<Text font="body" color="fg" />
<Text font="label1" color="fgMuted" />
<Text overflow="truncate" />
<Text numberOfLines={2} />
<Text tabularNumbers />
```

This teaches a useful difference:

```txt
Box
  general layout primitive

Text
  text-specific primitive built on Box
```

`Text` adds behavior that Box should not own:

```txt
default element:
  span

default display:
  inline

default color:
  fg

typography shortcut:
  font="body" sets fontFamily, fontSize, fontWeight, lineHeight

overflow modes:
  truncate, clip, wrap, break

number clamping:
  numberOfLines

number rendering:
  tabularNumbers, slashedZero
```

The lesson:

```txt
low-level primitives should stay general
higher-level primitives should encode domain-specific defaults
```

## 4. Accessibility Behavior Is Centralized

`Pressable` is not just a prettier button.

It centralizes a lot of interaction rules:

```txt
Enter key activation
Space key active state
disabled click prevention
loading behavior
focus behavior
tabIndex calculation
aria-disabled handling
native button vs non-native element differences
Safari/Firefox on Mac mouse focus handling
```

That matters because accessibility bugs often happen when every component invents its own click handling.

For example, a `<button>` and an `<a>` do not behave exactly the same:

```txt
button
  supports disabled
  is naturally keyboard interactive

a
  does not support disabled
  needs aria-disabled and tabIndex handling when pretending to be disabled

div role="button"
  needs keyboard behavior manually
```

CDS puts much of this logic in `Pressable` and helpers in `reakit-utils.ts`.

The lesson:

```txt
design systems are not only visual
they are also shared behavior systems
```

## 5. Higher-Level Components Are Built By Composition

CDS components often form a ladder:

```txt
Box
  general layout and style props

Text
  text defaults and text behavior on top of Box

Interactable
  visual interaction state on top of Box

Pressable
  keyboard/click/accessibility behavior on top of Interactable

Button
  product-level button API on top of Pressable

TextInput
  input UI, label, helper text, state, and layout primitives together
```

Why invent higher-level components?

Because callers should not need to rebuild the same behavior every time.

A caller wants:

```tsx
<Button variant="primary" compact loading>
  Continue
</Button>
```

The caller does not want to separately remember:

```txt
primary background
primary text color
pressed color
hover color
disabled color
compact height
compact padding
loading state styling
keyboard activation
aria-disabled behavior
focus behavior
```

Higher-level components are useful when they package a repeated decision.

Bad higher-level component:

```txt
wraps one div and adds no meaningful convention
```

Good higher-level component:

```txt
turns a repeated product concept into a reliable API
```

That is why `Button` is more than `Box`, and `TextInput` is more than `NativeInput`.

## 6. TextInput Shows State Sharing Inside A Component Family

`TextInput` uses local React state:

```txt
focused = true or false
```

Then it derives a focused variant:

```txt
if focused and not positive/negative:
  use primary
else:
  use the given variant
```

Simplified:

```ts
const focusedVariant =
  focused && variant !== "positive" && variant !== "negative"
    ? "primary"
    : variant;
```

Then CDS provides that value through a small context:

```tsx
<TextInputFocusVariantContext.Provider value={focused ? focusedVariant : undefined}>
  ...
</TextInputFocusVariantContext.Provider>
```

Why?

Because child pieces like icons can respond to the input's focus state without every prop being manually threaded through every nested component.

Example meaning:

```txt
TextInput is focused
  -> context says primary
  -> InputIcon can color itself like the focused input
```

This is a smaller version of the same idea as `ThemeProvider`:

```txt
parent computes useful state
parent publishes state through context
descendants consume it where needed
```

## 7. Extension Points Are Guarded

CDS allows extension, but it does not make extension invisible.

In `ThemeVarsExtended`, a consuming app can add more token names.

But there is another required step for style props:

```txt
initializeCDS(...)
  provides classnames for extended style props
```

The important lesson:

```txt
adding a token name is not enough
style props also need CSS classes that know how to consume that token
```

That matches the Chapter 2 model:

```txt
ThemeVars
  allowed word exists

theme object
  word gets actual value

baseStyles / extended class maps
  style prop knows how to turn the word into CSS
```

CDS intentionally keeps those pieces connected instead of letting every app invent one-off token behavior.

## 8. Escape Hatches Are Named Loudly

CDS includes props like:

```txt
dangerouslySetBackground
dangerouslySetColor
inputNode
```

These are not normal everyday styling APIs.

They are escape hatches:

```txt
use this when the design system cannot express the unusual case
but understand that you are stepping outside the normal guardrails
```

The word `dangerously` is doing social engineering for developers.

It tells the caller:

```txt
this may bypass normal token consistency
use it intentionally
```

That is a serious design-system practice. Sometimes teams need escape hatches, but good systems make them visible.

## 9. The Main Pattern To Learn

CDS is not impressive because every file is complicated.

Many of the files are small.

The important pattern is:

```txt
small primitives
  Box, Text, HStack, VStack

shared token vocabulary
  ThemeVars

human-authored theme values
  coinbaseTheme, dense theme, high contrast theme

central CSS publication
  ThemeProvider, ThemeManager, createThemeCssVars

style-prop translator
  getStyles, baseStyles

behavior primitives
  Interactable, Pressable

product components
  Button, TextInput, cards, menus, etc.
```

The big lesson:

```txt
a mature design system is a layered agreement
not just a folder of pretty components
```

Each layer reduces repeated decisions for the next layer.
