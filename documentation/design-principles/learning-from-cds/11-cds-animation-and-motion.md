# 11. CDS Animation And Motion

Date: 2026-04-29

Scope: learning note only. This is Chapter 11. It picks up the slow-walk style from chapters 1–5, 7, and 10. The goal is to understand how CDS handles animation as a system, not just as a list of cool effects.

The earlier chapters covered tokens, the styling pipeline, primitives, behavior providers, polymorphic page primitives, and compound components. Animation is the next foundational layer: how a design system handles motion, and what trade-offs come with it.

Primary CDS source files sampled:

- `packages/common/src/motion/tokens.ts`
- `packages/common/src/motion/utils.ts`
- `packages/common/src/motion/hint.ts`
- `packages/common/src/animation/toast.ts`
- `packages/common/src/animation/modal.ts`
- `packages/common/src/types/Motion.ts`
- `packages/web/src/motion/types.ts`
- `packages/web/src/motion/utils.ts`
- `packages/web/src/motion/useMotionProps.ts`
- `packages/web/src/motion/Pulse.tsx`
- `packages/web/src/motion/Shake.tsx`
- `packages/web/src/motion/ColorSurge.tsx`

---

## 1. What An Animation Is, In Design-System Terms

An animation is a value changing over time.

In UI work, the value is usually a CSS-friendly thing:

```txt
opacity from 0 to 1
y position from 16 to 0
scale from 0.95 to 1
background color from soft to strong
```

The "over time" part has three parameters worth naming up front:

```txt
duration  = how long the change takes
easing    = how the change is paced inside that duration
delay     = how long to wait before the change starts
```

Easing is the one that matters most for feel. A linear easing changes at the same speed all the way through. A "natural" easing starts slowly, speeds up in the middle, and settles softly at the end — which is what most real-world motion looks like.

A design system does not invent its own animations from raw CSS each time. It defines a small vocabulary of durations and easings, and then composes those into reusable motion patterns.

```txt
raw values:        duration: 250ms, easing: cubic-bezier(0,0,0.15,1)
token values:      duration: 'moderate2', easing: 'enterFunctional'
animation token:   'fadeIn' = (opacity 0 to 1 with enterFunctional)
component config:  toast enter = [fadeIn + slideUp]
```

This chapter walks through each of those layers in CDS.

---

## 2. CDS Does Not Roll Its Own Animation Engine

This is the first big lesson, and it is a relief: **CDS does not build its own animation runtime**. It uses well-known open-source libraries underneath.

Looking at the actual `package.json` dependencies:

```txt
packages/web/package.json
  framer-motion ^10.18.0

packages/mobile/package.json
  react-native-reanimated ^3.14.0
  @react-spring/native ^9.7.4
```

So:

```txt
on the web:    framer-motion does the actual animating
on mobile:     react-native-reanimated + react-spring do the actual animating
```

What CDS adds on top is **a token vocabulary, a thin adapter, and a small library of preconfigured motion patterns**.

Why this matters as a learning point: even very large design systems do not write their own physics engines or interpolation math. They pick a respected open-source library and wrap it with their own tokens and conventions. You do not need to learn animation from scratch to use a design system — you mostly learn the design system's vocabulary.

```txt
underneath:   open source (framer-motion, reanimated, react-spring)
on top:       CDS tokens, configs, and components
your job:     learn the CDS vocabulary, not the underlying math
```

A short note on the libraries:

- **framer-motion** — a popular React animation library by Framer. Animates with a `<motion.div>` component that takes props like `initial`, `animate`, `exit`, `variants`, `transition`. Open source under MIT. The package on npm is `framer-motion`. The official docs are at `motion.dev` (the project was renamed to "Motion" in late 2024 but the npm package name is unchanged).
- **react-native-reanimated** — the standard animation library for React Native. Runs animations on the native UI thread instead of the JavaScript thread, which is essential for smooth 60fps mobile animation.
- **@react-spring/native** — a spring-physics animation library. Used by CDS Mobile alongside Reanimated for spring-based effects (Stepper, etc.).

For the bakery app you only care about the web side, so this chapter focuses on framer-motion. Mobile is mentioned only to show that the same CDS tokens drive both platforms.

### 2.1 Framer-motion in a nutshell — what you actually need to know

Since the bakery app is web-only, here is the framer-motion vocabulary that everything else in this chapter assumes you know. If any of these patterns feel unfamiliar, read this section slowly. The rest of the chapter is much easier afterward.

**The `motion` element.** Framer-motion exports a special wrapper for every HTML element:

```tsx
import { motion } from 'framer-motion';

<motion.div>...</motion.div>
<motion.button>...</motion.button>
<motion.svg>...</motion.svg>
```

Anywhere you would write `<div>`, you can write `<motion.div>` and get all the normal HTML attributes plus animation props. You only swap `motion.X` in on elements that need to animate; the rest of your tree stays as plain `<div>`s.

**Three core props: `initial`, `animate`, `exit`.**

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}    // where it starts
  animate={{ opacity: 1, y: 0 }}     // where it animates to
  exit={{ opacity: 0, y: 20 }}       // where it goes when removed
>
  Hello
</motion.div>
```

Read it like a recipe: *start here → animate to here → on removal, go here*. `y: 20` means "translated 20 pixels down from natural position." So this snippet starts 20px below where it should be, fully transparent, and animates into place fully visible. The `exit` prop only runs when the element is wrapped in `<AnimatePresence>` (covered below).

**The `transition` prop controls *how*.** Duration and easing live here:

```tsx
<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
/>
```

Duration is in **seconds**, not milliseconds. `0.3` means 300ms.

There are two main types of transitions:

```txt
tween      → time-based animation with an easing curve
             { duration: 0.3, ease: 'easeOut' }

spring     → physics-based motion that feels organic
             { type: 'spring', stiffness: 300, damping: 20 }
```

CDS uses tweens for most things and reserves springs for moments where physics-feel matters (a card snapping into place, a stepper bouncing).

**Built-in easing names.** When you do not want to spell out a cubic-bezier, framer-motion accepts string shortcuts:

```txt
'linear'      constant speed
'easeIn'      slow start, fast finish
'easeOut'     fast start, slow finish     ← good for "appear" animations
'easeInOut'   slow start, fast middle, slow finish
'circIn', 'circOut', 'circInOut'
'backIn', 'backOut'    overshoots slightly (good for playful pops)
[0.6, 0, 0.15, 1]      a custom cubic-bezier curve, four numbers
```

CDS does not use the string names — it uses cubic-bezier arrays directly via its named curve tokens (`enterFunctional`, etc.). Both are valid. The CDS approach is more controlled because the design team picked specific curves for specific intents.

**Variants — named animation states.** For reuse, you can predeclare states by name instead of writing the values inline every time:

```tsx
const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover:   { scale: 1.05 },
};

<motion.div
  variants={cardVariants}
  initial="hidden"
  animate="visible"
  whileHover="hover"
/>
```

Variants travel from a parent down to children automatically — set `animate="visible"` on a parent and every child reading the same variant name will animate at the same time. CDS uses this exact pattern for its `enter` and `exit` variants on toasts, modals, and popovers.

**Gesture props — `whileHover`, `whileTap`, `whileFocus`, `whileInView`.** Each one auto-animates while a condition is true and reverts when it stops:

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.15 }}
>
  Add to cart
</motion.button>
```

