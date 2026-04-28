# Introductory CDS Design Principles

Date: 2026-04-28

Scope: learning note only. This is Chapter 1. It is not an implementation plan for this app. The goal is to understand design-system concepts by studying the local Coinbase Design System checkout at:

`C:\Users\zhang\00My Stuff\Coding\Learning\cds`

Primary CDS source files sampled:

- `packages/common/src/core/theme.ts`
- `packages/web/src/core/theme.ts`
- `packages/web/src/core/createThemeCssVars.ts`
- `packages/web/src/system/ThemeProvider.tsx`
- `packages/web/src/styles/styleProps.ts`
- `packages/web/src/themes/coinbaseTheme.ts`
- `packages/web/src/layout/Box.tsx`
- `packages/web/src/layout/VStack.tsx`
- `packages/web/src/layout/HStack.tsx`
- `packages/web/src/typography/Text.tsx`
- `packages/web/src/system/Pressable.tsx`
- `packages/web/src/system/Interactable.tsx`
- `packages/web/src/buttons/Button.tsx`
- `packages/web/src/controls/TextInput.tsx`
- `packages/common/src/tokens/button.ts`
- `packages/common/src/color/getBlendedColor.ts`

Additional CDS token files sampled for primitive/component-token examples:

- `packages/common/src/tokens/borderRadius.ts`
- `packages/common/src/tokens/sizing.ts`
- `packages/common/src/tokens/interactableHeight.ts`
- `packages/common/src/tokens/cell.ts`
- `packages/common/src/tokens/tooltip.ts`
- `packages/common/src/tokens/page.ts`
- `packages/common/src/tokens/zIndex.ts`

## 1. What a Token Is

A design token is a named design value.

Instead of repeating raw values everywhere, a design system gives those values names.

Raw CSS:

```css
color: #0f172a;
padding: 16px;
border-radius: 8px;
```

Token-minded CSS:

```css
color: var(--color-fg);
padding: var(--space-2);
border-radius: var(--borderRadius-200);
```

The second version says less about the raw value and more about the design role.

In CDS, tokens include things like:

- color names
- spacing values
- border widths
- border radii
- font sizes
- font weights
- line heights
- shadows
- control sizes

## 2. Layered Tokens

"Layered tokens" means tokens are organized from raw values to meaningful UI decisions.

It is less like paint layers visually, and more like translation layers.

### Layer 1: Primitive Tokens

Primitive tokens are raw ingredients.

They are the least opinionated layer. They name raw values, but they do not yet say what those values are for.

Color primitive examples:

```ts
blue60 = "0,82,255";
gray0 = "255,255,255";
gray100 = "10,11,13";
green60 = "9,133,81";
```

These are not yet saying how the color should be used. `blue60` might become a button background, a link color, a chart color, or nothing at all. It is just an ingredient in the palette.

In CDS, `spectrum` specifically means the color ramp system. It does not mean every primitive token.

CDS spectrum values are built from:

```txt
hue + step
```

Default CDS hues include:

```txt
blue, green, orange, yellow, gray, indigo, pink, purple, red, teal, chartreuse
```

Default CDS steps include:

```txt
0, 5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100
```

Here, `step` means a stop on a color ramp. It is not a pixel size, not a percentage, and not the same thing as a pipeline step later in this note.

Smaller steps are usually softer/lighter in the light spectrum. Larger steps are usually stronger/darker in the light spectrum. The dark spectrum can invert that relationship so the same token names still work in dark mode.

So `blue60` means:

```txt
blue hue at step 60
```

And `gray100` means:

```txt
gray hue at step 100
```

The exact value can differ between `lightSpectrum` and `darkSpectrum`. In light mode, `gray0` may be white. In dark mode, `gray0` may be near black. That is intentional: the step name stays stable, while the active theme supplies the actual color value.

Spectrum values are the color Lego blocks. Semantic color tokens build on top of them.

Primitive tokens are not only colors. A design system can also have primitive-like scales for spacing, radius, typography, shadows, and sizes.

Spacing primitive examples:

