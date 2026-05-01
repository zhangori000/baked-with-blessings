'use client'

import React, { type HTMLAttributes, type ReactNode } from 'react'

import { cn } from '@/utilities/cn'

import { HStack } from './BakeryStack'
import type { BakerySpaceToken } from './tokens'

type SceneActionRowProps = Omit<HTMLAttributes<HTMLDivElement>, 'color'> & {
  align?: 'center' | 'end' | 'start'
  children?: ReactNode
  className?: string
  gap?: BakerySpaceToken
  wrap?: boolean
}

const justifyContentByAlign: Record<NonNullable<SceneActionRowProps['align']>, string> = {
  center: 'center',
  end: 'flex-end',
  start: 'flex-start',
}

export const SceneActionRow = React.forwardRef<HTMLDivElement, SceneActionRowProps>(
  ({ align = 'start', children, className, gap = '3', wrap = true, ...props }, ref) => (
    <HStack
      className={cn('bakerySceneActionRow', className)}
      gap={gap}
      justifyContent={justifyContentByAlign[align]}
      ref={ref}
      wrap={wrap}
      {...props}
    >
      {children}
    </HStack>
  ),
)

SceneActionRow.displayName = 'SceneActionRow'
