'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'

import type { CookiePosterAsset } from './shop/cookiePosterData'
import { CookieSheepRig } from './shop/cookie-sheep-rig'

type HomeCookieCarouselProps = {
  posters: CookiePosterAsset[]
}

type CarouselTransition = {
  direction: -1 | 1
  outgoingIndex: number
} | null

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

export function HomeCookieCarousel({ posters }: HomeCookieCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [cookieCenterPx, setCookieCenterPx] = useState<number | null>(null)
  const [grassDropPx, setGrassDropPx] = useState(0)
  const [transition, setTransition] = useState<CarouselTransition>(null)

  const [nameButtonWidth, setNameButtonWidth] = useState<number | null>(null)

  const activeIndexRef = useRef(0)
  const isTransitioningRef = useRef(false)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const pendingDirectionRef = useRef<-1 | 1 | null>(null)
  const rigShellRef = useRef<HTMLDivElement | null>(null)
  const sceneFrameRef = useRef<HTMLDivElement | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

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

      const grassVisibleHeightRatio =
        viewportWidth < 640 ? grassVisibleHeightRatioMobile : grassVisibleHeightRatioDesktop
      const grassCrestHeightPx = viewportWidth * grassVisibleHeightRatio
      const allowedCrestHeightPx = sceneHeight * grassCrestLimitRatio
      const visibleGrassHeightPx = Math.min(grassCrestHeightPx, allowedCrestHeightPx)
      const crestTopPx = sceneHeight - visibleGrassHeightPx
      const overlapRatio =
        viewportWidth < 640 ? 0.04 : viewportWidth < 900 ? 0.27 : viewportWidth < 1280 ? 0.25 : 0.24

      setGrassDropPx(Math.max(0, grassCrestHeightPx - allowedCrestHeightPx))

      if (!rigSize) {
        setCookieCenterPx(null)
        return
      }

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
  }, [])

  if (!posters.length) {
    return null
  }

  const activePoster = posters[activeIndex]
  const outgoingPoster = transition ? posters[transition.outgoingIndex] : null
  const transitionVariant = transition?.direction === 1 ? 'next' : 'prev'
  const rigTop = cookieCenterPx != null ? `${cookieCenterPx}px` : `calc(54% - ${sceneLiftPx}px)`
  const hasMultiplePosters = posters.length > 1

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

  return (
    <section
      aria-label="Cookie showcase"
      aria-roledescription="carousel"
      className="home-page-placeholder homeCookieShowcase relative flex flex-col px-4 pt-4 md:px-8"
      style={showcaseStyle}
    >
      <div className="homeCookieBackdrop absolute inset-0" />

      <div aria-hidden="true" className="homeCookiePaperStage homeCookiePaperStage--sky">
        {paperCloudOverlays.map((overlay) => overlay.render())}
      </div>

      <div className="relative z-10 mx-auto flex w-full flex-1 flex-col max-w-6xl">
        <div className="homeCookieStage relative flex-1">
          <div className="homeCookieSceneFrame absolute inset-0" ref={sceneFrameRef}>
            {transition && outgoingPoster ? (
              <>
                <div
                  className={`homeCookieRigShell homeCookieRigShell--outgoing homeCookieRigShell--${transitionVariant} absolute left-1/2`}
                  style={{ top: rigTop }}
                >
                  <CookieSheepRig
                    bodyFallbackSrc={outgoingPoster.bodyFallbackSrc}
                    className="top-1/2 bottom-auto -translate-y-1/2"
                    href={outgoingPoster.href}
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
                    href={activePoster.href}
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
                  bodyFallbackSrc={activePoster.bodyFallbackSrc}
                  className="top-1/2 bottom-auto -translate-y-1/2"
                  href={activePoster.href}
                  image={activePoster.image}
                  title={activePoster.title}
                />
              </div>
            )}

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
          </div>

          <div
            aria-hidden="true"
            className="homeCookieNameMeasure"
            ref={measureRef}
          >
            {posters.map((p) => (
              <span className="homeCookieNameButton" key={p.href}>
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

              <Link
                className="homeCookieNameButton"
                href={activePoster.href}
                style={nameButtonWidth ? { width: `${nameButtonWidth}px` } : undefined}
              >
                {activePoster.title}
              </Link>

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
          --copy-bottom: clamp(1rem, 3.8vw, 2.2rem);
          background: linear-gradient(to bottom, var(--showcase-sky) 55%, #4a7a3b 100%);
          color: var(--showcase-ink);
          overflow: visible;
        }

        .homeCookieBackdrop {
          background: linear-gradient(to bottom, var(--showcase-sky) 60%, #4a7a3b 100%);
        }

        .homeCookieStage {
          min-height: var(--stage-min-height);
          overflow: visible;
        }

        .homeCookieSceneFrame {
          left: 50%;
          overflow: visible;
          right: auto;
          transform: translateX(-50%);
          width: 100vw;
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
          color: rgba(23, 52, 31, 0.68);
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          margin-top: 0.95rem;
          text-transform: uppercase;
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
            --cookie-size: clamp(10.5rem, 43vw, 12.75rem);
            --copy-bottom: clamp(3rem, 10vh, 5.5rem);
            --copy-width: min(86vw, 21rem);
            --cta-font-size: 0.88rem;
            --cta-padding-x: 1rem;
            --cta-width: clamp(7rem, 26vw, 8.5rem);
            --stage-min-height: 24rem;
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
            --stage-min-height: clamp(24rem, 52vh, 29rem);
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
            --stage-min-height: clamp(24rem, 48vh, 30rem);
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
            --stage-min-height: clamp(24rem, 50vh, 32rem);
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
            --stage-min-height: clamp(25rem, 52vh, 34rem);
          }
        }
      `}</style>
    </section>
  )
}
