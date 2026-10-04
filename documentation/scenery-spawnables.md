# Scenery spawnables ("Spawn stuff")

Every scenery has a "Spawn stuff" tray on the homepage and on MenuHero pages. On the homepage, "Change scenery" opens a picker listing every scenery with a small preview. Tapping a tile adds that thing to the scene. There is no limit. Things stay until the visitor presses "Clear all" or changes scenery, unless they die in a living scenery (see below).

## Where things live

- `src/components/scenery/spawnables.ts`: the per-scene catalog (`sceneSpawnablesByScene`), motions, idles and particle effects. The type is `Record<SceneTone, …>`, so a new scenery will not typecheck until it has a lineup.
- `src/components/scenery/scene-spawn.css`: every motion, idle and particle keyframe, plus reduced-motion fallbacks.
- `src/components/scenery/SceneSpawnLayer.tsx`: renders sprites. Ground motions (`gallop`, `sprout`) go in the ground layer; everything else goes in the sky layer.
- `public/spawnables/*.svg`: the art.

## Living ecosystem

Some sceneries have creatures instead of plain sprites. Each one runs a small state machine, reacts to the others, and can die. When one dies, its tray count goes down.

| Scenery | Cast and interactions |
| --- | --- |
| Classic (meadow) | Clouds rain and water flowers. Bees and butterflies drink from flowers and pollinate them, so new flowers sprout. Bees carry nectar home to a beehive, which fills with honey and hatches new bees. The bear raids full hives until the bees swarm and sting it away; the cat flees the bear. Caterpillars eat flowers, spin a cocoon and hatch into butterflies. Bluebirds hunt bees, butterflies and caterpillars; some bees sting back. A well-fed bird lays an egg. Frogs tongue-snap insects that fly low and hop more in the rain. Mice nibble flowers, hide from the cat and breed slowly. The cat stalks mice first, then birds that fly low, pounces, then naps. |
| Dawn | Dandelions puff seeds that drift on the wind and sprout where they land. Bunnies eat flowers, pull up carrots (their favorite) and breed. The fox stalks and pounces on bunnies, which sometimes zigzag away. Hedgehogs snuffle up fallen seeds and curl into a spiky ball when the fox or hawk comes close; a fox that pounces on one gets pricked. The hawk dives on bunnies, carries one high into the sky, where it bursts into dandelion seeds that drift down and sprout into new dandelions. Flocks of crows mob hawks, making them drop bunnies and driving them off after enough pecks; lone crows only harass them. Crows also peck up seeds and carrot sprouts, flee scarecrows and can be caught by foxes while grounded. Bunnies near a scarecrow are safe from the hawk. The hawk also pops balloons. A popped balloon falls, and its crash starts fires (scarecrows burn). Rain puts fires out. |
| Fairy castle (light fantasy) | Dragons (several breeds and colors) shoot fireballs at people and buildings, and land to sleep on treasure, where knights and princes can strike them for double damage. Knights raise shields, stomp out fires and strike low dragons; archers lead their shots, and the ballista fires heavy bolts. The Wizard tile spawns a random archmage (shield, chain lightning, blink), pyromancer (fire lance), frost witch (freeze, ice wall), druid (vines, healing) or storm caller (lightning, rain), each with a rune wind-up, a beam and an impact. The Dark lord is the villain: he curses heroes and unicorns, sets cottages ablaze with green fire, teleports away in black smoke when hurt, and duels wizards with opposing beams whose clash point slides until one side is blasted. Wizards can gang up on him, and he crumbles to ash. Princesses kiss frog princes, who turn into princes and fight like knights. Cottages, pennants and the ballista catch fire and burn down. Unicorns bolt from fireballs, and frog princes hop away from them. |
| Moonlit (Tangled) | Mostly peaceful. A rowboat drifts on the lake and releases lanterns that float away; a swan follows the boat. Moths circle lanterns, and fireflies slowly sync their glow (faster when frogs croak). The owl swoops on moths and bats; bats eat moths and fireflies and flee the owl. Frogs sit on lily pads and snap up low fliers. Shooting stars keep streaking across the sky every few seconds, and every 25th one turns into an asteroid that wipes out the whole scene. Boats, swans, frogs and lily pads each float on their own depth lane, so the lake has near and far. |
| Blossom (Japanese) | The monk meditates, charges ki and fires an energy beam that destroys torii gates and oni. A broken gate lets an oni escape; the kitsune restores ruins so the gate grows back. Oni smash gates, sheep and tanuki, and fear lanterns and foxfire. Samurai hunt oni and revealed ninjas and block shuriken. Ninjas stay hidden, throw shuriken and vanish in smoke; lanterns reveal them. The tanuki turns into a teapot when danger is near. Sakura trees grow, bloom faster in the rain and shed petals; sheep and tanuki rest under them. Cranes perch on gates. |
| Dino valley (prehistoric) | Clouds rain, speed fern growth and douse lava fires. Ferns grow, spread and feed the herbivores. The T. rex roars (visible rings scatter compys, raptors and pterodactyls), then stalks and chomps prey. Triceratops herd, shield babies and charge predators; the brachiosaurus shelters babies and stomps small creatures; the stegosaurus swings its spiked tail at attackers. Raptors hunt in packs for eggs, babies and small prey. Pterodactyls swoop on dragonflies, compys and nests. Compys swarm, steal eggs and scavenge T. rex scraps. Dragonflies (meganeura) breed near ferns. Nests wobble, crack and hatch baby herbivores. The volcano rumbles and throws lava bombs that start fires. Shooting stars loop across the sky like in Moonlit, and every 25th one is the meteor: impact flash, shockwave and fires that wipe out the valley, while eggs survive and hatch afterward. |
| Under the tree | Sprites only (see below). |

