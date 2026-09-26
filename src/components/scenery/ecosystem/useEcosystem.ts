'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'

import type { SceneTone } from '../menuHeroScenery'
import { sceneSpawnablesByScene, type SceneSpawnable } from '../spawnables'
import { EcosystemStore } from './store'

export function useEcosystem(sceneTone: SceneTone) {
  const [store] = useState(() => new EcosystemStore(sceneTone))
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)

  useEffect(() => {
    store.setScene(sceneTone)
  }, [sceneTone, store])

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => {
      store.setFrozen(motion.matches)
    }
    let frame = 0
    let last = performance.now()

    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now

      if (document.visibilityState === 'visible') {
        store.frame(dt)
      }

      frame = window.requestAnimationFrame(loop)
    }

    syncMotion()
    motion.addEventListener('change', syncMotion)
    frame = window.requestAnimationFrame(loop)

    return () => {
      motion.removeEventListener('change', syncMotion)
      window.cancelAnimationFrame(frame)
    }
  }, [store])

  const spawn = useCallback(
    (item: SceneSpawnable) => {
      if (item.kind === 'creature' && item.species) {
        store.spawn(item.species, item.id)
      }
    },
    [store],
  )

  const counts = useMemo(() => {
    const live = snapshot.scene === sceneTone ? snapshot.counts : {}
    const next: Record<string, number> = {}

    for (const item of sceneSpawnablesByScene[sceneTone] ?? []) {
      if (item.kind === 'creature') {
        next[item.id] = live[item.id] ?? 0
      }
    }

    return next
  }, [sceneTone, snapshot])

  return {
    clear: store.clear,
    counts,
    spawn,
    store,
  }
}