```ts
space[0] = 0;
space[0.25] = 2;
space[0.5] = 4;
space[0.75] = 6;
space[1] = 8;
space[1.5] = 12;
space[2] = 16;
space[3] = 24;
space[4] = 32;
space[5] = 40;
space[6] = 48;
space[7] = 56;
space[8] = 64;
space[9] = 72;
space[10] = 80;
```

In CDS, the space scale is based mostly on 8px increments, with a few smaller fractional steps for tighter layouts.

The point of `space[2]` is not "two pixels." It means "the spacing token named 2," which CDS maps to `16px`.

The brackets mean these values are stored in an object and accessed by key, like a dictionary.

This is normal JavaScript/TypeScript object access:

```ts
theme.space[2]; // 16
theme.space[0.5]; // 4
theme.space["0.5"]; // 4, safest way to show the actual object key
theme.borderRadius[200]; // 8
```

Yes, `0.5` can be used to reach a key in the object. In JavaScript, object keys are effectively strings under the hood, so this:

```ts
theme.space[0.5];
```

is roughly like this:

```ts
theme.space["0.5"];
```

Brackets are useful because scale keys often look like numbers or decimals. You cannot write this:

```ts
theme.space.0.5; // invalid JavaScript
```

For named tokens, dot access is easier:

```ts
theme.color.bgPrimary;
theme.fontSize.body;
```

So the rule of thumb is:

```txt
number-like token keys -> use brackets
word-like token keys -> use dots
```

Border radius primitive examples:

```ts
borderRadius[100] = 4;
borderRadius[200] = 8;
borderRadius[1000] = 100000;
```

Typography primitive examples:

```ts
fontSize.display1 = "4rem";
fontSize.title1 = "1.75rem";
fontSize.body = "1rem";
fontSize.caption = "0.8125rem";
fontWeight.display1 = "400";
fontWeight.body = "400";
fontWeight.headline = "600";
lineHeight.display1 = "4.5rem";
lineHeight.body = "1.5rem";
lineHeight.caption = "1rem";
```

In typography, names like `display1`, `title1`, `headline`, `body`, `caption`, and `legal` are roles.

`display1` means very large display text, usually for major page-level moments. `body` means normal reading text. `caption` means smaller supporting text. The token name tells the role; the theme supplies the exact font size, line height, family, transform, and weight.

### Shadow Tokens

Shadow is also a design token category, but in CDS web it is much smaller than the color spectrum.

Before looking at the tokens, define the design idea: elevation means how raised a surface appears compared with the surfaces around it.

Conceptually:

```txt
elevation 0 = flat, no shadow
elevation 1 = gently raised
elevation 2 = more raised / floating
```

In interface design, elevation is a depth cue. It can suggest that a card, menu, tooltip, modal, or dropdown is sitting above the page.

The basic CSS `box-shadow` syntax is:

```css
box-shadow: x-offset y-offset blur-radius spread-radius color;
```

You will often see four ideas:

- x-offset: moves the shadow left or right
- y-offset: moves the shadow up or down
- blur-radius: softens the shadow edge
- color: the shadow color and opacity

The spread-radius is optional. If it is omitted, it defaults to `0`.

CDS web defines two theme shadow values:

```ts
shadow.elevation1 = "0px 8px 12px rgba(0, 0, 0, 0.12)";
shadow.elevation2 = "0px 8px 24px rgba(0, 0, 0, 0.12)";
```

This:

```css
box-shadow: 0px 8px 12px rgba(0, 0, 0, 0.12);
```

means:

```txt
0px horizontal offset = shadow does not move left or right
8px vertical offset = shadow drops downward
12px blur = shadow edge is softened
rgba(..., 0.12) = black at 12% opacity
```

Because the x-offset is `0px`, the shadow is horizontally centered. Because the y-offset is `8px`, the shadow is shifted downward. That downward shift is the visual trick that makes the object feel like it is lifted above the surface.

This:

```css
box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.12);
```

has the same offset and opacity, but a larger blur, so it feels softer and more floating.

These CDS shadow primitives are used through the `elevation` style prop:

```tsx
<Box elevation={0} />
<Box elevation={1} />
<Box elevation={2} />
```

