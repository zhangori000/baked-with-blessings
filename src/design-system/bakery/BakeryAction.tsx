import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

import { cn } from '@/utilities/cn'

type BakeryActionProps = Omit<HTMLAttributes<HTMLElement>, 'color' | 'disabled'> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color' | 'href' | 'size'> &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'disabled' | 'size' | 'type'> & {
    as?: ElementType
    block?: boolean
    children?: ReactNode
    disabled?: boolean
    end?: ReactNode
    href?: string
    loading?: boolean
    size?: 'lg' | 'md' | 'sm'
    start?: ReactNode
    type?: 'button' | 'reset' | 'submit'
    variant?: 'ghost' | 'primary' | 'secondary'
  }

const actionVariantClassName: Record<NonNullable<BakeryActionProps['variant']>, string> = {
  ghost: 'bakeryAction-ghost',
  primary: 'bakeryAction-primary',
  secondary: 'bakeryAction-secondary',
}

const actionSizeClassName: Record<NonNullable<BakeryActionProps['size']>, string> = {
  lg: 'bakeryAction-lg',
  md: 'bakeryAction-md',
  sm: 'bakeryAction-sm',
}

export const BakeryAction = forwardRef<HTMLElement, BakeryActionProps>(function BakeryAction(
  {
    as,
    block = false,
    children,
    className,
    disabled = false,
    end,
    loading = false,
    size = 'md',
    start,
    type = 'button',
    variant = 'primary',
    ...props
  },
  ref,
) {
  const Component = (as ?? (props.href ? 'a' : 'button')) as ElementType
  const isButton = Component === 'button'
  const isDisabled = disabled || loading

  return (
    <Component
      aria-busy={loading || undefined}
      aria-disabled={!isButton && isDisabled ? true : undefined}
      className={cn(
        'bakeryAction',
        actionVariantClassName[variant],
        actionSizeClassName[size],
        block && 'bakeryAction-block',
        className,
      )}
      data-disabled={isDisabled || undefined}
      disabled={isButton ? isDisabled : undefined}
      ref={ref}
      type={isButton ? type : undefined}
      {...props}
    >
      {start ? <span className="bakeryActionNode">{start}</span> : null}
      <span className="bakeryActionContent">{children}</span>
      {end ? <span className="bakeryActionNode">{end}</span> : null}
    </Component>
  )
})
