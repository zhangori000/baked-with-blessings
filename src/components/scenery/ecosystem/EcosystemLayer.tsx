'use client'

import Image from 'next/image'
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/utilities/cn'

import { SpriteParticles } from '../SceneSpawnLayer'
import { ecoAsset } from './assets'
import { DinoRig, riggedDinos } from './DinoRig'
import type { EcosystemStore } from './store'
import type { EcoControlAbilityKey, EcoControlEntityView, EcoEntityView, EcoLayer } from './types'

import '../scene-spawn.css'
import './ecosystem.css'
import './species/blossom.css'
import './species/dawn.css'
import './species/meadow.css'
import './species/night.css'
import './species/prehistoric.css'
import './species/siege.css'
import './species/siege-wizards.css'
import './species/undersea.css'

const EcoThing = memo(function EcoThing({
  store,
  view,
}: {
  store: EcosystemStore
  view: EcoEntityView
}) {
  const attach = useCallback(
    (element: HTMLSpanElement | null) => store.attachNode(view.id, element),
    [store, view.id],
  )
  const health = Math.max(0, Math.min(1, view.health / Math.max(1, view.healthMax)))
  const matchupText = (items: readonly string[]) =>
    items.length ? items.map((item) => item.replaceAll('-', ' ')).join(', ') : 'none'

  return (
    <span
      className={cn('ecoThing', `ecoThing--${view.anchor}`)}
      aria-label={view.controllable ? `${view.label} controls` : undefined}
      data-controllable={view.controllable ? '' : undefined}
      data-controlled={view.controlled ? '' : undefined}
      data-dying={view.dying ? '' : undefined}
      data-rig={riggedDinos.has(view.species) ? 'dino' : undefined}
      data-selected={view.selected ? '' : undefined}
      data-species={view.species}
      onClick={
        view.controllable
          ? (event) => {
              event.stopPropagation()
              store.selectEntity(view.id)
            }
          : undefined
      }
      onKeyDown={
        view.controllable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                store.selectEntity(view.id)
              }
            }
          : undefined
      }
      role={view.controllable ? 'button' : undefined}
      ref={attach}
      style={
        {
          ['--eco-aspect' as string]: view.aspect.toFixed(3),
          ['--eco-size' as string]: view.size.toFixed(2),
        } as CSSProperties
      }
      tabIndex={view.controllable ? 0 : undefined}
    >
      {view.healthMax > 1 ? (
        <span className="ecoHealth" style={{ ['--eco-health' as string]: health.toFixed(3) }}>
          <span className="ecoHealthFill" />
          {view.controlled ? <span className="ecoResourceFill" /> : null}
        </span>
      ) : null}
      {view.buffs.length ? (
        <span className="ecoBuffRack">
          {view.buffs.map((buff) => (
            <span
              className="ecoBuffIcon"
              key={buff.name}
              style={{ ['--eco-buff' as string]: buff.progress.toFixed(3) }}
              title={buff.name}
            >
              {buff.icon}
            </span>
          ))}
        </span>
      ) : null}
      <span className="ecoTelegraph" />
      {view.controlled ? (
        <span className="ecoControlledMarker">
          <span className="ecoControlledArrow">⌄</span>
          <span className="ecoControlledName">{view.label}</span>
        </span>
      ) : null}
      {view.rain ? <span className="ecoRain" /> : null}
      <span className="ecoAnchor">
        <span className="ecoPop">
          <span className="ecoPose">
            {riggedDinos.has(view.species) ? (
              <DinoRig asset={view.asset} species={view.species} />
            ) : (
              <Image
                alt=""
                className={cn('ecoArt', `ecoArt--${view.idle}`)}
                draggable={false}
                height={120}
                src={view.asset}
                unoptimized
                width={120}
              />
            )}
            {view.fuel ? (
              <Image
                alt=""
                className="ecoBurn"
                draggable={false}
                height={70}
                src={ecoAsset('fire')}
                unoptimized
                width={58}
              />
            ) : null}
            {view.particles ? <SpriteParticles particles={view.particles} /> : null}
          </span>
        </span>
        {view.dying ? (
          <Image
            alt=""
            className="ecoPuff"
            draggable={false}
            height={50}
            src={ecoAsset('puff')}
            unoptimized
            width={76}
          />
        ) : null}
      </span>
      {view.selected ? (
        <span className="ecoControlPopover" onClick={(event) => event.stopPropagation()}>
          <span className="ecoControlPopoverHeader">
            <span className="ecoControlPopoverTitle">{view.label}</span>
            <button
              aria-label="Close"
              className="ecoControlPopoverClose"
              onClick={(event) => {
                event.stopPropagation()
                store.dismissSelection()
              }}
              type="button"
            >
              ×
            </button>
          </span>
          <span className="ecoControlPopoverHealth">
            <span
              className="ecoControlPopoverHealthFill"
              style={{ ['--eco-health' as string]: health.toFixed(3) }}
            />
          </span>
          <span className="ecoControlPopoverText">
            Beats {matchupText(view.strong)} · Fears {matchupText(view.weak)}
          </span>
          <button
            className="ecoControlPopoverButton"
            onClick={(event) => {
              event.stopPropagation()
              store.takeControl(view.id)
            }}
            type="button"
          >
            Take control
          </button>
        </span>
      ) : null}
    </span>
  )
})

