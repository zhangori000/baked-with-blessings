# Intermediate CDS Logic and Composition

Date: 2026-04-28

Scope: learning note only. This is Chapter 2 after `01-introductory-cds-design-principles.md`.

This chapter traces CDS in execution order:

```txt
allowed token words
  -> theme object with real values
  -> ThemeProvider chooses active theme
  -> ThemeProvider publishes context and CSS variables
  -> style props ask for token values
  -> components compose lower-level primitives
```

Primary CDS source files sampled:

- `packages/common/src/core/theme.ts`
- `packages/web/src/core/theme.ts`
- `packages/web/src/themes/coinbaseTheme.ts`
- `packages/web/src/themes/coinbaseDenseTheme.ts`
- `packages/web/src/system/ThemeProvider.tsx`
- `packages/web/src/core/createThemeCssVars.ts`
- `packages/web/src/styles/styleProps.ts`
- `packages/web/src/styles/responsive/base.ts`
- `packages/web/src/layout/Box.tsx`
- `packages/web/src/system/Interactable.tsx`
- `packages/web/src/system/Pressable.tsx`
- `packages/web/src/buttons/Button.tsx`
- `packages/common/src/tokens/button.ts`

Algorithm-heavy helpers are now in `cds-algorithm-glossary.md`.

## 1. Three Things That Are Easy To Confuse

CDS separates three ideas that can blur together at first:

```txt
ThemeVars
  allowed design words

theme object
  actual values for those words

style props
  component props that ask to use those words
```

### ThemeVars: The Allowed Words

In `packages/common/src/core/theme.ts`, CDS defines the legal token names.

Example:

```ts
ThemeVars.Color includes:
  bg
  fg
  bgPrimary
  fgPrimary
  bgNegative
  fgNegative
```

And:

```ts
ThemeVars.Space includes:
  0
  0.25
  0.5
  1
  2
  3
  ...
```

At this level, CDS is not saying what `bgPrimary` equals. It is only saying:

```txt
bgPrimary is a valid design word.
```

Think of `ThemeVars` as the dictionary of allowed vocabulary.

### Theme Object: The Values For Those Words

The theme object is where those words get real values.

In `packages/web/src/themes/coinbaseTheme.ts`, CDS exports a JavaScript object named `coinbaseTheme`.

That object has nested objects such as:

```ts
lightSpectrum
darkSpectrum
lightColor
darkColor
space
borderRadius
fontSize
lineHeight
shadow
```

So when the docs say:

```txt
coinbaseTheme gives these words real values
```

it means:

```txt
CDS creates objects that map token names to actual values.
```

Example:

```ts
space: {
  "2": 16,
}
```

This maps the token name `space["2"]` to the real number `16`.

Another example:

```ts
borderRadius: {
  "200": 8,
}
```

This maps the token name `borderRadius["200"]` to the real number `8`.

Another example:

```ts
lightColor: {
  bgPrimary: `rgb(${lightSpectrum.blue60})`,
}
```

This maps the semantic token name `bgPrimary` to the actual color built from `lightSpectrum.blue60`.

### Style Props: Component Requests

Style props are not the theme object.

Style props are how a component asks to use theme values.

Example:

```tsx
<Box background="bgPrimary" padding={2} borderRadius={200} />
```

This means:

```txt
background="bgPrimary"
  ask for the semantic color token bgPrimary

padding={2}
  ask for the spacing token 2

borderRadius={200}
  ask for the radius token 200
```

So:

```txt
theme object = stores values
style props = request values
```

## 2. What `bgPrimary` Actually Means

This sentence from the earlier draft needed more explanation:

```txt
The theme decides what semantic color roles mean, and component variant tokens decide which roles a component should use.
```

Break it into two layers.

### Theme Decision

The theme decides what the semantic color token `bgPrimary` resolves to.

In Coinbase's light theme:

```ts
bgPrimary: `rgb(${lightSpectrum.blue60})`
```

