'use client'

import { X } from 'lucide-react'
import Image from 'next/image'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
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
  const [pulse, setPulse] = useState<{ id: string; n: number } | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({ visibility: 'hidden' })
  const focusFirstTileRef = useRef(false)
  const items = sceneSpawnablesByScene[sceneTone] ?? sceneSpawnablesByScene.classic
  const total = items.reduce((sum, item) => sum + (counts[item.id] ?? 0), 0)

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
      const width = panel.offsetWidth
      const height = panel.scrollHeight
      const preferredLeft = align === 'end' ? rect.right - width : rect.left
      const left = Math.min(
        Math.max(viewportMargin, preferredLeft),
        window.innerWidth - width - viewportMargin,
      )
      const below = rect.bottom + triggerGap
      const above = rect.top - triggerGap - height
      const fitsBelow = below + height <= window.innerHeight - viewportMargin
      const top = !fitsBelow && above >= viewportMargin ? above : below

      setPanelStyle({
        left: Math.max(viewportMargin, left),
        maxHeight: Math.max(160, window.innerHeight - top - viewportMargin),
        top,
      })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, { capture: true, passive: true })

    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, { capture: true })
      setPanelStyle({ visibility: 'hidden' })
    }
  }, [align, open, sceneTone])

  useEffect(() => {
    if (!open || !focusFirstTileRef.current) {
      return
    }

    focusFirstTileRef.current = false
    panelRef.current?.querySelector<HTMLButtonElement>('.spawnTrayTile')?.focus()
  }, [open])

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
              id={panelId}
              ref={panelRef}
              role="dialog"
              style={panelStyle}
            >
              <div className="spawnTrayHeader">
                <p className="spawnTrayTitle">Spawn stuff</p>
                <button
                  aria-label="Close spawn tray"
                  className="spawnTrayClose"
                  onClick={() => close(true)}
                  type="button"
                >
                  <X aria-hidden="true" size={14} strokeWidth={2.4} />
                </button>
              </div>
              <div className="spawnTrayGrid" data-wide={items.length > 6 || undefined}>
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
                  {total > 0 ? `${total} on the scene` : 'Tap anything to add it'}
                </span>
                <button
                  className="spawnTrayClear"
                  disabled={total === 0}
                  onClick={onClear}
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
