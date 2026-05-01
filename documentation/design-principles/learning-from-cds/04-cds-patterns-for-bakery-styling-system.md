# CDS Patterns For Bakery Styling Stability

Date: 2026-04-28

Scope: learning note only. This is Chapter 4 after `03-cds-engineering-patterns-worth-learning.md`.

This chapter looks at CDS again, but with one question in mind:

```txt
Which CDS ideas could help this bakery app stop regressing whenever styling changes are requested?
```

The short answer:

```txt
the app does not mainly need more CSS tricks
it needs more named styling contracts
```

Right now many styling decisions live directly inside large components, long class strings, route-level selectors, image positioning classes, and scenery-specific maps. That gives the app a lot of visual personality, but it also means small styling edits can accidentally affect unrelated surfaces.

CDS is useful because it shows how a respected design system reduces styling risk:

```txt
name repeated concepts
put values behind contracts
publish theme values through a provider
make common layout and asset rendering reusable
give components named customization slots
```

## Source Files Sampled

CDS files sampled:

- `packages/web/src/system/ThemeProvider.tsx`
- `packages/web/src/core/createThemeCssVars.ts`
- `packages/web/src/styles/styleProps.ts`
- `packages/web/src/layout/Box.tsx`
- `packages/web/src/media/RemoteImage.tsx`
- `packages/web/src/media/Avatar.tsx`
- `packages/web/src/icons/Icon.tsx`
- `packages/web/src/illustrations/createIllustration.tsx`
- `packages/web/src/system/MediaQueryProvider.tsx`
- `packages/web/src/AccessibilityAnnouncer/AccessibilityAnnouncer.tsx`

Bakery app files sampled:

- `src/providers/Theme/index.tsx`
- `src/app/(app)/globals.css`
- `src/app/(app)/menu/_components/catering-menu-scenery.tsx`
- `src/app/(app)/menu/_components/catering-menu-hero.css`
- `src/app/(app)/menu/_components/catering-menu-panels.tsx`
- `src/app/(app)/menu/_components/cookie-sheep-geometry.ts`
- `src/components/flowers/FlowerSprite.tsx`
- `src/components/flowers/FlowerCluster.tsx`
- `src/components/Header/NavFlowerAccent.tsx`
- `src/components/Footer/FooterClient.tsx`
- `src/components/Header/index.client.tsx`
- `src/components/Header/index.css`
- `src/components/Media/Image/index.tsx`
- `ai-instructions/design-stuff/flower-idea/flower-color-palette.md`
- `ai-instructions/AGENTS.md`

## 1. The Current Styling Pain Is A Contract Problem

When you ask Codex to do things like:

```txt
move this button
make this background bigger
align these flowers
make the footer fit the new scene
make the hero banner reusable
change the persuasion panel styling
```

there are usually too many possible places to edit:

```txt
component className strings
inline style objects
global CSS variables
body:has(...) selectors
scene-specific CSS classes
Next Image props
decorative asset maps
responsive media queries
state transition logic
```

That is why regressions are likely. The instruction sounds simple, but the system does not always have one obvious styling contract that owns the decision.

CDS reduces this kind of problem by making styling decisions flow through named layers:

```txt
ThemeVars
  allowed design words

theme object
  real values for those words

ThemeProvider / ThemeManager
  publishes those values to the tree as CSS variables and context

Box / Text / Pressable / Button
  consume those values through stable props
```

The equivalent lesson for the bakery app is not "copy CDS exactly."

The useful lesson is:

```txt
make styling changes target named app concepts
instead of raw CSS details scattered across files
```

## 2. Styling Surface Contracts

A surface is a visible area of UI.

Examples in this app:

```txt
hero banner
persuasion panel
footer
header
cookie card
gallery card
scene chooser popover
glass button
```

Right now those surfaces often get styled directly:

```tsx
<section className="relative overflow-hidden rounded-[2rem] border border-[#d6a15f]/60 bg-[#fff8ea]/90 shadow-[0_24px_60px_rgba(87,44,13,0.18)]">
  ...
</section>
```

That works visually, but it is hard to maintain because the component owns many decisions at once:

```txt
shape
border
background
shadow
spacing
overflow
responsive behavior
scene compatibility
```

A CDS-style contract would name the surface:

```tsx
<SceneSurface tone="persuasion" scenery="moonlit">
  ...
</SceneSurface>
```

Or:

```tsx
<BakeryPanel variant="persuasion" scene={activeScenery}>
  ...
</BakeryPanel>
```

The key difference:

```txt
raw CSS version:
  every caller can reinvent what a persuasion panel looks like

contract version:
  persuasion panel styling has one home
```

This is useful for Codex too. If the request is "make all persuasion panels roomier," the edit should happen in the `persuasion` surface contract, not in random nested class strings.