No `useState`, no event handlers. Hover scales up, tap scales down, leaving reverts. This will be the highest-leverage pattern for the bakery storefront — menu cards, buttons, links.

**`AnimatePresence` — animating removal.** Without help, React unmounts a component instantly and there is no chance to play an exit animation. `AnimatePresence` keeps the element mounted just long enough for `exit` to play:

```tsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence>
  {showModal && (
    <motion.div
      key="modal"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      Modal content
    </motion.div>
  )}
</AnimatePresence>
```

Three rules: wrap the conditional in `<AnimatePresence>`, give each child a stable `key`, use a `motion` element with an `exit` prop. This is what makes CDS toasts fade *out* on dismiss instead of vanishing.

**Layout animations.** Animating layout properties (`width`, `height`, `top`) is bad for performance — it forces the browser to re-layout every frame. Framer-motion's `layout` prop dodges this by detecting size/position changes and animating with `transform` only, even though to your eyes it looks like the box is growing:

```tsx
<motion.div layout>
  {expanded ? <BigContent /> : <SmallContent />}
</motion.div>
```

For the bakery app this matters mainly for things like an expanding product card, a reorderable menu list, or a filter that adds/removes items from a grid.

**Imperative controls — `useAnimation`.** Most animation is declarative (props describe state), but sometimes you need to chain animations imperatively:

```tsx
const controls = useAnimation();

useEffect(() => {
  async function play() {
    await controls.start({ opacity: 1 });
    await controls.start({ scale: 1.1 });
    await controls.start({ scale: 1 });
  }
  play();
}, []);

<motion.div animate={controls}>...</motion.div>
```

Chapter 9 §3 covers why this style is fragile under React 19's StrictMode. Prefer declarative `animate={state}` whenever possible. Use `useAnimation` only when you genuinely need to chain multiple steps.

### 2.2 Next.js App Router note

The bakery app uses Next.js with the App Router. Anything importing from `framer-motion` must be a client component because framer-motion uses browser APIs like `requestAnimationFrame`:

```tsx
'use client';

import { motion } from 'framer-motion';

export function HeroFadeIn({ children }) {
  return (
    <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {children}
    </motion.h1>
  );
}
```

A common mistake is to put `'use client'` at the top of a whole page. Don't. Extract the animated bit into its own small client component and let the rest of the page stay server-rendered. Server components can render client components as children with no problem.

### 2.3 The shortest path to fluency

If this all feels like a lot, the shortest learning path is:

```txt
1. swap one <div> to <motion.div>
2. add `whileHover={{ scale: 1.05 }}` and `transition={{ duration: 0.15 }}`
3. notice it works on hover with no extra code
4. then add `initial` and `animate` for a mount fade-in
5. then wrap a conditional in <AnimatePresence> for an exit
```

After those five steps you have used 70% of what most apps need.

---

## 3. The Motion Token Layer

In `packages/common/src/motion/tokens.ts` CDS defines two named scales: durations and easings.

### 3.1 Duration tokens

```ts
export const durations = {
  quick: 33,
  fast1: 100,
  fast2: 133,
  fast3: 150,
  moderate1: 200,
  moderate2: 250,
  moderate3: 300,
  slow1: 350,
  slow2: 400,
  slow3: 500,
  slow4: 1000,
} as const;
```

The numbers are in milliseconds. The names group by feel:

```txt
quick       → near-instant feedback
fast1-3     → buttons, toggles, small icons
moderate1-3 → modals, drawers, system messages
slow1-4     → page transitions, full-screen dialogues
```

The token file even has comments saying "Buttons, Toggles, Text, Icons, Selection Controls" next to `fast1-3`. So the duration token name is not just a number — it carries usage guidance.

This is the same idea as the `space` token scale from chapter 1. Instead of writing `200ms` in three different files, components write `duration: 'moderate1'` everywhere. If the design team later decides modal animations should be 220ms instead, one token change updates the whole app.

### 3.2 Easing tokens

CDS defines five easing curves plus a linear one:

```ts
export const curves = {
  global:           [0.6, 0, 0.15, 1],
  enterExpressive:  [0.33, 0, 0, 1],
  enterFunctional:  [0, 0, 0.15, 1],
  exitExpressive:   [1, 0, 0.67, 1],
  exitFunctional:   [0.6, 0, 1, 1],
  linear:           [0, 0, 1, 1],
};
```

Each is a cubic-bezier curve — four numbers that define an easing path between 0 and 1. You do not have to memorize what those numbers do. You only have to know what each curve is **for**:

```txt
enterFunctional  → things appearing (fade in, slide in)
exitFunctional   → things leaving (fade out, slide out)
enterExpressive  → things appearing with extra character (overshoot, settle)
exitExpressive   → things leaving with extra character
global           → general-purpose default
linear           → constant speed (rare; used for chained timings, progress bars)
```

The "functional" curves are the safe defaults. The "expressive" curves are for moments where the motion itself is part of the experience — a celebratory bloom, a modal arriving with a little flourish.

```txt
small things:        functional curves (subtle, fast, get out of the way)
moments worth notice: expressive curves (a little personality)
```

For the bakery app, this distinction matters more than it looks. The cookie sheep rig settling into place after a scenery change is an expressive moment. A button changing color on hover is a functional moment. They want different easings.

### 3.3 A concrete example: the rotating-cookie-flavor jump

This is worth working through with real numbers because it makes "easing" go from abstract to obvious.

Imagine the bakery has a small UI element: a circular badge that shows the *featured flavor of the day*, and every few seconds it rotates to the next flavor with a little jump animation:

```txt
Lavender → Mocha → Cardamom → Honey → Lavender → ...
```

The label fades out, the circle "jumps" up a few pixels and lands back down, and a new label fades in. The whole thing takes about 400ms.

You write the same animation four times, each time with a different easing. The numbers — duration, distance, opacity values — are identical. Only the easing changes. Watch how the **feel** changes.

#### Version A — `linear` easing

```tsx
<motion.div
  animate={{ y: [0, -16, 0] }}
  transition={{ duration: 0.4, ease: [0, 0, 1, 1] }}    // linear
/>
```

The badge moves at a constant speed up and back down. Constant speed is what mechanical things do — a sewing machine needle, a clock pendulum. The cookie badge looks robotic. The eye does not believe a real cookie would jump like this. **No good for this use case.**

#### Version B — `enterFunctional` easing

```tsx
<motion.div
  animate={{ y: [0, -16, 0] }}
  transition={{ duration: 0.4, ease: [0, 0, 0.15, 1] }}   // enterFunctional
/>
```

The badge moves slowly at first and decelerates as it lands — like an object catching up to a target and easing into place. This is the "safe" curve. It looks polished, but it does not feel particularly playful. It is what you would use on a modal sliding into view.

For a cookie *jump*, this is okay. Not joyful. **Functional.**

#### Version C — `enterExpressive` easing

```tsx
<motion.div
  animate={{ y: [0, -16, 0] }}
  transition={{ duration: 0.4, ease: [0.33, 0, 0, 1] }}   // enterExpressive
/>
```