In Coinbase's dark theme:

```ts
bgPrimary: `rgb(${darkSpectrum.blue70})`
```

That means:

```txt
same semantic token name
different actual color depending on active theme/color scheme
```

Humans still chose those mappings. CDS is not discovering the best primary color with artificial intelligence or a runtime algorithm.

The value is that the choice is centralized.

Bad scattered version:

```tsx
<button className="bg-[#0052ff]" />
<a className="text-[#0052ff]" />
<div style={{ borderColor: "#0052ff" }} />
```

Better centralized version:

```ts
theme.lightColor.bgPrimary = `rgb(${lightSpectrum.blue60})`
```

Then components ask for:

```tsx
background="bgPrimary"
color="fgPrimary"
variant="primary"
```

### Component Variant Token Decision

A component variant token is a component-specific configuration object that maps a component variant name to semantic roles.

For Button, CDS has this in `packages/common/src/tokens/button.ts`:

```ts
primary: {
  color: "fgInverse",
  background: "bgPrimary",
  borderColor: "bgPrimary",
}
```

That means:

```txt
Button variant name:
  primary

Semantic roles that primary button should use:
  text color = fgInverse
  background = bgPrimary
  border = bgPrimary
```

So there are two maps:

```txt
theme map:
  bgPrimary -> rgb(lightSpectrum.blue60)

button variant map:
  primary button background -> bgPrimary
```

That is the "design-system contract."

`primary` is not calculated at runtime. It is a name that designers and engineers agreed means "the main action/emphasis style."

## 3. What Happens When A Different Theme Is Selected

If a UI button lets the user pick a theme, the app usually changes state somewhere:

```txt
selectedTheme = coinbaseTheme
selectedTheme = bakeryMarketTheme
selectedTheme = bakeryCastleTheme
```

Then the app renders:

```tsx
<ThemeProvider theme={selectedTheme} activeColorScheme="light">
  <App />
</ThemeProvider>
```

If `selectedTheme` changes, React renders `ThemeProvider` again with a different theme object.

The component can stay the same:

```tsx
<Button variant="primary">Checkout</Button>
```

But the meaning of `bgPrimary` can change because the active theme object changed.

Example:

```txt
coinbaseTheme.lightColor.bgPrimary
  -> blue

bakeryMarketTheme.lightColor.bgPrimary
  -> green

bakeryCastleTheme.lightColor.bgPrimary
  -> gold
```

Yes, those values are normally still explicitly chosen by humans in theme objects.

The system does not remove human taste. It gives human taste a central place to live.

Yes, this means you can create multiple theme objects.

CDS itself does this in `packages/web/src/themes`:

```txt
coinbaseTheme
defaultTheme
coinbaseHighContrastTheme
defaultHighContrastTheme
coinbaseDenseTheme
```

They follow the same broad theme shape, but they assign different values.

For example:

```txt
coinbaseTheme.space["2"]
  -> 16

coinbaseDenseTheme.space["2"]
  -> 12
```

Same token name. Different theme object. Different final UI density.

## 4. ThemeProvider Internals, More Slowly

`ThemeProvider` receives two important props:

```tsx
<ThemeProvider theme={coinbaseTheme} activeColorScheme="light">
  <App />
</ThemeProvider>
```

`coinbaseTheme` is the human-authored theme object in this example.

`activeColorScheme` tells CDS which color mode is active:

```txt
light
dark
```

It is not calculated from the theme object by itself.

It is an input to `ThemeProvider`, and it might come from:

- app state
- a user dark/light toggle
- system preference
- a hardcoded default

But once `ThemeProvider` receives it, CDS also exposes it to children later as:

```ts
themeApi.activeColorScheme
```

So it is both:

```txt
an input into ThemeProvider
and a value descendants can read through useTheme()
```

### Runtime Means "While The App Is Running"

Runtime means the period when the app is actually running in React/the browser.

