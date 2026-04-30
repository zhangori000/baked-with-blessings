export const rotatingCookieFlavorsHref = '/rotating-cookie-flavors'
export const menuHref = '/menu'
export const contactHref = '/contact'
export const blogHref = '/blog'
export const discussionBoardHref = '/discussion-board'
export const reviewsHref = '/reviews'
export const blessingsNetworkHref = '/blessings-network'

const normalizeRouteHint = (value?: string | null) =>
  value?.trim().toLowerCase().replace(/\/+$/, '')

export const isContactLinkHint = ({
  href,
  label,
  slug,
}: {
  href?: string | null
  label?: string | null
  slug?: string | null
}) => {
  const normalizedHref = normalizeRouteHint(href)
  const normalizedLabel = normalizeRouteHint(label)
  const normalizedSlug = normalizeRouteHint(slug)

  return (
    normalizedHref === 'contact' ||
    normalizedHref === contactHref ||
    normalizedLabel === 'contact' ||
    normalizedLabel === 'contact us' ||
    normalizedSlug === 'contact'
  )
}
