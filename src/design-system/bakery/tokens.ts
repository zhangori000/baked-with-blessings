import type { CSSProperties } from 'react'

import {
  menuHeroCloudsByScene,
  menuHeroMeadowByScene,
  menuHeroMobileMeadowByScene,
  menuHeroMobileSkyByScene,
  menuHeroSkyByScene,
  menuHeroFlowerSeamByScene,
  menuSceneButtonAuraByScene,
  menuSpawnedAccentSourcesByScene,
  type SceneTone,
} from '@/components/scenery/menuHeroScenery'
import {
  defaultMenuScene,
  menuSceneLoadingTokens,
} from '@/components/scenery/menuSceneLoadingTokens'

export type BakeryColorScheme = 'dark' | 'light'

export type BakeryCSSVars = CSSProperties & Record<`--${string}`, string | number | undefined>

export const bakeryPrimitiveTokens = {
  color: {
    cream50: '#fffaf0',
    cream100: '#fff8e6',
    cream200: '#f7ead2',
    cocoa700: '#4b3b24',
    cocoa900: '#2f2414',
    skyBlue: '#d8ecfb',
    nightBlue: '#020e2f',
    grassSunlit: '#cfd015',
    grassShadow: '#0e1700',
    flowerPetalEmber: '#e84a03',
    flowerCenterEmber: '#7a2100',
    flowerPetalPlum: '#42222d',
    flowerCenterPlum: '#221c02',
    flowerPetalGolden: '#ba991d',
    flowerCenterDeepGreen: '#060f00',
    flowerPetalPoppy: '#dc2742',
    flowerCenterOlive: '#656600',
    moonlitFlowerBack: '#5a2ab4',
    moonlitFlowerSide: '#7a3ad4',
    moonlitFlowerFront: '#9a5af0',
    moonlitFlowerCenter: '#2a0a5a',
    moonlitFlowerGlow: '#d4a8ff',
    blossomPetal: '#ff9fcb',
    blossomPetalSoft: '#ffd3e5',
    sunYellow: '#e6c439',
  },
  motion: {
    cloudDrift: '18s',
    flowerBob: '4.6s',
    normal: '220ms',
    panelShutter: '180ms',
    quick: '150ms',
    sceneryTransition: '420ms',
    slow: '650ms',
  },
  radius: {
    cloud: '999px',
    lg: '1.35rem',
    md: '0.85rem',
    none: '0',
    pill: '999px',
    sm: '0.45rem',
    xl: '2rem',
  },
  shadow: {
    innerPressed: 'inset 0 2px 8px rgba(47, 36, 20, 0.16)',
    moonGlow: '0 0 28px rgba(212, 168, 255, 0.32)',
    none: 'none',
    panelFloat: '0 24px 60px rgba(87, 44, 13, 0.18)',
    raisedSoft: '0 10px 24px rgba(5, 12, 5, 0.12)',
    surfaceInset: 'inset 0 1px 0 rgba(255, 255, 255, 0.22)',
  },
  space: {
    '0': '0',
    '0.5': '0.125rem',
    '1': '0.25rem',
    '2': '0.5rem',
    '3': '0.75rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '8': '2rem',
    '10': '2.5rem',
    '12': '3rem',
    '16': '4rem',
  },
  zIndex: {
    background: 0,
    content: 3,
    foreground: 5,
    overlay: 8,
  },
} as const

export type BakeryPrimitiveTokens = typeof bakeryPrimitiveTokens
export type BakeryRadiusToken = keyof BakeryPrimitiveTokens['radius']
export type BakeryShadowToken = keyof BakeryPrimitiveTokens['shadow']
export type BakerySpaceToken = keyof BakeryPrimitiveTokens['space']

export type BakerySemanticColorTokens = {
  actionBg: string
  actionFg: string
  bg: string
  bgPrimary: string
  bgSecondary: string
  border: string
  fg: string
  fgMuted: string
  panelBorder: string
  panelFill: string
}

export type BakerySceneTheme = {
  assets: {
    cloudSources: readonly string[]
    meadowSrc: string
    mobileMeadowSrc?: string
    mobileSkySrc?: string
    skySrc: string
    spawnableAccents: readonly string[]
  }
  color: {
    actionAura: string
    background: string
    flowerCenter: string
    flowerGlow: string
    flowerPetal: string
    footerBg: string
    footerBorder: string
    footerFg: string
    footerLinkBg: string
    footerMuted: string
    footerPanelBg: string
    heroMuted: string
    heroText: string
    heroTitle: string
    meadow: string
    meadowShadow: string
    mutedText: string
    panelBorder: string
    panelFill: string
    text: string
  }
  id: SceneTone
  label: string
  layout: {
    contentInset: string
    flowerRailHeight: string
    flowerSeam: string
    heroCopyMaxWidth: string
    meadowHeight: string
    panelMinHeight: string
  }
  motion: {
    cloudDrift: string
    decorativeBob: string
    sceneryTransition: string
  }
}