Contrast:

```txt
source code time:
  coinbaseTheme.ts exists as code on disk

runtime:
  React renders ThemeProvider with a concrete theme prop
  ThemeProvider computes active values
  components render using those active values
```

### Runtime Theme Object

The original theme object has both light and dark values:

```ts
{
  lightSpectrum,
  darkSpectrum,
  lightColor,
  darkColor,
  space,
  borderRadius,
}
```

`ThemeProvider` creates a runtime theme object that also includes:

```ts
{
  activeColorScheme,
  spectrum,
  color,
}
```

In the CDS source, that runtime object is stored in a variable named `themeApi`.

So the distinction is:

```txt
theme
  the original object passed into ThemeProvider
  example: coinbaseTheme

themeApi
  the runtime object ThemeProvider creates
  it includes the original theme values plus active selections
```

`themeApi` is not a separate file. It is a value created inside the `ThemeProvider` function while the app is running.

Simplified:

```ts
const activeSpectrumKey =
  activeColorScheme === "dark" ? "darkSpectrum" : "lightSpectrum";

const activeColorKey =
  activeColorScheme === "dark" ? "darkColor" : "lightColor";

const themeApi = {
  ...theme,
  activeColorScheme,
  spectrum: theme[activeSpectrumKey],
  color: theme[activeColorKey],
};
```

The bracket access matters here.

If:

```ts
activeColorKey = "lightColor";
```

then:

```ts
theme[activeColorKey]
```

means:

```ts
theme["lightColor"]
```

which is the same target as:

```ts
theme.lightColor
```

CDS uses brackets because the property name is stored in a variable. Dot access only works when the property name is written literally.

If active scheme is light:

```txt
themeApi.spectrum = theme.lightSpectrum
themeApi.color = theme.lightColor
themeApi.activeColorScheme = "light"
```

If active scheme is dark:

```txt
themeApi.spectrum = theme.darkSpectrum
themeApi.color = theme.darkColor
themeApi.activeColorScheme = "dark"
```

This is why components can later say:

```ts
theme.color.bgPrimary
```

They do not need to ask:

```ts
is dark mode active?
  then use darkColor.bgPrimary
  else use lightColor.bgPrimary
```

`ThemeProvider` already made that choice.

### Why `value={themeApi}`?

CDS renders:

```tsx
<ThemeContext.Provider value={themeApi}>
```

React Context is a way to share a value with all descendants without passing it manually through every prop.

So this:

```tsx
<ThemeContext.Provider value={themeApi}>
  <App />
</ThemeContext.Provider>
```

means:

```txt
any descendant can call useTheme()
and receive the same themeApi object
```

CDS implements `useTheme()` like this:

```ts
const context = useContext(ThemeContext);
if (!context) throw Error("useTheme must be used within a ThemeProvider");
return context;
```

That is the JavaScript path.

### CSS Path: ThemeManager Before `themeCssVars`

Stop here and separate the two paths.

The previous section was the JavaScript path:

```txt
ThemeProvider
  -> ThemeContext.Provider value={themeApi}
  -> child calls useTheme()
```

Now this section is the CSS path:

```txt
ThemeProvider
  -> ThemeManager
  -> createThemeCssVars(themeApi)
  -> wrapper div style={themeCssVars}
```

Before `themeCssVars`, define `ThemeManager`.

`ThemeManager` is an internal helper component inside `ThemeProvider.tsx`.

It is not a new design-system idea. It is the part of ThemeProvider that renders the wrapper `<div>` around the children.

Its job is:

```txt
receive themeApi
turn themeApi into CSS variables
put those CSS variables on a wrapper div
render children inside that wrapper div
```

Here is a simplified version of the actual CDS code shape:

