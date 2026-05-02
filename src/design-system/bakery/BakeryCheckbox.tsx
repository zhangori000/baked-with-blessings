'use client'

import { Check } from 'lucide-react'
import React, { forwardRef, useId } from 'react'

import { cn } from '@/utilities/cn'

type BakeryCheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> & {
  children?: React.ReactNode
  description?: React.ReactNode
  size?: 'md' | 'sm'
}

export const BakeryCheckbox = forwardRef<HTMLInputElement, BakeryCheckboxProps>(
  function BakeryCheckbox(
    { children, className, description, disabled, id, size = 'md', ...inputProps },
    ref,
  ) {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const descriptionId = description ? `${inputId}-description` : undefined

    return (
      <label
        className={cn(
          'bakeryCheckbox',
          size === 'sm' && 'bakeryCheckbox-sm',
          disabled && 'bakeryCheckbox-disabled',
          className,
        )}
        htmlFor={inputId}
      >
        <input
          {...inputProps}
          aria-describedby={descriptionId}
          className="bakeryCheckboxInput"
          disabled={disabled}
          id={inputId}
          ref={ref}
          type="checkbox"
        />
        <span aria-hidden="true" className="bakeryCheckboxBox">
          <Check className="bakeryCheckboxIcon" strokeWidth={3} />
        </span>
        {children || description ? (
          <span className="bakeryCheckboxText">
            {children ? <span className="bakeryCheckboxLabel">{children}</span> : null}
            {description ? (
              <span className="bakeryCheckboxDescription" id={descriptionId}>
                {description}
              </span>
            ) : null}
          </span>
        ) : null}
      </label>
    )
  },
)