## 3. Scene Themes Are Already Half-Built In The App

The bakery app already has a scenery concept:

```txt
dawn
under-tree
moonlit
classic
blossom
fairy-castle
```

In `catering-menu-scenery.tsx`, there are many separate maps:

```txt
skyByScenery
mobileSkyByScenery
meadowByScenery
panelBackgroundByScenery
sceneButtonAuraByScenery
heroPiecesByScenery
panelPiecesByScenery
panelCloudsByScenery
persuasionWildflowersByScenery
persuasionGardenFlowersByScenery
```

That is already design-system thinking. The app is saying:

```txt
when the scene is moonlit, these assets and colors go together
when the scene is blossom, these assets and colors go together
```

The missing piece is that the contract is spread across many maps instead of one clearly named scene theme object.

A learning example:

```ts
type SceneTheme = {
  id: "moonlit" | "blossom" | "fairy-castle";
  label: string;
  assets: {
    sky: string;
    mobileSky?: string;
    meadow: string;
    clouds: string[];
    heroPieces: string[];
    panelPieces: string[];
    flowers: string[];
  };
  color: {
    panelFill: string;
    text: string;
    mutedText: string;
    actionAura: string;
    headerText: string;
  };
  layout: {
    meadowHeight: string;
    flowerSeam: string;
    heroCopyMaxWidth: string;
    panelMinHeight: string;
  };
  motion: {
    flowerDensity: number;
    cloudDrift: "calm" | "medium" | "dreamy";
  };
};
```

This is not magic. Humans still choose the values.

The improvement is that the choices are grouped by meaning:

```txt
moonlit scene
  owns its assets
  owns its colors
  owns its layout knobs
  owns its motion knobs
```

That would make "change scenery" more like CDS theming:

```txt
selected scene id
  -> find scene theme object
  -> publish scene CSS variables
  -> components consume variables and assets
```

## 4. ThemeProvider, But For Scenery

CDS `ThemeProvider` takes a human-authored theme object and an `activeColorScheme`.

Then it creates a runtime theme API:

```txt
themeApi = {
  ...theme,
  activeColorScheme,
  spectrum: theme.lightSpectrum or theme.darkSpectrum,
  color: theme.lightColor or theme.darkColor
}
```

Then `ThemeManager` wraps children in a div:

```tsx
<div className={cx(theme.id, theme.activeColorScheme, className)} style={themeCssVars}>
  {children}
</div>
```

That div is important because it scopes the theme.

The bakery equivalent could be a scene wrapper:

```tsx
<SceneThemeProvider scene={activeScenery}>
  <MenuHero />
  <PersuasionGardenPanel />
  <Footer />
</SceneThemeProvider>
```

Internally, it could publish:

```txt
data-scene="moonlit"
--scene-panel-fill
--scene-text
--scene-muted-text
--scene-action-aura
--scene-meadow-height
--scene-flower-seam
--scene-hero-copy-max-width
```

Then components can say:

```css
.persuasionPanel {
  background: var(--scene-panel-fill);
  color: var(--scene-text);
  min-height: var(--scene-panel-min-height);
}
```

This is more stable than broad global selectors like:

```css
body:has(.cateringScene-moonlit) .siteHeader {
  ...
}
```

The CDS lesson:

```txt
put theme values on the nearest meaningful wrapper
then let descendants consume scoped variables
```

That matters because the app has multiple themed regions:

```txt
global light/dark theme
menu scenery theme
cart scene shell
footer styling
hero and panel styling
```

Those should not all fight through global CSS.

## 5. Style Props Are A Translator, But The App May Only Need Recipes

CDS has a serious style-prop translator:

```tsx
<Box padding={4} background="bgPrimary" borderRadius="roundedLarge" />
```

CDS `getStyles` translates that into:

```txt
class names for known token values
inline CSS variables for arbitrary dynamic values
responsive class names for phone/tablet/desktop values
```

For this bakery app, copying the whole CDS style-prop engine would probably be too much.

But the app could learn the smaller idea:

```txt
make repeated layout choices into named recipes
```

Example recipes:

```txt
hero-copy
hero-actions
persuasion-panel
footer-shell
footer-link-row
scene-chooser
gallery-face
flower-rail
```

Instead of this:

```tsx
<div className="flex flex-col items-center gap-4 px-5 py-7 text-center md:items-start md:text-left">
```

the app could eventually express the intent:

```tsx
<SceneStack recipe="hero-copy">
```

or:

```tsx
<SceneActionRow placement="hero">
```

The benefit is not shorter code by itself.

The benefit is:

```txt
when hero action alignment changes
there is one recipe to edit
```

That is the same reason CDS has `Box`, `HStack`, `VStack`, and `Text`: common layout intentions get names.

## 6. Slot APIs For Complex Components