```tsx
export const useThemeProviderStyles = (theme: Theme) => {
  const style = useMemo(() => createThemeCssVars(theme), [theme]);
  return style;
};

const ThemeManager = ({ display, className, style, children, theme }) => {
  const themeStyles = useThemeProviderStyles(theme);

  const styles = useMemo(
    () => ({ ...themeStyles, display, ...style }),
    [themeStyles, display, style],
  );

  return (
    <div className={cx(theme.id, theme.activeColorScheme, className)} style={styles}>
      {children}
    </div>
  );
};
```

Read that slowly:

```txt
theme
  the runtime themeApi object from ThemeProvider

useThemeProviderStyles(theme)
  calls createThemeCssVars(theme)

themeStyles
  the CSS variable object returned by createThemeCssVars

styles
  themeStyles plus optional display plus optional caller style

<div style={styles}>
  the DOM place where CSS variables are actually published
```

So yes: CDS wraps the themed subtree in a `div`.

If a CDS app puts `ThemeProvider` around the whole app, then the whole app is inside that wrapper div. If a CDS app puts `ThemeProvider` around only one section, then only that section is inside the wrapper div.

Why does CDS need that wrapper div?

Because CSS classes need CSS variables to exist in the DOM.

For example, a generated class may say:

```css
background-color: var(--color-bgPrimary);
```

That class only works if `--color-bgPrimary` has been defined somewhere above the element.

So the CSS path is:

```txt
themeApi
  -> createThemeCssVars(themeApi)
  -> themeCssVars object
  -> <div style={themeCssVars}>
  -> child CSS classes can use var(...)
```

`ThemeManager` calls:

```ts
createThemeCssVars(themeApi)
```

The result is an object shaped like a React inline style object.

That object is what this doc calls `themeCssVars`.

```ts
{
  "--color-bgPrimary": "rgb(0,82,255)",
  "--space-2": "16px",
  "--borderRadius-200": "8px",
  "--activeColorScheme": "light",
}
```

CDS puts it on a wrapper div:

```tsx
<div className={...} style={themeCssVars}>
  {children}
</div>
```

Now CSS inside that subtree can use:

```css
background-color: var(--color-bgPrimary);
padding: var(--space-2);
border-radius: var(--borderRadius-200);
```

So `ThemeProvider` publishes the active theme in two ways:

```txt
JavaScript:
  ThemeContext.Provider value={themeApi}

CSS:
  wrapper div style={themeCssVars}
```

## 5. Who Uses `createThemeCssVars`?

`createThemeCssVars` is used by `ThemeProvider` through `ThemeManager`.

This section is just the same CSS path with the internal helper names included.

The chain is:

```txt
ThemeProvider
  creates themeApi
  passes themeApi into ThemeManager

ThemeManager
  calls useThemeProviderStyles(themeApi)

useThemeProviderStyles
  calls createThemeCssVars(themeApi)

createThemeCssVars
  returns CSS variable object

ThemeManager
  puts CSS variable object on wrapper div style
```

Simplified, `createThemeCssVars` does this:

```ts
const themeCss = {};

for (const key of Object.keys(theme)) {
  const themeVars = theme[key];
  if (!themeVars || key === "id") continue;

  if (key === "activeColorScheme") {
    themeCss["--activeColorScheme"] = theme.activeColorScheme;
    continue;
  }

  const prefix = styleVarPrefixes[key];
  const cssVarPrefix = prefix ? `--${prefix}-` : "--";

  for (const varName of Object.keys(themeVars)) {
    const value = themeVars[varName];
    const cssVarName = `${cssVarPrefix}${varName}`.replace(/\./g, "_");
    themeCss[cssVarName] = typeof value === "number" ? `${value}px` : value;
  }
}

return themeCss;
```

Example:

```txt
theme.space["2"] = 16
  -> --space-2: 16px

theme.borderRadius["200"] = 8
  -> --borderRadius-200: 8px

theme.color.bgPrimary = rgb(0,82,255)
  -> --color-bgPrimary: rgb(0,82,255)
```

