'use client'

import type React from 'react'
import type { CSSProperties } from 'react'

import { cn } from '@/utilities/cn'

import { BakeryBox } from './BakeryBox'
import { getBakeryColorVar, type BakeryColorRole, type BakeryStyleProps } from './styleProps'

export type SceneSurfaceVariant = 'card' | 'footer' | 'glass' | 'hero' | 'persuasion'

type SceneSurfaceRecipe = Pick<
  BakeryStyleProps,
  'background' | 'color' | 'padding' | 'radius' | 'shadow'
> & {
  borderColor?: BakeryColorRole
}

const sceneSurfaceRecipes: Record<SceneSurfaceVariant, SceneSurfaceRecipe> = {
  card: {
    background: 'panelFill',
    borderColor: 'panelBorder',
    color: 'fg',
    padding: '6',
    radius: 'lg',
    shadow: 'raisedSoft',
  },
  footer: {
    background: 'footerBg',
    borderColor: 'footerBorder',
    color: 'footerFg',
    radius: 'none',
    shadow: 'none',
  },
  glass: {
    background: 'bgPrimary',
    borderColor: 'border',
    color: 'fg',
    padding: '4',
    radius: 'lg',
    shadow: 'surfaceInset',
  },
  hero: {
    background: 'sceneBackground',
    borderColor: 'sceneActionAura',
    color: 'sceneText',
    radius: 'none',
    shadow: 'none',
  },
  persuasion: {
    background: 'scenePanel',
    borderColor: 'panelBorder',
    color: 'sceneText',
    padding: '6',
    radius: 'xl',
    shadow: 'panelFloat',
  },
}

type SceneSurfaceProps = Omit<React.HTMLAttributes<HTMLElement>, 'color'> & {
  as?: React.ElementType
  children?: React.ReactNode
  style?: CSSProperties
  variant?: SceneSurfaceVariant
}

export const SceneSurface = ({
  as = 'section',
  children,
  className,
  style,
  variant = 'card',
  ...props
}: SceneSurfaceProps) => {
  const recipe = sceneSurfaceRecipes[variant]
  const styleWithBorder = {
    borderColor: recipe.borderColor ? getBakeryColorVar(recipe.borderColor) : undefined,
    ...style,
  }

  return (
    <BakeryBox
      as={as}
      background={recipe.background}
      className={cn('bakerySceneSurface', `bakerySceneSurface-${variant}`, className)}
      color={recipe.color}
      data-surface={variant}
      padding={recipe.padding}
      radius={recipe.radius}
      shadow={recipe.shadow}
      style={styleWithBorder}
      {...props}
    >
      {children}
    </BakeryBox>
  )
}
