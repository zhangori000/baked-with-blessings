'use client'

import Image from 'next/image'
import { FlowerSprite } from '@/components/flowers/FlowerSprite'
import { GrowingGrassBorder } from '@/components/flowers/GrowingGrassBorder'
import { Media } from '@/components/Media'
import { RichText } from '@/components/RichText'
import {
  BakeryCard,
  BakeryPopoverPanel,
  BakeryPressable,
  SceneActionRow,
  SceneButton,
  type BakerySlotClassNames,
  type BakerySlotStyles,
  useBakeryAnnouncer,
} from '@/design-system/bakery'
import { bakeryPrimitiveTokens, bakerySceneThemes } from '@/design-system/bakery/tokens'
import type { Media as MediaType, Product } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { buildCloudSpawnPosition } from '@/components/scenery/cloudSpawnPlacement'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import type { MenuSceneryTone } from './catering-menu-types'

type SpawnedCloud = {
  id: number
  left: string
  sceneryTone: MenuSceneryTone
  src: string
  top: string
  width: string
}

type SpawnedFlower = {
  asset: string
  bottom?: string
  id: number
  left: string
  sceneryTone?: MenuSceneryTone
  scale: number
}

type LandscapeFlower = {
  asset: string
  left: string
  scale: number
  variant?: 'full' | 'wildflower'
}

type StaticSceneCloud = {
  className: string
  src: string
  style?: React.CSSProperties
}

type StaticScenePiece = {
  className: string
  src: string
  style?: React.CSSProperties
}

type CloudSpawnDesign = {
  maxWidth: number
  minWidth: number
  src: string
}

type StaticSceneCritter = {
  className: string
  src: string
  style?: React.CSSProperties
}

export type DecorativeSceneImageProps = {
  className: string
  fit?: 'contain' | 'cover'
  mobileSrc?: string
  priority?: boolean
  sizes?: string
  src: string
  style?: React.CSSProperties
}

type MenuHeroProps = {
  eyebrow?: string
  isSceneryPickerOpen: boolean
  isSceneChanging: boolean
  onSelectScenery: (tone: MenuSceneryTone) => void
  onToggleSceneryPicker: () => void
  sceneryTone: MenuSceneryTone
  summary?: string
  title?: string
}

type PersuasionGardenPanelProps = {
  classNames?: PersuasionGardenPanelClassNames
  isSceneryPickerOpen: boolean
  isSceneChanging: boolean
  onSelectScenery: (tone: MenuSceneryTone) => void
  onToggleSceneryPicker: () => void
  product: Partial<Product>
  sceneryTone: MenuSceneryTone
  styles?: PersuasionGardenPanelStyles
  summary: string
}

export const persuasionGardenPanelSlots = [
  'root',
  'viewport',
  'detailFace',
  'galleryFace',
  'sky',
  'cloud',
  'foreground',
  'heading',
  'body',
  'actionShell',
  'actionRow',
  'actionButtonWrap',
  'actionButton',
  'photosButton',
  'sceneryButton',
  'meadowLayer',
  'meadow',
  'scenePiece',
  'flower',
  'wildflower',
  'spawnedFlower',
  'galleryContent',
  'galleryToolbar',
  'photoBoard',
  'photoCard',
  'transitionOverlay',
  'transitionLine',
] as const

export type PersuasionGardenPanelSlot = (typeof persuasionGardenPanelSlots)[number]

export type PersuasionGardenPanelClassNames = BakerySlotClassNames<PersuasionGardenPanelSlot>

export type PersuasionGardenPanelStyles = BakerySlotStyles<PersuasionGardenPanelSlot>

export const menuSceneryTones: MenuSceneryTone[] = [
  'dawn',
  'moonlit',
  'classic',
  'blossom',
  'fairy-castle',
]

const menuSceneryLabelByTone: Record<MenuSceneryTone, string> = {
  dawn: 'Yellow dusk',
  'under-tree': 'Under tree',
  moonlit: 'Moonlit',
  classic: 'Classic',
  blossom: 'Sakura',
  'fairy-castle': 'Medieval fantasy',
}

const brownAnimeCloudSpawnDesigns: readonly CloudSpawnDesign[] = [
  { maxWidth: 18.8, minWidth: 13.4, src: '/clouds/brown-anime-cloud-layered.svg' },
  { maxWidth: 15.2, minWidth: 10.4, src: '/clouds/brown-anime-cloud-fluffy.svg' },
] as const

const girlUnderTreeCloudSpawnDesigns: readonly CloudSpawnDesign[] = [
  { maxWidth: 19.4, minWidth: 13.8, src: '/clouds/girl-under-tree-cloud-bank.svg' },
  { maxWidth: 13.6, minWidth: 8.4, src: '/clouds/girl-under-tree-wispy-cloud.svg' },
] as const

const moonlitCloudSpawnDesigns: readonly CloudSpawnDesign[] = [
  { maxWidth: 18.2, minWidth: 13.4, src: '/clouds/moonlit-purple-swoop-cloud.svg' },
  { maxWidth: 15.8, minWidth: 10.8, src: '/clouds/moonlit-purple-upper-cloud.svg' },
] as const

const classicCloudSpawnDesigns: readonly CloudSpawnDesign[] = [
  { maxWidth: 14.8, minWidth: 10.6, src: '/clouds/three-ball-cloud-wide.svg' },
] as const

const blossomCloudSpawnDesigns: readonly CloudSpawnDesign[] = [
  { maxWidth: 18.8, minWidth: 13.2, src: '/clouds/sakura-soft-cloud.svg' },
] as const

const fairyCastleCloudSpawnDesigns: readonly CloudSpawnDesign[] = [
  { maxWidth: 16.8, minWidth: 11.8, src: '/sceneries/fairy-castle-cloud-puff.svg' },
] as const

const cloudSpawnDesignsByScenery: Record<MenuSceneryTone, readonly CloudSpawnDesign[]> = {
  dawn: brownAnimeCloudSpawnDesigns,
  'under-tree': girlUnderTreeCloudSpawnDesigns,
  moonlit: moonlitCloudSpawnDesigns,
  classic: classicCloudSpawnDesigns,
  blossom: blossomCloudSpawnDesigns,
  'fairy-castle': fairyCastleCloudSpawnDesigns,
}

export const skyByScenery: Record<MenuSceneryTone, string> = {
  dawn: '/sceneries/brown-anime-gradient-sky.svg',
  'under-tree': '/sceneries/girl-under-tree-sky.svg',
  moonlit: '/sceneries/moonlit-purple-sky.svg',
  classic: '/sceneries/classic-sky.svg',
  blossom: '/sceneries/blossom-breeze-sky.svg',
  'fairy-castle': '/sceneries/fairy-castle.svg',
}

export const mobileSkyByScenery: Partial<Record<MenuSceneryTone, string>> = {
  moonlit: '/sceneries/moonlit-purple-sky-mobile-experimental.svg',
  blossom: '/sceneries/blossom-breeze-sky-mobile-experimental.svg',
  'fairy-castle': '/sceneries/fairy-castle-mobile-experimental.svg',
}

export const meadowByScenery: Record<MenuSceneryTone, string> = {
  dawn: '/sceneries/brown-anime-rolling-meadow.svg',
  'under-tree': '/sceneries/girl-under-tree-meadow.svg',
  moonlit: '/sceneries/moonlit-purple-meadow.svg',
  classic: '/sceneries/classic-meadow.svg',
  blossom: '/sceneries/blossom-grass-mound.svg',
  'fairy-castle': '/sceneries/transparent-meadow.svg',
}

const panelBackgroundByScenery: Record<MenuSceneryTone, string> = {
  dawn: 'linear-gradient(180deg, rgba(223, 239, 255, 0.92) 0%, rgba(216, 233, 246, 0.94) 100%)',
  'under-tree':
    'linear-gradient(180deg, rgba(108, 165, 210, 0.94) 0%, rgba(165, 204, 228, 0.94) 100%)',
  moonlit: 'linear-gradient(180deg, rgba(19, 41, 76, 0.96) 0%, rgba(29, 66, 98, 0.94) 100%)',
  classic: 'linear-gradient(180deg, rgba(233, 245, 255, 0.96) 0%, rgba(219, 236, 247, 0.95) 100%)',
  blossom: 'linear-gradient(180deg, rgba(248, 235, 240, 0.94) 0%, rgba(242, 224, 232, 0.94) 100%)',
  'fairy-castle':
    'linear-gradient(180deg, rgba(214, 220, 209, 0.96) 0%, rgba(191, 201, 186, 0.94) 100%)',
}

