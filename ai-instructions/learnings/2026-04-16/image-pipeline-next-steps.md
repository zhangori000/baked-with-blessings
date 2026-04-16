# Image Pipeline: What We Have Now and What To Do Next

## Current state on `image-enhancements`

What is already working:

- The `media` collection is wired to Vercel Blob through `@payloadcms/storage-vercel-blob`
- The 14 cookie PNGs were imported through Payload
- The media records exist in the local database
- The actual file bytes exist in Vercel Blob
- Payload admin can see the uploaded media

Current split of responsibilities:

- Postgres stores the `media` documents and their metadata
- Vercel Blob stores the actual binary file bytes
- Payload coordinates both of those
- `next/image` handles frontend delivery optimization when rendering images

## What `import:cookie-media` does vs what `seed` does

`pnpm run import:cookie-media`

- imports the 14 PNGs into the `media` collection
- creates or updates `media` documents
- uploads the file bytes through Payload to Vercel Blob
- does not touch `products`

`pnpm run seed`

- clears product-related dummy catalog data
- creates the cookie `products`
- links those products to the imported `media`

So the clean mental model is:

- `import:cookie-media` = populate the media library
- `seed` = populate the product catalog using that media

## Is `sharp` useful here?

Yes.

In this repo, `sharp` is already installed and already passed into Payload in `src/payload.config.ts`.

Sharp is the image processing engine Payload can use at upload time. In this project, that means the business owner can upload one large source image and Payload can use Sharp to create smaller, purpose-specific versions of it. For example, if `cookie-singular-brookie.png` is uploaded at `1920x1080`, Sharp can help generate a tiny admin thumbnail, a square card image for the mobile cookie grid, and a larger tablet/detail image for iPad layouts. Sharp can also crop, trim, resize, and re-encode images into more web-friendly outputs.

Payload's upload docs call out four relevant Sharp-powered options: `imageSizes`, `resizeOptions`, `formatOptions`, and `constructorOptions`. A practical mental model is: `imageSizes` means "generate named variants like thumbnail/card/poster"; `resizeOptions` means "control how the image is resized"; `formatOptions` means "control the output format and encoding options"; and `constructorOptions` means "pass lower-level Sharp behavior into the pipeline when needed." So no, you do not need another image library first. Sharp is already your upload-time image-processing engine.

## Order of operations

The order matters, and it helps separate the concepts that were getting mixed together. First, a file is uploaded into the Payload `media` collection. Second, Payload creates the `media` document in Postgres. Third, because the `media` collection is using the Vercel Blob adapter, the original file bytes are stored in Blob. Fourth, if you configure `imageSizes` or other upload-time processing, Payload uses Sharp during the upload pipeline to generate additional variants. Fifth, when the frontend renders an image, `next/image` helps deliver an appropriately sized version to the browser.

That means there are really two different optimization layers in play. Upload-time optimization is Payload + Sharp + Blob. Delivery-time optimization is Next.js + browser behavior. They work together, but they are not the same thing.

## Where Payload `imageSizes` fits in

`imageSizes` is configured in collection config, not in a seed or import script. In this repo, you would put it in `src/collections/Media.ts`, inside the `upload` object. So when you asked "what even is this, do we specify in some script?", the answer is no. This is a `Media` collection configuration concern.

The usual strategy is: keep the original upload in Blob as the master asset, and also have Payload generate named variants at upload time. So yes, the normal setup is "original in Blob plus many variants." With the Vercel Blob adapter in place, those upload-time generated assets are handled through the same storage pipeline. The original is still useful as the source of truth, while the smaller named variants are useful for predictable UI slots.

Example:

```ts
upload: {
  adminThumbnail: 'thumbnail',
  imageSizes: [
    { name: 'thumbnail', width: 160, height: 160 },
    { name: 'card', width: 480, height: 480 },
    { name: 'poster', width: 768, height: 1024 },
    { name: 'tablet', width: 1024, height: undefined },
  ],
}
```

Here is what those names would mean in practice. `thumbnail` is for the Payload admin list view, where you only need a tiny preview. `card` is for a repeated storefront grid, especially on mobile, where each cookie image is compact and appears many times. `poster` is for a taller, more visual treatment such as a masonry tile or poster-style cookie display. `tablet` is for an iPad product detail or a larger content panel where the image is wider but still does not need the original full-size upload.

