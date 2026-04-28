'use client'

import type React from 'react'

import { cn } from '@/utilities/cn'

import { BakeryBox } from './BakeryBox'

type SceneButtonVariant = 'ghost' | 'primary'

type SceneButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
  variant?: SceneButtonVariant
}

const variantClassName: Record<SceneButtonVariant, string> = {
  ghost:
    'border border-[var(--bakery-color-border)] bg-[var(--bakery-color-bg-secondary)] text-[var(--bakery-color-fg)]',
  primary:
    'border border-transparent bg-[var(--bakery-color-action-bg)] text-[var(--bakery-color-action-fg)] shadow-[0_0_0_4px_var(--scene-action-aura)]',
}

export const SceneButton = ({
  children,
  className,
  type = 'button',
  variant = 'primary',
  ...props
}: SceneButtonProps) => (
  <BakeryBox
    as="button"
    className={cn(
      'inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-4 py-2 text-sm font-extrabold transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-55',
      variantClassName[variant],
      className,
    )}
    type={type}
    {...props}
  >
    {children}
  </BakeryBox>
)
