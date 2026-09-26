# Scenery spawnables ("Spawn stuff")

Every scenery has a "Spawn stuff" tray on the homepage and on MenuHero pages. Tapping a tile adds that thing to the scene. There is no limit. Things stay until the visitor presses "Clear all" or changes scenery, unless they die in a living scenery (see below).

## Where things live

- `src/components/scenery/spawnables.ts`: the per-scene catalog (`sceneSpawnablesByScene`), motions, idles and particle effects. The type is `Record<SceneTone, …>`, so a new scenery will not typecheck until it has a lineup.
- `src/components/scenery/scene-spawn.css`: every motion, idle and particle keyframe, plus reduced-motion fallbacks.
- `src/components/scenery/SceneSpawnLayer.tsx`: renders sprites. Ground motions (`gallop`, `sprout`) go in the ground layer; everything else goes in the sky layer.
- `public/spawnables/*.svg`: the art.

## Living ecosystem

Some sceneries have creatures instead of plain sprites. Each one runs a small state machine, reacts to the others, and can die. When one dies, its tray count goes down.

| Scenery | Cast and interactions |
| --- | --- |
| Classic (meadow) | Clouds rain and water flowers. Bees and butterflies drink from flowers and pollinate them, so new flowers sprout. Caterpillars eat flowers, spin a cocoon and hatch into butterflies. Bluebirds hunt bees, butterflies and caterpillars; some bees sting back. A well-fed bird lays an egg. The cat stalks birds that fly low, pounces, then naps. |
| Dawn | Dandelions puff seeds that drift on the wind and sprout where they land. Bunnies eat flowers and breed. The hawk dives on bunnies, carries one high into the sky, and its ghost squiggles away. It also pops balloons. A popped balloon falls, and its crash starts fires. Rain puts fires out. |
| Fairy castle (light fantasy) | Dragons (several breeds and colors) shoot fireballs at the people and buildings below. Knights raise shields, stomp out fires and strike dragons that fly low. Archers lead their shots at dragons. After three hits a dragon crashes. Cottages and pennants catch fire and burn down. Unicorns bolt from fireballs, and frog princes hop away from them. |
| Moonlit (Tangled) | Peaceful. A rowboat drifts on the lake and releases lanterns that float away. Moths circle lanterns, and fireflies slowly sync their glow. Shooting stars still streak across the sky. |
| Blossom, under the tree | Sprites only (see below). |

Code lives in `src/components/scenery/ecosystem/`:

- `engine.ts`: the world (spawn, kill, queries, fire and burning, wind, a cap of 170 on natural births).
- `species/*.ts`: one file per scenery's cast. `species/index.ts` maps each scenery to its species.
- `behaviors.ts`: shared movement helpers (steer, walk, hop, wander, ballistic aim).
- `store.ts`, `useEcosystem.ts` and `EcosystemLayer.tsx`: connect the engine to React. React re-renders only when things are added or removed; motion is written straight to the DOM each frame.
- `ecosystem.css`: idle loops, effects (burning, hurt, guard) and the reduced-motion fallback, which keeps creatures still.

Tags decide who interacts with whom: `fuel` catches fire and burns down, `burnable` dies on touching fire, and `target` can be picked and hit by dragons. Tray tiles use `kind: 'creature'` with a `species` id, and the counts come from the engine.

## Signature animations

Each scenery should have at least one bespoke moment that feels native to it. In living sceneries the interactions are the signature (a dragon crashing after arrows hit it, a balloon popped by the hawk). Sprite sceneries use a bespoke motion:

| Scenery | Signature |
| --- | --- |
| Moonlit | Shooting stars that streak diagonally across the sky (`shoot`) |
| Blossom (Japanese) | Petals tumbling on a breeze (`breeze`), a kitsune fox trailing foxfire, waving koinobori carp streamers, torii gates |
| Under the tree | Paper planes doing loop-the-loops (`loop`); this scenery is not in the picker right now |

## Onboarding a new scenery

1. Add the tone to `SceneTone` and fill in `sceneSpawnablesByScene` with a Cloud tile, the accent tile and 4–6 sprites.
2. Pick at least one signature. Reuse a motion when it fits; otherwise add a new `SpawnMotion` (or `SpawnIdle` / `SpawnParticleEffect`), give it a placement in `placementByMotion`, and write its keyframes in `scene-spawn.css`. Add it to the reduced-motion block so it sits still for visitors who ask for less motion.
3. Draw the art in the house style: flat fills, no outlines, soft tonal shading, colors pulled from the scenery's own SVGs, creatures facing right. Add a separate `icon` when the scene art does not read on the cream tray tile (for example the shooting star). Use `variants` when one tile should spawn a random pick from several designs (for example the dragons).
4. For a living cast: add a `species/<scene>.ts` file, register it in `species/index.ts`, and use `creature()` tiles in the catalog. Give each creature a clear job (eats, hunts, grows, flees, burns) so it has something to react to. Put ground creatures on the front layer and anchor them to `groundY`. If something floats on water, set `--spawn-water-bottom` on the host's ground spawn layer.
5. Check it in the browser on desktop and phone widths.
