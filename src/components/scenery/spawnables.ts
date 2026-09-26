import type { CSSProperties } from 'react'

import { menuSpawnedAccentSourcesByScene, type SceneTone } from './menuHeroScenery'

export type SpawnMotion =
  | 'arc'
  | 'drift'
  | 'fall'
  | 'flutter'
  | 'hop'
  | 'rise'
  | 'shoot'
  | 'sprout'
  | 'twinkle'

export type SpawnIdle = 'bob' | 'buzz' | 'flap' | 'glow' | 'none' | 'sway'

export type SceneSpawnable = {
  asset?: string
  burst?: number
  cap: number
  icon: string
  id: string
  idle?: SpawnIdle
  kind: 'accent' | 'cloud' | 'sprite'
  label: string
  motion?: SpawnMotion
  size?: readonly [number, number]
}

export type SceneSprite = {
  asset: string
  id: string
  idle: SpawnIdle
  itemId: string
  motion: SpawnMotion
  style: CSSProperties
}

const spawnableAsset = (id: string) => `/spawnables/${id}.svg`

const sprite = (
  id: string,
  label: string,
  motion: SpawnMotion,
  size: readonly [number, number],
  options: { asset?: string; burst?: number; cap?: number; idle?: SpawnIdle } = {},
): SceneSpawnable => {
  const asset = options.asset ?? spawnableAsset(id)

  return {
    asset,
    burst: options.burst,
    cap: options.cap ?? 8,
    icon: asset,
    id,
    idle: options.idle ?? 'none',
    kind: 'sprite',
    label,
    motion,
    size,
  }
}

const cloudItem = (): SceneSpawnable => ({
  cap: 10,
  icon: spawnableAsset('cloud'),
  id: 'cloud',
  kind: 'cloud',
  label: 'Cloud',
})

const accentLabelByScene: Record<SceneTone, string> = {
  blossom: 'Sheep',
  classic: 'Flower',
  dawn: 'Flower',
  'fairy-castle': 'House',
  moonlit: 'Flower',
  'under-tree': 'Flower',
}

const accentIconByScene: Partial<Record<SceneTone, string>> = {
  blossom: spawnableAsset('sheep'),
}

const accentItem = (sceneTone: SceneTone): SceneSpawnable => ({
  cap: 12,
  icon:
    accentIconByScene[sceneTone] ??
    menuSpawnedAccentSourcesByScene[sceneTone]?.[0] ??
    '/flowers/daisy-medium.svg',
  id: 'accent',
  kind: 'accent',
  label: accentLabelByScene[sceneTone],
})

const butterfly = sprite('butterfly', 'Butterfly', 'flutter', [2.2, 3], { idle: 'flap' })
const bunny = sprite('bunny', 'Bunny', 'hop', [3.4, 4.2], {
  asset: '/catering/decor/bunny-hop.svg',
  cap: 5,
})

