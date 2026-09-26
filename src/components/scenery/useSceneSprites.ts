'use client'

import { useCallback, useMemo, useState } from 'react'

import type { SceneTone } from './menuHeroScenery'
import { createSceneSprites, type SceneSpawnable, type SceneSprite } from './spawnables'

const maxSpritesOnScene = 36

type SpriteState = {
  sceneTone: SceneTone
  sprites: SceneSprite[]
}

export function useSceneSprites(sceneTone: SceneTone) {
  const [state, setState] = useState<SpriteState>({ sceneTone, sprites: [] })
  const sprites = useMemo(
    () => (state.sceneTone === sceneTone ? state.sprites : []),
    [sceneTone, state],
  )

  const spawnSprite = useCallback(
    (item: SceneSpawnable) => {
      const next = createSceneSprites(item)

      setState((current) => {
        const existing = current.sceneTone === sceneTone ? current.sprites : []
        const sameItem = existing.filter((entry) => entry.itemId === item.id)
        const overflow = Math.max(0, sameItem.length + next.length - item.cap)
        const dropped = new Set(sameItem.slice(0, overflow).map((entry) => entry.id))
        const kept = existing.filter((entry) => !dropped.has(entry.id))

        return { sceneTone, sprites: [...kept, ...next].slice(-maxSpritesOnScene) }
      })
    },
    [sceneTone],
  )

  const removeSprite = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      sprites: current.sprites.filter((entry) => entry.id !== id),
    }))
  }, [])

  const clearSprites = useCallback(() => setState({ sceneTone, sprites: [] }), [sceneTone])

  const spriteCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const entry of sprites) {
      counts[entry.itemId] = (counts[entry.itemId] ?? 0) + 1
    }

    return counts
  }, [sprites])

  return { clearSprites, removeSprite, spawnSprite, spriteCounts, sprites }
}
