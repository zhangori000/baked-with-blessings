'use client'

import Image from 'next/image'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { RichText } from '@/components/RichText'
import { TraySelectionSummary } from '@/components/TraySelectionSummary'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { Media as MediaType, Product } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Minus, Plus } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { buildCookiePosterAsset } from './cookiePosterData'
import { CookieSheepRig } from './cookie-sheep-rig'

type CateringMenuSectionProps = {
  products: Partial<Product>[]
}

type BloomTone = 'gold' | 'plum' | 'rose' | 'sage' | 'sunflower'
type MenuSceneryTone = 'dawn' | 'under-tree' | 'moonlit' | 'classic'

type SelectableFlavor = {
  bodyFallbackSrc: string
  id: number
  image: MediaType | null
  summary: string
  title: string
}

type SpawnedCloud = {
  id: number
  left: string
  src: string
  top: string
  width: string
}

type SpawnedFlower = {
  asset: string
  id: number
  left: string
  scale: number
}

type LandscapeFlower = {
  asset: string
  desktopOnly?: boolean
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

type BloomVariant = {
  centerSize: number
  petalCount: number
  petalHeight: number
  petalOffset: number
  petalWidth: number
  rotation: number
}

const cateringDisplayOrder = [
  'cookie-tray',
  'mini-cookie-tray',
  'banana-pudding-10-pack',
  'sticky-toffee-pudding-10-pack',
  'focaccia-tray',
] as const

const menuSceneryTones: MenuSceneryTone[] = ['dawn', 'under-tree', 'moonlit', 'classic']
const progressBloomTones: BloomTone[] = ['gold', 'sage', 'plum', 'rose', 'gold', 'sunflower']
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
  { maxWidth: 17.4, minWidth: 12.6, src: '/clouds/three-ball-cloud.svg' },
  { maxWidth: 14.8, minWidth: 10.6, src: '/clouds/three-ball-cloud-wide.svg' },
] as const
const cloudSpawnDesignsByScenery: Record<MenuSceneryTone, readonly CloudSpawnDesign[]> = {
  dawn: brownAnimeCloudSpawnDesigns,
  'under-tree': girlUnderTreeCloudSpawnDesigns,
  moonlit: moonlitCloudSpawnDesigns,
  classic: classicCloudSpawnDesigns,
}
const skyByScenery: Record<MenuSceneryTone, string> = {
  dawn: '/catering/scenery/brown-anime-gradient-sky.svg',
  'under-tree': '/catering/scenery/girl-under-tree-sky.svg',
  moonlit: '/catering/scenery/moonlit-purple-sky.svg',
  classic: '/catering/scenery/classic-sky.svg',
}
const meadowByScenery: Record<MenuSceneryTone, string> = {
  dawn: '/catering/scenery/brown-anime-rolling-meadow.svg',
  'under-tree': '/catering/scenery/girl-under-tree-meadow.svg',
  moonlit: '/catering/scenery/moonlit-purple-meadow.svg',
  classic: '/catering/scenery/classic-meadow.svg',
}
const dividerFillByScenery: Record<MenuSceneryTone, string> = {
  dawn: 'linear-gradient(180deg, #cda639 0%, #b88623 100%)',
  'under-tree': 'linear-gradient(180deg, #d5ad35 0%, #b98419 100%)',
  moonlit: 'linear-gradient(180deg, #20385a 0%, #132440 100%)',
  classic: 'linear-gradient(180deg, #a7cb58 0%, #7faa34 100%)',
}
const panelBackgroundByScenery: Record<MenuSceneryTone, string> = {
  dawn: 'linear-gradient(180deg, rgba(223, 239, 255, 0.92) 0%, rgba(216, 233, 246, 0.94) 100%)',
  'under-tree':
    'linear-gradient(180deg, rgba(108, 165, 210, 0.94) 0%, rgba(165, 204, 228, 0.94) 100%)',
  moonlit: 'linear-gradient(180deg, rgba(19, 41, 76, 0.96) 0%, rgba(29, 66, 98, 0.94) 100%)',
  classic: 'linear-gradient(180deg, rgba(233, 245, 255, 0.96) 0%, rgba(219, 236, 247, 0.95) 100%)',
}
const noScenePieces: readonly StaticScenePiece[] = []
const brownAnimeHeroPieces: readonly StaticScenePiece[] = [
  {
    className: 'left-[3%] bottom-[0.2rem] w-[5rem] md:w-[6.2rem]',
    src: '/catering/scenery/brown-anime-grass-clump.svg',
  },
  {
    className: 'left-[16%] bottom-[4.6rem] w-[3.2rem] opacity-75 md:w-[3.8rem]',
    src: '/catering/scenery/brown-anime-dry-grass-stalk.svg',
  },
  {
    className: 'right-[13%] bottom-[0.2rem] w-[5.2rem] md:w-[6.6rem]',
    src: '/catering/scenery/brown-anime-grass-clump.svg',
  },
  {
    className: 'right-[23%] bottom-[1.1rem] w-[1.7rem] opacity-80 md:w-[2rem]',
    src: '/catering/scenery/brown-anime-wheat-plume.svg',
  },
]
const brownAnimeDividerPieces: readonly StaticScenePiece[] = [
  {
    className: 'left-[3%] bottom-[0.2rem] w-[4.2rem] md:w-[5rem]',
    src: '/catering/scenery/brown-anime-grass-clump.svg',
  },
  {
    className: 'left-[34%] bottom-[0.1rem] hidden w-[4rem] md:block md:w-[4.8rem]',
    src: '/catering/scenery/brown-anime-grass-clump.svg',
  },
  {
    className: 'right-[6%] bottom-[0.16rem] w-[4.3rem] md:w-[5.1rem]',
    src: '/catering/scenery/brown-anime-grass-clump.svg',
  },
  {
    className: 'left-[20%] bottom-[1.8rem] w-[2.6rem] opacity-70 md:w-[3rem]',
    src: '/catering/scenery/brown-anime-dry-grass-stalk.svg',
  },
  {
    className: 'right-[22%] bottom-[1.4rem] hidden w-[2.8rem] opacity-75 md:block md:w-[3.2rem]',
    src: '/catering/scenery/brown-anime-dry-grass-stalk.svg',
  },
  {
    className: 'right-[31%] bottom-[0.5rem] w-[1.6rem] opacity-80 md:w-[1.9rem]',
    src: '/catering/scenery/brown-anime-wheat-plume.svg',
  },
]
const brownAnimePanelPieces: readonly StaticScenePiece[] = [
  {
    className: 'left-[4%] bottom-[0.15rem] w-[4.2rem] md:w-[4.8rem]',
    src: '/catering/scenery/brown-anime-grass-clump.svg',
  },
  {
    className: 'left-[18%] bottom-[2rem] w-[2.8rem] opacity-70 md:w-[3.2rem]',
    src: '/catering/scenery/brown-anime-dry-grass-stalk.svg',
  },
  {
    className: 'right-[4%] bottom-[0.15rem] w-[4.4rem] md:w-[5rem]',
    src: '/catering/scenery/brown-anime-grass-clump.svg',
  },
  {
    className: 'right-[28%] bottom-[0.55rem] w-[1.55rem] opacity-80 md:w-[1.8rem]',
    src: '/catering/scenery/brown-anime-wheat-plume.svg',
  },
]
const underTreeHeroPieces: readonly StaticScenePiece[] = [
  {
    className: 'left-[-18%] bottom-[-0.15rem] w-[30rem] md:left-[-9%] md:w-[46rem]',
    src: '/catering/scenery/girl-under-tree-tree.svg',
  },
  {
    className: 'left-[12%] bottom-[0.35rem] w-[4.8rem] md:left-[18%] md:w-[6.4rem]',
    src: '/catering/scenery/girl-under-tree-girl.svg',
  },
]
const heroPiecesByScenery: Record<MenuSceneryTone, readonly StaticScenePiece[]> = {
  dawn: brownAnimeHeroPieces,
  'under-tree': underTreeHeroPieces,
  moonlit: noScenePieces,
  classic: noScenePieces,
}
const dividerPiecesByScenery: Record<MenuSceneryTone, readonly StaticScenePiece[]> = {
  dawn: brownAnimeDividerPieces,
  'under-tree': noScenePieces,
  moonlit: noScenePieces,
  classic: noScenePieces,
}
const panelPiecesByScenery: Record<MenuSceneryTone, readonly StaticScenePiece[]> = {
  dawn: brownAnimePanelPieces,
  'under-tree': noScenePieces,
  moonlit: noScenePieces,
  classic: noScenePieces,
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
      className: 'left-[18%] top-[27%] hidden w-[16rem] md:block md:w-[20rem]',
      src: '/clouds/moonlit-purple-wispy-band.svg',
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
      className: 'left-[2%] top-[10%] w-[16rem] md:w-[20rem]',
      src: '/clouds/three-ball-cloud.svg',
    },
    {
      className: 'left-[38%] top-[8%] w-[11rem] md:left-[42%] md:w-[14rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
      style: { animationDelay: '-10s' },
    },
    {
      className: 'right-[7%] top-[16%] w-[15rem] md:w-[19rem]',
      src: '/clouds/three-ball-cloud.svg',
      style: { animationDelay: '-14s' },
    },
    {
      className: 'right-[20%] top-[29%] hidden w-[11rem] md:block md:w-[13rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
      style: { animationDelay: '-4s' },
    },
  ],
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
      className: 'left-[38%] top-[3.2rem] w-[10rem]',
      src: '/clouds/moonlit-purple-wispy-band.svg',
      style: { animationDelay: '-5s' },
    },
  ],
  classic: [
    {
      className: 'left-[6%] top-[1.2rem] w-[11rem]',
      src: '/clouds/three-ball-cloud.svg',
    },
    {
      className: 'right-[28%] top-[1.6rem] w-[8.4rem]',
      src: '/clouds/three-ball-cloud-wide.svg',
      style: { animationDelay: '-9s' },
    },
    {
      className: 'right-[2%] top-[3.4rem] w-[12rem]',
      src: '/clouds/three-ball-cloud.svg',
      style: { animationDelay: '-14s' },
    },
  ],
}
const bloomVariantPresets: BloomVariant[] = [
  {
    centerSize: 0.38,
    petalCount: 4,
    petalHeight: 0.72,
    petalOffset: 0.26,
    petalWidth: 0.66,
    rotation: 0,
  },
  {
    centerSize: 0.4,
    petalCount: 4,
    petalHeight: 0.78,
    petalOffset: 0.29,
    petalWidth: 0.58,
    rotation: 14,
  },
  {
    centerSize: 0.36,
    petalCount: 5,
    petalHeight: 0.7,
    petalOffset: 0.28,
    petalWidth: 0.46,
    rotation: 8,
  },
  {
    centerSize: 0.38,
    petalCount: 4,
    petalHeight: 0.68,
    petalOffset: 0.26,
    petalWidth: 0.54,
    rotation: -10,
  },
  {
    centerSize: 0.52,
    petalCount: 8,
    petalHeight: 0.64,
    petalOffset: 0.34,
    petalWidth: 0.3,
    rotation: 0,
  },
] as const
const cookieTrayPersuasionCopy = [
  'We love Crumbl cookies. But sometimes they are too sweet. These cookies are less sweet than Crumbl.',
  'The normal size cookies are quite thick, so they are good value. But if you want smaller cookies, go buy the mini cookies.',
] as const
const daylightFlowerAssets = [
  '/flowers/daisy-large.svg',
  '/flowers/daisy-medium.svg',
  '/flowers/daisy-small.svg',
  '/flowers/rose.svg',
  '/flowers/sunflower.svg',
  '/flowers/cherry-blossom-branch.svg',
] as const
const moonlitFlowerAssets = [
  '/flowers/moonlit-purple-flower.svg',
  '/flowers/moonlit-purple-flower.svg',
  '/flowers/moonlit-purple-flower.svg',
] as const
const classicFlowerAssets = [
  '/flowers/daisy-large.svg',
  '/flowers/daisy-medium.svg',
  '/flowers/daisy-small.svg',
  '/flowers/rose.svg',
  '/flowers/sunflower.svg',
] as const
const flowerAssetsByScenery: Record<MenuSceneryTone, readonly string[]> = {
  dawn: daylightFlowerAssets,
  'under-tree': [
    '/flowers/daisy-large.svg',
    '/flowers/daisy-medium.svg',
    '/flowers/daisy-small.svg',
  ],
  moonlit: moonlitFlowerAssets,
  classic: classicFlowerAssets,
}
const spawnedFlowerAssetsByScenery: Record<MenuSceneryTone, readonly string[]> = {
  dawn: ['/flowers/daisy-medium.svg', '/flowers/daisy-small.svg'],
  'under-tree': [
    '/flowers/daisy-large.svg',
    '/flowers/daisy-medium.svg',
    '/flowers/daisy-small.svg',
  ],
  moonlit: ['/flowers/moonlit-purple-flower.svg'],
  classic: ['/flowers/daisy-medium.svg', '/flowers/daisy-small.svg'],
}

