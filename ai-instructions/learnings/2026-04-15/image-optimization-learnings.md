# Image Optimization & SSR Learnings (2026-04-15)

## 1. The "Serverless" Upload Trap ⚠️
- **Problem:** When deploying to Vercel (or any Serverless provider), the file system is **ephemeral** (disposable).
- **Outcome:** If an admin uploads a `.png` to a local folder like `/public/media`, that file will be **permanently deleted** as soon as the serverless function "goes to sleep" or a new code update is pushed.
- **Solution:** Use a **Cloud Storage Plugin** (e.g., `@payloadcms/plugin-cloud-storage` with Vercel Blob or AWS S3). The database stores the *URL*, but the actual *file* lives on a permanent, global hard drive.

## 2. How the "Handshake" Works (SSR)
- **The Backend (Librarian):** In a Server-Side Rendered (SSR) page (like Next.js `page.tsx`), Payload finds the product data in the database. It sees the image's permanent URL (e.g., `https://blob.vercel.com/cookie.png`).
- **The HTML (The Paperwork):** The server generates the HTML and writes that URL into the `src` attribute of an `<img>` tag.
- **The Browser (The Driver):** The browser receives the HTML, reads the URL, and automatically "drives" to the cloud storage provider to download the actual pixels.

## 3. The "Head Start" (Priority & Preloading)
- **Concept:** Preloading is a **browser-only** action, but the backend can trigger it.
- **Next.js `priority` Prop:** When you set `priority={true}` on a `next/image` component, the backend adds a `<link rel="preload">` tag to the `<head>` of the HTML.
- **Result:** The browser starts downloading the image **before** it even finishes parsing the rest of the page, making "Above-the-Fold" images (like your main cookie photo) feel nearly instant.

## 4. Why we don't send pixels from the Backend
- **HTML Bloat:** Embedding images directly (Base64) makes the initial text file massive, slowing down the "Time to First Byte."
- **Caching:** Browsers can't cache images that are "stuck" inside HTML. By using a separate URL, the browser can save the image locally and never download it again on the next visit.