This is why `--color-bgPrimary` exists later. It is not written by hand in every component. It is generated from the active runtime theme object and placed on the wrapper div by `ThemeManager`.

This is not a data pipeline like analytics or ETL. It is a styling pipeline:

```txt
theme object
  -> runtime themeApi
  -> generated CSS variable object
  -> wrapper div inline style
  -> child CSS classes read those variables
```

Important detail:

```txt
createThemeCssVars receives the runtime theme object, not only the original source theme.
```

That matters because the runtime theme object has:

```ts
color: active lightColor or darkColor
spectrum: active lightSpectrum or darkSpectrum
```

So:

```txt
themeApi.color.bgPrimary
  -> --color-bgPrimary
```

If active scheme is light:

```txt
--color-bgPrimary = theme.lightColor.bgPrimary
```

If active scheme is dark:

```txt
--color-bgPrimary = theme.darkColor.bgPrimary
```

The CSS variable name stays stable. The value changes.

## 6. What Is `baseStyles`?

`baseStyles` is the import name CDS uses for prebuilt style-prop class maps:

```ts
import * as baseStyles from "./responsive/base";
```

A class map is just an object where:

```txt
key
  allowed prop value

value
  generated CSS class name for that value
```

That file exports class-map objects like:

```ts
padding
background
borderRadius
elevation
color
display
overflow
gap
```

Each object maps a legal prop value to a generated CSS class.

Example from the actual idea:

```ts
baseStyles.padding["2"]
```

means:

```txt
give me the generated class for padding token 2
```

It points to a class generated from CSS like:

```css
padding-top: var(--space-2);
padding-bottom: var(--space-2);
padding-inline-start: var(--space-2);
padding-inline-end: var(--space-2);
```

And:

```ts
baseStyles.background.bgPrimary
```

means:

```txt
give me the generated class for background token bgPrimary
```

It points to a class generated from CSS like:

```css
background-color: var(--color-bgPrimary);
```

Another example:

```ts
baseStyles.display.flex
```

points to a class generated from CSS like:

```css
display: flex;
```

Another example:

```ts
baseStyles.elevation["1"]
```

points to a class generated from CSS like:

```css
background-color: var(--color-bgElevation1);
box-shadow: var(--shadow-elevation1);
```

So `baseStyles` is not the theme. It is a library of reusable CSS classes that know how to read theme CSS variables.

Is it hardcoded by a human?

Mostly yes, in the good design-system sense.

CDS engineers explicitly wrote finite maps like:

```txt
padding token 0
padding token 0.25
padding token 0.5
padding token 1
padding token 2
...
```

They did not write the final unreadable class names by hand. Linaria/build tooling generates those class names from the `css` blocks.

So the split is:

```txt
human-authored:
  which style props exist
  which token values are allowed
  what CSS each token class should contain

build-generated:
  the final CSS class names
```

That is why `baseStyles.padding["2"]` is a class map lookup, not a theme lookup.

## 7. What `getStyles` Does

`Box` receives style props:

```tsx
<Box padding={2} background="bgPrimary" borderRadius={200} />
```

Inside `Box`, those props are destructured and collected into a plain object.

`getStyles` does not inspect a mysterious React component. It receives a normal JavaScript object:

```ts
getStyles({
  padding,
  background,
  borderRadius,
  width,
  height,
  opacity,
});
```

Then `getStyles` loops over the keys in that object.

Simplified:

```ts
const style = {};
let className = "";

for (const styleProp in styleProps) {
  const value = styleProps[styleProp];
  if (typeof value === "undefined") continue;

  if (baseStyles.dynamic[styleProp]) {
    // dynamic path
  } else {
    // static path
  }
}

return { style, className };
```

The return value goes back to `Box`, and `Box` renders:

```tsx
<Component className={styles.className} style={styles.style} />
```

So `getStyles` is an internal CDS helper that turns style props into:

```txt
className
  generated CSS classes

style
  inline CSS variables and caller inline styles
```

