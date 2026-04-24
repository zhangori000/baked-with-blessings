'use client'

import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FlowerSprite } from '@/components/flowers/FlowerSprite'
import { GrowingGrassBorder } from '@/components/flowers/GrowingGrassBorder'
import {
  buildSeededMenuSceneAccents,
  createSpawnedMenuSceneAccent,
  getNextMenuSceneTone,
  menuCloudSpawnDesignsByScene,
  menuSceneAccentLabelByScene,
  menuSceneCloudLabelByScene,
  menuHeroCloudsByScene,
  menuHeroCrittersByScene,
  menuHeroFlowerSeamByScene,
  menuHeroFlowersByScene,
  menuHeroMeadowByScene,
  menuHeroMobileMeadowByScene,
  menuHeroMobileSkyByScene,
  menuHeroPiecesByScene,
  menuScenePriceColorByScene,
  menuScenePriceShadowByScene,
  menuHeroSkyByScene,
  menuSceneButtonAuraByScene,
  type SceneTone,
} from '@/components/scenery/menuHeroScenery'
import { usePersistentMenuSceneTone } from '@/components/scenery/usePersistentMenuSceneTone'
import type { CookiePosterAsset } from './shop/cookiePosterData'
import { CookieSheepRig } from './shop/cookie-sheep-rig'

type HomeCookieCarouselProps = {
  posters: CookiePosterAsset[]
  sceneVariant?: 'grassland' | 'scenery'
}

type CarouselTransition = {
  direction: -1 | 1
  outgoingIndex: number
} | null

type CarouselInfoPhase =
  | 'hidden'
  | 'ready'
  | 'lifting'
  | 'open'
  | 'closing'
  | 'withering'
  | 'returning'

type ShowcaseSceneCloud = {
  className?: string
  id: string
  src: string
  style: CSSProperties
}

type ShowcaseSceneFlower = {
  id: string
  src: string
  style: CSSProperties
}

type ShowcaseFlowerRailBloom = {
  id: string
  src: string
  style: CSSProperties
}

abstract class PaperOverlayPiece {
  constructor(
    readonly id: string,
    readonly style: CSSProperties,
  ) {}

  abstract render(): ReactNode
}

class CloudPaperOverlay extends PaperOverlayPiece {
  render() {
    return (
      <svg
        aria-hidden="true"
        className="homeCookiePaperLayer homeCookiePaperLayer--cloud"
        key={this.id}
        style={this.style}
        viewBox="0 0 180 96"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="homeCookiePaperCloudShape"
          d="M40 84C26.745 84 16 73.255 16 60C16 46.745 26.745 36 40 36H58V28C58 16.954 66.954 8 78 8H102C113.046 8 122 16.954 122 28V36H140C153.255 36 164 46.745 164 60C164 73.255 153.255 84 140 84H40Z"
        />
      </svg>
    )
  }
}

const JUMP_DURATION_MS = 350
const INFO_LIFT_DURATION_MS = 430
const INFO_CLOSE_DURATION_MS = 320
const INFO_GRASS_HIDE_DURATION_MS = 220
const INFO_RETURN_DURATION_MS = 280
const grassVisibleHeightRatioDesktop = Number(((375 - 246.066406) / 375).toFixed(5))
const grassVisibleHeightRatioMobile = 0.834
const grassCrestLimitRatio = 0.45
const sceneLiftPx = 22

const showcaseStyle = {
  ['--showcase-button' as string]: '#21492d',
  ['--showcase-button-shadow' as string]: 'rgba(22, 53, 31, 0.24)',
  ['--showcase-cloud-shadow' as string]: 'rgba(255, 255, 255, 0.46)',
  ['--showcase-ink' as string]: '#17341f',
  ['--showcase-sky' as string]: '#d8ecfb',
  ['--showcase-stamp' as string]: '#fff9ec',
  ['--control-gap' as string]: '1.1rem',
  ['--control-size' as string]: 'clamp(3.2rem, 6vw, 4.35rem)',
  ['--cookie-size' as string]: 'clamp(13rem, 26vw, 17rem)',
  ['--copy-width' as string]: 'min(92vw, 52rem)',
  ['--cta-font-size' as string]: 'clamp(1.1rem, 2.3vw, 1.6rem)',
  ['--cta-padding-x' as string]: '1.6rem',
  ['--cta-width' as string]: 'clamp(10.25rem, 21vw, 13.5rem)',
  ['--stage-min-height' as string]: 'clamp(24rem, 58vh, 40rem)',
} as CSSProperties

const paperCloudOverlays: PaperOverlayPiece[] = [
  new CloudPaperOverlay('cloud-left', {
    animationDelay: '-3s',
    animationDuration: '20s',
    left: '7%',
    opacity: 0.88,
    top: '12%',
    width: 'clamp(4.5rem, 11vw, 7rem)',
  }),
  new CloudPaperOverlay('cloud-top', {
    animationDelay: '-10s',
    animationDuration: '24s',
    left: '41%',
    opacity: 0.94,
    top: '10%',
    width: 'clamp(5rem, 12vw, 7.75rem)',
  }),
  new CloudPaperOverlay('cloud-right', {
    animationDelay: '-15s',
    animationDuration: '19s',
    left: '74%',
    opacity: 0.86,
    top: '18%',
    width: 'clamp(4rem, 10vw, 6.5rem)',
  }),
]

let spawnedShowcaseCloudID = 0
let spawnedShowcaseFlowerID = 0

const buildShowcaseFlowerStyle = ({
  bob,
  bottom,
  delay,
  duration,
  left,
  scale,
  tilt,
}: {
  bob: string
  bottom: string
  delay: string
  duration: string
  left: string
  scale: number
  tilt: string
}): CSSProperties =>
  ({
    ['--home-flower-bob' as string]: bob,
    ['--home-flower-delay' as string]: delay,
    ['--home-flower-duration' as string]: duration,
    ['--home-flower-scale' as string]: `${scale}`,
    ['--home-flower-tilt' as string]: tilt,
    bottom,
    left,
  }) as CSSProperties

const buildShowcaseFlowerStyleFromSeed = (key: string, left: string, scale: number): CSSProperties => {
  const seed = Array.from(key).reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    0,
  )
  const bob = 0.12 + (seed % 7) * 0.02
  const tilt = 1.5 + (seed % 5) * 0.55
  const duration = 4 + (seed % 6) * 0.22
  const delay = (seed % 8) * -0.34

  return buildShowcaseFlowerStyle({
    bob: `${bob.toFixed(2)}rem`,
    bottom: '0%',
    delay: `${delay.toFixed(2)}s`,
    duration: `${duration.toFixed(2)}s`,
    left,
    scale,
    tilt: `${tilt.toFixed(2)}deg`,
  })
}

const buildSeededShowcaseFlowers = (sceneTone: SceneTone = 'classic'): ShowcaseSceneFlower[] => {
  return buildSeededMenuSceneAccents(sceneTone).map((accent) => ({
    id: `seed-${sceneTone}-${accent.id}`,
    src: accent.asset,
    style: buildShowcaseFlowerStyleFromSeed(`hero-spawn-${accent.id}`, accent.left, accent.scale),
  }))
}

const buildShowcaseFlowerRail = (sceneTone: SceneTone): ShowcaseFlowerRailBloom[] => {
  const flowers = menuHeroFlowersByScene[sceneTone] ?? menuHeroFlowersByScene.classic

  return flowers.map((flower, index) => ({
    id: `rail-${sceneTone}-${index}`,
    src: flower.asset,
    style: {
      left: flower.left,
      transform: `translateX(-50%) scale(${flower.scale})`,
    },
  }))
}

const buildStaticShowcaseClouds = (sceneTone: SceneTone): ShowcaseSceneCloud[] => {
  const clouds = menuHeroCloudsByScene[sceneTone] ?? menuHeroCloudsByScene.classic

  return clouds.map((cloud, index) => ({
    className: cloud.className,
    id: `static-cloud-${sceneTone}-${index}`,
    src: cloud.src,
    style: (cloud.style ?? {}) as CSSProperties,
  }))
}

const createShowcaseCloud = (sceneTone: SceneTone): ShowcaseSceneCloud => {
  const spawnDesigns = menuCloudSpawnDesignsByScene[sceneTone] ?? menuCloudSpawnDesignsByScene.classic
  const cloud =
    spawnDesigns[Math.floor(Math.random() * spawnDesigns.length)] ?? spawnDesigns[0] ?? null
  const left = Math.random() * 84
  const top = 5 + Math.random() * 26

  return {
    className: '',
    id: `spawned-cloud-${++spawnedShowcaseCloudID}`,
    src: cloud?.src ?? '/clouds/three-ball-cloud-wide.svg',
    style: {
      animationDelay: `-${(Math.random() * 7).toFixed(2)}s`,
      left: `${left.toFixed(2)}%`,
      top: `${top.toFixed(2)}%`,
      width: `${(
        (cloud?.minWidth ?? 10.6) +
        Math.random() * ((cloud?.maxWidth ?? 14.8) - (cloud?.minWidth ?? 10.6))
      ).toFixed(2)}rem`,
    } as CSSProperties,
  }
}

const createShowcaseFlowerForScene = (sceneTone: SceneTone): ShowcaseSceneFlower => {
  const accent = createSpawnedMenuSceneAccent(sceneTone)

  return {
    id: `spawned-flower-${++spawnedShowcaseFlowerID}-${accent.id}`,
    src: accent.asset,
    style: buildShowcaseFlowerStyleFromSeed(
      `hero-spawn-${accent.id}`,
      accent.left,
      accent.scale,
    ),
  }
}

type MeadowFlowerTone = 'orange' | 'cream' | 'plum' | 'rose' | 'gold'

type MeadowFlowerAccent = {
  id: string
  tone: MeadowFlowerTone
  style: CSSProperties
}

