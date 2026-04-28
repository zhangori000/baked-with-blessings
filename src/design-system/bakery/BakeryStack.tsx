'use client'

import React, {
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

import { cn } from '@/utilities/cn'

import { BakeryBox } from './BakeryBox'
import type { BakeryStyleProps } from './styleProps'

type BakeryStackProps = BakeryStyleProps &
  Omit<HTMLAttributes<HTMLElement>, 'color'> & {
    as?: ElementType
    children?: ReactNode
    style?: CSSProperties
    wrap?: boolean
    [key: `data-${string}`]: string | number | boolean | undefined
  }

export const HStack = React.forwardRef<HTMLElement, BakeryStackProps>(
  ({ as = 'div', children, className, flexDirection = 'row', wrap = false, ...props }, ref) => (
    <BakeryBox
      alignItems={props.alignItems ?? 'center'}
      as={as}
      className={cn('bakeryHStack', wrap && 'bakeryStackWrap', className)}
      display="flex"
      flexDirection={flexDirection}
      ref={ref}
      {...props}
    >
      {children}
    </BakeryBox>
  ),
)

HStack.displayName = 'HStack'

export const VStack = React.forwardRef<HTMLElement, BakeryStackProps>(
  ({ as = 'div', children, className, flexDirection = 'column', ...props }, ref) => (
    <BakeryBox
      alignItems={props.alignItems}
      as={as}
      className={cn('bakeryVStack', className)}
      display="flex"
      flexDirection={flexDirection}
      ref={ref}
      {...props}
    >
      {children}
    </BakeryBox>
  ),
)

VStack.displayName = 'VStack'