export type BakeryComponentTokens = {
  decorativeFlower: {
    meadow: {
      center: keyof BakerySceneTheme['color']
      petal: keyof BakerySceneTheme['color']
    }
    nav: {
      center: keyof BakerySceneTheme['color']
      petal: keyof BakerySceneTheme['color']
    }
  }
  footerSurface: {
    background: keyof BakerySceneTheme['color']
    border: keyof BakerySceneTheme['color']
    foreground: keyof BakerySceneTheme['color']
    linkBackground: keyof BakerySceneTheme['color']
    muted: keyof BakerySceneTheme['color']
  }
  sceneButton: {
    ghost: {
      background: keyof BakerySemanticColorTokens
      foreground: keyof BakerySemanticColorTokens
    }
    primary: {
      background: keyof BakerySemanticColorTokens
      foreground: keyof BakerySemanticColorTokens
    }
  }
}

export type BakeryThemeConfig = {
  component: BakeryComponentTokens
  darkColor: BakerySemanticColorTokens
  id: string
  lightColor: BakerySemanticColorTokens
  primitive: BakeryPrimitiveTokens
  scenes: Record<SceneTone, BakerySceneTheme>
}

export type BakeryTheme = BakeryThemeConfig & {
  activeColorScheme: BakeryColorScheme
  activeScene: SceneTone
  color: BakerySemanticColorTokens
  scene: BakerySceneTheme
}

export const bakeryLightColorTokens: BakerySemanticColorTokens = {
  actionBg: bakeryPrimitiveTokens.color.cocoa900,
  actionFg: '#ffffff',
  bg: bakeryPrimitiveTokens.color.skyBlue,
  bgPrimary: bakeryPrimitiveTokens.color.cream50,
  bgSecondary: bakeryPrimitiveTokens.color.cream100,
  border: 'rgba(47, 36, 20, 0.16)',
  fg: '#1f2f20',
  fgMuted: 'rgba(31, 47, 32, 0.72)',
  panelBorder: 'rgba(47, 36, 20, 0.12)',
  panelFill: 'rgba(255, 252, 244, 0.88)',
}

export const bakeryDarkColorTokens: BakerySemanticColorTokens = {
  actionBg: bakeryPrimitiveTokens.color.sunYellow,
  actionFg: bakeryPrimitiveTokens.color.nightBlue,
  bg: bakeryPrimitiveTokens.color.nightBlue,
  bgPrimary: '#111c3f',
  bgSecondary: '#17264b',
  border: 'rgba(248, 241, 200, 0.24)',
  fg: 'rgba(255, 250, 236, 0.96)',
  fgMuted: 'rgba(255, 250, 236, 0.72)',
  panelBorder: 'rgba(248, 241, 200, 0.18)',
  panelFill: 'rgba(18, 28, 65, 0.86)',
}

const sceneLabelByTone: Record<SceneTone, string> = {
  blossom: 'Blossom',
  classic: 'Classic',
  dawn: 'Dawn',
  'fairy-castle': 'Fairy Castle',
  moonlit: 'Moonlit',
  'under-tree': 'Under Tree',
}

const sceneColorByTone: Record<
  SceneTone,
  Omit<BakerySceneTheme['color'], 'actionAura' | 'background'>