The expressive curve has a more aggressive acceleration and a longer settle. The badge launches up quickly, then *lingers* at the apex for a fraction of a second before coming back down. That linger is what reads as "personality."

This feels cookie-shaped. There is a hint of weight, a sense of release. It is the same 400ms duration, the same 16px height. Only the curve numbers changed.

#### Version D — a spring instead of a tween

```tsx
<motion.div
  animate={{ y: [0, -16, 0] }}
  transition={{ type: 'spring', stiffness: 500, damping: 12 }}
/>
```

A spring transition does not use cubic-bezier numbers at all. It models physical springiness — stiffness, damping, mass. With low damping (12), the cookie *bounces* a little before settling. With high damping (30+), it would land cleanly with no bounce.

Springs are great for jumps and pops because real jumping things have inertia. The exact "feel" depends on stiffness and damping, which you tune by eye until it feels right.

#### What the cubic-bezier numbers mean, concretely

Each bezier curve is `[x1, y1, x2, y2]` — two control points that bend the line from `(0,0)` to `(1,1)`:

```txt
[0, 0, 1, 1]       linear         straight line, constant speed
[0, 0, 0.15, 1]    enterFunctional pulled toward late finish, decelerates softly
[0.33, 0, 0, 1]    enterExpressive sharp launch, long settle
[0.6, 0, 0.15, 1]  global         balanced ease in + ease out
[0.6, 0, 1, 1]     exitFunctional fast finish, used when leaving
```

You do not have to memorize this. The two practical rules are:

```txt
control point 2 (x2, y2) close to (0, 1)   → strong deceleration at the end (lands softly)
control point 1 (x1, y1) higher than the line → starts slow, then accelerates
```

If you want to design a curve by feel, paste the four numbers into `https://cubic-bezier.com` and drag the handles. It is the easiest way to *see* what the numbers mean.

#### The takeaway

For the rotating cookie flavor jump, the practical recommendation:

```txt
small subtle jump (4–8px) → enterFunctional, duration moderate1 (200ms)
expressive jump (12–20px) → enterExpressive, duration moderate2-3 (250–300ms)
playful bounce            → spring, stiffness 400–600, damping 10–14
```

The big lesson is that **the same duration and distance can feel completely different depending on the easing curve**. Easing is the personality of an animation. The CDS named curves give you a small palette of personalities — pick the one that fits the moment instead of inventing a new bezier each time.

For the bakery, an `enterExpressive` curve fits the cookie-flavor rotator. A spring with light damping fits the navbar flower bloom. Buttons stay on `enterFunctional` (or a string shortcut like `'easeOut'`) because they should be polite and quick.

---

## 4. Animation Tokens (Effects)

This section is the one that looks cryptic at first. Walk through it slowly.

### 4.1 What problem this layer solves

Imagine you are writing a Toast component and you want it to fade in. In raw framer-motion you would write something like:

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3, ease: [0, 0, 0.15, 1] }}
/>
```

That is fine for one component. But if you also need a Modal, a Drawer, a Tooltip, an Accordion, and a Carousel — all of which need to fade in — you would copy-paste those same four numbers everywhere:

```tsx
opacity 0 → 1, duration 0.3, ease [0, 0, 0.15, 1]
opacity 0 → 1, duration 0.3, ease [0, 0, 0.15, 1]
opacity 0 → 1, duration 0.3, ease [0, 0, 0.15, 1]
opacity 0 → 1, duration 0.3, ease [0, 0, 0.15, 1]
...
```

That is the smell. Every developer is making the same animation decisions independently, and over time they drift — one toast fades over 250ms, one modal fades over 350ms, one drawer uses a slightly different curve. The UI feels inconsistent without anyone being able to point at a single bug.

The fix is the same trick CDS used for colors: **give the recurring decision a name**, then everyone uses the name.

### 4.2 What `generateAnimToken(...)` actually does

`generateAnimToken` is a small helper. It takes three arguments and packages them into one config object:

```ts
generateAnimToken(property, value, easingName)
```

- `property` — what is being animated (`opacity`, `y`, `scale`, `x`, `rotate`)
- `value` — either a single end value, or an array `[from, to]`
- `easingName` — the name of one of the CDS curves from §3.2 (`'enterFunctional'`, etc.)

So this:

```ts
generateAnimToken('opacity', [0, 1], 'enterFunctional')
```

…is the helper packaging up the same idea you would write by hand:

```ts
{
  property: 'opacity',
  fromValue: 0,
  toValue: 1,
  easing: 'enterFunctional',
}
```

The result is a tiny config object. It is **not** running an animation. It is a description of one. Components later read this object and turn it into framer-motion props.

### 4.3 Walking through the `animations` object piece by piece

Here is the first chunk of the `animations` object with a translation next to each line:

```ts
export const animations = {
  fadeIn:    generateAnimToken('opacity', [0, 1], 'enterFunctional'),
  // ↑ opacity goes from 0 to 1 with the enterFunctional curve

  fadeOut:   generateAnimToken('opacity', [1, 0], 'global'),
  // ↑ opacity goes from 1 to 0 with the global curve

  slideUp:   generateAnimToken('y', '-100%', 'enterFunctional'),
  // ↑ y position moves to -100% (a full element-height upward)

  slideUp16: generateAnimToken('y', -16, 'enterFunctional'),
  // ↑ y position moves to -16 pixels (a small upward nudge)

  slideDown16: generateAnimToken('y', 16, 'global'),
  // ↑ y position moves to +16 pixels (a small downward nudge)

  scaleUpXXS: generateAnimToken('scale', [0.98, 1], 'enterFunctional'),
  // ↑ scale grows from 0.98 to 1 (an almost imperceptible pop)

  scaleUpS:   generateAnimToken('scale', [0.9, 1], 'enterFunctional'),
  // ↑ scale grows from 0.9 to 1 (clearly visible pop)
};
```

Each line is the same template:

```txt
TOKEN_NAME: generateAnimToken( WHAT, FROM/TO VALUE, EASING_NAME )
```

The token name on the left is what the rest of the codebase will refer to. The right side is the recipe.

### 4.4 Why two-element arrays vs. single values

Some entries pass `[0, 1]`, others pass `'-100%'` or `-16`. The difference:

```txt
[from, to]   — both endpoints specified
              fadeIn    = [0, 1]    (start at 0, animate to 1)
              scaleUpS  = [0.9, 1]  (start at 0.9, animate to 1)

single value — only the end value specified
              slideUp16 = -16       (animate to y: -16)
              slideUp   = '-100%'   (animate to y: -100%)
```

Why the difference? When the *starting* value matters — like fading in (must start at opacity 0) or scaling up (must start at 0.9) — both endpoints get specified. When you are just nudging an element to a relative position, the start value can be inferred from the element's natural placement.

This is a small detail you do not have to memorize. Read tokens left to right; if there are two values, that is the from/to pair.

### 4.5 Why the suffix system is useful

```txt
fadeIn          opacity 0 → 1                       (full fade)
fadeIn10        opacity 0 → 0.1                     (very subtle, 10% visible)
fadeIn20        opacity 0 → 0.2                     (subtle, 20% visible)
fadeIn30        opacity 0 → 0.3                     (gentle, 30% visible)

