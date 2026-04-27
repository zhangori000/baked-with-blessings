import type { CSSProperties } from 'react'

export type SceneTone = 'dawn' | 'under-tree' | 'moonlit' | 'classic' | 'blossom' | 'fairy-castle'

export type SceneCloudConfig = {
  className: string
  src: string
  style?: CSSProperties
}

export type SceneCloudSpawnConfig = {
  maxWidth: number
  minWidth: number
  src: string
}

export type SceneFlowerConfig = {
  asset: string
  left: string
  scale: number
  variant?: 'full' | 'wildflower'
}

export type ScenePieceConfig = {
  className: string
  src: string
  style?: CSSProperties
}

export type SceneCritterConfig = {
  className: string
  src: string
  style?: CSSProperties
}

export type SceneAccentConfig = {
  asset: string
  bottom?: string
  id: number
  left: string
  scale: number
}

export const menuSceneTones: SceneTone[] = [
  'dawn',
  'under-tree',
  'moonlit',
  'classic',
  'blossom',
  'fairy-castle',
]
export const persistentMenuSceneStorageKey = 'baked-with-blessings-menu-scene'

export const menuHeroSkyByScene: Record<SceneTone, string> = {
  dawn: '/sceneries/brown-anime-gradient-sky.svg',
  'under-tree': '/sceneries/girl-under-tree-sky.svg',
  moonlit: '/sceneries/moonlit-purple-sky.svg',
  classic: '/sceneries/classic-sky.svg',
  blossom: '/sceneries/blossom-breeze-sky.svg',
  'fairy-castle': '/sceneries/fairy-castle.svg',
}

export const menuHeroMobileSkyByScene: Partial<Record<SceneTone, string>> = {
  dawn: '/sceneries/brown-anime-gradient-sky-mobile-experimental.svg',
  blossom: '/sceneries/blossom-breeze-sky-mobile-experimental.svg',
  'fairy-castle': '/sceneries/fairy-castle-mobile-experimental.svg',
  classic: '/sceneries/classic-sky-mobile-experimental.svg',
  'under-tree': '/sceneries/girl-under-tree-sky-mobile-experimental.svg',
  moonlit: '/sceneries/moonlit-purple-sky-mobile-experimental.svg',
}

export const menuHeroMobileMeadowByScene: Partial<Record<SceneTone, string>> = {
  dawn: '/sceneries/brown-anime-rolling-meadow-mobile.svg',
  'under-tree': '/sceneries/girl-under-tree-meadow-mobile.svg',
  moonlit: '/sceneries/moonlit-purple-meadow-mobile.svg',
  classic: '/sceneries/classic-meadow-mobile.svg',
}

export const menuHeroMeadowByScene: Record<SceneTone, string> = {
  dawn: '/sceneries/brown-anime-rolling-meadow.svg',
  'under-tree': '/sceneries/girl-under-tree-meadow.svg',
  moonlit: '/sceneries/moonlit-purple-meadow.svg',
  classic: '/sceneries/classic-meadow.svg',
  blossom: '/sceneries/blossom-grass-mound.svg',
  'fairy-castle': '/sceneries/transparent-meadow.svg',
}

export const menuSceneButtonAuraByScene: Record<SceneTone, string> = {
  dawn: 'rgba(255, 214, 101, 0.85)',
  'under-tree': 'rgba(197, 228, 142, 0.82)',
  moonlit: 'rgba(153, 115, 255, 0.88)',
  classic: 'rgba(255, 215, 79, 0.84)',
  blossom: 'rgba(255, 176, 208, 0.9)',
  'fairy-castle': 'rgba(154, 172, 138, 0.88)',
}

export const menuScenePriceColorByScene: Record<SceneTone, string> = {
  dawn: 'rgba(62, 68, 20, 0.86)',
  'under-tree': 'rgba(49, 69, 28, 0.84)',
  moonlit: 'rgba(243, 235, 255, 0.94)',
  classic: 'rgba(23, 52, 31, 0.68)',
  blossom: 'rgba(91, 48, 80, 0.84)',
  'fairy-castle': 'rgba(248, 242, 214, 0.94)',
}

export const menuScenePriceShadowByScene: Record<SceneTone, string> = {
  dawn: '0 1px 0 rgba(255, 249, 220, 0.35)',
  'under-tree': '0 1px 0 rgba(245, 255, 230, 0.38)',
  moonlit: '0 2px 10px rgba(23, 18, 54, 0.52)',
  classic: 'none',
  blossom: '0 1px 0 rgba(255, 245, 251, 0.45)',
  'fairy-castle': '0 2px 10px rgba(71, 86, 53, 0.35)',
}

