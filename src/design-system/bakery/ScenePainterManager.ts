import type { CSSProperties } from 'react'

import type { BakeryCSSVars } from './tokens'
import { getBakeryColorVar, type BakeryColorRole } from './styleProps'

export type SceneAssetLayer = 'background' | 'content' | 'foreground' | 'overlay'
export type SceneAssetMotion = 'drift' | 'gentleBob' | 'none'

const layerStyleByLayer: Record<SceneAssetLayer, CSSProperties> = {
  background: {
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 0,
  },
  content: {
    position: 'relative',
    zIndex: 3,
  },
  foreground: {
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 5,
  },
  overlay: {
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 8,
  },
}

const motionStyleByMotion: Record<SceneAssetMotion, CSSProperties> = {
  drift: {
    animationDuration: 'var(--bakery-motion-cloudDrift)',
    animationTimingFunction: 'ease-in-out',
    willChange: 'transform',
  },
  gentleBob: {
    animationDuration: 'var(--scene-flower-bob-duration)',
    animationTimingFunction: 'ease-in-out',
    transformOrigin: 'center bottom',
    willChange: 'transform',
  },
  none: {},
}

export const ScenePainterManager = {
  getLayerStyle(layer: SceneAssetLayer = 'content') {
    return layerStyleByLayer[layer]
  },

  getMaskPaintStyle(asset: string, colorRole: BakeryColorRole = 'sceneFlowerPetal') {
    return {
      backgroundColor: getBakeryColorVar(colorRole),
      maskImage: `url(${asset})`,
      maskPosition: 'center',
      maskRepeat: 'no-repeat',
      maskSize: 'contain',
      WebkitMaskImage: `url(${asset})`,
      WebkitMaskPosition: 'center',
      WebkitMaskRepeat: 'no-repeat',
      WebkitMaskSize: 'contain',
    } satisfies CSSProperties
  },

  getMotionStyle(motion: SceneAssetMotion = 'none') {
    return motionStyleByMotion[motion]
  },

  getPaintVars({
    centerRole = 'sceneFlowerCenter',
    glowRole = 'sceneFlowerGlow',
    petalRole = 'sceneFlowerPetal',
  }: {
    centerRole?: BakeryColorRole
    glowRole?: BakeryColorRole
    petalRole?: BakeryColorRole
  } = {}) {
    return {
      '--scene-asset-center': getBakeryColorVar(centerRole),
      '--scene-asset-glow': getBakeryColorVar(glowRole),
      '--scene-asset-petal': getBakeryColorVar(petalRole),
    } satisfies BakeryCSSVars
  },
}