const sceneButtonAuraByScenery: Record<MenuSceneryTone, string> = {
  dawn: 'rgba(255, 214, 101, 0.85)',
  'under-tree': 'rgba(197, 228, 142, 0.82)',
  moonlit: 'rgba(153, 115, 255, 0.88)',
  classic: 'rgba(255, 215, 79, 0.84)',
  blossom: 'rgba(255, 176, 208, 0.9)',
  'fairy-castle': 'rgba(154, 172, 138, 0.88)',
}

const noScenePieces: readonly StaticScenePiece[] = []
const noSceneCritters: readonly StaticSceneCritter[] = []

const brownAnimeHeroPieces: readonly StaticScenePiece[] = [
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
] as const

const brownAnimePanelPieces: readonly StaticScenePiece[] = [
  {
    className: 'left-[4%] bottom-[0.15rem] w-[4.2rem] md:w-[4.8rem]',
    src: '/sceneries/brown-anime-grass-clump.svg',
  },
  {
    className: 'left-[18%] bottom-[2rem] w-[2.8rem] opacity-70 md:w-[3.2rem]',
    src: '/sceneries/brown-anime-dry-grass-stalk.svg',
  },
  {
    className: 'right-[4%] bottom-[0.15rem] w-[4.4rem] md:w-[5rem]',
    src: '/sceneries/brown-anime-grass-clump.svg',
  },
  {
    className: 'right-[28%] bottom-[0.55rem] w-[1.55rem] opacity-80 md:w-[1.8rem]',
    src: '/sceneries/brown-anime-wheat-plume.svg',
  },
] as const

const underTreeHeroPieces: readonly StaticScenePiece[] = [
  {
    className: 'left-[-18%] bottom-[-0.15rem] w-[30rem] md:left-[-9%] md:w-[46rem]',
    src: '/sceneries/girl-under-tree-tree.svg',
  },
] as const

const heroPiecesByScenery: Record<MenuSceneryTone, readonly StaticScenePiece[]> = {
  dawn: brownAnimeHeroPieces,
  'under-tree': underTreeHeroPieces,
  moonlit: noScenePieces,
  classic: noScenePieces,
  blossom: noScenePieces,
  'fairy-castle': noScenePieces,
}

const panelPiecesByScenery: Record<MenuSceneryTone, readonly StaticScenePiece[]> = {
  dawn: brownAnimePanelPieces,
  'under-tree': noScenePieces,
  moonlit: noScenePieces,
  classic: noScenePieces,
  blossom: noScenePieces,
  'fairy-castle': noScenePieces,
}

const heroCrittersByScenery: Record<MenuSceneryTone, readonly StaticSceneCritter[]> = {
  dawn: noSceneCritters,
  'under-tree': noSceneCritters,
  moonlit: noSceneCritters,
  classic: noSceneCritters,
  blossom: [
    {
      className: 'left-[9%] bottom-[0.42rem] w-[3rem] md:w-[3.8rem]',
      src: '/catering/decor/sheep-sleepy.svg',
    },
    {
      className: 'left-[28%] bottom-[0.34rem] w-[2.7rem] md:w-[3.3rem]',
      src: '/catering/decor/sheep-curious.svg',
    },
    {
      className: 'right-[24%] bottom-[0.36rem] w-[2.8rem] md:w-[3.5rem]',
      src: '/catering/decor/sheep-grin.svg',
    },
    {
      className: 'right-[8%] bottom-[0.38rem] w-[2.8rem] md:w-[3.4rem]',
      src: '/catering/decor/sheep-curious.svg',
      style: { transform: 'scaleX(-1)' },
    },
  ],
  'fairy-castle': noSceneCritters,
}

const panelCrittersByScenery: Record<MenuSceneryTone, readonly StaticSceneCritter[]> = {
  dawn: noSceneCritters,
  'under-tree': noSceneCritters,
  moonlit: noSceneCritters,
  classic: noSceneCritters,
  blossom: [
    {
      className: 'left-[12%] bottom-[0.34rem] w-[2.35rem]',
      src: '/catering/decor/sheep-sleepy.svg',
    },
    {
      className: 'left-[30%] bottom-[0.3rem] w-[2.2rem]',
      src: '/catering/decor/sheep-curious.svg',
    },
    {
      className: 'right-[22%] bottom-[0.34rem] w-[2.2rem]',
      src: '/catering/decor/sheep-grin.svg',
    },
    {
      className: 'right-[10%] bottom-[0.34rem] w-[2.2rem]',
      src: '/catering/decor/sheep-curious.svg',
      style: { transform: 'scaleX(-1)' },
    },
  ],
  'fairy-castle': noSceneCritters,
}

const heroCloudsByScenery: Record<MenuSceneryTone, readonly StaticSceneCloud[]> = {
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
  blossom: [],
  'fairy-castle': [],
}

const panelCloudsByScenery: Record<MenuSceneryTone, readonly StaticSceneCloud[]> = {
  dawn: [
    {
      className: 'left-[2%] top-[1.2rem] w-[15rem]',
      src: '/clouds/brown-anime-cloud-layered.svg',
    },
    {
      className: 'right-[24%] top-[1.5rem] w-[9.2rem]',
      src: '/clouds/brown-anime-cloud-fluffy.svg',
      style: { animationDelay: '-8s' },
    },
    {
      className: 'right-[2%] top-[3.7rem] w-[14rem]',
      src: '/clouds/brown-anime-cloud-layered.svg',
      style: { animationDelay: '-14s' },
    },
  ],
  'under-tree': [
    {
      className: 'left-[10%] top-[1.2rem] w-[9rem]',
      src: '/clouds/three-ball-cloud.svg',
    },
    {
      className: 'right-[4%] top-[1.45rem] w-[8.8rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
      style: { animationDelay: '-10s' },
    },
    {
      className: 'left-[42%] top-[3rem] w-[6.8rem]',
      src: '/clouds/three-ball-cloud.svg',
      style: { animationDelay: '-4s' },
    },
  ],
  moonlit: [
    {
      className: 'left-[4%] top-[1.25rem] w-[14rem]',
      src: '/clouds/moonlit-purple-upper-cloud.svg',
    },
    {
      className: 'right-[8%] top-[1.5rem] w-[12rem]',
      src: '/clouds/moonlit-purple-swoop-cloud.svg',
      style: { animationDelay: '-10s' },
    },
    {
      className: 'left-[38%] top-[3.2rem] w-[7.5rem]',
      src: '/clouds/moonlit-purple-upper-cloud.svg',
      style: { animationDelay: '-5s' },
    },
  ],
  classic: [
    {
      className: 'right-[28%] top-[1.6rem] w-[8.4rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
      style: { animationDelay: '-9s' },
    },
    {
      className: 'right-[2%] top-[3.4rem] w-[12rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
      style: { animationDelay: '-14s' },
    },
  ],
  blossom: [],
  'fairy-castle': [],
}