export const menuHeroCloudsByScene: Record<SceneTone, readonly SceneCloudConfig[]> = {
  dawn: [
    {
      className: 'left-[30%] top-[8%] w-[13rem] md:left-[36%] md:w-[17rem]',
      src: '/clouds/brown-anime-cloud-fluffy.svg',
      style: { animationDelay: '-9s' },
    },
    {
      className: 'right-[10%] top-[14%] w-[17rem] md:right-[8%] md:w-[21rem]',
      src: '/clouds/brown-anime-cloud-layered.svg',
      style: { animationDelay: '-16s' },
    },
    {
      className: 'right-[4%] top-[28%] hidden w-[12rem] md:block md:w-[15rem]',
      src: '/clouds/brown-anime-cloud-fluffy.svg',
      style: { animationDelay: '-4s' },
    },
  ],
  'under-tree': [
    {
      className: 'right-[5%] top-[15%] w-[13rem] md:right-[6%] md:w-[16rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
      style: { animationDelay: '-13s' },
    },
    {
      className: 'left-[44%] top-[24%] hidden w-[8rem] md:block md:w-[9.5rem]',
      src: '/clouds/three-ball-cloud.svg',
      style: { animationDelay: '-5s' },
    },
    {
      className: 'right-[22%] top-[31%] hidden w-[8.5rem] md:block md:w-[10rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
      style: { animationDelay: '-18s' },
    },
  ],
  moonlit: [
    {
      className: 'left-[2%] top-[9%] w-[18rem] md:w-[22rem]',
      src: '/clouds/moonlit-purple-upper-cloud.svg',
    },
    {
      className: 'right-[6%] top-[14%] w-[18rem] md:w-[22rem]',
      src: '/clouds/moonlit-purple-swoop-cloud.svg',
      style: { animationDelay: '-7s' },
    },
    {
      className: 'left-[18%] top-[27%] hidden w-[12rem] md:block md:w-[15rem]',
      src: '/clouds/moonlit-purple-upper-cloud.svg',
      style: { animationDelay: '-15s' },
    },
    {
      className: 'right-[18%] top-[23%] hidden w-[13rem] md:block md:w-[16rem]',
      src: '/clouds/moonlit-purple-upper-cloud.svg',
      style: { animationDelay: '-2s' },
    },
  ],
  classic: [
    {
      className: 'left-[38%] top-[8%] w-[11rem] md:left-[42%] md:w-[14rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
      style: { animationDelay: '-10s' },
    },
    {
      className: 'right-[7%] top-[16%] w-[15rem] md:w-[19rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
      style: { animationDelay: '-14s' },
    },
    {
      className: 'right-[20%] top-[29%] hidden w-[11rem] md:block md:w-[13rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
      style: { animationDelay: '-4s' },
    },
  ],
  blossom: [
    {
      className: 'left-[7%] top-[12%] w-[13rem] md:w-[15rem]',
      src: '/clouds/sakura-soft-cloud.svg',
      style: { animationDelay: '-8s' },
    },
    {
      className: 'left-[26%] top-[8%] hidden w-[15rem] md:block md:w-[18rem]',
      src: '/clouds/sakura-soft-cloud.svg',
      style: { animationDelay: '-15s' },
    },
    {
      className: 'right-[31%] top-[18%] w-[12rem] md:w-[14rem]',
      src: '/clouds/sakura-soft-cloud.svg',
      style: { animationDelay: '-5s' },
    },
    {
      className: 'right-[8%] top-[11%] w-[14rem] md:w-[17rem]',
      src: '/clouds/sakura-soft-cloud.svg',
      style: { animationDelay: '-12s' },
    },
  ],
  'fairy-castle': [],
}

