import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

import { cn } from '@/utilities/cn'

type BakeryCardProps = Omit<HTMLAttributes<HTMLElement>, 'color'> & {
  as?: ElementType
  children?: ReactNode
  href?: string
  interactive?: boolean
  radius?: 'lg' | 'md' | 'none' | 'sm' | 'xl'
  spacing?: 'lg' | 'md' | 'none' | 'sm'
  tone?: 'outline' | 'paper' | 'transparent' | 'wash'
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
  [key: `data-${string}`]: string | number | boolean | undefined
}

const cardToneClassName: Record<NonNullable<BakeryCardProps['tone']>, string> = {
  outline: 'bakeryCard-outline',
  paper: 'bakeryCard-paper',
  transparent: 'bakeryCard-transparent',
  wash: 'bakeryCard-wash',
}

const cardSpacingClassName: Record<NonNullable<BakeryCardProps['spacing']>, string> = {
  lg: 'bakeryCard-spacing-lg',
  md: 'bakeryCard-spacing-md',
  none: 'bakeryCard-spacing-none',
  sm: 'bakeryCard-spacing-sm',
}

const cardRadiusClassName: Record<NonNullable<BakeryCardProps['radius']>, string> = {
  lg: 'bakeryCard-radius-lg',
  md: 'bakeryCard-radius-md',
  none: 'bakeryCard-radius-none',
  sm: 'bakeryCard-radius-sm',
  xl: 'bakeryCard-radius-xl',
}

export const BakeryCard = forwardRef<HTMLElement, BakeryCardProps>(function BakeryCard(
  {
    as: Component = 'div',
    children,
    className,
    interactive = false,
    radius = 'lg',
    spacing = 'md',
    tone = 'paper',
    ...props
  },
  ref,
) {
  return (
    <Component
      className={cn(
        'bakeryCard',
        cardToneClassName[tone],
        cardSpacingClassName[spacing],
        cardRadiusClassName[radius],
        interactive && 'bakeryCard-interactive',
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
    </Component>
  )
})