### Static Token Props

A static token prop is a prop whose useful values come from a finite design-system vocabulary.

Examples:

```tsx
<Box padding={2} />
<Box background="bgPrimary" />
<Box borderRadius={200} />
<Box elevation={1} />
```

These are called static because CDS can prebuild CSS classes for the allowed values ahead of time.

`padding` is a good example. CDS decided the spacing scale is finite:

```txt
0
0.25
0.5
0.75
1
1.5
2
3
...
10
```

Because that list is finite, CDS can create a class map:

```ts
baseStyles.padding = {
  "0": "...class...",
  "0.25": "...class...",
  "0.5": "...class...",
  "1": "...class...",
  "2": "...class...",
};
```

So:

```txt
padding={2}
  -> find baseStyles.padding["2"]
  -> add that generated class to className
```

Same idea:

```txt
background="bgPrimary"
  -> find baseStyles.background.bgPrimary
  -> add that generated class to className

borderRadius={200}
  -> find baseStyles.borderRadius["200"]
  -> add that generated class to className
```

The class usually reads a CSS variable that ThemeManager already placed on the wrapper div.

Example:

```txt
baseStyles.padding["2"]
  class says padding: var(--space-2)

ThemeManager wrapper div
  defines --space-2: 16px
```

### Dynamic Arbitrary Props

A dynamic arbitrary prop is a prop whose values are too open-ended to prebuild.

Examples:

```tsx
<Box width={320} />
<Box width="50%" />
<Box width="calc(100% - 24px)" />
<Box gridTemplateColumns="240px 1fr" />
```

`width` is different from `padding`.

CDS can prebuild `padding={2}` because `2` is part of a finite spacing scale.

CDS cannot reasonably prebuild every possible width:

```txt
width 1px
width 2px
width 3px
...
width 50%
width calc(100% - 24px)
width min(40rem, 100%)
```

So dynamic props use a two-part trick:

```txt
width={320}
  -> set inline CSS variable --width: 320px
  -> add class that says width: var(--width)
```

The static part is the reusable class:

```css
width: var(--width);
```

The dynamic part is the inline value on this one element:

```tsx
style={{ "--width": "320px" }}
```

That is why the final return object might look conceptually like:

```ts
{
  className: "generated-width-class",
  style: {
    "--width": "320px",
  },
}
```

### Static Example

Input:

```tsx
<Box padding={2} />
```

CDS can use a prebuilt class because `2` is one of the known spacing tokens.

Conceptually:

```txt
padding={2}
  -> class: padding uses var(--space-2)
  -> ThemeProvider already defined --space-2 as 16px
  -> real CSS result: padding is 16px
```

### Dynamic Example

Input:

```tsx
<Box width={320} />
```

CDS cannot prebuild a class for every possible width:

```txt
width 1
width 2
width 3
...
width 320
width 321
...
```

So it does this instead:

```txt
inline style:
  --width: 320px

class:
  width: var(--width)
```

A browser then resolves that to:

```css
width: 320px;
```

The earlier phrase:

```css
class="class-that-says-width-var-width"
```

was only a conceptual placeholder. A real Linaria class name is generated by the build tooling, so the human-readable idea is:

```txt
generated class contains width: var(--width)
inline style provides --width
```

### Responsive Values Use The Same Split

CDS style props can also receive responsive objects:

```tsx
<Box padding={{ base: 2, tablet: 4 }} width={{ base: "100%", desktop: 960 }} />
```

For static responsive values:

```txt
padding.base = 2
  -> baseStyles.padding["2"]

padding.tablet = 4
  -> tabletStyles.padding["4"]
```

For dynamic responsive values:

```txt
width.base = "100%"
  -> --width: 100%
  -> base dynamic width class

width.desktop = 960
  -> --desktop-width: 960px
  -> desktop dynamic width class
```

Same idea, just repeated for breakpoints.

