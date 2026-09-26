'use client'

import Image from 'next/image'
import { memo, useCallback, useSyncExternalStore, type CSSProperties } from 'react'

import { cn } from '@/utilities/cn'

import { SpriteParticles } from '../SceneSpawnLayer'
import { ecoAsset } from './assets'
import type { EcosystemStore } from './store'
import type { EcoEntityView, EcoLayer } from './types'

import '../scene-spawn.css'
import './ecosystem.css'

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

  return (
    <span
      className={cn('ecoThing', `ecoThing--${view.anchor}`)}
      data-dying={view.dying ? '' : undefined}
      data-ghost={view.ghost ? '' : undefined}
      data-species={view.species}
      ref={attach}
      style={{ ['--eco-size' as string]: view.size.toFixed(2) } as CSSProperties}
    >
      {view.rain ? <span className="ecoRain" /> : null}
      <span className="ecoAnchor">
        <span className="ecoPop">
          <span className="ecoPose">
            <Image
              alt=""
              className={cn('ecoArt', `ecoArt--${view.idle}`)}
              draggable={false}
              height={120}
              src={view.asset}
              unoptimized
              width={120}
            />
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
        {view.dying && view.ghost ? (
          <Image
            alt=""
            className="ecoGhost"
            draggable={false}
            height={80}
            src={ecoAsset('ghost')}
            unoptimized
            width={64}
          />
        ) : view.dying ? (
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
    </span>
  )
})

type EcosystemLayerProps = {
  className?: string
  layer: EcoLayer
  store: EcosystemStore
}

export function EcosystemLayer({ className, layer, store }: EcosystemLayerProps) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
  const attach = useCallback(
    (element: HTMLDivElement | null) => store.attachLayer(layer, element),
    [layer, store],
  )

  if (!store.active) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className={cn('ecoLayer', `ecoLayer--${layer}`, className)}
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
    </div>
  )
}