export const flavorCardCloudsByScenery: Record<MenuSceneryTone, readonly StaticSceneCloud[]> = {
  dawn: [
    {
      className: 'left-[-18%] top-[14%] z-10 w-[5rem]',
      src: '/clouds/brown-anime-cloud-fluffy.svg',
    },
    {
      className: 'left-[-12%] top-[30%] z-10 w-[4.2rem]',
      src: '/clouds/brown-anime-cloud-layered.svg',
      style: { animationDelay: '-6s' },
    },
  ],
  'under-tree': [
    {
      className: 'left-[-10%] top-[10%] z-10 w-[5.6rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
    },
    {
      className: 'right-[6%] top-[18%] z-10 w-[4.8rem]',
      src: '/clouds/three-ball-cloud.svg',
      style: { animationDelay: '-5s' },
    },
  ],
  moonlit: [
    {
      className: 'left-[-8%] top-[10%] z-10 w-[6.4rem]',
      src: '/clouds/moonlit-purple-upper-cloud.svg',
    },
    {
      className: 'right-[6%] top-[26%] z-10 w-[5.6rem]',
      src: '/clouds/moonlit-purple-upper-cloud.svg',
      style: { animationDelay: '-7s' },
    },
  ],
  classic: [
    {
      className: 'left-[-10%] top-[12%] z-10 w-[5.8rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
    },
    {
      className: 'right-[4%] top-[18%] z-10 w-[6rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
      style: { animationDelay: '-6s' },
    },
  ],
  blossom: [
    {
      className: 'right-[2%] top-[12%] z-10 w-[6rem]',
      src: '/clouds/sakura-soft-cloud.svg',
    },
  ],
  'fairy-castle': [],
}

const spawnedFlowerAssetsByScenery: Record<MenuSceneryTone, readonly string[]> = {
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

const seededAccentCountByScenery: Record<MenuSceneryTone, number> = {
  dawn: 9,
  'under-tree': 9,
  moonlit: 9,
  classic: 9,
  blossom: 9,
  'fairy-castle': 0,
}

const spawnedAccentLabelByScenery: Record<MenuSceneryTone, string> = {
  dawn: 'Spawn a flower',
  'under-tree': 'Spawn a flower',
  moonlit: 'Spawn a flower',
  classic: 'Spawn a flower',
  blossom: 'Spawn a sheep',
  'fairy-castle': 'Spawn a house',
}

const spawnedCloudLabelByScenery: Record<MenuSceneryTone, string> = {
  dawn: 'Spawn a cloud',
  'under-tree': 'Spawn a cloud',
  moonlit: 'Spawn a cloud',
  classic: 'Spawn a cloud',
  blossom: 'Spawn a cloud',
  'fairy-castle': 'Spawn a cloud',
}

const noLandscapeFlowers: readonly LandscapeFlower[] = []

const heroLineFlowersByScenery: Record<MenuSceneryTone, readonly LandscapeFlower[]> = {
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
  'fairy-castle': noLandscapeFlowers,
}

const persuasionWildflowersByScenery: Record<MenuSceneryTone, readonly LandscapeFlower[]> = {
  dawn: [
    { asset: '/flowers/daisy-small.svg', left: '18%', scale: 0.84 },
    { asset: '/flowers/daisy-small.svg', left: '55%', scale: 0.8 },
  ],
  'under-tree': [
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '22%', scale: 0.46 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '58%', scale: 0.49 },
  ],
  moonlit: [
    { asset: '/flowers/moonlit-purple-flower.svg', left: '22%', scale: 0.96 },
    { asset: '/flowers/moonlit-purple-flower.svg', left: '58%', scale: 0.86 },
  ],
  classic: [
    { asset: '/flowers/daisy-small.svg', left: '22%', scale: 0.82 },
    { asset: '/flowers/daisy-small.svg', left: '58%', scale: 0.76 },
  ],
  blossom: [
    { asset: '/flowers/cherry-blossom-branch.svg', left: '24%', scale: 0.24 },
    { asset: '/flowers/cherry-blossom-branch.svg', left: '62%', scale: 0.23 },
  ],
  'fairy-castle': noLandscapeFlowers,
}

const persuasionGardenFlowersByScenery: Record<MenuSceneryTone, readonly LandscapeFlower[]> = {
  dawn: [
    { asset: '/flowers/daisy-large.svg', left: '10%', scale: 0.98 },
    { asset: '/flowers/rose.svg', left: '25%', scale: 0.92 },
    { asset: '/flowers/sunflower.svg', left: '41%', scale: 1.08 },
    { asset: '/flowers/daisy-medium.svg', left: '58%', scale: 0.92 },
    { asset: '/flowers/daisy-small.svg', left: '73%', scale: 0.72 },
  ],
  'under-tree': [
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '12%', scale: 0.5 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '24%', scale: 0.42 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '36%', scale: 0.56 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '48%', scale: 0.42 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '60%', scale: 0.5 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '72%', scale: 0.56 },
    { asset: '/flowers/girl-under-tree-daisy.svg', left: '84%', scale: 0.48 },
  ],
  moonlit: [
    { asset: '/flowers/moonlit-purple-flower.svg', left: '12%', scale: 0.98 },
    { asset: '/flowers/moonlit-purple-flower.svg', left: '28%', scale: 0.92 },
    { asset: '/flowers/moonlit-purple-flower.svg', left: '45%', scale: 0.84 },
    { asset: '/flowers/moonlit-purple-flower.svg', left: '60%', scale: 1.06 },
    { asset: '/flowers/moonlit-purple-flower.svg', left: '76%', scale: 0.96 },
  ],
  classic: [
    { asset: '/flowers/daisy-large.svg', left: '12%', scale: 0.9 },
    { asset: '/flowers/daisy-small.svg', left: '28%', scale: 0.74 },
    { asset: '/flowers/rose.svg', left: '44%', scale: 0.88 },
    { asset: '/flowers/sunflower.svg', left: '60%', scale: 1.02 },
    { asset: '/flowers/daisy-medium.svg', left: '76%', scale: 0.84 },
  ],
  blossom: [
    { asset: '/flowers/cherry-blossom-branch.svg', left: '14%', scale: 0.26 },
    { asset: '/flowers/cherry-blossom-branch.svg', left: '36%', scale: 0.28 },
    { asset: '/flowers/cherry-blossom-branch.svg', left: '58%', scale: 0.27 },
    { asset: '/flowers/cherry-blossom-branch.svg', left: '80%', scale: 0.25 },
  ],
  'fairy-castle': noLandscapeFlowers,
}

const persuasionSheep = [{ left: '89%', src: '/catering/decor/sheep-grin.svg' }] as const

const buildPersuasionHeading = () => 'Random notes you can read...'

const buildPersuasionCopy = (_product: Partial<Product>, summary: string) => {
  if (summary.trim()) {
    return [summary.trim()]
  }

  return []
}

const normalizeGalleryImages = (product: Partial<Product>): MediaType[] => {
  return (product.gallery ?? []).flatMap((item) => {
    if (item && typeof item === 'object' && item.image && typeof item.image === 'object') {
      return [item.image]
    }

    return []
  })
}

const getGalleryImageKey = (image: MediaType, index: number) =>
  `${image.id ?? image.url ?? 'gallery-photo'}-${index}`

const getGalleryImagePreloadUrl = (image: MediaType) =>
  image.sizes?.card?.url ?? image.sizes?.tablet?.url ?? image.thumbnailURL ?? image.url

const preloadGalleryImages = (images: readonly MediaType[]) => {
  if (typeof window === 'undefined') {
    return
  }

  images.slice(0, 6).forEach((image) => {
    const url = getGalleryImagePreloadUrl(image)

    if (!url) {
      return
    }

    const preloadImage = new window.Image()
    preloadImage.decoding = 'async'
    preloadImage.src = url
    void preloadImage.decode?.().catch(() => undefined)
  })
}

const getHeroSceneVars = (sceneryTone: MenuSceneryTone): React.CSSProperties => {
  const sceneTheme = bakerySceneThemes[sceneryTone] ?? bakerySceneThemes.classic

  return {
    ['--scene-hero-muted' as string]: sceneTheme.color.heroMuted,
    ['--scene-hero-text' as string]: sceneTheme.color.heroText,
    ['--scene-hero-title' as string]: sceneTheme.color.heroTitle,
    ['--scene-muted-text' as string]: sceneTheme.color.mutedText,
    ['--scene-text' as string]: sceneTheme.color.text,
  }
}

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min