CDS components often expose `classNames` and `styles` objects with named slots.

Example shape:

```tsx
<Icon
  name="home"
  classNames={{
    root: "myIconRoot",
    icon: "myIconGlyph",
  }}
  styles={{
    root: { opacity: 0.8 },
    icon: { transform: "translateY(1px)" },
  }}
/>
```

The important part is not the exact syntax.

The important part is that CDS names the internal pieces:

```txt
root
icon
media
content
footer
```

That helps because callers customize the correct part of a component.

The bakery app has complex components where this would help:

```txt
PersuasionGardenPanel
MenuHero
Footer
Header
cookie flavor cards
scene chooser
decorative asset groups
```

For example, a future `PersuasionGardenPanel` API might expose:

```ts
type PersuasionGardenPanelClassNames = {
  root?: string;
  sky?: string;
  meadow?: string;
  content?: string;
  actionRow?: string;
  galleryFace?: string;
  detailFace?: string;
  flowerLayer?: string;
  cloudLayer?: string;
};
```

That is better than giving Codex one giant component and saying "move the button," because the button likely lives inside a named `actionRow`.

The lesson:

```txt
large visual components should have named internal regions
```

## 7. CDS Asset Patterns: Images, Icons, And Illustrations

CDS does not have a flower-scene asset system like this bakery app.

But CDS does have useful patterns for rendering assets safely.

### RemoteImage

`RemoteImage` wraps image rendering behind a stable API:

```tsx
<RemoteImage
  source={imageUrl}
  shape="circle"
  size="m"
  resizeMode="cover"
/>
```

It owns:

```txt
object-fit cover/contain
shape border radius
fallback background
default width/height from size tokens
data-shape attribute
alt default
```

The bakery lesson:

```txt
do not render every decorative PNG/SVG as a custom one-off
make a SceneAsset primitive own the defaults
```

### Icon

CDS `Icon` does something quietly smart.

It accepts a design-system size:

```tsx
<Icon name="home" size="m" />
```

Then it chooses a source glyph size internally:

```ts
if iconSize <= 12, use 12px source
if iconSize <= 16, use 16px source
otherwise, use 24px source
```

That means the caller does not need to know which internal asset file should be used.

The bakery lesson:

```txt
flower, cloud, sparkle, and logo assets could have public sizes
but the primitive chooses the best underlying image source
```

Example:

```tsx
<SceneAsset name="cloud-soft" size="xl" />
<SceneAsset name="rose-sprig" size="s" />
```

The caller asks for meaning and size. The asset primitive decides rendering details.

### createIllustration

CDS `createIllustration` creates a component from:

```txt
variant
name
version config
active color scheme
default dimensions
optional scale multiplier
```

It builds the image URL from those inputs.

The bakery lesson:

```txt
scene assets can come from a registry
instead of raw paths scattered across components
```

Example learning shape:

```ts
const sceneAssetRegistry = {
  moonlit: {
    sky: {
      desktop: "/media/scenes/moonlit/sky-desktop.png",
      mobile: "/media/scenes/moonlit/sky-mobile.png",
      fit: "cover",
      objectPosition: "center top",
    },
    flowers: {
      roseSprig: {
        src: "/media/scenes/moonlit/rose-sprig.png",
        defaultSize: "m",
        defaultLayer: "foreground",
      },
    },
  },
};
```

This would help with both alignment and rendering.

Why?

Because a registry can store facts like:

```txt
natural aspect ratio
default fit
default object-position
decorative vs meaningful
preferred layer
mobile replacement source
eager vs lazy loading
```

Those facts currently tend to live wherever the image is rendered.

## 8. A Bakery SceneAsset Primitive Would Be Very Useful

The app already has useful asset pieces:

```txt
Media
Image
DecorativeSceneImage
FlowerSprite
renderSceneImage
preloadSceneryAssets
```

The issue is that these ideas are not yet one shared asset contract.

A future `SceneAsset` primitive could teach the app a consistent language:

```tsx
<SceneAsset
  name="meadow"
  layer="background"
  fit="cover"
  priority
/>

<SceneAsset
  name="flower"
  tone="rose"
  layer="foreground"
  motion="gentle-bob"
  decorative
/>

<SceneAsset
  name="castle"
  layer="midground"
  fit="contain"
  objectPosition="center bottom"
/>
```

This is where SVG and PNG alignment can become less painful.

A good asset primitive can own:

```txt
positioning mode:
  absolute, inline, background layer

fit:
  cover, contain, none

anchor:
  top, bottom, center, left, right

layer:
  sky, meadow, foreground, decorative overlay, content-adjacent

motion:
  none, gentle-bob, drift, twinkle

accessibility:
  decorative assets get aria-hidden and empty alt
  meaningful images get real alt text

rendering:
  responsive source
  object-position
  sizes
  priority/eager loading
  fallback
```