slideUp         y: -100% (a full element height)
slideUp8        y: -8px   (tiny nudge)
slideUp16       y: -16px  (small nudge)
slideUp24       y: -24px  (clearly visible nudge)
slideUp40       y: -40px  (large nudge)

scaleUpXXS      scale 0.98 → 1   (barely a pop)
scaleUpXS       scale 0.95 → 1   (subtle pop)
scaleUpS        scale 0.9  → 1   (clear pop)
```

You read the suffix and immediately know the *intensity*:

```txt
suffix is a number → pixel distance
suffix is XXS/XS/S → intensity scale
no suffix          → "full" version (100% slide, full fade)
```

The fade-in variants with `10`/`20`/`30` are for partial fades — useful when something should appear *softly* without becoming fully opaque. A wash of color over a card, a hint glow, a subtle highlight. They give you a way to say "fade in to 30% opacity" without having to remember the curve and duration.

### 4.6 How a component actually uses this

Once the `animations` object exists, a component's per-component config (the `animation/toast.ts` file from §5 below) just *references* the named tokens or builds new configs that reuse the same easing/duration tokens:

```ts
// loosely like the real toast config
const toastEnter = [
  { ...animations.fadeIn,     duration: 'moderate3' },
  { ...animations.slideUp24,  duration: 'moderate3' },
];
```

Read that as: "the toast enter animation is a fade-in plus a 24-pixel slide-up, both running for moderate3 (300ms)." The toast component never picks an easing or types out an opacity range. It composes from the shared vocabulary.

### 4.7 The mental model in one block

```txt
generateAnimToken(...)   = a small recipe builder

animations = {
  fadeIn:    recipe for "make this fade in"
  slideUp16: recipe for "nudge this 16px up"
  scaleUpS:  recipe for "pop this in at 90% size"
  ...
}

components reference recipes by name instead of copy-pasting four numbers.
```

The pattern is identical to semantic color tokens from chapter 1. Instead of writing `rgb(0, 82, 255)` on every primary button, you wrote `bgPrimary` and let the theme decide the actual color. Here, instead of writing `{ opacity: [0, 1], duration: 0.3, ease: [0, 0, 0.15, 1] }` on every fade-in, you write `fadeIn` and let the design system's tokens decide the actual values.

```txt
colors:    raw rgb → semantic role (bgPrimary)
motion:    raw bezier + ms → semantic role (fadeIn)

same idea. different layer of the design system.
```

Once that click happens, the `animations` object stops looking cryptic and starts looking like a **menu of named, reusable motion intents**.

These animation tokens are the building blocks for the next layer (per-component configs in §5).

---

## 5. Per-Component Motion Configs

Look at `packages/common/src/animation/`:

```txt
animation/
  accordion.ts
  carousel.ts
  collapsible.ts
  drawer.ts
  dropdown.ts
  modal.ts
  toast.ts
  tooltip.ts
  tabs.ts
  ...
```

Each file is a small set of motion configs for one component. Toast, for example:

```ts
// packages/common/src/animation/toast.ts
export const animateInOpacityConfig = {
  property: 'opacity',
  easing:   'enterFunctional',
  duration: 'moderate3',
  toValue:   1,
  fromValue: 0,
};

export const animateInBottomConfig = {
  property: 'y',
  easing:   'enterFunctional',
  duration: 'moderate3',
  toValue:   0,
  fromValue: 25,   // start 25px below where it should end up
};

export const animateOutOpacityConfig = { /* ... */ };
export const animateOutBottomConfig  = { /* ... */ };
```

The toast enter is two animations playing together:

```txt
opacity: 0 → 1   (enterFunctional, moderate3 = 300ms)
y:       25 → 0 (enterFunctional, moderate3 = 300ms)
```

So when a toast appears, it fades in and slides up at the same time. When it dismisses, the opposite. Both halves use the same duration so they stay in sync.

This is the layer where "what a toast looks like as it animates" lives. It is not in the Toast component file. It is not in the framer-motion library. It is in `common/animation/toast.ts`, expressed in CDS tokens.

```txt
the layering of the motion system:

  curves + durations  → primitive scales
  fadeIn / slideUp    → reusable effects
  toast enter/exit    → a specific component's choreography
  framer-motion       → the engine that actually plays them
```

Same shape as colors:

```txt
spectrum            → primitive scales
bgPrimary / fg      → semantic roles
button variant      → component-level choices
CSS variables       → the engine that displays them
```

If chapter 1's color layering made sense, the motion layering should feel familiar.

---

## 6. The `useMotionProps` Adapter

The piece that turns CDS tokens into framer-motion props is `useMotionProps`. This is the smallest interesting file in the motion system:

```ts
// useMotionProps.ts (simplified)
export const getMotionProps = ({
  enterConfigs,
  exitConfigs,
  initial = 'exit',
  animate = 'enter',
  transition,
  ...rest
}) => {
  return {
    variants: getVariants(enterConfigs, exitConfigs),
    initial,
    animate,
    transition: transition && convertTransition(transition),
    ...rest,
  };
};

export const useMotionProps = (props) => {
  return useMemo(() => getMotionProps(props), [props]);
};
```

Two things to notice.

First, the **input** is CDS-shaped:

```ts
useMotionProps({
  enterConfigs: [animateInOpacityConfig, animateInBottomConfig],
  exitConfigs:  [animateOutOpacityConfig, animateOutBottomConfig],
  animate: 'enter',
});
```

Second, the **output** is framer-motion-shaped:

```ts
{
  variants: { enter: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 25 } },
  initial: 'exit',
  animate: 'enter',
  transition: { ease: [0, 0, 0.15, 1], duration: 0.3 },
}
```

The adapter is the **only** place CDS tokens meet framer-motion's exact API. Every CDS component uses `useMotionProps` instead of importing framer-motion directly. That means if framer-motion ever changes its prop names, only this one adapter has to change.

```txt
adapter pattern in plain words:
  many components speak token-language inwardly
  one small file translates to framer-motion language
  the rest of the codebase never touches framer-motion directly
```

This is the same insulation strategy the styling pipeline uses for theme values. The adapter is the seam.

---

## 7. Reusable Motion Primitives

CDS also ships a small library of **motion primitives** in `packages/web/src/motion/`. These are full React components that wrap a specific motion behavior:

- **`Pulse`** — wraps children with an opacity pulse that loops. Useful for "this is loading" or "look here" hints.
- **`Shake`** — wraps children with a brief horizontal shake. Useful for invalid form fields, "no" feedback.
- **`ColorSurge`** — wraps a colored panel that surges in and fades back out. Useful for celebratory taps.
- **`AnimatedCaret`** — a chevron that smoothly rotates between up and down. Useful for accordion triggers.

Each one reads from the same shared motion configs in `common/motion/hint.ts`, so a `Pulse` in one place looks the same as a `Pulse` in another.

The pattern is the same as the layout primitives from earlier chapters:

```txt
Box / HStack / VStack  →  layout primitives
Pulse / Shake / Surge  →  motion primitives
```

Both are reusable building blocks. Both have a small public API. Both hide the actual styling decisions inside the design system.

A consumer using `Pulse` writes this:

```tsx
<Pulse variant="moderate">
  <Icon name="info" />