const hashString = (value: string) => {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

const createSeededRandom = (seed: string) => {
  let state = hashString(seed) || 1

  return () => {
    state = (state + 0x6d2b79f5) | 0
    let result = Math.imul(state ^ (state >>> 15), 1 | state)
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

const collectSceneryAssetSources = (sceneryTone: MenuSceneryTone) => [
  skyByScenery[sceneryTone],
  meadowByScenery[sceneryTone],
  ...(heroCloudsByScenery[sceneryTone] ?? []).map((cloud) => cloud.src),
  ...(panelCloudsByScenery[sceneryTone] ?? []).map((cloud) => cloud.src),
  ...(heroPiecesByScenery[sceneryTone] ?? []).map((piece) => piece.src),
  ...(panelPiecesByScenery[sceneryTone] ?? []).map((piece) => piece.src),
]

type IdlePreloadWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
}

const preloadedSceneryAssets = new Set<string>()

const scheduleSceneryPreload = (callback: () => void) => {
  const requestIdleCallback = (window as IdlePreloadWindow).requestIdleCallback

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(callback, { timeout: 800 })
    return
  }

  window.setTimeout(callback, 0)
}

export const preloadSceneryAssets = (sceneryTone: MenuSceneryTone) => {
  if (typeof window === 'undefined') {
    return
  }

  const sources = Array.from(
    new Set(collectSceneryAssetSources(sceneryTone).filter(Boolean)),
  ).filter((source) => !preloadedSceneryAssets.has(source))

  if (sources.length === 0) {
    return
  }

  for (const source of sources) {
    preloadedSceneryAssets.add(source)
  }

  const preloadBatch = (startIndex = 0) => {
    scheduleSceneryPreload(() => {
      for (const source of sources.slice(startIndex, startIndex + 4)) {
        const image = new window.Image()
        image.decoding = 'async'
        image.src = source
      }

      if (startIndex + 4 < sources.length) {
        preloadBatch(startIndex + 4)
      }
    })
  }

  preloadBatch()
}

const buildFlowerMotionStyle = (
  key: string,
  left: string,
  scale: number,
  styleOverrides?: React.CSSProperties,
): React.CSSProperties => {
  const seed = Array.from(key).reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    0,
  )
  const bob = 0.12 + (seed % 7) * 0.02
  const tilt = 1.5 + (seed % 5) * 0.55
  const duration = 4 + (seed % 6) * 0.22
  const delay = (seed % 8) * -0.34

  return {
    ...styleOverrides,
    left,
    ['--flower-bob' as string]: `${bob.toFixed(2)}rem`,
    ['--flower-delay' as string]: `${delay.toFixed(2)}s`,
    ['--flower-duration' as string]: `${duration.toFixed(2)}s`,
    ['--flower-scale' as string]: `${scale}`,
    ['--flower-tilt' as string]: `${tilt.toFixed(2)}deg`,
  } as React.CSSProperties
}

const heroFlowerSeamByScenery: Record<MenuSceneryTone, string> = {
  dawn: '0.5rem',
  'under-tree': '0.55rem',
  moonlit: '0.5rem',
  classic: '0.5rem',
  blossom: '0rem',
  'fairy-castle': '0.5rem',
}

const createSpawnedCloud = (
  sceneryTone: MenuSceneryTone,
  _kind: 'hero' | 'panel' = 'panel',
): SpawnedCloud => {
  const spawnDesigns = cloudSpawnDesignsByScenery[sceneryTone] ?? brownAnimeCloudSpawnDesigns
  const design =
    spawnDesigns[Math.floor(Math.random() * spawnDesigns.length)] ?? brownAnimeCloudSpawnDesigns[0]
  const { left, top } = buildCloudSpawnPosition()

  return {
    id: Date.now() + Math.random(),
    left,
    sceneryTone,
    src: design.src,
    top,
    width: `${randomBetween(design.minWidth, design.maxWidth).toFixed(2)}rem`,
  }
}

const getSpawnedAccentBottomRange = (
  sceneryTone: MenuSceneryTone,
  kind: 'hero' | 'panel',
): [number, number] => {
  if (sceneryTone === 'blossom') {
    return kind === 'hero' ? [8, 44] : [6, 42]
  }

  if (sceneryTone === 'fairy-castle') {
    return kind === 'hero' ? [5, 38] : [4, 36]
  }

  if (sceneryTone === 'moonlit') {
    return kind === 'hero' ? [10, 68] : [8, 58]
  }

  if (sceneryTone === 'under-tree') {
    return kind === 'hero' ? [10, 72] : [8, 60]
  }

  return kind === 'hero' ? [8, 52] : [6, 48]
}

const createSpawnedFlower = ({
  assetOverride,
  kind = 'panel',
  leftOverride,
  scaleOverride,
  sceneryTone,
}: {
  assetOverride?: string
  kind?: 'hero' | 'panel'
  leftOverride?: number
  scaleOverride?: number
  sceneryTone: MenuSceneryTone
}): SpawnedFlower => {
  const heroScaleRange =
    sceneryTone === 'under-tree'
      ? [0.66, 0.86]
      : sceneryTone === 'blossom'
        ? [0.96, 1.24]
        : sceneryTone === 'moonlit'
          ? [0.72, 0.92]
          : sceneryTone === 'classic'
            ? [0.74, 0.94]
            : sceneryTone === 'fairy-castle'
              ? [1.04, 1.52]
              : [0.76, 0.98]
  const panelScaleRange =
    sceneryTone === 'under-tree'
      ? [0.78, 1]
      : sceneryTone === 'blossom'
        ? [0.88, 1.14]
        : sceneryTone === 'moonlit'
          ? [0.82, 1.04]
          : sceneryTone === 'classic'
            ? [0.84, 1.06]
            : sceneryTone === 'fairy-castle'
              ? [1.08, 1.58]
              : [0.86, 1.08]
  const [minLeft, maxLeft] = kind === 'hero' ? [8, 92] : [8, 92]
  const [minBottom, maxBottom] = getSpawnedAccentBottomRange(sceneryTone, kind)
  const [minScale, maxScale] = kind === 'hero' ? heroScaleRange : panelScaleRange
  const assets = spawnedFlowerAssetsByScenery[sceneryTone]

  return {
    asset:
      assetOverride ?? assets[Math.floor(Math.random() * assets.length)] ?? '/flowers/daisy.svg',
    bottom: `${randomBetween(minBottom, maxBottom).toFixed(2)}%`,
    id: Date.now() + Math.random(),
    left: `${(leftOverride ?? randomBetween(minLeft, maxLeft)).toFixed(2)}%`,
    sceneryTone,
    scale: Number((scaleOverride ?? randomBetween(minScale, maxScale)).toFixed(2)),
  }
}

const getSeededFlowerRanges = (sceneryTone: MenuSceneryTone, kind: 'hero' | 'panel') => {
  const leftRange: [number, number] = kind === 'hero' ? [8, 92] : [6, 94]

  if (kind === 'hero') {
    const scaleRange: [number, number] =
      sceneryTone === 'under-tree'
        ? [0.66, 0.86]
        : sceneryTone === 'blossom'
          ? [0.96, 1.24]
          : sceneryTone === 'moonlit'
            ? [0.84, 1.16]
            : sceneryTone === 'classic'
              ? [0.74, 0.94]
              : sceneryTone === 'fairy-castle'
                ? [1.04, 1.52]
                : [0.76, 0.98]

    return { leftRange, scaleRange }
  }

  const scaleRange: [number, number] =
    sceneryTone === 'under-tree'
      ? [0.78, 1]
      : sceneryTone === 'blossom'
        ? [0.88, 1.14]
        : sceneryTone === 'moonlit'
          ? [0.9, 1.16]
          : sceneryTone === 'classic'
            ? [0.84, 1.06]
            : sceneryTone === 'fairy-castle'
              ? [1.08, 1.58]
              : [0.86, 1.08]

  return { leftRange, scaleRange }
}

