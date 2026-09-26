'use client'

import { Check, Heart, X } from 'lucide-react'
import NextImage from 'next/image'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import { getOverlayRoot, useOverlayDismiss } from '@/components/ImageLightbox/useOverlayDismiss'
import { Media } from '@/components/Media'
import { BakeryAction } from '@/design-system/bakery'
import type { NudgeFlavor } from '@/features/flavor-nudges/types'

import './flavor-nudge.css'

const EMAIL_STORAGE_KEY = 'bwb-nudge-email'

type FlavorNudgeContextValue = {
  flavors: NudgeFlavor[]
  nudged: Set<number>
  open: (productId?: number) => void
}

const FlavorNudgeContext = createContext<FlavorNudgeContextValue | null>(null)

const useFlavorNudgeContext = () => {
  const context = useContext(FlavorNudgeContext)
  if (!context) throw new Error('Flavor nudge components need a FlavorNudgeProvider.')
  return context
}

const rememberEmail = (value: string) => {
  try {
    window.localStorage.setItem(EMAIL_STORAGE_KEY, value)
  } catch {
    return
  }
}

const pluralNudges = (count: number) => (count === 1 ? 'nudge' : `${count} nudges`)

function FlavorThumb({ flavor }: { flavor: NudgeFlavor }) {
  if (flavor.image) {
    return (
      <Media
        fill
        htmlElement={null}
        imgClassName="flavorNudgeThumbImage"
        resource={flavor.image}
        size="96px"
      />
    )
  }

  return (
    <NextImage
      alt=""
      className="flavorNudgeThumbImage"
      fill
      sizes="96px"
      src={flavor.fallbackSrc}
      unoptimized
    />
  )
}