CDS does not solve flowers specifically. But CDS shows the pattern:

```txt
asset rendering deserves its own component API
```

That is very relevant for this app.

## 9. Responsive Behavior Should Be Centralized

CDS has `MediaQueryProvider`.

It creates a central store for media queries:

```txt
subscribe(query, callback)
getSnapshot(query)
getServerSnapshot(query)
```

It also has server-render defaults, so responsive behavior can be more predictable before the browser fully hydrates.

The bakery app currently has a lot of responsive behavior in:

```txt
CSS media queries
image mobileSrc choices
manual resize listeners
scene-specific layout overrides
flower spawn counts
asset object-position rules
```

That is normal for a visual app, but it can get fragile.

The CDS lesson:

```txt
viewport decisions should become reusable data
not random window resize logic in each component
```

For the bakery app, responsive scene data might look like:

```ts
type ResponsiveSceneSettings = {
  flowerDensity: {
    phone: number;
    tablet: number;
    desktop: number;
  };
  heroCopyPlacement: {
    phone: "center";
    desktop: "left" | "right" | "center";
  };
  meadowHeight: {
    phone: string;
    desktop: string;
  };
};
```

Then the app can ask:

```txt
what should the scene density be for this viewport?
what should the hero layout be for this viewport?
which sky image should this viewport use?
```

instead of each component inventing that logic.

## 10. Existing Bakery Algorithms Are Worth Promoting

The bakery app already has good algorithmic work.

The problem is not that the app lacks clever logic. The problem is that some of the logic is hidden inside large visual components.

### Cookie Sheep Geometry

`cookie-sheep-geometry.ts` is a strong example.

It turns clock-like positions into CSS placement:

```txt
12:00 means top
3:00 means right
6:00 means bottom
9:00 means left
```

Then it converts that into:

```txt
left percentage
top percentage
rotation
part size
mirrored placement
parallel legs
```

That is good design-system thinking because the geometry rule has a home.

The lesson:

```txt
visual placement rules are less fragile when they live in named geometry helpers
```

### Seeded Flowers

The menu scenery code has seeded flower placement.

That is valuable because deterministic decoration means:

```txt
the same scene can feel organic
without randomly shifting on every render
```

The logic includes ideas like:

```txt
hash a stable key
create a seeded random generator
pick positions within ranges
derive scale, tilt, duration, and delay
```

This deserves to be treated like a scene motion system:

```txt
sceneGeometry
sceneMotion
sceneAssetPlacement
```

instead of being only panel-local logic.

### Asset Preloading

`preloadSceneryAssets` already collects scene assets and creates browser images with async decoding.

That is a real rendering performance idea.

The CDS-inspired next step would be:

```txt
asset registry says which assets belong to each scene
preloader reads registry
scene provider preloads the active or next likely scene
```

### Panel Transitions

`PersuasionGardenPanel` uses a transition idea with phases like:

```txt
idle
closing
opening
```

That is basically a small state machine.

The lesson:

```txt
complex UI transitions should be named states
not just scattered timeout calls
```

If this panel becomes shared, the transition behavior should probably become a small helper or hook.

## 11. Accessibility Announcements For Scene Changes

CDS `AccessibilityAnnouncer` is a visually hidden live region.

It receives a message:

```tsx
<AccessibilityAnnouncer message="Scenery changed to Moonlit" />
```

Then it clears the message after a short time so screen readers can announce repeated updates reliably.

This is relevant because the bakery app has user-facing visual changes:

```txt
change scenery
switch persuasion panel face
open gallery
close gallery
maybe select a menu category
```

Not every decorative animation needs an announcement.

But important state changes should be explainable to assistive technology.

The CDS lesson:

```txt
visual state changes often need a parallel accessibility message
```

## 12. Controlled And Uncontrolled State Contracts

CDS components often guard their state APIs.

For example, when a component can be controlled from outside, CDS checks that paired props are provided together:

```txt
if open is provided, setOpen should also be provided
if setOpen is provided, open should also be provided
```

This prevents half-controlled components.

The bakery app has stateful UI that could eventually benefit from this pattern:

```txt
scene chooser open state
active scenery
persuasion panel face
gallery open/closed state
selected flavor/category
```

The lesson:

```txt
shared components should make ownership of state explicit
```

If a parent owns the state, pass both value and setter.

If the component owns the state, do not pretend the parent owns half of it.

## 13. What I Would Not Copy From CDS

Do not copy the full CDS system all at once.

That would be too much for this app right now if it means building every CDS abstraction before improving the actual app.

But after looking at the current styling pain, I do think the migration cost is probably worth it if the app copies the shape of the CDS system more seriously:

