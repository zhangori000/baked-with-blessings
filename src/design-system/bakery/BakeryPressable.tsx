'use client'

import React from 'react'

import { cn } from '@/utilities/cn'

import { BakeryBox } from './BakeryBox'
import type { BakeryStyleProps } from './styleProps'

type BakeryPressableProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> &
  BakeryStyleProps & {
    loading?: boolean
  }

export const BakeryPressable = React.forwardRef<HTMLButtonElement, BakeryPressableProps>(
  ({ children, className, disabled, loading = false, onClick, type = 'button', ...props }, ref) => {
    const isDisabled = disabled || loading

    return (
      <BakeryBox
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        as="button"
        className={cn('bakeryPressable', className)}
        disabled={isDisabled}
        onClick={isDisabled ? undefined : onClick}
        ref={ref}
        type={type}
        {...props}
      >
        {children}
      </BakeryBox>
    )
  },
)

BakeryPressable.displayName = 'BakeryPressable'