export const menuHeroFlowersByScene: Record<SceneTone, readonly SceneFlowerConfig[]> = {
  dawn: [
    { asset: '/flowers/daisy-large.svg', left: '60%', scale: 0.86 },
    { asset: '/flowers/rose.svg', left: '74%', scale: 0.8 },
    { asset: '/flowers/daisy-small.svg', left: '86%', scale: 0.76, variant: 'wildflower' },
  ],
  'under-tree': [
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '12%', scale: 0.46 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '21%', scale: 0.5 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '30%', scale: 0.44 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '40%', scale: 0.54 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '50%', scale: 0.45 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '60%', scale: 0.5 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '70%', scale: 0.44 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '80%', scale: 0.53 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '90%', scale: 0.49 },
  ],
  moonlit: [
    { asset: '/flowers/moonlit-purple-flower.svg', left: '12%', scale: 0.9 },
    { asset: '/flowers/moonlit-purple-flower.svg', left: '22%', scale: 0.84 },
    { asset: '/flowers/moonlit-purple-flower.svg', left: '32%', scale: 0.88 },
    { asset: '/flowers/moonlit-purple-flower.svg', left: '42%', scale: 0.82 },
    { asset: '/flowers/moonlit-purple-flower.svg', left: '52%', scale: 0.94 },
    { asset: '/flowers/moonlit-purple-flower.svg', left: '62%', scale: 0.84 },
    { asset: '/flowers/moonlit-purple-flower.svg', left: '72%', scale: 0.88 },
    { asset: '/flowers/moonlit-purple-flower.svg', left: '82%', scale: 0.82 },
    { asset: '/flowers/moonlit-purple-flower.svg', left: '92%', scale: 0.94 },
  ],
  classic: [
    { asset: '/flowers/daisy-large.svg', left: '62%', scale: 0.82 },
    { asset: '/flowers/daisy-small.svg', left: '76%', scale: 0.72, variant: 'wildflower' },
    { asset: '/flowers/rose.svg', left: '89%', scale: 0.78 },
  ],
  blossom: [
    { asset: '/flowers/cherry-blossom-branch.svg', left: '18%', scale: 0.28 },
    { asset: '/flowers/cherry-blossom-branch.svg', left: '42%', scale: 0.3 },
    { asset: '/flowers/cherry-blossom-branch.svg', left: '66%', scale: 0.29 },
    { asset: '/flowers/cherry-blossom-branch.svg', left: '88%', scale: 0.27 },
  ],
  'fairy-castle': [],
}

const noScenePieces: readonly ScenePieceConfig[] = []
const noSceneCritters: readonly SceneCritterConfig[] = []

export const menuHeroPiecesByScene: Record<SceneTone, readonly ScenePieceConfig[]> = {
  dawn: [
    {
      className: 'left-[3%] bottom-[0.2rem] w-[5rem] md:w-[6.2rem]',
      src: '/sceneries/brown-anime-grass-clump.svg',
    },
    {
      className: 'left-[16%] bottom-[4.6rem] w-[3.2rem] opacity-75 md:w-[3.8rem]',
      src: '/sceneries/brown-anime-dry-grass-stalk.svg',
    },
    {
      className: 'right-[13%] bottom-[0.2rem] w-[5.2rem] md:w-[6.6rem]',
      src: '/sceneries/brown-anime-grass-clump.svg',
    },
    {
      className: 'right-[23%] bottom-[1.1rem] w-[1.7rem] opacity-80 md:w-[2rem]',
      src: '/sceneries/brown-anime-wheat-plume.svg',
    },
  ],
  'under-tree': [
    {
      className:
        'left-[-4%] bottom-[3.25rem] w-[35rem] md:left-[0%] md:bottom-[-0.5rem] md:w-[54rem]',
      src: '/sceneries/girl-under-tree-tree.svg?v=2',
    },
  ],
  moonlit: noScenePieces,
  classic: noScenePieces,
  blossom: noScenePieces,
  'fairy-castle': noScenePieces,
}

export const menuHeroCrittersByScene: Record<SceneTone, readonly SceneCritterConfig[]> = {
  dawn: noSceneCritters,
  'under-tree': noSceneCritters,
  moonlit: noSceneCritters,
  classic: noSceneCritters,
  blossom: [
    {
      className: 'left-[9%] bottom-[1.05rem] w-[3rem] md:w-[3.8rem]',
      src: '/catering/decor/sheep-sleepy.svg',
    },
    {
      className: 'left-[28%] bottom-[0.85rem] w-[2.7rem] md:w-[3.3rem]',
      src: '/catering/decor/sheep-curious.svg',
    },
    {
      className: 'right-[24%] bottom-[0.9rem] w-[2.8rem] md:w-[3.5rem]',
      src: '/catering/decor/sheep-grin.svg',
    },
    {
      className: 'right-[8%] bottom-[0.95rem] w-[2.8rem] md:w-[3.4rem]',
      src: '/catering/decor/sheep-curious.svg',
      style: { transform: 'scaleX(-1)' },
    },
  ],
  'fairy-castle': noSceneCritters,
}