const defaultHeroLineFlowers: readonly LandscapeFlower[] = [
  { asset: '/flowers/daisy-large.svg', left: '60%', scale: 0.86 },
  { asset: '/flowers/rose.svg', left: '74%', scale: 0.8 },
  { asset: '/flowers/daisy-small.svg', left: '86%', scale: 0.76, variant: 'wildflower' },
] as const
const underTreeHeroLineFlowers: readonly LandscapeFlower[] = [
  { asset: '/flowers/daisy-small.svg', left: '12%', scale: 0.72 },
  { asset: '/flowers/daisy-medium.svg', left: '21%', scale: 0.76 },
  { asset: '/flowers/daisy-small.svg', left: '30%', scale: 0.68 },
  { asset: '/flowers/daisy-large.svg', left: '40%', scale: 0.82 },
  { asset: '/flowers/daisy-small.svg', left: '50%', scale: 0.7 },
  { asset: '/flowers/daisy-medium.svg', left: '60%', scale: 0.76 },
  { asset: '/flowers/daisy-small.svg', left: '70%', scale: 0.68 },
  { asset: '/flowers/daisy-large.svg', left: '80%', scale: 0.8 },
  { asset: '/flowers/daisy-medium.svg', left: '90%', scale: 0.74 },
] as const
const moonlitHeroLineFlowers: readonly LandscapeFlower[] = [
  { asset: '/flowers/moonlit-purple-flower.svg', left: '12%', scale: 0.78 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '22%', scale: 0.72 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '32%', scale: 0.76 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '42%', scale: 0.68 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '52%', scale: 0.8 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '62%', scale: 0.72 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '72%', scale: 0.76 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '82%', scale: 0.7 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '92%', scale: 0.8 },
] as const
const classicHeroLineFlowers: readonly LandscapeFlower[] = [
  { asset: '/flowers/daisy-large.svg', left: '62%', scale: 0.82 },
  { asset: '/flowers/daisy-small.svg', left: '76%', scale: 0.72, variant: 'wildflower' },
  { asset: '/flowers/rose.svg', left: '89%', scale: 0.78 },
] as const
const heroLineFlowersByScenery: Record<MenuSceneryTone, readonly LandscapeFlower[]> = {
  dawn: defaultHeroLineFlowers,
  'under-tree': underTreeHeroLineFlowers,
  moonlit: moonlitHeroLineFlowers,
  classic: classicHeroLineFlowers,
}

const defaultPersuasionWildflowers: readonly LandscapeFlower[] = [
  { asset: '/flowers/daisy-small.svg', left: '18%', scale: 0.84 },
  { asset: '/flowers/daisy-small.svg', left: '55%', scale: 0.8 },
] as const
const underTreePersuasionWildflowers: readonly LandscapeFlower[] = [
  { asset: '/flowers/daisy-small.svg', left: '22%', scale: 0.74 },
  { asset: '/flowers/daisy-small.svg', left: '58%', scale: 0.78 },
] as const
const moonlitPersuasionWildflowers: readonly LandscapeFlower[] = [
  { asset: '/flowers/moonlit-purple-flower.svg', left: '22%', scale: 0.84 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '58%', scale: 0.74 },
] as const
const classicPersuasionWildflowers: readonly LandscapeFlower[] = [
  { asset: '/flowers/daisy-small.svg', left: '22%', scale: 0.82 },
  { asset: '/flowers/daisy-small.svg', left: '58%', scale: 0.76 },
] as const
const persuasionWildflowersByScenery: Record<MenuSceneryTone, readonly LandscapeFlower[]> = {
  dawn: defaultPersuasionWildflowers,
  'under-tree': underTreePersuasionWildflowers,
  moonlit: moonlitPersuasionWildflowers,
  classic: classicPersuasionWildflowers,
}

const defaultPersuasionGardenFlowers = [
  { asset: '/flowers/daisy-large.svg', left: '10%', scale: 0.98 },
  { asset: '/flowers/rose.svg', left: '25%', scale: 0.92 },
  { asset: '/flowers/sunflower.svg', left: '41%', scale: 1.08 },
  { asset: '/flowers/daisy-medium.svg', left: '58%', scale: 0.92 },
  { asset: '/flowers/daisy-small.svg', left: '73%', scale: 0.72 },
] as const
const underTreePersuasionGardenFlowers = [
  { asset: '/flowers/daisy-medium.svg', left: '12%', scale: 0.78 },
  { asset: '/flowers/daisy-small.svg', left: '24%', scale: 0.68 },
  { asset: '/flowers/daisy-large.svg', left: '36%', scale: 0.82 },
  { asset: '/flowers/daisy-small.svg', left: '48%', scale: 0.68 },
  { asset: '/flowers/daisy-medium.svg', left: '60%', scale: 0.78 },
  { asset: '/flowers/daisy-large.svg', left: '72%', scale: 0.82 },
  { asset: '/flowers/daisy-medium.svg', left: '84%', scale: 0.76 },
] as const
const moonlitPersuasionGardenFlowers = [
  { asset: '/flowers/moonlit-purple-flower.svg', left: '12%', scale: 0.86 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '28%', scale: 0.8 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '45%', scale: 0.72 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '60%', scale: 0.94 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '76%', scale: 0.84 },
] as const
const classicPersuasionGardenFlowers = [
  { asset: '/flowers/daisy-large.svg', left: '12%', scale: 0.9 },
  { asset: '/flowers/daisy-small.svg', left: '28%', scale: 0.74 },
  { asset: '/flowers/rose.svg', left: '44%', scale: 0.88 },
  { asset: '/flowers/sunflower.svg', left: '60%', scale: 1.02 },
  { asset: '/flowers/daisy-medium.svg', left: '76%', scale: 0.84 },
] as const
const persuasionGardenFlowersByScenery: Record<MenuSceneryTone, readonly LandscapeFlower[]> = {
  dawn: defaultPersuasionGardenFlowers,
  'under-tree': underTreePersuasionGardenFlowers,
  moonlit: moonlitPersuasionGardenFlowers,
  classic: classicPersuasionGardenFlowers,
}