const buildSeededFlowers = (
  sceneryTone: MenuSceneryTone,
  kind: 'hero' | 'panel',
  count = 20,
): SpawnedFlower[] => {
  if (count <= 0) {
    return []
  }

  const {
    leftRange: [minLeft, maxLeft],
    scaleRange: [minScale, maxScale],
  } = getSeededFlowerRanges(sceneryTone, kind)
  const assets = spawnedFlowerAssetsByScenery[sceneryTone]
  const random = createSeededRandom(`${sceneryTone}-${kind}-${count}`)
  const pickBetween = (min: number, max: number) => random() * (max - min) + min

  const center = (minLeft + maxLeft) / 2
  const pairCount = Math.floor(count / 2)
  const maxOffset = (maxLeft - minLeft) / 2
  const positions: number[] = []

  if (count % 2 === 1) {
    positions.push(center + pickBetween(-0.75, 0.75))
  }

  for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
    const offset = (maxOffset * (pairIndex + 1)) / (pairCount + 1)
    const jitter = pickBetween(-0.9, 0.9)
    positions.push(center - offset - jitter, center + offset + jitter)
  }

  return positions.slice(0, count).map((left, index) => {
    const assetIndex = Math.floor(pickBetween(0, Math.max(assets.length, 1)))
    const asset = assets[assetIndex] ?? '/flowers/daisy.svg'
    const scale = pickBetween(minScale, maxScale)

    return {
      asset,
      id: hashString(`${sceneryTone}-${kind}-${index}-${asset}`),
      left: `${left.toFixed(2)}%`,
      scale: Number(scale.toFixed(2)),
    }
  })
}

const getResponsiveFlowerSeedCount = () => 9

const useResponsiveFlowerSeedCount = () => getResponsiveFlowerSeedCount()

const isEagerSceneAsset = (src: string) => src === '/sceneries/girl-under-tree-tree.svg'

export function DecorativeSceneImage({
  className,
  fit = 'contain',
  mobileSrc,
  priority,
  sizes = '100vw',
  src,
  style,
}: DecorativeSceneImageProps) {
  if (mobileSrc) {
    return (
      <span
        aria-hidden="true"
        className={cn('cateringDecorativeImage', className)}
        style={{ position: 'absolute', ...style }}
      >
        <picture className="relative block h-full w-full">
          <source media="(max-width: 767px)" srcSet={mobileSrc} />
          <Image
            alt=""
            aria-hidden="true"
            className={fit === 'cover' ? 'object-cover' : 'h-auto w-full object-contain'}
            draggable="false"
            fill={fit === 'cover'}
            height={fit === 'cover' ? undefined : 1200}
            priority={priority}
            sizes={sizes}
            src={src}
            unoptimized
            width={fit === 'cover' ? undefined : 1200}
          />
        </picture>
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn('cateringDecorativeImage', className)}
      style={{ position: 'absolute', ...style }}
    >
      {fit === 'cover' ? (
        <Image
          alt=""
          aria-hidden="true"
          className="object-cover"
          fill
          priority={priority}
          sizes={sizes}
          src={src}
          unoptimized
        />
      ) : (
        <Image
          alt=""
          aria-hidden="true"
          className="h-auto w-full object-contain"
          height={1200}
          priority={priority}
          sizes={sizes}
          src={src}
          unoptimized
          width={1200}
        />
      )}
    </span>
  )
}

function CateringActionButton({
  buttonRef,
  children,
  className,
  disabled,
  onClick,
  style,
  wrapperClassName,
  wrapperStyle,
}: {
  buttonRef?: React.Ref<HTMLButtonElement>
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onClick: () => void
  style?: React.CSSProperties
  wrapperClassName?: string
  wrapperStyle?: React.CSSProperties
}) {
  return (
    <span className={cn('cateringActionButtonWrap', wrapperClassName)} style={wrapperStyle}>
      <SceneButton
        className={cn('cateringSpawnButton', className)}
        disabled={disabled}
        onClick={onClick}
        ref={buttonRef}
        style={style}
        variant="ghost"
      >
        {children}
      </SceneButton>
    </span>
  )
}

function SceneryChooserPopover({
  activeTone,
  anchorX,
  onSelectScenery,
}: {
  activeTone: MenuSceneryTone
  anchorX?: number | null
  onSelectScenery: (tone: MenuSceneryTone) => void
}) {
  return (
    <div className="cateringSceneryChooserBubble">
      <div
        aria-hidden="true"
        className="cateringSceneryChooserTail"
        style={anchorX != null ? { left: `calc(${anchorX}px - 1.35rem)` } : undefined}
      />
      <div aria-label="Choose scenery" className="cateringSceneryChooserRail" role="group">
        {menuSceneryTones.map((tone) => {
          const isActive = tone === activeTone

          return (
            <BakeryPressable
              className={cn('cateringSceneryChoice', isActive && 'cateringSceneryChoiceActive')}
              disabled={isActive}
              key={tone}
              onClick={() => onSelectScenery(tone)}
              type="button"
            >
              <span className="cateringSceneryChoiceLabel">{menuSceneryLabelByTone[tone]}</span>
              <span className="cateringSceneryChoiceMeta">
                {isActive ? 'Current' : 'Switch to this'}
              </span>
            </BakeryPressable>
          )
        })}
      </div>
    </div>
  )
}

