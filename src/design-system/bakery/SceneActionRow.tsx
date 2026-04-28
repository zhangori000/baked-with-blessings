'use client'

import type React from 'react'

import { cn } from '@/utilities/cn'

import { BakeryBox } from './BakeryBox'
import type { BakerySpaceToken } from './tokens'

type SceneActionRowProps = {
  align?: 'center' | 'end' | 'start'
  children?: React.ReactNode
  className?: string
  gap?: BakerySpaceToken
}

const justifyContentByAlign: Record<NonNullable<SceneActionRowProps['align']>, string> = {
  center: 'center',
  end: 'flex-end',
  start: 'flex-start',
}

export const SceneActionRow = ({
  align = 'start',
  children,
  className,
  gap = '3',
}: SceneActionRowProps) => (
  <BakeryBox
    alignItems="center"
    className={cn('bakerySceneActionRow', className)}
    display="flex"
    flexDirection="row"
    gap={gap}
    justifyContent={justifyContentByAlign[align]}
  >
    {children}
  </BakeryBox>
)