const defaultDividerFlowers = [
  { asset: '/flowers/daisy-medium.svg', desktopOnly: true, left: '8%', scale: 0.82 },
  { asset: '/flowers/rose.svg', left: '22%', scale: 0.8 },
  { asset: '/flowers/cherry-blossom-branch.svg', desktopOnly: true, left: '36%', scale: 0.78 },
  { asset: '/flowers/daisy-small.svg', left: '50%', scale: 0.72 },
  { asset: '/flowers/sunflower.svg', left: '64%', scale: 0.98 },
  { asset: '/flowers/rose.svg', left: '78%', scale: 0.8 },
  { asset: '/flowers/daisy-medium.svg', desktopOnly: true, left: '91%', scale: 0.8 },
] as const
const underTreeDividerFlowers = [
  { asset: '/flowers/daisy-medium.svg', left: '9%', scale: 0.74 },
  { asset: '/flowers/daisy-small.svg', left: '23%', scale: 0.66 },
  { asset: '/flowers/daisy-large.svg', left: '38%', scale: 0.8 },
  { asset: '/flowers/daisy-small.svg', left: '54%', scale: 0.66 },
  { asset: '/flowers/daisy-medium.svg', left: '70%', scale: 0.72 },
  { asset: '/flowers/daisy-large.svg', left: '86%', scale: 0.8 },
] as const
const moonlitDividerFlowers = [
  { asset: '/flowers/moonlit-purple-flower.svg', left: '10%', scale: 0.78 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '28%', scale: 0.72 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '46%', scale: 0.7 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '64%', scale: 0.82 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '82%', scale: 0.76 },
] as const
const classicDividerFlowers = [
  { asset: '/flowers/daisy-medium.svg', left: '10%', scale: 0.78 },
  { asset: '/flowers/rose.svg', left: '28%', scale: 0.76 },
  { asset: '/flowers/daisy-small.svg', left: '46%', scale: 0.68 },
  { asset: '/flowers/sunflower.svg', left: '64%', scale: 0.9 },
  { asset: '/flowers/daisy-medium.svg', left: '82%', scale: 0.76 },
] as const
const dividerFlowersByScenery: Record<MenuSceneryTone, readonly LandscapeFlower[]> = {
  dawn: defaultDividerFlowers,
  'under-tree': underTreeDividerFlowers,
  moonlit: moonlitDividerFlowers,
  classic: classicDividerFlowers,
}
const defaultDividerWildflowers = [
  { asset: '/flowers/daisy-small.svg', left: '14%', scale: 0.72 },
  { asset: '/flowers/daisy-small.svg', left: '34%', scale: 0.68 },
  { asset: '/flowers/daisy-small.svg', left: '57%', scale: 0.74 },
  { asset: '/flowers/daisy-small.svg', left: '86%', scale: 0.7 },
] as const
const underTreeDividerWildflowers = [
  { asset: '/flowers/daisy-small.svg', left: '17%', scale: 0.64 },
  { asset: '/flowers/daisy-small.svg', left: '46%', scale: 0.62 },
  { asset: '/flowers/daisy-small.svg', left: '79%', scale: 0.64 },
] as const
const moonlitDividerWildflowers = [
  { asset: '/flowers/moonlit-purple-flower.svg', left: '18%', scale: 0.68 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '50%', scale: 0.72 },
  { asset: '/flowers/moonlit-purple-flower.svg', left: '82%', scale: 0.68 },
] as const
const classicDividerWildflowers = [
  { asset: '/flowers/daisy-small.svg', left: '18%', scale: 0.7 },
  { asset: '/flowers/daisy-small.svg', left: '50%', scale: 0.68 },
  { asset: '/flowers/daisy-small.svg', left: '82%', scale: 0.7 },
] as const
const dividerWildflowersByScenery: Record<MenuSceneryTone, readonly LandscapeFlower[]> = {
  dawn: defaultDividerWildflowers,
  'under-tree': underTreeDividerWildflowers,
  moonlit: moonlitDividerWildflowers,
  classic: classicDividerWildflowers,
}

const persuasionSheep = [
  { left: '72%', src: '/catering/decor/sheep-sleepy.svg' },
  { left: '84%', src: '/catering/decor/sheep-curious.svg' },
  { left: '94%', src: '/catering/decor/sheep-grin.svg' },
] as const

const normalizeImage = (product: Partial<Product>) => {
  const firstGalleryItem = product.gallery?.[0]

  if (
    firstGalleryItem &&
    typeof firstGalleryItem === 'object' &&
    firstGalleryItem.image &&
    typeof firstGalleryItem.image === 'object'
  ) {
    return firstGalleryItem.image
  }

  if (
    typeof product.meta === 'object' &&
    product.meta?.image &&
    typeof product.meta.image === 'object'
  ) {
    return product.meta.image
  }

  return null
}

const resolveSummary = (product: Partial<Product>) => {
  if (typeof product.meta === 'object' && product.meta?.description?.trim()) {
    return product.meta.description.trim()
  }

  return ''
}

const normalizeProductRelation = (value: number | Product | null | undefined): Product | null => {
  if (value && typeof value === 'object') {
    return value
  }

  return null
}

const buildSelectableFlavors = (product: Partial<Product>): SelectableFlavor[] => {
  const selectableProducts = Array.isArray(product.selectableProducts)
    ? product.selectableProducts
    : []

  return selectableProducts
    .map((selectableProduct) => normalizeProductRelation(selectableProduct))
    .filter((selectableProduct): selectableProduct is Product => Boolean(selectableProduct?.id))
    .map((selectableProduct) => {
      const posterAsset = buildCookiePosterAsset(selectableProduct)

      return {
        bodyFallbackSrc: posterAsset?.bodyFallbackSrc ?? '/cookie-singular-brookie.svg',
        id: selectableProduct.id,
        image: posterAsset?.image ?? normalizeImage(selectableProduct),
        summary: posterAsset?.summary ?? resolveSummary(selectableProduct),
        title: posterAsset?.title ?? selectableProduct.title,
      }
    })
}

const sortProductsForDisplay = (products: Partial<Product>[]) => {
  const orderMap = new Map<string, number>(cateringDisplayOrder.map((slug, index) => [slug, index]))

  return [...products].sort((left, right) => {
    const leftOrder = orderMap.get(left.slug ?? '') ?? Number.MAX_SAFE_INTEGER
    const rightOrder = orderMap.get(right.slug ?? '') ?? Number.MAX_SAFE_INTEGER

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return (left.title ?? '').localeCompare(right.title ?? '')
  })
}

const buildPersuasionHeading = () => 'Honest persuasion...'

const buildPersuasionCopy = (product: Partial<Product>, summary: string) => {
  if (product.slug === 'cookie-tray') {
    return cookieTrayPersuasionCopy
  }

  if (summary.trim()) {
    return [summary.trim()]
  }

  return []
}

const defaultToneVariants: Record<BloomTone, BloomVariant> = {
  gold: bloomVariantPresets[1],
  plum: bloomVariantPresets[0],
  rose: bloomVariantPresets[2],
  sage: bloomVariantPresets[3],
  sunflower: bloomVariantPresets[4],
}

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min
const getNextSceneryTone = (current: MenuSceneryTone) => {
  const currentIndex = menuSceneryTones.indexOf(current)
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % menuSceneryTones.length : 0

  return menuSceneryTones[nextIndex] ?? menuSceneryTones[0]
}

const getRandomBloomVariant = () =>
  bloomVariantPresets[Math.floor(Math.random() * bloomVariantPresets.length)] ??
  bloomVariantPresets[0]

const buildFlowerMotionStyle = (key: string, left: string, scale: number): React.CSSProperties => {
  const seed = Array.from(key).reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    0,
  )
  const bob = 0.12 + (seed % 7) * 0.02
  const tilt = 1.5 + (seed % 5) * 0.55
  const duration = 4 + (seed % 6) * 0.22
  const delay = (seed % 8) * -0.34

  return {
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
}

const createSpawnedCloud = (
  sceneryTone: MenuSceneryTone,
  kind: 'hero' | 'panel' = 'panel',
): SpawnedCloud => {
  const spawnDesigns = cloudSpawnDesignsByScenery[sceneryTone] ?? brownAnimeCloudSpawnDesigns
  const design =
    spawnDesigns[Math.floor(Math.random() * spawnDesigns.length)] ?? brownAnimeCloudSpawnDesigns[0]
  const leftRange =
    kind === 'hero'
      ? sceneryTone === 'under-tree'
        ? [24, 76]
        : [6, 60]
      : sceneryTone === 'under-tree'
        ? [12, 64]
        : [5, 68]
  const topRange =
    kind === 'hero'
      ? sceneryTone === 'under-tree'
        ? [4.8, 14.2]
        : sceneryTone === 'moonlit'
          ? [5.2, 14.8]
          : sceneryTone === 'classic'
            ? [5.4, 14.6]
            : [5.2, 15.2]
      : sceneryTone === 'under-tree'
        ? [1.6, 5.4]
        : sceneryTone === 'moonlit'
          ? [1.8, 5.8]
          : sceneryTone === 'classic'
            ? [1.7, 5.7]
            : [1.8, 6.1]

  return {
    id: Date.now() + Math.random(),
    left: `${randomBetween(leftRange[0], leftRange[1]).toFixed(2)}%`,
    src: design.src,
    top: `${randomBetween(topRange[0], topRange[1]).toFixed(2)}rem`,
    width: `${randomBetween(design.minWidth, design.maxWidth).toFixed(2)}rem`,
  }
}