## 8. Full Trace: `Box background="bgPrimary"`

Start with:

```tsx
<Box background="bgPrimary" />
```

Trace:

```txt
1. ThemeVars says bgPrimary is a legal color token.

2. coinbaseTheme maps bgPrimary to an actual color:
   lightColor.bgPrimary = rgb(lightSpectrum.blue60)

3. ThemeProvider receives coinbaseTheme and activeColorScheme.

4. ThemeProvider creates themeApi:
   themeApi.color = lightColor or darkColor

5. ThemeManager calls createThemeCssVars(themeApi).

6. createThemeCssVars creates:
   --color-bgPrimary: actual active color

7. Box receives background="bgPrimary".

8. Box calls getStyles.

9. getStyles looks up baseStyles.background.bgPrimary.

10. That generated class says:
    background-color: var(--color-bgPrimary)

11. Browser resolves var(--color-bgPrimary) to the active theme value.
```

This is the whole point of the system:

```txt
component asks for semantic role
theme provides actual value
CSS variable connects them
```

## 9. Full Trace: `<Button variant="primary" compact>`

Start with:

```tsx
<Button variant="primary" compact>
  Continue
</Button>
```

The caller only says:

```txt
primary command
compact size
```

The caller does not choose:

- exact text color
- exact background color
- border color
- border radius
- height
- padding
- hover color
- pressed color
- disabled color
- keyboard behavior
- loading behavior
- focus behavior

### Step 1: Button Looks Up Its Variant Token

Button has a variant config:

```ts
primary: {
  color: "fgInverse",
  background: "bgPrimary",
  borderColor: "bgPrimary",
}
```

This is what "component variant token" means:

```txt
a component-specific map from variant name to token roles
```

### Step 2: Button Resolves Defaults

In `Button.tsx`, CDS does:

```ts
const variantStyle = variantMap[variant];

const colorValue = color ?? variantStyle.color;
const backgroundValue = background ?? variantStyle.background;
const borderColorValue = borderColor ?? variantStyle.borderColor;
```

Meaning:

```txt
if caller gave a color override, use it
otherwise use the variant default
```

For `variant="primary"`:

```txt
colorValue = fgInverse
backgroundValue = bgPrimary
borderColorValue = bgPrimary
```

### Step 3: Button Resolves Size Defaults

For compact:

```txt
height = 40
borderRadius = 700
paddingX = 2
minWidth = auto
```

For regular:

```txt
height = 56
borderRadius = 900
paddingX = 4
minWidth = 100
```

### Step 4: Button Renders Pressable

Button passes those decisions down:

```tsx
<Pressable
  background={backgroundValue}
  borderColor={borderColorValue}
  color={colorValue}
  height={height}
  paddingX={paddingX}
  borderRadius={borderRadius}
/>
```

At this point, Button has translated:

```txt
variant="primary"
```

into:

```txt
background="bgPrimary"
color="fgInverse"
borderColor="bgPrimary"
```

### Step 5: Pressable Adds Behavior

`Pressable` handles behavior:

- Enter key activation
- Space key active state
- disabled click prevention
- loading behavior
- focus and tab behavior
- optional press scaling
- `aria-disabled`
- `tabIndex`

Then it renders:

```tsx
<Interactable {...props} />
```

`Pressable` does not resolve `bgPrimary` to RGB. It forwards the semantic role.

### Step 6: Interactable Consumes Interaction Colors

`Interactable` receives:

```txt
background = bgPrimary
borderColor = bgPrimary
```

Then it calls:

```ts
const theme = useTheme();
```

Because `ThemeProvider` already created `themeApi`, `theme.color.bgPrimary` is the active value.

Then Interactable resolves:

```ts
const backgroundColor = theme.color[background];
```

If active theme is light:

```txt
theme.color.bgPrimary = theme.lightColor.bgPrimary
```

If active theme is dark:

```txt
theme.color.bgPrimary = theme.darkColor.bgPrimary
```

