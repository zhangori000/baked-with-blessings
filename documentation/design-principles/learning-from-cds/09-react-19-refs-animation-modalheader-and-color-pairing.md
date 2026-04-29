# 09. React 19, Refs, Animation, ModalHeader, and the Color Pairing Tool

Date: 2026-04-28

Scope: learning note only. This is Chapter 9 in `learning-from-cds/`. Codex Spark is working on Chapter 8 in parallel — Chapter 9 is intentionally ad-hoc rather than sequential. The goal here is to clarify some recent CDS PRs and the React 19 mental models behind them.

Primary CDS source files referenced:

- `packages/common/src/hooks/useMergeRefs.ts`
- `packages/web/src/overlays/Toast.tsx`
- `packages/web/src/overlays/modal/ModalHeader.tsx`
- `packages/web/src/overlays/__stories__/Modal.stories.tsx`
- `apps/docs/src/components/page/ColorPairingTool/colorUtils.ts`

---

## 1. What is React 19, and when did it ship?

React 19 became stable in **December 2024**. It is the version after React 18.

The headline features matter less here than the smaller behavioral changes that affect everyday code:

- **Stricter StrictMode double-invocation.** In dev, React mounts a component, unmounts it, then mounts it again. React 19 makes this stricter and more thorough — effects run twice, refs attach twice, and any "do this once" code that relied on accidental ordering breaks.
- **Ref callbacks now have a real lifecycle.** When the identity of a ref callback changes, React 19 explicitly calls the old callback with `null` (detach), then calls the new callback with the node (attach). React 18 would mostly skip this when the node was the same.
- **`ref` can be a regular prop.** You no longer have to use `forwardRef` everywhere. CDS still uses `forwardRef` for backward compatibility with React 18 consumers.

You don't need to memorize all of React 19's release notes. Just keep two ideas in mind:

```txt
StrictMode in React 19 is meaner. Effects fire twice on mount.
Ref callbacks have a detach/attach lifecycle when their identity changes.
```

Almost every PR we look at below is a consequence of one of those two things.

---

## 2. Refs, `useCallback`, and `useMergeRefs`

### 2.1 Refs are not magic

A ref is just an object with one property:

```ts
{ current: null }
```

When you write `const ref = useRef(null)` and pass `ref` to a JSX element, React assigns the DOM node to `ref.current` after the element mounts. Reading or writing `ref.current` does **not** cause a re-render. You're correct about that.

### 2.2 Are object refs even relevant in everyday code?

Yes, but rarely. You'd reach for one in two situations.

**Use case A — grab a real DOM node to call a browser API React doesn't expose as a prop.**

The browser knows how to focus an input. React does not have a `focus` prop. So you grab the actual node and call `.focus()` on it.

```tsx
function CheckoutForm() {
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!emailRef.current?.value.includes('@')) {
      emailRef.current?.focus();   // jump cursor back to the field
      emailRef.current?.select();  // highlight what they typed so far
    }
  };

  return <input ref={emailRef} type="email" />;
}
```

The trick to internalize: `emailRef.current` is literally the `<input>` element on the page — the same thing you'd get from `document.getElementById('email')`. Every DOM element has built-in browser methods like `.focus()`, `.scrollIntoView()`, `.click()`, `.select()`. You're calling a browser method on the real element.

```tsx
inputRef.current.focus();
// ≈ "browser, please put the cursor in this input"
```

In the bakery app, this is the case you'll usually hit: focusing an input on a form error, scrolling a card into view, measuring a card's width with `getBoundingClientRect()`.

**Use case B — remember a value across renders without triggering a re-render.**

```tsx
function Timer() {
  const intervalIdRef = useRef<number | null>(null);

  const start = () => {
    intervalIdRef.current = window.setInterval(tick, 1000);
  };
  const stop = () => {
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
  };
  // ...
}
```

`intervalIdRef.current` is a hiding spot. Not state (state would re-render), not a global (would leak across instances), just a stable container the component owns. You'll hit this case mainly if you start writing animation rigs or anything that holds a handle (interval ID, animation frame ID, abort controller) between events.

### 2.3 Two flavors of refs

There are two ways React lets you attach a ref to an element:

**Object ref** (what `useRef` returns):

```tsx
const ref = useRef<HTMLDivElement>(null);
<div ref={ref} />
// React assigns: ref.current = theDivNode
```

**Callback ref** (a function React calls with the node):

```tsx
<div ref={(node) => { /* node is the div, or null on unmount */ }} />
```

Both exist because callback refs let you **react** to a node attaching/detaching. Object refs just store; callback refs let you run code at the moment of attach.

### 2.4 Why would you ever need to "merge" refs?

This is the bit that confuses everyone the first time. Walk through it slowly.

**The setup:** You build a custom component, say `<EmailField>`, and use it from a parent.

```tsx
// Parent
function CheckoutPage() {
  return (
    <form>
      <EmailField />
      <button>Submit</button>
    </form>
  );
}
```

**The problem:** The parent wants to focus the email input when the form submits with bad input. But the parent doesn't render an `<input>` directly — it renders `<EmailField>`, which renders the `<input>` deep inside its own JSX. The parent has no way to reach the `<input>`.

**With "accepting a ref":** the child component is wired to forward whatever ref the parent passes down to its internal `<input>`. Now the parent can do this:

```tsx
function CheckoutPage() {
  const emailRef = useRef<HTMLInputElement>(null); // parent's ref

  const handleSubmit = () => {
    emailRef.current?.focus(); // parent reaches into the <input> inside EmailField
  };

  return (
    <form>
      <EmailField ref={emailRef} />
      <button onClick={handleSubmit}>Submit</button>
    </form>
  );
}
```

So **"do the same"** means: *the parent also wants to call `.focus()` on the same `<input>` that the child component owns.* Two different pieces of code (the `EmailField` internals, and the `CheckoutPage`) want to point at the same DOM node.

**Why "merge"?** If the child *also* wants its own ref (maybe to auto-focus on mount, or measure itself), now there are two refs that need to point at one element. You can't pass two `ref`s to one JSX element. You need a single callback ref that fans the node out to both. That's what `useMergeRefs` does.

### 2.5 What is `forwardRef`?

`forwardRef` is the React rule that lets a child component **opt in** to receiving a ref from its parent.

Plain function components ignore the `ref` prop:

```tsx
function EmailField(props) {
  return <input {...props} />;
}

<EmailField ref={emailRef} />
// React warns: "Function components cannot be given refs"
// The ref is silently dropped.
```

`forwardRef` is the opt-in:

```tsx
const EmailField = forwardRef<HTMLInputElement>((props, ref) => {
  return <input {...props} ref={ref} />;
  //                          ↑ "the parent's ref attaches to THIS input"
});
```

Two things change:

- The component is now a function with **two** arguments: `(props, ref)` instead of just `(props)`.
- Whatever you do with that second `ref` argument is the contract you expose to parents.

Most of the time you just thread it through to one underlying DOM element. The `<TextInput>` example below is the more interesting case because the child also has its own internal ref, so it has to merge them.

> Note: in React 19 you no longer strictly need `forwardRef` — `ref` can be a regular prop. CDS still uses `forwardRef` for backward compatibility with React 18 consumers. The mental model is the same either way.

### 2.6 Walking through the `<TextInput>` snippet

```tsx
const TextInput = forwardRef<HTMLInputElement>((props, parentRef) => {
```

"Make a component that opts in to receiving a ref. The ref will eventually point to an `HTMLInputElement`. Call the parent's ref `parentRef`."

```tsx
  const internalRef = useRef<HTMLInputElement>(null);
```

"I, the child, also want my own ref to the same input — maybe to auto-focus on mount, or measure my own width."

```tsx
  const mergedRef = (node: HTMLInputElement | null) => {
    internalRef.current = node;
    if (typeof parentRef === 'function') parentRef(node);
    else if (parentRef) parentRef.current = node;
  };
```

"Make a single callback ref that will be attached to the `<input>`. When React gives me the node:

- put it in my own `internalRef.current` (so the child can use it),
- and also hand it to the parent — but the parent might have given me either a callback ref or an object ref, so check both shapes."

```tsx
  return <input ref={mergedRef} />;
});
```

"Attach my one merged callback ref to the actual `<input>`. React will call it with the node on mount, and with `null` on unmount."

End result: two different pieces of code (the child's `internalRef` and the parent's `emailRef`) both end up pointing at the same DOM `<input>` — without ever passing `ref` twice to one element.

### 2.7 The naive version is broken — the React 19 detach/attach trace

The `mergedRef` above is **defined inside the component body**. Every time the component re-renders, JavaScript creates a brand-new function with the same body but a different identity:

```tsx
const TextInput = forwardRef((props, parentRef) => {
  // ...
  const mergedRef = (node) => { ... };  // fresh function every render
  return <input ref={mergedRef} />;
});
```

In React 19, ref-callback identity is part of the lifecycle:

```txt
render 1:
  mergedRef = function#1
  React: "new ref! attach!" → calls function#1(theInputNode)

render 2 (parent re-renders for any reason):
  mergedRef = function#2 (different identity, same body)
  React 19: "the ref identity changed. I need to clean up the old one and install the new one."
    → calls function#1(null)         ← detach: the old callback gets told "you're done"
    → calls function#2(theInputNode) ← attach: the new callback gets told "here's the node"
```

If anything inside that detach/attach cycle calls `setState` synchronously — say Floating UI re-measures and stores something in state when the ref attaches — you trigger render 3, which makes `function#3`, which re-runs the cycle, which re-fires `setState`, which triggers render 4… → `Maximum update depth exceeded`.

### 2.8 Why `useCallback` fixes it

`useCallback` returns the **same function reference** across renders as long as its dependencies don't change.

```ts
// The CDS version, simplified
export const useMergeRefs = <T,>(...refs) => {
  return useCallback(
    (value) => {
      refs.forEach((ref) => {
        if (typeof ref === 'function') ref(value);
        else if (ref != null) ref.current = value;
      });
    },
    refs, // depend on each ref individually
  );
};
```

Now:

```txt
render 1: returns callback_A → React attaches → callback_A(node)
render 2: same refs → useCallback returns callback_A again
          React sees same identity → no detach/attach → no re-render storm
```

So `useCallback` is being used here not for "performance" in a vague sense, but for **`React.RefCallback` lifecycle correctness under React 19**.

The deeper lesson: in React 19, the **identity** of certain functions (event handlers, ref callbacks) is observable behavior, not just a perf concern.

### 2.9 The chain of reasoning, end to end

```txt
1. We need both child and parent refs to point at the same node.
2. Easiest way: a callback ref that fans the node out to both.
3. Defined inline, that callback gets a new identity every render.
4. React 19 treats new identity as "detach old, then attach new."
5. If that detach/attach has any side effect (e.g. setState), you can land in an infinite loop.
6. useCallback keeps the function identity stable → React 19 stops doing the dance.
```

### 2.10 Putting it together — a real example

```tsx
import { useRef, forwardRef } from 'react';
import { useMergeRefs } from '@coinbase/cds-common/hooks/useMergeRefs';

type CookieCardProps = {
  flavor: string;
};

export const CookieCard = forwardRef<HTMLDivElement, CookieCardProps>(
  ({ flavor }, parentRef) => {
    // 1. internal ref so we can measure ourselves
    const cardRef = useRef<HTMLDivElement>(null);

    // 2. merge into one stable callback ref
    const mergedRef = useMergeRefs(cardRef, parentRef);

    // 3. example of using the internal ref
    const handleHover = () => {
      const rect = cardRef.current?.getBoundingClientRect();
      console.log('card width:', rect?.width);
    };

    return (
      <div ref={mergedRef} onMouseEnter={handleHover}>
        {flavor}
      </div>
    );
  },
);
```

The parent can also attach a ref:

```tsx
const cardRef = useRef<HTMLDivElement>(null);
<CookieCard ref={cardRef} flavor="lavender" />;
```

Both `cardRef` (parent) and the internal `cardRef` end up pointing at the same `<div>`. `useMergeRefs` is the bridge.

### 2.11 TL;DR mental models

```txt
object ref:    a tiny box you stash a value in. .current = the thing.
callback ref:  a function React calls when a node attaches or detaches.

forwardRef:    "this component opts in to receiving a ref from its parent."
               The parent's ref shows up as the second function argument.
               You decide where that ref ends up internally.

merging refs:  the child wants its own ref AND the parent wants one too.
               They both need to point at the same DOM node.
               One callback ref hands the node to both.

React 19's gotcha: ref-callback identity changes are observable.
                   Stabilize them with useCallback.
```