const createSpawnedFlower = (
  sceneryTone: MenuSceneryTone,
  kind: 'hero' | 'panel' = 'panel',
): SpawnedFlower => {
  const heroLeftRange: [number, number] = [8, 92]
  const heroScaleRange =
    sceneryTone === 'under-tree'
      ? [0.66, 0.86]
      : sceneryTone === 'moonlit'
        ? [0.72, 0.92]
        : sceneryTone === 'classic'
          ? [0.74, 0.94]
          : [0.76, 0.98]
  const panelScaleRange =
    sceneryTone === 'under-tree'
      ? [0.78, 1]
      : sceneryTone === 'moonlit'
        ? [0.82, 1.04]
        : sceneryTone === 'classic'
          ? [0.84, 1.06]
          : [0.86, 1.08]
  const [minLeft, maxLeft] = kind === 'hero' ? heroLeftRange : [8, 92]
  const [minScale, maxScale] = kind === 'hero' ? heroScaleRange : panelScaleRange

  return {
    asset:
      spawnedFlowerAssetsByScenery[sceneryTone][
        Math.floor(Math.random() * spawnedFlowerAssetsByScenery[sceneryTone].length)
      ] ?? '/flowers/daisy.svg',
    id: Date.now() + Math.random(),
    left: `${randomBetween(minLeft, maxLeft).toFixed(2)}%`,
    scale: Number(randomBetween(minScale, maxScale).toFixed(2)),
  }
}

const buildSeededFlowers = (
  sceneryTone: MenuSceneryTone,
  kind: 'hero' | 'panel',
  count = 27,
): SpawnedFlower[] => {
  const [minLeft, maxLeft] = kind === 'hero' ? [8, 92] : [6, 94]
  const span = maxLeft - minLeft

  return Array.from({ length: count }, (_, index) => {
    const segmentStart = minLeft + (span / count) * index
    const segmentEnd = minLeft + (span / count) * (index + 1)
    const flower = createSpawnedFlower(sceneryTone, kind)

    return {
      ...flower,
      id: index + 1,
      left: `${randomBetween(segmentStart + 0.16, segmentEnd - 0.16).toFixed(2)}%`,
    }
  })
}

function MenuBloomMark({
  className,
  style,
  tone = 'sage',
  variant,
}: {
  className?: string
  style?: React.CSSProperties
  tone?: BloomTone
  variant?: BloomVariant
}) {
  const bloomVariant = variant ?? defaultToneVariants[tone]

  return (
    <span
      aria-hidden="true"
      className={cn('cateringBloomMark', `tone-${tone}`, className)}
      style={
        {
          ...style,
          ['--bloom-center-size' as string]: `${bloomVariant.centerSize}em`,
          ['--bloom-petal-height' as string]: `${bloomVariant.petalHeight}em`,
          ['--bloom-petal-offset' as string]: `${bloomVariant.petalOffset}em`,
          ['--bloom-petal-width' as string]: `${bloomVariant.petalWidth}em`,
        } as React.CSSProperties
      }
    >
      <span
        className="cateringBloomFlower"
        style={
          {
            ['--bloom-rotation' as string]: `${bloomVariant.rotation}deg`,
          } as React.CSSProperties
        }
      >
        {Array.from({ length: bloomVariant.petalCount }).map((_, index) => (
          <span
            className="cateringBloomPetal"
            key={`${tone}-${index}`}
            style={
              {
                ['--petal-rotation' as string]: `${(360 / bloomVariant.petalCount) * index}deg`,
              } as React.CSSProperties
            }
          />
        ))}
        <span className="cateringBloomCenter" />
      </span>
      <span className="cateringBloomStem" />
    </span>
  )
}

function FlowerSprite({
  asset,
  className,
  style,
}: {
  asset: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span aria-hidden="true" className={cn('cateringFlowerSprite', className)} style={style}>
      <Image
        alt=""
        aria-hidden="true"
        className="cateringFlowerSpriteImage"
        height={160}
        sizes="64px"
        src={asset}
        unoptimized
        width={160}
      />
    </span>
  )
}

function DecorativeSceneImage({
  className,
  fit = 'contain',
  priority,
  sizes = '100vw',
  src,
  style,
}: {
  className: string
  fit?: 'contain' | 'cover'
  priority?: boolean
  sizes?: string
  src: string
  style?: React.CSSProperties
}) {
  return (
    <span aria-hidden="true" className={cn('cateringDecorativeImage', className)} style={style}>
      <Image
        alt=""
        aria-hidden="true"
        className={fit === 'cover' ? 'object-cover' : 'object-contain'}
        fill
        priority={priority}
        sizes={sizes}
        src={src}
        unoptimized
      />
    </span>
  )
}