Light spoiler for the later pipeline section: `elevation={1}` is not directly writing the primitive token by hand. It is a style prop. CDS maps it to a generated CSS class, and that class uses `var(--shadow-elevation1)` plus a matching elevation background token.

Shadows can do more than raised cards. CSS shadows can also create:

- elevation, where a surface appears above another surface
- focus rings, such as `0 0 0 3px blue`
- internal dividers, using `inset`
- outlines around avatars or icons, such as `0 0 0 2px currentColor`
- glows, where the color is bright and the blur is large
- layered depth, using multiple shadows separated by commas

Example of multiple shadows:

```css
box-shadow:
  0 1px 2px rgba(0, 0, 0, 0.08),
  0 12px 32px rgba(0, 0, 0, 0.16);
```

Example of an inset shadow:

```css
box-shadow: inset 0 -1px 0 var(--color-bgLine);
```

`Inset` means the shadow is drawn inside the element instead of outside it. An inset shadow can make something look pressed inward, or it can create a clean internal divider line. In the example above, the shadow has no horizontal offset, moves `-1px` upward from the bottom edge, has no blur, and uses the line color token, so it behaves like a sharp inside border.

CDS uses theme shadow tokens mainly for elevation. It still uses other one-off `box-shadow` values for special cases like focus rings, table dividers, and avatar outlines. That means CDS is restrained here: not every possible shadow is part of the theme.

Control-size examples:

```ts
controlSize.checkboxSize = 20;
controlSize.switchHeight = 32;
```

Other CDS token files define reusable component and layout constants. These are not all global theme primitives like `space` or `color`, but they are still named design-system building blocks:

```ts
tapTarget = 40;
interactableHeight.regular = 56;
interactableHeight.compact = 40;
listHeight = 80;
compactListHeight = 40;
selectOptionHeight = 56;
tooltipMaxWidth = 260;
tooltipPaddingX = 2;
tooltipPaddingY = 1;
pageHeaderHeight = 72;
pageFooterHeight = 80;
zIndex.navigation = 2;
zIndex.modal = 3;
zIndex.tooltip = 5;
zIndex.toast = 6;
```

These are useful to notice because design systems are not only palettes. They also name repeatable layout sizes, interaction sizes, layering rules, durations, and component dimensions.

The shared idea is: primitive tokens give names to reusable ingredients.

### Layer 2: Semantic Tokens

Semantic tokens describe meaning or role.

They answer questions like:

- What color should normal text use?
- What color should muted helper text use?
- What background should the page use?
- What background should the main action use?
- What color should a success state use?
- What color should a border or divider use?

Before reading the token names, define the design words:

Background means the surface or area behind content. A page canvas, card fill, input fill, modal fill, and button fill are all backgrounds.

Foreground means the content drawn on top of a background. Text, icons, icon strokes, form-field text, and button labels are foreground. Foreground and background are a pair: a foreground color that works on a light background may fail on a dark background.

```txt
bg = what sits behind
fg = what sits in front
```

Primary means the most important action, emphasis, or brand role in a context. It often maps to a brand color, but the deeper meaning is "this is the main thing to notice or do."

Secondary usually means second in visual importance. It is still available and important, but it should not compete with primary.

Tertiary means third-level importance. It is usually quieter than secondary. Tertiary does not mean useless; it means visually lower priority.

Example hierarchy:

```txt
Primary: Place order
Secondary: Continue shopping
Tertiary: Save for later
```

Wash means a soft tint of a stronger color. A wash preserves the meaning of a color while lowering the intensity.

```txt
bgNegative = strong error background
bgNegativeWash = soft error-tinted background
```

Muted means lower emphasis, like helper text, metadata, labels, and timestamps. Muted does not mean disabled. It usually means readable but quiet.

Inverse means foreground and background are flipped. For example, a light page might use dark text, but a dark button might need light text.

Positive, negative, and warning are sentiment words:

```txt
positive = success, valid, confirmed
negative = error, failed, destructive
warning = caution, risky, needs attention
```

Line tokens usually mean borders and dividers.