```txt
typed token vocabulary
human-authored theme objects
ThemeProvider-style wrapper
ThemeManager-style CSS variable publisher
style translation layer
shared primitives
higher-level scene components
asset rendering contracts
```

That is different from copying every Coinbase feature. The app can be much smaller than CDS while still using the same architectural idea.

I would not start with:

```txt
a complete Coinbase-sized style-prop compiler
a full token-extension API
a giant monorepo-style design package
Coinbase visual styling
over-abstracting every single decorative element
```

The better learning path is:

```txt
copy the contract thinking first
then implement the smallest useful machinery
```

The app needs a stable styling system for its own domain:

```txt
bakery scenes
hero banners
persuasion panels
footer surfaces
decorative flowers
scene-aware buttons
gallery cards
```

That is different from Coinbase's product UI, but the engineering pattern transfers well.

## 14. Highest-Value Patterns For This App

If these ideas were applied later, this is the order that seems most useful.

### 1. Create A Scene Theme Contract

Unify scattered scenery maps into a typed scene theme shape.

This would help:

```txt
change scenery
hero styling
panel styling
footer styling
header styling
asset selection
responsive scene layout
```

### 2. Publish Scene CSS Variables On A Wrapper

Use a scene wrapper the way CDS uses `ThemeManager`.

Possible variables:

```txt
--scene-panel-fill
--scene-text
--scene-muted-text
--scene-action-aura
--scene-meadow-height
--scene-flower-seam
--scene-hero-copy-max-width
```

This would reduce global `body:has(...)` scene rules.

### 3. Create Surface Components

Start with the repeated visual surfaces:

```txt
SceneSurface
SceneButton
SceneActionRow
SceneCard
FooterSurface
HeroSurface
```

These should encode repeated styling decisions, not just wrap divs.

### 4. Create A SceneAsset Primitive

Unify decorative image behavior:

```txt
PNG
SVG
Next Image
responsive source
object fit
object position
layering
motion variables
decorative accessibility
fallback
priority/loading behavior
```

This is probably the most relevant CDS asset lesson.

### 5. Move Algorithms Into Named Helpers

Promote existing algorithms:

```txt
seeded flower placement
flower motion styles
cloud spawn positions
asset preloading
panel transition phases
cookie sheep geometry
```

This makes the visual system easier to modify without breaking it.

### 6. Add Slot APIs To Complex Components

For components like persuasion panels, expose named slots:

```txt
root
content
actionRow
gallery
detail
sky
meadow
flowers
clouds
```

Then future styling changes can target one slot.

## 15. Translation Table

| CDS concept | What it means | Bakery equivalent worth learning |
| --- | --- | --- |
| `ThemeVars` | allowed token vocabulary | `SceneThemeVars` for scene colors, layout, motion, assets |
| theme object | real values for the vocabulary | one object per scenery |
| `ThemeProvider` | chooses active theme data | `SceneThemeProvider` chooses active scenery data |
| `ThemeManager` | publishes CSS vars on a wrapper | scene wrapper publishes `--scene-*` vars |
| `Box` | general layout primitive | `SceneBox` or smaller layout recipes if needed |
| `HStack` / `VStack` | named flex direction | `SceneActionRow`, `HeroStack`, `FooterStack` |
| `RemoteImage` | image rendering primitive | `SceneAsset` / `DecorativeAsset` |
| `Icon` source-size logic | caller asks for size, component chooses source | flower/cloud/logo asset variants chosen internally |
| `createIllustration` | registry-driven image URL creation | scene asset registry |
| `MediaQueryProvider` | centralized responsive query store | scene density and layout breakpoint provider |
| `AccessibilityAnnouncer` | screen-reader announcement system | announce scenery/gallery/panel changes |
| `classNames` / `styles` slots | named internal customization points | named slots for hero, persuasion panel, footer, asset layers |

## 16. Flower Colors As Primitive Tokens

The flower palette currently lives in `ai-instructions/design-stuff/flower-idea/flower-color-palette.md`.

Those colors are good examples of primitive tokens.

Primitive tokens are the raw Lego pieces. They do not yet say where the color should be used.

Current flower and grass primitive values:

```ts
const bakeryPrimitiveColor = {
  grassSunlit: "#cfd015",
  grassShadow: "#0e1700",

  flowerPetalEmber: "#e84a03",
  flowerCenterEmber: "#7a2100",

  flowerPetalPlum: "#42222d",
  flowerCenterPlum: "#221c02",

  flowerPetalGolden: "#ba991d",
  flowerCenterDeepGreen: "#060f00",

  flowerPetalPoppy: "#dc2742",
  flowerCenterOlive: "#656600",

  sunYellow: "#e6c439",
};
```

Those names are intentionally descriptive, not semantic yet.

This is primitive:

```txt
flowerPetalEmber = #e84a03
```

This is semantic:

