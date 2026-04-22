'use client'

import { DeleteItemButton } from '@/components/Cart/DeleteItemButton'
import { EditItemQuantityButton } from '@/components/Cart/EditItemQuantityButton'
import { Price } from '@/components/Price'
import { TraySelectionSummary } from '@/components/TraySelectionSummary'
import { useAuth } from '@/providers/Auth'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import type { Header, Product, Variant } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { menuHref, rotatingCookieFlavorsHref } from '@/utilities/routes'
import { ArrowRight, ChevronDown, ShoppingBag, UserRound } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { buildHeaderNavigation, isHeaderNavigationItemActive } from './constants'
import { MobileMenu } from './MobileMenu'
import { useHeaderVisibility } from './useHeaderVisibility'

type ActivePanel = 'account' | 'bag' | null

type Props = {
  brand: {
    brandName: string
    logoAlt: string
    logoUrl: string | null
  }
  header: Header
}

const FREE_SHIPPING_THRESHOLD = 100

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const headerClassNames = {
  brand: 'siteHeaderBrand',
  brandEyebrow: 'siteHeaderBrandEyebrow',
  brandLogo: 'siteHeaderBrandLogo',
  brandWordmark: 'siteHeaderBrandWordmark',
  banner: 'siteHeaderBanner',
  bannerFrame: 'siteHeaderBannerFrame',
  bannerItem: 'siteHeaderBannerItem',
  bannerList: 'siteHeaderBannerList',
  bannerLink: 'siteHeaderBannerLink',
  bannerReveal: 'siteHeaderBannerReveal',
  bannerRevealDescription: 'siteHeaderBannerRevealDescription',
  bannerRevealEyebrow: 'siteHeaderBannerRevealEyebrow',
  bannerRevealTitle: 'siteHeaderBannerRevealTitle',
  actionArea: 'siteHeaderActionArea',
  actionButton: 'siteHeaderActionButton',
  actionBadge: 'siteHeaderActionBadge',
  actionPanel: 'siteHeaderActionPanel',
  actionPanelInner: 'siteHeaderActionPanelInner',
  actionPanelTitle: 'siteHeaderActionPanelTitle',
  actionPanelList: 'siteHeaderActionPanelList',
  root: 'siteHeader',
  shell: 'siteHeaderShell',
  shellRow: 'siteHeaderShellRow',
  viewport: 'siteHeaderViewport',
} as const