</Pulse>
```

They do not pick easing curves, durations, opacity values, or write a `useEffect`. The motion primitive owns those decisions.

There is also a small but telling JSDoc comment at the top of every motion primitive in CDS:

```txt
Please consult with the motion team in #ask-motion before using this component.
```

That is not paperwork. It signals that motion at Coinbase is a deliberate design discipline, not a "drop a fade-in wherever you want" free-for-all. Motion choices are part of the brand.

---

## 8. Performance Concerns

This is the part you asked about specifically. CDS does several things in the motion layer that are about performance, not just aesthetics. Walk through them slowly.

### 8.1 Use the lazy `m` import, not the full `motion`

Every motion file in CDS does this:

```ts
import { m as motion } from 'framer-motion';
```

Not this:

```ts
import { motion } from 'framer-motion';   // ← bigger bundle
```

Framer-motion exports two flavors:

```txt
motion  → full feature set, ~50 KB
m       → lazy version, ~5 KB; features must be opted in
```

CDS uses the lighter `m` everywhere and pays for features only where needed. For a typical app this is a meaningful bundle-size win. The same trick applies if you ever ship animations to the bakery storefront — `m` should be your default.

### 8.2 Animate transform/opacity, not layout-affecting properties

Look at the CDS animation tokens again:

```txt
opacity, scale, x, y, rotate
```

Those are all properties the browser can animate on the **GPU compositor**. The page does not have to re-layout when they change.

The opposite category is dangerous:

```txt
width, height, top, left, margin, padding, font-size
```

Animating those forces the browser to recalculate layout every frame, which gets expensive fast and visually janky on slower devices.

CDS animation tokens stay almost exclusively in the GPU-friendly category. That is not a coincidence — it is the discipline that makes their motion smooth on low-end devices.

```txt
GPU-friendly:   opacity, transform (x, y, scale, rotate)
GPU-expensive:  width, height, top, left, padding, margin, font-size

design rule:    prefer transforms; avoid animating layout properties
```

For the bakery app: if you ever animate the navbar flower, animate `scale`, `rotate`, and `opacity`. Not `width` and `padding`.

### 8.3 Skip animations during tests and Storybook

In `packages/web/src/motion/utils.ts`:

```ts
const skipAnimation = isStorybook() || isTest();

return {
  ...rest,
  ease: convertedEasing,
  duration: skipAnimation ? 0 : convertedDuration,
  delay:    skipAnimation ? 0 : delay && delay / 1000,
};
```

When the same component renders inside a Vitest test or a Storybook story, durations and delays are forced to zero. Animations resolve instantly.

Why? Two reasons:

```txt
1. tests do not have to wait 300ms for a toast to finish animating
2. visual regression screenshots capture the final state, not a frame mid-animation
```

This is small but extremely worth copying. If your bakery app gets visual-regression tests later, force any animation duration to zero in the test environment so screenshots are deterministic.

### 8.4 `useMemo` on motion props

```ts
export const useMotionProps = (props) => {
  return useMemo(() => getMotionProps(props), [props]);
};
```

The reason: the result of `getMotionProps` is an object with nested properties (`variants`, `transition`). If a component re-renders and you create a fresh object each time, framer-motion sees "new props, restart the animation." The `useMemo` keeps the props stable so the animation only restarts when the inputs actually change.

CDS even leaves a comment in the source recommending the function form (`getMotionProps`) over the hook form when the inputs are static, because then there is no need to memoize at all — you precompute the props once at module load.

```txt
inputs change every render?     → useMotionProps (the hook)
inputs are static at definition? → getMotionProps (the function)
```

### 8.5 `memo` on motion components

Every motion primitive (`Pulse`, `Shake`, `ColorSurge`) is wrapped with `memo()`:

```tsx
export const Pulse = memo(forwardRef(function Pulse(...) {
  // ...
}));
```

Reason: motion primitives often live inside components that re-render frequently (form fields, list items). If the children prop is stable, `memo` lets the motion primitive skip re-rendering when its parent updates for unrelated reasons. That keeps animation playback smooth.

### 8.6 Hardware acceleration on mobile

`react-native-reanimated` and `@react-spring/native` both run animations on the **native UI thread**, not the JavaScript thread. Even if the JS thread is busy parsing a big response or doing layout work, animations stay smooth. CDS uses these two libraries on mobile precisely because of that property.

You do not get this benefit automatically on the web — the browser already runs CSS transitions on the compositor for transform/opacity, but JavaScript-driven animations still go through the main thread. The web equivalent is "stick to GPU-friendly properties," which is §8.2.

### 8.7 The performance summary

```txt
bundle:         use framer-motion's `m` not the full `motion`
properties:     animate opacity + transform; avoid layout properties
tests:          force duration to zero in test/storybook environments
re-renders:     useMemo on motion props; memo() on motion components
inputs static:  use getMotionProps (function), not useMotionProps (hook)
mobile:         libraries that run on the native UI thread (Reanimated)
```

None of these are exotic. Each is a five-line discipline. Together they are the difference between snappy animations and the sluggish kind you mute in your phone settings.

---

## 9. Reduced Motion And Accessibility

Some users have "Reduce motion" turned on in their operating system. They have a real reason to: vestibular conditions, motion sickness, or a preference for less distraction. Animations that ignore that setting are an accessibility failure.

The browser exposes this preference as a CSS media query and a JavaScript property:

```css
@media (prefers-reduced-motion: reduce) {
  /* animations should be minimized or skipped */
}
```

```ts
window.matchMedia('(prefers-reduced-motion: reduce)').matches; // true if the user opted out
```

framer-motion has a `useReducedMotion` hook for this. Some CDS components consult it; the design system's broader posture is "favor short, functional motions and avoid large transforms when possible." The combination — small motions by default, larger motions opt-out via OS — is a reasonable starting point.

For the bakery app, the rule of thumb:

```txt
small (< 200ms, transform or opacity): leave on
large (full-screen slides, big scale moves): respect prefers-reduced-motion
```

If you only ever do small fades and a 16-pixel slide, you probably do not need to do anything special. If you ever build the celebratory flower bloom, gate the larger motions behind `useReducedMotion`.

---

## 10. The Warning Culture

Two small but informative details from the CDS source:

```ts
/**
 * Please consult with the motion team in #ask-motion before using this component.
 */
export const Pulse = memo(...);
```

Every motion primitive has that JSDoc. Why?

Because motion is brand. A pulsing button at the wrong moment, a shake animation that triggers too often, a celebratory color surge in an error state — these are easy to do wrong, and the result is a UI that feels off without anyone being able to articulate why. CDS treats motion as a deliberate design discipline, not a sprinkle-on effect.

Even without a "motion team," you can apply the same posture in the bakery app:

```txt
ask before adding:
  "is this motion serving a clear purpose, or is it decoration for its own sake?"
  "what is it telling the user that the page does not already?"
  "does it interrupt or support the task they are trying to do?"
```

If those answers are not crisp, the motion probably should not be added.

---

## 11. Bakery App Translation

Most of this maps cleanly onto the bakery storefront once it has more interactivity. Not all of it has to land at once.

### 11.1 Borrow the token shape, not the framework

Even before installing framer-motion, the bakery app can have a small `motion-tokens.ts` file:

```ts
export const durations = {
  fast: 150,
  moderate: 250,
  slow: 400,
} as const;

