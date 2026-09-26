import type { CSSProperties } from 'react'

import { menuSpawnedAccentSourcesByScene, type SceneTone } from './menuHeroScenery'

export type SpawnMotion =
  | 'breeze'
  | 'drift'
  | 'flutter'
  | 'gallop'
  | 'loop'
  | 'rise'
  | 'shoot'
  | 'sprout'
  | 'twinkle'

export type SpawnIdle = 'bob' | 'flap' | 'glow' | 'none' | 'sway' | 'wave'

export type SpawnParticleEffect = 'seeds' | 'sparkles'

export type SpawnParticles = {
  asset: string
  count: number
  effect: SpawnParticleEffect
}

export type SceneSpawnable = {
  asset?: string
  burst?: number
  icon: string
  id: string
  idle?: SpawnIdle
  kind: 'accent' | 'cloud' | 'creature' | 'sprite'
  label: string
  motion?: SpawnMotion
  particles?: SpawnParticles
  size?: readonly [number, number]
  species?: string
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

export const groundSpawnMotions: ReadonlySet<SpawnMotion> = new Set(['gallop', 'sprout'])

const travelMotions: ReadonlySet<SpawnMotion> = new Set(['drift', 'gallop', 'loop'])

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
  } = {},
): SceneSpawnable => {
  const asset = options.asset ?? spawnableAsset(id)

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

const creature = (
  id: string,
  label: string,
  icon: string = spawnableAsset(id),
): SceneSpawnable => ({
  icon,
  id,
  kind: 'creature',
  label,
  species: id,
})

const creatureCloud = creature('cloud', 'Cloud')

const creatureFlower = (sceneTone: SceneTone) =>
  creature(
    'flower',
    'Flower',
    menuSpawnedAccentSourcesByScene[sceneTone]?.[0] ?? '/flowers/daisy-medium.svg',
  )

const butterflyCreature = creature('butterfly', 'Butterfly')

const butterfly = sprite('butterfly', 'Butterfly', 'flutter', [2.2, 3], { idle: 'flap' })
const birds = sprite('birds', 'Birds', 'drift', [3.2, 4.2], { idle: 'bob' })
const dandelion = sprite('dandelion', 'Dandelion', 'sprout', [2.4, 3.2], {
  idle: 'sway',
  particles: { asset: spawnableAsset('dandelion-seed'), count: 6, effect: 'seeds' },
})

export const sceneSpawnablesByScene: Record<SceneTone, readonly SceneSpawnable[]> = {
  dawn: [
    creatureCloud,
    creatureFlower('dawn'),
    creature('dandelion', 'Dandelion', spawnableAsset('dandelion-bloom')),
    creature('bunny', 'Bunny'),
    creature('hawk', 'Hawk'),
    creature('balloon', 'Balloon'),
    butterflyCreature,
    creature('carrot', 'Carrot'),
    creature('fox', 'Fox'),
    creature('hedgehog', 'Hedgehog'),
    creature('scarecrow', 'Scarecrow'),
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
    creatureCloud,
    creatureFlower('moonlit'),
    creature('shooting-star', 'Shooting star', spawnableAsset('shooting-star-icon')),
    creature('boat', 'Boat'),
    creature('lantern', 'Lantern'),
    creature('moth', 'Moth'),
    creature('firefly', 'Firefly'),
    creature('owl', 'Owl'),
    creature('bat', 'Bat'),
    creature('swan', 'Swan'),
    creature('lily-frog', 'Frog'),
  ],
  classic: [
    creatureCloud,
    creatureFlower('classic'),
    creature('bee', 'Bee'),
    butterflyCreature,
    creature('caterpillar', 'Caterpillar'),
    creature('bird', 'Bluebird'),
    creature('cat', 'Cat'),
    creature('beehive', 'Beehive'),
    creature('frog', 'Frog'),
    creature('mouse', 'Mouse'),
    creature('bear', 'Bear'),
  ],
  blossom: [
    creatureCloud,
    creature('sakura', 'Sakura'),
    creature('sheep', 'Sheep', spawnableAsset('sheep')),
    creature('torii', 'Torii gate'),
    creature('monk', 'Monk'),
    creature('samurai', 'Samurai'),
    creature('oni', 'Oni'),
    creature('ninja', 'Ninja'),
    creature('kitsune', 'Kitsune'),
    creature('tanuki', 'Tanuki'),
    creature('crane', 'Crane'),
    creature('chochin', 'Lantern'),
  ],
  'fairy-castle': [
    creatureCloud,
    creature(
      'cottage',
      'Cottage',
      menuSpawnedAccentSourcesByScene['fairy-castle'][0] ?? '/sceneries/fairy-castle-house.svg',
    ),
    creature('dragon', 'Dragon', spawnableAsset('dragon-western-ember')),
    creature('knight', 'Knight'),
    creature('archer', 'Archer'),
    creature('unicorn', 'Unicorn'),
    creature('frog-prince', 'Frog prince'),
    creature('pennant', 'Pennant'),
    creature('princess', 'Princess'),
    creature('wizard', 'Wizard'),
    creature('ballista', 'Ballista'),
    creature('treasure', 'Treasure'),
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
  breeze: { duration: [9, 13], x: [-6, 70], y: [-12, 18] },
  drift: { duration: [30, 48], x: [0, 0], y: [8, 38] },
  flutter: { duration: [7, 11], x: [8, 88], y: [22, 62] },
  gallop: { duration: [14, 18], x: [0, 0], y: [0, 0] },
  loop: { duration: [20, 28], x: [0, 0], y: [10, 36] },
  rise: { duration: [5, 7.5], x: [8, 90], y: [8, 40] },
  shoot: { duration: [5.5, 9], x: [0, 45], y: [2, 22] },
  sprout: { duration: [3.6, 5], x: [6, 94], y: [0, 0] },
  twinkle: { duration: [2, 3.2], x: [6, 94], y: [6, 58] },
}

const driftDurationById: Record<string, readonly [number, number]> = {
  birds: [18, 26],
  crane: [24, 32],
}

const createSprite = (item: SceneSpawnable, index: number): SceneSprite => {
  const motion = item.motion ?? 'twinkle'
  const placement = placementByMotion[motion]
  const [minDuration, maxDuration] = driftDurationById[item.id] ?? placement.duration
  const duration = between(minDuration, maxDuration)
  const [minSize, maxSize] = item.size ?? [2, 3]
  const isTravel = travelMotions.has(motion)
  const flip = isTravel && Math.random() < 0.35 ? -1 : 1
  const delay = isTravel
    ? -duration * between(0.18, 0.62)
    : motion === 'breeze'
      ? index * 0.6
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
    particles: item.particles,
    style: {
      ['--sprite-angle' as string]: `${between(14, 30).toFixed(1)}deg`,
      ['--sprite-delay' as string]: `${delay.toFixed(2)}s`,
      ['--sprite-direction' as string]: flip === -1 ? 'reverse' : 'normal',
      ['--sprite-duration' as string]: `${duration.toFixed(2)}s`,
      ['--sprite-flip' as string]: `${flip}`,
      ['--sprite-idle-delay' as string]: `${(-Math.random() * 3).toFixed(2)}s`,
      ['--sprite-size' as string]: `${between(minSize, maxSize).toFixed(2)}rem`,
      ['--sprite-sway' as string]: `${between(1.2, 3.2).toFixed(2)}rem`,
      ['--sprite-rest-x' as string]: `${between(8, 88).toFixed(2)}%`,
      ['--sprite-x' as string]: `${between(placement.x[0], placement.x[1]).toFixed(2)}%`,
      ['--sprite-y' as string]: `${between(placement.y[0], placement.y[1]).toFixed(2)}%`,
    } as CSSProperties,
  }
}

export const createSceneSprites = (item: SceneSpawnable): SceneSprite[] =>
  Array.from({ length: Math.max(1, item.burst ?? 1) }, (_, index) => createSprite(item, index))
