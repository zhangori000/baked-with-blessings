'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  BakeryAccessibilityAnnouncer,
  bakeryAnnouncementDisplayMessageMs,
} from './BakeryAccessibilityAnnouncer'

type BakeryAnnouncement = {
  id: number
  message: string
  politeness: React.AriaAttributes['aria-live']
}

type BakeryAnnouncerContextValue = {
  announce: (message: string, politeness?: React.AriaAttributes['aria-live']) => void
}

const BakeryAnnouncerContext = createContext<BakeryAnnouncerContextValue | undefined>(undefined)

export const BakeryAnnouncerProvider = ({ children }: { children: React.ReactNode }) => {
  const [announcement, setAnnouncement] = useState<BakeryAnnouncement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const announce = useCallback(
    (message: string, politeness: React.AriaAttributes['aria-live'] = 'polite') => {
      const trimmedMessage = message.trim()

      if (!trimmedMessage) {
        return
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      setAnnouncement({
        id: Date.now(),
        message: trimmedMessage,
        politeness,
      })

      timerRef.current = setTimeout(() => {
        setAnnouncement(null)
        timerRef.current = null
      }, bakeryAnnouncementDisplayMessageMs)
    },
    [],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const value = useMemo(() => ({ announce }), [announce])

  return (
    <BakeryAnnouncerContext.Provider value={value}>
      {children}
      <BakeryAccessibilityAnnouncer
        announcementKey={announcement?.id}
        message={announcement?.message}
        politeness={announcement?.politeness}
      />
    </BakeryAnnouncerContext.Provider>
  )
}

export const useBakeryAnnouncer = () => {
  const context = useContext(BakeryAnnouncerContext)

  if (!context) {
    throw new Error('useBakeryAnnouncer must be used within a BakeryAnnouncerProvider')
  }

  return context
}
