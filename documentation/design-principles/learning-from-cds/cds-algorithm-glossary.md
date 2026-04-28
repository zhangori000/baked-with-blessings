# CDS Algorithm Glossary

Date: 2026-04-28

Scope: learning note only. This file is an index of interesting CDS logic helpers. It is not meant to replace reading the source.

Primary CDS source files sampled:

- `packages/common/src/color/getBlendedColor.ts`
- `packages/common/src/color/blendColors.ts`
- `packages/common/src/color/getLuminance.ts`
- `packages/web/src/system/Interactable.tsx`
- `packages/web/src/motion/utils.ts`
- `packages/web/src/motion/useMotionProps.ts`
- `packages/common/src/motion/tokens.ts`
- `packages/web/src/visualizations/ProgressBar.tsx`
- `packages/web/src/visualizations/ProgressCircle.tsx`
- `packages/common/src/visualizations/getProgressCircleParams.tsx`
- `packages/common/src/utils/circle.ts`
- `packages/common/src/animation/tooltip.ts`

## 1. Interaction Color Blending

Purpose:

```txt
Given a base color, generate hover, pressed, and disabled colors that still feel right in light mode and dark mode.
```

Where it appears:

```txt
Interactable.tsx
  uses getBlendedColor(...)

getBlendedColor.ts
  computes the actual blended color
```

Why this exists:

If a button background is `bgPrimary`, CDS does not want every component to manually define:

```txt
primary hover blue
primary pressed blue
primary disabled blue
primary hover blue in dark mode
primary pressed blue in dark mode
...
```

Instead, `Interactable` starts from the current theme color and derives state colors.

Example input:

```ts
getBlendedColor({
  overlayColor: "rgb(0,82,255)",
  blendOpacity: 0.88,
  colorScheme: "light",
});
```

Mental model:

```txt
base color + opacity + active color scheme
  -> blended interaction color
```

What the helper does:

1. If the color is `currentColor`, `transparent`, or unparseable, return it unchanged.
2. Compute luminance, meaning perceived brightness.
3. Decide whether to blend against a light or dark underlay.
4. Adjust blend opacity if the contrast difference is large.
5. Composite the RGB channels.
6. Return a CSS color string.

The interesting part:

```txt
It is not just "if dark then use X, else use Y."
```

It considers luminance and opacity so the interaction color is generated from the actual input color.

## 2. RGB Alpha Compositing

Purpose:

```txt
Mix a semi-transparent foreground color over a background color and return the visible result.
```

Where it appears:

```txt
blendColors.ts
```

Example:

```txt
overlay:
  blue at 88% opacity

underlay:
  white

result:
  the actual blue-white mix the eye sees
```

The math idea:

```txt
result channel =
  overlay channel contribution
  + underlay channel contribution
```

For each channel:

```txt
red
green
blue
```

Why it matters:

CSS can visually blend colors in the browser, but CDS sometimes needs to compute the final color as a concrete value so it can feed that value into interaction CSS variables.

## 3. Relative Luminance

Purpose:

```txt
Estimate how bright a color feels to humans.
```

Where it appears:

```txt
getLuminance.ts
getBlendedColor.ts
```

Why it is not just average RGB:

Humans do not perceive red, green, and blue equally.

CDS uses the standard weighted idea:

```txt
green contributes most
red contributes next
blue contributes least
```

That is why luminance is closer to:

```txt
0.2126 * red + 0.7152 * green + 0.0722 * blue
```

than:

```txt
(red + green + blue) / 3
```

Why it matters:

Interaction colors need to behave differently when a color is already very bright or very dark.

## 4. Motion Token Conversion

Purpose:

```txt
Let CDS components describe motion with design tokens, then convert those tokens into Framer Motion values.
```

Where it appears:

```txt
packages/common/src/motion/tokens.ts
packages/web/src/motion/utils.ts
packages/web/src/motion/useMotionProps.ts
```

CDS motion tokens include durations:

```ts
fast1 = 100
moderate1 = 200
slow3 = 500
```

And easing curves:

```ts
enterFunctional = [0, 0, 0.15, 1]
exitFunctional = [0.6, 0, 1, 1]
global = [0.6, 0, 0.15, 1]
```

A CDS motion config might say:

```ts
{
  property: "opacity",
  duration: "fast1",
  easing: "enterFunctional",
  toValue: 1,
}
```

The converter turns that into a Framer-style shape:

```ts
{
  opacity: 1,
  transition: {
    opacity: {
      duration: 0.1,
      ease: [0, 0, 0.15, 1],
    },
  },
}
```

Two important conversions:

```txt
milliseconds -> seconds
  100 -> 0.1

named easing -> cubic-bezier array
  enterFunctional -> [0, 0, 0.15, 1]
```

Why it matters:

Designers and component authors can speak in CDS motion tokens instead of raw animation library syntax.

## 5. Progress Bar Position Math

Purpose:

```txt
Represent progress from 0 to 1 by moving a full-width bar into view.
```

Where it appears:

```txt
ProgressBar.tsx
```

Input:

```txt
progress = 0.75
```

CDS computes:

```txt
left-to-right:
  translateX = -100 + progress * 100

right-to-left:
  translateX = 100 - progress * 100
```

For left-to-right:

```txt
progress 0
  -> -100%
  -> bar is fully shifted out of view

progress 0.5
  -> -50%
  -> half visible

progress 1
  -> 0%
  -> fully visible
```

Why it matters:

The bar itself can stay `width="100%"`. Progress is shown by translating the bar, which is easy to animate.

## 6. Progress Circle Geometry

Purpose:

```txt
Draw a circular progress indicator correctly inside an SVG.
```

Where it appears:

```txt
ProgressCircle.tsx
getProgressCircleParams.tsx
utils/circle.ts
```

CDS computes circle geometry:

```ts
center = containerSize / 2
radius = containerSize / 2 - strokeWidth / 2
```

Why subtract half the stroke width?

SVG strokes are drawn centered on the circle path. If the radius used the full half-size, half of the stroke would be clipped outside the SVG box.

Example:

```txt
size = 100
strokeWidth = 4

center = 50
radius = 48
```

The progress amount is represented with stroke dash offset:

```txt
progressOffset = 1 - progress
```

With `pathLength={1}`:

```txt
progress 0
  -> offset 1
  -> no visible progress

progress 0.5
  -> offset 0.5
  -> half progress

progress 1
  -> offset 0
  -> full progress
```

Why it matters:

The component can animate progress without manually redrawing an arc.

## 7. Tooltip Placement Motion

Purpose:

```txt
Choose the direction a tooltip should animate from based on where it is placed.
```

Where it appears:

```txt
packages/common/src/animation/tooltip.ts
```

CDS maps placement to movement:

```txt
top
  -> translateY from 16 to 0

bottom
  -> translateY from -16 to 0

left
  -> translateX from 16 to 0

right
  -> translateX from -16 to 0
```

Plain English:

```txt
A tooltip enters from the side where it lives.
```

For exit animations, CDS swaps `fromValue` and `toValue`.

That means one placement map can support both:

```txt
enter
exit
```

Why it matters:

Placement-aware motion feels more physical than using the same fade/slide direction for every tooltip.

## 8. What These Helpers Have In Common

These helpers all turn design intent into repeatable logic:

```txt
interaction state
  -> color blending

motion intent
  -> animation library config

progress value
  -> visual geometry or translation

tooltip placement
  -> movement direction
```

That is the deeper pattern:

```txt
design systems do not only store values
they also encode small reusable decisions
```
