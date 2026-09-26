import type { CSSProperties } from 'react'

import { menuSpawnedAccentSourcesByScene, type SceneTone } from './menuHeroScenery'

export type SpawnMotion =
  | 'arc'
  | 'breeze'
  | 'drift'
  | 'flutter'
  | 'gallop'
  | 'hop'
  | 'kite'
  | 'loop'
  | 'march'
  | 'rise'
  | 'shoot'
  | 'sprout'
  | 'twinkle'
  | 'zip'

export type SpawnIdle =
  | 'bob'
  | 'buzz'
  | 'flap'
  | 'glow'
  | 'leap'
  | 'none'
  | 'sway'
  | 'undulate'
  | 'wave'

export type SpawnParticleEffect = 'flame' | 'seeds' | 'sparkles'

export type SpawnParticles = {
  asset: string
  count: number
  effect: SpawnParticleEffect
}

export type SpawnVariant = {
  asset: string
  idle?: SpawnIdle
  particles?: SpawnParticles
  size?: readonly [number, number]
}

export type SceneSpawnable = {
  asset?: string
  burst?: number
  icon: string
  id: string
  idle?: SpawnIdle
  kind: 'accent' | 'cloud' | 'sprite'
  label: string
  motion?: SpawnMotion
  particles?: SpawnParticles
  size?: readonly [number, number]
  variants?: readonly SpawnVariant[]
}

export type SceneSprite = {
  asset: string
  id: string
  idle: SpawnIdle
  itemId: string
  motion: SpawnMotion
  particles?: SpawnParticles
  style: CSSProperties
}

export const groundSpawnMotions: ReadonlySet<SpawnMotion> = new Set([
  'gallop',
  'hop',
  'march',
  'sprout',
])

const travelMotions: ReadonlySet<SpawnMotion> = new Set(['drift', 'gallop', 'hop', 'loop', 'march'])

const spawnableAsset = (id: string) => `/spawnables/${id}.svg`

const sprite = (
  id: string,
  label: string,
  motion: SpawnMotion,
  size: readonly [number, number],
  options: {
    asset?: string
    burst?: number
    icon?: string
    idle?: SpawnIdle
    particles?: SpawnParticles
    variants?: readonly SpawnVariant[]
  } = {},
): SceneSpawnable => {
  const asset = options.asset ?? options.variants?.[0]?.asset ?? spawnableAsset(id)

  return {
    asset,
    burst: options.burst,
    icon: options.icon ?? asset,
    id,
    idle: options.idle ?? 'none',
    kind: 'sprite',
    label,
    motion,
    particles: options.particles,
    size,
    variants: options.variants,
  }
}

const cloudItem = (): SceneSpawnable => ({
  icon: spawnableAsset('cloud'),
  id: 'cloud',
  kind: 'cloud',
  label: 'Cloud',
})

const accentLabelByScene: Record<SceneTone, string> = {
  blossom: 'Sheep',
  classic: 'Flower',
  dawn: 'Flower',
  'fairy-castle': 'Cottage',
  moonlit: 'Flower',
  'under-tree': 'Flower',
}

const accentIconByScene: Partial<Record<SceneTone, string>> = {
  blossom: spawnableAsset('sheep'),
}

const accentItem = (sceneTone: SceneTone): SceneSpawnable => ({
  icon:
    accentIconByScene[sceneTone] ??
    menuSpawnedAccentSourcesByScene[sceneTone]?.[0] ??
    '/flowers/daisy-medium.svg',
  id: 'accent',
  kind: 'accent',
  label: accentLabelByScene[sceneTone],
})

const sparkleTrail: SpawnParticles = {
  asset: spawnableAsset('unicorn-sparkle'),
  count: 5,
  effect: 'sparkles',
}

const flamePuffs: SpawnParticles = {
  asset: spawnableAsset('flame-puff'),
  count: 3,
  effect: 'flame',
}

const easternDragon = (color: string): SpawnVariant => ({
  asset: spawnableAsset(`dragon-eastern-${color}`),
  idle: 'undulate',
  size: [7, 9],
})

