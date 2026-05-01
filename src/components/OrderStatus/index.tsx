import { OrderStatus as StatusOptions } from '@/payload-types'
import { cn } from '@/utilities/cn'

type Props = {
  status: StatusOptions
  className?: string
}

export const OrderStatus: React.FC<Props> = ({ status, className }) => {
  return (
    <div
      className={cn(
        'w-fit rounded px-2 py-0 font-mono text-xs font-bold uppercase tracking-widest text-[#4b421d]',
        className,
        {
          'bg-[#f2e4a6]': status === 'processing',
          'bg-[#d6efc7] text-[#173f23]': status === 'completed',
        },
      )}
    >
      {status}
    </div>
  )
}