function ControlHud({
  controlled,
  scene,
  store,
  toast,
}: {
  controlled: EcoControlEntityView | null
  scene: string
  store: EcosystemStore
  toast: string
}) {
  const [hintVisible, setHintVisible] = useState(false)
  const [castKey, setCastKey] = useState<EcoControlAbilityKey | null>(null)
  const [deniedKey, setDeniedKey] = useState<EcoControlAbilityKey | null>(null)
  const [deniedText, setDeniedText] = useState('')
  const followCursor = Boolean(controlled?.followCursor)
  const hintMode =
    controlled?.move === 'swim' ? (followCursor ? 'swim-cursor' : 'swim-arrows') : 'arrows'
  const hintKey = useMemo(() => `bwb-eco-control-hint-${scene}-${hintMode}`, [hintMode, scene])
  const controlledId = controlled?.id ?? null
  const castAbility = useCallback(
    (key: EcoControlAbilityKey) => {
      const ability = controlled?.abilities.find((entry) => entry.key === key)

      if (!ability || ability.cooldownLeft > 0) {
        return
      }

      if (ability.ultimate && ability.resourceFill < 1) {
        setCastKey(key)
        setDeniedKey(key)
        setDeniedText('Charge Final Smash')
        window.setTimeout(() => {
          setCastKey((current) => (current === key ? null : current))
          setDeniedKey((current) => (current === key ? null : current))
          setDeniedText('')
        }, 720)
        return
      }

      store.activateAbility(key)
      setCastKey(key)
      window.setTimeout(() => setCastKey((current) => (current === key ? null : current)), 360)
    },
    [controlled?.abilities, store],
  )
  const releaseAbility = useCallback(
    (key: EcoControlAbilityKey) => {
      store.releaseAbility(key)
    },
    [store],
  )

  useEffect(() => {
    if (!controlledId || !scene) {
      return
    }

    if (window.localStorage.getItem(hintKey) === 'seen') {
      return
    }

    const showTimer = window.setTimeout(() => setHintVisible(true), 0)
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(hintKey, 'seen')
      setHintVisible(false)
    }, 1400)

    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(timer)
    }
  }, [controlledId, hintKey, scene])

  const castAbilityRef = useRef(castAbility)
  const [coarsePointer, setCoarsePointer] = useState(false)

  useEffect(() => {
    if (!controlledId) {
      return
    }

    const root = document.documentElement
    const query = window.matchMedia('(pointer: coarse)')
    const syncPointer = () => setCoarsePointer(query.matches)

    syncPointer()
    query.addEventListener('change', syncPointer)
    root.dataset.ecoControlling = ''

    return () => {
      query.removeEventListener('change', syncPointer)
      delete root.dataset.ecoControlling
    }
  }, [controlledId])

  useEffect(() => {
    castAbilityRef.current = castAbility
  }, [castAbility])

  const releaseAbilityRef = useRef(releaseAbility)

  useEffect(() => {
    releaseAbilityRef.current = releaseAbility
  }, [releaseAbility])

  const hudRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!controlledId) {
      return
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const measure = () => {
      const hud = hudRef.current
      const lines = store.sceneLines()

      if (!hud || !lines) {
        return null
      }

      const rects = [
        ...hud.querySelectorAll<HTMLElement>('.ecoControlCard, .ecoAbilityBar, .ecoDpad'),
      ]
        .map((element) => element.getBoundingClientRect())
        .filter((rect) => rect.height > 0)

      if (!rects.length) {
        return null
      }

      const top = Math.min(...rects.map((rect) => rect.top))
      const bottom = Math.max(...rects.map((rect) => rect.bottom))

      return { bottom, hud, lines, overlap: lines.bottom - top + 12, top }
    }
    let raised: HTMLElement | null = null
    const frame = window.requestAnimationFrame(() => {
      const first = measure()

      if (!first || first.overlap <= 0) {
        return
      }

      const room = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight - window.scrollY,
      )
      const scroll = Math.min(room, first.overlap)

      if (scroll > 0) {
        window.scrollBy({ behavior: reduce ? 'auto' : 'smooth', top: scroll })
      }

      if (scroll >= first.overlap) {
        return
      }

      const clearance = first.lines.ground - scroll - first.lines.unit * 11
      const raise = Math.max(0, Math.min(first.bottom - clearance, first.top - 96))

      raised = first.hud
      raised.style.setProperty('--eco-hud-raise', `${Math.round(raise)}px`)
    })

    return () => {
      window.cancelAnimationFrame(frame)
      raised?.style.removeProperty('--eco-hud-raise')
    }
  }, [controlledId, store])

  useEffect(() => {
    if (!controlledId) {
      return
    }

    const pressed = new Set<string>()
    const abilityPressed = new Set<EcoControlAbilityKey>()
    const sync = () => {
      store.setControlInput({
        x: (pressed.has('ArrowRight') ? 1 : 0) - (pressed.has('ArrowLeft') ? 1 : 0),
        y: (pressed.has('ArrowDown') ? 1 : 0) - (pressed.has('ArrowUp') ? 1 : 0),
      })
    }
    // Leave typing (cart, sign-in fields) and browser shortcuts like Cmd/Ctrl+R alone.
    const ignoreKey = (event: KeyboardEvent) =>
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      (event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, [contenteditable=""], [contenteditable="true"]',
        ) !== null)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (ignoreKey(event)) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        store.releaseControl()
        return
      }

      if (
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight'
      ) {
        event.preventDefault()
        pressed.add(event.key)
        sync()
        return
      }

      const key = event.key.toLowerCase()

      if (key === 'q' || key === 'w' || key === 'e' || key === 'r') {
        event.preventDefault()
        if (event.repeat || abilityPressed.has(key)) {
          return
        }
        abilityPressed.add(key)
        castAbilityRef.current(key)
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      const ignored = ignoreKey(event)

      // Always let go of keys we picked up, even if focus moved into a text field meanwhile.
      if (pressed.delete(event.key)) {
        if (!ignored) event.preventDefault()
        sync()
      }

      const key = event.key.toLowerCase()

      if (key === 'q' || key === 'w' || key === 'e' || key === 'r') {
        const held = abilityPressed.delete(key)

        if (ignored && !held) {
          return
        }

        if (!ignored) event.preventDefault()
        releaseAbilityRef.current(key)
      }
    }
    const handleBlur = () => {
      pressed.clear()
      abilityPressed.clear()
      sync()
    }

    window.addEventListener('keydown', handleKeyDown, { passive: false })
    window.addEventListener('keyup', handleKeyUp, { passive: false })
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      store.setControlInput({ x: 0, y: 0 })
    }
  }, [controlledId, store])

  useEffect(() => {
    if (!controlledId || controlled?.move !== 'swim') {
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' || event.buttons > 0) {
        store.setControlCursorFromClient(
          event.clientX,
          event.clientY,
          event.pointerType === 'mouse' ? undefined : true,
        )
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [controlled?.move, controlledId, store])

  const pressMove = (x: number, y: number) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    store.setControlInput({ x, y })
  }
  const releaseMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    store.setControlInput({ x: 0, y: 0 })
  }
  const abilityPointerDown =
    (ability: EcoControlEntityView['abilities'][number]) =>
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      castAbility(ability.key)
    }
  const abilityPointerUp =
    (ability: EcoControlEntityView['abilities'][number]) =>
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      releaseAbility(ability.key)
    }

  if (!controlled && !toast) {
    return null
  }

  const hudToast = deniedText || toast

  return (
    <div className="ecoControlHud" data-move={controlled?.move} ref={hudRef}>
      {hudToast ? <div className="ecoControlToast">{hudToast}</div> : null}
      {controlled ? (
        <>
          {controlled.move === 'swim' && followCursor ? (
            <div
              className="ecoSwimPad"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                store.setControlCursorFromClient(event.clientX, event.clientY, true)
              }}
              onPointerMove={(event) => {
                if (event.buttons > 0 || event.pointerType !== 'mouse') {
                  store.setControlCursorFromClient(event.clientX, event.clientY, true)
                }
              }}
            />
          ) : null}
          <div className="ecoControlCard">
            <div>
              <p className="ecoControlEyebrow">Controlling</p>
              <p className="ecoControlName">{controlled.label}</p>
              <span
                className="ecoControlResource"
                style={{ ['--eco-resource' as string]: (controlled.resource / 100).toFixed(3) }}
              >
                <span className="ecoControlResourceFill" />
              </span>
            </div>
            {controlled.buffs.length ? (
              <div className="ecoControlBuffs" aria-label="Active buffs">
                {controlled.buffs.map((buff) => (
                  <span
                    className="ecoBuffIcon"
                    key={buff.name}
                    style={{ ['--eco-buff' as string]: buff.progress.toFixed(3) }}
                    title={buff.name}
                  >
                    {buff.icon}
                  </span>
                ))}
              </div>
            ) : null}
            {controlled.move === 'swim' ? (
              <div aria-label="How to steer" className="ecoSteer" role="group">
                <span aria-hidden="true" className="ecoSteerLabel">
                  Steer with
                </span>
                <span className="ecoSteerOptions">
                  <button
                    aria-pressed={followCursor}
                    className="ecoSteerOption"
                    onClick={() => store.setFollowCursor(true)}
                    title={
                      coarsePointer
                        ? 'Drag on the water to swim'
                        : 'Your creature follows your mouse'
                    }
                    type="button"
                  >
                    <span aria-hidden="true" className="ecoSteerIcon">
                      {coarsePointer ? '☝' : '⌖'}
                    </span>
                    {coarsePointer ? 'Drag' : 'Mouse'}
                  </button>
                  <button
                    aria-pressed={!followCursor}
                    className="ecoSteerOption"
                    onClick={() => store.setFollowCursor(false)}
                    title={
                      coarsePointer ? 'Use the arrow pad to swim' : 'Use the arrow keys to swim'
                    }
                    type="button"
                  >
                    <span aria-hidden="true" className="ecoSteerIcon">
                      {coarsePointer ? '✥' : '↔'}
                    </span>
                    {coarsePointer ? 'Pad' : 'Arrows'}
                  </button>
                </span>
              </div>
            ) : null}
            <button className="ecoControlRelease" onClick={store.releaseControl} type="button">
              Release
            </button>
          </div>
          <div aria-label="Move" className="ecoDpad">
            <button
              aria-label="Move up"
              className="ecoDpadButton ecoDpadButton--up"
              onPointerCancel={releaseMove}
              onPointerDown={pressMove(0, -1)}
              onPointerUp={releaseMove}
              type="button"
            >
              ↑
            </button>
            <button
              aria-label="Move left"
              className="ecoDpadButton ecoDpadButton--left"
              onPointerCancel={releaseMove}
              onPointerDown={pressMove(-1, 0)}
              onPointerUp={releaseMove}
              type="button"
            >
              ←
            </button>
            <button
              aria-label="Move right"
              className="ecoDpadButton ecoDpadButton--right"
              onPointerCancel={releaseMove}
              onPointerDown={pressMove(1, 0)}
              onPointerUp={releaseMove}
              type="button"
            >
              →
            </button>
            <button
              aria-label="Move down"
              className="ecoDpadButton ecoDpadButton--down"
              onPointerCancel={releaseMove}
              onPointerDown={pressMove(0, 1)}
              onPointerUp={releaseMove}
              type="button"
            >
              ↓
            </button>
          </div>
          <div className="ecoAbilityBar">
            {controlled.abilities.map((ability) => {
              const cooling = ability.cooldownLeft > 0
              const cooldown =
                ability.cooldown > 0
                  ? Math.max(0, Math.min(1, ability.cooldownLeft / ability.cooldown))
                  : 0
              return (
                <button
                  aria-label={`${ability.key.toUpperCase()}: ${ability.name}`}
                  className="ecoAbilityButton"
                  data-active={castKey === ability.key ? '' : undefined}
                  data-cooling={cooling && ability.ultimate ? '' : undefined}
                  data-charge={ability.chargeable ? '' : undefined}
                  data-denied={deniedKey === ability.key ? '' : undefined}
                  data-locked={ability.locked ? '' : undefined}
                  data-ready={ability.readyFlash ? '' : undefined}
                  data-ultimate={ability.ultimate ? '' : undefined}
                  disabled={cooling && castKey !== ability.key}
                  key={ability.key}
                  onPointerCancel={abilityPointerUp(ability)}
                  onPointerDown={abilityPointerDown(ability)}
                  onPointerUp={abilityPointerUp(ability)}
                  style={
                    {
                      ['--eco-charge' as string]: ability.chargeProgress.toFixed(3),
                      ['--eco-cooldown' as string]: cooldown.toFixed(3),
                      ['--eco-resource' as string]: ability.resourceFill.toFixed(3),
                    } as CSSProperties
                  }
                  title={`${ability.name}${ability.archetype ? ` · ${ability.archetype}` : ''}: ${ability.description}`}
                  type="button"
                >
                  <span className="ecoAbilityIcon">
                    <AbilityGlyph ability={ability} />
                  </span>
                  <span className="ecoAbilityKey">{ability.key.toUpperCase()}</span>
                  <span className="ecoAbilityName">{ability.name}</span>
                  <span className="ecoAbilityCooldown">
                    {cooling && ability.ultimate ? Math.ceil(ability.cooldownLeft).toString() : ''}
                  </span>
                </button>
              )
            })}
          </div>
          {hintVisible ? (
            <button
              className="ecoControlHint"
              onClick={() => {
                window.localStorage.setItem(hintKey, 'seen')
                setHintVisible(false)
              }}
              type="button"
            >
              <span className="ecoHintArrows">
                {controlled.move === 'swim' && followCursor ? '⌖' : coarsePointer ? '✥' : '← ↑ ↓ →'}
              </span>
              <span>
                {controlled.move === 'swim' && followCursor
                  ? `Your ${controlled.label} follows your cursor`
                  : coarsePointer
                    ? 'Use the pad to move'
                    : 'Use arrow keys to move'}
              </span>
              <span className="ecoHintKeys">
                {controlled.abilities.length === 1
                  ? `${coarsePointer ? 'Tap' : 'Press'} Q for ${controlled.abilities[0]!.name}`
                  : coarsePointer
                    ? 'Tap Q basic · hold E to charge'
                    : 'Q basic · hold E to charge · R ultimate'}
              </span>
              {controlled.move === 'swim' ? (
                <span className="ecoHintKeys">
                  {coarsePointer
                    ? 'Prefer buttons? Pick Pad under “Steer with”'
                    : 'Prefer keys? Pick Arrows under “Steer with”'}
                </span>
              ) : null}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

type EcosystemLayerProps = {
  className?: string
  layer: EcoLayer
  store: EcosystemStore
}

function AbilityGlyph({ ability }: { ability: EcoControlEntityView['abilities'][number] }) {
  const id = [ability.icon, ability.name, ability.archetype].filter(Boolean).join(' ').toLowerCase()

  if (id.includes('bite') || id.includes('bone')) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M7 8c5.5 1.1 11.9 1 18 0-2.7 2.6-4.3 5.4-4.8 8.3 1.5 1.8 2.5 4.1 3 6.9-3.4-2.2-5.9-4.8-7.4-7.7-1.5 2.9-4 5.5-7.4 7.7.5-2.8 1.5-5.1 3-6.9C10.8 13.4 9.2 10.6 7 8Z" />
      </svg>
    )
  }

  if (
    id.includes('tail') ||
    id.includes('thagomizer') ||
    id.includes('swipe') ||
    id.includes('thrash') ||
    id.includes('slash') ||
    id.includes('skewer') ||
    id.includes('pinch') ||
    id.includes('claw')
  ) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M5 20c7.8-9.1 15.2-10.7 22.3-4.8-5.8-.5-9.8.7-12.1 3.6l5.1 1.7-6.2 2.1 1.9 5.7-5.5-3.9L5 26.1l2.1-4.4Z" />
      </svg>
    )
  }

  if (id.includes('banner') || id.includes('rally')) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M8 27V5M9 6h15l-3 5 3 5H9" />
        <path d="M8 27h10" />
      </svg>
    )
  }

  if (
    id.includes('arrow') ||
    id.includes('archer') ||
    id.includes('shot') ||
    id.includes('volley')
  ) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M4 17 26 6l-7.6 21-3.5-8.5L4 17Z" />
        <path d="m18.4 18.5 7.3-12.1" />
      </svg>
    )
  }

  if (id.includes('fire') || id.includes('flame') || id.includes('meteor')) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M17.4 3.8c1.6 4.9 5.9 7.4 5.9 13.2A7.3 7.3 0 0 1 8.7 17c0-4 2.1-6.9 6.4-10.9-.2 3.1.5 5.3 2.1 6.6 1.1-2.5 1.2-5.5.2-8.9Z" />
      </svg>
    )
  }

  if (id.includes('ice') || id.includes('frost') || id.includes('blizzard')) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M16 4v24M6.6 9.5l18.8 13M25.4 9.5l-18.8 13" />
        <path d="m11.5 6.2 4.5 4.5 4.5-4.5M11.5 25.8l4.5-4.5 4.5 4.5" />
      </svg>
    )
  }

  if (
    id.includes('thorn') ||
    id.includes('root') ||
    id.includes('flytrap') ||
    id.includes('overgrowth')
  ) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M16 27c-1.4-8.4 2-14.5 10.2-18.3-1.1 7.5-4.5 11.9-10.2 13.1" />
        <path d="M16 27C17.4 18.6 14 12.5 5.8 8.7c1.1 7.5 4.5 11.9 10.2 13.1M16 27V8" />
      </svg>
    )
  }

  if (id.includes('zap') || id.includes('lightning') || id.includes('storm')) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M18.5 3 7.5 17h7L12 29l12.5-16h-7L18.5 3Z" />
      </svg>
    )
  }

  if (id.includes('light') || id.includes('beam') || id.includes('heal')) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M16 4v6M16 22v6M4 16h6M22 16h6M7.5 7.5l4.2 4.2M20.3 20.3l4.2 4.2M24.5 7.5l-4.2 4.2M11.7 20.3l-4.2 4.2" />
        <path d="M16 11.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
      </svg>
    )
  }

  if (
    id.includes('ward') ||
    id.includes('mirror') ||
    id.includes('bubble') ||
    id.includes('prison')
  ) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M16 4 25 8.5v8.2c0 4.7-3 8.5-9 11.3-6-2.8-9-6.6-9-11.3V8.5L16 4Z" />
        <path d="M11 15.7 14.4 19 21 12" />
      </svg>
    )
  }

  if (id.includes('roar') || id.includes('gust') || id.includes('quake')) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M4 19c5.4-4.8 10.8-4.8 16.2 0M7.5 24c4-3.4 8-3.4 12 0M11 13.6c5.4-5 10.9-5 16.4 0M17 8.4c3.5-2.7 7-2.7 10.5 0" />
      </svg>
    )
  }

  if (
    id.includes('frenzy') ||
    id.includes('rush') ||
    id.includes('stampede') ||
    id.includes('blood') ||
    id.includes('sprint')
  ) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M7 23.5 14.1 4l2.1 9 8.8-3.7-5.7 7.5 5.7 2.8-8.3 1.1 1.4 7.3-5.4-5.3L7 23.5Z" />
      </svg>
    )
  }

  if (id.includes('horn') || id.includes('headbutt') || id.includes('charge')) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M5 17c6.2-5.2 12.8-6.9 19.8-5.2L29 7l-1.4 8.6L29 24l-5-4.7C17.6 20.8 11.3 20 5 17Z" />
      </svg>
    )
  }

  if (
    id.includes('block') ||
    id.includes('guard') ||
    id.includes('shield') ||
    id.includes('bash') ||
    id.includes('parry') ||
    id.includes('plate') ||
    id.includes('frill')
  ) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M16 4 26 8.6v7.1c0 5.4-3.4 9.5-10 12.3C9.4 25.2 6 21.1 6 15.7V8.6L16 4Z" />
      </svg>
    )
  }

  if (id.includes('browse') || id.includes('neck')) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M9 26c7.6-7.4 9.5-14.2 5.8-20.4 7.8 2.3 10.4 8.2 7.8 17.7M18.8 8.3c3.6-1.5 6.4-.8 8.2 2.1-4 .6-6.8-.1-8.2-2.1Z" />
      </svg>
    )
  }

  if (
    id.includes('snatch') ||
    id.includes('dive') ||
    id.includes('wing') ||
    id.includes('thermal')
  ) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M4 14.2c8.2-7.4 14.9-6.8 20 1.8 1.5-1.4 3-2 4.5-1.8-1.7 2.9-4.5 5.2-8.3 6.9C14.6 23.5 9.2 21.2 4 14.2Z" />
      </svg>
    )
  }

  if (
    id.includes('scatter') ||
    id.includes('school') ||
    id.includes('bait') ||
    id.includes('dart') ||
    id.includes('lance') ||
    id.includes('pester') ||
    id.includes('swarm') ||
    id.includes('feint')
  ) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M16 15.8 27 8l-7.9 11L24 24l-7.4-2.9L9 27l3.1-7.7L5 13l8.2 1.2L16 5v10.8Z" />
      </svg>
    )
  }

  if (
    id.includes('sting') ||
    id.includes('pulse') ||
    id.includes('puff') ||
    id.includes('toxin') ||
    id.includes('spine')
  ) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M16 4v24M8 9l16 14M24 9 8 23M5 16h22M10 5l12 22M22 5 10 27" />
      </svg>
    )
  }

  if (
    id.includes('ink') ||
    id.includes('camouflage') ||
    id.includes('jet') ||
    id.includes('lure') ||
    id.includes('lantern')
  ) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M16 5c5.4 3.1 8.1 7 8.1 11.7A8.1 8.1 0 0 1 7.9 17C7.9 12.2 10.6 8.2 16 5Z" />
        <path d="M9 23c2.8-1.4 4.6-1.3 5.5.3 1.6-1.5 3.4-1.5 5.5 0 1.2-1.5 2.5-1.7 4-.6" />
      </svg>
    )
  }

  if (
    id.includes('breach') ||
    id.includes('song') ||
    id.includes('gulp') ||
    id.includes('echolocate') ||
    id.includes('ram')
  ) {
    return (
      <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
        <path d="M4 18c5.4-7 12.4-9 21-6l3-3-.8 6.7 2.8 5.4-6.4-1.9C16.1 23.4 9.6 23 4 18Z" />
        <path d="M7 24c4 2.3 8.1 2.3 12.2 0" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="ecoAbilitySvg" viewBox="0 0 32 32">
      <path d="M16 4 20 13h9l-7.2 5.4 2.7 9.6L16 22.5 7.5 28l2.7-9.6L3 13h9l4-9Z" />
    </svg>
  )
}

