'use client'

import { ProgressBloom } from '@/components/flowers/ProgressBloom'
import { cn } from '@/utilities/cn'
import React from 'react'

type ProgressGardenProps = {
  aside?: React.ReactNode
  className?: string
  currentCount: number
  label: string
  totalCount: number
  title: string
}

export function ProgressGarden({
  aside,
  className,
  currentCount,
  label,
  totalCount,
  title,
}: ProgressGardenProps) {
  const safeTotal = totalCount > 0 ? totalCount : 1
  const progressPercentage = Math.min(1, currentCount / safeTotal) * 100

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1rem] border border-[rgba(91,70,37,0.1)] bg-[#fff8f2] px-3 py-2 shadow-[0_8px_16px_rgba(23,21,16,0.04)]',
        className,
      )}
    >
      <div className="relative z-[1] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="space-y-0">
            <p className="cateringMenuEyebrow">{label}</p>
            <h4 className="cateringMenuRoundHeading text-[0.88rem] leading-tight tracking-[-0.02em] text-[#171510]">
              {title}
            </h4>
          </div>

          {aside ? <div className="text-right">{aside}</div> : null}
        </div>

        <div className="pt-1.5">
          <div className="relative h-2.5 rounded-full bg-[rgba(126,161,47,0.18)]">
            <div
              className="h-full rounded-full bg-[#7ea12f] transition-[width] duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />

            {Array.from({ length: currentCount }, (_, index) => (
              <ProgressBloom
                key={`slot-${index}`}
                left={`${((index + 1) / safeTotal) * 100}%`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
