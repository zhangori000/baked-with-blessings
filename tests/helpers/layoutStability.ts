import type { Locator } from '@playwright/test'
import { expect } from '@playwright/test'

type Box = { height: number; width: number; x: number; y: number }

export type LayoutStabilityOptions = {
  action: () => Promise<void>
  label?: string
  settleMs?: number
  tolerancePx?: number
  watch: Record<string, Locator>
}

const measure = (locator: Locator): Promise<Box[]> =>
  locator.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect()
      return {
        height: rect.height,
        width: rect.width,
        x: rect.x + window.scrollX,
        y: rect.y + window.scrollY,
      }
    }),
  )

const measureAll = async (watch: Record<string, Locator>) => {
  const entries = await Promise.all(
    Object.entries(watch).map(async ([name, locator]) => [name, await measure(locator)] as const),
  )
  return Object.fromEntries(entries)
}

export async function expectLayoutStable({
  action,
  label = 'action',
  settleMs = 250,
  tolerancePx = 0.5,
  watch,
}: LayoutStabilityOptions) {
  const page = Object.values(watch)[0]?.page()
  const before = await measureAll(watch)

  await action()
  await page?.waitForTimeout(settleMs)

  const after = await measureAll(watch)
  const shifts: string[] = []

  for (const [name, beforeBoxes] of Object.entries(before)) {
    const afterBoxes = after[name] ?? []

    if (afterBoxes.length !== beforeBoxes.length) {
      shifts.push(`${name}: element count ${beforeBoxes.length} → ${afterBoxes.length}`)
      continue
    }

    beforeBoxes.forEach((box, index) => {
      const next = afterBoxes[index]
      for (const key of ['x', 'y', 'width', 'height'] as const) {
        const delta = Math.abs(box[key] - next[key])
        if (delta > tolerancePx) {
          shifts.push(
            `${name}[${index}].${key}: ${box[key].toFixed(1)} → ${next[key].toFixed(1)} (Δ${delta.toFixed(1)}px)`,
          )
        }
      }
    })
  }

  expect(shifts, `Layout shifted after ${label}:\n${shifts.join('\n')}`).toEqual([])
}