export const easings = {
  enter:  'cubic-bezier(0, 0, 0.15, 1)',
  exit:   'cubic-bezier(0.6, 0, 1, 1)',
  global: 'cubic-bezier(0.6, 0, 0.15, 1)',
} as const;
```

Now any CSS transition — even just `:hover` styles on a menu card — can use:

```css
.menu-card {
  transition: transform var(--duration-fast) var(--easing-global);
}
```

This is the smallest possible motion system. No framer-motion dependency, no React hooks, just shared values. You can grow from here.

### 11.2 Start with CSS transitions; reach for framer-motion only when needed

The CDS approach is heavyweight because it has to be. Coinbase has hundreds of components that need consistent enter/exit animations across web and mobile. The bakery app is much smaller.

Sensible escalation path for the bakery:

```txt
hover, focus, active states:        plain CSS transitions
  → :hover, :focus on menu cards, buttons, links

simple show/hide transitions:       CSS + a class toggle
  → mobile nav drawer slide-in/out

multi-step or coordinated motions:  framer-motion
  → cookie sheep rig, navbar flower bloom

springs, gestures, drag:            framer-motion or a dedicated lib
  → only if the design genuinely needs it
```

Most of the bakery app's motion needs will land in the first two tiers. Framer-motion is overkill until there is a real coordinated animation.

### 11.3 The cookie sheep rig and navbar flower

These are the two real animation candidates from `CLAUDE.md`. When you do animate them, apply the CDS discipline:

```txt
flower bloom on selection:
  transform: scale + rotate
  duration: moderate (250ms)
  easing: enterExpressive (a little personality)
  respect prefers-reduced-motion: yes (this is decorative)

cookie sheep rig settling:
  transform: translate
  duration: moderate to slow (250-400ms)
  easing: exitFunctional or expressive
  respect prefers-reduced-motion: yes

button hover:
  transform: scale(1.02) or color change
  duration: fast (150ms)
  easing: global
  respect prefers-reduced-motion: not needed (subtle and functional)