Surface means a UI plane, such as a card, panel, sheet, dialog, dropdown, or raised section. CDS often expresses surfaces with `bg`, `bgAlternate`, `bgSecondary`, `bgTertiary`, `bgElevation1`, and `bgElevation2`.

Now the CDS semantic color examples are easier to read:

```ts
fg = main foreground content color
fgMuted = quieter foreground content color
fgInverse = foreground content color on an inverse/dark surface
fgPrimary = foreground color for primary emphasis
fgPositive = foreground color for success or positive meaning
fgNegative = foreground color for error or destructive meaning

bg = base background
bgAlternate = alternate background
bgPrimary = primary action or primary emphasis background
bgPrimaryWash = soft/subtle primary background
bgSecondary = secondary surface or secondary action background
bgTertiary = tertiary surface background
bgPositive = positive/success background
bgPositiveWash = soft positive background
bgNegative = negative/error background
bgNegativeWash = soft negative background
bgWarning = warning background
bgWarningWash = soft warning background

bgLine = normal border or divider color
bgLineHeavy = stronger border or divider color
bgLinePrimary = primary-colored border or divider color
```

These are more meaningful than `blue60` or `gray100`.

The important relationship is:

```txt
semantic tokens usually point to primitive tokens through a theme
```

Usually does not mean always one-to-one. A semantic token may directly use one spectrum value, or it may wrap a spectrum value in `rgb(...)`, `rgba(...)`, or an opacity decision.

So yes: Layer 2 often "uses" Layer 1.

The theme is the place where that relationship is declared.

For example, a light theme might say:

```ts
bg = gray0;
fg = gray100;
fgMuted = gray60;
bgPrimary = blue60;
bgPositive = green60;
bgNegative = red60;
```

A dark theme might say:

```ts
bg = gray0; // but from the dark spectrum, where gray0 is dark
fg = gray100; // but from the dark spectrum, where gray100 is light
fgMuted = gray60;
bgPrimary = blue70;
bgPositive = green60;
bgNegative = red60;
```

That is what "the theme decides" means.

The component still asks for `bgPrimary`. The active theme decides which primitive value `bgPrimary` points to right now.

This is the key design-system move:

```txt
component asks for role
theme maps role to primitive value
CSS receives actual value
```

The button does not need to know if primary is Coinbase blue, bakery green, or a high-contrast yellow. It asks for the role.

### Layer 3: Component Tokens or Component Defaults

Component-level decisions describe how a reusable component uses semantic tokens.

Example from CDS button variants:

```ts
primary button = {
  background: "bgPrimary",
  color: "fgInverse",
  borderColor: "bgPrimary",
}
```

The button does not say:

```ts
background: "rgb(0,82,255)"
```

It says:

```ts
background: "bgPrimary"
```

That shows layering:

```txt
raw blue value
  -> semantic primary background
  -> primary button background
```

The value is that the button does not need to understand the whole color palette. It only needs to understand its role.

## 3. The Styling Pipeline

This is not a data pipeline like analytics or ETL.

Here, "pipeline" means a repeatable path that design values follow before they become real CSS on the page.

These are process steps. They are unrelated to spectrum steps like `blue60` or `gray10`.

CDS roughly works like this:

```txt
1. Theme object
2. ThemeProvider
3. CSS variable generation
4. Style props to class names
5. Components render DOM with those classes and variables
```

### Step 1: Theme Object

The theme object stores design values.

Example shape:

```ts
const theme = {
  lightSpectrum: {
    blue60: "0,82,255",
    gray0: "255,255,255",
    gray100: "10,11,13",
  },
  darkSpectrum: {
    blue60: "55,115,245",
    gray0: "10,11,13",
    gray100: "255,255,255",
  },
  lightColor: {
    bg: "...",
    fg: "...",
    bgPrimary: "...",
  },
  darkColor: {
    bg: "...",
    fg: "...",
    bgPrimary: "...",
  },
  space: {
    1: 8,
    2: 16,
  },
  borderRadius: {
    200: 8,
  },
};
```

This is like a structured design dictionary.

Your instinct is right: this object intentionally combines different token layers.

In CDS, the theme object is not only primitive tokens and not only semantic tokens. It is the object where several design layers live together:

```txt
lightSpectrum / darkSpectrum
  primitive color ramps

lightColor / darkColor
  semantic color roles built from the active spectrum

space, borderRadius, borderWidth, fontSize, lineHeight, shadow
  mostly primitive scales used by style props and components
```

So the theme object is a container for the design system's named values. It is normal that it feels like primitive tokens and semantic tokens are side by side there.

The important detail is that `lightColor.bgPrimary` is not just another random value. In the actual CDS theme files, semantic color values are often declared by referencing spectrum values:

```ts
bgPrimary: `rgb(${lightSpectrum.blue60})`
fg: `rgb(${lightSpectrum.gray100})`
bg: `rgb(${lightSpectrum.gray0})`
```

That is the theme connecting Layer 2 back to Layer 1.

### Step 2: ThemeProvider

`ThemeProvider` is a React wrapper.

It receives:

```tsx
<ThemeProvider theme={theme} activeColorScheme="light">
  {children}
</ThemeProvider>
```

Its job is to decide which theme values are currently active.

For example:

```txt
activeColorScheme = light
  -> use lightSpectrum
  -> use lightColor

activeColorScheme = dark
  -> use darkSpectrum
  -> use darkColor
```

In the CDS code, `ThemeProvider` creates a runtime theme object with:

```txt
spectrum = lightSpectrum or darkSpectrum
color = lightColor or darkColor
activeColorScheme = "light" or "dark"
```

So yes: it takes the theme, reads `activeColorScheme`, and chooses which primitive color ramp and semantic color group are active.

It does not manually pass the theme into every component prop. Instead, it does two broader things:

1. It gives descendants access to the current theme through React context.
2. It wraps the subtree in a DOM element with generated CSS variables.

That means children can use the theme in two ways:

```txt
JavaScript path: component calls useTheme()
CSS path: component class uses var(--color-bgPrimary), var(--space-2), etc.
```

### Step 3: CSS Variable Generation

CDS has a function called `createThemeCssVars`.

It converts theme values into CSS variables by looping over the theme object.

Example:

```ts
theme.color.bgPrimary = "rgb(0,82,255)"
```

becomes:

```css
--color-bgPrimary: rgb(0,82,255);
```

And:

```ts
theme.space[2] = 16
```

becomes:

```css
--space-2: 16px;
```

Numbers become pixel values, so `16` becomes `16px`.

The benefit: normal CSS can now use theme values without rerendering React components.

### Step 4: Style Props Map Component Props to CSS Classes

This is the most confusing part at first.

In CDS, components can accept style props:

```tsx
<Box background="bgPrimary" padding={2} borderRadius={200} />
```

The component does not directly write all CSS inline.

Instead, CDS maps those props to generated class names.

Conceptually:

```tsx
background="bgPrimary"
```

maps to a class that says:

```css
background-color: var(--color-bgPrimary);
```

And:

```tsx
padding={2}
```

maps to a class that says:

```css
padding: var(--space-2);
```

This lets CDS keep a constrained design API while still using efficient CSS.

The benefit is not that props are magically more powerful than CSS variables. The benefit is that style props are a controlled front door to CSS variables and classes.

Without style props, every component author might invent a different way to write the same decision:

```tsx
<div className="p-4 rounded-lg bg-blue-600" />
<div style={{ padding: 16, borderRadius: 8, background: "#0052ff" }} />
<div className="customPanel" />
```

With style props, CDS can make everyone express the same decision in the same vocabulary:

```tsx
<Box padding={2} borderRadius={200} background="bgPrimary" />
```

That gives CDS several advantages:

- The allowed values can be typed, so invalid token names are easier to catch.
- Responsive styles can use the same prop shape across components.
- Light/dark theme changes still work because classes point to CSS variables.
- Static token styles can be class-based instead of large inline style objects.
- Dynamic one-off values can still be handled through inline CSS variables when needed.
- Components can pass style props down to lower primitives without each component rewriting CSS.

This is why `variant="primary"` on a button is easier than asking every caller to remember the exact color, padding, radius, hover, pressed, disabled, and focus styling.

