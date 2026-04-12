# 2026-04-12: Coinbase TextInput Notes for Signup Form

## Table of contents

- [Why this note exists](#why-this-note-exists)
- [Primary reference](#primary-reference)
- [What Coinbase is doing well](#what-coinbase-is-doing-well)
- [Patterns worth copying into this app](#patterns-worth-copying-into-this-app)
- [Patterns to avoid copying blindly](#patterns-to-avoid-copying-blindly)
- [How this applies to Baked with Blessings](#how-this-applies-to-baked-with-blessings)
- [Implementation note for theming](#implementation-note-for-theming)
- [Future design pass](#future-design-pass)

## Why this note exists

The current create-account form needed two things at the same time: clearer product communication and a more disciplined input design system. The specific product problem was that the form technically supported email, phone, or both, but the visual hierarchy still made it feel like email was required and phone was secondary. The design problem was that the earlier styling was too one-off and too dependent on hardcoded colors. This note captures what was useful from Coinbase's `TextInput` examples so the next design pass can stay principled instead of turning into random visual tweaks.

## Primary reference

Official CDS reference: [Coinbase TextInput docs](https://cds.coinbase.com/components/inputs/TextInput/).

Useful sections on that page were:

- `Input Label`
- `Accessible Text Inputs`
- `Helper Text`
- `Color Surge Enabled`
- `Label Variants`
- `Custom Label`
- `StartContent & EndContent`
- `Password input`
- `Example of a Form`
- `Example of a Sign Up Form`

The local repo copies of the most useful reference material are also in:

- [TextInput web examples](/C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/apps/docs/docs/components/inputs/TextInput/_webExamples.mdx)
- [TextInput web implementation](/C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/controls/TextInput.tsx)
- [InputLabel web implementation](/C:/Users/zhang/00My%20Stuff/Coding/Learning/cds/packages/web/src/controls/InputLabel.tsx)

## What Coinbase is doing well

The strongest thing in the Coinbase examples is not some single fancy visual trick. It is restraint. The inputs are visually quiet, labels are explicit, helper text is used to explain the meaning of the field instead of hiding that information in surrounding paragraphs, and the start and end content are only used when they help comprehension. The component library also treats accessibility as part of the default composition instead of an afterthought. Labels, helper text, error state semantics, and input affordances all line up.

Another strong pattern is that Coinbase separates field meaning from field decoration. A label explains what the field is. Helper text explains what the field is for. Sentiment or validation explains what is wrong or right. That sounds obvious, but many forms collapse all of that into placeholder text, which is weaker and less accessible. Their examples keep those layers distinct.

The CDS examples also show discipline around density. Stacked forms use consistent spacing, compact variants are used only when space is actually tight, and side-by-side layout is reserved for fields that are naturally grouped. That creates calm instead of noise.

## Patterns worth copying into this app

The most useful rule to borrow is Coinbase's outside-label default. For this bakery app, outside labels are clearer than floating-label tricks because customers are not filling out a trading terminal or a dense professional tool. The form should feel obvious on first read. That means visible labels, readable helper text, and no guessing about what is required.

The second useful pattern is helper text as micro-instruction. For this app, helper text should answer things like "Do I need both email and phone?" and "What happens if I enter a phone number?" directly at the field level. This is better than making the customer decode one long intro paragraph.

The third useful pattern is controlled use of input adornments. Coinbase uses start and end content for search icons, password visibility toggles, validation indicators, and currency suffixes. That principle transfers well. In this app, the only adornments worth adding soon are likely a password show/hide control and maybe a subtle phone indicator. Decorative clutter should be avoided.

The fourth useful pattern is explicit error sentiment. CDS treats negative state as a first-class visual state and recommends formatting helper errors clearly. For this app, that means validation should read like plain English and the error styling should be predictable rather than surprising.

## Patterns to avoid copying blindly

Coinbase's dark, ultra-minimal surfaces work because the rest of their system is tightly controlled and already branded. Copying that exact colorway into this bakery app would be lazy and wrong. The useful lesson is the structure of the inputs, not "make everything look like Coinbase dark mode." Their spacing, labels, helper text, sentiment system, and restraint are valuable. Their exact colors are not your brand.

Another thing not to copy blindly is compact density. Coinbase can get away with tighter layouts because many of their products are tool-like and high-frequency. This bakery site should still breathe more than a financial console, especially on marketing and account pages.

## How this applies to Baked with Blessings

The create-account form should communicate the contact-method rule immediately: a customer may use email, phone, or both, and at least one is required. That rule should be visible in the hero copy, visible in the section heading, and supported by the field labels themselves. The form should not quietly assume the user will infer the product rule from field order.

The input architecture should remain simple. Use outside labels, concise helper text, clear sections, and one obvious primary action. The phone-verification step should visually read as a second stage rather than as a mysterious extra input that suddenly appears with no context. That is why the current form now treats the verification code block as its own panel.

The visual direction should be considered temporary. The current implementation is deliberately more structured than before, but it is not the final brand system. Its job is to be legible, coherent, and easy to restyle once the designer sends the real palette and art direction.

## Implementation note for theming

The signup form should be easy to re-theme without rewriting the component. To support that, the styling should live behind local CSS custom properties instead of scattering hardcoded hex colors everywhere. In the current implementation, the palette for the signup experience now lives at the top of:

- [CreateAccountForm CSS module](/C:/Users/zhang/00My%20Stuff/Coding/Learning/learning-payload-cms/baked-with-blessings/src/components/forms/CreateAccountForm/index.module.css)

Those variables are the first place to touch when the real designer-provided colorway arrives. That is intentional. The structure of the form can stay stable while the palette changes.

## Future design pass

Once the real palette arrives, the next pass should not start by changing random shades. It should start by deciding the overall emotional direction of the account experience. For example: softer and bakery-like, cleaner and premium, warmer and handmade, or sharper and editorial. After that, the signup form, login form, and forgot-password form should all be brought into the same visual system. The current signup page is now a better structural base for that later pass, but it is not the final brand expression.
