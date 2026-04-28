'use client'

import React from 'react'

import { cn } from '@/utilities/cn'

import { BakeryPressable } from './BakeryPressable'

type SceneButtonVariant = 'ghost' | 'primary'

type SceneButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
  loading?: boolean
  loadingLabel?: string
  progressLabel?: string
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
  (
    {
      'aria-label': ariaLabel,
      children,
      className,
      loading = false,
      loadingLabel,
      progressLabel,
      type = 'button',
      variant = 'primary',
      ...props
    },
    ref,
  ) => {
    const resolvedLoadingLabel = loadingLabel ?? progressLabel ?? 'Loading'

    return (
      <BakeryPressable
        aria-label={ariaLabel ?? (loading ? resolvedLoadingLabel : undefined)}
        className={cn('bakerySceneButton', variantClassName[variant], className)}
        data-loading={loading || undefined}
        loading={loading}
        paddingX="4"
        paddingY="2"
        radius="pill"
        ref={ref}
        type={type}
        {...variantStyleProps[variant]}
        {...props}
      >
        {loading ? <span aria-hidden="true" className="bakerySceneButtonSpinner" /> : null}
        <span className="bakerySceneButtonContent">{children}</span>
      </BakeryPressable>
    )
  },
)

SceneButton.displayName = 'SceneButton'