function MenuHero({
  onChangeScenery,
  sceneryTone,
}: {
  onChangeScenery: () => void
  sceneryTone: MenuSceneryTone
}) {
  const [spawnedClouds, setSpawnedClouds] = useState<SpawnedCloud[]>([])
  const [spawnedFlowers, setSpawnedFlowers] = useState<SpawnedFlower[]>(() =>
    buildSeededFlowers(sceneryTone, 'hero'),
  )
  const sceneClouds = heroCloudsByScenery[sceneryTone] ?? heroCloudsByScenery.dawn
  const heroPieces = heroPiecesByScenery[sceneryTone] ?? heroPiecesByScenery.dawn
  const heroFlowers = heroLineFlowersByScenery[sceneryTone] ?? heroLineFlowersByScenery.dawn
  const heroSkySrc = skyByScenery[sceneryTone] ?? skyByScenery.dawn
  const meadowSrc = meadowByScenery[sceneryTone] ?? meadowByScenery.dawn

  useEffect(() => {
    setSpawnedClouds([])
    setSpawnedFlowers(buildSeededFlowers(sceneryTone, 'hero'))
  }, [sceneryTone])

  const spawnCloud = () => {
    setSpawnedClouds((current) => [...current, createSpawnedCloud(sceneryTone, 'hero')])
  }

  const spawnFlower = () => {
    setSpawnedFlowers((current) => [...current, createSpawnedFlower(sceneryTone, 'hero')])
  }

  return (
    <section
      className={cn(
        'cateringHeroBand relative left-1/2 w-screen -translate-x-1/2',
        `cateringScene-${sceneryTone}`,
      )}
      style={
        {
          ['--catering-hero-flower-seam' as string]:
            heroFlowerSeamByScenery[sceneryTone] ?? heroFlowerSeamByScenery.dawn,
        } as React.CSSProperties
      }
    >
      <div className="cateringHeroBackdrop">
        <DecorativeSceneImage
          className="cateringSceneSky cateringHeroSky"
          fit="cover"
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
            sizes="50vw"
            src={piece.src}
            style={piece.style}
          />
        ))}
        <div aria-hidden="true" className="cateringHeroFlowerRail">
          {heroFlowers.map((flower) => (
            <FlowerSprite
              asset={flower.asset}
              className={cn(
                'cateringHeroLineFlower cateringLivingFlower',
                flower.variant === 'wildflower' && 'cateringHeroLineWildflower',
              )}
              key={`hero-line-${flower.left}-${flower.asset}`}
              style={buildFlowerMotionStyle(
                `hero-line-${flower.left}-${flower.asset}`,
                flower.left,
                flower.scale,
              )}
            />
          ))}
          {spawnedFlowers.map((flower) => (
            <FlowerSprite
              asset={flower.asset}
              className="cateringHeroLineFlower cateringHeroLineFlowerSpawned cateringLivingFlower"
              key={flower.id}
              style={buildFlowerMotionStyle(`hero-spawn-${flower.id}`, flower.left, flower.scale)}
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
      {spawnedClouds.map((cloud) => (
        <DecorativeSceneImage
          className="cateringHeroCloud"
          key={cloud.id}
          src={cloud.src}
          style={{
            left: cloud.left,
            top: cloud.top,
            width: cloud.width,
          }}
        />
      ))}
      <div className="cateringHeroContent container relative z-[3]">
        <div className="max-w-[42rem] space-y-4">
          <div className="space-y-4">
            <p className="cateringMenuEyebrow cateringHeroEyebrow">Baked with Blessings</p>
            <h1 className="cateringMenuHeroDisplay max-w-[10ch] text-[clamp(3.5rem,8.6vw,6rem)] leading-[0.88] tracking-[-0.045em] text-[#19395f]">
              Catering Menu
            </h1>
            <p className="cateringHeroSummary max-w-[35rem] text-[1.02rem] leading-8 md:text-[1.14rem]">
              Clear portions, honest descriptions, and expandable ordering details for each item so
              the customer understands exactly what the group is buying.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button className="cateringSpawnButton" onClick={spawnCloud} type="button">
                Spawn a cloud
              </button>
              <button className="cateringSpawnButton" onClick={spawnFlower} type="button">
                Spawn a flower
              </button>
              <button className="cateringSpawnButton" onClick={onChangeScenery} type="button">
                Change scenery
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PersuasionGardenPanel({
  onChangeScenery,
  product,
  sceneryTone,
  summary,
}: {
  onChangeScenery: () => void
  product: Partial<Product>
  sceneryTone: MenuSceneryTone
  summary: string
}) {
  const [spawnedClouds, setSpawnedClouds] = useState<SpawnedCloud[]>([])
  const [spawnedFlowers, setSpawnedFlowers] = useState<SpawnedFlower[]>(() =>
    buildSeededFlowers(sceneryTone, 'panel'),
  )
  const persuasionCopy = buildPersuasionCopy(product, summary)
  const sceneClouds = panelCloudsByScenery[sceneryTone] ?? panelCloudsByScenery.dawn
  const panelPieces = panelPiecesByScenery[sceneryTone] ?? panelPiecesByScenery.dawn
  const panelFlowers =
    persuasionGardenFlowersByScenery[sceneryTone] ?? persuasionGardenFlowersByScenery.dawn
  const panelWildflowers =
    persuasionWildflowersByScenery[sceneryTone] ?? persuasionWildflowersByScenery.dawn
  const skySrc = skyByScenery[sceneryTone] ?? skyByScenery.dawn
  const meadowSrc = meadowByScenery[sceneryTone] ?? meadowByScenery.dawn

  useEffect(() => {
    setSpawnedClouds([])
    setSpawnedFlowers(buildSeededFlowers(sceneryTone, 'panel'))
  }, [sceneryTone])

  const spawnCloud = () => {
    setSpawnedClouds((current) => [...current, createSpawnedCloud(sceneryTone, 'panel')])
  }

  const spawnFlower = () => {
    setSpawnedFlowers((current) => [...current, createSpawnedFlower(sceneryTone, 'panel')])
  }

  return (
    <div
      className={cn(
        'cateringPersuasionPanel relative overflow-hidden rounded-[1.45rem] border border-[rgba(91,70,37,0.12)] bg-[#dbeeff] px-5 py-5 shadow-[0_10px_24px_rgba(23,21,16,0.07)] md:px-6 md:py-6',
        `cateringScene-${sceneryTone}`,
      )}
      style={
        {
          ['--catering-panel-fill' as string]: panelBackgroundByScenery[sceneryTone],
        } as React.CSSProperties
      }
    >
      <DecorativeSceneImage
        className="cateringSceneSky cateringPersuasionSky"
        fit="cover"
        sizes="100vw"
        src={skySrc}
      />
      {sceneClouds.map((cloud) => (
        <DecorativeSceneImage
          className={cn('cateringPersuasionCloud', cloud.className)}
          key={`${sceneryTone}-${cloud.className}-${cloud.src}`}
          sizes="24vw"
          src={cloud.src}
          style={cloud.style}
        />
      ))}
      {spawnedClouds.map((cloud) => (
        <DecorativeSceneImage
          className="cateringPersuasionCloud"
          key={cloud.id}
          src={cloud.src}
          style={{
            left: cloud.left,
            top: cloud.top,
            width: cloud.width,
          }}
        />
      ))}

      <div className="relative z-[2] max-w-[44rem] space-y-4 pb-20 pr-0 md:pb-24 md:pr-[10rem]">
        <h4 className="cateringMenuRoundHeading cateringPersuasionHeading text-[clamp(1.85rem,3.6vw,2.45rem)] leading-[0.95] tracking-[-0.04em]">
          {buildPersuasionHeading()}
        </h4>

        {product.slug === 'cookie-tray' ? (
          <div className="cateringPersuasionBody space-y-4">
            {persuasionCopy.map((paragraph) => (
              <p className="text-[1rem] leading-8 md:text-[1.06rem]" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
        ) : product.menuExpandedPitch ? (
          <RichText
            className="cateringPitch cateringPersuasionBody prose-p:leading-7"
            data={product.menuExpandedPitch}
            enableGutter={false}
          />
        ) : (
          <div className="cateringPersuasionBody space-y-4">
            {persuasionCopy.map((paragraph) => (
              <p className="text-[1rem] leading-8 md:text-[1.06rem]" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button className="cateringSpawnButton" onClick={spawnCloud} type="button">
            Spawn a cloud
          </button>
          <button className="cateringSpawnButton" onClick={spawnFlower} type="button">
            Spawn a flower
          </button>
          <button className="cateringSpawnButton" onClick={onChangeScenery} type="button">
            Change scenery
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[6.7rem] overflow-hidden">
        <DecorativeSceneImage
          className="cateringSceneMeadow cateringPersuasionMeadow"
          fit="cover"
          sizes="100vw"
          src={meadowSrc}
        />
        {panelPieces.map((piece) => (
          <DecorativeSceneImage
            className={cn('cateringPersuasionSceneryPiece', piece.className)}
            key={`${sceneryTone}-${piece.className}-${piece.src}`}
            sizes="40vw"
            src={piece.src}
            style={piece.style}
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
            className="cateringPersuasionFlower cateringPersuasionWildflower cateringLivingFlower"
            key={`panel-wild-${flower.left}-${flower.asset}`}
            style={buildFlowerMotionStyle(
              `panel-wild-${flower.left}-${flower.asset}`,
              flower.left,
              flower.scale,
            )}
          />
        ))}
        {panelFlowers.map((flower) => (
          <FlowerSprite
            asset={flower.asset}
            className="cateringPersuasionFlower cateringLivingFlower"
            key={`${flower.left}-${flower.asset}`}
            style={buildFlowerMotionStyle(
              `panel-${flower.left}-${flower.asset}`,
              flower.left,
              flower.scale,
            )}
          />
        ))}
        {spawnedFlowers.map((flower) => (
          <FlowerSprite
            asset={flower.asset}
            className="cateringPersuasionFlower cateringPersuasionFlowerSpawned cateringLivingFlower"
            key={flower.id}
            style={buildFlowerMotionStyle(`panel-spawn-${flower.id}`, flower.left, flower.scale)}
          />
        ))}
      </div>
    </div>
  )
}

function TrayFlavorCard({
  addSelection,
  canIncrement,
  count,
  flavor,
  removeSelection,
}: {
  addSelection: () => void
  canIncrement: boolean
  count: number
  flavor: SelectableFlavor
  removeSelection: () => void
}) {
  return (
    <article className="cateringFlavorCard flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[rgba(91,70,37,0.14)] bg-[rgba(255,250,242,0.98)]">
      <div className="px-4 pt-3.5">
        <div className="min-w-0">
          <h4 className="cateringMenuRoundHeading truncate text-[1.02rem] leading-tight tracking-[-0.02em] text-[#171510]">
            {flavor.title}
          </h4>
          <div className="mt-2.5 flex items-center justify-between gap-2.5">
            <button
              aria-label={`Remove one ${flavor.title}`}
              className="cateringFlavorStep"
              disabled={count < 1}
              onClick={removeSelection}
              type="button"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="text-center">
              <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[rgba(23,21,16,0.42)]">
                In tray
              </p>
              <p className="cateringMenuRoundHeading text-[0.94rem] tracking-[-0.02em] text-[#171510]">
                {count}
              </p>
            </div>

            <button
              aria-label={`Add one ${flavor.title}`}
              className="cateringFlavorStep"
              disabled={!canIncrement}
              onClick={addSelection}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {flavor.summary ? (
            <p className="mt-2.5 line-clamp-2 text-[0.8rem] leading-6 text-[rgba(23,21,16,0.62)]">
              {flavor.summary}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="relative mt-2.5 overflow-hidden bg-[#dbeeff]"
        style={
          {
            '--cookie-bottom': '1.75rem',
            '--cookie-size': 'clamp(10rem, 64%, 11.6rem)',
          } as React.CSSProperties
        }
      >
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          src="/grassland.svg"
        />
        <img
          alt=""
          aria-hidden="true"
          className="cateringFlavorCloud pointer-events-none absolute left-[-18%] top-[14%] z-10 w-[5rem]"
          src="/clouds/brown-anime-cloud-fluffy.svg"
        />
        <img
          alt=""
          aria-hidden="true"
          className="cateringFlavorCloud pointer-events-none absolute left-[-12%] top-[30%] z-10 w-[4.2rem]"
          src="/clouds/brown-anime-cloud-layered.svg"
          style={{ animationDelay: '-6s' }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[54%] bg-gradient-to-b from-[rgba(255,255,255,0.18)] to-transparent" />

        <div className="relative h-[14.3rem]">
          <CookieSheepRig
            bodyFallbackSrc={flavor.bodyFallbackSrc}
            image={flavor.image}
            title={flavor.title}
          />
        </div>
      </div>
    </article>
  )
}

function SimpleItemPanel({
  image,
  onAddToCart,
  priceInUSD,
  product,
}: {
  image: MediaType | null
  onAddToCart: () => void
  priceInUSD?: number | null
  product: Partial<Product>
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {product.menuExpandedPitch ? (
          <RichText
            className="cateringPitch prose-p:leading-7 prose-headings:tracking-[-0.04em] prose-h2:text-[1.35rem] prose-h2:leading-tight"
            data={product.menuExpandedPitch}
            enableGutter={false}
          />
        ) : (
          <p className="text-[1rem] leading-8 text-[rgba(23,21,16,0.76)]">
            {resolveSummary(product)}
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-[1.45rem] border border-[rgba(91,70,37,0.12)] bg-[#fff8f2] p-4 shadow-[0_10px_24px_rgba(23,21,16,0.06)]">
        {image ? (
          <div className="overflow-hidden rounded-[1.15rem] bg-[#f1e5cf]">
            <Media
              className="relative aspect-[5/4] w-full"
              imgClassName="h-full w-full object-cover"
              resource={image}
            />
          </div>
        ) : null}

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(23,21,16,0.46)]">
              Order summary
            </p>
            <p className="mt-1 text-[1rem] leading-7 text-[rgba(23,21,16,0.74)]">
              {product.menuPortionLabel ?? 'Menu item'}
            </p>
          </div>

          {typeof priceInUSD === 'number' ? (
            <Price
              amount={priceInUSD}
              className="cateringMenuRoundHeading text-[1.28rem] tracking-[-0.03em] text-[#171510]"
            />
          ) : null}
        </div>

        <button
          className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-full bg-[#171510] px-5 text-[0.98rem] tracking-[-0.02em] text-white transition duration-200 hover:bg-[#2a2822]"
          onClick={onAddToCart}
          type="button"
        >
          Add to cart
        </button>
      </div>
    </div>
  )
}

function BatchBuilderPanel({
  onAddFlavor,
  onAddToCart,
  onChangeScenery,
  onRemoveFlavor,
  priceInUSD,
  product,
  sceneryTone,
  requiredSelectionCount,
  selectableFlavors,
  selectedCounts,
  totalSelected,
  traySelectionsForSummary,
}: {
  onAddFlavor: (flavorID: number) => void
  onAddToCart: () => void
  onChangeScenery: () => void
  onRemoveFlavor: (flavorID: number) => void
  priceInUSD?: number | null
  product: Partial<Product>
  sceneryTone: MenuSceneryTone
  requiredSelectionCount: number
  selectableFlavors: SelectableFlavor[]
  selectedCounts: Record<number, number>
  totalSelected: number
  traySelectionsForSummary: {
    product: Product
    quantity: number
  }[]
}) {
  const canAddTray =
    requiredSelectionCount > 0 &&
    totalSelected === requiredSelectionCount &&
    traySelectionsForSummary.length > 0
  const progressPercentage =
    requiredSelectionCount > 0 ? Math.min(1, totalSelected / requiredSelectionCount) * 100 : 0
  const progressFlowers = Array.from({ length: totalSelected }, (_, index) => ({
    id: `slot-${index}`,
    tone: progressBloomTones[index % progressBloomTones.length] ?? 'sage',
  }))

  return (
    <div className="space-y-5">
      <PersuasionGardenPanel
        onChangeScenery={onChangeScenery}
        product={product}
        sceneryTone={sceneryTone}
        summary={resolveSummary(product)}
      />

      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-[1rem] border border-[rgba(91,70,37,0.1)] bg-[#fff8f2] px-3 py-2 shadow-[0_8px_16px_rgba(23,21,16,0.04)]">
          <div className="relative z-[1] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="space-y-0">
                <p className="cateringMenuEyebrow">Tray progress</p>
                <h4 className="cateringMenuRoundHeading text-[0.88rem] leading-tight tracking-[-0.02em] text-[#171510]">
                  {totalSelected}/{requiredSelectionCount} selected
                </h4>
              </div>

              <div className="text-right">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(23,21,16,0.46)]">
                  Tray price
                </p>
                {typeof priceInUSD === 'number' ? (
                  <Price
                    amount={priceInUSD}
                    className="cateringMenuRoundHeading mt-0.5 text-[0.88rem] tracking-[-0.02em] text-[#171510]"
                  />
                ) : null}
              </div>
            </div>

            <div className="pt-1.5">
              <div className="relative h-2.5 rounded-full bg-[rgba(126,161,47,0.18)]">
                <div
                  className="h-full rounded-full bg-[#7ea12f] transition-[width] duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />

                {progressFlowers.map((bloom, index) => (
                  <span
                    className={cn('cateringProgressBloom', `tone-${bloom.tone}`)}
                    key={bloom.id}
                    style={{
                      left: `${((index + 1) / requiredSelectionCount) * 100}%`,
                    }}
                  >
                    <MenuBloomMark tone={bloom.tone} variant={defaultToneVariants[bloom.tone]} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <TraySelectionSummary
          compact
          label="Current tray mix"
          selections={traySelectionsForSummary}
          tone="muted"
        />

        <div className="space-y-3">
          <div>
            <p className="cateringMenuEyebrow">Choose your cookies</p>
            <p className="mt-1 text-[0.98rem] leading-7 text-[rgba(23,21,16,0.68)]">
              Build the tray one cookie at a time, then add it only when the full batch is ready.
            </p>
          </div>

          <div aria-label="Cookie flavor tray builder" className="cateringFlavorRail" role="region">
            <div className="cateringFlavorRailInner">
              {selectableFlavors.map((flavor) => {
                const flavorCount = selectedCounts[flavor.id] ?? 0

                return (
                  <div className="cateringFlavorRailItem" key={flavor.id}>
                    <TrayFlavorCard
                      addSelection={() => onAddFlavor(flavor.id)}
                      canIncrement={totalSelected < requiredSelectionCount}
                      count={flavorCount}
                      flavor={flavor}
                      removeSelection={() => onRemoveFlavor(flavor.id)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <button
          className={cn(
            'inline-flex min-h-[3rem] w-full items-center justify-center rounded-full px-5 text-[0.98rem] tracking-[-0.02em] transition duration-200',
            canAddTray
              ? 'cursor-pointer bg-[#171510] text-white hover:bg-[#2a2822]'
              : 'cursor-not-allowed bg-[#171510]/12 text-[#171510]/42',
          )}
          disabled={!canAddTray}
          onClick={onAddToCart}
          type="button"
        >
          Add tray to cart
        </button>
      </div>
    </div>
  )
}

function CateringMenuRow({
  index,
  onChangeScenery,
  product,
  sceneryTone,
}: {
  index: number
  onChangeScenery: () => void
  product: Partial<Product>
  sceneryTone: MenuSceneryTone
}) {
  const { addItem, isLoading } = useCart()
  const [selectedCounts, setSelectedCounts] = useState<Record<number, number>>({})
  const image = normalizeImage(product)
  const summary = resolveSummary(product)
  const isBatchBuilder = product.menuBehavior === 'batchBuilder'
  const requiredSelectionCount =
    isBatchBuilder && typeof product.requiredSelectionCount === 'number'
      ? product.requiredSelectionCount
      : 0
  const selectableFlavors = useMemo(() => buildSelectableFlavors(product), [product])

  const totalSelected = useMemo(
    () => Object.values(selectedCounts).reduce((sum, count) => sum + count, 0),
    [selectedCounts],
  )

  const traySelectionsForSummary = useMemo(
    () =>
      selectableFlavors
        .map((flavor) => ({
          product: {
            id: flavor.id,
            title: flavor.title,
          } as Product,
          quantity: selectedCounts[flavor.id] ?? 0,
        }))
        .filter((selection) => selection.quantity > 0),
    [selectableFlavors, selectedCounts],
  )

  const traySelectionsForCart = useMemo(
    () =>
      traySelectionsForSummary.map((selection) => ({
        product: selection.product.id,
        quantity: selection.quantity,
      })),
    [traySelectionsForSummary],
  )

  const handleAddFlavor = (flavorID: number) => {
    setSelectedCounts((current) => {
      const currentTotal = Object.values(current).reduce((sum, count) => sum + count, 0)

      if (requiredSelectionCount > 0 && currentTotal >= requiredSelectionCount) {
        return current
      }

      return {
        ...current,
        [flavorID]: (current[flavorID] ?? 0) + 1,
      }
    })
  }

  const handleRemoveFlavor = (flavorID: number) => {
    setSelectedCounts((current) => {
      const currentCount = current[flavorID] ?? 0

      if (currentCount <= 0) {
        return current
      }

      if (currentCount <= 1) {
        const { [flavorID]: _removed, ...rest } = current
        return rest
      }

      return {
        ...current,
        [flavorID]: currentCount - 1,
      }
    })
  }

  const handleAddToCart = () => {
    if (!product.id || isLoading) {
      return
    }

    if (isBatchBuilder) {
      if (
        requiredSelectionCount <= 0 ||
        totalSelected !== requiredSelectionCount ||
        traySelectionsForCart.length === 0
      ) {
        toast.info(`Choose exactly ${requiredSelectionCount} cookies before adding this tray.`)
        return
      }

      addItem({
        batchSelections: traySelectionsForCart,
        product: product.id,
      } as Parameters<typeof addItem>[0]).then(() => {
        toast.success(`${product.title ?? 'Tray'} added to cart.`)
        setSelectedCounts({})
      })

      return
    }

    addItem({ product: product.id }).then(() => {
      toast.success(`${product.title ?? 'Item'} added to cart.`)
    })
  }

  return (
    <AccordionItem
      className="border-b border-[rgba(23,21,16,0.14)]"
      value={product.slug ?? `row-${index}`}
    >
      <AccordionTrigger className="cateringRowTrigger gap-6 py-8 text-left hover:no-underline md:py-10">
        <div className="grid w-full gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <h3 className="cateringMenuRoundHeading text-[2.15rem] leading-[0.95] tracking-[-0.04em] text-[#171510] md:text-[2.65rem]">
                {product.title ?? 'Menu item'}
              </h3>
              {product.menuPortionLabel ? (
                <span className="cateringPortionInline">{product.menuPortionLabel}</span>
              ) : null}
            </div>
            <p className="max-w-[41rem] text-[0.98rem] leading-8 text-[rgba(23,21,16,0.72)] md:text-[1.05rem]">
              {summary}
            </p>
          </div>

          <div className="cateringPriceBlock text-left md:text-right">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(23,21,16,0.46)]">
              Price
            </p>
            {typeof product.priceInUSD === 'number' ? (
              <Price
                amount={product.priceInUSD}
                className="cateringMenuRoundHeading mt-2 text-[1.42rem] tracking-[-0.02em] text-[#171510] md:text-[1.56rem]"
              />
            ) : null}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pt-1 pb-9">
        {isBatchBuilder ? (
          <BatchBuilderPanel
            onAddFlavor={handleAddFlavor}
            onAddToCart={handleAddToCart}
            onChangeScenery={onChangeScenery}
            onRemoveFlavor={handleRemoveFlavor}
            priceInUSD={product.priceInUSD}
            product={product}
            sceneryTone={sceneryTone}
            requiredSelectionCount={requiredSelectionCount}
            selectableFlavors={selectableFlavors}
            selectedCounts={selectedCounts}
            totalSelected={totalSelected}
            traySelectionsForSummary={traySelectionsForSummary}
          />
        ) : (
          <SimpleItemPanel
            image={image}
            onAddToCart={handleAddToCart}
            priceInUSD={product.priceInUSD}
            product={product}
          />
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

export function CateringMenuSection({ products }: CateringMenuSectionProps) {
  const orderedProducts = useMemo(() => sortProductsForDisplay(products), [products])
  const [heroSceneryTone, setHeroSceneryTone] = useState<MenuSceneryTone>('dawn')

  if (orderedProducts.length === 0) {
    return null
  }

  const handleChangeHeroScenery = () => {
    setHeroSceneryTone((current) => getNextSceneryTone(current))
  }

  return (
    <div className="cateringMenuExperience" style={{ fontFamily: 'var(--font-rounded-body)' }}>
      <MenuHero onChangeScenery={handleChangeHeroScenery} sceneryTone={heroSceneryTone} />

      <section
        className="cateringMenuBand relative left-1/2 w-screen -translate-x-1/2"
        id="catering-menu-items"
      >
        <div className="container pt-0 pb-6 md:pt-0 md:pb-10">
          <div className="cateringMenuPanel">
            <Accordion
              collapsible
              defaultValue={orderedProducts[0]?.slug ?? undefined}
              type="single"
            >
              {orderedProducts.map((product, index) => (
                <CateringMenuRow
                  index={index}
                  key={product.id ?? product.slug ?? index}
                  onChangeScenery={handleChangeHeroScenery}
                  product={product}
                  sceneryTone={heroSceneryTone}
                />
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <style>{`
        .cateringMenuHeroDisplay {
          font-family: var(--font-catering-serif), 'Iowan Old Style', 'Palatino Linotype', serif;
          font-weight: 800;
          text-shadow: 0 10px 24px rgba(17, 44, 75, 0.08);
        }

        .cateringMenuRoundHeading {
          font-family: var(--font-rounded-display);
          font-weight: 700;
        }

        .cateringMenuEyebrow {
          color: rgba(25, 57, 95, 0.76);
          font-size: 0.72rem;
          font-family: var(--font-rounded-display);
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .cateringHeroEyebrow {
          color: rgba(25, 57, 95, 0.78);
        }

        .cateringHeroSummary {
          color: rgba(25, 57, 95, 0.9);
          font-family: var(--font-rounded-display);
          font-weight: 700;
          letter-spacing: -0.015em;
        }

        .cateringPitch :is(h1, h2, h3, h4) {
          color: #171510;
          font-family: var(--font-rounded-display);
          font-weight: 600;
          letter-spacing: -0.02em;
        }

        .cateringPitch :is(p, li) {
          color: rgba(23, 21, 16, 0.78);
        }

        .cateringPersuasionBody :is(h1, h2, h3, h4) {
          display: none;
        }

        .cateringPersuasionBody :is(p, li) {
          color: #27496b;
          font-weight: 650;
        }

        .cateringMenuExperience {
          --catering-header-underlap: 7.6rem;
          --catering-layout-offset: clamp(2.5rem, 3.8vw, 3.5rem);
          position: relative;
          isolation: isolate;
          margin-top: calc((var(--catering-header-underlap) + var(--catering-layout-offset)) * -1);
        }

        .cateringHeroBand {
          --catering-hero-meadow-height: clamp(8.5rem, 15vh, 10.75rem);
          background: transparent;
          min-height: clamp(35rem, 78svh, 45rem);
          overflow: hidden;
          position: relative;
        }

        .cateringHeroBackdrop {
          inset: 0;
          position: absolute;
          z-index: 0;
        }

        .cateringHeroContent {
          align-items: flex-start;
          display: flex;
          min-height: clamp(35rem, 78svh, 45rem);
          padding-bottom: calc(var(--catering-hero-meadow-height) + clamp(1.8rem, 4.4vw, 3rem));
          padding-top: calc(var(--catering-header-underlap) + clamp(1.5rem, 4vw, 3rem));
        }

        .cateringMenuBand {
          background: #fff8f2;
          margin-top: -1px;
        }

        .cateringMenuPanel {
          padding: 0;
        }

        .cateringSceneSky,
        .cateringSceneMeadow,
        .cateringHeroSceneryPiece,
        .cateringPersuasionSceneryPiece {
          pointer-events: none;
          position: absolute;
        }

        .cateringDecorativeImage {
          display: block;
          overflow: visible;
          position: absolute;
        }

        .cateringSceneSky {
          height: 100%;
          inset: 0;
          object-fit: cover;
          width: 100%;
        }

        .cateringSceneMeadow {
          left: 0;
          object-fit: cover;
          object-position: center bottom;
          width: 100%;
        }

        .cateringHeroSky {
          top: 0;
        }

        .cateringHeroMeadow {
          bottom: -0.2rem;
          height: var(--catering-hero-meadow-height);
        }

        .cateringHeroSceneryPiece {
          transform-origin: center bottom;
          z-index: 1;
        }

        .cateringHeroFlowerRail {
          bottom: var(--catering-hero-flower-seam, 0.5rem);
          height: 0;
          inset-inline: 0;
          overflow: visible;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }

        .cateringHeroLineFlower {
          --flower-stem-trim: 10%;
          bottom: 0.1rem;
          width: 2.18rem;
          z-index: 2;
        }

        .cateringHeroLineWildflower {
          --flower-stem-trim: 6%;
          bottom: 0.16rem;
          width: 1.34rem;
          z-index: 1;
        }

        .cateringFlowerSprite {
          display: inline-flex;
          overflow: hidden;
          pointer-events: none;
          position: absolute;
          transform-origin: center bottom;
          z-index: 5;
        }

        .cateringLivingFlower {
          animation: cateringFlowerLife var(--flower-duration, 4.6s) ease-in-out infinite;
          animation-delay: var(--flower-delay, 0s);
          transform:
            translateX(-50%)
            translateY(0)
            rotate(calc(var(--flower-tilt, 2deg) * -1))
            scale(var(--flower-scale, 1));
          will-change: transform;
        }

        .cateringFlowerSpriteImage {
          display: block;
          height: auto;
          transform: translateY(var(--flower-stem-trim, 0%));
          transform-origin: center bottom;
          width: 100%;
        }

        .cateringHeroLineFlowerSpawned .cateringFlowerSpriteImage,
        .cateringPersuasionFlowerSpawned .cateringFlowerSpriteImage {
          animation: cateringSpriteGrow 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .cateringPersuasionPanel {
          background: var(
            --catering-panel-fill,
            linear-gradient(180deg, rgba(223, 239, 255, 0.92) 0%, rgba(216, 233, 246, 0.94) 100%)
          );
          isolation: isolate;
        }

        .cateringPersuasionSky {
          inset: 0;
          opacity: 0.92;
          z-index: 0;
        }

        .cateringPersuasionCloud {
          animation: cateringCloudBob 8.4s ease-in-out infinite;
          opacity: 0.96;
          position: absolute;
          z-index: 1;
        }

        .cateringHeroCloud {
          animation: cateringCloudBob 9.6s ease-in-out infinite;
          opacity: 0.95;
          position: absolute;
          z-index: 1;
        }

        .cateringSpawnButton {
          align-items: center;
          background: rgba(255, 248, 242, 0.84);
          border: 1px solid rgba(25, 57, 95, 0.16);
          border-radius: 999px;
          color: #173a63;
          cursor: pointer;
          display: inline-flex;
          font-family: var(--font-rounded-display);
          font-size: 0.86rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          min-height: 2.25rem;
          padding: 0.45rem 0.95rem;
          transition:
            background-color 180ms ease,
            border-color 180ms ease,
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 2;
        }

        .cateringSpawnButton:hover,
        .cateringSpawnButton:focus-visible {
          background: #fff8f2;
          border-color: rgba(25, 57, 95, 0.26);
          transform: translateY(-1px);
        }

        .cateringPersuasionMeadow {
          bottom: -0.4rem;
          height: 100%;
          z-index: 0;
        }

        .cateringPersuasionSceneryPiece {
          transform-origin: center bottom;
          z-index: 1;
        }

        .cateringPersuasionFlower,
        .cateringPersuasionFlowerSpawned {
          position: absolute;
          z-index: 3;
        }

        .cateringPersuasionFlower {
          --flower-stem-trim: 8%;
          bottom: 0.3rem;
          width: 2.7rem;
        }

        .cateringPersuasionWildflower {
          --flower-stem-trim: 5%;
          bottom: 1.2rem;
          width: 1.55rem;
          z-index: 2;
        }

        .cateringPersuasionFlowerSpawned {
          --flower-stem-trim: 8%;
          bottom: 0.26rem;
        }

        .cateringPixelSheep {
          bottom: 0.78rem;
          display: block;
          height: 5.2rem;
          pointer-events: none;
          position: absolute;
          transform: translateX(-50%);
          width: 7rem;
          z-index: 4;
        }

        .cateringPersuasionHeading {
          color: #143e63;
          font-weight: 520;
          text-wrap: balance;
        }

        .cateringScene-moonlit .cateringMenuHeroDisplay,
        .cateringScene-moonlit .cateringHeroSummary,
        .cateringScene-moonlit .cateringHeroEyebrow {
          color: #eef6ff;
          text-shadow: 0 12px 22px rgba(5, 10, 28, 0.24);
        }

        .cateringScene-moonlit .cateringPersuasionHeading,
        .cateringScene-moonlit .cateringPersuasionBody :is(p, li) {
          color: #eef6ff;
        }

        .cateringBloomMark {
          --bloom-center-size: 0.38em;
          --bloom-petal-height: 0.72em;
          --bloom-petal-offset: 0.26em;
          --bloom-petal-width: 0.66em;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          width: 1.55rem;
          min-width: 1.55rem;
          transform-origin: center bottom;
        }

        .cateringBloomFlower,
        .cateringBloomStem {
          display: block;
          flex-shrink: 0;
        }

        .cateringBloomFlower {
          height: 1.08rem;
          position: relative;
          width: 1.08rem;
          opacity: 0.96;
        }

        .cateringBloomPetal {
          background: var(--bloom-petal-a, #f0bb78);
          border-radius: 999px 999px 0.76rem 0.76rem;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
          height: var(--bloom-petal-height, 0.76em);
          left: 50%;
          position: absolute;
          top: 50%;
          transform:
            translate(-50%, -50%)
            rotate(calc(var(--bloom-rotation, 0deg) + var(--petal-rotation, 0deg)))
            translateY(calc(var(--bloom-petal-offset, 0.36em) * -1));
          width: var(--bloom-petal-width, 0.58em);
        }

        .cateringBloomPetal:nth-child(even) {
          background: var(--bloom-petal-b, #e47a1d);
        }

        .cateringBloomCenter {
          background: var(--bloom-center, #6f5110);
          border-radius: 999px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
          height: var(--bloom-center-size, 0.5em);
          left: 50%;
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: var(--bloom-center-size, 0.5em);
        }

        .cateringBloomStem {
          width: 2px;
          height: 0.46rem;
          margin-top: -0.06rem;
          border-radius: 999px;
          background: linear-gradient(180deg, #98a44a 0%, #536520 100%);
        }

        .tone-gold {
          --bloom-center: #6f5110;
          --bloom-petal-a: #f0bb78;
          --bloom-petal-b: #e47a1d;
        }

        .tone-sage {
          --bloom-center: #545228;
          --bloom-petal-a: #f2e7b2;
          --bloom-petal-b: #a7b066;
        }

        .tone-plum {
          --bloom-center: #4d4030;
          --bloom-petal-a: #d8bfd0;
          --bloom-petal-b: #8d6481;
        }

        .tone-rose {
          --bloom-center: #6e422f;
          --bloom-petal-a: #f5bfcb;
          --bloom-petal-b: #e27694;
        }

        .tone-sunflower {
          --bloom-center: #5d4214;
          --bloom-petal-a: #f8df67;
          --bloom-petal-b: #f6c940;
        }

        .cateringPortionInline {
          display: inline-flex;
          align-items: center;
          min-height: 2rem;
          border-radius: 999px;
          background: #d5e3f1;
          color: rgba(23, 21, 16, 0.72);
          font-size: 0.82rem;
          font-family: var(--font-rounded-display);
          font-weight: 600;
          letter-spacing: 0.08em;
          padding: 0.32rem 0.8rem;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .cateringPriceBlock {
          min-width: 6.75rem;
        }

        .cateringFlavorCard {
          background: #fff8f2;
          border: 1px solid rgba(91, 70, 37, 0.14);
          box-shadow: 0 10px 24px rgba(23, 21, 16, 0.06);
          touch-action: pan-x pinch-zoom;
        }

        .cateringFlavorCard button {
          touch-action: manipulation;
        }

        .cateringRowTrigger[data-state='open'] {
          color: #171510;
        }

        .cateringRowTrigger > svg {
          align-self: flex-start;
          color: rgba(23, 21, 16, 0.72);
          height: 3rem;
          margin-top: 0.25rem;
          padding: 0.72rem;
          width: 3rem;
          border-radius: 999px;
          border: 1px solid rgba(23, 21, 16, 0.12);
          background: rgba(255, 255, 255, 0.84);
          box-shadow: 0 8px 18px rgba(23, 21, 16, 0.05);
        }

        .cateringRowTrigger:hover > svg,
        .cateringRowTrigger:focus-visible > svg,
        .cateringRowTrigger[data-state='open'] > svg {
          background: #17341f;
          border-color: #17341f;
          color: #f7f5ef;
        }

        .cateringFlavorCloud {
          animation: cateringFlavorCloudDrift 9.8s ease-in-out infinite;
          filter: drop-shadow(0 6px 10px rgba(255, 255, 255, 0.28));
        }

        .cateringFlavorStep {
          align-items: center;
          background: rgba(28, 46, 16, 0.06);
          border: 1px solid rgba(28, 46, 16, 0.12);
          border-radius: 999px;
          color: #1c2e10;
          display: inline-flex;
          height: 1.9rem;
          justify-content: center;
          transition:
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
            background-color 180ms ease,
            border-color 180ms ease,
            color 180ms ease;
          width: 1.9rem;
        }

        .cateringFlavorStep:hover,
        .cateringFlavorStep:focus-visible {
          background: #1c2e10;
          border-color: #1c2e10;
          color: white;
          transform: translateY(-1px);
        }

        .cateringFlavorStep:disabled {
          cursor: not-allowed;
          opacity: 0.38;
          transform: none;
        }

        .cateringFlavorRail {
          overflow-x: auto;
          overflow-y: visible;
          padding-bottom: 0.6rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(23, 21, 16, 0.26) transparent;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          touch-action: pan-x pinch-zoom;
          scroll-snap-type: x proximity;
        }

        .cateringFlavorRail::-webkit-scrollbar {
          height: 0.45rem;
        }

        .cateringFlavorRail::-webkit-scrollbar-thumb {
          background: rgba(23, 21, 16, 0.18);
          border-radius: 999px;
        }

        .cateringFlavorRail::-webkit-scrollbar-track {
          background: transparent;
        }

        .cateringFlavorRailInner {
          display: flex;
          gap: 1rem;
          padding-bottom: 0.2rem;
          width: max-content;
        }

        .cateringFlavorRailItem {
          flex: 0 0 min(82vw, 18rem);
          scroll-snap-align: start;
        }

        .cateringProgressBloom {
          bottom: 0.12rem;
          opacity: 1;
          pointer-events: none;
          position: absolute;
          transform: translateX(-50%);
          transform-origin: center bottom;
          z-index: 2;
        }

        .cateringProgressBloom .cateringBloomFlower {
          animation: cateringProgressFlowerGrow 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
          height: 0.96rem;
          transform: scale(0.42);
          transform-origin: center center;
          width: 0.96rem;
        }

        .cateringProgressBloom .cateringBloomStem {
          animation: cateringProgressStemGrow 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
          height: 0.14rem;
          margin-top: -0.02rem;
          width: 2px;
        }

        .cookieSheepBodyImage {
          transform: scale(1.04);
          transform-origin: center center;
          transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }

        .cateringFlavorCard:hover .cookieSheepBodyImage,
        .cateringFlavorCard:focus-within .cookieSheepBodyImage {
          transform: scale(1.18);
        }

        .cookieSheepBurstPart {
          opacity: 1;
          transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          transition:
            transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 260ms ease-out;
          will-change: transform, opacity;
        }

        .cateringFlavorCard:hover .cookieSheepBurstPart,
        .cateringFlavorCard:focus-within .cookieSheepBurstPart {
          opacity: 0;
          transform: translate3d(var(--sheep-burst-x, 0), var(--sheep-burst-y, 0), 0)
            rotate(var(--sheep-burst-rotate, 0deg))
            scale(var(--sheep-burst-scale, 0.72));
        }

        @keyframes cateringGardenStemGrow {
          0%,
          100% {
            height: var(--garden-stem-min, 0.9rem);
          }

          50% {
            height: var(--garden-stem-max, 1.4rem);
          }
        }

        @keyframes cateringProgressStemGrow {
          0% {
            height: 0.14rem;
          }

          68% {
            height: 1rem;
          }

          100% {
            height: 0.78rem;
          }
        }

        @keyframes cateringProgressFlowerGrow {
          0% {
            transform: scale(0.36);
          }

          74% {
            transform: scale(1.08);
          }

          100% {
            transform: scale(0.94);
          }
        }

        @keyframes cateringCloudBob {
          0% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(0, -0.38rem, 0);
          }

          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes cateringFlavorCloudDrift {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(0.9rem, -0.32rem, 0);
          }
        }

        @keyframes cateringFlowerLife {
          0%,
          100% {
            transform:
              translateX(-50%)
              translateY(0)
              rotate(calc(var(--flower-tilt, 2deg) * -1))
              scale(var(--flower-scale, 1));
          }

          50% {
            transform:
              translateX(-50%)
              translateY(calc(var(--flower-bob, 0.14rem) * -1))
              rotate(var(--flower-tilt, 2deg))
              scale(var(--flower-scale, 1));
          }
        }

        @keyframes cateringSpriteGrow {
          0% {
            opacity: 0;
            transform: scale(0.28);
          }

          72% {
            opacity: 1;
            transform: scale(1.08);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (min-width: 960px) {
          .cateringFlavorRailItem {
            flex-basis: 18rem;
          }
        }

        @media (max-width: 767px) {
          .cateringPriceBlock {
            min-width: 0;
          }

          .cateringHeroBand {
            --catering-hero-meadow-height: 7.4rem;
          }

          .cateringHeroMeadow {
            height: var(--catering-hero-meadow-height);
          }

          .cateringHeroLineFlower {
            width: 1.74rem;
          }

          .cateringHeroLineWildflower {
            width: 1.12rem;
          }

          .cateringPersuasionPanel {
            padding-inline: 1rem;
          }

          .cateringPersuasionFlower {
            width: 2.05rem;
          }

          .cateringPersuasionWildflower {
            width: 1.28rem;
          }

          .cateringPixelSheep {
            height: 4.45rem;
            width: 6rem;
          }

          .cateringRowTrigger > svg {
            height: 2.8rem;
            margin-top: 0.1rem;
            width: 2.8rem;
          }

          .cateringFlavorRail {
            padding-bottom: 0.85rem;
          }

          .cateringFlavorRailItem {
            flex-basis: min(84vw, 17rem);
          }

          .cateringPortionInline {
            font-size: 0.76rem;
          }
        }
      `}</style>
    </div>
  )
}