export const menuHeroFlowerSeamByScene: Record<SceneTone, string> = {
  dawn: '0.5rem',
  'under-tree': '0.55rem',
  moonlit: '0.5rem',
  classic: '0.5rem',
  blossom: '0rem',
  'fairy-castle': '0.5rem',
}

export const menuSceneAccentLabelByScene: Record<SceneTone, string> = {
  dawn: 'Spawn flower',
  'under-tree': 'Spawn flower',
  moonlit: 'Spawn flower',
  classic: 'Spawn flower',
  blossom: 'Spawn sheep',
  'fairy-castle': 'Spawn house',
}

export const menuSceneCloudLabelByScene: Record<SceneTone, string> = {
  dawn: 'Spawn cloud',
  'under-tree': 'Spawn cloud',
  moonlit: 'Spawn cloud',
  classic: 'Spawn cloud',
  blossom: 'Spawn cloud',
  'fairy-castle': 'Spawn cloud',
}

export const menuSceneSeededAccentCountByScene: Record<SceneTone, number> = {
  dawn: 9,
  'under-tree': 9,
  moonlit: 9,
  classic: 9,
  blossom: 9,
  'fairy-castle': 0,
}

export const menuSpawnedAccentSourcesByScene: Record<SceneTone, readonly string[]> = {
  dawn: ['/flowers/daisy-medium.svg', '/flowers/rose.svg', '/flowers/tulip.svg'],
  'under-tree': ['/flowers/girl-under-tree-daisy.svg'],
  moonlit: ['/flowers/moonlit-purple-flower.svg', '/flowers/moonlit-purple-flower.svg'],
  classic: [
    '/flowers/daisy-medium.svg',
    '/flowers/pink-daisy-wildflower.svg',
    '/flowers/white-wildflower.svg',
    '/flowers/tulip.svg',
    '/flowers/rose.svg',
    '/flowers/poppy.svg',
  ],
  blossom: [
    '/catering/decor/sheep-curious.svg',
    '/catering/decor/sheep-grin.svg',
    '/catering/decor/sheep-sleepy.svg',
  ],
  'fairy-castle': ['/sceneries/fairy-castle-house.svg', '/sceneries/fairy-castle-house-wide.svg'],
}

export const menuCloudSpawnDesignsByScene: Record<SceneTone, readonly SceneCloudSpawnConfig[]> = {
  dawn: [
    { maxWidth: 18.8, minWidth: 13.4, src: '/clouds/brown-anime-cloud-layered.svg' },
    { maxWidth: 15.2, minWidth: 10.4, src: '/clouds/brown-anime-cloud-fluffy.svg' },
  ],
  'under-tree': [
    { maxWidth: 19.4, minWidth: 13.8, src: '/clouds/girl-under-tree-cloud-bank.svg' },
    { maxWidth: 13.6, minWidth: 8.4, src: '/clouds/girl-under-tree-wispy-cloud.svg' },
  ],
  moonlit: [
    { maxWidth: 18.2, minWidth: 13.4, src: '/clouds/moonlit-purple-swoop-cloud.svg' },
    { maxWidth: 15.8, minWidth: 10.8, src: '/clouds/moonlit-purple-upper-cloud.svg' },
  ],
  classic: [{ maxWidth: 14.8, minWidth: 10.6, src: '/clouds/three-ball-cloud-wide.svg' }],
  blossom: [{ maxWidth: 18.8, minWidth: 13.2, src: '/clouds/sakura-soft-cloud.svg' }],
  'fairy-castle': [
    { maxWidth: 16.8, minWidth: 11.8, src: '/sceneries/fairy-castle-cloud-puff.svg' },
  ],
}

export const getNextMenuSceneTone = (current: SceneTone): SceneTone => {
  const currentIndex = menuSceneTones.indexOf(current)
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % menuSceneTones.length : 0

  return menuSceneTones[nextIndex] ?? menuSceneTones[0]
}

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min
const randomMoonlitAccentScale = () => {
  const useMedium = Math.random() < 0.5
  return randomBetween(useMedium ? 0.88 : 1.02, useMedium ? 0.98 : 1.16)
}