export function HeaderClient({ brand, header }: Props) {
  const pathname = usePathname()
  const headerRef = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const { isScrolled } = useHeaderVisibility()
  const { cart } = useCart()
  const { user, logout } = useAuth()
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const navigationItems = useMemo(() => {
    return buildHeaderNavigation(header.navItems || []).map((item) => ({
      ...item,
      isActive: isHeaderNavigationItemActive(pathname, item),
    }))
  }, [header.navItems, pathname])

  const cartItems = useMemo(() => cart?.items ?? [], [cart?.items])
  const cartQuantity = useMemo(
    () =>
      cartItems.reduce((total, item) => {
        const itemQuantity = typeof item?.quantity === 'number' ? item.quantity : 0
        return total + itemQuantity
      }, 0),
    [cartItems],
  )
  const cartSubtotal = typeof cart?.subtotal === 'number' ? cart.subtotal : 0
  const amountUntilFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal)
  const freeShippingProgress = Math.max(0, Math.min(1, cartSubtotal / FREE_SHIPPING_THRESHOLD))

  const accountLinks = useMemo(
    () => (user ? ['/account', '/orders', '/account/addresses'] : ['/login', '/create-account']),
    [user],
  )

  const accountLabels = {
    '/account': user ? 'Account settings' : 'Log in',
    '/orders': user ? 'Orders' : 'Create account',
    '/account/addresses': 'Addresses',
    '/login': 'Log in',
    '/create-account': 'Create account',
  }

  const getAccountLabel = (href: string) => {
    return accountLabels[href as keyof typeof accountLabels]
  }

  useEffect(() => {
    setActivePanel(null)
  }, [pathname])

  useEffect(() => {
    const closePanel = () => setActivePanel(null)
    const onOutsideClick = (event: MouseEvent) => {
      if (!headerRef.current || !event.target || !activePanel) return
      if (headerRef.current.contains(event.target as Node)) return
      closePanel()
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePanel()
      }
    }

    window.addEventListener('mousedown', onOutsideClick)
    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('mousedown', onOutsideClick)
      window.removeEventListener('keydown', onEscape)
    }
  }, [activePanel])

  const handleToggle = (panel: ActivePanel) => {
    setActivePanel((current) => (current === panel ? null : panel))
  }

  const handleLogout = async () => {
    if (!logout || isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      setActivePanel(null)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header
      className={headerClassNames.root}
      data-open={Boolean(activePanel)}
      data-scrolled={isScrolled}
      ref={headerRef}
    >
      <div className={headerClassNames.viewport}>
        <div className={cn(headerClassNames.shell, 'container')}>
          <div className={headerClassNames.shellRow}>
            <Link
              aria-label={brand.brandName}
              className={cn(headerClassNames.brand, {
                'has-logo': Boolean(brand.logoUrl),
              })}
              href={rotatingCookieFlavorsHref}
            >
              {brand.logoUrl ? (
                <img
                  alt={brand.logoAlt}
                  className={headerClassNames.brandLogo}
                  loading="eager"
                  src={brand.logoUrl}
                />
              ) : (
                <>
                  <span className={headerClassNames.brandEyebrow}>Bakery and cafe</span>
                  <span className={headerClassNames.brandWordmark}>{brand.brandName}</span>
                </>
              )}
            </Link>

            <MobileMenu cartQuantity={cartQuantity} items={navigationItems} />

            <nav className={headerClassNames.banner} aria-label="Main sections">
              <div className={headerClassNames.bannerFrame}>
                <ul className={headerClassNames.bannerList}>
                  {navigationItems.map((item) => (
                    <li className={headerClassNames.bannerItem} key={item.id}>
                      <Link
                        className={cn(headerClassNames.bannerLink, {
                          'is-active': item.isActive,
                        })}
                        href={item.href}
                      >
                        {item.label}
                      </Link>

                      <div className={headerClassNames.bannerReveal}>
                        <p className={headerClassNames.bannerRevealEyebrow}>{item.panel.eyebrow}</p>
                        <p className={headerClassNames.bannerRevealTitle}>{item.label}</p>
                        <p className={headerClassNames.bannerRevealDescription}>
                          {item.panel.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            <div className={headerClassNames.actionArea}>
              <button
                aria-label={user ? `Open account menu` : 'Open account menu'}
                className={cn(
                  headerClassNames.actionButton,
                  activePanel === 'account' ? 'is-active' : null,
                )}
                onClick={() => {
                  handleToggle('account')
                }}
                type="button"
              >
                <UserRound className="h-4 w-4" />
                <span className="hidden md:inline">Account</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              <button
                aria-label={`Open cart with ${cartQuantity} items`}
                className={cn(
                  headerClassNames.actionButton,
                  activePanel === 'bag' ? 'is-active' : null,
                )}
                onClick={() => {
                  handleToggle('bag')
                }}
                type="button"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden md:inline">Cart</span>
                <span className={headerClassNames.actionBadge}>{cartQuantity}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div
            aria-live="polite"
            className={cn(
              headerClassNames.actionPanel,
              activePanel ? 'is-open' : null,
              activePanel === 'account' ? 'is-account' : activePanel === 'bag' ? 'is-bag' : '',
            )}
            ref={panelRef}
          >
            <div className={headerClassNames.actionPanelInner}>
              {activePanel === 'account' ? (
                <>
                  <p className={headerClassNames.actionPanelTitle}>
                    {user ? 'Account' : 'Sign in'} quick actions
                  </p>
                  <ul className={headerClassNames.actionPanelList}>
                    {accountLinks.map((href) => (
                      <li key={href}>
                        <Link
                          className="siteHeaderActionLink"
                          href={href}
                          onClick={() => {
                            setActivePanel(null)
                          }}
                        >
                          <span>{getAccountLabel(href)}</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {user ? (
                    <button className="siteHeaderPanelButton" onClick={handleLogout} type="button">
                      {isLoggingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                  ) : null}
                </>
              ) : null}

              {activePanel === 'bag' ? (
                <div className="siteHeaderCartQuickPanel">
                  <div className="siteHeaderCartQuickHeader">
                    <div className="siteHeaderCartQuickBadge">
                      <ShoppingBag className="h-4 w-4" />
                      <span>
                        {cartQuantity} item{cartQuantity === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="siteHeaderCartQuickTitle">Cart</p>
                      <p className="siteHeaderCartQuickDescription">
                        {cartItems.length
                          ? 'Review the order before checkout.'
                          : 'Add a few bakery items first, then come back here to review your order.'}
                      </p>
                    </div>
                  </div>

                  {cartItems.length ? (
                    <>
                      <div className="siteHeaderCartQuickProgress">
                        <div className="siteHeaderCartQuickProgressTrack">
                          <div
                            className="siteHeaderCartQuickProgressFill"
                            style={{ width: `${freeShippingProgress * 100}%` }}
                          />
                        </div>

                        <div className="siteHeaderCartQuickProgressMeta">
                          <span>
                            {amountUntilFreeShipping > 0
                              ? `${currencyFormatter.format(amountUntilFreeShipping)} away from free shipping`
                              : 'Free shipping unlocked'}
                          </span>
                          <Price amount={cartSubtotal} as="span" className="text-sm text-black" />
                        </div>
                      </div>

                      <div className="siteHeaderCartQuickItems">
                        <ul className="siteHeaderCartQuickItemsList">
                          {cartItems.map((item, index) => {
                            const product = item.product
                            const variant = item.variant
                            const itemKey = item.id || `${index}`

                            if (typeof product !== 'object' || !product) {
                              return null
                            }

                            const metaImage =
                              product.meta?.image && typeof product.meta.image === 'object'
                                ? product.meta.image
                                : undefined

                            const firstGalleryImage =
                              typeof product.gallery?.[0]?.image === 'object'
                                ? product.gallery[0].image
                                : undefined

                            let image = firstGalleryImage || metaImage
                            let price = product.priceInUSD
                            const isVariant = Boolean(variant) && typeof variant === 'object'

                            if (isVariant && variant) {
                              price = variant.priceInUSD

                              const imageVariant = product.gallery?.find(
                                (galleryItem: NonNullable<Product['gallery']>[number]) => {
                                  if (!galleryItem.variantOption) return false

                                  const variantOptionID =
                                    typeof galleryItem.variantOption === 'object'
                                      ? galleryItem.variantOption.id
                                      : galleryItem.variantOption

                                  return (
                                    variant.options?.some((option: Variant['options'][number]) => {
                                      if (typeof option === 'object') return option.id === variantOptionID
                                      return option === variantOptionID
                                    }) || false
                                  )
                                },
                              )

                              if (imageVariant && typeof imageVariant.image === 'object') {
                                image = imageVariant.image
                              }
                            }

                            const productHref =
                              product.slug ? `/products/${product.slug}` : menuHref
                            const variantSummary =
                              isVariant && variant
                                ? variant.options
                                    ?.map((option: Variant['options'][number]) => {
                                      if (typeof option === 'object') return option.label
                                      return null
                                    })
                                    .filter(Boolean)
                                    .join(', ')
                                : null

                            return (
                              <li className="siteHeaderCartQuickItem" key={itemKey}>
                                <div className="siteHeaderCartQuickItemRow">
                                  <Link
                                    className="siteHeaderCartQuickThumb"
                                    href={productHref}
                                    onClick={() => setActivePanel(null)}
                                  >
                                    {image?.url ? (
                                      <Image
                                        alt={image.alt || product.title || ''}
                                        className="h-full w-full object-cover"
                                        fill
                                        sizes="88px"
                                        src={image.url}
                                      />
                                    ) : null}
                                  </Link>

                                  <div className="siteHeaderCartQuickItemBody">
                                    <div className="siteHeaderCartQuickItemTop">
                                      <div className="siteHeaderCartQuickItemCopy">
                                        <p className="siteHeaderCartQuickItemEyebrow">
                                          {isVariant ? 'Configured item' : 'Bakery item'}
                                        </p>
                                        <Link
                                          className="siteHeaderCartQuickItemName"
                                          href={productHref}
                                          onClick={() => setActivePanel(null)}
                                        >
                                          {product.title}
                                        </Link>
                                        {variantSummary ? (
                                          <p className="siteHeaderCartQuickItemVariant">
                                            {variantSummary}
                                          </p>
                                        ) : null}
                                        <TraySelectionSummary
                                          className="mt-3"
                                          compact
                                          label="Exact tray contents"
                                          selections={item.batchSelections}
                                          tone="muted"
                                        />
                                      </div>

                                      <DeleteItemButton item={item} />
                                    </div>

                                    <div className="siteHeaderCartQuickItemBottom">
                                      <div className="siteHeaderCartQuickQuantity">
                                        <EditItemQuantityButton item={item} type="minus" />
                                        <span className="siteHeaderCartQuickQuantityValue">
                                          {item.quantity}
                                        </span>
                                        <EditItemQuantityButton item={item} type="plus" />
                                      </div>

                                      {typeof price === 'number' ? (
                                        <Price
                                          amount={price}
                                          as="span"
                                          className="siteHeaderCartQuickItemPrice"
                                        />
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>

                      <div className="siteHeaderCartQuickFooter">
                        <div className="siteHeaderCartQuickSubtotal">
                          <div>
                            <p className="siteHeaderCartQuickSubtotalEyebrow">Subtotal</p>
                            <p className="siteHeaderCartQuickSubtotalDescription">
                              Shipping and taxes are calculated during checkout.
                            </p>
                          </div>
                          <Price amount={cartSubtotal} className="siteHeaderCartQuickSubtotalPrice" />
                        </div>

                        <div className="siteHeaderCartQuickFooterActions">
                          <Link
                            className="siteHeaderCartQuickCheckout"
                            href="/checkout"
                            onClick={() => setActivePanel(null)}
                          >
                            Go to checkout
                          </Link>
                          <Link
                            className="siteHeaderCartQuickSecondaryLink"
                            href={menuHref}
                            onClick={() => setActivePanel(null)}
                          >
                            Keep browsing
                          </Link>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="siteHeaderCartQuickEmpty">
                      <div className="siteHeaderCartQuickEmptyIcon">
                        <ShoppingBag className="h-7 w-7" />
                      </div>
                      <div className="space-y-2">
                        <p className="siteHeaderCartQuickEmptyTitle">Your cart is empty.</p>
                        <p className="siteHeaderCartQuickEmptyCopy">
                          Start with the menu, then come back here to adjust quantity and check out.
                        </p>
                      </div>
                      <Link
                        className="siteHeaderCartQuickCheckout"
                        href={menuHref}
                        onClick={() => setActivePanel(null)}
                      >
                        Browse the menu
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