const meadowFlowerAccents: MeadowFlowerAccent[] = [
  {
    id: 'meadow-flower-1',
    tone: 'orange',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(1.05rem, 2.5vw, 1.45rem)',
      bottom: '11%',
      left: '3%',
      opacity: 0.94,
      transform: 'rotate(-10deg)',
    },
  },
  {
    id: 'meadow-flower-2',
    tone: 'cream',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(0.92rem, 2.1vw, 1.28rem)',
      bottom: '26%',
      left: '8%',
      opacity: 0.88,
      transform: 'rotate(12deg)',
    },
  },
  {
    id: 'meadow-flower-3',
    tone: 'rose',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(1.1rem, 2.65vw, 1.5rem)',
      bottom: '17%',
      left: '16%',
      opacity: 0.92,
      transform: 'rotate(-4deg)',
    },
  },
  {
    id: 'meadow-flower-4',
    tone: 'gold',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(0.88rem, 2vw, 1.2rem)',
      bottom: '33%',
      left: '21%',
      opacity: 0.86,
      transform: 'rotate(7deg)',
    },
  },
  {
    id: 'meadow-flower-5',
    tone: 'plum',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(1rem, 2.35vw, 1.4rem)',
      bottom: '13%',
      left: '31%',
      opacity: 0.9,
      transform: 'rotate(-9deg)',
    },
  },
  {
    id: 'meadow-flower-6',
    tone: 'orange',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(0.95rem, 2.2vw, 1.3rem)',
      bottom: '29%',
      left: '37%',
      opacity: 0.91,
      transform: 'rotate(3deg)',
    },
  },
  {
    id: 'meadow-flower-7',
    tone: 'rose',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(1.08rem, 2.5vw, 1.46rem)',
      bottom: '22%',
      left: '47%',
      opacity: 0.93,
      transform: 'rotate(-13deg)',
    },
  },
  {
    id: 'meadow-flower-8',
    tone: 'cream',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(0.9rem, 2.05vw, 1.22rem)',
      bottom: '9%',
      left: '54%',
      opacity: 0.87,
      transform: 'rotate(6deg)',
    },
  },
  {
    id: 'meadow-flower-9',
    tone: 'gold',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(1.12rem, 2.6vw, 1.52rem)',
      bottom: '31%',
      left: '59%',
      opacity: 0.89,
      transform: 'rotate(-7deg)',
    },
  },
  {
    id: 'meadow-flower-10',
    tone: 'plum',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(0.96rem, 2.25vw, 1.34rem)',
      bottom: '15%',
      opacity: 0.92,
      right: '33%',
      transform: 'rotate(11deg)',
    },
  },
  {
    id: 'meadow-flower-11',
    tone: 'orange',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(1rem, 2.3vw, 1.38rem)',
      bottom: '27%',
      opacity: 0.86,
      right: '26%',
      transform: 'rotate(-5deg)',
    },
  },
  {
    id: 'meadow-flower-12',
    tone: 'rose',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(0.94rem, 2.15vw, 1.26rem)',
      bottom: '10%',
      opacity: 0.9,
      right: '19%',
      transform: 'rotate(8deg)',
    },
  },
  {
    id: 'meadow-flower-13',
    tone: 'gold',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(1.06rem, 2.45vw, 1.44rem)',
      bottom: '34%',
      opacity: 0.88,
      right: '14%',
      transform: 'rotate(-12deg)',
    },
  },
  {
    id: 'meadow-flower-14',
    tone: 'cream',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(1.1rem, 2.55vw, 1.48rem)',
      bottom: '19%',
      opacity: 0.94,
      right: '8%',
      transform: 'rotate(4deg)',
    },
  },
  {
    id: 'meadow-flower-15',
    tone: 'plum',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(0.88rem, 2vw, 1.18rem)',
      bottom: '25%',
      opacity: 0.85,
      right: '2%',
      transform: 'rotate(-8deg)',
    },
  },
  {
    id: 'meadow-flower-16',
    tone: 'rose',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(0.92rem, 2.1vw, 1.24rem)',
      bottom: '8%',
      opacity: 0.9,
      right: '39%',
      transform: 'rotate(14deg)',
    },
  },
  {
    id: 'meadow-flower-17',
    tone: 'orange',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(1rem, 2.3vw, 1.35rem)',
      bottom: '21%',
      left: '42%',
      opacity: 0.87,
      transform: 'rotate(-3deg)',
    },
  },
  {
    id: 'meadow-flower-18',
    tone: 'cream',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(0.95rem, 2.15vw, 1.28rem)',
      bottom: '36%',
      left: '12%',
      opacity: 0.91,
      transform: 'rotate(9deg)',
    },
  },
  {
    id: 'meadow-flower-19',
    tone: 'gold',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(1.08rem, 2.5vw, 1.48rem)',
      bottom: '14%',
      right: '46%',
      opacity: 0.89,
      transform: 'rotate(-6deg)',
    },
  },
  {
    id: 'meadow-flower-20',
    tone: 'plum',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(1rem, 2.3vw, 1.4rem)',
      bottom: '28%',
      right: '31%',
      opacity: 0.92,
      transform: 'rotate(11deg)',
    },
  },
  {
    id: 'meadow-flower-21',
    tone: 'cream',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(0.98rem, 2.25vw, 1.34rem)',
      display: 'none',
      opacity: 0.9,
      transform: 'rotate(-7deg)',
    },
  },
  {
    id: 'meadow-flower-22',
    tone: 'gold',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(1.02rem, 2.35vw, 1.4rem)',
      display: 'none',
      opacity: 0.88,
      transform: 'rotate(10deg)',
    },
  },
  {
    id: 'meadow-flower-23',
    tone: 'rose',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(0.94rem, 2.2vw, 1.28rem)',
      display: 'none',
      opacity: 0.9,
      transform: 'rotate(-4deg)',
    },
  },
  {
    id: 'meadow-flower-24',
    tone: 'orange',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(1rem, 2.3vw, 1.36rem)',
      display: 'none',
      opacity: 0.92,
      transform: 'rotate(8deg)',
    },
  },
  {
    id: 'meadow-flower-25',
    tone: 'plum',
    style: {
      ['--meadow-flower-size' as string]: 'clamp(0.92rem, 2.1vw, 1.24rem)',
      display: 'none',
      opacity: 0.88,
      transform: 'rotate(-11deg)',
    },
  },
]

const wrapIndex = (index: number, length: number) => (index + length) % length

