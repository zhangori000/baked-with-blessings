import { OrderStatus as StatusOptions } from '@/payload-types'
import { cn } from '@/utilities/cn'

type Props = {
  status: StatusOptions
  className?: string
}

type StatusValue = Exclude<StatusOptions, null | undefined>

const statusLabels: Partial<Record<StatusValue, string>> = {
  cancelled: 'cancelled',
  completed: 'completed',
  confirmed: 'confirmed',
  processing: 'requested',
  ready: 'ready for pickup',
  refunded: 'refunded',
}

export const OrderStatus: React.FC<Props> = ({ status, className }) => {
  return (
    <div
      className={cn(
        'w-fit rounded px-2 py-0 font-mono text-xs font-bold uppercase tracking-widest text-[#4b421d]',
        className,
        {
          'bg-[#f2e4a6]': status === 'processing',
          'bg-[#f5d9a8]': status === 'confirmed',
          'bg-[#cfe8f5] text-[#173447]': status === 'ready',
          'bg-[#d6efc7] text-[#173f23]': status === 'completed',
          'bg-[#eadfd6] text-[#5a4636]': status === 'cancelled' || status === 'refunded',
        },
      )}
    >
      {(status ? statusLabels[status] : null) ?? status}
    </div>
  )
}
