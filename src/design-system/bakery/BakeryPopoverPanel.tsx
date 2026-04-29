'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react'

import { cn } from '@/utilities/cn'

type BakeryPopoverPanelApi = {
  closePopover: () => void
}

type BakeryPopoverPanelContent = ReactNode | ((api: BakeryPopoverPanelApi) => ReactNode)

type BakeryPopoverPanelProps = {
  block?: boolean
  children: ReactNode
  className?: string
  content: BakeryPopoverPanelContent
  contentClassName?: string
  contentStyle?: CSSProperties
  disabled?: boolean
  onClose: () => void
  onOpen?: () => void
  openOnTriggerPress?: boolean
  placement?: 'bottom' | 'bottom-end' | 'bottom-start' | 'top' | 'top-end' | 'top-start'
  role?: 'dialog' | 'menu'
  style?: CSSProperties
  visible: boolean
}

const assignRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
  if (!ref) return

  if (typeof ref === 'function') {
    ref(value)
    return
  }

  ref.current = value
}

export const BakeryPopoverPanel = forwardRef<HTMLDivElement, BakeryPopoverPanelProps>(
  function BakeryPopoverPanel(
    {
      block = false,
      children,
      className,
      content,
      contentClassName,
      contentStyle,
      disabled = false,
      onClose,
      onOpen,
      openOnTriggerPress = false,
      placement = 'bottom-start',
      role = 'dialog',
      style,
      visible,
    },
    forwardedRef,
  ) {
    const rootRef = useRef<HTMLDivElement | null>(null)

    const setRootRef = useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node
        assignRef(forwardedRef, node)
      },
      [forwardedRef],
    )

    const handleSubjectClick = useCallback(() => {
      if (disabled || visible || !openOnTriggerPress) {
        return
      }

      onOpen?.()
    }, [disabled, onOpen, openOnTriggerPress, visible])

    useEffect(() => {
      if (!visible || disabled) {
        return
      }

      const closeIfOutside = (event: PointerEvent) => {
        if (!rootRef.current || !event.target) {
          return
        }

        if (rootRef.current.contains(event.target as Node)) {
          return
        }

        onClose()
      }

      const closeOnEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }

      window.addEventListener('pointerdown', closeIfOutside, true)
      window.addEventListener('keydown', closeOnEscape)

      return () => {
        window.removeEventListener('pointerdown', closeIfOutside, true)
        window.removeEventListener('keydown', closeOnEscape)
      }
    }, [disabled, onClose, visible])

    const contentApi = useMemo(() => ({ closePopover: onClose }), [onClose])
    const resolvedContent = typeof content === 'function' ? content(contentApi) : content

    return (
      <div
        className={cn('bakeryPopoverPanel', block && 'bakeryPopoverPanel-block', className)}
        data-open={visible || undefined}
        onClick={handleSubjectClick}
        ref={setRootRef}
        style={style}
      >
        {children}
        {visible && !disabled ? (
          <div
            className={cn(
              'bakeryPopoverPanelContent',
              `bakeryPopoverPanelContent-${placement}`,
              contentClassName,
            )}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            role={role}
            style={contentStyle}
          >
            {resolvedContent}
          </div>
        ) : null}
      </div>
    )
  },
)