export function HomeCookieCarousel({
  posters,
  sceneVariant = 'grassland',
}: HomeCookieCarouselProps) {
  const { addItem, isLoading: cartIsLoading } = useCart()
  const [activeIndex, setActiveIndex] = useState(0)
  const [cartPromptState, setCartPromptState] = useState<{
    phase: 'added' | 'idle' | 'loading' | 'open'
    slug: string | null
  }>({
    phase: 'idle',
    slug: null,
  })
  const [cookieCenterPx, setCookieCenterPx] = useState<number | null>(null)
  const [grassDropPx, setGrassDropPx] = useState(0)
  const [sceneTone, setSceneTone] = usePersistentMenuSceneTone('classic')
  const [spawnedSceneClouds, setSpawnedSceneClouds] = useState<ShowcaseSceneCloud[]>([])
  const [spawnedSceneFlowers, setSpawnedSceneFlowers] = useState<ShowcaseSceneFlower[]>([])
  const [transition, setTransition] = useState<CarouselTransition>(null)
  const [infoPhase, setInfoPhase] = useState<CarouselInfoPhase>('hidden')
  const [nameButtonWidth, setNameButtonWidth] = useState<number | null>(null)

  const activeIndexRef = useRef(0)
  const addedStateTimeoutRef = useRef<number | null>(null)
  const infoLiftTimeoutRef = useRef<number | null>(null)
  const infoReadyTimeoutRef = useRef<number | null>(null)
  const isTransitioningRef = useRef(false)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const pendingDirectionRef = useRef<-1 | 1 | null>(null)
  const rigShellRef = useRef<HTMLDivElement | null>(null)
  const sceneFrameRef = useRef<HTMLDivElement | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (addedStateTimeoutRef.current != null) {
        window.clearTimeout(addedStateTimeoutRef.current)
      }
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current)
      }
      if (infoLiftTimeoutRef.current != null) {
        window.clearTimeout(infoLiftTimeoutRef.current)
      }
      if (infoReadyTimeoutRef.current != null) {
        window.clearTimeout(infoReadyTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    if (sceneVariant !== 'scenery') {
      return
    }

    setSpawnedSceneClouds([])
    setSpawnedSceneFlowers(buildSeededShowcaseFlowers(sceneTone))
  }, [sceneTone, sceneVariant])

  useEffect(() => {
    if (addedStateTimeoutRef.current != null) {
      window.clearTimeout(addedStateTimeoutRef.current)
      addedStateTimeoutRef.current = null
    }

    setCartPromptState({
      phase: 'idle',
      slug: null,
    })

    if (infoReadyTimeoutRef.current != null) {
      window.clearTimeout(infoReadyTimeoutRef.current)
      infoReadyTimeoutRef.current = null
    }
    if (infoLiftTimeoutRef.current != null) {
      window.clearTimeout(infoLiftTimeoutRef.current)
      infoLiftTimeoutRef.current = null
    }

    setInfoPhase('hidden')

    if (transition) {
      return
    }

    infoReadyTimeoutRef.current = window.setTimeout(() => {
      setInfoPhase('ready')
      infoReadyTimeoutRef.current = null
    }, 220)
  }, [activeIndex, transition])

  useEffect(() => {
    const el = measureRef.current
    if (!el) return

    let maxWidth = 0
    const spans = el.querySelectorAll('span')
    for (const span of spans) {
      maxWidth = Math.max(maxWidth, (span as HTMLElement).offsetWidth)
    }

    if (maxWidth > 0) {
      setNameButtonWidth(maxWidth)
    }
  }, [posters])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const updateSceneMetrics = () => {
      const sceneHeight = sceneFrameRef.current?.clientHeight ?? 0
      const viewportWidth = window.innerWidth
      const rigSize = rigShellRef.current?.clientWidth ?? 0

      if (!sceneHeight || !viewportWidth) {
        setCookieCenterPx(null)
        setGrassDropPx(0)
        return
      }

      if (!rigSize) {
        setCookieCenterPx(null)
        return
      }

      if (sceneVariant === 'scenery') {
        setGrassDropPx(0)
        const centerRatio =
          viewportWidth < 640 ? 0.52 : viewportWidth < 900 ? 0.58 : viewportWidth < 1280 ? 0.595 : 0.605
        setCookieCenterPx(sceneHeight * centerRatio)
        return
      }

      const grassVisibleHeightRatio =
        viewportWidth < 640 ? grassVisibleHeightRatioMobile : grassVisibleHeightRatioDesktop
      const grassCrestHeightPx = viewportWidth * grassVisibleHeightRatio
      const allowedCrestHeightPx = sceneHeight * grassCrestLimitRatio
      const visibleGrassHeightPx = Math.min(grassCrestHeightPx, allowedCrestHeightPx)
      const crestTopPx = sceneHeight - visibleGrassHeightPx
      const overlapRatio =
        viewportWidth < 640 ? 0.04 : viewportWidth < 900 ? 0.27 : viewportWidth < 1280 ? 0.25 : 0.24

      setGrassDropPx(Math.max(0, grassCrestHeightPx - allowedCrestHeightPx))
      setCookieCenterPx(crestTopPx - rigSize * (0.5 - overlapRatio))
    }

    updateSceneMetrics()

    let resizeObserver: ResizeObserver | null = null

    if (typeof ResizeObserver !== 'undefined' && sceneFrameRef.current) {
      resizeObserver = new ResizeObserver(updateSceneMetrics)
      resizeObserver.observe(sceneFrameRef.current)
    }

    if (typeof ResizeObserver !== 'undefined' && rigShellRef.current) {
      resizeObserver ??= new ResizeObserver(updateSceneMetrics)
      resizeObserver.observe(rigShellRef.current)
    }

    window.addEventListener('resize', updateSceneMetrics)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateSceneMetrics)
    }
  }, [sceneVariant])

  if (!posters.length) {
    return null
  }

  const activePoster = posters[activeIndex]
  const outgoingPoster = transition ? posters[transition.outgoingIndex] : null
  const transitionVariant = transition?.direction === 1 ? 'next' : 'prev'
  const rigTop = cookieCenterPx != null ? `${cookieCenterPx}px` : `calc(54% - ${sceneLiftPx}px)`
  const hasMultiplePosters = posters.length > 1
  const staticSceneClouds = sceneVariant === 'scenery' ? buildStaticShowcaseClouds(sceneTone) : []
  const staticScenePieces =
    sceneVariant === 'scenery' ? (menuHeroPiecesByScene[sceneTone] ?? menuHeroPiecesByScene.classic) : []
  const staticSceneCritters =
    sceneVariant === 'scenery'
      ? (menuHeroCrittersByScene[sceneTone] ?? menuHeroCrittersByScene.classic)
      : []
  const sectionStyle =
    sceneVariant === 'scenery'
      ? ({
          ...showcaseStyle,
          ['--home-flower-seam' as string]: menuHeroFlowerSeamByScene[sceneTone],
          ['--home-body-lift' as string]: '0.95rem',
          ['--home-body-rotate' as string]: '-4deg',
          ['--home-info-lift' as string]: 'calc(var(--cookie-size) * 0.58)',
          ['--home-info-shift-x' as string]: '0rem',
          ['--home-info-rotate-mid' as string]: '-6deg',
          ['--home-info-rotate-end' as string]: '-2deg',
          ['--home-scene-charge' as string]: menuSceneButtonAuraByScene[sceneTone],
          ['--home-price-color' as string]: menuScenePriceColorByScene[sceneTone],
          ['--home-price-shadow' as string]: menuScenePriceShadowByScene[sceneTone],
        } as CSSProperties)
      : showcaseStyle

  const isActivePosterPromptState = cartPromptState.slug === activePoster.slug
  const activePosterPromptPhase = isActivePosterPromptState ? cartPromptState.phase : 'idle'
  const activePosterCanAddToCart = typeof activePoster.productId === 'number'
  const isCartPromptOpen =
    activePosterPromptPhase === 'open' ||
    activePosterPromptPhase === 'loading' ||
    activePosterPromptPhase === 'added'

  const finishTransition = () => {
    setTransition(null)
    isTransitioningRef.current = false
    timeoutRef.current = null

    const queuedDirection = pendingDirectionRef.current

    if (queuedDirection == null) {
      return
    }

    pendingDirectionRef.current = null

    window.requestAnimationFrame(() => {
      const currentIndex = activeIndexRef.current
      const nextIndex = wrapIndex(currentIndex + queuedDirection, posters.length)

      isTransitioningRef.current = true
      setTransition({
        direction: queuedDirection,
        outgoingIndex: currentIndex,
      })
      activeIndexRef.current = nextIndex
      setActiveIndex(nextIndex)

      timeoutRef.current = window.setTimeout(finishTransition, JUMP_DURATION_MS)
    })
  }

  const startCloseInfo = () => {
    if (infoReadyTimeoutRef.current != null) {
      window.clearTimeout(infoReadyTimeoutRef.current)
      infoReadyTimeoutRef.current = null
    }

    if (infoLiftTimeoutRef.current != null) {
      window.clearTimeout(infoLiftTimeoutRef.current)
      infoLiftTimeoutRef.current = null
    }

    setInfoPhase('closing')
    infoReadyTimeoutRef.current = window.setTimeout(() => {
      setInfoPhase('withering')
      infoReadyTimeoutRef.current = window.setTimeout(() => {
        setInfoPhase('returning')
        infoReadyTimeoutRef.current = window.setTimeout(() => {
          setInfoPhase('ready')
          infoReadyTimeoutRef.current = null
        }, INFO_RETURN_DURATION_MS)
      }, INFO_GRASS_HIDE_DURATION_MS)
    }, INFO_CLOSE_DURATION_MS)
  }

  const handleNavigate = (direction: -1 | 1) => {
    if (!hasMultiplePosters) {
      return
    }

    if (isTransitioningRef.current) {
      pendingDirectionRef.current = direction
      return
    }

    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current)
    }

    setInfoPhase('hidden')

    const currentIndex = activeIndexRef.current
    const nextIndex = wrapIndex(currentIndex + direction, posters.length)

    isTransitioningRef.current = true
    setTransition({
      direction,
      outgoingIndex: currentIndex,
    })
    activeIndexRef.current = nextIndex
    setActiveIndex(nextIndex)

    timeoutRef.current = window.setTimeout(finishTransition, JUMP_DURATION_MS)
  }

  const handleOpenCartPrompt = () => {
    if (!activePosterCanAddToCart) {
      toast.info('This cookie is not linked to a live product yet.')
      return
    }

    if (activePosterPromptPhase === 'loading') {
      return
    }

    if (addedStateTimeoutRef.current != null) {
      window.clearTimeout(addedStateTimeoutRef.current)
      addedStateTimeoutRef.current = null
    }

    setCartPromptState({
      phase: 'open',
      slug: activePoster.slug,
    })
  }

  const handleCloseCartPrompt = () => {
    if (activePosterPromptPhase === 'loading') {
      return
    }

    if (addedStateTimeoutRef.current != null) {
      window.clearTimeout(addedStateTimeoutRef.current)
      addedStateTimeoutRef.current = null
    }

    setCartPromptState({
      phase: 'idle',
      slug: null,
    })
  }

  const handleConfirmAddToCart = async () => {
    if (!activePosterCanAddToCart || activePosterPromptPhase === 'loading') {
      return
    }

    setCartPromptState({
      phase: 'loading',
      slug: activePoster.slug,
    })

    try {
      await addItem({
        product: activePoster.productId!,
      })

      setCartPromptState({
        phase: 'added',
        slug: activePoster.slug,
      })
      toast.success(`${activePoster.title} added to cart.`)

      if (addedStateTimeoutRef.current != null) {
        window.clearTimeout(addedStateTimeoutRef.current)
      }

      addedStateTimeoutRef.current = window.setTimeout(() => {
        setCartPromptState({
          phase: 'idle',
          slug: null,
        })
        addedStateTimeoutRef.current = null
      }, 1200)
    } catch {
      setCartPromptState({
        phase: 'open',
        slug: activePoster.slug,
      })
      toast.error('Unable to add this cookie to cart right now.')
    }
  }

  return (
    <section
      aria-label="Cookie showcase"
      aria-roledescription="carousel"
      className={`home-page-placeholder homeCookieShowcase relative left-1/2 flex w-screen -translate-x-1/2 flex-col${
        sceneVariant === 'scenery' ? ' homeCookieShowcase--scenery' : ''
      } homeCookieScene-${sceneTone}`}
      style={sectionStyle}
    >
      <div className="homeCookieBackdrop absolute inset-0" />

      {sceneVariant === 'grassland' ? (
        <div aria-hidden="true" className="homeCookiePaperStage homeCookiePaperStage--sky">
          {paperCloudOverlays.map((overlay) => overlay.render())}
        </div>
      ) : null}

      <div className="relative z-10 flex w-full flex-1 flex-col">
        <div className="homeCookieStage relative flex-1">
          <div className="homeCookieSceneFrame absolute inset-0" ref={sceneFrameRef}>
            {sceneVariant === 'scenery' ? (
              <>
                <picture className="homeCookieSceneSky">
                  {menuHeroMobileSkyByScene[sceneTone] ? (
                    <source media="(max-width: 767px)" srcSet={menuHeroMobileSkyByScene[sceneTone]} />
                  ) : null}
                  <img
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                    draggable="false"
                    loading="eager"
                    src={menuHeroSkyByScene[sceneTone]}
                  />
                </picture>

                {staticSceneClouds.map((cloud) => (
                  <img
                    alt=""
                    aria-hidden="true"
                    className={`homeCookieSceneCloud ${cloud.className ?? ''}`}
                    draggable="false"
                    key={cloud.id}
                    loading="eager"
                    src={cloud.src}
                    style={cloud.style}
                  />
                ))}

                {spawnedSceneClouds.map((cloud) => (
                  <img
                    alt=""
                    aria-hidden="true"
                    className={`homeCookieSceneCloud ${cloud.className ?? ''}`}
                    draggable="false"
                    key={cloud.id}
                    loading="eager"
                    src={cloud.src}
                    style={cloud.style}
                  />
                ))}

                {staticScenePieces.map((piece, index) => (
                  <img
                    alt=""
                    aria-hidden="true"
                    className={`homeCookieScenePiece ${piece.className}`}
                    draggable="false"
                    key={`piece-${sceneTone}-${index}-${piece.src}`}
                    loading="eager"
                    src={piece.src}
                    style={piece.style}
                  />
                ))}

                {staticSceneCritters.map((critter, index) => (
                  <img
                    alt=""
                    aria-hidden="true"
                    className={`homeCookieScenePiece ${critter.className}`}
                    draggable="false"
                    key={`critter-${sceneTone}-${index}-${critter.src}`}
                    loading="eager"
                    src={critter.src}
                    style={critter.style}
                  />
                ))}

                <div className="homeCookieSceneActions">
                  <button
                    className="homeCookieSceneButton"
                    onClick={() => {
                      setSceneTone(getNextMenuSceneTone(sceneTone))
                    }}
                    type="button"
                  >
                    Change scenery
                  </button>
                  <button
                    className="homeCookieSceneButton"
                    onClick={() =>
                      setSpawnedSceneClouds((current) => [...current, createShowcaseCloud(sceneTone)])
                    }
                    type="button"
                  >
                    {menuSceneCloudLabelByScene[sceneTone]}
                  </button>
                  <button
                    className="homeCookieSceneButton"
                    onClick={() =>
                      setSpawnedSceneFlowers((current) => [
                        ...current,
                        createShowcaseFlowerForScene(sceneTone),
                      ])
                    }
                    type="button"
                  >
                    {menuSceneAccentLabelByScene[sceneTone]}
                  </button>
                </div>
              </>
            ) : null}

            {transition && outgoingPoster ? (
              <>
                <div
                  className={`homeCookieRigShell homeCookieRigShell--outgoing homeCookieRigShell--${transitionVariant} absolute left-1/2`}
                  style={{ top: rigTop }}
                >
                  <CookieSheepRig
                    bodyFallbackSrc={outgoingPoster.bodyFallbackSrc}
                    className="top-1/2 bottom-auto -translate-y-1/2"
                    image={outgoingPoster.image}
                    title={outgoingPoster.title}
                  />
                </div>

                <div
                  className={`homeCookieRigShell homeCookieRigShell--incoming homeCookieRigShell--${transitionVariant} absolute left-1/2`}
                  ref={rigShellRef}
                  style={{ top: rigTop }}
                >
                  <CookieSheepRig
                    bodyFallbackSrc={activePoster.bodyFallbackSrc}
                    className="top-1/2 bottom-auto -translate-y-1/2"
                    image={activePoster.image}
                    title={activePoster.title}
                  />
                </div>
              </>
            ) : (
              <div
                className={`homeCookieRigShell homeCookieRigShell--active absolute left-1/2${
                  infoPhase === 'lifting' || infoPhase === 'open'
                    ? ' homeCookieRigShell--info-open'
                    : infoPhase === 'closing' || infoPhase === 'withering'
                      ? ' homeCookieRigShell--info-open'
                    : infoPhase === 'returning'
                      ? ' homeCookieRigShell--info-closing'
                      : ''
                }`}
                ref={rigShellRef}
                style={{ top: rigTop }}
              >
                <CookieSheepRig
                  bodyFallbackSrc={activePoster.bodyFallbackSrc}
                  className="top-1/2 bottom-auto -translate-y-1/2"
                  image={activePoster.image}
                  title={activePoster.title}
                />
              </div>
            )}

            {sceneVariant === 'scenery' && infoPhase === 'ready' ? (
              <div
                className="homeCookieInfoDock"
                style={{
                  left: '50%',
                  top: `calc(${rigTop} - var(--cookie-size) * 0.7)`,
                }}
              >
                <FlowerSprite
                  animateIn
                  asset="/flowers/menu-nav-flower.svg"
                  className="homeCookieInfoFlower"
                  living
                  sizes="42px"
                  style={
                    {
                      '--flower-bob': '0.05rem',
                      '--flower-delay': '0.08s',
                      '--flower-grow-delay': '70ms',
                      '--flower-scale': '1.98',
                      '--flower-tilt': '-2deg',
                    } as CSSProperties
                  }
                />
                <button
                  aria-controls={`home-cookie-receipt-${activePoster.slug}`}
                  aria-expanded="false"
                  className="homeCookieInfoButton"
                  onClick={() => {
                    if (infoLiftTimeoutRef.current != null) {
                      window.clearTimeout(infoLiftTimeoutRef.current)
                    }

                    setInfoPhase('lifting')
                    infoLiftTimeoutRef.current = window.setTimeout(() => {
                      setInfoPhase('open')
                      infoLiftTimeoutRef.current = null
                    }, INFO_LIFT_DURATION_MS)
                  }}
                  type="button"
                >
                  {activePoster.infoButtonLabel}
                </button>
              </div>
            ) : null}

            {sceneVariant === 'scenery' ? (
              <>
                <picture className="homeCookieSceneMeadow">
                  {menuHeroMobileMeadowByScene[sceneTone] ? (
                    <source media="(max-width: 639px)" srcSet={menuHeroMobileMeadowByScene[sceneTone]} />
                  ) : null}
                  <img
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                    draggable="false"
                    loading="eager"
                    src={menuHeroMeadowByScene[sceneTone]}
                  />
                </picture>
                <div aria-hidden="true" className="homeCookieFlowerRail">
                  {buildShowcaseFlowerRail(sceneTone).map((flower) => (
                    <img
                      alt=""
                      aria-hidden="true"
                      className="homeCookieFlowerRailBloom"
                      draggable="false"
                      key={flower.id}
                      loading="eager"
                      src={flower.src}
                      style={flower.style}
                    />
                  ))}
                </div>
                {spawnedSceneFlowers.map((flower) => (
                  <img
                    alt=""
                    aria-hidden="true"
                    className="homeCookieSceneFlower"
                    draggable="false"
                    key={flower.id}
                    loading="eager"
                    src={flower.src}
                    style={flower.style}
                  />
                ))}

              </>
            ) : (
              <div aria-hidden="true" className="homeCookieMeadowClip">
                <picture>
                  <source media="(max-width: 639px)" srcSet="/grassland-bigger.png" />
                  <img
                    alt=""
                    className="homeCookieGrass"
                    draggable="false"
                    loading="eager"
                    src="/grassland.svg"
                    style={{ bottom: `${-grassDropPx}px` }}
                  />
                </picture>

                <div className="homeCookieMeadowFlowers">
                  {meadowFlowerAccents.map((flower) => (
                    <span
                      aria-hidden="true"
                      className="homeCookieMeadowFlower"
                      data-tone={flower.tone}
                      key={flower.id}
                      style={flower.style}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {sceneVariant === 'scenery' ? (
            <div
              aria-hidden={
                infoPhase !== 'open' && infoPhase !== 'closing' && infoPhase !== 'withering'
              }
              className={`homeCookieReceipt${
                infoPhase === 'open'
                  ? ' is-open'
                  : infoPhase === 'closing'
                    ? ' is-closing'
                    : infoPhase === 'withering'
                      ? ' is-withering'
                      : ''
              }`}
              id={`home-cookie-receipt-${activePoster.slug}`}
              style={{
                left: 'calc(50% + var(--home-receipt-left-nudge, 0rem))',
                top: `calc(${rigTop} + (var(--cookie-size) * 0.5) - var(--home-info-lift, calc(var(--cookie-size) * 0.58)) + var(--home-receipt-top-nudge, 0.18rem))`,
              }}
            >
              <GrowingGrassBorder
                animate={
                  infoPhase === 'open' || infoPhase === 'closing' || infoPhase === 'withering'
                }
                className="homeCookieReceiptBorder"
                flowerPositions={[10, 34, 58, 82]}
                flowerSize="2.46rem"
                lineHeight="0.38rem"
                mode={infoPhase === 'withering' ? 'shrink' : 'grow'}
                sizes="44px"
              />
              <div className="homeCookieReceiptPaper">
                <div className="homeCookieReceiptHeader">
                  <div>
                    <p className="homeCookieReceiptEyebrow">For {activePoster.title}</p>
                    <h3 className="homeCookieReceiptTitle">{activePoster.ingredientsNoteTitle}</h3>
                  </div>
                  <button
                    aria-label={`Close info for ${activePoster.title}`}
                    className="homeCookieReceiptClose"
                    onClick={startCloseInfo}
                    type="button"
                  >
                    Close
                  </button>
                </div>

                <p className="homeCookieReceiptIntro">{activePoster.ingredientsIntro}</p>

                <ul className="homeCookieReceiptList">
                  {activePoster.ingredients.map((ingredient) => (
                    <li className="homeCookieReceiptRow" key={`${ingredient.name}-${ingredient.detail ?? ''}`}>
                      <span className="homeCookieReceiptName">{ingredient.name}</span>
                      <span className="homeCookieReceiptDetail">
                        {ingredient.detail ?? 'ingredient note'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div
            aria-hidden="true"
            className="homeCookieNameMeasure"
            ref={measureRef}
          >
            {posters.map((p) => (
              <span className="homeCookieNameButton" key={p.slug}>
                {p.title}
              </span>
            ))}
          </div>

          <div aria-live="polite" className="homeCookieCopy text-center">
            <div className="homeCookieControls">
              <button
                aria-label="Show previous cookie"
                className="homeCookieArrow"
                disabled={!hasMultiplePosters}
                onClick={() => handleNavigate(-1)}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={22} />
              </button>

              <div className="homeCookieNameButtonShell">
                {isCartPromptOpen ? (
                  <div
                    aria-live="polite"
                    className="homeCookieCartPrompt"
                    role="dialog"
                    aria-label={`Add ${activePoster.title} to cart`}
                  >
                    <button
                      aria-label="Close add to cart prompt"
                      className="homeCookieCartPromptClose"
                      disabled={activePosterPromptPhase === 'loading'}
                      onClick={handleCloseCartPrompt}
                      type="button"
                    >
                      <X aria-hidden="true" size={14} />
                    </button>
                    <p className="homeCookieCartPromptText">
                      {activePosterPromptPhase === 'loading'
                        ? 'Adding cookie to cart...'
                        : activePosterPromptPhase === 'added'
                          ? 'Cookie added to cart.'
                          : 'Add this cookie to cart?'}
                    </p>
                    {activePosterPromptPhase === 'open' ? (
                      <div className="homeCookieCartPromptActions">
                        <button
                          className="homeCookieCartPromptButton homeCookieCartPromptButton--confirm"
                          onClick={handleConfirmAddToCart}
                          type="button"
                        >
                          Yes
                        </button>
                        <button
                          className="homeCookieCartPromptButton homeCookieCartPromptButton--cancel"
                          onClick={handleCloseCartPrompt}
                          type="button"
                        >
                          No
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <button
                  aria-label={`Open add to cart prompt for ${activePoster.title}`}
                  className="homeCookieNameButton"
                  disabled={!activePosterCanAddToCart || cartIsLoading}
                  onClick={handleOpenCartPrompt}
                  style={nameButtonWidth ? { width: `${nameButtonWidth}px` } : undefined}
                  type="button"
                >
                  {activePoster.title}
                </button>
              </div>

              <button
                aria-label="Show next cookie"
                className="homeCookieArrow"
                disabled={!hasMultiplePosters}
                onClick={() => handleNavigate(1)}
                type="button"
              >
                <ArrowRight aria-hidden="true" size={22} />
              </button>
            </div>
            <span className="homeCookieAmount">{activePoster.amount}</span>
          </div>
        </div>
      </div>

      <style>{`
        .homeCookieShowcase {
          --home-header-underlap: 7.6rem;
          --home-meadow-height: clamp(6.75rem, 12vh, 8.75rem);
          --copy-bottom: clamp(1rem, 3.8vw, 2.2rem);
          background: linear-gradient(to bottom, var(--showcase-sky) 55%, #4a7a3b 100%);
          box-sizing: border-box;
          color: var(--showcase-ink);
          height: 100svh;
          overflow: hidden;
        }

        .homeCookieBackdrop {
          background: linear-gradient(to bottom, var(--showcase-sky) 60%, #4a7a3b 100%);
        }

        .homeCookieStage {
          height: 100%;
          overflow: hidden;
        }

        .homeCookieSceneFrame {
          left: 50%;
          overflow: visible;
          right: auto;
          transform: translateX(-50%);
          width: 100vw;
        }

        .homeCookieShowcase--scenery,
        .homeCookieShowcase--scenery .homeCookieBackdrop {
          background: transparent;
        }

        .homeCookieSceneSky,
        .homeCookieSceneMeadow,
        .homeCookieSceneCloud,
        .homeCookieScenePiece,
        .homeCookieSceneFlower {
          pointer-events: none;
          position: absolute;
        }

        .homeCookieSceneSky {
          inset: 0;
          height: 100%;
          object-fit: cover;
          width: 100%;
          z-index: 1;
        }

        .homeCookieSceneMeadow {
          bottom: var(--home-meadow-bottom, -0.15rem);
          height: var(--home-meadow-height);
          inset-inline: 0;
          z-index: 12;
        }

        .homeCookieSceneMeadow img {
          display: block;
          height: 100%;
          object-fit: cover;
          object-position: center;
          width: 100%;
        }

        .homeCookieFlowerRail {
          bottom: calc(var(--home-flower-seam, 0.5rem) + var(--home-flower-rail-lift, 0rem));
          height: 0;
          inset-inline: 0;
          pointer-events: none;
          position: absolute;
          z-index: 15;
        }

        .homeCookieFlowerRailBloom {
          bottom: 0;
          height: auto;
          pointer-events: none;
          position: absolute;
          width: clamp(2.2rem, 4.8vw, 3.8rem);
        }

        .homeCookieSceneCloud {
          animation: homeCookieCloudDrift var(--home-cloud-duration, 20s) linear infinite;
          filter: drop-shadow(0 10px 14px rgba(255, 255, 255, 0.28));
          height: auto;
          z-index: 8;
        }

        .homeCookieScenePiece {
          height: auto;
          transform-origin: center bottom;
          z-index: 13;
        }

        .homeCookieSceneFlower {
          animation: homeCookieSceneFlowerLife var(--home-flower-duration, 4.6s) ease-in-out infinite;
          animation-delay: var(--home-flower-delay, 0s);
          transform:
            translateX(-50%)
            translateY(0)
            rotate(calc(var(--home-flower-tilt, 2deg) * -1))
            scale(var(--home-flower-scale, 1));
          transform-origin: center bottom;
          width: clamp(1.9rem, 4vw, 3.1rem);
          z-index: 16;
        }

        .homeCookieSceneActions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          max-width: min(28rem, calc(100vw - 2rem));
          pointer-events: auto;
          position: absolute;
          right: clamp(0.85rem, 3vw, 2.2rem);
          top: calc(var(--home-header-underlap) + clamp(0.25rem, 1vw, 0.65rem));
          z-index: 22;
        }

        .homeCookieSceneButton {
          align-items: center;
          background:
            linear-gradient(
              90deg,
              color-mix(in srgb, var(--home-scene-charge, rgba(255, 215, 79, 0.86)) 70%, white 30%) 0%,
              color-mix(in srgb, var(--home-scene-charge, rgba(255, 215, 79, 0.86)) 84%, white 16%) 100%
            ),
            rgba(255, 248, 242, 0.9);
          border: 1px solid rgba(25, 57, 95, 0.16);
          border-radius: 999px;
          box-shadow: 0 12px 20px rgba(23, 58, 99, 0.08);
          color: #173a63;
          display: inline-flex;
          font-family: var(--font-rounded-display);
          font-size: 0.84rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          min-height: 2.2rem;
          padding: 0.48rem 0.9rem;
          transition:
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        .homeCookieSceneButton:hover,
        .homeCookieSceneButton:focus-visible {
          border-color: rgba(25, 57, 95, 0.28);
          box-shadow: 0 14px 24px rgba(23, 58, 99, 0.12);
          transform: translateY(-1px);
        }

        .homeCookiePaperStage {
          inset: 0;
          pointer-events: none;
          position: absolute;
        }

        .homeCookiePaperStage--sky {
          z-index: 6;
        }

        .homeCookiePaperLayer {
          pointer-events: none;
          position: absolute;
        }

        .homeCookiePaperLayer--cloud {
          animation: homeCookieCloudDrift linear infinite;
          display: block;
          filter: drop-shadow(0 10px 14px var(--showcase-cloud-shadow));
          height: auto;
          opacity: 1;
          overflow: visible;
          transform: translate3d(0, 0, 0);
          transform-origin: center;
        }

        .homeCookiePaperCloudShape {
          fill: rgba(255, 255, 255, 0.98);
          stroke: rgba(241, 204, 216, 0.9);
          stroke-linejoin: round;
          stroke-width: 2;
        }

        .homeCookieRigShell {
          height: var(--cookie-size);
          opacity: 1;
          transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(1);
          will-change: transform, opacity;
          width: var(--cookie-size);
        }

        .homeCookieRigShell--active {
          z-index: 30;
        }

        .homeCookieRigShell--info-open {
          animation: homeCookieInfoLift 440ms cubic-bezier(0.22, 1, 0.36, 1) both;
          z-index: 34;
        }

        .homeCookieRigShell--info-closing {
          animation: homeCookieInfoReturn 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
          z-index: 34;
        }

        .homeCookieRigShell--incoming,
        .homeCookieRigShell--outgoing {
          pointer-events: none;
        }

        .homeCookieRigShell--outgoing {
          z-index: 80;
        }

        .homeCookieRigShell--incoming {
          z-index: 82;
        }

        .homeCookieRigShell--outgoing.homeCookieRigShell--next {
          animation: homeCookieJumpOutToLeft var(--jump-duration, ${JUMP_DURATION_MS}ms) linear both;
        }

        .homeCookieRigShell--incoming.homeCookieRigShell--next {
          animation: homeCookieJumpInFromRight var(--jump-duration, ${JUMP_DURATION_MS}ms) linear both;
        }

        .homeCookieRigShell--outgoing.homeCookieRigShell--prev {
          animation: homeCookieJumpOutToRight var(--jump-duration, ${JUMP_DURATION_MS}ms) linear both;
        }

        .homeCookieRigShell--incoming.homeCookieRigShell--prev {
          animation: homeCookieJumpInFromLeft var(--jump-duration, ${JUMP_DURATION_MS}ms) linear both;
        }

        .homeCookieShowcase .cookieSheepBodyImage {
          opacity: 1;
          transform: scale(1.02);
          transform-origin: center center;
        }

        .homeCookieRigShell--info-open .cookieSheepBodyImage {
          transform:
            translate3d(0, calc(var(--home-body-lift, 0.95rem) * -1), 0)
            rotate(var(--home-body-rotate, -4deg))
            scale(1.06);
          transition:
            transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 220ms ease;
        }

        .homeCookieShowcase .cookieSheepBurstPart {
          opacity: 1;
          transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
        }

        .homeCookieRigShell--info-open .cookieSheepBurstPart {
          opacity: 0;
          transform: translate3d(var(--sheep-burst-x, 0), calc(var(--sheep-burst-y, 0) - 0.85rem), 0)
            rotate(var(--sheep-burst-rotate, 0deg))
            scale(var(--sheep-burst-scale, 0.7));
          transition:
            transform 440ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 260ms ease-out;
        }

        .homeCookieInfoDock {
          opacity: 0;
          pointer-events: none;
          position: absolute;
          transform: translate(-50%, 0.5rem);
          transition:
            opacity 220ms ease,
            transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
          z-index: 33;
        }

        .homeCookieInfoFlower {
          left: 50%;
          position: absolute;
          top: -1.95rem;
          transform: translateX(-50%);
          width: 2.08rem;
        }

        .homeCookieInfoDock.is-open,
        .homeCookieInfoDock:not(.is-open) {
          opacity: 1;
          pointer-events: auto;
          transform: translate(-50%, 0);
        }

        .homeCookieInfoButton {
          align-items: center;
          backdrop-filter: blur(10px);
          background: rgba(255, 251, 236, 0.9);
          border: 1px solid rgba(97, 74, 37, 0.16);
          border-radius: 999px;
          box-shadow: 0 14px 28px rgba(16, 13, 9, 0.16);
          color: #4d391d;
          display: inline-flex;
          font-family: var(--font-rounded-display);
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          min-height: 2.15rem;
          padding: 0.46rem 0.9rem;
          transition:
            transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 180ms ease,
            background-color 180ms ease;
        }

        .homeCookieInfoButton:hover,
        .homeCookieInfoButton:focus-visible {
          background: rgba(255, 248, 225, 0.98);
          box-shadow: 0 16px 32px rgba(16, 13, 9, 0.2);
          transform: translateY(-1px);
        }

        .homeCookieReceipt {
          max-width: var(--home-receipt-width, min(16.25rem, calc(100vw - 2.4rem)));
          opacity: 0;
          pointer-events: none;
          position: absolute;
          transform-origin: var(--home-receipt-origin, center top);
          transform: translate(var(--home-receipt-offset-x, -50%), 1rem);
          transition:
            opacity 140ms ease,
            transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
          width: var(--home-receipt-width, min(16.25rem, calc(100vw - 2.4rem)));
          z-index: 92;
        }

        .homeCookieReceiptBorder {
          --home-receipt-border-height: 2.55rem;
          height: var(--home-receipt-border-height);
          left: 0;
          right: 0;
          top: calc(var(--home-receipt-border-height) * -1);
          transform-origin: center bottom;
          transition:
            opacity 180ms ease,
            transform 220ms cubic-bezier(0.4, 0, 0.8, 0.2);
          z-index: 3;
        }

        .homeCookieReceipt.is-open {
          opacity: 1;
          pointer-events: auto;
          transform: translate(var(--home-receipt-offset-x, -50%), 0);
        }

        .homeCookieReceipt.is-closing {
          opacity: 1;
          pointer-events: none;
          transform: translate(var(--home-receipt-offset-x, -50%), 0);
        }

        .homeCookieReceipt.is-withering {
          opacity: 1;
          pointer-events: none;
          transform: translate(var(--home-receipt-offset-x, -50%), 0);
        }

        .homeCookieReceiptPaper {
          background:
            linear-gradient(180deg, rgba(255, 252, 240, 0.98), rgba(249, 240, 215, 0.98)),
            #fff9e8;
          border: 1px solid rgba(123, 94, 47, 0.16);
          border-top: 0;
          border-radius: 0;
          box-shadow:
            0 24px 40px rgba(16, 14, 10, 0.18),
            0 4px 10px rgba(107, 81, 41, 0.08);
          min-height: 19.5rem;
          opacity: 0;
          overflow: hidden;
          padding: 0.35rem 1rem 1.1rem;
          position: relative;
          transform: scaleY(0.05);
          transform-origin: top center;
          transition:
            opacity 90ms ease 0.12s,
            transform 420ms cubic-bezier(0.2, 0.9, 0.24, 1) 0.14s;
        }

        .homeCookieReceipt.is-open .homeCookieReceiptPaper {
          opacity: 1;
          transform: scaleY(1);
        }

        .homeCookieReceipt.is-closing .homeCookieReceiptPaper {
          opacity: 0;
          transform: scaleY(0.05);
          transition:
            opacity 80ms ease 0.12s,
            transform 320ms cubic-bezier(0.4, 0, 0.8, 0.2);
        }

        .homeCookieReceipt.is-withering .homeCookieReceiptPaper {
          opacity: 0;
          transform: scaleY(0.05);
          transition: none;
        }

        .homeCookieReceipt.is-withering .homeCookieReceiptBorder {
          opacity: 0;
          transform: scale(0.92);
        }

        .homeCookieReceiptPaper::before {
          background:
            repeating-linear-gradient(
              180deg,
              transparent 0,
              transparent 1.46rem,
              rgba(111, 140, 195, 0.16) 1.46rem,
              rgba(111, 140, 195, 0.16) 1.54rem
            );
          content: '';
          inset: 0;
          opacity: 0.74;
          pointer-events: none;
          position: absolute;
        }

        .homeCookieReceiptHeader,
        .homeCookieReceiptIntro,
        .homeCookieReceiptList {
          position: relative;
          z-index: 1;
        }

        .homeCookieReceiptHeader {
          align-items: start;
          display: flex;
          gap: 1rem;
          justify-content: space-between;
        }

        .homeCookieReceiptEyebrow {
          color: rgba(101, 75, 36, 0.68);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          margin-bottom: 0.3rem;
          text-transform: uppercase;
        }

        .homeCookieReceiptTitle {
          color: #4f3818;
          font-family: var(--font-rounded-display);
          font-size: 1.02rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.05;
          margin: 0;
        }

        .homeCookieReceiptClose {
          color: rgba(83, 61, 30, 0.72);
          font-family: var(--font-rounded-display);
          font-size: 0.76rem;
          font-weight: 700;
          line-height: 1;
          transition: color 160ms ease;
        }

        .homeCookieReceiptClose:hover,
        .homeCookieReceiptClose:focus-visible {
          color: rgba(83, 61, 30, 1);
        }

        .homeCookieReceiptIntro {
          color: rgba(88, 64, 32, 0.78);
          font-size: 0.82rem;
          line-height: 1.5;
          margin-top: 0.65rem;
        }

        .homeCookieReceiptList {
          display: grid;
          gap: 0.55rem;
          list-style: none;
          margin: 1rem 0 0;
          padding: 0;
        }

        .homeCookieReceiptRow {
          align-items: start;
          border-bottom: 1px dashed rgba(121, 92, 47, 0.16);
          display: grid;
          gap: 0.22rem;
          grid-template-columns: minmax(0, 1fr);
          padding-bottom: 0.5rem;
        }

        .homeCookieReceiptRow:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .homeCookieReceiptName {
          color: #4f3818;
          font-family: var(--font-rounded-display);
          font-size: 0.86rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .homeCookieReceiptDetail {
          color: rgba(92, 67, 31, 0.6);
          font-size: 0.67rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        @keyframes homeCookieInfoLift {
          0% {
            transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(1);
          }

          45% {
            transform: translate3d(calc(-50% + var(--home-info-shift-x, 0rem) * 0.72), calc(-50% - var(--home-info-lift, calc(var(--cookie-size) * 0.58)) * 0.72), 0) rotate(var(--home-info-rotate-mid, -6deg)) scale(1.02);
          }

          100% {
            transform: translate3d(calc(-50% + var(--home-info-shift-x, 0rem)), calc(-50% - var(--home-info-lift, calc(var(--cookie-size) * 0.58))), 0) rotate(var(--home-info-rotate-end, -2deg)) scale(1.01);
          }
        }

        @keyframes homeCookieInfoReturn {
          0% {
            transform: translate3d(calc(-50% + var(--home-info-shift-x, 0rem)), calc(-50% - var(--home-info-lift, calc(var(--cookie-size) * 0.58))), 0) rotate(var(--home-info-rotate-end, -2deg)) scale(1.01);
          }

          55% {
            transform: translate3d(calc(-50% + var(--home-info-shift-x, 0rem) * 0.34), calc(-50% - var(--home-info-lift, calc(var(--cookie-size) * 0.58)) * 0.2), 0) rotate(calc(var(--home-info-rotate-end, -2deg) * 0.28)) scale(1.01);
          }

          100% {
            transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(1);
          }
        }

        @keyframes homeCookieJumpOutToLeft {
          0%   { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(1); }
          15%  { opacity: 1; transform: translate3d(calc(-50% - 8.7vw), calc(-50% - 4.08rem), 0) rotate(-3deg) scale(0.98); }
          30%  { opacity: 1; transform: translate3d(calc(-50% - 17.4vw), calc(-50% - 6.72rem), 0) rotate(-6deg) scale(0.96); }
          50%  { opacity: 1; transform: translate3d(calc(-50% - 29vw), calc(-50% - 8rem), 0) rotate(-10deg) scale(0.93); }
          70%  { opacity: 1; transform: translate3d(calc(-50% - 40.6vw), calc(-50% - 6.72rem), 0) rotate(-14deg) scale(0.90); }
          85%  { opacity: 1; transform: translate3d(calc(-50% - 49.3vw), calc(-50% - 4.08rem), 0) rotate(-17deg) scale(0.87); }
          100% { opacity: 0; transform: translate3d(calc(-50% - 58vw), -50%, 0) rotate(-20deg) scale(0.84); }
        }

        @keyframes homeCookieJumpOutToRight {
          0%   { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(1); }
          15%  { opacity: 1; transform: translate3d(calc(-50% + 8.7vw), calc(-50% - 4.08rem), 0) rotate(3deg) scale(0.98); }
          30%  { opacity: 1; transform: translate3d(calc(-50% + 17.4vw), calc(-50% - 6.72rem), 0) rotate(6deg) scale(0.96); }
          50%  { opacity: 1; transform: translate3d(calc(-50% + 29vw), calc(-50% - 8rem), 0) rotate(10deg) scale(0.93); }
          70%  { opacity: 1; transform: translate3d(calc(-50% + 40.6vw), calc(-50% - 6.72rem), 0) rotate(14deg) scale(0.90); }
          85%  { opacity: 1; transform: translate3d(calc(-50% + 49.3vw), calc(-50% - 4.08rem), 0) rotate(17deg) scale(0.87); }
          100% { opacity: 0; transform: translate3d(calc(-50% + 58vw), -50%, 0) rotate(20deg) scale(0.84); }
        }

        @keyframes homeCookieJumpInFromRight {
          0%   { opacity: 0; transform: translate3d(calc(-50% + 58vw), -50%, 0) rotate(20deg) scale(0.84); }
          8%   { opacity: 1; transform: translate3d(calc(-50% + 53.4vw), calc(-50% - 2.48rem), 0) rotate(18deg) scale(0.86); }
          15%  { opacity: 1; transform: translate3d(calc(-50% + 49.3vw), calc(-50% - 4.08rem), 0) rotate(17deg) scale(0.87); }
          30%  { opacity: 1; transform: translate3d(calc(-50% + 40.6vw), calc(-50% - 6.72rem), 0) rotate(14deg) scale(0.90); }
          50%  { opacity: 1; transform: translate3d(calc(-50% + 29vw), calc(-50% - 8rem), 0) rotate(10deg) scale(0.93); }
          70%  { opacity: 1; transform: translate3d(calc(-50% + 17.4vw), calc(-50% - 6.72rem), 0) rotate(6deg) scale(0.96); }
          85%  { opacity: 1; transform: translate3d(calc(-50% + 8.7vw), calc(-50% - 4.08rem), 0) rotate(3deg) scale(0.98); }
          100% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(1); }
        }

        @keyframes homeCookieJumpInFromLeft {
          0%   { opacity: 0; transform: translate3d(calc(-50% - 58vw), -50%, 0) rotate(-20deg) scale(0.84); }
          8%   { opacity: 1; transform: translate3d(calc(-50% - 53.4vw), calc(-50% - 2.48rem), 0) rotate(-18deg) scale(0.86); }
          15%  { opacity: 1; transform: translate3d(calc(-50% - 49.3vw), calc(-50% - 4.08rem), 0) rotate(-17deg) scale(0.87); }
          30%  { opacity: 1; transform: translate3d(calc(-50% - 40.6vw), calc(-50% - 6.72rem), 0) rotate(-14deg) scale(0.90); }
          50%  { opacity: 1; transform: translate3d(calc(-50% - 29vw), calc(-50% - 8rem), 0) rotate(-10deg) scale(0.93); }
          70%  { opacity: 1; transform: translate3d(calc(-50% - 17.4vw), calc(-50% - 6.72rem), 0) rotate(-6deg) scale(0.96); }
          85%  { opacity: 1; transform: translate3d(calc(-50% - 8.7vw), calc(-50% - 4.08rem), 0) rotate(-3deg) scale(0.98); }
          100% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(1); }
        }

        .homeCookieMeadowClip {
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          position: absolute;
          z-index: 12;
        }

        .homeCookieMeadowClip picture {
          display: block;
        }

        .homeCookieMeadowFlowers {
          inset: 0;
          pointer-events: none;
          position: absolute;
          z-index: 14;
        }

        .homeCookieMeadowFlower {
          aspect-ratio: 1 / 1.35;
          height: calc(var(--meadow-flower-size) * 1.35);
          pointer-events: none;
          position: absolute;
          transform-origin: center bottom;
          width: var(--meadow-flower-size);
        }

        .homeCookieMeadowFlower::before,
        .homeCookieMeadowFlower::after {
          animation: homeCookieMeadowFlowerBob 2.8s ease-in-out infinite;
          content: '';
          left: 50%;
          pointer-events: none;
          position: absolute;
          transform: translate(-50%, 0);
        }

        .homeCookieMeadowFlower::before {
          background: linear-gradient(180deg, #98a44a 0%, #536520 100%);
          border-radius: 999px;
          bottom: 0;
          height: 26%;
          opacity: 0.95;
          width: 2px;
        }

        .homeCookieMeadowFlower::after {
          border-radius: 999px;
          bottom: 16%;
          box-shadow: 0 6px 10px rgba(54, 74, 24, 0.12);
          height: var(--meadow-flower-size);
          opacity: 0.98;
          width: var(--meadow-flower-size);
        }

        .homeCookieMeadowFlower[data-tone='orange']::after {
          background:
            radial-gradient(circle at 50% 50%, #6f5110 0 17%, transparent 19%),
            radial-gradient(circle at 50% 14%, #f0bb78 0 23%, transparent 25%),
            radial-gradient(circle at 82% 38%, #e47a1d 0 23%, transparent 25%),
            radial-gradient(circle at 68% 80%, #dd5b08 0 23%, transparent 25%),
            radial-gradient(circle at 32% 80%, #e47a1d 0 23%, transparent 25%),
            radial-gradient(circle at 18% 38%, #f0bb78 0 23%, transparent 25%);
        }

        .homeCookieMeadowFlower[data-tone='cream']::after {
          background:
            radial-gradient(circle at 50% 50%, #545228 0 17%, transparent 19%),
            radial-gradient(circle at 50% 14%, #f2e7b2 0 23%, transparent 25%),
            radial-gradient(circle at 82% 38%, #c5c989 0 23%, transparent 25%),
            radial-gradient(circle at 68% 80%, #9aa25b 0 23%, transparent 25%),
            radial-gradient(circle at 32% 80%, #c5c989 0 23%, transparent 25%),
            radial-gradient(circle at 18% 38%, #f2e7b2 0 23%, transparent 25%);
        }

        .homeCookieMeadowFlower[data-tone='plum']::after {
          background:
            radial-gradient(circle at 50% 50%, #4d4030 0 17%, transparent 19%),
            radial-gradient(circle at 50% 14%, #e6d1da 0 23%, transparent 25%),
            radial-gradient(circle at 82% 38%, #9a6d83 0 23%, transparent 25%),
            radial-gradient(circle at 68% 80%, #6f4b5e 0 23%, transparent 25%),
            radial-gradient(circle at 32% 80%, #9a6d83 0 23%, transparent 25%),
            radial-gradient(circle at 18% 38%, #e6d1da 0 23%, transparent 25%);
        }

        .homeCookieMeadowFlower[data-tone='gold']::after {
          background:
            radial-gradient(circle at 50% 50%, #655a19 0 17%, transparent 19%),
            radial-gradient(circle at 50% 14%, #f6ec8d 0 23%, transparent 25%),
            radial-gradient(circle at 82% 38%, #dfc24b 0 23%, transparent 25%),
            radial-gradient(circle at 68% 80%, #c59f1f 0 23%, transparent 25%),
            radial-gradient(circle at 32% 80%, #dfc24b 0 23%, transparent 25%),
            radial-gradient(circle at 18% 38%, #f6ec8d 0 23%, transparent 25%);
        }

        .homeCookieMeadowFlower[data-tone='rose']::after {
          background:
            radial-gradient(circle at 50% 50%, #6e422f 0 17%, transparent 19%),
            radial-gradient(circle at 50% 14%, #f5bfcb 0 23%, transparent 25%),
            radial-gradient(circle at 82% 38%, #ec7e9b 0 23%, transparent 25%),
            radial-gradient(circle at 68% 80%, #d94d74 0 23%, transparent 25%),
            radial-gradient(circle at 32% 80%, #ec7e9b 0 23%, transparent 25%),
            radial-gradient(circle at 18% 38%, #f5bfcb 0 23%, transparent 25%);
        }

        .homeCookieGrass {
          filter: drop-shadow(0 12px 12px rgba(36, 63, 24, 0.1));
          height: auto;
          left: 50%;
          max-width: none;
          pointer-events: none;
          position: absolute;
          transform: translateX(-50%);
          width: 100vw;
        }

        .homeCookieCopy {
          bottom: var(--copy-bottom);
          left: 50%;
          opacity: 1;
          position: absolute;
          transform: translateY(0);
          translate: -50% 0;
          width: var(--copy-width);
          z-index: 35;
        }

        .homeCookieControls {
          align-items: center;
          display: inline-flex;
          height: var(--control-size);
          justify-content: center;
          overflow: visible;
          position: relative;
        }

        .homeCookieNameButtonShell {
          display: inline-flex;
          position: relative;
        }

        .homeCookieCartPrompt {
          backdrop-filter: blur(14px);
          background: rgba(255, 252, 242, 0.96);
          border: 1px solid rgba(92, 67, 31, 0.12);
          border-radius: 1.35rem;
          bottom: calc(100% + 0.9rem);
          box-shadow:
            0 22px 36px rgba(11, 12, 9, 0.16),
            0 4px 12px rgba(92, 67, 31, 0.08);
          left: 50%;
          min-width: min(18rem, calc(100vw - 2rem));
          padding: 0.9rem 0.95rem 0.82rem;
          position: absolute;
          transform: translateX(-50%);
          z-index: 48;
        }

        .homeCookieCartPrompt::after {
          background: rgba(255, 252, 242, 0.96);
          border-bottom: 1px solid rgba(92, 67, 31, 0.12);
          border-right: 1px solid rgba(92, 67, 31, 0.12);
          bottom: -0.38rem;
          content: '';
          height: 0.76rem;
          left: 50%;
          position: absolute;
          transform: translateX(-50%) rotate(45deg);
          width: 0.76rem;
        }

        .homeCookieCartPromptClose {
          align-items: center;
          background: #fffdf7;
          border: 1px solid rgba(92, 67, 31, 0.14);
          border-radius: 999px;
          box-shadow: 0 6px 12px rgba(11, 12, 9, 0.08);
          color: #4b3518;
          display: inline-flex;
          height: 1.7rem;
          justify-content: center;
          position: absolute;
          right: 0.7rem;
          top: 0.62rem;
          transition:
            transform 150ms ease,
            background-color 150ms ease;
          width: 1.7rem;
          z-index: 1;
        }

        .homeCookieCartPromptClose:hover,
        .homeCookieCartPromptClose:focus-visible {
          background: #fff8eb;
          transform: translateY(-1px);
        }

        .homeCookieCartPromptText {
          color: #4d391d;
          font-family: var(--font-rounded-display);
          font-size: 0.88rem;
          font-weight: 700;
          line-height: 1.35;
          margin: 0;
          padding-right: 2rem;
          text-align: left;
        }

        .homeCookieCartPromptActions {
          display: flex;
          gap: 0.55rem;
          margin-top: 0.78rem;
        }

        .homeCookieCartPromptButton {
          align-items: center;
          border-radius: 999px;
          display: inline-flex;
          font-family: var(--font-rounded-display);
          font-size: 0.8rem;
          font-weight: 700;
          justify-content: center;
          min-height: 2rem;
          padding: 0.42rem 0.9rem;
          transition:
            transform 150ms ease,
            opacity 150ms ease,
            background-color 150ms ease;
        }

        .homeCookieCartPromptButton:hover,
        .homeCookieCartPromptButton:focus-visible {
          transform: translateY(-1px);
        }

        .homeCookieCartPromptButton--confirm {
          background: #1b1917;
          color: #fff;
        }

        .homeCookieCartPromptButton--cancel {
          background: rgba(92, 67, 31, 0.08);
          color: #5b4320;
        }

        .homeCookieShowcase a[href],
        .homeCookieShowcase button:not(:disabled) {
          cursor: pointer;
        }

        .homeCookieArrow,
        .homeCookieNameButton {
          align-items: center;
          background: rgba(24, 22, 20, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            0 16px 28px rgba(10, 12, 9, 0.16);
          color: #ffffff;
          display: inline-flex;
          justify-content: center;
          position: relative;
          text-decoration: none;
          transition:
            transform 150ms ease,
            opacity 150ms ease,
            background-color 150ms ease,
            box-shadow 150ms ease;
        }

        .homeCookieNameButton {
          font-size: var(--cta-font-size);
          font-weight: 600;
          line-height: 1;
          max-width: calc(100vw - 20vw - 2 * var(--control-size) - 2 * var(--control-gap));
          min-height: var(--control-size);
          min-width: var(--cta-width);
          padding: 0.9rem var(--cta-padding-x) 1rem;
          text-align: center;
        }

        .homeCookieNameMeasure {
          clip-path: inset(50%);
          display: flex;
          flex-direction: column;
          pointer-events: none;
          position: absolute;
          visibility: hidden;
        }

        .homeCookieNameButton:active {
          transform: translateY(1px);
        }

        .homeCookieNameButton:focus-visible {
          outline: 3px solid rgba(255, 255, 255, 0.72);
          outline-offset: 4px;
        }

        .homeCookieAmount {
          color: var(--home-price-color, rgba(23, 52, 31, 0.68));
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          margin-top: 1.15rem;
          position: relative;
          text-shadow:
            var(--home-price-shadow, none),
            0 0 10px rgba(255, 255, 255, 0.18);
          text-transform: uppercase;
          z-index: 42;
        }

        .homeCookieArrow {
          height: var(--control-size);
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: var(--control-size);
        }

        .homeCookieControls > .homeCookieArrow:first-child {
          right: calc(100% + var(--control-gap));
        }

        .homeCookieControls > .homeCookieArrow:last-child {
          left: calc(100% + var(--control-gap));
        }

        .homeCookieArrow::before {
          background: rgba(255, 255, 255, 0.24);
          content: '';
          height: 1px;
          left: 50%;
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 1.45rem;
        }

        .homeCookieArrow svg {
          color: #ffffff;
          position: relative;
          z-index: 1;
        }

        .homeCookieArrow:disabled {
          cursor: default;
          opacity: 0.5;
        }

        .homeCookieArrow:active:not(:disabled) {
          transform: translateY(calc(-50% + 1px));
        }

        .homeCookieArrow:focus-visible {
          outline: 3px solid rgba(255, 255, 255, 0.72);
          outline-offset: 4px;
        }

        @keyframes homeCookieCloudDrift {
          0% {
            transform: translate3d(-1rem, 0, 0);
          }

          50% {
            transform: translate3d(1.25rem, -0.55rem, 0);
          }

          100% {
            transform: translate3d(-1rem, 0, 0);
          }
        }

        @keyframes homeCookieSceneFlowerLife {
          0%,
          100% {
            transform:
              translateX(-50%)
              translateY(0)
              rotate(calc(var(--home-flower-tilt, 2deg) * -1))
              scale(var(--home-flower-scale, 1));
          }

          50% {
            transform:
              translateX(-50%)
              translateY(calc(var(--home-flower-bob, 0.18rem) * -1))
              rotate(var(--home-flower-tilt, 2deg))
              scale(var(--home-flower-scale, 1));
          }
        }

        @keyframes homeCookieMeadowFlowerBob {
          0%,
          100% {
            transform: translate(-50%, 0);
          }

          50% {
            transform: translate(-50%, -0.32rem);
          }
        }

        @media (max-width: 639px) {
          .homeCookieShowcase {
            --control-gap: 0.85rem;
            --control-size: 2.95rem;
            --cookie-size: clamp(12.6rem, 51.6vw, 15.3rem);
            --copy-bottom: clamp(0.85rem, 2.4vh, 1.35rem);
            --copy-width: min(86vw, 21rem);
            --cta-font-size: 0.88rem;
            --cta-padding-x: 1rem;
            --cta-width: clamp(7rem, 26vw, 8.5rem);
            --home-body-lift: 0.95rem;
            --home-body-rotate: -4deg;
            --home-header-underlap: 7.2rem;
            --home-info-lift: calc(var(--cookie-size) * 0.72);
            --home-receipt-left-nudge: 0rem;
            --home-receipt-offset-x: -50%;
            --home-receipt-origin: center top;
            --home-receipt-top-nudge: 0.18rem;
            --home-receipt-width: min(11.8rem, calc(100vw - 5.5rem));
            --home-meadow-height: 6.4rem;
          }

          .homeCookieSceneActions {
            justify-content: center;
            left: 0.85rem;
            max-width: none;
            right: 0.85rem;
            top: calc(var(--home-header-underlap) + 0.35rem);
          }

          .homeCookieSceneButton {
            font-size: 0.74rem;
            min-height: 2rem;
            padding-left: 0.72rem;
            padding-right: 0.72rem;
          }

          .homeCookieInfoDock {
            top: calc(${rigTop} - var(--cookie-size) * 0.8);
          }

          .homeCookieInfoFlower {
            top: -1.55rem;
          }

          .homeCookieReceipt {
            max-width: var(--home-receipt-width);
            width: var(--home-receipt-width);
          }

          .homeCookieReceiptBorder {
            --home-receipt-border-height: 2.75rem;
          }

          .homeCookieReceiptPaper {
            min-height: 14.25rem;
            padding: 0.08rem 0.8rem 0.95rem;
          }

          .homeCookieScene-blossom .homeCookieSceneSky {
            object-position: 16% center;
          }

          .homeCookieScene-blossom {
            --home-flower-rail-lift: 9rem;
          }

          .homeCookieScene-blossom .homeCookieSceneFlower {
            bottom: 9rem !important;
          }

          .homeCookieScene-classic {
            --home-flower-rail-lift: 7.2rem;
            --home-meadow-height: 15.6rem;
          }

          .homeCookieScene-classic .homeCookieSceneFlower {
            bottom: 7.2rem !important;
          }

          .homeCookieScene-dawn {
            --home-flower-rail-lift: 7.35rem;
            --home-meadow-height: 16.05rem;
          }

          .homeCookieScene-dawn .homeCookieSceneFlower {
            bottom: 7.35rem !important;
          }

          .homeCookieScene-under-tree {
            --home-flower-rail-lift: 6.24rem;
            --home-meadow-height: 15.24rem;
          }

          .homeCookieScene-under-tree .homeCookieSceneFlower {
            bottom: 6.24rem !important;
          }

          .homeCookieScene-fairy-castle .homeCookieSceneSky {
            left: -8%;
            object-position: center top;
            width: 116%;
          }

          .homeCookieScene-moonlit .homeCookieSceneSky {
            object-position: center top;
          }

          .homeCookieScene-moonlit {
            --home-flower-rail-lift: 7.35rem;
            --home-meadow-bottom: -0.15rem;
            --home-meadow-height: 19.2rem;
          }

          .homeCookieScene-moonlit .homeCookieFlowerRailBloom {
            width: clamp(2.6rem, 6vw, 4.2rem);
          }

          .homeCookieScene-moonlit .homeCookieSceneFlower {
            bottom: 7.35rem !important;
            width: clamp(2.2rem, 5vw, 3.4rem);
          }

          .homeCookieFlowerRailBloom:nth-child(2),
          .homeCookieFlowerRailBloom:nth-child(4) {
            display: none;
          }

          .homeCookieMeadowFlower:nth-child(1) {
            --meadow-flower-size: clamp(1.36rem, 4.3vw, 1.82rem) !important;
            bottom: 34% !important;
            left: 8% !important;
          }

          .homeCookieMeadowFlower:nth-child(2) {
            --meadow-flower-size: clamp(1.28rem, 4vw, 1.68rem) !important;
            bottom: 39% !important;
            left: 18% !important;
          }

          .homeCookieMeadowFlower:nth-child(3) {
            --meadow-flower-size: clamp(1.38rem, 4.35vw, 1.86rem) !important;
            bottom: 32% !important;
            left: 27% !important;
          }

          .homeCookieMeadowFlower:nth-child(4) {
            --meadow-flower-size: clamp(1.1rem, 3.45vw, 1.45rem) !important;
            bottom: 38% !important;
            left: 41% !important;
          }

          .homeCookieMeadowFlower:nth-child(5) {
            --meadow-flower-size: clamp(1.16rem, 3.65vw, 1.52rem) !important;
            bottom: 33% !important;
            right: 28% !important;
          }

          .homeCookieMeadowFlower:nth-child(6) {
            --meadow-flower-size: clamp(1.38rem, 4.35vw, 1.86rem) !important;
            bottom: 38% !important;
            right: 18% !important;
          }

          .homeCookieMeadowFlower:nth-child(7) {
            --meadow-flower-size: clamp(1.44rem, 4.5vw, 1.94rem) !important;
            bottom: 34% !important;
            right: 8% !important;
          }

          .homeCookieMeadowFlower:nth-child(8) {
            --meadow-flower-size: clamp(1.22rem, 3.85vw, 1.6rem) !important;
            bottom: 29% !important;
            right: 43% !important;
          }

          .homeCookieMeadowFlower:nth-child(9) {
            --meadow-flower-size: clamp(1.2rem, 3.8vw, 1.58rem) !important;
            bottom: 24% !important;
            left: 3% !important;
          }

          .homeCookieMeadowFlower:nth-child(10) {
            --meadow-flower-size: clamp(1.08rem, 3.35vw, 1.4rem) !important;
            bottom: 37% !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
          }

          .homeCookieMeadowFlower:nth-child(11) {
            --meadow-flower-size: clamp(1.2rem, 3.8vw, 1.58rem) !important;
            bottom: 24% !important;
            right: 3% !important;
          }

          .homeCookieMeadowFlower:nth-child(12) {
            --meadow-flower-size: clamp(1.15rem, 3.6vw, 1.5rem) !important;
            bottom: 28% !important;
            right: 55% !important;
          }

          .homeCookieMeadowFlower:nth-child(13) {
            --meadow-flower-size: clamp(1.25rem, 4vw, 1.7rem) !important;
            bottom: 31% !important;
            right: 35% !important;
          }

          .homeCookieMeadowFlower:nth-child(14) {
            --meadow-flower-size: clamp(1.05rem, 3.3vw, 1.35rem) !important;
            bottom: 36% !important;
            left: 35% !important;
          }

          .homeCookieMeadowFlower:nth-child(15) {
            --meadow-flower-size: clamp(1.3rem, 4.2vw, 1.75rem) !important;
            bottom: 22% !important;
            right: 25% !important;
          }

          .homeCookieMeadowFlower:nth-child(16) {
            --meadow-flower-size: clamp(1.1rem, 3.5vw, 1.4rem) !important;
            bottom: 40% !important;
            left: 15% !important;
          }

          .homeCookieMeadowFlower:nth-child(17) {
            --meadow-flower-size: clamp(1.2rem, 3.8vw, 1.55rem) !important;
            bottom: 42% !important;
            left: 28% !important;
          }

          .homeCookieMeadowFlower:nth-child(18) {
            --meadow-flower-size: clamp(1rem, 3.2vw, 1.3rem) !important;
            bottom: 39% !important;
            left: 45% !important;
          }

          .homeCookieMeadowFlower:nth-child(19) {
            --meadow-flower-size: clamp(1.15rem, 3.6vw, 1.5rem) !important;
            bottom: 43% !important;
            right: 42% !important;
          }

          .homeCookieMeadowFlower:nth-child(20) {
            --meadow-flower-size: clamp(1.05rem, 3.3vw, 1.35rem) !important;
            bottom: 41% !important;
            right: 12% !important;
          }

          .homeCookieMeadowFlower:nth-child(21) {
            --meadow-flower-size: clamp(1.1rem, 3.45vw, 1.42rem) !important;
            bottom: 35% !important;
            display: block !important;
            right: 24% !important;
          }

          .homeCookieMeadowFlower:nth-child(22) {
            --meadow-flower-size: clamp(1.04rem, 3.25vw, 1.34rem) !important;
            bottom: 31% !important;
            display: block !important;
            right: 16% !important;
          }

          .homeCookieMeadowFlower:nth-child(23) {
            --meadow-flower-size: clamp(1rem, 3.1vw, 1.28rem) !important;
            bottom: 27% !important;
            display: block !important;
            right: 9% !important;
          }

          .homeCookieMeadowFlower:nth-child(24) {
            --meadow-flower-size: clamp(1.12rem, 3.5vw, 1.46rem) !important;
            bottom: 23% !important;
            display: block !important;
            right: 32% !important;
          }

          .homeCookieMeadowFlower:nth-child(25) {
            --meadow-flower-size: clamp(0.96rem, 3vw, 1.24rem) !important;
            bottom: 20% !important;
            display: block !important;
            right: 14% !important;
          }

          .homeCookieMeadowFlower:nth-child(1)::before,
          .homeCookieMeadowFlower:nth-child(1)::after {
            animation-delay: -0.4s;
          }
          ...
          .homeCookieMeadowFlower:nth-child(11)::before,
          .homeCookieMeadowFlower:nth-child(11)::after {
            animation-delay: -0.1s;
          }

          .homeCookieMeadowFlower:nth-child(12)::before,
          .homeCookieMeadowFlower:nth-child(12)::after {
            animation-delay: -0.8s;
          }

          .homeCookieMeadowFlower:nth-child(13)::before,
          .homeCookieMeadowFlower:nth-child(13)::after {
            animation-delay: -1.5s;
          }

          .homeCookieMeadowFlower:nth-child(14)::before,
          .homeCookieMeadowFlower:nth-child(14)::after {
            animation-delay: -0.3s;
          }

          .homeCookieMeadowFlower:nth-child(15)::before,
          .homeCookieMeadowFlower:nth-child(15)::after {
            animation-delay: -1.2s;
          }

          .homeCookieMeadowFlower:nth-child(16)::before,
          .homeCookieMeadowFlower:nth-child(16)::after {
            animation-delay: -0.6s;
          }

          .homeCookieMeadowFlower:nth-child(17)::before,
          .homeCookieMeadowFlower:nth-child(17)::after {
            animation-delay: -1.9s;
          }

          .homeCookieMeadowFlower:nth-child(18)::before,
          .homeCookieMeadowFlower:nth-child(18)::after {
            animation-delay: -0.1s;
          }

          .homeCookieMeadowFlower:nth-child(19)::before,
          .homeCookieMeadowFlower:nth-child(19)::after {
            animation-delay: -1.3s;
          }

          .homeCookieMeadowFlower:nth-child(20)::before,
          .homeCookieMeadowFlower:nth-child(20)::after {
            animation-delay: -0.7s;
          }

          .homeCookieMeadowFlower:nth-child(21)::before,
          .homeCookieMeadowFlower:nth-child(21)::after {
            animation-delay: -1.1s;
          }

          .homeCookieMeadowFlower:nth-child(22)::before,
          .homeCookieMeadowFlower:nth-child(22)::after {
            animation-delay: -0.5s;
          }

          .homeCookieMeadowFlower:nth-child(23)::before,
          .homeCookieMeadowFlower:nth-child(23)::after {
            animation-delay: -1.7s;
          }

          .homeCookieMeadowFlower:nth-child(24)::before,
          .homeCookieMeadowFlower:nth-child(24)::after {
            animation-delay: -0.2s;
          }

          .homeCookieMeadowFlower:nth-child(25)::before,
          .homeCookieMeadowFlower:nth-child(25)::after {
            animation-delay: -1.4s;
          }
        }

        @media (min-width: 640px) and (max-width: 899px) {
          .homeCookieShowcase {
            --control-gap: 0.85rem;
            --control-size: clamp(3rem, 5.2vw, 3.5rem);
            --cookie-size: clamp(11.5rem, 26vw, 14rem);
            --copy-bottom: 1rem;
            --copy-width: min(90vw, 28rem);
            --cta-font-size: clamp(1rem, 1.8vw, 1.15rem);
            --cta-padding-x: 1.3rem;
            --cta-width: clamp(9.25rem, 22vw, 11rem);
            --home-body-lift: 0.95rem;
            --home-body-rotate: -4deg;
            --home-info-lift: calc(var(--cookie-size) * 0.6);
            --home-info-rotate-mid: -6deg;
            --home-info-rotate-end: -2deg;
            --home-info-shift-x: 0rem;
            --home-receipt-left-nudge: 0rem;
            --home-receipt-offset-x: -50%;
            --home-receipt-origin: center top;
            --home-receipt-top-nudge: 0.24rem;
            --home-receipt-width: min(28rem, calc(100vw - 6rem));
            --home-meadow-height: 6.9rem;
          }

          .homeCookieReceiptPaper {
            min-height: 12rem;
          }
        }

        @media (min-width: 900px) and (max-width: 1279px) {
          .homeCookieShowcase {
            --control-gap: 0.95rem;
            --control-size: clamp(3.1rem, 4.4vw, 3.8rem);
            --cookie-size: clamp(12rem, 20vw, 14.75rem);
            --copy-bottom: clamp(1rem, 3vw, 1.5rem);
            --copy-width: min(82vw, 34rem);
            --cta-font-size: clamp(1.05rem, 1.55vw, 1.25rem);
            --cta-padding-x: 1.45rem;
            --cta-width: clamp(9.75rem, 17vw, 11.75rem);
            --home-body-lift: 0.95rem;
            --home-body-rotate: -4deg;
            --home-info-lift: calc(var(--cookie-size) * 0.62);
            --home-info-rotate-mid: -6deg;
            --home-info-rotate-end: -2deg;
            --home-info-shift-x: 0rem;
            --home-receipt-left-nudge: 0rem;
            --home-receipt-offset-x: -50%;
            --home-receipt-origin: center top;
            --home-receipt-top-nudge: 0.24rem;
            --home-receipt-width: min(34rem, calc(100vw - 8rem));
            --home-meadow-height: 7.4rem;
          }

          .homeCookieReceiptPaper {
            min-height: 12rem;
          }
        }

        @media (min-width: 1280px) and (max-width: 1535px) {
          .homeCookieShowcase {
            --control-gap: 1rem;
            --control-size: clamp(3.25rem, 4vw, 4rem);
            --cookie-size: clamp(12.75rem, 18vw, 15.5rem);
            --copy-bottom: clamp(1rem, 2.4vw, 1.65rem);
            --copy-width: min(78vw, 38rem);
            --cta-font-size: clamp(1.1rem, 1.4vw, 1.35rem);
            --cta-padding-x: 1.55rem;
            --cta-width: clamp(10rem, 15vw, 12.25rem);
            --home-body-lift: 0.95rem;
            --home-body-rotate: -4deg;
            --home-info-lift: calc(var(--cookie-size) * 0.64);
            --home-info-rotate-mid: -6deg;
            --home-info-rotate-end: -2deg;
            --home-info-shift-x: 0rem;
            --home-receipt-left-nudge: 0rem;
            --home-receipt-offset-x: -50%;
            --home-receipt-origin: center top;
            --home-receipt-top-nudge: 0.26rem;
            --home-receipt-width: min(38rem, calc(100vw - 10rem));
            --home-meadow-height: 7.9rem;
          }

          .homeCookieReceiptPaper {
            min-height: 12rem;
          }
        }

        @media (min-width: 1536px) {
          .homeCookieShowcase {
            --control-gap: 1.15rem;
            --control-size: clamp(3.35rem, 3.6vw, 4.15rem);
            --cookie-size: clamp(13.5rem, 16vw, 17rem);
            --copy-bottom: clamp(1.1rem, 2vw, 1.8rem);
            --copy-width: min(70vw, 42rem);
            --cta-font-size: clamp(1.15rem, 1.2vw, 1.4rem);
            --cta-padding-x: 1.7rem;
            --cta-width: clamp(10.5rem, 13vw, 13rem);
            --home-body-lift: 0.95rem;
            --home-body-rotate: -4deg;
            --home-info-lift: calc(var(--cookie-size) * 0.66);
            --home-info-rotate-mid: -6deg;
            --home-info-rotate-end: -2deg;
            --home-info-shift-x: 0rem;
            --home-receipt-left-nudge: 0rem;
            --home-receipt-offset-x: -50%;
            --home-receipt-origin: center top;
            --home-receipt-top-nudge: 0.3rem;
            --home-receipt-width: min(42rem, calc(100vw - 12rem));
            --home-meadow-height: 8.4rem;
          }

          .homeCookieReceiptPaper {
            min-height: 12rem;
          }
        }
      `}</style>
    </section>
  )
}
