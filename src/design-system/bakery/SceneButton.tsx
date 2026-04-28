'use client'

import React from 'react'

import { cn } from '@/utilities/cn'

import { BakeryPressable } from './BakeryPressable'

type SceneButtonVariant = 'ghost' | 'primary'

type SceneButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
  loading?: boolean
  variant?: SceneButtonVariant
}

const variantClassName: Record<SceneButtonVariant, string> = {
  ghost: 'bakerySceneButton-ghost',
  primary: 'bakerySceneButton-primary',
}

const variantStyleProps: Record<
  SceneButtonVariant,
  Pick<React.ComponentProps<typeof BakeryPressable>, 'background' | 'color'>
> = {
  ghost: {
    background: 'bgSecondary',
    color: 'fg',
  },
  primary: {
    background: 'actionBg',
    color: 'actionFg',
  },
}

export const SceneButton = React.forwardRef<HTMLButtonElement, SceneButtonProps>(
  ({ children, className, type = 'button', variant = 'primary', ...props }, ref) => (
    <BakeryPressable
      className={cn('bakerySceneButton', variantClassName[variant], className)}
      paddingX="4"
      paddingY="2"
      radius="pill"
      ref={ref}
      type={type}
      {...variantStyleProps[variant]}
      {...props}
    >
      {children}
    </BakeryPressable>
  ),
)

SceneButton.displayName = 'SceneButton'