If you only remember one sentence: **a ref is just a way to keep a stable handle on a real DOM node so you can call browser methods (`.focus()`, `.scrollIntoView()`) or remember a value without re-rendering.** Everything else is plumbing on top of that.

---

## 3. Imperative vs declarative animation

This is the bigger pattern lesson, and it's the reason CDS rewrote the Toast.

### 3.1 The two styles, in plain words

**Imperative**: you reach into an animation engine and tell it *do this now*. You hold a handle and call methods on it.

**Declarative**: you describe a state ("I want to be in the `enter` state right now"), and the renderer figures out how to animate to it.

Both styles work. Declarative is friendlier when other things — React's reconciliation, StrictMode, suspense — can interrupt your code.

### 3.2 Plain `useEffect` recap

`useEffect` runs *after* React commits to the DOM. The basic shape:

```tsx
useEffect(() => {
  // runs after mount, and again after deps change
  return () => {
    // runs before the next effect, and on unmount
  };
}, [deps]);
```

In React 19 StrictMode (dev only), each effect runs:

```txt
mount   → effect runs (1)
unmount → cleanup runs
mount   → effect runs (2)
```

So any effect you write **must be safe to run twice**. That's the rule.

### 3.3 What is `useAnimation`?

`useAnimation` is a hook from **framer-motion** (not from React). It gives you an `AnimationControls` object — a handle you can call methods on.

```tsx
import { motion, useAnimation } from 'framer-motion';

const controls = useAnimation();

// later, somewhere in your code:
controls.start({ opacity: 1, y: 0 });
controls.start('enter'); // by named variant
controls.stop();
```

`controls.start(...)` is the imperative call: "play this animation now." It returns a Promise that resolves when the animation finishes.

You attach `controls` to a `<motion.div>` so framer-motion knows which element to animate:

```tsx
<motion.div animate={controls} initial={{ opacity: 0 }} variants={...} />
```

This is powerful — and exactly what bit the old Toast.

### 3.4 The old Toast (imperative) — why it broke

Pseudocode of the old version:

```tsx
const controls = useAnimation();

useEffect(() => {
  controls.start('enter'); // play the enter animation
}, []); // run once on mount
```

Under React 19 StrictMode, that `useEffect` runs **twice** in dev:

```txt
mount 1: controls.start('enter') begins
unmount: cleanup runs (but we didn't write one)
mount 2: controls.start('enter') begins again
         → races with the first one
         → final state can land on opacity: 0
```

The toast ends up invisible. The bug isn't framer-motion's fault — it's that **imperative-`useEffect`-on-mount is fragile when mounts can repeat**.

### 3.5 The new Toast (declarative) — what changed

Look at `packages/web/src/overlays/Toast.tsx`:

```tsx
const [motionState, setMotionState] = useState<'enter' | 'exit'>('enter');

const motionProps = useMotionProps({
  enterConfigs: [animateInOpacityConfig, animateInBottomConfig],
  exitConfigs: [animateOutOpacityConfig, animateOutBottomConfig],
  animate: motionState,
  style: { bottom: bottomOffset },
});

return (
  <motion.div
    {...motionProps}
    onAnimationComplete={handleAnimationComplete}
  >
    {/* toast content */}
  </motion.div>
);
```

There is no `useEffect`, no `controls.start()`. Instead:

- React state holds the desired animation state (`'enter'` or `'exit'`).
- Initial value is `'enter'`, so the toast starts trying to animate into `enter` at mount time.
- StrictMode double-mounting just sets the same initial state twice — the renderer reconciles, no race.

To dismiss, call `setMotionState('exit')`. Framer-motion sees the state change and runs the exit animation.

### 3.6 What is `useMotionProps`?

It's a CDS-internal helper (in `packages/web/src/motion/useMotionProps.ts`) that turns a friendly config object into the props framer-motion expects: `initial`, `animate`, `variants`, `transition`, etc.

Conceptually:

```tsx
// you write this:
const motionProps = useMotionProps({
  enterConfigs: [opacityIn, slideInBottom],
  exitConfigs: [opacityOut, slideOutBottom],
  animate: motionState, // 'enter' or 'exit'
});

// useMotionProps returns approximately:
// {
//   initial: { opacity: 0, y: 20 },
//   animate: { opacity: 1, y: 0 },
//   variants: { enter: {...}, exit: {...} },
//   transition: { ... },
// }
```

It's just **prop-shape adaptation**, so the rest of CDS doesn't have to learn framer-motion's exact field names. You can think of it as a small typed wrapper that says "here are my enter and exit intentions, please give me the framer-motion props."

### 3.7 What is `onAnimationComplete`?

This is a framer-motion event. It fires when an animation finishes, with the name of the variant that just completed:

```tsx
<motion.div
  animate={motionState}
  onAnimationComplete={(definition) => {
    if (definition === 'exit') {
      // the exit animation just finished — safe to unmount, fire callbacks, etc.
    }
  }}
/>
```

The Toast uses this to bridge between declarative state and an imperative API:

```tsx
const exitResolverRef = useRef<((value: boolean) => void) | null>(null);

const handleClose = useCallback((): Promise<boolean> => {
  return new Promise((resolve) => {
    exitResolverRef.current = resolve; // remember the resolver
    setMotionState('exit');             // declaratively kick off the exit
  });
}, []);

const handleAnimationComplete = (definition: string) => {
  if (definition === 'exit') {
    exitResolverRef.current?.(true);    // resolve the promise once the exit finishes
    exitResolverRef.current = null;
  }
};
```

So consumers can still write:

```tsx
await toastRef.current.hide(); // imperative "hide and tell me when done"
console.log('toast is gone');
```

…and internally, the implementation is fully declarative.

### 3.8 The takeaway

```txt
imperative animation:
  hold a handle, call .start(), tied to useEffect timing
  fragile when React replays effects (StrictMode, suspense)

declarative animation:
  state describes "what should be animating right now"
  React + framer-motion reconcile, no race
  expose imperative API as a thin shell using onAnimationComplete + a Promise
```

For a small bakery app, you may rarely need framer-motion at all — but if you ever animate the navbar flower selection state or a celebratory rig, prefer the declarative pattern.

---

## 4. ModalHeader, with real examples

### 4.1 The shape of the API

`ModalHeader` accepts:

- `title?: React.ReactNode` — string OR a JSX node
- `font` / `fontSize` — typography overrides forwarded to the header surface
- back button props (`onBackButtonClick`, `backAccessibilityLabel`, `backAccessibilityHint`)
- close button props (`closeAccessibilityLabel`, `closeAccessibilityHint`)
- everything `HStack` accepts (it `extends HStackProps`)

The interesting part is `title` accepting both a string and a node, plus `font="inherit"` on the inner Text.

### 4.2 Example A — plain string title (the 80% case)

From `Modal.stories.tsx`:

```tsx
<Modal onRequestClose={close} visible={visible}>
  <ModalHeader
    backAccessibilityLabel="Back"
    closeAccessibilityLabel="Close"
    onBackButtonClick={close}
    title="Basic Modal"
  />
  <ModalBody>{children}</ModalBody>
</Modal>
```

Internally, `ModalHeader` wraps `"Basic Modal"` in:

```tsx
<Text as="h2" font="inherit" textAlign="center">Basic Modal</Text>
```

The `font="inherit"` is the key — it lets the `<Text>` pick up whatever font was set on the surrounding `HStack`.

### 4.3 Example B — overriding the font

```tsx
<ModalHeader
  font="title1"          // sets the HStack's font scale
  fontSize="display2"    // overrides the size specifically
  title="Large Title Modal"
/>
```

Because the inner Text is `font="inherit"`, this works without you having to wrap the title yourself. The header inherits, the title inherits from the header.

### 4.4 Example C — fully custom title node (escape hatch)

```tsx
<ModalHeader
  closeAccessibilityLabel="Close"
  title={
    <HStack alignItems="center" gap={1} justifyContent="center">
      <Text as="h2" color="fgPrimary" font="title2">
        Custom Title
      </Text>
      <Text as="span" color="fgMuted" font="caption">
        with subtitle
      </Text>
    </HStack>
  }
/>
```

When `title` isn't a string, `ModalHeader` renders it raw — it does not wrap it in `<Text>`, doesn't apply the default `as="h2"`, doesn't auto-set the `id` for `aria-labelledby`. You're in full control.

### 4.5 The pattern, in plain words

```txt
title: string  → component owns h2 semantics, font, id, alignment
title: node    → consumer owns everything

font="inherit" on the inner <Text>:
  string consumers can still tweak font/fontSize via header props
  no need to drop to the node form for simple typography changes
```

This is the **slot-with-graceful-defaults** pattern. The string case has zero ceremony. The node case has full power. There's no middle "configurable" tier with 12 options — they intentionally cap the simple API at "font" and force you to the node form when you want anything more elaborate.

For the bakery app, this is the pattern to copy when building things like product card titles, modal flows for "Order placed," or the cookie sheep rig captions.

### 4.6 Why the empty placeholder?

Look at this snippet from `ModalHeader.tsx`:

```tsx
const emptyPlaceholder = (
  <Box height={interactableHeight.compact} width={interactableHeight.compact} />
);
// ...
{onBackButtonClick ? <Box>...IconButton...</Box> : emptyPlaceholder}
```

If the back button is absent, an invisible Box of the same size still occupies the left slot. That keeps the title visually centered between the (possibly missing) back button on the left and the close button on the right. Tiny touch, big visual stability.

---

## 5. The Color Pairing Tool

This is one of the most fun PRs in recent CDS. It lives at `apps/docs/src/components/page/ColorPairingTool/` — it's a docs-site tool, not a published component.

### 5.1 What it does

You drop an image onto a webpage. The tool:

1. Picks 4 dominant colors from the image (k-means).
2. Maps each to the closest CDS spectrum token (e.g. `blue50`, `red70`).
3. Checks WCAG contrast between pairs.
4. If the pair fails AA (4.5:1), it nudges to a passing token in the same family.
5. Shows you both the original colors and the suggested CDS pairings, in light and dark mode.

The output is "here are the closest CDS tokens to your brand colors, and here's how to use them while still passing accessibility."

### 5.2 The interesting algorithms (`colorUtils.ts`)

#### a) WCAG luminance and contrast — canonical formulas

```ts
export function luminance(r: number, g: number, b: number): number {
  return [r, g, b]
    .map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(...);
  const l2 = luminance(...);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
```

This is the **exact** formula from the WCAG 2.x spec. The `0.03928` threshold and the `(v + 0.055) / 1.055) ** 2.4` curve come from the sRGB gamma definition. The luminance weights `0.2126 / 0.7152 / 0.0722` are how human eyes perceive red, green, and blue brightness — green dominates.

```ts
export function wcagLevels(r: number) {
  return { aaNormal: r >= 4.5, aaLarge: r >= 3, aaa: r >= 7 };
}
```

The thresholds are written as constants, not magic numbers in conditionals. That's a small but real readability win.

#### b) Hue-aware token matching

Naive "find the closest CDS token" would use plain RGB Euclidean distance. That fails because CDS spectrum tokens have a **family** structure (`blue10`, `blue20`, …, `red10`, `red20`, …) and gray is blue-tinted, so a slightly muted blue can match a gray instead of a blue.

The CDS solution (`findClosestPrimitiveHueAware`):

```txt
1. Convert input to HSL, take the hue (0–360°).
2. If the input is achromatic (saturation < 0.1), fall through to plain RGB.
3. For each token family (blue, red, teal, ...), compute its average hue
   from steps 10–90 (skip 0 and 100 because extremes drift toward neighbors).
4. Find the family with the smallest hue distance to the input,
   plus any other family within 10° of it (HUE_MARGIN).
5. Among tokens in that candidate set, pick the closest by RGB distance.
```

The two-stage design is the lesson. Hue alone over-commits ("close to teal"). RGB alone misses the family structure ("ended up on gray"). A hue prefilter plus RGB tiebreak captures the best of both.

#### c) AA enforcement

```txt
contrast(primary, secondary) < 4.5  →  try to keep primary, bump secondary
                                     →  prefer same family as the original secondary
                                     →  if that fails, try bumping primary instead
                                     →  return adjustedNote with a human explanation
```

Notice that they preserve "intent" by sticking to the same family (you wanted a blue → a different blue, not a green). And they emit a string `adjustedNote` so the UI can explain the swap.

#### d) k-means with positional weighting

Plain k-means treats every pixel equally. CDS wants the **subject** (center of frame), not background pixels.

The trick (lines ~336–355):