const getSceneAccentScaleRange = (sceneTone: SceneTone): [number, number] => {
  if (sceneTone === 'under-tree') {
    return [0.66, 0.86]
  }

  if (sceneTone === 'blossom') {
    return [0.96, 1.24]
  }

  if (sceneTone === 'moonlit') {
    return [0.84, 1.16]
  }

  if (sceneTone === 'classic') {
    return [0.74, 0.94]
  }

  if (sceneTone === 'fairy-castle') {
    return [1.04, 1.52]
  }

  return [0.76, 0.98]
}

const getSceneAccentBottomRange = (sceneTone: SceneTone): [number, number] => {
  if (sceneTone === 'blossom') {
    return [8, 48]
  }

  if (sceneTone === 'fairy-castle') {
    return [7, 46]
  }

  if (sceneTone === 'moonlit') {
    return [8, 50]
  }

  return [8, 48]
}

export const buildSeededMenuSceneAccents = (
  sceneTone: SceneTone,
  count = menuSceneSeededAccentCountByScene[sceneTone],
): SceneAccentConfig[] => {
  if (count <= 0) {
    return []
  }

  const [minScale, maxScale] = getSceneAccentScaleRange(sceneTone)
  const [minBottom, maxBottom] = getSceneAccentBottomRange(sceneTone)
  const assets = menuSpawnedAccentSourcesByScene[sceneTone]
  const minLeft = 8
  const maxLeft = 92

  return Array.from({ length: count }, (_, index) => {
    const assetIndex = Math.floor(randomBetween(0, Math.max(assets.length, 1)))
    const asset = assets[assetIndex] ?? assets[0] ?? '/flowers/daisy-large.svg'
    const bottom = randomBetween(minBottom, maxBottom)
    const left = randomBetween(minLeft, maxLeft)
    const scale = randomBetween(minScale, maxScale)

    return {
      asset,
      bottom: `${bottom.toFixed(2)}%`,
      id: Date.now() + Math.random() + index,
      left: `${left.toFixed(2)}%`,
      scale: Number(scale.toFixed(2)),
    }
  })
}

export const createSpawnedMenuSceneAccent = (sceneTone: SceneTone): SceneAccentConfig => {
  const assets = menuSpawnedAccentSourcesByScene[sceneTone]
  const [minBottom, maxBottom] = getSceneAccentBottomRange(sceneTone)
  const scale =
    sceneTone === 'moonlit'
      ? Number(randomMoonlitAccentScale().toFixed(2))
      : Number(randomBetween(...getSceneAccentScaleRange(sceneTone)).toFixed(2))

  return {
    asset:
      assets[Math.floor(Math.random() * assets.length)] ?? assets[0] ?? '/flowers/daisy-large.svg',
    bottom: `${randomBetween(minBottom, maxBottom).toFixed(2)}%`,
    id: Date.now() + Math.random(),
    left: `${randomBetween(3, 97).toFixed(2)}%`,
    scale,
  }
}

export const menuHeroScenarioByScene = Object.fromEntries(
  menuSceneTones.map((sceneTone) => [
    sceneTone,
    {
      buttonAura: menuSceneButtonAuraByScene[sceneTone],
      clouds: menuHeroCloudsByScene[sceneTone],
      critters: menuHeroCrittersByScene[sceneTone],
      cloudButtonLabel: menuSceneCloudLabelByScene[sceneTone],
      flowerRail: menuHeroFlowersByScene[sceneTone],
      flowerSeam: menuHeroFlowerSeamByScene[sceneTone],
      meadowSrc: menuHeroMeadowByScene[sceneTone],
      pieces: menuHeroPiecesByScene[sceneTone],
      skySrc: menuHeroSkyByScene[sceneTone],
      spawnAccentLabel: menuSceneAccentLabelByScene[sceneTone],
      spawnableClouds: menuCloudSpawnDesignsByScene[sceneTone],
      spawnableAccents: menuSpawnedAccentSourcesByScene[sceneTone],
    },
  ]),
) as Record<
  SceneTone,
  {
    buttonAura: string
    clouds: readonly SceneCloudConfig[]
    cloudButtonLabel: string
    critters: readonly SceneCritterConfig[]
    flowerRail: readonly SceneFlowerConfig[]
    flowerSeam: string
    meadowSrc: string
    pieces: readonly ScenePieceConfig[]
    skySrc: string
    spawnAccentLabel: string
    spawnableClouds: readonly SceneCloudSpawnConfig[]
    spawnableAccents: readonly string[]
  }
>
