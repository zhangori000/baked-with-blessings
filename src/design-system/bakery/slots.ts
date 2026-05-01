import type { CSSProperties } from 'react'

export type BakerySlotClassNames<Slot extends string> = Partial<Record<Slot, string>>

export type BakerySlotStyles<Slot extends string> = Partial<Record<Slot, CSSProperties>>
