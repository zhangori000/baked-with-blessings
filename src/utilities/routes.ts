export const rotatingCookieFlavorsHref = '/rotating-cookie-flavors'
export const menuHref = '/menu'
export const contactHref = '/contact'
export const blogHref = '/blog'
export const discussionBoardHref = '/discussion-board'
export const reviewsHref = '/reviews'
export const blessingsNetworkHref = '/blessings-network'
export const customerLoginHref = `${rotatingCookieFlavorsHref}?account=login`

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

  return `${rotatingCookieFlavorsHref}?${params.toString()}`
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