export function MenuHero({
  eyebrow = 'Baked with Blessings',
  isSceneryPickerOpen,
  isSceneChanging,
  onSelectScenery,
  onToggleSceneryPicker,
  sceneryTone,
  summary = 'Clear portions, honest descriptions, and expandable ordering details for each item so the customer understands exactly what the group is buying.',
  title = 'Catering Menu',
}: MenuHeroProps) {
  const flowerSeedCount = useResponsiveFlowerSeedCount()
  const seededAccentCount = seededAccentCountByScenery[sceneryTone] === 0 ? 0 : flowerSeedCount
  const [spawnedClouds, setSpawnedClouds] = useState<SpawnedCloud[]>([])
  const [spawnedFlowers, setSpawnedFlowers] = useState<SpawnedFlower[]>([])
  const seededHeroAccents = useMemo(
    () => buildSeededFlowers(sceneryTone, 'hero', seededAccentCount),
    [sceneryTone, seededAccentCount],
  )
  const activeSpawnedClouds = spawnedClouds.filter((cloud) => cloud.sceneryTone === sceneryTone)
  const activeSpawnedFlowers = spawnedFlowers.filter((flower) => flower.sceneryTone === sceneryTone)
  const heroAccents = [...seededHeroAccents, ...activeSpawnedFlowers]
  const anchoredHeroAccents = heroAccents.filter((flower) => !flower.bottom)
  const floatingHeroAccents = heroAccents.filter((flower) => flower.bottom)
  const sceneClouds = heroCloudsByScenery[sceneryTone] ?? heroCloudsByScenery.dawn
  const heroCritters = heroCrittersByScenery[sceneryTone] ?? heroCrittersByScenery.dawn
  const heroPieces = heroPiecesByScenery[sceneryTone] ?? heroPiecesByScenery.dawn
  const heroFlowers = heroLineFlowersByScenery[sceneryTone] ?? heroLineFlowersByScenery.dawn
  const heroSkySrc = skyByScenery[sceneryTone] ?? skyByScenery.dawn
  const heroMobileSkySrc = mobileSkyByScenery[sceneryTone]
  const meadowSrc = meadowByScenery[sceneryTone] ?? meadowByScenery.dawn
  const chooserAnchorRef = useRef<HTMLDivElement | null>(null)
  const chooserButtonRef = useRef<HTMLButtonElement | null>(null)
  const [chooserAnchorX, setChooserAnchorX] = useState<number | null>(null)

  useEffect(() => {
    if (!isSceneryPickerOpen) {
      return
    }

    const updateChooserAnchor = () => {
      if (!chooserAnchorRef.current || !chooserButtonRef.current) {
        return
      }

      const wrapperRect = chooserAnchorRef.current.getBoundingClientRect()
      const buttonRect = chooserButtonRef.current.getBoundingClientRect()
      setChooserAnchorX(buttonRect.left - wrapperRect.left + buttonRect.width / 2)
    }

    updateChooserAnchor()
    window.addEventListener('resize', updateChooserAnchor)

    return () => {
      window.removeEventListener('resize', updateChooserAnchor)
    }
  }, [isSceneryPickerOpen])

  const spawnCloud = () => {
    setSpawnedClouds((current) => [...current, createSpawnedCloud(sceneryTone, 'hero')])
  }

  const spawnFlower = () => {
    setSpawnedFlowers((current) => [...current, createSpawnedFlower({ kind: 'hero', sceneryTone })])
  }

  return (
    <section
      className={cn(
        'cateringHeroBand relative left-1/2 w-screen -translate-x-1/2',
        `cateringScene-${sceneryTone}`,
      )}
      data-scene={sceneryTone}
      style={
        {
          ...getHeroSceneVars(sceneryTone),
          ['--catering-scene-charge' as string]: `var(--scene-action-aura, ${sceneButtonAuraByScenery[sceneryTone]})`,
          ['--catering-hero-flower-seam' as string]: `var(--scene-flower-seam, ${
            heroFlowerSeamByScenery[sceneryTone] ?? heroFlowerSeamByScenery.dawn
          })`,
        } as React.CSSProperties
      }
    >
      <div className="cateringHeroBackdrop">
        <DecorativeSceneImage
          className="cateringSceneSky cateringHeroSky"
          fit="cover"
          mobileSrc={heroMobileSkySrc}
          priority
          sizes="100vw"
          src={heroSkySrc}
        />
        <DecorativeSceneImage
          className="cateringSceneMeadow cateringHeroMeadow"
          fit="cover"
          sizes="100vw"
          src={meadowSrc}
        />
        {heroPieces.map((piece) => (
          <DecorativeSceneImage
            className={cn('cateringHeroSceneryPiece', piece.className)}
            key={`${sceneryTone}-${piece.className}-${piece.src}`}
            priority={isEagerSceneAsset(piece.src)}
            sizes="50vw"
            src={piece.src}
            style={piece.style}
          />
        ))}
        {heroCritters.map((critter) => (
          <DecorativeSceneImage
            className={cn('cateringHeroSceneryPiece', critter.className)}
            key={`${sceneryTone}-${critter.className}-${critter.src}`}
            sizes="6rem"
            src={critter.src}
            style={critter.style}
          />
        ))}
        <div aria-hidden="true" className="cateringHeroFlowerRail">
          {heroFlowers.map((flower) => (
            <FlowerSprite
              asset={flower.asset}
              className={cn(
                'cateringHeroLineFlower',
                flower.variant === 'wildflower' && 'cateringHeroLineWildflower',
              )}
              key={`hero-line-${flower.left}-${flower.asset}`}
              living
              style={buildFlowerMotionStyle(
                `hero-line-${flower.left}-${flower.asset}`,
                flower.left,
                flower.scale,
              )}
            />
          ))}
          {anchoredHeroAccents.map((flower) => (
            <FlowerSprite
              asset={flower.asset}
              animateIn
              className="cateringHeroLineFlower cateringHeroLineFlowerSpawned"
              key={flower.id}
              living
              style={buildFlowerMotionStyle(`hero-spawn-${flower.id}`, flower.left, flower.scale)}
            />
          ))}
        </div>
        <div aria-hidden="true" className="cateringHeroSpawnField">
          {floatingHeroAccents.map((flower) => (
            <FlowerSprite
              asset={flower.asset}
              animateIn
              className="cateringHeroLineFlower cateringHeroLineFlowerSpawned"
              key={flower.id}
              living
              style={buildFlowerMotionStyle(
                `hero-field-spawn-${flower.id}`,
                flower.left,
                flower.scale,
                { bottom: flower.bottom },
              )}
            />
          ))}
        </div>
      </div>
      {sceneClouds.map((cloud) => (
        <DecorativeSceneImage
          className={cn('cateringHeroCloud', cloud.className)}
          key={`${sceneryTone}-${cloud.className}-${cloud.src}`}
          sizes="30vw"
          src={cloud.src}
          style={cloud.style}
        />
      ))}
      {activeSpawnedClouds.map((cloud) => (
        <DecorativeSceneImage
          className="cateringHeroCloud"
          key={cloud.id}
          src={cloud.src}
          style={{ left: cloud.left, top: cloud.top, width: cloud.width }}
        />
      ))}
      <div className="cateringHeroContent container relative z-[3]">
        <div className="cateringHeroCopy space-y-4">
          <div className="space-y-4">
            <p className="cateringMenuEyebrow cateringHeroEyebrow">{eyebrow}</p>
            <h1 className="cateringMenuHeroDisplay">{title}</h1>
            <p className="cateringHeroSummary">{summary}</p>
            <BakeryPopoverPanel
              block
              className="pt-2"
              content={
                <SceneryChooserPopover
                  activeTone={sceneryTone}
                  anchorX={chooserAnchorX}
                  onSelectScenery={onSelectScenery}
                />
              }
              contentClassName="cateringSceneryChooser absolute left-0 top-full z-[8]"
              onClose={onToggleSceneryPicker}
              ref={chooserAnchorRef}
              visible={isSceneryPickerOpen}
            >
              <SceneActionRow className="cateringActionRow" gap="2">
                <CateringActionButton onClick={spawnCloud}>
                  {spawnedCloudLabelByScenery[sceneryTone]}
                </CateringActionButton>
                <CateringActionButton onClick={spawnFlower}>
                  {spawnedAccentLabelByScenery[sceneryTone]}
                </CateringActionButton>
                <CateringActionButton
                  buttonRef={chooserButtonRef}
                  className={cn(
                    (isSceneChanging || isSceneryPickerOpen) && 'cateringSpawnButtonCharging',
                  )}
                  onClick={onToggleSceneryPicker}
                >
                  Change scenery
                </CateringActionButton>
              </SceneActionRow>
            </BakeryPopoverPanel>
          </div>
        </div>
      </div>
    </section>
  )
}

