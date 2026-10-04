'use client'

import { Check } from 'lucide-react'
import Image from 'next/image'
import type { ReactNode } from 'react'

import { BakeryPopoverPanel, BakeryPressable, bakerySceneThemes } from '@/design-system/bakery'
import { cn } from '@/utilities/cn'

import {
  menuHeroMeadowByScene,
  menuHeroSkyByScene,
  menuSceneTones,
  type SceneTone,
} from './menuHeroScenery'
import './scene-picker.css'

type ScenePickerProps = {
  activeTone: SceneTone
  children: ReactNode
  className?: string
  onClose: () => void
  onSelect: (tone: SceneTone) => void
  open: boolean
}

export function ScenePicker({
  activeTone,
  children,
  className,
  onClose,
  onSelect,
  open,
}: ScenePickerProps) {
  return (
    <BakeryPopoverPanel
      className={className}
      content={({ closePopover }) => (
        <div className="scenePicker">
          <p className="scenePickerTitle">Pick a scenery</p>
          <div aria-label="Sceneries" className="scenePickerList" role="group">
            {menuSceneTones.map((tone) => {
              const isActive = tone === activeTone

              return (
                <BakeryPressable
                  aria-pressed={isActive}
                  className={cn('scenePickerChoice', isActive && 'scenePickerChoiceActive')}
                  key={tone}
                  onClick={() => {
                    if (!isActive) {
                      onSelect(tone)
                    }

                    closePopover()
                  }}
                  type="button"
                >
                  <span aria-hidden="true" className="scenePickerThumb">
                    <Image
                      alt=""
                      className="scenePickerThumbSky"
                      height={120}
                      src={menuHeroSkyByScene[tone]}
                      unoptimized
                      width={240}
                    />
                    <Image
                      alt=""
                      className="scenePickerThumbMeadow"
                      height={120}
                      src={menuHeroMeadowByScene[tone]}
                      unoptimized
                      width={240}
                    />
                  </span>
                  <span className="scenePickerLabel">{bakerySceneThemes[tone].label}</span>
                  {isActive ? (
                    <Check aria-label="Current scenery" className="scenePickerCheck" />
                  ) : null}
                </BakeryPressable>
              )
            })}
          </div>
        </div>
      )}
      contentClassName="scenePickerPanel"
      onClose={onClose}
      placement="bottom-start"
      visible={open}
    >
      {children}
    </BakeryPopoverPanel>
  )
}