This **is** a Sharp-backed Payload feature. Payload is the config layer you write; Sharp is the image-processing engine doing the actual resizing work.

## Why `next/image` helps but does not solve everything

`next/image` is still very valuable, but it helps at the browser-delivery layer, not at the full CMS/content-model layer. In this repo, `src/components/Media/Image/index.tsx` already uses `next/image`, so you already benefit from several good defaults. The confusing part is that people often hear "Next optimizes images" and assume that means the entire image pipeline is solved. It does not. It means the image delivery step is improved once the app already has a real image source to render.

### What lazy loading means

Lazy loading means the browser does not eagerly fetch every image on the page the moment the HTML arrives. Images near the viewport are prioritized first, while images farther down the page are delayed until the user scrolls closer to them. A cookie-grid example is: if the page shows the first 6 cookies above the fold and 20 more below, the browser should start with the visible 6 and avoid immediately downloading all 26. That reduces initial bandwidth and makes the page feel faster.

At the API level, you mostly think in terms of `loading="lazy"` versus making an image eager/preloaded. The exact internal mechanism is less important than the behavior, and framework internals can change over time. If you need custom threshold-style behavior, `next/image` does not really expose a "start loading when 300px away from viewport" prop. In that case, you usually build your own wrapper or conditional render logic.

```tsx
<Image
  src={cookieUrl}
  alt="Brookie cookie"
  width={480}
  height={480}
  loading="lazy"
/>
```

### What responsive sizing behavior means

Responsive sizing behavior means the browser can choose a different image width depending on the device and layout. One cookie image should not send the same bytes to every screen. If a cookie card is only about `180px` wide on a phone, there is no reason to send a `1920px` wide source to that phone. On an iPhone, the browser might choose a much smaller candidate, while on an iPad landscape grid it might choose a larger one because the slot on screen is larger.

The limitation is that Next can only make a good decision if you tell it the truth about the layout. The `sizes` prop is your hint to the browser about how wide the rendered image is likely to be. If `sizes` is wrong, the browser may choose an image that is too large or too small.

```tsx
<Image
  src={cookieUrl}
  alt="Brookie cookie"
  width={480}
  height={480}
  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
/>
```

That example says: on smaller screens the image takes about half the viewport width; on medium screens about a third; on larger screens about a quarter. That is what helps the browser choose an appropriate candidate.

### What width / height based layout stability means

When Next knows the image dimensions, it can reserve the right amount of space before the image finishes loading. That prevents layout shift. Without this, a cookie card may first render as an empty box, then suddenly expand when the image arrives, which makes scrolling feel jumpy. With correct dimensions, the card size is stable from the start. This is especially important for mobile and iPad users because layout jumpiness is very noticeable in stacked feeds and poster-style grids.

### What "serving optimized variants to the browser" means

This is related to responsive sizing, but it is not the same thing. Responsive sizing is the decision logic about how big the image needs to be for the slot. Serving optimized variants is the result of that logic.

Example: suppose the original file in Blob is `cookie-singular-brookie.png` at `1920x1080` and about `1.7MB`. A phone user does not need that exact source file. After the browser understands the slot size, Next can serve a smaller, more web-friendly version for that specific request, for example a compressed `384w` or `512w` candidate. A larger iPad slot might receive something like `768w` or `1024w`. So the difference is:

- responsive sizing = deciding how big the image should be for this layout
- optimized variant delivery = actually sending bytes that match that decision

### What placeholders, `sizes`, quality, and priority hints mean

Placeholders help the page look stable while an image is still decoding or downloading. A common example is a blurred or low-detail placeholder for a hero cookie while the sharper version loads. The `sizes` prop tells the browser how large the image is expected to be in different layouts. Quality settings control the tradeoff between crispness and file size. Priority-like hints such as eager/preload behavior are for images that are critical to the first screen, like a hero image. You would not normally mark every cookie card as high priority, because then you lose the benefit of prioritization.

Example with a placeholder:

