'use client'

import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import Image from 'next/image'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

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
import { BakeryAction, BakeryCard, BakeryPressable } from '@/design-system/bakery'
import type { CookiePosterAsset, CookieInfoRichText } from './menu/_components/cookiePosterData'
import { CookieSheepRig } from './menu/_components/cookie-sheep-rig'

type HomeCookieCarouselProps = {
  initialSceneryTone?: SceneTone
  posters: CookiePosterAsset[]
  sceneVariant?: 'grassland' | 'scenery'
}

type CarouselTransition = {
  direction: -1 | 1
  outgoingIndex: number
} | null

type CarouselInfoPhase = 'hidden' | 'ready' | 'open'

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

type InfoTextNode = {
  format?: number
  text?: string
  type?: string
}

type InfoElementNode = {
  children?: InfoTextNode[]
  tag?: string
  type?: string
}

const isInfoTextNode = (node: unknown): node is InfoTextNode =>
  Boolean(node && typeof node === 'object' && (node as InfoTextNode).type === 'text')

const isInfoElementNode = (node: unknown): node is InfoElementNode =>
  Boolean(node && typeof node === 'object' && 'type' in node)

const renderInfoTextNodes = (nodes: InfoTextNode[] | undefined) =>
  nodes?.map((node, index) => {
    if (!isInfoTextNode(node) || !node.text) {
      return null
    }

    return node.format && (node.format & 1) === 1 ? (
      <strong key={`${node.text}-${index}`}>{node.text}</strong>
    ) : (
      <span key={`${node.text}-${index}`}>{node.text}</span>
    )
  }) ?? null