```ts
const dx = (px - cx) / sigX;
const dy = (py - cy) / sigY;
const weight = Math.exp(-(dx * dx + dy * dy) / 2); // Gaussian falloff
const repeats = Math.max(1, Math.round(weight * 10));
for (let k = 0; k < repeats; k++) rawPixels.push([r, g, b, px, py]);
```

A pixel near the center contributes ~10 copies of itself. A pixel in the corner contributes 1. Standard k-means runs unchanged — the **input is weighted via duplication**, not via algorithm changes. That's a clean way to bias an algorithm without forking it.

There's also a sniff for bright/dark backgrounds:

```ts
const cornerBrightness = sampleCornerBrightness();
const skipBrightBg = avgCorner > 200;
const skipDarkBg = avgCorner < 55;
// then skip pixels matching that brightness band when collecting samples
```

Cheap heuristic. Decides "this image looks like a product on white" or "studio shot on black" by sampling four corner pixels.

### 5.3 Why this matters as a learning artifact

```txt
Lots of design tools = "pick a color from an image."
This one = "pick a color from an image, snap to your design system,
           ensure accessibility, suggest swaps, explain the swap."

The algorithms aren't off-the-shelf because the constraint is the design system itself.
```

For the bakery app, the same idea could apply later: take a hero photo of a cookie and auto-pick `pinkX` and `lavenderY` from your spectrum to match. You don't have to build it now, but the file is a great reference if you ever do.

---

## 6. Quick recap

```txt
React 19 (Dec 2024):
  - StrictMode now double-invokes mount effects in dev
  - Ref callbacks have a real detach/attach lifecycle when identity changes

useMergeRefs:
  - merges multiple refs into one stable ref-callback
  - useCallback is required for ref-callback identity stability under React 19
  - without it: detach/attach loop → "Maximum update depth exceeded"

Imperative vs declarative animation:
  - imperative: useAnimation + controls.start() in useEffect → fragile in StrictMode
  - declarative: state holds the variant; renderer reconciles
  - useMotionProps adapts a friendly config to framer-motion props
  - onAnimationComplete bridges declarative state back to imperative Promises

ModalHeader:
  - title can be a string OR a node
  - font="inherit" on inner <Text> = string consumers still tweak font/size
  - empty placeholder keeps the title centered when the back button is absent

Color Pairing Tool:
  - WCAG luminance + contrast formulas, by the spec
  - hue-aware family prefilter + RGB tiebreak for token matching
  - AA enforcement preserves family intent and explains adjustments
  - k-means with Gaussian center-weighting via pixel duplication
  - corner-brightness heuristic to skip bright/dark backgrounds
```

None of this needs to land in the bakery app today. It's all reference for "when I see this pattern in CDS later, I know what it's solving."

---

## 7. What from this chapter actually applies to the bakery app?

Honest pass: not all of Chapter 9 maps onto a Payload + Next.js bakery storefront. Here's what's directly useful, what's situationally useful, and what's overkill for now.

### 7.1 Directly useful — start using these soon

#### a) `.focus()` and `.scrollIntoView()` on form fields

The FormBuilder plugin generates a `forms` collection and a `form-submissions` collection. When a customer fills out the contact / order form on the public site and validation fails, you want the cursor to jump back to the bad field. That is exactly use case A from §2.2.

Concrete spots:

- **Public contact form on the storefront.** When the email is invalid, focus the email field and `select()` what they typed.
- **Checkout / order form.** Scroll the first invalid field into view if it's below the fold, then focus it.
- **Admin search inputs**, if you ever build a custom one. `useEffect(() => searchRef.current?.focus(), [])` is a one-liner.

You usually don't need `useMergeRefs` for these — a single `useRef` is enough. `useMergeRefs` only earns its keep when **both** the parent and the child also need a ref (see §7.2 below).

#### b) ModalHeader's "string OR node" title pattern (§4)

This is the single most copy-and-pasteable pattern in Chapter 9 for the bakery app. Anywhere you build a reusable card or modal, accept a `title` prop that can be either a string (default styling) or a node (full control). Examples:

- **Product card** for a cookie or pastry: most cards use `title="Lavender shortbread"`, but a featured product card might want `title={<HStack>...flower icon + name + caption...</HStack>}`.
- **Order confirmation modal** ("Order placed" with a celebratory flower next to the text).
- **Menu section headers** ("Sweet" / "Savory") — the default is just bold text, but a special section might inline a flower glyph.

The mechanism that makes it work — `<Text font="inherit">` inside the wrapper — is worth copying verbatim. It lets you tweak `font` / `fontSize` from the outside without dropping to the node form.

#### c) Empty placeholder for layout symmetry (§4.6)

The bakery's navbar and product cards almost certainly have "sometimes-present" elements — a back button on a sub-page, a discount badge on some products, a "new" tag. The CDS trick of rendering a same-sized invisible `<Box>` keeps the optical center stable when the element is absent. Worth using in:

- Product cards where some have a "new" or "sale" badge and some don't.
- Modal headers in the order flow that conditionally show a back button.
- The cookie sheep rig captions if a row sometimes has an action and sometimes doesn't.

#### d) The React 19 mental model itself

Your Next.js app is on React 19 (or will be soon). Two things from §1 will affect you whether you like it or not:

- **StrictMode double-mount in dev.** Any `useEffect(() => kickOffSomething(), [])` runs twice. If "kick off something" is "play an animation," "fetch data without an abort signal," "increment an analytics counter," or "set up a subscription without cleanup," you have a bug waiting. Defaults to "always write the cleanup, always make the side effect idempotent."
- **Ref-callback identity is observable.** If you ever write a ref-callback inline (`<div ref={(node) => ...}>`), wrap it in `useCallback` or pull it into `useMergeRefs`.

You don't need to memorize §2.7's detach/attach trace. You just need to recognize the symptom: *"my dev page hangs, the React error overlay says Maximum update depth exceeded, and a ref callback is involved."*

### 7.2 Situationally useful — only when the bakery app reaches that part

#### a) `useMergeRefs` for the cookie sheep rig

The cookie sheep rig (`cookie-sheep-rig.tsx`) measures sheep card positions to align the rig. If it ever needs to:

- expose a ref to the parent (e.g. for scroll syncing),
- *and* keep its own internal ref to measure itself,

…that's the textbook `useMergeRefs` case. The alignment-history file specifically calls out that pose math depends on accurate measurements — having a stable ref-callback there matters more than in most other components.

#### b) Declarative animation for the navbar flower

