'use client'

import React, { useMemo, type CSSProperties } from 'react'

import { cn } from '@/utilities/cn'

import { getBakeryStyles, type BakeryStyleProps } from './styleProps'

type BakeryBoxProps = BakeryStyleProps & {
  as?: React.ElementType
  children?: React.ReactNode
  className?: string
  style?: CSSProperties
  [key: string]: unknown
}

export const BakeryBox = ({
  as: Component = 'div',
  children,
  className,
  style,
  alignItems,
  background,
  color,
  display,
  flexDirection,
  gap,
  justifyContent,
  margin,
  marginBottom,
  marginTop,
  padding,
  paddingX,
  paddingY,
  radius,
  shadow,
  ...props
}: BakeryBoxProps) => {
  const translatedStyles = useMemo(
    () =>
      getBakeryStyles(
        {
          alignItems,
          background,
          color,
          display,
          flexDirection,
          gap,
          justifyContent,
          margin,
          marginBottom,
          marginTop,
          padding,
          paddingX,
          paddingY,
          radius,
          shadow,
        },
        style,
      ),
    [
      alignItems,
      background,
      color,
      display,
      flexDirection,
      gap,
      justifyContent,
      margin,
      marginBottom,
      marginTop,
      padding,
      paddingX,
      paddingY,
      radius,
      shadow,
      style,
    ],
  )

  return (
    <Component
      className={cn('bakeryBox', translatedStyles.className, className)}
      style={translatedStyles.style}
      {...props}
    >
      {children}
    </Component>
  )
}
