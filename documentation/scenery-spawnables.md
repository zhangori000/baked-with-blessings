# Scenery spawnables ("Spawn stuff")

Every scenery has a "Spawn stuff" tray on the homepage and on MenuHero pages. Tapping a tile adds that thing to the scene. There is no limit; things stay until the visitor presses "Clear all" or changes scenery.

## Where things live

- `src/components/scenery/spawnables.ts`: the per-scene catalog (`sceneSpawnablesByScene`), motions, idles and particle effects. The type is `Record<SceneTone, …>`, so a new scenery will not typecheck until it has a lineup.
- `src/components/scenery/scene-spawn.css`: every motion, idle and particle keyframe, plus reduced-motion fallbacks.
- `src/components/scenery/SceneSpawnLayer.tsx`: renders sprites. Ground motions (`gallop`, `hop`, `march`, `sprout`) go in the ground layer; everything else goes in the sky layer.
- `public/spawnables/*.svg`: the art.

## Signature animations

Each scenery should have at least one bespoke animation that feels native to it:

| Scenery | Signature |
| --- | --- |
| Dawn | Dandelions that release floating seeds (`seeds` particles) |
| Moonlit | Shooting stars that streak diagonally across the sky (`shoot`) |
| Classic | Kites flying figure-eights on a string (`kite`), bees that zip and hover (`zip`) |
| Blossom | Petals tumbling on a breeze (`breeze`) |
| Fairy castle (light fantasy) | Galloping unicorns with a sparkle trail, dragons puffing flame, waving pennants, leaping frog princes |
| Under the tree | Paper planes doing loop-the-loops (`loop`); this scenery is not in the picker right now |

## Onboarding a new scenery

1. Add the tone to `SceneTone` and fill in `sceneSpawnablesByScene` with a Cloud tile, the accent tile and 4–6 sprites.
2. Pick at least one signature. Reuse a motion when it fits; otherwise add a new `SpawnMotion` (or `SpawnIdle` / `SpawnParticleEffect`), give it a placement in `placementByMotion`, and write its keyframes in `scene-spawn.css`. Add it to the reduced-motion block so it sits still for visitors who ask for less motion.
3. Draw the art in the house style: flat fills, no outlines, soft tonal shading, colors pulled from the scenery's own SVGs, creatures facing right. Add a separate `icon` when the scene art does not read on the cream tray tile (for example the shooting star).
4. Check it in the browser on desktop and phone widths.
