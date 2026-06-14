import { aboutHref } from '@/utilities/routes'
import {
  businessCity,
  businessState,
  cottageFoodDisclosure,
  serviceAreaShort,
} from '@/utilities/businessInfo'
import { cn } from '@/utilities/cn'
import { ArrowRight, MapPin } from 'lucide-react'
import Link from 'next/link'

type FulfillmentNoteVariant = 'checkout' | 'confirmed'

type FulfillmentNoteProps = {
  className?: string
  /**
   * `checkout` sets expectations before the order is placed; `confirmed`
   * reassures after. Both share the same location + compliance fine print.
   */
  variant?: FulfillmentNoteVariant
}

const copyByVariant: Record<FulfillmentNoteVariant, { intro: string; title: string }> = {
  checkout: {
    title: 'Where we are · how you get your cookies',
    intro: `We're a home kitchen in ${businessCity}, ${businessState}. Local pickup and meetup hand-offs only — no shipping. After you order, the baker reaches out using the contact info on your account to set up a time and spot.`,
  },
  confirmed: {
    title: 'What happens next',
    intro: `Order's in. We're a home kitchen in ${businessCity}, ${businessState}, so this is a local pickup or meetup hand-off — no shipping. The baker will reach out using the contact info on your account to arrange a time and spot.`,
  },
}

/**
 * Inline, always-visible note that explains the pickup/meetup fulfillment model
 * and carries the required cottage food disclosure. Deliberately not a modal —
 * fulfillment expectations belong in the flow, not behind an interruption.
 */
export function FulfillmentNote({ className, variant = 'checkout' }: FulfillmentNoteProps) {
  const copy = copyByVariant[variant]

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[14px] border border-[#e7dcc2] bg-[#fffdf6] p-4 text-[#4a421d]',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef3df] text-[#1f3d24]"
        >
          <MapPin className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-[0.1em] text-[#1f3d24]">
            {copy.title}
          </p>
          <p className="mt-1 text-sm leading-6 text-[#5f5632]">{copy.intro}</p>
          <p className="mt-2 text-sm leading-6 text-[#5f5632]">
            We hand off around {serviceAreaShort}, plus farmers markets and pop-ups as we add them.
          </p>

          <Link
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#1f3d24] underline decoration-[#1f3d24]/30 underline-offset-4 transition hover:decoration-[#1f3d24]"
            href={aboutHref}
          >
            How ordering &amp; pickup works
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <p className="mt-3 border-t border-[#ece2cb] pt-2 text-xs leading-5 text-[#8a7d5c]">
            {cottageFoodDisclosure}
          </p>
        </div>
      </div>
    </div>
  )
}