export function EcosystemLayer({ className, layer, store }: EcosystemLayerProps) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
  const [hudHost, setHudHost] = useState<HTMLElement | null>(null)
  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      store.attachLayer(layer, element)

      if (layer === 'front') {
        setHudHost(
          element ? (element.closest<HTMLElement>('.bakeryThemeRoot') ?? document.body) : null,
        )
      }
    },
    [layer, store],
  )
  const hasSelection = layer === 'front' && snapshot.entities.some((view) => view.selected)

  useEffect(() => {
    if (!hasSelection) {
      return
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null

      if (target?.closest('.ecoControlPopover, .ecoThing[data-controllable]')) {
        return
      }

      store.dismissSelection()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        store.dismissSelection()
      }
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [hasSelection, store])

  if (!store.active) {
    return null
  }

  return (
    <div
      aria-hidden={layer === 'back' ? true : undefined}
      className={cn('ecoLayer', `ecoLayer--${layer}`, className)}
      onClick={layer === 'front' ? store.dismissSelection : undefined}
      onPointerMove={
        layer === 'front'
          ? (event) => {
              const rect = event.currentTarget.getBoundingClientRect()

              store.setControlInput({
                cursorX: event.clientX - rect.left,
                cursorY: event.clientY - rect.top,
              })
            }
          : undefined
      }
      ref={attach}
    >
      {layer === 'front' ? (
        <>
          <span className="ecoProbe ecoProbe--ground" data-eco-probe="ground" />
          <span className="ecoProbe ecoProbe--water" data-eco-probe="water" />
          <span className="ecoProbe ecoProbe--unit" data-eco-probe="unit" />
        </>
      ) : null}
      {snapshot.entities
        .filter((view) => view.layer === layer)
        .map((view) => (
          <EcoThing key={view.id} store={store} view={view} />
        ))}
      {layer === 'front' ? <span aria-hidden="true" className="ecoEffectOverlay" /> : null}
      {layer === 'front' && hudHost
        ? createPortal(
            <ControlHud
              controlled={snapshot.controlled}
              scene={snapshot.scene}
              store={store}
              toast={snapshot.toast}
            />,
            hudHost,
          )
        : null}
    </div>
  )
}