CLAUDE.md is explicit that the navbar flower is a core motif and that "chosen / completed" moments should reuse the same flower system instead of introducing new motifs. If you ever animate that — flower blooming on selection, petals settling on order placement — go declarative from day one:

```tsx
// good
const [bloomState, setBloomState] = useState<'idle' | 'blooming' | 'bloomed'>('idle');
<motion.svg animate={bloomState} variants={...} />

// avoid
const controls = useAnimation();
useEffect(() => { controls.start('bloom'); }, []);
```

The Toast PR (#607) exists *because* the imperative version broke under React 19 StrictMode. Don't replay that bug.

#### c) `onAnimationComplete` + Promise pattern

Mostly relevant if a component needs to expose `await thing.dismiss()` or `await thing.bloom()` to its parent — e.g., an order confirmation that says "play the flower bloom, then navigate to the receipt page." That's the §3.7 pattern. Probably not needed in the next two months, but flag it for later.

### 7.3 Overkill for now — interesting, file under "later"

#### a) The full Color Pairing Tool

Building an in-admin tool that extracts colors from a hero photo and snaps them to your bakery palette is *delightful* but unnecessary right now. **What is worth lifting from §5 today** is just the WCAG contrast formula:

```ts
function contrastRatio(hex1: string, hex2: string): number {
  // see §5.2.a — copy the luminance() and contrastRatio() helpers
}
```

You could use that as a one-time check in a script — verify that every pair in your bakery palette (cream/mocha, lavender/cream, brown/cream, etc.) clears 4.5:1 for body text and 3:1 for large text. Run it once, paste the results into a design-principles note, move on.

The hue-aware token matching, k-means extraction, and AA-enforcement-with-explanation are great references if you ever build a self-serve "match my Instagram aesthetic" tool for the admin. Not now.

#### b) `useMotionProps` style abstraction

CDS wrote `useMotionProps` because they have *many* components with enter/exit animations and didn't want every one of them learning framer-motion's exact prop shape. If the bakery has one or two animated components, just call framer-motion directly. If you ever hit five or six, that's the cue to wrap them.

### 7.4 What to actually do this week (if you wanted action items)

Not a to-do list — these are just the highest-leverage takeaways stated as actions:

1. When implementing form validation on the public storefront, use `useRef` + `.focus()` + `.select()` on the first invalid field. No new abstractions needed.
2. Run a one-time WCAG contrast audit script against your palette. Save the output to `documentation/design-principles/`.
3. Anywhere you build a reusable card / modal / section that takes a `title`, accept `string | React.ReactNode` and use the `font="inherit"` trick.
4. Anywhere you'd be tempted to write `useEffect(() => controls.start('enter'), [])`, write it declaratively with a `useState` instead.
5. If you ever see `Maximum update depth exceeded` in dev, check whether a ref-callback is being defined inline.

That's it. Most of Chapter 9 is "vocabulary so the next time you read CDS source you don't get lost" — which is exactly what `learning-from-cds/` is for. The four or five things above are the parts that actually pay rent in the bakery app today.

---

## 8. CDS internals — architecture patterns worth learning from

Looking past individual components, CDS has *structural* patterns that are worth studying even when you're not building a design system. These are about **how the codebase is organized** and **how components talk to each other**. Most of them scale down well to a small bakery app.

### 8.1 `useComponentConfig` — centralized, opt-in defaults

Almost every CDS component has this as its first line:

```tsx
export const Toast = forwardRef<...>(( _props, ref) => {
  const mergedProps = useComponentConfig('Toast', _props);
  const { text, action, ...rest } = mergedProps;
  // ...
});
```

`useComponentConfig` looks up a config registered at app boot via `<ComponentConfigProvider>`, merges it with the locally passed props, and returns the merged result. **Local props always win.** The store is zustand-backed and selector-driven, so changing the `Button` config doesn't re-render every `Toast`.

```tsx
// at app boot
<ComponentConfigProvider components={{
  Toast: { hideCloseButton: true, bottomOffset: 'var(--space-6)' },
  Button: { compact: true },
}}>
  <App />
</ComponentConfigProvider>

// every <Toast /> in the app is now compact-positioned with no close button by default
// any individual <Toast hideCloseButton={false} /> still wins
```

**Why it matters:** prop-drilling defaults across a tree is awful. Theme context handles colors, but you also want non-color defaults — "every modal in this app should restore focus on close," "every form input should be `compact` on mobile." This pattern gives you one register-once API for that.

**Bakery app translation:** if you find yourself repeating the same default prop on every `<MenuCard>` ("always elevation=1, always rounded='lg'"), one tiny `useCardConfig` hook + a provider at the storefront layout root removes that repetition. Don't build it until the duplication actually appears — but recognize the shape.

### 8.2 Compound components via Context

Notice this is *not* how `<Modal>` works in CDS:

```tsx
// NOT this
<Modal title="Order placed" body={<OrderDetails />} primaryAction={<Button>...</Button>} />
```

It's this:

```tsx
<Modal onRequestClose={close} visible={visible}>
  <ModalHeader title="Order placed" />
  <ModalBody>...</ModalBody>
  <ModalFooter primaryAction={<Button>...</Button>} />
</Modal>
```

The pieces look like siblings in JSX, but `<ModalHeader>` reads from `useModalContext()` to get `onRequestClose`, `accessibilityLabelledBy`, `hideDividers`, `hideCloseButton`. The parent `<Modal>` provides those values. From the consumer's perspective, the children "just work" — they don't need props threaded through.

```tsx
// packages/common/src/overlays/ModalContext.ts
export const ModalContext = createContext<ModalContextValue>({...});
export const useModalContext = () => useContext(ModalContext);

// Inside ModalHeader:
const { onRequestClose, accessibilityLabelledBy, hideCloseButton, hideDividers } = useModalContext();
```

**Why it matters:** the configuration prop explosion (`title`, `body`, `primaryAction`, `headerProps`, `bodyProps`, `footerActionsAlignment`, …) is a smell. Compound components let you build the same flexibility with **composition**: each piece is its own component with its own props. The context layer is the only "shared" knowledge.

**Bakery app translation:** anywhere you have a parent that needs to coordinate with arbitrary children — a multi-step order flow (`<OrderFlow><OrderStep/>...`), a tabbed product listing (`<Tabs><Tab/>...`), an accordion of FAQ items (`<FAQ><FAQItem/>...`) — reach for context-backed compound components instead of inventing a `steps={[...]}` prop.

### 8.3 The `common` / `web` / `mobile` package split

```txt
packages/
  common/          ← types, contexts, hooks, utilities (pure logic, no DOM, no react-native)
  web/             ← imports from common, renders DOM
  mobile/          ← imports from common, renders react-native
  web-visualization/, mobile-visualization/  ← charts split the same way
  mcp-server/      ← exposes docs to AI agents
```

`ModalContext` lives in `common`. `web/ModalHeader.tsx` and `mobile/ModalHeader.tsx` both consume the same context. The interface is shared; the rendering is platform-specific.

**Why it matters:** the boundary between "what is a Modal" (state + lifecycle + accessibility contract) and "how does a Modal *look* on web vs mobile" is real. CDS makes the boundary a package boundary so you literally cannot import DOM things into `common` — the build fails.

**Bakery app translation:** you won't have a mobile app. But the same lesson applies at a smaller scale: keep your *logic* (validation rules, cart math, currency formatting, the cookie sheep alignment math) in files that import nothing UI-specific. Then your UI components just orchestrate. Right now `cookie-sheep-geometry.ts` already follows this — pure math file. Apply the same separation to anything else that's tempting to write inline in a component.

### 8.4 `useIsoEffect` — SSR safety in five lines

```ts
import { useEffect, useLayoutEffect } from 'react';
import { isBrowser } from '../utils/browser';

export const useIsoEffect = isBrowser() ? useLayoutEffect : useEffect;
```

`useLayoutEffect` warns when run on the server (because there's no layout to read). `useEffect` is fine on the server but fires *after* paint, which causes flicker for measurement-driven UIs. CDS picks the right one at module load time based on environment.

**Bakery app translation:** you're using Next.js with App Router and Server Components. Anywhere you measure DOM (the cookie sheep rig, a sticky header) and want no flicker, use a hook like this. Five lines. Pattern: **detect environment once, swap the underlying primitive, expose one hook to consumers.**

### 8.5 `useSyncExternalStore` for breakpoints

`useBreakpoints` (full file in §earlier reference) is the textbook React 18+ subscription hook — `useSyncExternalStore` with three callbacks: `subscribe`, `getSnapshot`, `getServerSnapshot`. Three things to notice:

1. **The breakpoints update via real `MediaQueryList` listeners**, not a resize-event poll. Cheap, browser-native.
2. **The hook returns an object with all breakpoint flags** (`isPhone`, `isTablet`, …) at once. Components destructure what they need.
3. **There's a `getServerSnapshot` arm** for SSR, defaulting to "all false" — predictable initial render with no hydration mismatch.

```tsx
// Usage in PopoverPanel:
const { isPhone } = useBreakpoints();
return isPhone && enableMobileModal ? <MobilePanel /> : <FloatingPanel />;
```

**Why it matters:** CSS media queries are great for *styling*, but they can't change *which component tree renders*. Sometimes you need that — the PopoverPanel example in §5 of Chapter 9 (yes, it's in here twice for a reason) renders a fundamentally different tree on phone vs desktop.

**Bakery app translation:** if the storefront has any "this is a totally different layout on mobile" moment (e.g., the cookie sheep rig collapses to a vertical list on phone), `useSyncExternalStore` with `matchMedia` is the right primitive. Don't use a window-resize event listener with debouncing — `matchMedia` is built for this.

### 8.6 Small composable hooks

CDS has dozens of small one-purpose hooks in `packages/web/src/hooks/`. A sample:

- `useClickOutside(callback, { ref, excludeRefs })` — wires up a `mousedown` listener, calls back when the click is outside the ref'd element. Returns the ref so you can spread or re-use it.
- `useHasMounted()` — `false` on SSR + first client render, `true` after `useEffect`. One-liner for "render only on client."
- `useIsBrowser()` — `typeof window !== 'undefined'`. Self-explanatory but used everywhere.
- `useScrollBlocker()` — locks body scroll while a modal is open.
- `useDimensions()` — measures an element with `ResizeObserver`.
- `useEventHandler(handler)` — keeps a stable reference to a handler whose body is allowed to change between renders. Solves "I want my callback in `useEffect` deps but I don't want the effect to re-run."

**The architecture lesson** is the size and shape of each hook:

```txt
- one job per hook
- small files (5–50 lines, often)
- well-typed inputs and outputs
- they compose in components, not inside other hooks (mostly)
- hooks live next to their tests in __tests__/
```

This is the opposite of "one giant `useApp` hook." Each component imports the three or four hooks it needs.

**Bakery app translation:** you'll naturally start collecting little hooks — `useFormatPrice`, `useMenuFilter`, `useSheepAlignment`, `useFocusFirstError`. Resist the urge to put them in a single `hooks.ts` file. One hook per file. Tests next to source. You'll thank yourself in three months.

### 8.7 Folder organization by concept

```txt
packages/web/src/
  layout/          ← Box, HStack, VStack, Spacer
  typography/      ← Text, Heading
  controls/        ← TextInput, Checkbox, Switch
  buttons/         ← Button, IconButton, ButtonGroup
  overlays/        ← Modal, Toast, Popover, Tooltip
  motion/          ← ColorSurge, useMotionProps
  system/          ← providers, polymorphism plumbing, low-level helpers
  hooks/           ← cross-cutting hooks
  core/            ← types, polymorphism
  styles/          ← tokens, media queries, themes
  utils/           ← pure helpers
```

Notice what's *not* here:

- No `components/` mega-folder. Components are grouped by concept (layout vs control vs overlay), not lumped under "components."
- No `helpers/` graveyard. Utilities live next to what uses them when possible (`overlays/Portal.tsx`), and only escape to `utils/` when they're truly generic.
- No "smart vs dumb" separation. Components and hooks live together if they're conceptually one thing.

**Bakery app translation:** your `src/` folder will eventually have `components/`, `lib/`, `app/`. Inside `components/`, group by **what the customer experiences** (`menu/`, `order-flow/`, `cookie-rig/`, `cart/`), not by **what kind of file it is** (`buttons/`, `forms/`, `cards/`). The CDS folder shape works *because* CDS is a design system; the underlying *principle* — folder boundaries match conceptual boundaries — applies anywhere.

### 8.8 The `BaseProps` / `Props` typing pattern

Every CDS component exports two prop types:

```ts
export type ToastBaseProps = CommonToastBaseProps & {
  hideCloseButton?: boolean;
  closeButtonAccessibilityProps?: SharedAccessibilityProps;
};

export type ToastProps = ToastBaseProps & Omit<BoxProps<BoxDefaultElement>, 'children'>;
```

`BaseProps`:
- the **conceptual** props this component cares about
- used by other components when they extend / wrap this one
- doesn't include the universe of HTML attributes

`Props`:
- `BaseProps` plus all the underlying element's props
- this is what consumers see in the public API
- so consumers can pass `style`, `className`, `data-*`, ARIA attributes, event handlers, etc.

**Why it matters:** without this split, every `extends ToastProps` would inherit the entire HTML attribute zoo, exploding type checks and autocomplete. `BaseProps` keeps the composition surface small; `Props` keeps the consumer surface complete.

**Bakery app translation:** for any reusable component (`<MenuCard>`, `<ProductTile>`, `<FlowerGlyph>`), think of these two surfaces. Sometimes you only need `Props`. Sometimes you'll wrap your own component in another (`<FeaturedMenuCard>` extends `<MenuCard>`), and you'll be glad `BaseProps` exists then.

### 8.9 `SharedAccessibilityProps` — one a11y vocabulary across web and mobile

```ts
type SharedAccessibilityProps = {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  // ...
};

// web ModalHeader maps:
<IconButton
  accessibilityLabel={closeAccessibilityLabel}
  // → renders aria-label="..."
/>

// mobile ModalHeader maps the same prop name to:
// → renders accessibilityLabel="..." (react-native's prop)
```

The component API uses one name (`accessibilityLabel`); each platform translates it. The web version maps to `aria-label`, the mobile version maps to react-native's `accessibilityLabel`.

**Why it matters:** designers and product engineers shouldn't have to learn two vocabularies for "the same thing." One name, two implementations.

**Bakery app translation:** less directly applicable since you're web-only. But the *principle* — **stable consumer-facing prop names that hide implementation differences** — is exactly how good UI APIs age. If you ever rip out the form library, the customer-facing prop `<EmailField requiredHint="Enter a valid email" />` shouldn't change just because the backend hint mechanism did.

### 8.10 Co-location of stories and tests

Inside any CDS component folder:

```txt
overlays/modal/
  Modal.tsx
  ModalHeader.tsx
  ModalBody.tsx
  ModalFooter.tsx
  ModalWrapper.tsx
  __stories__/
    Modal.stories.tsx
    ModalCustomHeader.stories.tsx
  __tests__/
    Modal.test.tsx
    ModalHeader.test.tsx
```

Stories and tests live **next to the source they exercise**. Not in a top-level `tests/` or `stories/` mirror.

**Why it matters:**

- Renaming `Modal.tsx` is one folder-level change, not three.
- Reviewers look at the diff and immediately see source + story + test in the same patch.
- Discoverability: opening any folder, you know what's tested and what story examples exist.

**Bakery app translation:** you already have a `tests/` folder (Vitest + Playwright). Vitest tests can absolutely live next to source as `Component.test.tsx`. Mixing patterns is fine — Playwright e2e tests in `tests/` make sense, but unit tests benefit from co-location.

### 8.11 Memoization discipline

Look at any complex CDS component and you'll see the same shape:

```tsx
export const Toast = memo(
  forwardRef<...>((_props, ref) => {
    const mergedProps = useComponentConfig('Toast', _props);
    // ...
    const handleClose = useCallback(() => { ... }, [onWillHide]);
    const handleAnimationComplete = useCallback((d) => { ... }, [onDidHide]);
    useImperativeHandle(ref, () => ({ hide: handleClose }), [handleClose]);
    // ...
  })
);
```

The discipline:

- **`memo` wraps the component** so a parent re-rendering with the same props doesn't re-run the body.
- **`useCallback` for any function that flows down as a prop** (event handlers, ref callbacks).
- **`useMemo` for any computed object that flows down** (the `memoizedContent` in `PopoverPanel`).
- **Dependency arrays are accurate.** Not "everything" and not "nothing" — exactly the things the body reads.

This isn't paranoid optimization; it's the **price of admission** for components that get used 50+ times per page and live inside performance-sensitive trees (charts, lists, modals with overlays).

**Bakery app translation:** for one-off page components (`<HomePage>`, `<MenuPage>`), don't bother. For the cookie sheep rig, the navbar (re-renders on route changes), and any component you'll use repeatedly inside a list (`<MenuCard>` in a grid of 20 cookies) — yes, follow the discipline. Always-`memo` is wrong; never-`memo` is also wrong.

---

## 9. Architecture takeaways for the bakery app

```txt
useComponentConfig pattern:
  → if you ever repeat a default prop on every <MenuCard>, extract a config provider
  → don't build until the repetition shows up

Compound components via context:
  → use for OrderFlow, Tabs, Accordion, FAQ, anything with arbitrary children
  → avoid the "config object prop" smell

common / web / mobile split:
  → at small scale: keep pure-logic files (math, formatting, validation) UI-free
  → cookie-sheep-geometry.ts already does this

useIsoEffect:
  → useLayoutEffect on browser, useEffect on server
  → use for any flicker-sensitive measurement in your Next.js app

useSyncExternalStore for breakpoints:
  → preferred over window-resize listeners
  → handles SSR with getServerSnapshot

Small composable hooks:
  → one job per hook, one file each
  → tests next to source

Folder organization by concept, not by file type:
  → menu/, order-flow/, cookie-rig/, cart/
  → not buttons/, forms/, cards/

BaseProps vs Props:
  → BaseProps = composition surface
  → Props = full consumer API including the underlying element's HTML attrs

SharedAccessibilityProps idea:
  → stable consumer prop names that hide implementation churn

Co-location:
  → unit tests live next to source as Component.test.tsx
  → keep Playwright e2e in tests/

Memoization discipline:
  → memo + useCallback + useMemo for repeat-use components only
  → not paranoia, not free; pick deliberately
```

The deepest lesson across all of these: **CDS treats the design system itself as a product**. Every architectural decision serves consumers (other engineers) the way a good API serves users. Stable surfaces, predictable behavior, escape hatches when you need them, opinionated defaults when you don't. You can apply that mindset at any scale — even a one-person bakery storefront benefits from treating "the bakery's component library" as something with a public API, even if the only consumer is future-you.