```txt
scene.flower.primaryPetal = flowerPetalEmber
```

This is component-specific:

```txt
navbarFlower.selected.petals = scene.flower.primaryPetal
```

That is the layered token idea again:

```txt
primitive token:
  what exact color exists?

semantic token:
  what role does that color play in this theme or scene?

component token:
  which semantic role does this component use?
```

For example:

```ts
const dawnSceneTheme = {
  primitive: bakeryPrimitiveColor,
  color: {
    meadowSunlit: "grassSunlit",
    meadowShadow: "grassShadow",
    flowerAccent: "flowerPetalEmber",
    flowerAccentCenter: "flowerCenterEmber",
    navigationSun: "sunYellow",
  },
  component: {
    navFlower: {
      petal: "flowerAccent",
      center: "flowerAccentCenter",
    },
    meadow: {
      foregroundGrass: "meadowSunlit",
      deepGrass: "meadowShadow",
    },
  },
};
```

The point is not that these exact names are final.

The point is that the app should not scatter `#e84a03` in random CSS. It should say what the value is doing.

## 17. A More CDS-Like Token Architecture For The Bakery App

If the app wants to copy CDS more closely, the token stack could look like this.

### Layer 1: Primitive Tokens

Primitive tokens are raw values:

```ts
type BakeryPrimitiveTokens = {
  color: {
    cream50: string;
    cocoa900: string;
    grassSunlit: string;
    grassShadow: string;
    flowerPetalEmber: string;
    flowerPetalPlum: string;
    flowerPetalGolden: string;
    flowerPetalPoppy: string;
    sunYellow: string;
  };
  space: {
    0: string;
    0.5: string;
    1: string;
    2: string;
    3: string;
    4: string;
    6: string;
    8: string;
    12: string;
  };
  radius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    pill: string;
    cloud: string;
  };
  shadow: {
    none: string;
    raisedSoft: string;
    panelFloat: string;
    innerPressed: string;
    moonGlow: string;
  };
  motion: {
    quick: string;
    normal: string;
    slow: string;
    flowerBob: string;
    cloudDrift: string;
  };
};
```

These are the exact values: colors, sizes, shadows, durations.

They are not yet saying:

```txt
this is the primary button
this is the persuasion panel
this is the moonlit flower
```

They are just the available materials.

### Layer 2: Semantic Tokens

Semantic tokens give the raw values a job.

Example:

```ts
type BakerySemanticTokens = {
  color: {
    bg: string;
    fg: string;
    fgMuted: string;
    bgPrimary: string;
    bgSecondary: string;
    panelFill: string;
    panelBorder: string;
    meadow: string;
    meadowShadow: string;
    flowerAccent: string;
    flowerAccentCenter: string;
    actionBg: string;
    actionFg: string;
  };
  layout: {
    heroMaxWidth: string;
    panelMaxWidth: string;
    contentInset: string;
    flowerRailHeight: string;
    meadowHeight: string;
  };
  motion: {
    decorativeBob: string;
    sceneryTransition: string;
    panelShutter: string;
  };
};
```

This is where a theme decides:

```txt
in dawn:
  flowerAccent = flowerPetalEmber

in moonlit:
  flowerAccent = moonlitPurpleFrontPetal

in blossom:
  flowerAccent = blossomPinkPetal
```

The app still needs human judgment. The theme object is not an AI choosing the best color. It is humans recording the design decision in a structured place.

### Layer 3: Component Variant Tokens

Component tokens decide how a component uses semantic roles.

Example:

```ts
type BakeryComponentTokens = {
  sceneButton: {
    primary: {
      background: "actionBg";
      foreground: "actionFg";
      shadow: "panelFloat";
    };
    ghost: {
      background: "bgSecondary";
      foreground: "fg";
      border: "panelBorder";
    };
  };
  persuasionPanel: {
    default: {
      background: "panelFill";
      border: "panelBorder";
      foreground: "fg";
      muted: "fgMuted";
      radius: "lg";
      shadow: "panelFloat";
    };
  };
  decorativeFlower: {
    nav: {
      petal: "flowerAccent";
      center: "flowerAccentCenter";
    };
    meadow: {
      petal: "flowerAccent";
      center: "flowerAccentCenter";
    };
  };
};
```

This is the same idea as:

```txt
Button variant primary
  does not choose raw blue directly
  it points to semantic roles
```

For the bakery app:

```txt
SceneButton variant primary
  should not hardcode a hex color
  it should point to scene action roles
```

## 18. BakeryThemeProvider And BakeryThemeManager

The CDS structure worth copying is:

```txt
ThemeProvider
  builds the runtime theme object

ThemeManager
  publishes CSS variables on a wrapper div

children
  consume the theme through context, class names, style props, and CSS vars
```

The bakery version could look like:

```tsx
<BakeryThemeProvider
  theme={bakeryTheme}
  activeColorScheme={activeColorScheme}
  activeScene={activeScene}
>
  <App />
</BakeryThemeProvider>
```

The human-authored theme object might contain:

```ts
const bakeryTheme = {
  id: "baked-with-blessings",
  primitive: bakeryPrimitiveTokens,
  lightColor: bakeryLightSemanticTokens,
  darkColor: bakeryDarkSemanticTokens,
  scenes: {
    dawn: dawnSceneTheme,
    moonlit: moonlitSceneTheme,
    blossom: blossomSceneTheme,
    "fairy-castle": fairyCastleSceneTheme,
  },
  component: bakeryComponentTokens,
};
```

Then `BakeryThemeProvider` creates a runtime theme API:

```ts
const themeApi = {
  ...theme,
  activeColorScheme,
  activeScene,
  color: activeColorScheme === "dark" ? theme.darkColor : theme.lightColor,
  scene: theme.scenes[activeScene],
};
```

That runtime object is what components read through context:

```tsx
const theme = useBakeryTheme();

theme.scene.color.panelFill;
theme.component.sceneButton.primary.background;
```

Then `BakeryThemeManager` does the CSS work:

```tsx
function BakeryThemeManager({ theme, children }) {
  const themeCssVars = createBakeryThemeCssVars(theme);

  return (
    <div
      className={`bakeryTheme ${theme.activeColorScheme} scene-${theme.activeScene}`}
      data-scene={theme.activeScene}
      style={themeCssVars}
    >
      {children}
    </div>
  );
}
```

That wrapper div is the key.

It is where variables like these actually get defined:

```css
--color-bg: #fffaf0;
--color-fg: #2b170d;
--scene-panel-fill: rgba(255, 248, 234, 0.92);
--scene-flower-accent: #e84a03;
--scene-meadow-height: 18rem;
--scene-action-aura: rgba(230, 196, 57, 0.42);
```

Then component CSS can safely consume them:

```css
.persuasionPanel {
  background: var(--scene-panel-fill);
  color: var(--color-fg);
}

.decorativeFlower {
  --flower-petal: var(--scene-flower-accent);
}
```

This is very close to the CDS mental model:

```txt
theme object
  human-authored values

runtime theme API
  active color scheme and active scene resolved

ThemeManager
  converts current theme into CSS variables

components
  consume stable variables and theme context
```

## 19. Translation Layers Same Spirit As CDS

CDS has `getStyles`.

It receives style props:

```tsx
<Box padding={4} background="bgPrimary" borderRadius="roundedLarge" />
```

Then it translates them into:

```txt
class names
CSS variables
responsive class names
inline dynamic variables
```

The bakery app could implement a smaller but similar translation layer.

Example:

```tsx
<BakeryBox
  padding={4}
  background="panelFill"
  radius="lg"
  shadow="panelFloat"
/>
```

The translator could resolve:

```txt
padding={4}
  -> class that uses --space-4

background="panelFill"
  -> class that uses --scene-panel-fill

radius="lg"
  -> class that uses --radius-lg

shadow="panelFloat"
  -> class that uses --shadow-panelFloat
```

This would give Codex a safer target.

Instead of editing:

```tsx
className="rounded-[2rem] bg-[#fff8ea]/90 px-7 py-8 shadow-[0_24px_60px_rgba(87,44,13,0.18)]"
```

Codex could edit:

```tsx
<SceneSurface variant="persuasion" padding={6} density="roomy">
```

The full CDS-style idea:

```txt
component props ask for design-system words
translator maps words to CSS classes and variables
theme manager defines the variables
```

That is why the pipeline needs multiple parts. Each part owns a different decision.

## 20. ScenePainterManager For SVGs, PNGs, Trees, Clouds, And Flowers

`SvgPainterManager` is a good instinct, but I would name it slightly broader:

```txt
ScenePainterManager
```

Reason:

```txt
SVGs can often be recolored and reshaped if authored correctly
PNGs cannot be truly recolored path-by-path
clouds, trees, flowers, skies, and meadows need shared placement rules too
```

So the master concept should manage scene assets, not only SVG paint.

Possible internal pieces:

```txt
ScenePainterManager
  coordinates all scene asset styling

SvgPaintManager
  handles inline SVG color variables, currentColor, stroke width, fills, masks

RasterAssetManager
  handles PNG/WebP fit, object-position, responsive source, loading priority

ScenePlacementManager
  handles anchors, layers, scale, tilt, z-index, spawn rectangles

SceneMotionManager
  handles bobbing, drifting, delays, durations, reduced-motion behavior
```

The important SVG rule:

```txt
SVGs must be authored to be paintable
```

For example, this is easy to theme:

```svg
<path fill="var(--flower-petal)" />
<circle fill="var(--flower-center)" />
<path stroke="currentColor" />
```