export function PersuasionGardenPanel({
  classNames,
  isSceneryPickerOpen,
  isSceneChanging,
  onSelectScenery,
  onToggleSceneryPicker,
  product,
  sceneryTone,
  styles,
  summary,
}: PersuasionGardenPanelProps) {
  const PANEL_WIPE_MS = Number.parseInt(bakeryPrimitiveTokens.motion.panelPaint, 10)
  const flowerSeedCount = useResponsiveFlowerSeedCount()
  const seededAccentCount = seededAccentCountByScenery[sceneryTone] === 0 ? 0 : flowerSeedCount
  const [spawnedClouds, setSpawnedClouds] = useState<SpawnedCloud[]>([])
  const [spawnedFlowers, setSpawnedFlowers] = useState<SpawnedFlower[]>(() =>
    buildSeededFlowers(sceneryTone, 'panel', seededAccentCount),
  )
  const [panelFace, setPanelFace] = useState<'details' | 'gallery'>('details')
  const [panelTransition, setPanelTransition] = useState<'idle' | 'to-gallery' | 'to-details'>(
    'idle',
  )
  const [loadedGalleryImageKeys, setLoadedGalleryImageKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const { announce } = useBakeryAnnouncer()
  const persuasionCopy = buildPersuasionCopy(product, summary)
  const galleryImages = useMemo(() => normalizeGalleryImages(product), [product])
  const hasGallery = galleryImages.length > 0
  const transitionTimeoutRef = useRef<number | null>(null)
  const sceneClouds = panelCloudsByScenery[sceneryTone] ?? panelCloudsByScenery.dawn
  const panelPieces = panelPiecesByScenery[sceneryTone] ?? panelPiecesByScenery.dawn
  const panelFlowers =
    persuasionGardenFlowersByScenery[sceneryTone] ?? persuasionGardenFlowersByScenery.dawn
  const panelCritters = panelCrittersByScenery[sceneryTone] ?? panelCrittersByScenery.dawn
  const panelWildflowers =
    persuasionWildflowersByScenery[sceneryTone] ?? persuasionWildflowersByScenery.dawn
  const skySrc = skyByScenery[sceneryTone] ?? skyByScenery.dawn
  const mobileSkySrc = mobileSkyByScenery[sceneryTone]
  const meadowSrc = meadowByScenery[sceneryTone] ?? meadowByScenery.dawn
  const chooserAnchorRef = useRef<HTMLDivElement | null>(null)
  const chooserButtonRef = useRef<HTMLButtonElement | null>(null)
  const [chooserAnchorX, setChooserAnchorX] = useState<number | null>(null)

  useEffect(() => {
    if (!isSceneryPickerOpen) {
      return
    }

    const updateChooserAnchor = () => {
      if (!chooserAnchorRef.current || !chooserButtonRef.current) {
        return
      }

      const wrapperRect = chooserAnchorRef.current.getBoundingClientRect()
      const buttonRect = chooserButtonRef.current.getBoundingClientRect()
      setChooserAnchorX(buttonRect.left - wrapperRect.left + buttonRect.width / 2)
    }

    updateChooserAnchor()
    window.addEventListener('resize', updateChooserAnchor)

    return () => {
      window.removeEventListener('resize', updateChooserAnchor)
    }
  }, [isSceneryPickerOpen])

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current != null) {
        window.clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  const spawnCloud = () => {
    setSpawnedClouds((current) => [...current, createSpawnedCloud(sceneryTone, 'panel')])
  }

  const spawnFlower = () => {
    setSpawnedFlowers((current) => [
      ...current,
      createSpawnedFlower({ kind: 'panel', sceneryTone }),
    ])
  }

  const runPanelTransition = (nextFace: 'details' | 'gallery') => {
    if (panelTransition !== 'idle' || panelFace === nextFace) {
      return
    }

    if (nextFace === 'gallery') {
      preloadGalleryImages(galleryImages)
    }

    const productTitle = typeof product.title === 'string' ? product.title : 'this menu item'

    if (transitionTimeoutRef.current != null) {
      window.clearTimeout(transitionTimeoutRef.current)
    }

    setPanelTransition(nextFace === 'gallery' ? 'to-gallery' : 'to-details')
    announce(
      nextFace === 'gallery'
        ? `Opening photos for ${productTitle}.`
        : `Back to details for ${productTitle}.`,
    )

    transitionTimeoutRef.current = window.setTimeout(() => {
      setPanelFace(nextFace)
      setPanelTransition('idle')
      transitionTimeoutRef.current = null
    }, PANEL_WIPE_MS)
  }

  const markGalleryImageLoaded = (imageKey: string) => {
    setLoadedGalleryImageKeys((current) => {
      if (current.has(imageKey)) {
        return current
      }

      const next = new Set(current)
      next.add(imageKey)
      return next
    })
  }

  const isGalleryFace = panelFace === 'gallery'
  const isPanelTransitioning = panelTransition !== 'idle'
  const isPaintingToGallery = panelTransition === 'to-gallery'
  const isPaintingToDetails = panelTransition === 'to-details'
  const showDetailsFace = !isGalleryFace || isPanelTransitioning
  const showGalleryFace = hasGallery && (isGalleryFace || isPanelTransitioning)
  const panelMinHeight = hasGallery ? '34rem' : '30rem'
  const panelMinHeightValue = `var(--catering-persuasion-panel-min-height, ${panelMinHeight})`

  return (
    <div
      data-has-gallery={hasGallery ? 'true' : 'false'}
      data-scene={sceneryTone}
      data-panel-transition={panelTransition}
      className={cn('cateringPersuasionFrame relative [perspective:2200px]', classNames?.root)}
      style={
        {
          minHeight: panelMinHeightValue,
          ['--catering-panel-transition-distance' as string]: panelMinHeightValue,
          ['--catering-tear-duration' as string]: `${PANEL_WIPE_MS}ms`,
          ['--catering-scene-charge' as string]: `var(--scene-action-aura, ${sceneButtonAuraByScenery[sceneryTone]})`,
          ['--catering-panel-fill' as string]: `var(--scene-panel-fill, ${panelBackgroundByScenery[sceneryTone]})`,
          ...styles?.root,
        } as React.CSSProperties
      }
    >
      <div
        className={cn('relative h-full overflow-hidden rounded-[1.45rem]', classNames?.viewport)}
        style={{ minHeight: panelMinHeightValue, ...styles?.viewport }}
      >
        {showDetailsFace ? (
          <BakeryCard
            className={cn(
              'cateringPanelLayer cateringPersuasionPanel absolute inset-0 overflow-hidden rounded-[1.45rem] border border-[rgba(91,70,37,0.12)] bg-[#dbeeff] px-5 py-5 shadow-[0_10px_24px_rgba(23,21,16,0.07)] md:px-6 md:py-6',
              `cateringScene-${sceneryTone}`,
              !isGalleryFace && panelTransition === 'idle' && 'cateringPanelLayerActive',
              isPaintingToGallery && 'cateringPanelLayerBase',
              isPaintingToDetails &&
                'cateringPanelLayerPaintIn cateringPanelLayerPaintInFromBottom',
              classNames?.detailFace,
            )}
            radius="xl"
            spacing="none"
            style={styles?.detailFace}
            tone="transparent"
          >
            <DecorativeSceneImage
              className={cn('cateringSceneSky cateringPersuasionSky', classNames?.sky)}
              fit="cover"
              mobileSrc={mobileSkySrc}
              sizes="100vw"
              src={skySrc}
              style={styles?.sky}
            />
            {sceneClouds.map((cloud) => (
              <DecorativeSceneImage
                className={cn('cateringPersuasionCloud', cloud.className, classNames?.cloud)}
                key={`${sceneryTone}-${cloud.className}-${cloud.src}`}
                sizes="24vw"
                src={cloud.src}
                style={{ ...cloud.style, ...styles?.cloud }}
              />
            ))}
            {spawnedClouds.map((cloud) => (
              <DecorativeSceneImage
                className={cn('cateringPersuasionCloud', classNames?.cloud)}
                key={cloud.id}
                src={cloud.src}
                style={{ left: cloud.left, top: cloud.top, width: cloud.width, ...styles?.cloud }}
              />
            ))}

            <div
              className={cn(
                'cateringPanelForeground relative z-[2] max-w-[44rem] space-y-4 pb-20 pr-0 md:pb-24 md:pr-[10rem]',
                classNames?.foreground,
              )}
              style={styles?.foreground}
            >
              <h4
                className={cn(
                  'cateringMenuRoundHeading cateringPersuasionHeading text-[clamp(1.85rem,3.6vw,2.45rem)] leading-[0.95] tracking-[-0.04em]',
                  classNames?.heading,
                )}
                style={styles?.heading}
              >
                {buildPersuasionHeading()}
              </h4>

              {product.menuExpandedPitch ? (
                <RichText
                  className={cn(
                    'cateringPitch cateringPersuasionBody prose-p:leading-7',
                    classNames?.body,
                  )}
                  data={product.menuExpandedPitch}
                  enableGutter={false}
                  style={styles?.body}
                />
              ) : (
                <div
                  className={cn('cateringPersuasionBody space-y-4', classNames?.body)}
                  style={styles?.body}
                >
                  {persuasionCopy.map((paragraph) => (
                    <p className="text-[1rem] leading-8 md:text-[1.06rem]" key={paragraph}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

              <BakeryPopoverPanel
                block
                className={cn('pt-1', classNames?.actionShell)}
                content={
                  <SceneryChooserPopover
                    activeTone={sceneryTone}
                    anchorX={chooserAnchorX}
                    onSelectScenery={onSelectScenery}
                  />
                }
                contentClassName="cateringSceneryChooser absolute left-0 top-full z-[8]"
                onClose={onToggleSceneryPicker}
                ref={chooserAnchorRef}
                style={styles?.actionShell}
                visible={isSceneryPickerOpen}
              >
                <SceneActionRow
                  className={cn('cateringActionRow cateringPanelActionRow', classNames?.actionRow)}
                  gap="2"
                  style={styles?.actionRow}
                >
                  {hasGallery ? (
                    <CateringActionButton
                      className={cn(
                        'cateringPhotosButton',
                        classNames?.actionButton,
                        classNames?.photosButton,
                      )}
                      disabled={isPanelTransitioning}
                      onClick={() => runPanelTransition('gallery')}
                      style={{ ...styles?.actionButton, ...styles?.photosButton }}
                      wrapperClassName={classNames?.actionButtonWrap}
                      wrapperStyle={styles?.actionButtonWrap}
                    >
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="cateringPhotosButtonIcon"
                        height={52}
                        src="/flowers/menu-nav-flower.svg"
                        unoptimized
                        width={64}
                      />
                      <span>See photos</span>
                    </CateringActionButton>
                  ) : null}
                </SceneActionRow>
              </BakeryPopoverPanel>
            </div>

            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-0 h-[6.7rem] overflow-hidden',
                classNames?.meadowLayer,
              )}
              style={styles?.meadowLayer}
            >
              <DecorativeSceneImage
                className={cn('cateringSceneMeadow cateringPersuasionMeadow', classNames?.meadow)}
                fit="cover"
                sizes="100vw"
                src={meadowSrc}
                style={styles?.meadow}
              />
              {panelPieces.map((piece) => (
                <DecorativeSceneImage
                  className={cn(
                    'cateringPersuasionSceneryPiece',
                    piece.className,
                    classNames?.scenePiece,
                  )}
                  key={`${sceneryTone}-${piece.className}-${piece.src}`}
                  priority={isEagerSceneAsset(piece.src)}
                  sizes="40vw"
                  src={piece.src}
                  style={{ ...piece.style, ...styles?.scenePiece }}
                />
              ))}
              {panelCritters.map((critter) => (
                <DecorativeSceneImage
                  className={cn(
                    'cateringPersuasionSceneryPiece',
                    critter.className,
                    classNames?.scenePiece,
                  )}
                  key={`${sceneryTone}-${critter.className}-${critter.src}`}
                  sizes="4rem"
                  src={critter.src}
                  style={{ ...critter.style, ...styles?.scenePiece }}
                />
              ))}
              {persuasionSheep.map((sheep) => (
                <DecorativeSceneImage
                  className="cateringPixelSheep"
                  key={sheep.left}
                  sizes="7rem"
                  src={sheep.src}
                  style={{ left: sheep.left }}
                />
              ))}

              {panelWildflowers.map((flower) => (
                <FlowerSprite
                  asset={flower.asset}
                  className={cn(
                    'cateringPersuasionFlower cateringPersuasionWildflower',
                    classNames?.flower,
                    classNames?.wildflower,
                  )}
                  key={`panel-wild-${flower.left}-${flower.asset}`}
                  living
                  style={buildFlowerMotionStyle(
                    `panel-wild-${flower.left}-${flower.asset}`,
                    flower.left,
                    flower.scale,
                    styles?.wildflower,
                  )}
                />
              ))}
              {panelFlowers.map((flower) => (
                <FlowerSprite
                  asset={flower.asset}
                  className={cn('cateringPersuasionFlower', classNames?.flower)}
                  key={`${flower.left}-${flower.asset}`}
                  living
                  style={buildFlowerMotionStyle(
                    `panel-${flower.left}-${flower.asset}`,
                    flower.left,
                    flower.scale,
                    styles?.flower,
                  )}
                />
              ))}
              {spawnedFlowers.map((flower) => (
                <FlowerSprite
                  asset={flower.asset}
                  animateIn
                  className={cn(
                    'cateringPersuasionFlower cateringPersuasionFlowerSpawned',
                    classNames?.flower,
                    classNames?.spawnedFlower,
                  )}
                  key={flower.id}
                  living
                  style={buildFlowerMotionStyle(
                    `panel-spawn-${flower.id}`,
                    flower.left,
                    flower.scale,
                    { bottom: flower.bottom, ...styles?.spawnedFlower },
                  )}
                />
              ))}
            </div>
          </BakeryCard>
        ) : null}

        {hasGallery && showGalleryFace ? (
          <BakeryCard
            className={cn(
              'cateringPanelLayer absolute inset-0 overflow-hidden rounded-[1.45rem] border border-[rgba(91,70,37,0.12)] bg-white px-5 py-5 shadow-[0_10px_24px_rgba(23,21,16,0.07)] md:px-6 md:py-6',
              isGalleryFace && panelTransition === 'idle' && 'cateringPanelLayerActive',
              isPaintingToDetails && 'cateringPanelLayerBase',
              isPaintingToGallery && 'cateringPanelLayerPaintIn cateringPanelLayerPaintInFromTop',
              classNames?.galleryFace,
            )}
            radius="xl"
            spacing="none"
            style={styles?.galleryFace}
            tone="transparent"
          >
            <div
              className={cn('cateringGalleryContent h-full', classNames?.galleryContent)}
              style={styles?.galleryContent}
            >
              <div
                className={cn('flex justify-start', classNames?.galleryToolbar)}
                style={styles?.galleryToolbar}
              >
                <SceneButton
                  className="cateringSpawnButton shrink-0"
                  disabled={isPanelTransitioning}
                  onClick={() => runPanelTransition('details')}
                  variant="ghost"
                >
                  Back to details
                </SceneButton>
              </div>

              <div
                className={cn(
                  'cateringPhotoBoard mt-3 h-[calc(100%-3.25rem)] overflow-y-auto pb-10 pr-1',
                  classNames?.photoBoard,
                )}
                style={styles?.photoBoard}
              >
                <div className="columns-1 gap-3 md:columns-3">
                  <div className="cateringPhotoStartMarker mb-4 break-inside-avoid text-center">
                    <p className="cateringMenuEyebrow text-[0.76rem] text-[rgba(23,21,16,0.48)]">
                      Beginning of photos
                    </p>
                    <div className="cateringPhotoStartBorder relative mx-auto mt-2 h-8">
                      <GrowingGrassBorder
                        className="cateringPhotoTopBorder"
                        flowerPositions={[22, 42, 62, 82]}
                        flowerSize="1.9rem"
                        lineInset="0"
                        lineHeight="0.2rem"
                        sizes="32px"
                        style={{ bottom: '0.12rem' }}
                      />
                    </div>
                  </div>
                  {galleryImages.map((image, index) => {
                    const imageKey = getGalleryImageKey(image, index)
                    const isGalleryImageLoaded = loadedGalleryImageKeys.has(imageKey)

                    return (
                      <BakeryCard
                        aria-busy={!isGalleryImageLoaded}
                        className={cn(
                          'cateringPhotoCard mb-3 break-inside-avoid overflow-hidden rounded-[1rem]',
                          !isGalleryImageLoaded && 'cateringPhotoCardLoading',
                          classNames?.photoCard,
                        )}
                        key={imageKey}
                        radius="lg"
                        spacing="none"
                        style={styles?.photoCard}
                        tone="transparent"
                      >
                        {!isGalleryImageLoaded ? (
                          <span aria-hidden="true" className="cateringPhotoSkeleton" />
                        ) : null}
                        <Media
                          className={cn(
                            'relative w-full overflow-hidden rounded-[1rem]',
                            index % 3 === 0
                              ? 'aspect-[4/5]'
                              : index % 3 === 1
                                ? 'aspect-[4/3]'
                                : 'aspect-square',
                          )}
                          imgClassName={cn(
                            'cateringPhotoImage h-full w-full object-cover',
                            !isGalleryImageLoaded && 'cateringPhotoImageLoading',
                          )}
                          onLoad={() => markGalleryImageLoaded(imageKey)}
                          resource={image}
                        />
                      </BakeryCard>
                    )
                  })}
                  <div className="cateringPhotoEndMarker mb-2 break-inside-avoid text-center">
                    <p className="cateringPhotoEndLabel cateringMenuEyebrow">No more photos</p>
                    <div className="cateringPhotoScrollableBorder relative mx-auto mt-5 h-16">
                      <GrowingGrassBorder
                        className="cateringPhotoBottomBorder"
                        flowerPositions={[14, 31, 49, 67, 84]}
                        flowerSize="2.65rem"
                        lineInset="0"
                        lineHeight="0.3rem"
                        sizes="44px"
                        style={{ bottom: '0.26rem' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BakeryCard>
        ) : null}

        {hasGallery ? (
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 z-[10] overflow-hidden rounded-[1.45rem]',
              panelTransition === 'idle' && 'hidden',
              classNames?.transitionOverlay,
            )}
            style={styles?.transitionOverlay}
          >
            <div
              className={cn(
                'cateringPanelTearLine absolute left-0 right-0',
                isPaintingToGallery && 'cateringPanelRepaintLineToPhotos',
                isPaintingToDetails && 'cateringPanelRepaintLineToDetails',
                classNames?.transitionLine,
              )}
              style={{
                ['--catering-tear-duration' as string]: `${PANEL_WIPE_MS}ms`,
                ...styles?.transitionLine,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