const westernDragon = (color: string): SpawnVariant => ({
  asset: spawnableAsset(`dragon-western-${color}`),
  idle: 'flap',
  particles: flamePuffs,
  size: [5, 6.4],
})

const butterfly = sprite('butterfly', 'Butterfly', 'flutter', [2.2, 3], { idle: 'flap' })
const birds = sprite('birds', 'Birds', 'drift', [3.2, 4.2], { idle: 'bob' })
const dandelion = sprite('dandelion', 'Dandelion', 'sprout', [2.4, 3.2], {
  idle: 'sway',
  particles: { asset: spawnableAsset('dandelion-seed'), count: 6, effect: 'seeds' },
})

export const sceneSpawnablesByScene: Record<SceneTone, readonly SceneSpawnable[]> = {
  dawn: [
    cloudItem(),
    accentItem('dawn'),
    sprite('balloon', 'Balloon', 'drift', [4.2, 5.6], { idle: 'bob' }),
    birds,
    butterfly,
    dandelion,
  ],
  'under-tree': [
    cloudItem(),
    accentItem('under-tree'),
    sprite('paper-plane', 'Paper plane', 'loop', [2.4, 3]),
    butterfly,
    birds,
    dandelion,
  ],
  moonlit: [
    cloudItem(),
    accentItem('moonlit'),
    sprite('shooting-star', 'Shooting star', 'shoot', [6, 8.5], {
      icon: spawnableAsset('shooting-star-icon'),
    }),
    sprite('firefly', 'Firefly', 'flutter', [1.4, 1.9], { idle: 'glow' }),
    sprite('lantern', 'Lantern', 'rise', [2.6, 3.4], { idle: 'glow' }),
    sprite('moth', 'Moth', 'flutter', [2.2, 2.9], { idle: 'flap' }),
  ],
  classic: [
    cloudItem(),
    accentItem('classic'),
    sprite('kite', 'Kite', 'kite', [3.4, 4.4]),
    sprite('bee', 'Bee', 'zip', [1.5, 2], { idle: 'buzz' }),
    butterfly,
    sprite('bird', 'Bluebird', 'drift', [2, 2.6], { idle: 'bob' }),
    sprite('rainbow', 'Rainbow', 'arc', [10, 18]),
  ],
  blossom: [
    cloudItem(),
    accentItem('blossom'),
    sprite('petals', 'Petals', 'breeze', [1.6, 2.4], { burst: 5 }),
    sprite('torii', 'Torii gate', 'sprout', [5.2, 6.6]),
    sprite('kitsune', 'Kitsune', 'gallop', [3.4, 4.2], {
      particles: { asset: spawnableAsset('foxfire'), count: 5, effect: 'sparkles' },
    }),
    sprite('crane', 'Crane', 'drift', [3.8, 5], { idle: 'flap' }),
    sprite('koinobori', 'Koinobori', 'sprout', [4, 5], { idle: 'wave' }),
    sprite('chochin', 'Lantern', 'rise', [2.2, 3], { idle: 'glow' }),
  ],
  'fairy-castle': [
    cloudItem(),
    accentItem('fairy-castle'),
    sprite('unicorn', 'Unicorn', 'gallop', [4.4, 5.4], { particles: sparkleTrail }),
    sprite('dragon', 'Dragon', 'drift', [5, 6.4], {
      icon: spawnableAsset('dragon-eastern-red'),
      variants: [
        easternDragon('red'),
        easternDragon('jade'),
        westernDragon('ember'),
        westernDragon('frost'),
        westernDragon('emerald'),
      ],
    }),
    sprite('knight', 'Knight', 'march', [2.8, 3.4]),
    sprite('pennant', 'Pennant', 'sprout', [3, 3.8], { idle: 'wave' }),
    sprite('fairy', 'Fairy', 'flutter', [2.2, 2.8], { idle: 'flap', particles: sparkleTrail }),
    sprite('frog-prince', 'Frog prince', 'sprout', [2, 2.6], { idle: 'leap' }),
  ],
}

let sceneSpriteSequence = 0

const between = (min: number, max: number) => min + Math.random() * (max - min)

