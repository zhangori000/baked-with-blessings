'use client'

import { useCallback, useMemo, useState } from 'react'

import type { SceneTone } from './menuHeroScenery'
import { createSceneSprites, type SceneSpawnable, type SceneSprite } from './spawnables'

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

        return { sceneTone, sprites: [...existing, ...next] }
      })
    },
    [sceneTone],
  )

  const clearSprites = useCallback(() => setState({ sceneTone, sprites: [] }), [sceneTone])

  const spriteCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const entry of sprites) {
      counts[entry.itemId] = (counts[entry.itemId] ?? 0) + 1
    }

    return counts
  }, [sprites])

  return { clearSprites, spawnSprite, spriteCounts, sprites }
}
