import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  path.join(process.cwd(), 'src/app/(app)/HomeCookieCarousel.client.tsx'),
  'utf8',
)

const getCssBlocks = (selector: string) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = source.matchAll(
    new RegExp(`\\n        ${escapedSelector} \\{([\\s\\S]*?)\\n        \\}`, 'g'),
  )

  return Array.from(matches, (match) => match[1] ?? '')
}

const getCssBlock = (selector: string, requiredSnippet?: string) => {
  const blocks = getCssBlocks(selector)

  return requiredSnippet
    ? (blocks.find((block) => block.includes(requiredSnippet)) ?? '')
    : (blocks[0] ?? '')
}

describe('HomeCookieCarousel control layout invariants', () => {
  it('keeps carousel arrows in fixed grid cells while cookie names wrap inside a fixed-height slot', () => {
    const controls = getCssBlock('.homeCookieControls')
    const shell = getCssBlock('.homeCookieNameButtonShell')
    const nameButton = getCssBlock('.homeCookieNameButton', 'height: var(--name-button-height);')
    const nameText = getCssBlock('.homeCookieNameText')
    const arrow = getCssBlock('.homeCookieArrow', 'height: var(--control-size);')

    expect(controls).toContain('display: inline-grid;')
    expect(controls).toContain('--name-button-fallback-width: var(--cta-width);')
    expect(controls).toContain('--name-button-height: var(--control-size);')
    expect(controls).toContain('height: var(--name-button-height);')
    expect(controls).toContain('var(--control-size) minmax(0, var(--name-button-target-width))')

    expect(shell).toContain('height: var(--name-button-height);')

    expect(nameButton).toContain('height: var(--name-button-height);')
    expect(nameButton).toContain('overflow: hidden;')
    expect(nameButton).toContain('padding: 0.32rem var(--cta-padding-x);')

    expect(nameText).toContain('-webkit-line-clamp: 3;')
    expect(nameText).toContain('overflow-wrap: anywhere;')
    expect(nameText).toContain('overflow: hidden;')
    expect(nameText).toContain('white-space: normal;')

    expect(arrow).toContain('height: var(--control-size);')
    expect(arrow).toContain('width: var(--control-size);')
    expect(arrow).toContain('position: relative;')
    expect(arrow).not.toContain('position: absolute;')

    expect(source).toContain('--name-button-font-size: clamp(0.68rem, 3vw, 0.82rem);')
    expect(source).toContain('--name-button-height: 4.25rem;')
    expect(source).toContain(
      '--name-button-fallback-width: min(13.25rem, var(--name-button-max-width));',
    )
    expect(source).toContain('--name-button-font-size: clamp(0.82rem, 1.9vw, 0.95rem);')
    expect(source).toContain('--name-button-height: 4.05rem;')
    expect(source).toContain(
      '--name-button-fallback-width: min(16rem, var(--name-button-max-width));',
    )
  })
})
