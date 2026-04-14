# CDS animation learnings 01

Scope: local CDS repo deep dive focused on animation-related implementation patterns from the docs site and adjacent runtime helpers.

Primary files sampled:
- `C:\Users\zhang\00My Stuff\Coding\Learning\cds\apps\docs\src\components\home\AnimatedHero\HeroGrid.tsx`
- `C:\Users\zhang\00My Stuff\Coding\Learning\cds\apps\docs\src\components\home\AnimatedHero\constants.ts`
- `C:\Users\zhang\00My Stuff\Coding\Learning\cds\apps\docs\src\components\home\AnimatedHero\styles.module.css`
- `C:\Users\zhang\00My Stuff\Coding\Learning\cds\apps\docs\src\components\kbar\KBarAnimator.tsx`
- `C:\Users\zhang\00My Stuff\Coding\Learning\cds\apps\docs\src\components\page\LottieSheet\index.tsx`
- `C:\Users\zhang\00My Stuff\Coding\Learning\cds\apps\docs\src\theme\Navbar\Layout\styles.module.css`
- `C:\Users\zhang\00My Stuff\Coding\Learning\cds\apps\docs\src\theme\DocRoot\Layout\Sidebar\index.tsx`
- `C:\Users\zhang\00My Stuff\Coding\Learning\cds\apps\docs\src\theme\DocRoot\Layout\Sidebar\styles.module.css`
- `C:\Users\zhang\00My Stuff\Coding\Learning\cds\apps\docs\src\theme\DocRoot\Layout\Sidebar\ExpandButton\styles.module.css`
- `C:\Users\zhang\00My Stuff\Coding\Learning\cds\apps\docs\src\theme\ReactLiveScope\index.tsx`

Rule for future notes: the next batch should start at 51 and should not repeat anything already captured here.

1. CDS uses different animation systems for different jobs instead of forcing one library everywhere.
2. `@react-spring/web` is used where the motion is numeric, stateful, and multi-element.
3. The animated hero separates spring factory functions from component rendering.
4. Animation constants live in a dedicated file instead of being buried inside JSX.
5. Character animation data is precomputed into indices before any spring starts.
6. Grid choreography is driven by geometry, not hand-authored per-cell delays.
7. Ripple delays are computed from Euclidean distance, not row or column order.
8. CDS explicitly forces character-set motion to progress forward rather than oscillate unpredictably.
9. Springs use `round: 1` when the animated value should land on discrete steps.
10. Periodic motion and hover motion have different spring configs.
11. Hover motion is intentionally much snappier than autoplay motion.
12. Looping hover animation is isolated to the single hovered cell.
13. Global autoplay state is kept in refs and intervals rather than forcing rerenders.
14. Current animation state that should survive renders is stored in refs, not state.
15. Animation entry points are wrapped in `useCallback` so orchestration stays stable.
16. The hero updates accessibility descriptions as the visible message changes.
17. Animated content is still keyboard-drivable.
18. Focus pauses autoplay so motion does not fight keyboard users.
19. Enter and Space trigger the same transition path as mouse interactions.
20. There is a real pause button inside the animated grid, not just silent autoplay.
21. Interactive controls are placed on a separate overlay layer above the animation.
22. The overlay layer has `pointer-events: none`, and only the actual control restores pointer events.
23. Focus-visible outlines are preserved even on animated surfaces.
24. Breakpoints alter animation affordances like icon size instead of scaling everything blindly.
25. CDS starts recurring animation on mount and always tears it down on unmount.
26. Height animation in `KBarAnimator` uses the Web Animations API directly instead of another React abstraction.
27. DOM measurement is handled with `ResizeObserver` before animating height.
28. Previous measured height is stored so height transitions have a real `from` value.
29. Nested action changes in KBar get a tiny bump animation rather than a full layout reset.
30. First-render guards are used so transitional motion does not fire on mount by accident.
31. WAAPI durations are derived from passed animation options rather than hardcoded everywhere.
32. Small supporting animations use a short keyframe array instead of introducing a larger dependency.
33. CDS exposes Lottie through a wrapper component rather than scattering raw player usage.
34. Lottie browsing is treated as a product tool, with search, copy, and toast feedback.
35. Search updates for the Lottie gallery are throttled so animation browsing stays cheap.
36. Long lists of animated tiles are scrollable inside bounded containers.
37. Motion-heavy demo UIs are boxed and padded so animation is framed deliberately.
38. Navbar hide/show uses a single transform transition.
39. When the navbar hides, it moves with `translate3d`, which keeps it compositor-friendly.
40. CDS comments when it knowingly uses a lower-performance property, instead of doing it silently.
41. Sidebar width animation is only used where the visual effect depends on it.
42. Reduced-motion mode gets explicit logic, not just CSS afterthoughts.
43. CDS accounts for cases where `transitionend` never fires under reduced motion.
44. Transition-end handlers verify the event target before mutating state.
45. Sticky positioning is preferred over scroll listeners when motion is really about attachment.
46. Hover affordances on utility controls are subtle, often just background-color changes.
47. Animation packages and motion primitives are centrally exposed in the live scope for experimentation.
48. CDS treats animation assets and animation APIs as first-class exports, not ad hoc local hacks.
49. The overall motion system prioritizes controllability, accessibility, and cleanup over flash.
50. The strongest CDS animation lesson is architectural: animate one coherent system per interaction, not multiple loosely synchronized effects pretending to be one thing.