const placementByMotion: Record<
  SpawnMotion,
  {
    duration: readonly [number, number]
    x: readonly [number, number]
    y: readonly [number, number]
  }
> = {
  arc: { duration: [1, 1], x: [-6, 80], y: [0, 36] },
  breeze: { duration: [9, 13], x: [-6, 70], y: [-12, 18] },
  drift: { duration: [30, 48], x: [0, 0], y: [8, 38] },
  flutter: { duration: [7, 11], x: [8, 88], y: [22, 62] },
  gallop: { duration: [14, 18], x: [0, 0], y: [0, 0] },
  hop: { duration: [18, 24], x: [0, 0], y: [0, 0] },
  kite: { duration: [9, 13], x: [12, 80], y: [6, 26] },
  loop: { duration: [20, 28], x: [0, 0], y: [10, 36] },
  march: { duration: [30, 40], x: [0, 0], y: [0, 0] },
  rise: { duration: [5, 7.5], x: [8, 90], y: [8, 40] },
  shoot: { duration: [5.5, 9], x: [0, 45], y: [2, 22] },
  sprout: { duration: [3.6, 5], x: [6, 94], y: [0, 0] },
  twinkle: { duration: [2, 3.2], x: [6, 94], y: [6, 58] },
  zip: { duration: [6, 9], x: [10, 86], y: [30, 62] },
}

const driftDurationById: Record<string, readonly [number, number]> = {
  balloon: [46, 62],
  bird: [16, 22],
  birds: [18, 26],
  crane: [24, 32],
  dragon: [16, 22],
}

const pickVariant = (item: SceneSpawnable): SpawnVariant | undefined =>
  item.variants?.length
    ? item.variants[Math.floor(Math.random() * item.variants.length)]
    : undefined

const createSprite = (item: SceneSpawnable, index: number): SceneSprite => {
  const variant = pickVariant(item)
  const motion = item.motion ?? 'twinkle'
  const placement = placementByMotion[motion]
  const [minDuration, maxDuration] = driftDurationById[item.id] ?? placement.duration
  const duration = between(minDuration, maxDuration)
  const [minSize, maxSize] = variant?.size ?? item.size ?? [2, 3]
  const isTravel = travelMotions.has(motion)
  const flip = isTravel && Math.random() < 0.35 ? -1 : 1
  const delay = isTravel
    ? -duration * between(0.18, 0.62)
    : motion === 'breeze'
      ? index * 0.6
      : motion === 'shoot'
        ? 0.15
        : motion === 'flutter' || motion === 'twinkle' || motion === 'zip' || motion === 'kite'
          ? -between(0, duration)
          : 0

  return {
    asset: variant?.asset ?? item.asset ?? item.icon,
    id: `sprite-${item.id}-${++sceneSpriteSequence}`,
    idle: variant?.idle ?? item.idle ?? 'none',
    itemId: item.id,
    motion,
    particles: variant?.particles ?? item.particles,
    style: {
      ['--sprite-angle' as string]: `${between(14, 30).toFixed(1)}deg`,
      ['--sprite-delay' as string]: `${delay.toFixed(2)}s`,
      ['--sprite-direction' as string]: flip === -1 ? 'reverse' : 'normal',
      ['--sprite-duration' as string]: `${duration.toFixed(2)}s`,
      ['--sprite-flip' as string]: `${flip}`,
      ['--sprite-idle-delay' as string]: `${(-Math.random() * 3).toFixed(2)}s`,
      ['--sprite-size' as string]: `${between(minSize, maxSize).toFixed(2)}rem`,
      ['--sprite-sway' as string]: `${between(1.2, 3.2).toFixed(2)}rem`,
      ['--sprite-x' as string]: `${between(placement.x[0], placement.x[1]).toFixed(2)}%`,
      ['--sprite-y' as string]: `${between(placement.y[0], placement.y[1]).toFixed(2)}%`,
    } as CSSProperties,
  }
}

export const createSceneSprites = (item: SceneSpawnable): SceneSprite[] =>
  Array.from({ length: Math.max(1, item.burst ?? 1) }, (_, index) => createSprite(item, index))
