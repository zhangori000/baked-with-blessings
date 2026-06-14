export const rotationsHref = '/rotations'
export const menuHref = '/menu'
/** Deep link that opens /menu with the Catering tab active. */
export const cateringMenuHref = `${menuHref}?section=catering`
export const aboutHref = '/about'
export const contactHref = '/contact'
export const blogHref = '/blog'
export const discussionBoardHref = '/discussion-board'
export const reviewsHref = '/reviews'
export const blessingsNetworkHref = '/blessings-network'
export const communityHref = '/community'
export const featureRequestsHref = '/feature-requests'
export const customerLoginHref = `${rotationsHref}?account=login`

export const buildCustomerLoginHref = ({
  redirect,
  warning,
}: {
  redirect?: null | string
  warning?: null | string
} = {}) => {
  const params = new URLSearchParams({
    account: 'login',
  })

  if (redirect?.startsWith('/') && !redirect.startsWith('//')) {
    params.set('redirect', redirect)
  }

  if (warning?.trim()) {
    params.set('warning', warning.trim())
  }

  return `${rotationsHref}?${params.toString()}`
}

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