Then `Interactable` computes hover, pressed, and disabled colors and stores them as CSS variables:

```txt
--interactable-background
--interactable-hovered-background
--interactable-pressed-background
--interactable-disabled-background
```

### Step 7: Interactable Renders Box

Important precision:

```txt
Interactable consumes background and borderColor itself.
```

It does not simply pass `background="bgPrimary"` unchanged into `Box`.

It forwards the remaining layout/style props to `Box`, such as:

```txt
color
height
paddingX
borderRadius
borderWidth
```

Then `Box` uses `getStyles` to turn those into classes and CSS variables.

Full ladder:

```txt
Button
  maps variant intent to semantic roles

Pressable
  adds button-like behavior

Interactable
  resolves interaction colors and state styling

Box
  translates remaining style props into CSS
```

## 10. Why Higher-Level Components Exist

Higher-level components are useful because common UI elements are not only visual.

A button is not just:

```txt
blue rectangle with text
```

A real design-system Button needs:

- consistent variant colors
- consistent size and spacing
- consistent radius
- hover state
- pressed state
- disabled state
- loading state
- keyboard behavior
- focus behavior
- icon slots
- accessibility attributes
- analytics/event hooks

If every caller used only `Box`, every caller would need to remember all of that.

Instead, CDS lets callers write:

```tsx
<Button variant="primary" compact>
  Continue
</Button>
```

The higher-level component packages repeated decisions.

The tradeoff:

```txt
Box
  more control
  more responsibility

Button
  less control
  less repeated work
  stronger consistency
```

Higher-level components are useful when the same pattern appears many times and needs consistent behavior.

Lower-level primitives are useful when you are building a new pattern or need precise layout control.

## 11. Theme Object vs Style Props

This is the clean distinction:

```txt
Theme object:
  "Here are the values available in this design system."

Style props:
  "This component wants to use some of those values."
```

Example theme object fragment:

```ts
theme.space["2"] = 16;
theme.color.bgPrimary = "rgb(0,82,255)";
theme.borderRadius["200"] = 8;
```

Example style props:

```tsx
<Box padding={2} background="bgPrimary" borderRadius={200} />
```

The theme object does not render UI by itself.

The style props do not know actual values by themselves.

They need the pipeline:

```txt
theme object defines values
ThemeProvider publishes values
style props request values
getStyles maps requests to classes
CSS variables provide actual values
browser renders final CSS
```

## 12. Key Takeaways

1. `ThemeVars` defines legal design words.
2. `coinbaseTheme` maps those words to real values using objects like `space`, `lightColor`, and `borderRadius`.
3. A semantic token like `bgPrimary` is still human-defined. The win is centralization.
4. A component variant token maps a component variant name to semantic roles.
5. `activeColorScheme` is an input to `ThemeProvider`; it may come from app state, UI interaction, system preference, or a default.
6. `ThemeProvider` creates a runtime theme object named `themeApi`.
7. Runtime means while React/the browser app is running.
8. `themeApi.color` is already the active light or dark semantic color object.
9. `value={themeApi}` puts that object into React context so `useTheme()` can read it.
10. `ThemeManager` is the internal wrapper-div helper that publishes CSS variables.
11. `themeCssVars` is the generated CSS-variable style object placed on that wrapper div.
12. `baseStyles` is a collection of generated CSS class maps that read theme CSS variables.
13. `getStyles` turns style props into generated classes and sometimes inline CSS variables.
14. `Button` maps `variant="primary"` to semantic roles, then passes them down.
15. `Pressable` adds behavior.
16. `Interactable` resolves interaction colors and computes state variables.
17. `Box` translates remaining style props into CSS.

Next chapter: `03-cds-engineering-patterns-worth-learning.md` zooms out from theme/style internals and looks at reusable CDS engineering patterns like polymorphic components, stack primitives, accessibility behavior, and guarded escape hatches.
