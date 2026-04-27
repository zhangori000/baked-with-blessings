import type { Product } from '@/payload-types'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const routeState = vi.hoisted(() => ({
  query: 'variant=variant-b',
}))

const carouselState = vi.hoisted(() => ({
  scrollTo: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(routeState.query),
}))

vi.mock('@/components/Media', () => ({
  Media: ({
    resource,
  }: {
    resource?: { alt?: string; id?: number | string } | string | number
  }) => (
    <div data-testid="main-image">
      {typeof resource === 'object' ? resource.alt || resource.id : resource}
    </div>
  ),
}))

vi.mock('@/components/Grid/tile', () => ({
  GridTileImage: ({
    active,
    media,
  }: {
    active?: boolean
    media: { alt?: string; id?: number | string }
  }) => (
    <span data-active={active ? 'true' : 'false'} data-testid={`thumb-${media.id}`}>
      {media.alt}
    </span>
  ),
}))

vi.mock('@/components/ui/carousel', async () => {
  const React = await vi.importActual<typeof import('react')>('react')

  return {
    Carousel: ({
      children,
      setApi,
    }: {
      children: React.ReactNode
      setApi?: (api: { scrollTo: (index: number, jump?: boolean) => void }) => void
    }) => {
      React.useEffect(() => {
        setApi?.({ scrollTo: carouselState.scrollTo })
      }, [setApi])

      return <div>{children}</div>
    },
    CarouselContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CarouselItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
      <button onClick={onClick} type="button">
        {children}
      </button>
    ),
  }
})

const gallery = [
  {
    image: { alt: 'Image A', id: 'image-a' },
    variantOption: 'variant-a',
  },
  {
    image: { alt: 'Image B', id: 'image-b' },
    variantOption: 'variant-b',
  },
  {
    image: { alt: 'Image C', id: 'image-c' },
    variantOption: 'variant-c',
  },
] as unknown as NonNullable<Product['gallery']>

describe('Gallery', () => {
  beforeEach(() => {
    routeState.query = 'variant=variant-b'
    carouselState.scrollTo.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('uses a variant query as the initial image without locking manual thumbnail selection', async () => {
    const { Gallery } = await import('@/components/product/Gallery')
    const { rerender } = render(<Gallery gallery={gallery} />)

    expect(screen.getByTestId('main-image').textContent).toContain('Image B')
    expect(screen.getByTestId('thumb-image-b').getAttribute('data-active')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Image A' }))

    expect(screen.getByTestId('main-image').textContent).toContain('Image A')
    expect(screen.getByTestId('thumb-image-a').getAttribute('data-active')).toBe('true')

    routeState.query = 'variant=variant-c'
    rerender(<Gallery gallery={gallery} />)

    expect(screen.getByTestId('main-image').textContent).toContain('Image C')
    expect(screen.getByTestId('thumb-image-c').getAttribute('data-active')).toBe('true')
  })
})
