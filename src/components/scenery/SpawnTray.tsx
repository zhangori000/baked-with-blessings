'use client'

import { Blend, GalleryHorizontal, GripHorizontal, LayoutGrid, PanelRight, X } from 'lucide-react'
import Image from 'next/image'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/utilities/cn'

import type { SceneTone } from './menuHeroScenery'
import { sceneSpawnablesByScene, type SceneSpawnable } from './spawnables'

import './scene-spawn.css'

type SpawnTrayTriggerProps = {
  'aria-controls': string
  'aria-expanded': boolean
  children: ReactNode
  onClick: (event: MouseEvent<HTMLElement>) => void
  ref: Ref<HTMLButtonElement>
}

type SpawnTrayProps = {
  align?: 'end' | 'start'
  counts: Readonly<Record<string, number>>
  onClear: () => void
  onOpenChange: (open: boolean) => void
  onSpawn: (item: SceneSpawnable) => void
  open: boolean
  renderTrigger: (props: SpawnTrayTriggerProps) => ReactNode
  sceneTone: SceneTone
}

export function SpawnTrayTriggerLabel() {
  return (
    <span className="spawnTrayTriggerLabel">
      <Image
        alt=""
        aria-hidden="true"
        className="spawnTrayTriggerIcon"
        height={20}
        src="/spawnables/tray-icon.svg"
        unoptimized
        width={20}
      />
      <span>Spawn stuff</span>
    </span>
  )
}

const viewportMargin = 8
const triggerGap = 8
const keyboardStep = 24
const prefsKey = 'baked-with-blessings-spawn-tray'

type TrayLayout = 'bar' | 'float' | 'side'

type TrayPrefs = {
  layout: TrayLayout | null
  seeThrough: boolean
  side: 'left' | 'right'
}

type TrayPosition = { left: number; top: number }

const defaultPrefs: TrayPrefs = { layout: null, seeThrough: false, side: 'right' }

const layoutOptions: readonly { icon: typeof LayoutGrid; label: string; value: TrayLayout }[] = [
  { icon: LayoutGrid, label: 'Grid', value: 'float' },
  { icon: GalleryHorizontal, label: 'One row', value: 'bar' },
  { icon: PanelRight, label: 'Side panel', value: 'side' },
]

const rememberedPositions: Partial<Record<TrayLayout, TrayPosition>> = {}

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max))

let cachedPrefs: TrayPrefs | null = null
const prefsListeners = new Set<() => void>()

function readPrefs(): TrayPrefs {
  if (cachedPrefs) {
    return cachedPrefs
  }

  try {
    const raw = window.localStorage.getItem(prefsKey)
    const parsed = raw ? (JSON.parse(raw) as Partial<TrayPrefs>) : {}

    cachedPrefs = {
      layout:
        parsed.layout === 'bar' || parsed.layout === 'float' || parsed.layout === 'side'
          ? parsed.layout
          : null,
      seeThrough: parsed.seeThrough === true,
      side: parsed.side === 'left' ? 'left' : 'right',
    }
  } catch {
    cachedPrefs = defaultPrefs
  }

  return cachedPrefs
}

function writePrefs(next: Partial<TrayPrefs>) {
  cachedPrefs = { ...readPrefs(), ...next }

  try {
    window.localStorage.setItem(prefsKey, JSON.stringify(cachedPrefs))
  } catch {}

  for (const listener of prefsListeners) {
    listener()
  }
}

const subscribePrefs = (listener: () => void) => {
  prefsListeners.add(listener)

  return () => {
    prefsListeners.delete(listener)
  }
}

const narrowQuery = '(max-width: 639px)'

const subscribeNarrow = (listener: () => void) => {
  const query = window.matchMedia(narrowQuery)

  query.addEventListener('change', listener)

  return () => query.removeEventListener('change', listener)
}

const readNarrow = () => window.matchMedia(narrowQuery).matches

