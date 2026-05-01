'use client'

import type React from 'react'
import type { CSSProperties } from 'react'

import { cn } from '@/utilities/cn'

import { BakeryBox } from './BakeryBox'
import type { BakeryStyleProps } from './styleProps'

type BakeryTextFont = 'body' | 'display' | 'eyebrow' | 'label' | 'title'
type BakeryTextOverflow = 'break' | 'clip' | 'truncate' | 'wrap'

type BakeryTextProps = BakeryStyleProps & {
  align?: CSSProperties['textAlign']
  as?: React.ElementType
  children?: React.ReactNode
  className?: string
  font?: BakeryTextFont
  numberOfLines?: number
  overflow?: BakeryTextOverflow
  style?: CSSProperties
  tabularNumbers?: boolean
  [key: string]: unknown
}

const fontClassName: Record<BakeryTextFont, string> = {
  body: 'bakeryText-body',
  display: 'bakeryText-display',
  eyebrow: 'bakeryText-eyebrow',
  label: 'bakeryText-label',
  title: 'bakeryText-title',
}

const overflowClassName: Record<BakeryTextOverflow, string> = {
  break: 'bakeryText-break',
  clip: 'bakeryText-clip',
  truncate: 'bakeryText-truncate',
  wrap: 'bakeryText-wrap',
}

export const BakeryText = ({
  align,
  as = 'span',
  children,
  className,
  color = 'fg',
  font = 'body',
  numberOfLines,
  overflow = 'wrap',
  style,
  tabularNumbers = false,
  ...props
}: BakeryTextProps) => {
  const clampedStyle =
    numberOfLines && numberOfLines > 0
      ? {
          WebkitBoxOrient: 'vertical' as const,
          WebkitLineClamp: numberOfLines,
          display: '-webkit-box',
          overflow: 'hidden',
          ...style,
        }
      : style

  return (
    <BakeryBox
      as={as}
      className={cn(
        'bakeryText',
        fontClassName[font],
        overflowClassName[overflow],
        tabularNumbers && 'bakeryText-tabularNumbers',
        className,
      )}
      color={color}
      style={{ textAlign: align, ...clampedStyle }}
      {...props}
    >
      {children}
    </BakeryBox>
  )
}
