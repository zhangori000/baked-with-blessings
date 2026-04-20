import type { Product } from '@/payload-types'
import { cn } from '@/utilities/cn'

type TraySelection = {
  product?: number | Product | null
  quantity?: number | null
}

type Props = {
  className?: string
  compact?: boolean
  label?: string
  selections?: TraySelection[] | null
  tone?: 'muted' | 'warm'
}

const resolveSelectionLabel = (selection: TraySelection) => {
  if (selection.product && typeof selection.product === 'object' && selection.product.title) {
    return selection.product.title
  }

  return 'Selected item'
}

export function TraySelectionSummary({
  className,
  compact = false,
  label = 'Tray build',
  selections,
  tone = 'warm',
}: Props) {
  const normalizedSelections =
    selections?.filter((selection) => typeof selection.quantity === 'number' && selection.quantity > 0) ??
    []

  if (normalizedSelections.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p
        className={cn(
          'uppercase tracking-[0.22em]',
          compact ? 'text-[0.62rem]' : 'text-[0.68rem]',
          tone === 'muted' ? 'text-black/42' : 'text-[rgba(52,36,23,0.58)]',
        )}
      >
        {label}
      </p>

      <div className="flex flex-wrap gap-2">
        {normalizedSelections.map((selection, index) => (
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm leading-none',
              compact ? 'text-[0.76rem]' : 'text-[0.83rem]',
              tone === 'muted'
                ? 'border-black/10 bg-black/[0.04] text-black/70'
                : 'border-[rgba(91,70,37,0.14)] bg-[rgba(255,250,242,0.88)] text-[#473523]',
            )}
            key={`${resolveSelectionLabel(selection)}-${index}`}
          >
            <span className="font-medium">{resolveSelectionLabel(selection)}</span>
            <span
              className={cn(
                'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.68rem] font-semibold',
                tone === 'muted' ? 'bg-black/8 text-black/72' : 'bg-[#1f2b14] text-white',
              )}
            >
              x{selection.quantity}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