> = {
  blossom: {
    flowerCenter: bakeryPrimitiveTokens.color.flowerCenterPlum,
    flowerGlow: 'rgba(255, 211, 229, 0.52)',
    flowerPetal: bakeryPrimitiveTokens.color.blossomPetal,
    footerBg: '#f7edf2',
    footerBorder: 'rgba(81, 48, 71, 0.16)',
    footerFg: '#513047',
    footerLinkBg: 'rgba(255, 250, 252, 0.58)',
    footerMuted: 'rgba(81, 48, 71, 0.72)',
    footerPanelBg: 'rgba(255, 250, 252, 0.24)',
    heroMuted: 'rgba(113, 50, 79, 0.8)',
    heroText: '#513047',
    heroTitle: '#71324f',
    meadow: '#9ac96c',
    meadowShadow: '#4e6f35',
    mutedText: 'rgba(81, 48, 71, 0.74)',
    panelBorder: 'rgba(81, 48, 71, 0.14)',
    panelFill: 'rgba(255, 250, 252, 0.9)',
    text: '#513047',
  },
  classic: {
    flowerCenter: bakeryPrimitiveTokens.color.flowerCenterOlive,
    flowerGlow: 'rgba(230, 196, 57, 0.34)',
    flowerPetal: bakeryPrimitiveTokens.color.flowerPetalGolden,
    footerBg: '#fff8f2',
    footerBorder: 'rgba(31, 47, 32, 0.16)',
    footerFg: '#1f2f20',
    footerLinkBg: 'rgba(255, 252, 244, 0.56)',
    footerMuted: 'rgba(31, 47, 32, 0.72)',
    footerPanelBg: 'rgba(255, 252, 244, 0.2)',
    heroMuted: 'rgba(32, 57, 31, 0.78)',
    heroText: '#172415',
    heroTitle: '#20391f',
    meadow: '#94ac31',
    meadowShadow: '#435c25',
    mutedText: 'rgba(23, 52, 31, 0.68)',
    panelBorder: 'rgba(31, 47, 32, 0.12)',
    panelFill: 'rgba(255, 253, 246, 0.9)',
    text: '#172415',
  },
  dawn: {
    flowerCenter: bakeryPrimitiveTokens.color.flowerCenterEmber,
    flowerGlow: 'rgba(230, 196, 57, 0.42)',
    flowerPetal: bakeryPrimitiveTokens.color.flowerPetalEmber,
    footerBg: '#fbefe0',
    footerBorder: 'rgba(62, 68, 20, 0.16)',
    footerFg: '#3e4414',
    footerLinkBg: 'rgba(255, 248, 231, 0.56)',
    footerMuted: 'rgba(62, 68, 20, 0.74)',
    footerPanelBg: 'rgba(255, 248, 231, 0.22)',
    heroMuted: 'rgba(91, 66, 23, 0.8)',
    heroText: '#3e4414',
    heroTitle: '#5b4217',
    meadow: bakeryPrimitiveTokens.color.grassSunlit,
    meadowShadow: bakeryPrimitiveTokens.color.grassShadow,
    mutedText: 'rgba(62, 68, 20, 0.76)',
    panelBorder: 'rgba(62, 68, 20, 0.14)',
    panelFill: 'rgba(255, 248, 231, 0.9)',
    text: '#3e4414',
  },
  'fairy-castle': {
    flowerCenter: bakeryPrimitiveTokens.color.flowerCenterDeepGreen,
    flowerGlow: 'rgba(255, 211, 117, 0.42)',
    flowerPetal: bakeryPrimitiveTokens.color.flowerPetalGolden,
    footerBg: '#dce2d7',
    footerBorder: 'rgba(41, 57, 35, 0.17)',
    footerFg: '#293923',
    footerLinkBg: 'rgba(250, 246, 226, 0.58)',
    footerMuted: 'rgba(41, 57, 35, 0.72)',
    footerPanelBg: 'rgba(250, 246, 226, 0.2)',
    heroMuted: '#1f2a19',
    heroText: '#11170f',
    heroTitle: '#10150d',
    meadow: '#98ae7e',
    meadowShadow: '#4d6843',
    mutedText: 'rgba(41, 57, 35, 0.72)',
    panelBorder: 'rgba(41, 57, 35, 0.16)',
    panelFill: 'rgba(250, 246, 226, 0.9)',
    text: '#293923',
  },
  moonlit: {
    flowerCenter: bakeryPrimitiveTokens.color.moonlitFlowerCenter,
    flowerGlow: 'rgba(212, 168, 255, 0.42)',
    flowerPetal: bakeryPrimitiveTokens.color.moonlitFlowerFront,
    footerBg: '#17264b',
    footerBorder: 'rgba(248, 241, 200, 0.2)',
    footerFg: 'rgba(248, 242, 214, 0.94)',
    footerLinkBg: 'rgba(248, 241, 200, 0.16)',
    footerMuted: 'rgba(248, 242, 214, 0.72)',
    footerPanelBg: 'rgba(16, 27, 66, 0.28)',
    heroMuted: 'rgba(243, 235, 255, 0.82)',
    heroText: '#eef6ff',
    heroTitle: '#eef6ff',
    meadow: '#2a4a3a',
    meadowShadow: '#0a2030',
    mutedText: 'rgba(243, 235, 255, 0.76)',
    panelBorder: 'rgba(243, 235, 255, 0.18)',
    panelFill: 'rgba(23, 38, 75, 0.82)',
    text: 'rgba(248, 242, 214, 0.94)',
  },
  'under-tree': {
    flowerCenter: bakeryPrimitiveTokens.color.flowerCenterDeepGreen,
    flowerGlow: 'rgba(197, 228, 142, 0.38)',
    flowerPetal: bakeryPrimitiveTokens.color.flowerPetalGolden,
    footerBg: '#e7f0d8',
    footerBorder: 'rgba(49, 69, 28, 0.16)',
    footerFg: '#31451c',
    footerLinkBg: 'rgba(250, 255, 241, 0.58)',
    footerMuted: 'rgba(49, 69, 28, 0.72)',
    footerPanelBg: 'rgba(250, 255, 241, 0.22)',
    heroMuted: 'rgba(49, 69, 28, 0.78)',
    heroText: '#31451c',
    heroTitle: '#31451c',
    meadow: '#8fbc61',
    meadowShadow: '#31451c',
    mutedText: 'rgba(49, 69, 28, 0.74)',
    panelBorder: 'rgba(49, 69, 28, 0.14)',
    panelFill: 'rgba(250, 255, 241, 0.9)',
    text: '#31451c',
  },
}

