## Maxima Therapy tech stack note

Date: 2026-04-12

Primary trusted source:
- Codrops case study: https://tympanus.net/codrops/2026/04/06/building-the-maxima-therapy-website-react-gsap-and-dabbling-with-ai/

Reason this source is trusted:
- It is a build write-up by the credited developer, so it is stronger than detector tools or guesswork from DevTools fingerprints.

Stack and implementation notes to treat as authoritative unless contradicted by code:
- Sanity for CMS/content.
- React Router with static generation.
- Cloudflare Pages for hosting/deployment.
- Tailwind CSS.
- CSS Modules.
- TypeScript.
- GSAP for core animation orchestration.
- ScrollTrigger for scroll-driven motion.
- Lenis for smooth scrolling.
- Lottie for some vector/illustration animation.
- Matter.js for physics-driven interactions.
- Custom canvas work for bespoke visuals/interactions.

Important interpretation:
- If other tools report "Remix", treat that carefully. Public detectors often blur React Router / Remix family signals. The Codrops article is the primary source.
- For future design work, the useful lesson is not just the specific libraries. The bigger pattern is:
  - motion is layered intentionally
  - there is one orchestrator for major transitions
  - bespoke visuals are handled with custom surfaces like canvas/Lottie/physics instead of trying to force everything through plain CSS alone
  - typography, spacing, and motion timing are treated as one system

Practical takeaway for this repo:
- When trying to reproduce premium interactions, first decide the animation architecture:
  - pure CSS transition
  - GSAP timeline
  - physics layer
  - canvas layer
  - Lottie/vector layer
- Do not guess the stack from visuals alone when a primary-source engineering article exists.
