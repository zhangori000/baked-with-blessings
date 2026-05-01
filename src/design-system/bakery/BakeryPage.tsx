import type { ElementType, HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/utilities/cn'

type BakeryPageElementProps = Omit<HTMLAttributes<HTMLElement>, 'color' | 'title'> & {
  as?: ElementType
  children?: ReactNode
}

type BakeryPageShellProps = BakeryPageElementProps & {
  bleed?: boolean
  spacing?: 'lg' | 'md' | 'none' | 'sm'
  tone?: 'paper' | 'theme' | 'transparent'
  width?: 'container' | 'full' | 'narrow' | 'wide'
}

const pageShellToneClassName: Record<NonNullable<BakeryPageShellProps['tone']>, string> = {
  paper: 'bakeryPageShell-paper',
  theme: 'bakeryPageShell-theme',
  transparent: 'bakeryPageShell-transparent',
}

const pageShellWidthClassName: Record<NonNullable<BakeryPageShellProps['width']>, string> = {
  container: 'bakeryPageShell-width-container',
  full: 'bakeryPageShell-width-full',
  narrow: 'bakeryPageShell-width-narrow',
  wide: 'bakeryPageShell-width-wide',
}

const pageShellSpacingClassName: Record<NonNullable<BakeryPageShellProps['spacing']>, string> = {
  lg: 'bakeryPageShell-spacing-lg',
  md: 'bakeryPageShell-spacing-md',
  none: 'bakeryPageShell-spacing-none',
  sm: 'bakeryPageShell-spacing-sm',
}

export function BakeryPageShell({
  as: Component = 'div',
  bleed = false,
  children,
  className,
  spacing = 'md',
  tone = 'paper',
  width = 'container',
  ...props
}: BakeryPageShellProps) {
  return (
    <Component
      className={cn(
        'bakeryPageShell',
        pageShellToneClassName[tone],
        pageShellWidthClassName[width],
        pageShellSpacingClassName[spacing],
        bleed && 'bakeryPageShell-bleed',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

type BakeryPageSurfaceProps = BakeryPageElementProps & {
  spacing?: 'lg' | 'md' | 'none' | 'sm'
  tone?: 'paper' | 'plain' | 'transparent'
  width?: 'container' | 'full' | 'narrow' | 'wide'
}

const pageSurfaceToneClassName: Record<NonNullable<BakeryPageSurfaceProps['tone']>, string> = {
  paper: 'bakeryPageSurface-paper',
  plain: 'bakeryPageSurface-plain',
  transparent: 'bakeryPageSurface-transparent',
}

const pageSurfaceWidthClassName: Record<NonNullable<BakeryPageSurfaceProps['width']>, string> = {
  container: 'bakeryPageSurface-width-container',
  full: 'bakeryPageSurface-width-full',
  narrow: 'bakeryPageSurface-width-narrow',
  wide: 'bakeryPageSurface-width-wide',
}

const pageSurfaceSpacingClassName: Record<
  NonNullable<BakeryPageSurfaceProps['spacing']>,
  string
> = {
  lg: 'bakeryPageSurface-spacing-lg',
  md: 'bakeryPageSurface-spacing-md',
  none: 'bakeryPageSurface-spacing-none',
  sm: 'bakeryPageSurface-spacing-sm',
}

export function BakeryPageSurface({
  as: Component = 'section',
  children,
  className,
  spacing = 'md',
  tone = 'paper',
  width = 'container',
  ...props
}: BakeryPageSurfaceProps) {
  return (
    <Component
      className={cn(
        'bakeryPageSurface',
        pageSurfaceToneClassName[tone],
        pageSurfaceWidthClassName[width],
        pageSurfaceSpacingClassName[spacing],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

type BakeryPageHeaderProps = BakeryPageElementProps & {
  align?: 'center' | 'start'
}

export function BakeryPageHeader({
  align = 'start',
  as: Component = 'header',
  children,
  className,
  ...props
}: BakeryPageHeaderProps) {
  return (
    <Component
      className={cn('bakeryPageHeader', `bakeryPageHeader-${align}`, className)}
      {...props}
    >
      {children}
    </Component>
  )
}

type BakeryTextRoleProps = BakeryPageElementProps & {
  color?: 'default' | 'muted' | 'scene' | 'strong'
}

const textRoleColorClassName: Record<NonNullable<BakeryTextRoleProps['color']>, string> = {
  default: 'bakeryPageText-default',
  muted: 'bakeryPageText-muted',
  scene: 'bakeryPageText-scene',
  strong: 'bakeryPageText-strong',
}

export function BakeryPageEyebrow({
  as: Component = 'p',
  children,
  className,
  color = 'muted',
  ...props
}: BakeryTextRoleProps) {
  return (
    <Component
      className={cn('bakeryPageEyebrow', textRoleColorClassName[color], className)}
      {...props}
    >
      {children}
    </Component>
  )
}

type BakeryPageTitleProps = BakeryTextRoleProps & {
  size?: 'display' | 'section' | 'title'
}

export function BakeryPageTitle({
  as: Component = 'h1',
  children,
  className,
  color = 'strong',
  size = 'title',
  ...props
}: BakeryPageTitleProps) {
  return (
    <Component
      className={cn(
        'bakeryPageTitle',
        `bakeryPageTitle-${size}`,
        textRoleColorClassName[color],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export function BakeryPageLead({
  as: Component = 'p',
  children,
  className,
  color = 'muted',
  ...props
}: BakeryTextRoleProps) {
  return (
    <Component
      className={cn('bakeryPageLead', textRoleColorClassName[color], className)}
      {...props}
    >
      {children}
    </Component>
  )
}

type BakerySectionHeaderProps = BakeryPageElementProps & {
  description?: ReactNode
  end?: ReactNode
  eyebrow?: ReactNode
  title: ReactNode
}

export function BakerySectionHeader({
  as: Component = 'header',
  children,
  className,
  description,
  end,
  eyebrow,
  title,
  ...props
}: BakerySectionHeaderProps) {
  return (
    <Component className={cn('bakerySectionHeader', className)} {...props}>
      <span className="bakerySectionHeaderText">
        {eyebrow ? <BakeryPageEyebrow>{eyebrow}</BakeryPageEyebrow> : null}
        <BakeryPageTitle as="h2" size="section">
          {title}
        </BakeryPageTitle>
        {description ? <BakeryPageLead>{description}</BakeryPageLead> : null}
        {children}
      </span>
      {end ? <span className="bakerySectionHeaderEnd">{end}</span> : null}
    </Component>
  )
}