const getLoadingTokens = (sceneTone: SceneTone) =>
  menuSceneLoadingTokens[sceneTone as keyof typeof menuSceneLoadingTokens] ??
  menuSceneLoadingTokens[defaultMenuScene]

const createSceneTheme = (sceneTone: SceneTone): BakerySceneTheme => {
  const loadingTokens = getLoadingTokens(sceneTone)
  const sceneColor = sceneColorByTone[sceneTone]

  return {
    assets: {
      cloudSources: (menuHeroCloudsByScene[sceneTone] ?? []).map((cloud) => cloud.src),
      meadowSrc: menuHeroMeadowByScene[sceneTone],
      mobileMeadowSrc: menuHeroMobileMeadowByScene[sceneTone],
      mobileSkySrc: menuHeroMobileSkyByScene[sceneTone],
      skySrc: menuHeroSkyByScene[sceneTone],
      spawnableAccents: menuSpawnedAccentSourcesByScene[sceneTone],
    },
    color: {
      ...sceneColor,
      actionAura: menuSceneButtonAuraByScene[sceneTone],
      background: loadingTokens.background,
    },
    id: sceneTone,
    label: sceneLabelByTone[sceneTone],
    layout: {
      contentInset: bakeryPrimitiveTokens.space['6'],
      flowerRailHeight: 'clamp(4.5rem, 12vw, 8rem)',
      flowerSeam: menuHeroFlowerSeamByScene[sceneTone],
      heroCopyMaxWidth: '42rem',
      meadowHeight: 'clamp(8rem, 24vw, 16rem)',
      panelMinHeight: 'clamp(28rem, 58vw, 36rem)',
    },
    motion: {
      cloudDrift: bakeryPrimitiveTokens.motion.cloudDrift,
      decorativeBob: bakeryPrimitiveTokens.motion.flowerBob,
      sceneryTransition: bakeryPrimitiveTokens.motion.sceneryTransition,
    },
  }
}

export const bakerySceneThemes: Record<SceneTone, BakerySceneTheme> = {
  blossom: createSceneTheme('blossom'),
  classic: createSceneTheme('classic'),
  dawn: createSceneTheme('dawn'),
  'fairy-castle': createSceneTheme('fairy-castle'),
  moonlit: createSceneTheme('moonlit'),
  'under-tree': createSceneTheme('under-tree'),
}

export const bakeryComponentTokens: BakeryComponentTokens = {
  decorativeFlower: {
    meadow: {
      center: 'flowerCenter',
      petal: 'flowerPetal',
    },
    nav: {
      center: 'flowerCenter',
      petal: 'flowerPetal',
    },
  },
  footerSurface: {
    background: 'footerPanelBg',
    border: 'footerBorder',
    foreground: 'footerFg',
    linkBackground: 'footerLinkBg',
    muted: 'footerMuted',
  },
  sceneButton: {
    ghost: {
      background: 'bgSecondary',
      foreground: 'fg',
    },
    primary: {
      background: 'actionBg',
      foreground: 'actionFg',
    },
  },
}

export const bakeryThemeConfig: BakeryThemeConfig = {
  component: bakeryComponentTokens,
  darkColor: bakeryDarkColorTokens,
  id: 'baked-with-blessings',
  lightColor: bakeryLightColorTokens,
  primitive: bakeryPrimitiveTokens,
  scenes: bakerySceneThemes,
}

export const createBakeryThemeApi = (
  theme: BakeryThemeConfig,
  activeColorScheme: BakeryColorScheme,
  activeScene: SceneTone,
): BakeryTheme => {
  const scene = theme.scenes[activeScene] ?? theme.scenes[defaultMenuScene]

  return {
    ...theme,
    activeColorScheme,
    activeScene: scene.id,
    color: activeColorScheme === 'dark' ? theme.darkColor : theme.lightColor,
    scene,
  }
}