```

### 11.4 Performance habits to copy now

```txt
1. animate transform and opacity, never width/height/margin
2. force durations to zero in tests
3. use the `m` import from framer-motion if/when you adopt it
4. wrap motion-heavy components in memo()
5. respect prefers-reduced-motion for any motion bigger than a fade
```

Each is cheap. None require new libraries. All compound over the lifetime of the project.

---

## 12. A Light Bridge To Recent CDS PRs

A couple of recent PRs sit naturally on top of this chapter. Mentioned briefly so you know they exist.

**PR #607 — Toast declarative rewrite for React 19 StrictMode.** The Toast used to use `useAnimation` + `useEffect` to imperatively kick off its enter animation. Under React 19's stricter StrictMode, that double-fired and left the toast at opacity 0. The fix was to switch to a declarative `<motion.div animate={motionState}>` shape — the renderer reconciles the state, and double-mounting becomes harmless. This is covered in Chapter 9 §3 in detail; the motion-system context for it is "imperative animation talks directly to the engine; declarative animation hands the engine your intent and lets it figure out the timing."

**PR #631 — bar chart enter animation, PR #612 — enter opacity transition.** Charts adopting the same enter-config pattern (CDS tokens passed to framer-motion via `useMotionProps`) that the rest of CDS already uses. Worth knowing only because it shows the motion vocabulary expanding into more components — the same `enterFunctional` curve and `moderate3` duration are now describing chart bar mounts, not just toasts and modals.

The trend across recent PRs: more components share the same motion vocabulary, and the imperative `useAnimation` style is gradually being replaced by declarative `animate={state}` patterns. Both are good signs of a maturing motion system.

---

## 13. Key Takeaways

1. An animation is a value changing over time, controlled by duration, easing, and delay.
2. CDS does not write its own animation engine. It uses framer-motion on web and react-native-reanimated + react-spring on mobile.
3. CDS adds a token vocabulary on top: durations (`fast1`, `moderate2`, `slow3`) and easings (`enterFunctional`, `exitExpressive`, etc.).
4. Animation effect tokens like `fadeIn`, `slideUp`, and `scaleUpXXS` combine a property + values + easing into a named building block.
5. Per-component motion configs in `common/animation/` describe how a specific component (toast, modal, drawer) animates in and out, expressed in tokens.
6. `useMotionProps` is a small adapter that converts CDS token shapes to framer-motion prop shapes. It is the only place the rest of CDS touches framer-motion's exact API.
7. Motion primitives like `Pulse`, `Shake`, and `ColorSurge` are reusable React components that wrap a specific motion behavior.
8. CDS uses framer-motion's lazy `m` import for smaller bundles.
9. CDS animates opacity and transform properties only; layout-affecting properties are avoided because they force expensive re-layout.
10. CDS skips animations during tests and Storybook by forcing duration to zero.
11. CDS uses `useMemo` on motion props and `memo` on motion components to keep animation playback smooth.
12. `react-native-reanimated` runs animations on the native UI thread on mobile, which keeps them smooth even if JavaScript is busy.
13. `prefers-reduced-motion` is a real OS-level setting that should be respected for any non-trivial motion.
14. CDS treats motion as a deliberate design discipline, not a sprinkle-on effect — every motion primitive carries a "consult the motion team" warning.
15. For the bakery app, start with CSS transitions and a small `motion-tokens.ts` file. Reach for framer-motion only when coordination across multiple elements is needed.
16. Animate `transform` and `opacity`, force durations to zero in tests, and respect reduced-motion preferences. Those three habits cover most of the perf and a11y story.

Next chapter (TBD): another foundational topic in the same slow style. Candidates for Chapter 12 include — focus management and keyboard handling (`FocusTrap`, `Pressable`, `useA11yControlledVisibility`), the icon and illustration system, or the controlled vs uncontrolled input pattern.

---

## 14. Bakery Codebase Motion Audit - 2026-04-30

This addendum is based on a local pass through the bakery app after the CDS motion research above. The app already has a surprisingly rich motion layer. It is just not yet organized as one layer. Most motion is CSS-driven and lives close to the visual components that need it. That made sense while the scenery and menu work was changing quickly, but it now means the same concepts are repeated in several places: cloud drift, flower bobbing, grow-in flowers, sheep burst parts, panel entry, selected-row pulses, loading spinners, and short hover lifts. The next step is not "add animation." The next step is to name the motion that already exists, move the reusable parts into the Bakery design system, and only then install a motion library for the pieces CSS is bad at.

The highest-density motion files are:

| Area | Files | What lives there |
| --- | --- | --- |
| Catering menu panel | `src/app/(app)/menu/_components/catering-menu-section.client.tsx` | panel enter, photo enter, wipe/repaint transitions, flavor-card pulses, tray pulses, row spinner, flower bob, flavor cloud drift, sheep hover burst CSS |
| Homepage rotating cookie carousel | `src/app/(app)/HomeCookieCarousel.client.tsx` | sheep jump between cookies, cloud drift, scene flower life, meadow flower bob, info prompt transitions |
| Global Bakery primitives | `src/app/(app)/globals.css`, `src/design-system/bakery/tokens.ts` | Bakery action/card/pressable transition timing, scene button spinner, primitive motion durations |
| Flower system | `src/components/flowers/*` | reusable grow-in, living bob, grass-border grow/shrink, progress-bloom grow and bob |
| Cookie sheep rig | `src/app/(app)/menu/_components/cookie-sheep-rig.tsx`, `cookie-sheep-geometry.ts`, `cookie-poster-grid.tsx` | normalized sheep geometry, head/tail/leg burst vectors, shared-but-duplicated hover CSS |
| Header and overlays | `src/components/Header/index.css`, `src/components/ui/dialog.tsx`, `sheet.tsx`, `select.tsx`, `accordion.tsx` | nav reveal panels, active link flowers, Radix/tw-animate-css overlay enter/exit, accordion height animation |
| Loading and feedback | `src/components/Cart/CartModal.tsx`, `CartModalPayment.tsx`, `CheckoutForm/index.tsx`, `discussion-board.css`, `reviews.css` | loaders, cloud bobbing, payment flowers, pending pulse, selected-row pulse |

There are already motion tokens in `src/design-system/bakery/tokens.ts`, but they are mostly duration strings: `quick`, `normal`, `panelShutter`, `sceneryTransition`, `slow`, `cloudDrift`, and `flowerBob`. There are not yet named easing tokens like CDS has. That is why the same `cubic-bezier(0.22, 1, 0.36, 1)` appears in several component-local styles instead of flowing through one design-system vocabulary. The immediate CDS-inspired improvement is to add named bakery easing roles before adding a new runtime library:

```ts
motion: {
  duration: {
    quick: '150ms',
    fast: '180ms',
    normal: '220ms',
    moderate: '280ms',
    scenery: '420ms',
    slow: '650ms',
  },
  easing: {
    global: 'cubic-bezier(0.22, 1, 0.36, 1)',
    enterFunctional: 'cubic-bezier(0, 0, 0.15, 1)',
    exitFunctional: 'cubic-bezier(0.6, 0, 1, 1)',
    enterExpressive: 'cubic-bezier(0.33, 0, 0, 1)',
    exitExpressive: 'cubic-bezier(1, 0, 0.67, 1)',
  },
}
```

The app also has the start of a scene-motion API: `ScenePainterManager` exposes motion names like `drift` and `gentleBob`, and `ScenePaintedAsset` accepts a `motion` prop. That is the right shape, but the implementation is not complete yet because `getMotionStyle(...)` currently sets duration, timing function, transform origin, and `will-change`, but not the actual `animationName` or iteration behavior. Since `ScenePaintedAsset` is not widely used yet, this is a good future refactor target: finish that primitive before spreading more local scene CSS.

One important gap: reduced-motion handling is not global. The catering menu has an explicit `@media (prefers-reduced-motion: reduce)` block that collapses panel/photo transition durations to `1ms`, but the homepage cookie carousel, flower primitives, global loaders, header panels, and sheep hover burst do not have a shared reduced-motion policy yet. The Bakery media-query provider already understands browser media queries, so a future `bakeryMediaQueries.reducedMotion = '(prefers-reduced-motion: reduce)'` token or hook would fit the current architecture. CSS should also get a global utility class or layer that can shorten decorative infinite animations without relying on every component to remember the media query.

The codebase mostly follows the performance rule from CDS: animate `transform` and `opacity`. There are exceptions worth noting rather than panic-fixing. `ProgressGarden` animates `width`; the Tailwind accordion animates `height`; the blog row hover animates `padding-inline`; catering panel wipes animate `clip-path`; some loader keyframes use individual transform properties like `translate` and `scale`. These can be acceptable in small, contained components, but if any of them move into shared primitives, prefer transform-based versions first. For example, a progress fill can often stay full width and animate `scaleX(...)` from the left instead of animating `width`.

## 15. Sheep Jump Motion Diagnosis

The cookie sheep rig has two separate motion stories, and they should stay separate.

The first story is **resting geometry**. `cookie-sheep-geometry.ts` and `cookie-sheep-rig.tsx` do this well. The cookie body is the coordinate system; head, tail, and legs attach by clock positions; visible art can be shifted inside its own box with `placePartArt(...)`; the alignment-history note says to tune in that order. Do not use jump work as an excuse to change those numbers. If a jump feels stiff, the problem is probably not `clockTimeToMs(8, 53)`. The problem is almost certainly the motion wrapper around the already-good rig.

The second story is **flight motion**. On the homepage carousel, `.homeCookieRigShell` is animated by four keyframe blocks: outgoing left, outgoing right, incoming from right, and incoming from left. Desktop uses `JUMP_DURATION_MS = 280`; mobile uses `MOBILE_JUMP_DURATION_MS = 175`; the CSS animation timing is `linear`; the keyframes manually approximate an arc with several `translate3d(...)`, `rotate(...)`, and `scale(...)` stops. The component then uses `setTimeout(finishTransition, getJumpDurationMs())` to clear the transition state.

That works, but it explains why the jump can still feel a little mechanical. A real jump has at least four separate ideas happening at once:

```txt
horizontal travel       mostly steady velocity
vertical travel         fast launch, slower apex, faster fall
body attitude           tilt into the direction of travel, then recover
landing contact         tiny squash, shadow compression, quick settle
```

The current CSS puts all of those ideas into one `transform` string on one element, driven by one global `linear` timeline. Because `x`, `y`, `rotate`, and `scale` are fused together, it is hard to give horizontal movement a steady velocity while giving vertical movement a more physical easing. The result can read as a drawn path rather than a body with weight.

The strongest refactor is to split the sheep jump into layers:

```tsx
<span className="sheepJumpFlight">   // owns x travel and opacity
  <span className="sheepJumpArc">    // owns y arc
    <span className="sheepJumpBody"> // owns tilt, squash, and settle
      <CookieSheepRig ... />
      <span className="sheepJumpShadow" />
    </span>
  </span>
</span>
```

With that split, the outer wrapper can move sideways with a mostly linear or global easing, the arc wrapper can use a keyframed up/down curve, and the inner body can add a small squash/stretch or rotation without corrupting the placement math. This is the same layering principle as the alignment note: geometry decides where parts live at rest; motion wrappers decide how the whole rig travels; body micro-motion decides how the rig expresses weight.

If staying in CSS for now, use CSS variables to remove the duplicated left/right/mobile keyframes:

```css
.sheepJumpFlight {
  --jump-direction: 1;          /* 1 = next, -1 = previous */
  --jump-distance: 58vw;
  --jump-height: 8rem;
  --jump-tilt: 20deg;
  animation: sheepJumpX var(--jump-duration) linear both;
}

.sheepJumpArc {
  animation: sheepJumpY var(--jump-duration) cubic-bezier(0.33, 0, 0, 1) both;
}