function CookieInfoRichText({ data }: { data: CookieInfoRichText }) {
  const nodes = data.root?.children ?? []

  return (
    <>
      {nodes.map((node, index) => {
        if (!isInfoElementNode(node)) {
          return null
        }

        if (node.type === 'heading') {
          return <h4 key={index}>{renderInfoTextNodes(node.children)}</h4>
        }

        return <p key={index}>{renderInfoTextNodes(node.children)}</p>
      })}
    </>
  )
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

const JUMP_DURATION_MS = 280
const MOBILE_JUMP_DURATION_MS = 175
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

const buildShowcaseFlowerStyleFromSeed = (
  key: string,
  left: string,
  scale: number,
  bottom = '0%',
): CSSProperties => {
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
    bottom,
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
    style: buildShowcaseFlowerStyleFromSeed(
      `hero-spawn-${accent.id}`,
      accent.left,
      accent.scale,
      accent.bottom,
    ),
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
  const spawnDesigns =
    menuCloudSpawnDesignsByScene[sceneTone] ?? menuCloudSpawnDesignsByScene.classic
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
      accent.bottom,
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
const cookiePreloadNeighborOffsets = [-3, -2, -1, 0, 1, 2, 3]
const resolveCookieBodyImageSrc = (poster: CookiePosterAsset | null | undefined) => {
  if (!poster) {
    return null
  }

  if (poster.image?.url) {
    return poster.image.url
  }

  return poster.bodyFallbackSrc
}
export function HomeCookieCarousel({
  initialSceneryTone = 'classic',
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
  const [sceneTone, setSceneTone] = usePersistentMenuSceneTone(initialSceneryTone)
  const [spawnedSceneClouds, setSpawnedSceneClouds] = useState<ShowcaseSceneCloud[]>([])
  const [spawnedSceneFlowers, setSpawnedSceneFlowers] = useState<ShowcaseSceneFlower[]>([])
  const [transition, setTransition] = useState<CarouselTransition>(null)
  const [infoPhase, setInfoPhase] = useState<CarouselInfoPhase>('hidden')
  const [nameButtonWidth, setNameButtonWidth] = useState<number | null>(null)
  const activeIndexRef = useRef(0)
  const addedStateTimeoutRef = useRef<number | null>(null)
  const isTransitioningRef = useRef(false)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const pendingDirectionRef = useRef<-1 | 1 | null>(null)
  const preloadedCookieBodySrcsRef = useRef<Set<string>>(new Set())
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
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || posters.length === 0) {
      return
    }

    const sources = Array.from(
      new Set(
        cookiePreloadNeighborOffsets
          .map((offset) => posters[wrapIndex(activeIndex + offset, posters.length)])
          .map(resolveCookieBodyImageSrc)
          .filter((src): src is string => Boolean(src)),
      ),
    )

    if (sources.length === 0) {
      return
    }

    sources.forEach((src) => {
      if (preloadedCookieBodySrcsRef.current.has(src)) {
        return
      }

      const image = new window.Image()
      const markSettled = () => {
        preloadedCookieBodySrcsRef.current.add(src)
      }

      image.onload = markSettled
      image.onerror = markSettled
      image.src = src
    })
  }, [activeIndex, posters])
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

    setInfoPhase(transition ? 'hidden' : 'ready')
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
          viewportWidth < 640
            ? 0.56
            : viewportWidth < 900
              ? 0.58
              : viewportWidth < 1280
                ? 0.595
                : 0.605
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
  const previousMountedPoster = hasMultiplePosters
    ? posters[wrapIndex(activeIndex - 1, posters.length)]
    : null
  const nextMountedPoster = hasMultiplePosters
    ? posters[wrapIndex(activeIndex + 1, posters.length)]
    : null
  const staticSceneClouds = sceneVariant === 'scenery' ? buildStaticShowcaseClouds(sceneTone) : []
  const staticScenePieces =
    sceneVariant === 'scenery'
      ? (menuHeroPiecesByScene[sceneTone] ?? menuHeroPiecesByScene.classic)
      : []
  const staticSceneCritters =
    sceneVariant === 'scenery'
      ? (menuHeroCrittersByScene[sceneTone] ?? menuHeroCrittersByScene.classic)
      : []
  const sectionStyle =
    sceneVariant === 'scenery'
      ? ({
          ...showcaseStyle,
          ['--home-flower-seam' as string]: menuHeroFlowerSeamByScene[sceneTone],
          ['--home-scene-charge' as string]: menuSceneButtonAuraByScene[sceneTone],
          ['--home-price-color' as string]: menuScenePriceColorByScene[sceneTone],
          ['--home-price-shadow' as string]: menuScenePriceShadowByScene[sceneTone],
        } as CSSProperties)
      : showcaseStyle

  const isActivePosterPromptState = cartPromptState.slug === activePoster.slug
  const activePosterPromptPhase = isActivePosterPromptState ? cartPromptState.phase : 'idle'
  const activePosterCanAddToCart = typeof activePoster.productId === 'number'
  const isInfoPromptOpen = infoPhase === 'open'
  const shouldShowInlineInfoControl = sceneVariant === 'scenery' && infoPhase !== 'hidden'
  const isCartPromptOpen =
    activePosterPromptPhase === 'open' ||
    activePosterPromptPhase === 'loading' ||
    activePosterPromptPhase === 'added'
  const getJumpDurationMs = () =>
    typeof window !== 'undefined' && window.innerWidth < 640
      ? MOBILE_JUMP_DURATION_MS
      : JUMP_DURATION_MS

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

      timeoutRef.current = window.setTimeout(finishTransition, getJumpDurationMs())
    })
  }

  const startCloseInfo = () => {
    setInfoPhase('ready')
  }

  const startOpenInfo = () => {
    setInfoPhase('open')
  }

  const handleInfoControlClick = () => {
    if (infoPhase === 'open') {
      startCloseInfo()
      return
    }

    startOpenInfo()
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

    timeoutRef.current = window.setTimeout(finishTransition, getJumpDurationMs())
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

  const renderInfoPrompt = (id: string) =>
    isInfoPromptOpen ? (
      <BakeryCard
        aria-label={`${activePoster.title} info`}
        className="homeCookieCartPrompt homeCookieInfoPrompt"
        id={id}
        radius="lg"
        role="dialog"
        spacing="none"
        tone="transparent"
      >
        <BakeryPressable
          aria-label={`Close info for ${activePoster.title}`}
          className="homeCookieCartPromptClose homeCookieInfoPromptClose"
          onClick={startCloseInfo}
          type="button"
        >
          <X aria-hidden="true" size={14} />
        </BakeryPressable>
        <div className="homeCookieInfoPromptBody">
          <CookieInfoRichText data={activePoster.receiptBody} />
        </div>
      </BakeryCard>
    ) : null

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
                <picture className="homeCookieSceneSky" style={{ position: 'absolute' }}>
                  {menuHeroMobileSkyByScene[sceneTone] ? (
                    <source
                      media="(max-width: 767px)"
                      srcSet={menuHeroMobileSkyByScene[sceneTone]}
                    />
                  ) : null}
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="object-cover"
                    draggable="false"
                    fill
                    priority
                    sizes="100vw"
                    src={menuHeroSkyByScene[sceneTone]}
                    unoptimized
                  />
                </picture>

                {staticSceneClouds.map((cloud) => (
                  <Image
                    alt=""
                    aria-hidden="true"
                    className={`homeCookieSceneCloud ${cloud.className ?? ''}`}
                    draggable="false"
                    key={cloud.id}
                    height={400}
                    src={cloud.src}
                    style={cloud.style}
                    unoptimized
                    width={800}
                  />
                ))}

                {spawnedSceneClouds.map((cloud) => (
                  <Image
                    alt=""
                    aria-hidden="true"
                    className={`homeCookieSceneCloud ${cloud.className ?? ''}`}
                    draggable="false"
                    key={cloud.id}
                    height={400}
                    src={cloud.src}
                    style={cloud.style}
                    unoptimized
                    width={800}
                  />
                ))}

                {staticScenePieces.map((piece, index) => (
                  <Image
                    alt=""
                    aria-hidden="true"
                    className={`homeCookieScenePiece ${piece.className}`}
                    draggable="false"
                    height={1200}
                    key={`piece-${sceneTone}-${index}-${piece.src}`}
                    src={piece.src}
                    style={piece.style}
                    unoptimized
                    width={1200}
                  />
                ))}

                {staticSceneCritters.map((critter, index) => (
                  <Image
                    alt=""
                    aria-hidden="true"
                    className={`homeCookieScenePiece ${critter.className}`}
                    draggable="false"
                    height={320}
                    key={`critter-${sceneTone}-${index}-${critter.src}`}
                    src={critter.src}
                    style={critter.style}
                    unoptimized
                    width={320}
                  />
                ))}

                <div className="homeCookieSceneActions">
                  {shouldShowInlineInfoControl ? (
                    <div className="homeCookieInfoDock homeCookieInfoDock--inline">
                      {renderInfoPrompt(`home-cookie-info-inline-${activePoster.slug}`)}
                      <BakeryPressable
                        aria-controls={`home-cookie-info-inline-${activePoster.slug}`}
                        aria-expanded={isInfoPromptOpen}
                        className={`homeCookieInfoButton${isInfoPromptOpen ? ' is-active' : ''}`}
                        onClick={handleInfoControlClick}
                        type="button"
                      >
                        {activePoster.infoButtonLabel}
                      </BakeryPressable>
                    </div>
                  ) : null}
                  <BakeryAction
                    className="homeCookieSceneButton"
                    onClick={() => {
                      setSceneTone(getNextMenuSceneTone(sceneTone))
                    }}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    Change scenery
                  </BakeryAction>
                  <BakeryAction
                    className="homeCookieSceneButton"
                    onClick={() =>
                      setSpawnedSceneClouds((current) => [
                        ...current,
                        createShowcaseCloud(sceneTone),
                      ])
                    }
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    {menuSceneCloudLabelByScene[sceneTone]}
                  </BakeryAction>
                  <BakeryAction
                    className="homeCookieSceneButton"
                    onClick={() =>
                      setSpawnedSceneFlowers((current) => [
                        ...current,
                        createShowcaseFlowerForScene(sceneTone),
                      ])
                    }
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    {menuSceneAccentLabelByScene[sceneTone]}
                  </BakeryAction>
                </div>
              </>
            ) : null}

            {previousMountedPoster ? (
              <div
                aria-hidden="true"
                className="homeCookieRigShell homeCookieRigShell--preload homeCookieRigShell--preload-prev absolute left-1/2"
                style={{ top: rigTop }}
              >
                <CookieSheepRig
                  priority
                  bodyFallbackSrc={previousMountedPoster.bodyFallbackSrc}
                  className="top-1/2 bottom-auto -translate-y-1/2"
                  image={previousMountedPoster.image}
                  title={previousMountedPoster.title}
                />
              </div>
            ) : null}

            {nextMountedPoster ? (
              <div
                aria-hidden="true"
                className="homeCookieRigShell homeCookieRigShell--preload homeCookieRigShell--preload-next absolute left-1/2"
                style={{ top: rigTop }}
              >
                <CookieSheepRig
                  priority
                  bodyFallbackSrc={nextMountedPoster.bodyFallbackSrc}
                  className="top-1/2 bottom-auto -translate-y-1/2"
                  image={nextMountedPoster.image}
                  title={nextMountedPoster.title}
                />
              </div>
            ) : null}

            {transition && outgoingPoster ? (
              <>
                <div
                  className={`homeCookieRigShell homeCookieRigShell--outgoing homeCookieRigShell--${transitionVariant} absolute left-1/2`}
                  style={{ top: rigTop }}
                >
                  <CookieSheepRig
                    priority
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
                    priority
                    bodyFallbackSrc={activePoster.bodyFallbackSrc}
                    className="top-1/2 bottom-auto -translate-y-1/2"
                    image={activePoster.image}
                    title={activePoster.title}
                  />
                </div>
              </>
            ) : (
              <div
                className="homeCookieRigShell homeCookieRigShell--active absolute left-1/2"
                ref={rigShellRef}
                style={{ top: rigTop }}
              >
                <CookieSheepRig
                  priority
                  bodyFallbackSrc={activePoster.bodyFallbackSrc}
                  className="top-1/2 bottom-auto -translate-y-1/2"
                  image={activePoster.image}
                  title={activePoster.title}
                />
              </div>
            )}

            {sceneVariant === 'scenery' && infoPhase !== 'hidden' ? (
              <div
                className="homeCookieInfoDock homeCookieInfoDock--floating md:hidden"
                style={{
                  left: '50%',
                  top: `calc(${rigTop} - var(--cookie-size) * var(--mobile-info-offset, 0.66))`,
                }}
              >
                {renderInfoPrompt(`home-cookie-info-floating-${activePoster.slug}`)}
                <BakeryPressable
                  aria-controls={`home-cookie-info-floating-${activePoster.slug}`}
                  aria-expanded={isInfoPromptOpen}
                  className={`homeCookieInfoButton${isInfoPromptOpen ? ' is-active' : ''}`}
                  onClick={handleInfoControlClick}
                  type="button"
                >
                  {activePoster.infoButtonLabel}
                </BakeryPressable>
              </div>
            ) : null}

            {sceneVariant === 'scenery' ? (
              <>
                <picture className="homeCookieSceneMeadow" style={{ position: 'absolute' }}>
                  {menuHeroMobileMeadowByScene[sceneTone] ? (
                    <source
                      media="(max-width: 639px)"
                      srcSet={menuHeroMobileMeadowByScene[sceneTone]}
                    />
                  ) : null}
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="object-cover"
                    draggable="false"
                    fill
                    priority
                    sizes="100vw"
                    src={menuHeroMeadowByScene[sceneTone]}
                    unoptimized
                  />
                </picture>
                <div aria-hidden="true" className="homeCookieFlowerRail">
                  {buildShowcaseFlowerRail(sceneTone).map((flower) => (
                    <Image
                      alt=""
                      aria-hidden="true"
                      className="homeCookieFlowerRailBloom"
                      draggable="false"
                      height={180}
                      key={flower.id}
                      src={flower.src}
                      style={flower.style}
                      unoptimized
                      width={180}
                    />
                  ))}
                </div>
                <div aria-hidden="true" className="homeCookieSceneSpawnField">
                  {spawnedSceneFlowers.map((flower) => (
                    <Image
                      alt=""
                      aria-hidden="true"
                      className="homeCookieSceneFlower"
                      draggable="false"
                      height={180}
                      key={flower.id}
                      src={flower.src}
                      style={flower.style}
                      unoptimized
                      width={180}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div aria-hidden="true" className="homeCookieMeadowClip">
                <picture>
                  <source media="(max-width: 639px)" srcSet="/grassland-bigger.png" />
                  <Image
                    alt=""
                    className="homeCookieGrass"
                    draggable="false"
                    height={600}
                    src="/grassland.svg"
                    style={{ bottom: `${-grassDropPx}px` }}
                    unoptimized
                    width={1600}
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

          <div aria-hidden="true" className="homeCookieNameMeasure" ref={measureRef}>
            {posters.map((p) => (
              <span className="homeCookieNameButton" key={p.slug}>
                {p.title}
              </span>
            ))}
          </div>

          <div aria-live="polite" className="homeCookieCopy text-center">
            <div className="homeCookieControls">
              <BakeryPressable
                aria-label="Show previous cookie"
                className="homeCookieArrow"
                disabled={!hasMultiplePosters}
                onClick={() => handleNavigate(-1)}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={22} />
              </BakeryPressable>

              <div className="homeCookieNameButtonShell">
                {isCartPromptOpen ? (
                  <BakeryCard
                    aria-label={`Add ${activePoster.title} to cart`}
                    aria-live="polite"
                    className="homeCookieCartPrompt"
                    radius="lg"
                    role="dialog"
                    spacing="none"
                    tone="transparent"
                  >
                    <BakeryPressable
                      aria-label="Close add to cart prompt"
                      className="homeCookieCartPromptClose"
                      disabled={activePosterPromptPhase === 'loading'}
                      onClick={handleCloseCartPrompt}
                      type="button"
                    >
                      <X aria-hidden="true" size={14} />
                    </BakeryPressable>
                    <p className="homeCookieCartPromptText">
                      {activePosterPromptPhase === 'loading'
                        ? 'Adding cookie to cart...'
                        : activePosterPromptPhase === 'added'
                          ? 'Cookie added to cart.'
                          : 'Add this cookie to cart?'}
                    </p>
                    {activePosterPromptPhase === 'open' ? (
                      <div className="homeCookieCartPromptActions">
                        <BakeryPressable
                          className="homeCookieCartPromptButton homeCookieCartPromptButton--confirm"
                          onClick={handleConfirmAddToCart}
                          type="button"
                        >
                          Yes
                        </BakeryPressable>
                        <BakeryPressable
                          className="homeCookieCartPromptButton homeCookieCartPromptButton--cancel"
                          onClick={handleCloseCartPrompt}
                          type="button"
                        >
                          No
                        </BakeryPressable>
                      </div>
                    ) : null}
                  </BakeryCard>
                ) : null}

                <BakeryPressable
                  aria-label={`Open add to cart prompt for ${activePoster.title}`}
                  className="homeCookieNameButton"
                  disabled={!activePosterCanAddToCart || cartIsLoading}
                  onClick={handleOpenCartPrompt}
                  style={nameButtonWidth ? { width: `${nameButtonWidth}px` } : undefined}
                  type="button"
                >
                  {activePoster.title}
                </BakeryPressable>
              </div>

              <BakeryPressable
                aria-label="Show next cookie"
                className="homeCookieArrow"
                disabled={!hasMultiplePosters}
                onClick={() => handleNavigate(1)}
                type="button"
              >
                <ArrowRight aria-hidden="true" size={22} />
              </BakeryPressable>
            </div>
            <span className="homeCookieAmount">{activePoster.amount}</span>
          </div>
        </div>
      </div>

      <style>{`
        .homeCookieShowcase {
          --control-gap: 1.1rem;
          --control-size: clamp(3.2rem, 6vw, 4.35rem);
          --cookie-size: clamp(13rem, 26vw, 17rem);
          --copy-width: min(92vw, 52rem);
          --cta-font-size: clamp(1.1rem, 2.3vw, 1.6rem);
          --cta-padding-x: 1.6rem;
          --cta-width: clamp(10.25rem, 21vw, 13.5rem);
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

        .homeCookieSceneSpawnField {
          bottom: var(--home-meadow-bottom, -0.15rem);
          height: calc(var(--home-meadow-height) + var(--home-flower-rail-lift, 0rem));
          inset-inline: 0;
          overflow: visible;
          pointer-events: none;
          position: absolute;
          z-index: 16;
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
          flex-wrap: nowrap;
          gap: 0.65rem;
          max-width: min(36rem, calc(100vw - 2rem));
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

        .homeCookieRigShell--incoming,
        .homeCookieRigShell--outgoing {
          pointer-events: none;
        }

        .homeCookieRigShell--preload {
          opacity: 0;
          pointer-events: none;
          z-index: 1;
        }

        .homeCookieRigShell--preload-prev {
          transform: translate3d(-140vw, 0, 0);
        }

        .homeCookieRigShell--preload-next {
          transform: translate3d(140vw, 0, 0);
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

        .homeCookieShowcase .cookieSheepBurstPart {
          opacity: 1;
          transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
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

        .homeCookieInfoDock--inline {
          opacity: 1;
          pointer-events: auto;
          position: relative;
          transform: none;
        }

        .homeCookieInfoDock--floating.is-open,
        .homeCookieInfoDock--floating:not(.is-open) {
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

        .homeCookieInfoButton.is-active {
          background: #fff6d5;
          border-color: rgba(97, 74, 37, 0.26);
          box-shadow: inset 0 0 0 1px rgba(97, 74, 37, 0.08);
          transform: none;
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

        .homeCookieInfoPrompt {
          bottom: calc(100% + 0.9rem);
          max-height: min(20rem, calc(100svh - 8rem));
          min-width: 0;
          overflow: visible;
          padding: 0.95rem 1rem 0.9rem;
          text-align: left;
          width: min(20rem, calc(100vw - 2rem));
          z-index: 52;
        }

        .homeCookieCartPrompt::after,
        .homeCookieInfoPrompt::after {
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

        .homeCookieInfoPromptBody {
          color: #4d391d;
          font-size: 1rem;
          font-weight: 650;
          line-height: 1.34;
          max-height: min(17rem, calc(100svh - 11rem));
          overflow-y: auto;
          padding-right: 2rem;
        }

        .homeCookieInfoPromptBody p,
        .homeCookieInfoPromptBody h4 {
          margin: 0;
        }

        .homeCookieInfoPromptBody p + p,
        .homeCookieInfoPromptBody h4 + p {
          margin-top: 0.68rem;
        }

        .homeCookieInfoPromptBody strong {
          color: #1b1917;
          font-weight: 850;
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
          content: '';
          display: none;
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
            --control-gap: 0.9rem;
            --control-size: clamp(2.78rem, 11.2vw, 3.25rem);
            --cookie-size: clamp(10.5rem, min(46vw, 21svh), 12.35rem);
            --jump-duration: ${MOBILE_JUMP_DURATION_MS}ms;
            --copy-bottom: clamp(0.85rem, 2.4vh, 1.35rem);
            --copy-width: min(calc(100vw - 2.4rem), 18.75rem);
            --cta-font-size: 0.86rem;
            --cta-padding-x: 0.84rem;
            --cta-width: clamp(7.8rem, 36vw, 9.8rem);
            --home-header-underlap: 5.95rem;
            --mobile-info-offset: 0.82;
            --home-meadow-height: 6.4rem;
          }

          .homeCookieSceneActions {
            display: flex;
            flex-wrap: nowrap;
            gap: 0.66rem;
            justify-content: center;
            left: 1.4rem;
            max-width: none;
            right: 1.4rem;
            top: calc(var(--home-header-underlap) + 0.82rem);
          }

          .homeCookieSceneButton {
            flex: 0 1 auto;
            font-size: 0.74rem;
            line-height: 1.05;
            min-height: 1.86rem;
            padding: 0.42rem 0.78rem;
            white-space: nowrap;
            width: auto;
          }

          .homeCookieInfoDock {
            top: calc(${rigTop} - var(--cookie-size) * var(--mobile-info-offset, 1.08));
          }

          .homeCookieInfoDock--inline {
            display: none;
          }

          .homeCookieInfoButton {
            font-size: 0.72rem;
            min-height: 1.68rem;
            padding: 0.34rem 0.7rem;
          }

          .homeCookieSceneCloud {
            max-width: 46vw;
          }

          .homeCookieSceneFlower {
            width: clamp(1.35rem, 4.2vw, 1.8rem);
          }

          .homeCookieFlowerRailBloom {
            width: clamp(1.75rem, 5.1vw, 2.35rem);
          }

          .homeCookieControls {
            display: block;
            gap: var(--control-gap);
            height: var(--control-size);
            margin-inline: auto;
            position: relative;
            width: 100%;
          }

          .homeCookieNameButtonShell {
            display: flex;
            justify-content: center;
            left: 50%;
            max-width: calc(100% - 2 * var(--control-size) - 2 * var(--control-gap));
            min-width: 0;
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%);
          }

          .homeCookieNameButton {
            max-width: 100%;
            min-height: var(--control-size);
            padding-bottom: 0.68rem;
            padding-top: 0.62rem;
          }

          .homeCookieArrow {
            height: var(--control-size);
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: var(--control-size);
          }

          .homeCookieControls > .homeCookieArrow:first-child {
            left: 0;
            right: auto;
          }

          .homeCookieControls > .homeCookieArrow:last-child {
            left: auto;
            right: 0;
          }

          .homeCookieArrow:active:not(:disabled) {
            transform: translateY(calc(-50% + 1px));
          }

          .homeCookieArrow svg {
            height: 1.18rem;
            width: 1.18rem;
          }

          .homeCookieAmount {
            font-size: 0.78rem;
            margin-top: 0.62rem;
          }

          @keyframes homeCookieJumpOutToLeft {
            0%   { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(1); }
            35%  { opacity: 1; transform: translate3d(calc(-50% - 22vw), calc(-50% - 3.7rem), 0) rotate(-8deg) scale(0.95); }
            100% { opacity: 0; transform: translate3d(calc(-50% - 54vw), calc(-50% - 1.1rem), 0) rotate(-18deg) scale(0.82); }
          }

          @keyframes homeCookieJumpOutToRight {
            0%   { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(1); }
            35%  { opacity: 1; transform: translate3d(calc(-50% + 22vw), calc(-50% - 3.7rem), 0) rotate(8deg) scale(0.95); }
            100% { opacity: 0; transform: translate3d(calc(-50% + 54vw), calc(-50% - 1.1rem), 0) rotate(18deg) scale(0.82); }
          }

          @keyframes homeCookieJumpInFromRight {
            0%   { opacity: 1; transform: translate3d(calc(-50% + 38vw), calc(-50% - 2.4rem), 0) rotate(11deg) scale(0.88); }
            52%  { opacity: 1; transform: translate3d(calc(-50% + 12vw), calc(-50% - 3.2rem), 0) rotate(4deg) scale(0.96); }
            100% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(1); }
          }

          @keyframes homeCookieJumpInFromLeft {
            0%   { opacity: 1; transform: translate3d(calc(-50% - 38vw), calc(-50% - 2.4rem), 0) rotate(-11deg) scale(0.88); }
            52%  { opacity: 1; transform: translate3d(calc(-50% - 12vw), calc(-50% - 3.2rem), 0) rotate(-4deg) scale(0.96); }
            100% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(1); }
          }

          .homeCookieScene-blossom .homeCookieSceneSky {
            object-position: 16% center;
          }

          .homeCookieScene-blossom {
            --home-flower-rail-lift: 9rem;
          }

          .homeCookieScene-classic {
            --home-flower-rail-lift: 7.2rem;
            --home-meadow-height: 15.6rem;
          }

          .homeCookieScene-dawn {
            --home-flower-rail-lift: 7.35rem;
            --home-meadow-height: 16.05rem;
          }

          .homeCookieScene-under-tree {
            --home-flower-rail-lift: 6.24rem;
            --home-meadow-height: 15.24rem;
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
            --home-flower-rail-lift: 5.35rem;
            --home-meadow-bottom: -0.15rem;
            --home-meadow-height: 15.2rem;
          }

          .homeCookieScene-moonlit .homeCookieFlowerRailBloom {
            width: clamp(1.4rem, 4.4vw, 1.95rem);
          }

          .homeCookieScene-moonlit .homeCookieSceneFlower {
            width: clamp(1.25rem, 4vw, 1.75rem);
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
            --home-meadow-height: 6.9rem;
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
            --home-meadow-height: 7.4rem;
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
            --home-meadow-height: 7.9rem;
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
            --home-meadow-height: 8.4rem;
          }
        }

      `}</style>
    </section>
  )
}