export const sceneSpawnablesByScene: Record<SceneTone, readonly SceneSpawnable[]> = {
  dawn: [
    cloudItem(),
    accentItem('dawn'),
    sprite('balloon', 'Balloon', 'drift', [4.2, 5.6], { cap: 4, idle: 'bob' }),
    sprite('birds', 'Birds', 'drift', [3.2, 4.2], { cap: 5, idle: 'bob' }),
    butterfly,
    sprite('dandelion', 'Dandelion', 'sprout', [2.4, 3.2], { idle: 'sway' }),
  ],
  'under-tree': [
    cloudItem(),
    accentItem('under-tree'),
    butterfly,
    sprite('birds', 'Birds', 'drift', [3.2, 4.2], { cap: 5, idle: 'bob' }),
    sprite('dandelion', 'Dandelion', 'sprout', [2.4, 3.2], { idle: 'sway' }),
  ],
  moonlit: [
    cloudItem(),
    accentItem('moonlit'),
    sprite('shooting-star', 'Shooting star', 'shoot', [6, 8.5], { cap: 6 }),
    sprite('firefly', 'Firefly', 'flutter', [1.4, 1.9], { cap: 14, idle: 'glow' }),
    sprite('lantern', 'Lantern', 'rise', [2.6, 3.4], { cap: 8, idle: 'glow' }),
    sprite('moth', 'Moth', 'flutter', [2.2, 2.9], { idle: 'flap' }),
  ],
  classic: [
    cloudItem(),
    accentItem('classic'),
    butterfly,
    sprite('bee', 'Bee', 'flutter', [1.5, 2], { cap: 10, idle: 'buzz' }),
    sprite('kite', 'Kite', 'drift', [3.4, 4.4], { cap: 4, idle: 'sway' }),
    sprite('bird', 'Bluebird', 'drift', [2, 2.6], { cap: 6, idle: 'bob' }),
  ],
  blossom: [
    cloudItem(),
    accentItem('blossom'),
    sprite('petals', 'Petals', 'fall', [1.8, 2.6], { burst: 4, cap: 16 }),
    bunny,
    sprite('paper-lantern', 'Lantern', 'rise', [2.4, 3.2], { cap: 6, idle: 'sway' }),
    sprite('butterfly-pink', 'Butterfly', 'flutter', [2.2, 3], { idle: 'flap' }),
  ],
  'fairy-castle': [
    cloudItem(),
    accentItem('fairy-castle'),
    sprite('rainbow', 'Rainbow', 'arc', [13, 18], { cap: 2 }),
    sprite('sparkle', 'Sparkle', 'twinkle', [1.6, 2.4], { cap: 12 }),
    sprite('fairy', 'Fairy', 'flutter', [2.2, 2.8], { cap: 6, idle: 'flap' }),
    sprite('mushroom', 'Mushroom', 'sprout', [2, 2.8], { idle: 'sway' }),
    sprite('dragon', 'Dragon', 'drift', [4.6, 5.8], { cap: 3, idle: 'flap' }),
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
  arc: { duration: [13, 15], x: [8, 58], y: [6, 22] },
  drift: { duration: [30, 48], x: [0, 0], y: [8, 38] },
  fall: { duration: [7, 10], x: [4, 94], y: [-8, -8] },
  flutter: { duration: [7, 11], x: [8, 88], y: [22, 62] },
  hop: { duration: [18, 24], x: [0, 0], y: [0, 0] },
  rise: { duration: [5, 7.5], x: [8, 90], y: [8, 40] },
  shoot: { duration: [5.5, 9], x: [0, 45], y: [2, 22] },
  sprout: { duration: [3.6, 5], x: [6, 94], y: [0, 0] },
  twinkle: { duration: [2, 3.2], x: [6, 94], y: [6, 58] },
}

const driftDurationById: Record<string, readonly [number, number]> = {
  balloon: [46, 62],
  bird: [16, 22],
  birds: [18, 26],
  dragon: [16, 22],
  kite: [34, 44],
}

const createSprite = (item: SceneSpawnable, index: number): SceneSprite => {
  const motion = item.motion ?? 'twinkle'
  const placement = placementByMotion[motion]
  const [minDuration, maxDuration] = driftDurationById[item.id] ?? placement.duration
  const duration = between(minDuration, maxDuration)
  const [minSize, maxSize] = item.size ?? [2, 3]
  const isTravel = motion === 'drift' || motion === 'hop'
  const flip = isTravel && Math.random() < 0.35 ? -1 : 1
  const delay = isTravel
    ? -duration * between(0.18, 0.62)
    : motion === 'fall'
      ? index * 0.45
      : motion === 'shoot'
        ? 0.15
        : motion === 'flutter' || motion === 'twinkle'
          ? -between(0, duration)
          : 0

  return {
    asset: item.asset ?? item.icon,
    id: `sprite-${item.id}-${++sceneSpriteSequence}`,
    idle: item.idle ?? 'none',
    itemId: item.id,
    motion,
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