```tsx
<Image
  src={cookieUrl}
  alt="Brookie cookie"
  width={768}
  height={768}
  sizes="(max-width: 768px) 90vw, 40vw"
  quality={80}
  placeholder="blur"
  blurDataURL={tinyPreview}
/>
```

Example with preload for a critical hero image:

```tsx
<Image
  src={heroUrl}
  alt="Featured cookie hero"
  width={1200}
  height={800}
  preload
/>
```

If you want something closer to the Pinterest screenshot you showed, that is less about blurred image placeholders and more about skeleton placeholders. A skeleton placeholder is a neutral gray rounded rectangle that matches the final card shape before the real image and content load. The key idea is that the skeleton should already have the right aspect ratio and layout footprint, so the page feels stable even when the real content is not ready yet.

Example skeleton card:

```tsx
<div className="cookie-card">
  {!isLoaded && <div className="cookie-skeleton" aria-hidden="true" />}
  <Image
    src={cookieUrl}
    alt="Brookie cookie"
    width={480}
    height={640}
    sizes="(max-width: 768px) 48vw, (max-width: 1200px) 31vw, 22vw"
    onLoad={() => setIsLoaded(true)}
    className={isLoaded ? 'cookie-image is-visible' : 'cookie-image'}
  />
</div>
```

Example CSS shape for that Pinterest-like placeholder:

```css
.cookie-card {
  position: relative;
}

.cookie-skeleton {
  aspect-ratio: 3 / 4;
  width: 100%;
  border-radius: 24px;
  background: #f1efec;
}

.cookie-image {
  opacity: 0;
  transition: opacity 180ms ease;
}

.cookie-image.is-visible {
  opacity: 1;
}
```

That pattern is good when you want the UI to feel instantly structured, even before images finish decoding. It is especially useful for Pinterest-like masonry or poster layouts, where the empty boxes need to hold the layout together during loading.

### A concrete mental model for mobile and iPad

Think in terms of the image slot on screen, not the original upload file. If the storefront has a two-column mobile cookie grid, each cookie image might only need something around `320` to `480` pixels wide. If the same cookie opens in a larger iPad detail panel, that panel might need something closer to `768` or `1024` pixels wide. The original upload can still exist in Blob as the master asset, but the browser should usually receive something closer to the slot it is filling.

### Why `next/image` still does not solve the full problem

The cleaner way to say this is: `next/image` helps deliver rendered images efficiently, but it does not define your CMS workflow or your data model. It does not create Payload `media` records, seed `products`, attach media to products, or replace hardcoded storefront data. If the storefront is still reading from `cookiePosterData.ts`, then the app is still using a hardcoded source of truth even if `next/image` is making the final browser delivery more efficient.

Example: you could have a hardcoded cookie array with 14 image URLs and still use `next/image`. In that case, image delivery might be decent, but the business owner still cannot manage those cookies through Payload. That is why `next/image` improves performance without automatically solving the CMS-driven workflow problem.

`next/image` also does not make the original source in Blob smaller. Right now your uploaded cookie PNGs are roughly `1.6MB` to `2.1MB`. Even if the browser receives smaller optimized variants, the source file in Blob is still large. Storage cost, upload-time processing cost, and first-time optimization all still start from that larger source. That is why upload-time optimization and delivery-time optimization are different concerns.

## So what should this branch probably do next?

Yes, the next likely improvement is a Sharp thing, but through Payload's config layer. On `image-enhancements`, the next useful step after `pnpm run seed` is probably to add `imageSizes` to `src/collections/Media.ts`. That would give you named variants for admin and storefront use. I would start there before doing more aggressive image format conversion rules. It is easier to understand, easier to verify, and a cleaner first improvement.

After that, the bigger win is still to refactor the cookie storefront so it reads from Payload `products` and `media` rather than hardcoded poster data. That is the step that makes the business-owner workflow real.

## Official references

- Payload Uploads: https://payloadcms.com/docs/upload/overview
- Payload Storage Adapters: https://payloadcms.com/docs/upload/storage-adapters
- Next.js Image Component: https://nextjs.org/docs/app/api-reference/components/image
- Next.js Image Optimization Getting Started: https://nextjs.org/docs/app/getting-started/images
- Sharp: https://sharp.pixelplumbing.com/