function NudgeDialog({
  flavors,
  initialSelected,
  isOpen,
  nudged,
  onClose,
  onNudged,
}: {
  flavors: NudgeFlavor[]
  initialSelected: number[]
  isOpen: boolean
  nudged: Set<number>
  onClose: () => void
  onNudged: (ids: number[]) => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [selected, setSelected] = useState<Set<number>>(() => new Set(initialSelected))
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState<{ email: string; titles: string[] } | null>(null)

  useOverlayDismiss({ focusRef: closeRef, isOpen, onClose })

  useEffect(() => {
    try {
      setEmail(window.localStorage.getItem(EMAIL_STORAGE_KEY) ?? '')
    } catch {
      setEmail('')
    }
  }, [])

  if (!isOpen || typeof document === 'undefined') return null

  const toggle = (productId: number) => {
    setError(null)
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (selected.size === 0 || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/flavor-nudges', {
        body: JSON.stringify({ email, productIds: Array.from(selected) }),
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = (await response.json().catch(() => ({}))) as {
        error?: string
        nudged?: number[]
        success?: boolean
      }

      if (!response.ok || !result.success) {
        setError(result.error ?? 'Something went wrong. Please try again.')
        return
      }

      const trimmed = email.trim()
      if (trimmed) rememberEmail(trimmed)
      onNudged(result.nudged ?? Array.from(selected))
      setSent({
        email: trimmed,
        titles: flavors.filter((flavor) => selected.has(flavor.productId)).map((f) => f.title),
      })
    } catch {
      setError('We could not reach the bakery. Check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="flavorNudgeBackdrop" onClick={onClose}>
      <div
        aria-labelledby="flavor-nudge-title"
        aria-modal="true"
        className="flavorNudgeDialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Close"
          className="flavorNudgeClose"
          onClick={onClose}
          ref={closeRef}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>

        {sent ? (
          <>
            <h2 className="flavorNudgeTitle" id="flavor-nudge-title">
              Nudge sent!
            </h2>
            <p className="flavorNudgeText">
              The baker will see that you miss {sent.titles.join(', ')}.
              {sent.email ? ` We will email ${sent.email} when it comes back.` : ''}
            </p>
            <BakeryAction block onClick={onClose} size="md" variant="primary">
              Done
            </BakeryAction>
          </>
        ) : (
          <>
            <h2 className="flavorNudgeTitle" id="flavor-nudge-title">
              Bring back a flavor
            </h2>
            <p className="flavorNudgeText">
              Pick the ones you miss. The baker sees every nudge when she plans what to bake.
            </p>

            <ul className="flavorNudgeGrid">
              {flavors.map((flavor) => {
                const isNudged = nudged.has(flavor.productId)
                const isSelected = isNudged || selected.has(flavor.productId)
                return (
                  <li key={flavor.productId}>
                    <button
                      aria-pressed={isSelected}
                      className="flavorNudgeTile"
                      data-nudged={isNudged || undefined}
                      data-selected={isSelected || undefined}
                      disabled={isNudged}
                      onClick={() => toggle(flavor.productId)}
                      type="button"
                    >
                      <span className="flavorNudgeThumb">
                        <FlavorThumb flavor={flavor} />
                        {isSelected ? (
                          <span aria-hidden="true" className="flavorNudgeCheck">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        ) : null}
                      </span>
                      <span className="flavorNudgeTileTitle">{flavor.title}</span>
                      {isNudged ? <span className="flavorNudgeTileNote">Nudged</span> : null}
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="flavorNudgeField">
              <label className="flavorNudgeLabel" htmlFor="flavor-nudge-email">
                Email me when it is back <span className="flavorNudgeMuted">(optional)</span>
              </label>
              <input
                autoComplete="email"
                className="flavorNudgeInput"
                id="flavor-nudge-email"
                inputMode="email"
                maxLength={254}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
              <p className="flavorNudgeMuted">We only use it to tell you a flavor is back.</p>
            </div>

            <div className="flavorNudgeFooter">
              {error ? (
                <p className="flavorNudgeError" role="alert">
                  {error}
                </p>
              ) : null}

              <BakeryAction
                block
                disabled={selected.size === 0}
                loading={isSubmitting}
                onClick={handleSubmit}
                size="md"
                variant="primary"
              >
                {selected.size === 0 ? 'Pick a flavor' : `Send ${pluralNudges(selected.size)}`}
              </BakeryAction>
            </div>
          </>
        )}
      </div>
    </div>,
    getOverlayRoot(),
  )
}

export function FlavorNudgeProvider({
  children,
  flavors,
}: {
  children: ReactNode
  flavors: NudgeFlavor[]
}) {
  const [nudged, setNudged] = useState<Set<number>>(() => new Set())
  const [dialog, setDialog] = useState<{ initialSelected: number[]; key: number } | null>(null)

  useEffect(() => {
    let isActive = true
    fetch('/api/flavor-nudges', { credentials: 'same-origin' })
      .then((response) => response.json())
      .then((result: { nudged?: number[] }) => {
        if (isActive && Array.isArray(result.nudged)) setNudged(new Set(result.nudged))
      })
      .catch(() => {})
    return () => {
      isActive = false
    }
  }, [])

  const open = useCallback((productId?: number) => {
    setDialog({ initialSelected: productId ? [productId] : [], key: Date.now() })
  }, [])
  const close = useCallback(() => setDialog(null), [])
  const handleNudged = useCallback((ids: number[]) => setNudged(new Set(ids)), [])

  const value = useMemo(() => ({ flavors, nudged, open }), [flavors, nudged, open])

  return (
    <FlavorNudgeContext.Provider value={value}>
      {children}
      {dialog ? (
        <NudgeDialog
          flavors={flavors}
          initialSelected={dialog.initialSelected}
          isOpen
          key={dialog.key}
          nudged={nudged}
          onClose={close}
          onNudged={handleNudged}
        />
      ) : null}
    </FlavorNudgeContext.Provider>
  )
}

export function NudgeCardButton({ productId, title }: { productId: number; title: string }) {
  const { nudged, open } = useFlavorNudgeContext()
  const isNudged = nudged.has(productId)

  if (isNudged) {
    return (
      <span className="flavorNudgeCardDone">
        <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
        Nudged
      </span>
    )
  }

  return (
    <button
      aria-label={`Bring back ${title}`}
      className="flavorNudgeCardButton"
      onClick={() => open(productId)}
      type="button"
    >
      <Heart aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.4} />
      Bring it back
    </button>
  )
}

export function NudgeCallout({ note }: { note?: string }) {
  const { flavors, nudged, open } = useFlavorNudgeContext()
  if (flavors.length === 0) return null

  const nudgedTitles = flavors
    .filter((flavor) => nudged.has(flavor.productId))
    .map((flavor) => flavor.title)

  return (
    <div className="flavorNudgeCallout">
      <div className="flavorNudgeCalloutCopy">
        <p className="flavorNudgeCalloutTitle">Miss an old flavor?</p>
        <p className="flavorNudgeMuted">Nudge it back for a future week.{note ? ` ${note}` : ''}</p>
        {nudgedTitles.length > 0 ? (
          <p className="flavorNudgeMuted">You nudged: {nudgedTitles.join(', ')}</p>
        ) : null}
      </div>
      <BakeryAction
        onClick={() => open()}
        size="md"
        start={<Heart aria-hidden="true" className="h-4 w-4" strokeWidth={2.4} />}
        variant="secondary"
      >
        Bring one back
      </BakeryAction>
    </div>
  )
}