Code lives in `src/components/scenery/ecosystem/`:

- `engine.ts`: the world (spawn, kill, queries, fire and burning, wind, a cap of 170 on natural births).
- `species/*.ts`: one file per scenery's cast. `species/index.ts` maps each scenery to its species.
- `behaviors.ts`: shared movement helpers (steer, walk, hop, wander, ballistic aim).
- `store.ts`, `useEcosystem.ts` and `EcosystemLayer.tsx`: connect the engine to React. React re-renders only when things are added or removed; motion is written straight to the DOM each frame.
- `ecosystem.css`: idle loops, effects (burning, hurt, guard) and the reduced-motion fallback, which keeps creatures still.
- `species/<scene>.css`: poses and effects for one scenery's cast, scoped by `data-species`. Each species file registers the sizes of its own art with `registerViewBoxes`.

Tags decide who interacts with whom: `fuel` catches fire and burns down, `burnable` dies on touching fire, and `target` can be picked and hit by dragons. Tray tiles use `kind: 'creature'` with a `species` id, and the counts come from the engine.

Every creature also has strengths and weaknesses, like a gentle Pokémon-style triangle. A species lists `strongVs` and `weakTo` (species ids or tags), and `world.matchup(attacker, defender)` returns `strong`, `weak` or `even`; `world.edge()` turns that into a multiplier (1.6, 1 or 0.5). A strong matchup hits harder or catches more often; a weak one is more likely to miss, flee, get blocked or lose a duel. For example, in Dawn a lone hawk beats bunnies, but a crow flock beats the hawk.

## The tray

The tray can be dragged by its header (or moved with the arrow keys on the grip; Home puts it back). Visitors can pick a layout: a grid, one scrollable row (the default on phones), or a side panel that docks to either edge. A see-through toggle lets them watch the scene behind it. The swords toggle switches the tray to Matchups mode: tapping a tile inspects that creature instead of spawning it, a card shows what it beats and what it is weak to, and the other tiles are marked ▲ (it beats them) or ▼ (they beat it). The layout, the side and see-through are saved in the browser (`baked-with-blessings-spawn-tray`); the dragged position lasts until the page reloads.

A scenery can tease a milestone in the tray (`spawnMilestoneByScene` in `spawnables.ts`). Species bump a running count with `world.tally(key)` and clear it with `world.resetTally(key)`; the tray shows the progress bar and switches to "Something big is coming…" for the last five. Moonlit and Dino valley use it for the 25th-star asteroid.

## Signature animations

Each scenery should have at least one bespoke moment that feels native to it. In living sceneries the interactions are the signature (a dragon crashing after arrows hit it, a balloon popped by the hawk). Sprite sceneries use a bespoke motion:

| Scenery | Signature |
| --- | --- |
| Moonlit | Shooting stars that streak diagonally across the sky, and the asteroid on every 25th star that ends everything |
| Blossom (Japanese) | The monk's energy beam breaking a torii gate |
| Fairy castle (light fantasy) | Wizard and Dark lord beam duels, with a clash point that slides toward the weaker side |
| Dino valley (prehistoric) | The meteor on every 25th shooting star, with eggs that survive and hatch afterward; T. rex roar rings |
| Under the tree | Paper planes doing loop-the-loops (`loop`); this scenery is not in the picker right now |

## Onboarding a new scenery

1. Add the tone to `SceneTone` and fill in `sceneSpawnablesByScene` with a Cloud tile, the accent tile and 4–6 sprites.
2. Pick at least one signature. Reuse a motion when it fits; otherwise add a new `SpawnMotion` (or `SpawnIdle` / `SpawnParticleEffect`), give it a placement in `placementByMotion`, and write its keyframes in `scene-spawn.css`. Add it to the reduced-motion block so it sits still for visitors who ask for less motion.
3. Draw the art in the house style: flat fills, no outlines, soft tonal shading, colors pulled from the scenery's own SVGs, creatures facing right. Add a separate `icon` when the scene art does not read on the cream tray tile (for example the shooting star). Use `variants` when one tile should spawn a random pick from several designs (for example the dragons).
4. For a living cast: add a `species/<scene>.ts` file (and a `species/<scene>.css` imported from `EcosystemLayer.tsx`), register it in `species/index.ts`, and use `creature()` tiles in the catalog. Give each creature a clear job (eats, hunts, grows, flees, burns) so it has something to react to. Put ground creatures on the front layer and anchor them to `groundY`. If something floats on water, set `--spawn-water-bottom` on the host's ground spawn layer.
5. Check it in the browser on desktop and phone widths.