### Step 5: Components Consume the Props

"Components consume props" means the React component receives props and uses them to decide what to render.

Example:

```tsx
<Button variant="primary" compact>
  Continue
</Button>
```

The `Button` component consumes:

- `variant="primary"`
- `compact`
- `children`

Then it decides:

- use primary colors
- use compact height
- use compact padding
- render the text inside
- render hover, press, focus, and disabled behavior

So the consumer writes:

```tsx
<Button variant="primary" compact />
```

The design system handles many lower-level CSS decisions.

## 4. Why This Is Worth the Complexity

The complexity pays off when a design system has many components and many teams.

Without a system:

```tsx
<button className="bg-[#0052ff] text-white rounded-[999px] px-8 h-14" />
```

Another developer might write:

```tsx
<button className="bg-blue-600 text-white rounded-full px-6 py-4" />
```

Those might look similar, but they are not the same. Over time the UI drifts.

With a system:

```tsx
<Button variant="primary" />
```

Everyone gets the same:

- background
- text color
- radius
- height
- padding
- hover behavior
- pressed behavior
- disabled behavior
- focus ring

That is the main tradeoff:

```txt
more system code
  -> fewer repeated styling decisions
  -> more consistency
  -> easier theme changes
```

## 5. CDS Core Primitives

CDS has reusable base components. These are often called primitives.

Primitive does not mean simple or low quality. It means foundational.

### Box

`Box` is the basic layout and styling wrapper.

It is like a typed, theme-aware `div`.

Example:

```tsx
<Box background="bg" padding={2} borderRadius={200}>
  Content
</Box>
```

It can handle layout props, spacing props, color props, border props, and more.

### VStack

`VStack` means vertical stack.

It is a `Box` with `flexDirection="column"` by default.

Example:

```tsx
<VStack gap={2}>
  <Text>First</Text>
  <Text>Second</Text>
</VStack>
```

Use it when children should be arranged top to bottom.

### HStack

`HStack` means horizontal stack.

It is a `Box` with `flexDirection="row"` by default.

Example:

```tsx
<HStack gap={1} alignItems="center">
  <Icon />
  <Text>Label</Text>
</HStack>
```

Use it when children should be arranged left to right.

### Text

`Text` is the typography primitive.

It lets developers use text roles and color tokens.

Example:

```tsx
<Text font="body" color="fg">
  Normal text
</Text>
```

or:

```tsx
<Text font="caption" color="fgMuted">
  Small helper text
</Text>
```

The value is consistency. Text sizing and line height come from the theme instead of being chosen manually each time.

### Pressable

`Pressable` is a lower-level interaction primitive.

It handles button-like behavior:

- click handling
- keyboard activation
- disabled behavior
- loading behavior
- pressed state
- focus behavior

This is useful because clickable things are easy to get wrong.

In CDS, `Pressable` is built on top of `Interactable`.

`Pressable` handles the behavior side:

- keyboard activation with Enter and Space
- click handling
- disabled and loading behavior
- pressed state
- focus details
- optional press scaling

Then it renders `Interactable` underneath.

### Interactable

`Interactable` is even more about interaction styling.

It calculates and applies hover, pressed, and disabled colors using the current theme.

For example, it can derive a hover background from the base background and the current light or dark color scheme.

This is why CDS buttons do not need every hover color manually hardcoded.

This is not only a pile of `if` statements, though there are normal conditionals in the code.

The rough flow is:

```txt
Interactable receives background="bgPrimary"
  -> reads the active theme with useTheme()
  -> looks up theme.color.bgPrimary
  -> computes hover / pressed / disabled colors
  -> writes those results into CSS variables
  -> CSS selectors use those variables on :hover, :active, :disabled, etc.
```

The color computation uses shared opacity tokens:

```ts
hovered opacity = 0.88
pressed opacity = 0.82
disabled opacity = 0.75
```

It also uses a helper called `getBlendedColor`. That helper looks at the active color scheme and the color's luminance, then blends the color against a light or dark underlay. In plain English: CDS tries to make interaction colors feel appropriate in both light mode and dark mode instead of hardcoding separate hover colors everywhere.

