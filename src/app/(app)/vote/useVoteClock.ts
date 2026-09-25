'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const REFRESH_RETRY_MS = 5000

export const formatRemaining = (ms: number) => {
  if (ms <= 0) return 'Now'
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

export const useCountdown = (target: string) => {
  const targetMs = useMemo(() => Date.parse(target), [target])
  const [remaining, setRemaining] = useState(() => targetMs - Date.now())

  useEffect(() => {
    const tick = () => setRemaining(targetMs - Date.now())
    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [targetMs])

  return remaining
}

export const useRefreshOnceReached = ({
  isReached,
  isWaiting,
}: {
  isReached: boolean
  isWaiting: boolean
}) => {
  const router = useRouter()

  useEffect(() => {
    if (!isWaiting || !isReached) return

    router.refresh()
    const retry = window.setInterval(() => router.refresh(), REFRESH_RETRY_MS)
    return () => window.clearInterval(retry)
  }, [isReached, isWaiting, router])
}