This is harder to theme:

```svg
<path fill="#e84a03" />
<circle fill="#7a2100" />
```

Hardcoded SVG colors can still be edited, but they are not flexible at runtime unless the SVG is inline or transformed during build.

A future API could look like:

```tsx
<ScenePaintedAsset
  asset="flower"
  variant="nav"
  colorRole="flowerAccent"
  size="m"
  layer="foreground"
  motion="gentleBob"
/>

<ScenePaintedAsset
  asset="tree"
  variant="slender"
  density="clustered"
  scaleX={0.82}
  layer="midground"
/>

<ScenePaintedAsset
  asset="cloud"
  variant="softBand"
  density="more"
  motion="slowDrift"
  layer="sky"
/>
```

Then a request like "more clouds" has a real target:

```txt
increase cloud density in the scene theme
or choose a denser cloud layer recipe
```

A request like "skinnier tree" has a real target:

```txt
choose the slender tree variant
or apply a controlled scaleX transform around the tree anchor
```

A request like "more tree" has a real target:

```txt
increase tree cluster count
or switch the scene asset recipe from singleTree to grove
```

This is the same design-system idea again:

```txt
turn visual instructions into named knobs
```

## 21. Higher-Level Components Versus Higher-Order Components

These sound similar but mean different things.

Higher-level component:

```txt
a component built from lower-level pieces
```

Example:

```tsx
<SceneButton variant="primary" />
```

It might use:

```txt
BakeryBox
Pressable behavior
scene color tokens
motion tokens
icon slots
```

This is the pattern CDS uses constantly.

Higher-order component:

```txt
a function that receives a component and returns an enhanced component
```

Example:

```tsx
const SceneAwareFooter = withSceneTheme(Footer);
```

Classic HOCs can be useful, but for this app I would favor higher-level components and providers first.

Why?

```txt
providers make theme data available
higher-level components encode repeated visual decisions
HOCs can hide too much behavior if used everywhere
```

Good higher-level bakery components:

```txt
SceneSurface
SceneButton
SceneActionRow
SceneAsset
ScenePaintedAsset
HeroBanner
PersuasionPanel
FooterSurface
GalleryFace
```

Possible HOCs later:

```txt
withSceneTheme
withReducedMotion
withMeasuredSlot
```

But they should be added only when they remove repeated wiring.

## 22. Refactor Strategy If We Decide To Implement This

Because the styling pain is real, this refactor can be worth the migration cost.

The order matters.

### Phase 1: Tokens And Theme Manager

Create:

```txt
BakeryPrimitiveTokens
BakerySemanticTokens
BakeryComponentTokens
BakeryThemeProvider
BakeryThemeManager
createBakeryThemeCssVars
useBakeryTheme
```

Do not migrate every component yet.

Just prove that a wrapper can publish:

```txt
global color vars
scene vars
flower color vars
surface vars
motion vars
```

### Phase 2: Asset Registry And ScenePainterManager

Create:

```txt
sceneAssetRegistry
ScenePainterManager
ScenePaintedAsset
ScenePlacementManager
SceneMotionManager
```

Move flower colors, SVG defaults, PNG fit rules, and responsive source rules into data.

This is especially useful because this app has many decorative assets.

### Phase 3: Migrate One Visual Slice

Pick one slice first:

```txt
persuasion panel
```

or:

```txt
common hero banner
```

Do not migrate everything at once.

The goal is to prove:

```txt
old scattered styling
  -> named scene/surface/asset contracts
```

### Phase 4: Migrate Footer And Header

Once the scene tokens work, footer and header can consume the same scene variables.

This matters because the footer/header should not need separate hardcoded scene styling.

### Phase 5: Add Style Props Or Recipes

Only after real components use the token system should the app add a CDS-like style translator.

Start small:

```txt
padding
margin
gap
background
color
radius
shadow
layout recipe
responsive recipe
```

Then expand if it actually saves work.

The implementation goal:

```txt
make future AI styling requests land on stable knobs
```

Not:

```txt
build a design-system museum
```

## 23. Main Takeaway

The bakery app already has strong visual imagination and several good algorithms.

The weak spot is that styling knowledge is too scattered.

The CDS lesson is:

```txt
turn repeated styling decisions into named contracts
```

For this app, the most useful contracts would probably be:

```txt
BakeryThemeProvider
BakeryThemeManager
Bakery primitive tokens
Bakery semantic tokens
Bakery component tokens
SceneTheme
SceneSurface
SceneAsset
ScenePainterManager
SceneActionRow
FooterSurface
HeroSurface
PersuasionPanel slots
scene motion and geometry helpers
```

That would make future styling work easier because Codex would edit the named system instead of guessing through a large pile of CSS, class strings, image maps, and global selectors.
