'use client'

import React, { useMemo, type CSSProperties } from 'react'

import { cn } from '@/utilities/cn'

import { getBakeryStyles, type BakeryStyleProps } from './styleProps'

type BakeryBoxProps = BakeryStyleProps &
  Omit<React.HTMLAttributes<HTMLElement>, 'color'> & {
    as?: React.ElementType
    disabled?: boolean
    style?: CSSProperties
    type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type']
    [key: `data-${string}`]: string | number | boolean | undefined
  }

export const BakeryBox = React.forwardRef<HTMLElement, BakeryBoxProps>(
  (
    {
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
    },
    ref,
  ) => {
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
        ref={ref}
        style={translatedStyles.style}
        {...props}
      >
        {children}
      </Component>
    )
  },
)

BakeryBox.displayName = 'BakeryBox'