export function SpawnTray({
  align = 'end',
  counts,
  onClear,
  onOpenChange,
  onSpawn,
  open,
  renderTrigger,
  sceneTone,
}: SpawnTrayProps) {
  const panelId = useId()
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const placeRef = useRef<() => void>(() => {})
  const dragRef = useRef<{ dx: number; dy: number; pointerId: number } | null>(null)
  const [pulse, setPulse] = useState<{ id: string; n: number } | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({ visibility: 'hidden' })
  const prefs = useSyncExternalStore(subscribePrefs, readPrefs, () => defaultPrefs)
  const narrow = useSyncExternalStore(subscribeNarrow, readNarrow, () => false)
  const [dragging, setDragging] = useState(false)
  const [edges, setEdges] = useState({ end: false, start: false })
  const focusFirstTileRef = useRef(false)
  const items = sceneSpawnablesByScene[sceneTone] ?? sceneSpawnablesByScene.classic
  const total = items.reduce((sum, item) => sum + (counts[item.id] ?? 0), 0)
  const layout: TrayLayout = prefs.layout ?? (narrow ? 'bar' : 'float')

  const updatePrefs = useCallback((next: Partial<TrayPrefs>) => writePrefs(next), [])

  const close = useCallback(
    (returnFocus: boolean) => {
      onOpenChange(false)

      if (returnFocus) {
        triggerRef.current?.focus()
      }
    },
    [onOpenChange],
  )

  useLayoutEffect(() => {
    if (!open) {
      return
    }

    const place = () => {
      const trigger = triggerRef.current
      const panel = panelRef.current

      if (!trigger || !panel) {
        return
      }

      const rect = trigger.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const width = panel.offsetWidth
      const remembered = rememberedPositions[layout]

      if (layout === 'side') {
        const top = clampNumber(rect.bottom + triggerGap, viewportMargin, viewportHeight * 0.4)
        const docked =
          prefs.side === 'left' ? viewportMargin : viewportWidth - width - viewportMargin
        const left = dragRef.current && remembered ? remembered.left : docked

        setPanelStyle({
          height: viewportHeight - top - viewportMargin,
          left: clampNumber(left, viewportMargin, viewportWidth - width - viewportMargin),
          maxHeight: viewportHeight - top - viewportMargin,
          top,
        })
        return
      }

      const height = panel.scrollHeight

      if (remembered) {
        const top = clampNumber(
          remembered.top,
          viewportMargin,
          viewportHeight - Math.min(height, 160) - viewportMargin,
        )

        setPanelStyle({
          left: clampNumber(
            remembered.left,
            viewportMargin,
            viewportWidth - width - viewportMargin,
          ),
          maxHeight: Math.max(160, viewportHeight - top - viewportMargin),
          top,
        })
        return
      }

      const preferredLeft =
        viewportWidth < 640
          ? (viewportWidth - width) / 2
          : align === 'end'
            ? rect.right - width
            : rect.left
      const left = clampNumber(
        preferredLeft,
        viewportMargin,
        viewportWidth - width - viewportMargin,
      )
      const below = rect.bottom + triggerGap
      const above = rect.top - triggerGap - height
      const fitsBelow = below + height <= viewportHeight - viewportMargin
      const top = !fitsBelow && above >= viewportMargin ? above : below

      setPanelStyle({
        left,
        maxHeight: Math.max(160, viewportHeight - top - viewportMargin),
        top,
      })
    }

    placeRef.current = place
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, { capture: true, passive: true })

    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, { capture: true })
      setPanelStyle({ visibility: 'hidden' })
    }
  }, [align, layout, open, prefs.side, sceneTone])

  useEffect(() => {
    if (!open || !focusFirstTileRef.current || panelStyle.visibility === 'hidden') {
      return
    }

    focusFirstTileRef.current = false
    panelRef.current?.querySelector<HTMLButtonElement>('.spawnTrayTile')?.focus()
  }, [open, panelStyle])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      const active = document.activeElement
      const focusInside =
        active === triggerRef.current || (active && panelRef.current?.contains(active))

      if (focusInside || active === document.body) {
        close(Boolean(focusInside))
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [close, open])

  const measureEdges = useCallback(() => {
    const grid = gridRef.current

    if (!grid || layout !== 'bar') {
      setEdges((current) => (current.start || current.end ? { end: false, start: false } : current))
      return
    }

    const start = grid.scrollLeft > 4
    const end = grid.scrollLeft + grid.clientWidth < grid.scrollWidth - 4

    setEdges((current) =>
      current.start === start && current.end === end ? current : { end, start },
    )
  }, [layout])

  useEffect(() => {
    if (!open) {
      return
    }

    const frame = window.requestAnimationFrame(measureEdges)
    window.addEventListener('resize', measureEdges)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', measureEdges)
    }
  }, [measureEdges, open, panelStyle, items.length])

  useEffect(() => {
    const grid = gridRef.current

    if (!open || layout !== 'bar' || !grid) {
      return
    }

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return
      }

      event.preventDefault()
      grid.scrollLeft += event.deltaY
    }

    grid.addEventListener('wheel', handleWheel, { passive: false })

    return () => grid.removeEventListener('wheel', handleWheel)
  }, [layout, open, panelStyle])

  const moveTo = useCallback(
    (left: number, top: number) => {
      rememberedPositions[layout] = { left, top }
      placeRef.current()
    },
    [layout],
  )

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button:not(.spawnTrayGrip)')) {
      return
    }

    const panel = panelRef.current

    if (!panel) {
      return
    }

    const rect = panel.getBoundingClientRect()

    event.preventDefault()
    dragRef.current = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      pointerId: event.pointerId,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }

  const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    moveTo(event.clientX - drag.dx, event.clientY - drag.dy)
  }

  const handleDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    setDragging(false)

    if (layout === 'side') {
      const panel = panelRef.current
      const center = panel
        ? panel.getBoundingClientRect().left + panel.offsetWidth / 2
        : window.innerWidth
      dragRef.current = null
      delete rememberedPositions.side
      updatePrefs({ side: center < window.innerWidth / 2 ? 'left' : 'right' })
      placeRef.current()
      return
    }

    dragRef.current = null
  }

  const handleGripKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const panel = panelRef.current

    if (!panel) {
      return
    }

    if (layout === 'side') {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        updatePrefs({ side: event.key === 'ArrowLeft' ? 'left' : 'right' })
      }
      return
    }

    const step = event.shiftKey ? keyboardStep * 4 : keyboardStep
    const offsets: Record<string, readonly [number, number]> = {
      ArrowDown: [0, step],
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
    }
    const offset = offsets[event.key]

    if (event.key === 'Home') {
      event.preventDefault()
      delete rememberedPositions[layout]
      placeRef.current()
      return
    }

    if (!offset) {
      return
    }

    event.preventDefault()
    const rect = panel.getBoundingClientRect()
    moveTo(rect.left + offset[0], rect.top + offset[1])
  }

  return (
    <>
      {renderTrigger({
        'aria-controls': panelId,
        'aria-expanded': open,
        children: <SpawnTrayTriggerLabel />,
        onClick: (event) => {
          focusFirstTileRef.current = !open && event.detail === 0
          onOpenChange(!open)
        },
        ref: triggerRef,
      })}
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              aria-label="Spawn stuff"
              aria-modal="false"
              className="spawnTray"
              data-dragging={dragging || undefined}
              data-layout={layout}
              data-see-through={prefs.seeThrough || undefined}
              data-side={layout === 'side' ? prefs.side : undefined}
              id={panelId}
              ref={panelRef}
              role="dialog"
              style={panelStyle}
            >
              <div
                className="spawnTrayHeader"
                onPointerCancel={handleDragEnd}
                onPointerDown={handleDragStart}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
              >
                <button
                  aria-label={
                    layout === 'side'
                      ? 'Move tray. Drag it, or use the left and right arrow keys to switch sides.'
                      : 'Move tray. Drag it, or use the arrow keys. Home puts it back.'
                  }
                  className="spawnTrayGrip"
                  onKeyDown={handleGripKey}
                  title="Drag to move"
                  type="button"
                >
                  <GripHorizontal aria-hidden="true" size={16} strokeWidth={2.4} />
                </button>
                <p className="spawnTrayTitle">Spawn stuff</p>
                <div className="spawnTrayTools">
                  <div aria-label="Tray layout" className="spawnTrayLayouts" role="group">
                    {layoutOptions.map((option) => {
                      const Icon = option.icon

                      return (
                        <button
                          aria-label={option.label}
                          aria-pressed={layout === option.value}
                          className="spawnTrayTool"
                          key={option.value}
                          onClick={() => {
                            delete rememberedPositions[option.value]
                            updatePrefs({ layout: option.value })
                          }}
                          title={option.label}
                          type="button"
                        >
                          <Icon aria-hidden="true" size={15} strokeWidth={2.2} />
                        </button>
                      )
                    })}
                  </div>
                  <button
                    aria-label="See-through"
                    aria-pressed={prefs.seeThrough}
                    className="spawnTrayTool"
                    onClick={() => updatePrefs({ seeThrough: !prefs.seeThrough })}
                    title="See-through"
                    type="button"
                  >
                    <Blend aria-hidden="true" size={15} strokeWidth={2.2} />
                  </button>
                  <button
                    aria-label="Close spawn tray"
                    className="spawnTrayClose"
                    onClick={() => close(true)}
                    type="button"
                  >
                    <X aria-hidden="true" size={14} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
              <div
                className="spawnTrayGrid"
                data-edge-end={edges.end || undefined}
                data-edge-start={edges.start || undefined}
                data-wide={items.length > 6 || undefined}
                onScroll={measureEdges}
                ref={gridRef}
              >
                {items.map((item) => {
                  const count = counts[item.id] ?? 0
                  const pulseKey = pulse?.id === item.id ? pulse.n : 0

                  return (
                    <button
                      aria-label={`Spawn ${item.label.toLowerCase()}${count ? `, ${count} on the scene` : ''}`}
                      className="spawnTrayTile"
                      key={item.id}
                      onClick={() => {
                        onSpawn(item)
                        setAnnouncement(
                          `${item.label} added, ${count + (item.burst ?? 1)} on the scene`,
                        )
                        setPulse((current) => ({ id: item.id, n: (current?.n ?? 0) + 1 }))
                      }}
                      type="button"
                    >
                      <span
                        className={cn(
                          'spawnTrayTileIcon',
                          pulseKey > 0 && 'spawnTrayTileIcon--pop',
                        )}
                        key={pulseKey}
                      >
                        <Image
                          alt=""
                          aria-hidden="true"
                          height={48}
                          src={item.icon}
                          unoptimized
                          width={48}
                        />
                      </span>
                      <span className="spawnTrayTileLabel">{item.label}</span>
                      {count > 0 ? (
                        <span aria-hidden="true" className="spawnTrayTileCount">
                          {count}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
              <span aria-live="polite" className="sr-only">
                {announcement}
              </span>
              <div className="spawnTrayFooter">
                <span className="spawnTrayHint">
                  {total > 0
                    ? `${total} on the scene`
                    : layout === 'bar' && edges.end
                      ? 'Swipe for more'
                      : 'Tap anything to add it'}
                </span>
                <button
                  className="spawnTrayClear"
                  disabled={total === 0}
                  onClick={() => {
                    panelRef.current?.querySelector<HTMLButtonElement>('.spawnTrayTile')?.focus()
                    onClear()
                  }}
                  type="button"
                >
                  Clear all
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