.sheepJumpBody {
  animation: sheepJumpBody var(--jump-duration) cubic-bezier(0.22, 1, 0.36, 1) both;
}
```

That is only a sketch, but the shape matters: one animation for `x`, one for `y`, one for body feel. Direction becomes a sign, not four duplicated keyframe families.

The landing should get a ground shadow. It can be a small absolutely positioned oval under the rig, animated only with `opacity` and `scaleX`. At launch, the shadow gets smaller and lighter. At landing, it spreads and darkens for 80-120ms, then settles. This one detail makes a jump read as "above the ground" instead of "sliding along a curve." Keep it subtle; the app's scenery is gentle.

The sheep should also have a tiny anticipation frame before launch. For 40-60ms, scale the body to something like `scaleX(1.025) scaleY(0.975)` and rotate one or two degrees opposite the travel direction. Then launch. This gives the jump a cause. Without anticipation, the sheep just teleports into motion.

For the limbs, avoid moving the actual placement boxes during the jump. The limbs are already placed by geometry. Instead, add tiny art-local phase motion inside `CookieSheepRig` only when a parent class says it is jumping:

```css
.sheepJumpBody .cookieSheepBurstPart {
  animation: sheepLimbTuck var(--jump-duration) ease-in-out both;
}
```

The goal is not a full run cycle. The goal is a readable tuck at apex and a soft return on landing. If this starts disturbing the carefully tuned hover-burst behavior, stop and split the jump-only class from the hover-burst class. Hover burst is a different interaction and should not be silently removed.

The current `setTimeout(...)` completion should eventually become event-driven. CSS animation can call `onAnimationEnd`; a motion library can call `onAnimationComplete`. Timeouts are fragile because reduced-motion mode, browser throttling, or future duration changes can desynchronize state from the visual end. CDS has the same lesson in its transition-end handling: when an animation event decides state, verify the event target before mutating state.

For reduced motion, the sheep carousel should not play the big arc. Use a short crossfade and a small `translateX(0.75rem)` or no transform at all. The carousel can still change cookies; it just should not throw a large object across the viewport for users who opted out.

## 16. Future Library Direction For Sheep Motion

Do not install a library just to replace every CSS transition. The app's hover lifts, bobbing flowers, cloud drift, button spinners, and small pulses are good CSS jobs. A library becomes worth it when the interaction needs coordinated state, exit-before-enter, layout measurement, springs, gesture state, or animation completion callbacks.

For the sheep jump, the best library fit is probably one of these two paths:

```txt
Motion / framer-motion
  best for variants, AnimatePresence, gesture props, layout animation, exit/enter choreography

react-spring
  best for numeric spring physics when the feel depends on stiffness/damping/mass
```

If the goal is "make the carousel sheep jump feel alive," `react-spring` is a strong candidate because the interaction is basically a body moving through numeric space with weight. If the goal is "make panels, menus, cookie cards, and carousel transitions share a declarative animation vocabulary," Motion/framer-motion is the stronger system-level candidate. Either way, wrap the library behind Bakery motion primitives. Do not let random components import the animation engine directly.

A library-backed sheep API could look like this:

```tsx
<BakeryMotionPresence>
  <SheepJumpRig
    direction={transition.direction}
    phase={transition ? 'jumping' : 'resting'}
    reducedMotion={prefersReducedMotion}
  >
    <CookieSheepRig ... />
  </SheepJumpRig>
</BakeryMotionPresence>
```

Internally, `SheepJumpRig` can use the library. Externally, the app still speaks Bakery words: `direction`, `phase`, `reducedMotion`. That is the CDS lesson again: components should speak design-system language, and one adapter translates into the chosen engine.

## 17. Techniques To Make The App Feel More Alive

The app already has the right motifs: sheep, clouds, grass, flowers, cookie cards, scenery themes. The way to make it feel more alive is to make those motifs respond to user intent and ambient time, not to add random motion everywhere.

First, centralize **ambient scenery motion**. Cloud drift and flower bobbing appear in the homepage carousel, cookie poster cards, catering hero, cart scene, and loading states. These should become named scene motions: `cloudDrift`, `flowerBob`, `meadowBob`, `sparkleTwinkle`, maybe `critterIdle`. Keep the amplitude tiny and use seeded delays/durations so repeated decorations feel organic without changing every render. This follows the existing seeded-flower direction from Chapter 4.

Second, use **growth motion** for positive progress. The flower primitives already do this well: `FlowerSprite` grows in, `FlowerSprout` grows stem then head, `GrowingGrassBorder` draws a grass line and blooms flowers, `ProgressBloom` grows then bobs. Reuse this family for selected menu items, completed catering tray choices, cart milestones, and form success moments. This matches the project rule that flower language is a core reusable motif.

Third, add **contact shadows** to jumping or floating objects. The sheep jump, spawned sheep, and maybe dragged/selected cookie cards can all benefit from a small shadow that compresses near the ground and fades at the apex. A shadow is cheaper than a complex animation and often makes the whole object feel physical.

Fourth, use **micro-pulses for acknowledgement**, not decoration. The catering tray summary pulse and flavor-card add/remove pulses are the right idea: short, transform-only, tied to a concrete event. Good future places include cart count changes, checkout step success, "added to cart," and selected menu filters. Avoid infinite pulses on interactive controls unless the user is waiting for something.

Fifth, make **navigation hover states more authored**. The header already has active flower language and reveal panels. The Oura and Drinkpouch notes both point toward hover states that feel more considered than a color swap. For this app, the right version is not a corporate underline everywhere; it is a small flower/dot-to-line bloom using the navbar flower vocabulary. Build it once as a Bakery navigation primitive rather than hand-building per link.

Sixth, prefer **FLIP or layout animation** for future product-modal expansion. The backlog plan wants a grid item to expand into a product modal. That is exactly where a motion library may earn its keep later. The interaction should preserve the sense that the tapped bakery item becomes the larger surface, rather than destroying one element and mounting an unrelated modal. CSS can fake this for a narrow case, but a library layout animation will be cleaner once the design is ready.

Seventh, use **scene repaint transitions sparingly**. The catering panel wipe/repaint system is visually interesting and already has named opening/closing phases. That pattern can become a `ScenePanelTransition` primitive, but it should be reserved for big mode switches: details to photos, scene theme changes, or product-gallery view changes. For small changes, a fade/slide is enough.

Eighth, keep **autoplay and ambient loops polite**. CDS's docs-site animation notes include three important behaviors worth copying: focus pauses autoplay, keyboard users can trigger the same transitions as mouse users, and looping animation cleans up on unmount. The homepage carousel currently has good button control, but future autoplay-like effects should have a pause path and should not fight focus.

## 18. Refactor Candidates When Implementation Starts

The implementation order should be conservative.

Start by adding Bakery motion tokens and CSS variables for easing, not by installing a library. This lets existing CSS move from repeated hardcoded curves to named roles.

Next, extract shared sheep hover CSS. `cookie-poster-grid.tsx` and `catering-menu-section.client.tsx` both define `.cookieSheepBodyImage` and `.cookieSheepBurstPart` behavior. That should become a shared sheep-motion style or a small `CookieSheepMotionSurface` wrapper. Preserve the hover burst unless explicitly asked to remove it.

Then refactor the homepage carousel jump into layered wrappers. Keep `CookieSheepRig` geometry unchanged. Move jump-specific CSS out of the massive component style block if possible, or at least name the layers so the motion is easier to reason about.

After that, add reduced-motion support at the design-system level. Use both CSS media queries and a React hook/query token for stateful components like the carousel, where JavaScript completion timing changes when motion is reduced.

Only then install an animation library. The first library-backed primitive should probably be `SheepJumpRig` or a generic `BakeryPresence`, not a one-off import inside `HomeCookieCarousel.client.tsx`. That keeps the future path aligned with CDS: one adapter, many design-system-shaped consumers.