So the logic is more like:

```txt
token lookup + theme choice + color blending math + CSS state selectors
```

not just:

```txt
if dark then color A, else color B
```

### Button

`Button` is a product-ready component built on top of lower primitives.

It uses:

- `Pressable` for interaction
- `Text` for typography
- button variant tokens for colors
- spacing and radius tokens for shape

Example:

```tsx
<Button variant="primary">Continue</Button>
<Button variant="secondary">Cancel</Button>
```

The caller chooses intent. The design system chooses the detailed styling.

The actual composition chain is layered:

```txt
Button
  uses Pressable
    uses Interactable
      uses Box

Button
  also uses Text, Icon, and ProgressCircle when needed
```

The button variant token decides the semantic colors:

```ts
primary = {
  color: "fgInverse",
  background: "bgPrimary",
  borderColor: "bgPrimary",
}
```

Then `Button` passes those semantic names down to `Pressable`, which passes them into `Interactable`. `Interactable` consumes the interaction colors itself, computes state CSS variables, and forwards the remaining style props into `Box`.

That is a major CDS pattern: higher-level components express product intent, while lower-level primitives handle layout, styling, interaction, and theme mechanics.

### TextInput

`TextInput` is a form input component.

It is not just an `<input>`.

It handles:

- label
- helper text
- error/positive/neutral variants
- start content
- end content
- compact mode
- disabled state
- accessibility attributes
- focus styling

This is a common design-system pattern: form fields are treated as composed UI, not just raw browser controls.

## 6. A Small Mental Model

When reading CDS, think in layers:

```txt
ThemeVars
  define the allowed words

ThemeConfig
  gives those words actual values
  and keeps primitive layers and semantic layers in one theme object

ThemeProvider
  chooses active light/dark spectrum + color values
  and publishes CSS variables

StyleProps
  let components ask for theme values by name

Primitives
  use StyleProps to build consistent layout, text, and interaction

Components
  build product-ready UI out of primitives
```

There is also a composition ladder:

```txt
Box
  base layout and style-prop primitive

VStack / HStack
  small layout wrappers around Box

Interactable
  interaction-state styling built on Box

Pressable
  press/click/keyboard behavior built on Interactable

Button
  product-ready command component built on Pressable and Text
```

This is why CDS feels more like a system than a folder of CSS classes.

## 7. Key Takeaways

1. Tokens are named design values.
2. In CDS, `spectrum` specifically means the color ramp system.
3. A color step like `blue60` means "blue at ramp stop 60," not 60 pixels or 60 percent.
4. Bracket access like `space["0.5"]` is for object keys that look like numbers or decimals.
5. Layered tokens move from raw values to semantic roles to component decisions.
6. `bg` means background; `fg` means foreground.
7. Semantic names like `bgPrimary` are more reusable than raw names like `blue60`.
8. The theme object intentionally contains multiple layers: spectrum, semantic colors, space, radius, typography, shadow, and more.
9. `ThemeProvider` chooses the active light/dark spectrum and semantic color group, then exposes them through context and CSS variables.
10. Elevation means perceived depth; CDS exposes it through style props like `elevation={1}`, which map to shadow/background CSS variables.
11. CSS variables let theme values be used by normal CSS.
12. Style props are a constrained API for styling components.
13. Style props are useful because they make styling decisions typed, repeatable, theme-aware, and composable across primitives.
14. Primitives like `Box`, `VStack`, `HStack`, and `Text` reduce repeated layout and typography decisions.
15. Interaction primitives like `Pressable` and `Interactable` reduce repeated hover, press, focus, and disabled logic.
16. `Interactable` uses token lookup, active theme choice, opacity tokens, color blending, and CSS state selectors to produce interaction states.
17. CDS primitives use each other: for example, `Button -> Pressable -> Interactable -> Box`.
18. The complexity is mainly there to protect consistency at scale.

Next chapter: `02-intermediate-cds-logic-and-composition.md` goes deeper into real CDS source logic, including `ThemeProvider`, `createThemeCssVars`, `getStyles`, `Interactable`, `Button`, and `TextInput`.
