'use client'

import { DeleteItemButton } from '@/components/Cart/DeleteItemButton'
import { EditItemQuantityButton } from '@/components/Cart/EditItemQuantityButton'
import { CartModal } from '@/components/Cart/CartModal'
import { Price } from '@/components/Price'
import { TraySelectionSummary } from '@/components/TraySelectionSummary'
import {
  BakeryAction,
  BakeryCard,
  BakeryPressable,
  useBakeryAnnouncer,
} from '@/design-system/bakery'
import { useAuth } from '@/providers/Auth'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import type { Header, Product, Variant } from '@/payload-types'
import { cn } from '@/utilities/cn'
import {
  blessingsNetworkHref,
  blogHref,
  contactHref,
  discussionBoardHref,
  menuHref,
  reviewsHref,
  rotatingCookieFlavorsHref,
} from '@/utilities/routes'
import { resolveMediaDisplayURL } from '@/utilities/resolveMediaDisplayURL'
import {
  ArrowRight,
  BookOpenText,
  ChevronDown,
  ClipboardCheck,
  Eye,
  EyeOff,
  Handshake,
  LoaderCircle,
  MessageSquareText,
  PanelsTopLeft,
  ShoppingBag,
  UserRound,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import { buildHeaderNavigation, isHeaderNavigationItemActive } from './constants'
import { MobileMenu } from './MobileMenu'
import { useHeaderVisibility } from './useHeaderVisibility'

type ActivePanel = 'account' | 'bag' | 'more' | null

type Props = {
  brand: {
    brandName: string
    logoAlt: string
    logoUrl: string | null
  }
  header: Header
}

type HeaderAdminUser = {
  email?: string | null
  id?: number | string
}

type AdminMeResponse = {
  user?: HeaderAdminUser | null
}

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

const getActiveAppLabel = (pathname: string) => {
  if (pathname === blogHref || pathname.startsWith(`${blogHref}/`)) return 'Blog'
  if (pathname === reviewsHref || pathname.startsWith(`${reviewsHref}/`)) return 'Reviews'
  if (pathname === blessingsNetworkHref || pathname.startsWith(`${blessingsNetworkHref}/`)) {
    return 'Community Advice'
  }
  if (pathname === discussionBoardHref || pathname.startsWith(`${discussionBoardHref}/`)) {
    return 'Discussion Board'
  }

  return null
}

const appsNavigationLabel = 'Other pages'

const formatCartQuantity = (quantity: number) => `${quantity} item${quantity === 1 ? '' : 's'}`

const getSafeLocalRedirect = (value: null | string) => {
  if (!value?.startsWith('/') || value.startsWith('//')) {
    return null
  }

  return value
}

const isEmailLike = (value: string) => /\S+@\S+\.\S+/.test(value.trim())

export function HeaderClient({ brand, header }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const headerRef = useRef<HTMLElement | null>(null)
  const panelInnerRef = useRef<HTMLDivElement | null>(null)
  const { isScrolled } = useHeaderVisibility()
  const { announce } = useBakeryAnnouncer()
  const { cart } = useCart()
  const { user, login, logout } = useAuth()
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [accountWarning, setAccountWarning] = useState<string | null>(null)
  const [customerLoginIdentifier, setCustomerLoginIdentifier] = useState('')
  const [customerLoginPassword, setCustomerLoginPassword] = useState('')
  const [customerLoginError, setCustomerLoginError] = useState<string | null>(null)
  const [isCustomerLoginSubmitting, setIsCustomerLoginSubmitting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showCustomerLoginPassword, setShowCustomerLoginPassword] = useState(false)
  const [adminSessionUser, setAdminSessionUser] = useState<HeaderAdminUser | null>(null)
  const [isAdminSessionLoading, setIsAdminSessionLoading] = useState(true)

  const hasSignedInAccount = Boolean(user || adminSessionUser)
  const isAccountSessionPending = !user && isAdminSessionLoading
  const signedInAccountLabel = user ? 'Customer account' : adminSessionUser ? 'Owner workspace' : null
  const signedInAccountDetail = user?.email ?? adminSessionUser?.email ?? 'Signed in'

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

  const accountLinks = useMemo(() => {
    if (user) return ['/account', '/orders', '/account/addresses']
    if (adminSessionUser) return ['/admin']
    return []
  }, [adminSessionUser, user])
  const activeAppLabel = getActiveAppLabel(pathname)

  const accountLabels = {
    '/account': user ? 'Account settings' : 'Log in',
    '/admin': 'Dashboard',
    '/orders': user ? 'Orders' : 'Create account',
    '/account/addresses': 'Addresses',
    '/login': 'Log in',
    '/create-account': 'Create account',
  }

  const getAccountLabel = (href: string) => {
    return accountLabels[href as keyof typeof accountLabels]
  }

  const appsButtonLabel = activeAppLabel || appsNavigationLabel

  useEffect(() => {
    setActivePanel(null)
  }, [pathname])

  useEffect(() => {
    const currentSearchParams = new URLSearchParams(window.location.search)
    setAccountWarning(currentSearchParams.get('warning'))

    if (!user && currentSearchParams.get('account') === 'login') {
      setActivePanel('account')
    }
  }, [pathname, user])

  useEffect(() => {
    router.prefetch(menuHref)
    router.prefetch(rotatingCookieFlavorsHref)
    router.prefetch(contactHref)
    router.prefetch(blogHref)
    router.prefetch(discussionBoardHref)
    router.prefetch(blessingsNetworkHref)
    router.prefetch(reviewsHref)
  }, [router])

  useEffect(() => {
    const closePanel = () => setActivePanel(null)
    const onPointerDown = (event: PointerEvent) => {
      if (!panelInnerRef.current || !event.target || !activePanel) return
      if (panelInnerRef.current.contains(event.target as Node)) return

      const target = event.target as HTMLElement
      if (target.closest(`.${headerClassNames.actionButton}`)) return
      if (target.closest(`.${headerClassNames.bannerLink}`)) return
      if (target.closest('.siteHeaderMobileAccountButton')) return
      if (target.closest('.siteHeaderMobileBagButton')) return

      closePanel()
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePanel()
      }
    }

    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onEscape)
    }
  }, [activePanel])

  useEffect(() => {
    let isCurrent = true

    if (user) {
      setAdminSessionUser(null)
      setIsAdminSessionLoading(false)
      return () => {
        isCurrent = false
      }
    }

    const loadAdminSession = async () => {
      setIsAdminSessionLoading(true)

      try {
        const response = await fetch('/api/admins/me', {
          cache: 'no-store',
          credentials: 'include',
        })

        if (!isCurrent) return

        if (!response.ok) {
          setAdminSessionUser(null)
          return
        }

        const data = (await response.json()) as AdminMeResponse
        setAdminSessionUser(data.user ?? null)
      } catch {
        if (isCurrent) {
          setAdminSessionUser(null)
        }
      } finally {
        if (isCurrent) {
          setIsAdminSessionLoading(false)
        }
      }
    }

    void loadAdminSession()

    return () => {
      isCurrent = false
    }
  }, [user])

  const accountPanelName = hasSignedInAccount ? 'Account menu' : 'Sign-in menu'

  const announceHeaderPanelClosed = (panel: ActivePanel) => {
    if (panel === 'account') {
      announce(`${accountPanelName} closed.`)
      return
    }

    if (panel === 'more') {
      announce('Other pages menu closed.')
      return
    }

    if (panel === 'bag') {
      announce('Cart panel closed.')
    }
  }

  const toggleHeaderPanel = (
    panel: Exclude<ActivePanel, null>,
    openMessage: string,
    closeMessage: string,
  ) => {
    const willOpen = activePanel !== panel
    setActivePanel(willOpen ? panel : null)
    announce(willOpen ? openMessage : closeMessage)
  }

  const openCartModal = () => {
    setActivePanel(null)
    announce(`Cart opened. ${formatCartQuantity(cartQuantity)} in cart.`)
    window.dispatchEvent(new Event('bwb:open-cart'))
  }

  const handleCustomerLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isCustomerLoginSubmitting) {
      return
    }

    const identifier = customerLoginIdentifier.trim()
    const password = customerLoginPassword.trim()

    if (!identifier || !password) {
      setCustomerLoginError('Enter your customer email or phone number and password.')
      return
    }

    setCustomerLoginError(null)
    setIsCustomerLoginSubmitting(true)

    try {
      await login({
        identifier,
        password,
      })

      setCustomerLoginIdentifier('')
      setCustomerLoginPassword('')
      setShowCustomerLoginPassword(false)
      setActivePanel(null)
      announce('Customer account signed in.')

      const redirectPath = getSafeLocalRedirect(
        new URLSearchParams(window.location.search).get('redirect'),
      )

      if (redirectPath) {
        router.push(redirectPath)
      } else {
        router.refresh()
      }
    } catch {
      if (isEmailLike(identifier)) {
        const adminLoginResponse = await fetch('/api/admins/login', {
          body: JSON.stringify({
            email: identifier.toLowerCase(),
            password,
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (adminLoginResponse.ok) {
          setCustomerLoginIdentifier('')
          setCustomerLoginPassword('')
          setShowCustomerLoginPassword(false)
          setActivePanel(null)
          window.location.assign('/admin')
          return
        }
      }

      setCustomerLoginError('That email, phone, and password combination did not match an account.')
    } finally {
      setIsCustomerLoginSubmitting(false)
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      if (user && logout) {
        await logout()
      }

      if (adminSessionUser) {
        await fetch('/api/admins/logout', {
          credentials: 'include',
          method: 'POST',
        })
        setAdminSessionUser(null)
      }

      setActivePanel(null)
      router.refresh()
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
      {activePanel ? (
        <BakeryPressable
          aria-label="Close open header panel"
          className="siteHeaderPanelBackdrop"
          onClick={() => {
            announceHeaderPanelClosed(activePanel)
            setActivePanel(null)
          }}
          type="button"
        />
      ) : null}

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
                <Image
                  alt={brand.logoAlt}
                  className={headerClassNames.brandLogo}
                  height={80}
                  priority
                  src={brand.logoUrl}
                  unoptimized
                  width={180}
                />
              ) : (
                <>
                  <span className={headerClassNames.brandEyebrow}>Bakery and cafe</span>
                  <span className={headerClassNames.brandWordmark}>{brand.brandName}</span>
                </>
              )}
            </Link>

            <MobileMenu
              accountButtonLabel={hasSignedInAccount ? 'Open account menu' : 'Open sign-in menu'}
              cartQuantity={cartQuantity}
              isAccountOpen={activePanel === 'account'}
              items={navigationItems}
              onOpenAccount={() => {
                toggleHeaderPanel(
                  'account',
                  `${accountPanelName} opened.`,
                  `${accountPanelName} closed.`,
                )
              }}
              onOpenCart={openCartModal}
            />

            <nav className={headerClassNames.banner} aria-label="Main sections">
              <div className={headerClassNames.bannerFrame}>
                <ul className={headerClassNames.bannerList}>
                  {navigationItems.map((item) => (
                    <li className={headerClassNames.bannerItem} key={item.id}>
                      {item.kind === 'apps' ? (
                        <BakeryPressable
                          aria-label={`${appsButtonLabel}. Open other pages menu`}
                          aria-expanded={activePanel === 'more'}
                          className={cn(headerClassNames.bannerLink, 'siteHeaderBannerButton', {
                            'is-active': item.isActive || activePanel === 'more',
                          })}
                          onClick={() => {
                            toggleHeaderPanel(
                              'more',
                              'Other pages menu opened.',
                              'Other pages menu closed.',
                            )
                          }}
                          type="button"
                        >
                          <span className="siteHeaderBannerLabel">{appsButtonLabel}</span>
                          <ChevronDown className="siteHeaderBannerDropdownIcon" />
                        </BakeryPressable>
                      ) : (
                        <Link
                          className={cn(headerClassNames.bannerLink, {
                            'is-active': item.isActive,
                          })}
                          href={item.href}
                        >
                          {item.label}
                        </Link>
                      )}

                      {item.kind === 'apps' ? null : (
                        <div className={headerClassNames.bannerReveal}>
                          <p className={headerClassNames.bannerRevealEyebrow}>
                            {item.panel.eyebrow}
                          </p>
                          <p className={headerClassNames.bannerRevealTitle}>{item.label}</p>
                          <p className={headerClassNames.bannerRevealDescription}>
                            {item.panel.description}
                          </p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            <div className={headerClassNames.actionArea}>
              <BakeryPressable
                aria-label={user ? `Open account menu` : 'Open account menu'}
                className={cn(
                  headerClassNames.actionButton,
                  activePanel === 'account' ? 'is-active' : null,
                )}
                onClick={() => {
                  toggleHeaderPanel(
                    'account',
                    `${accountPanelName} opened.`,
                    `${accountPanelName} closed.`,
                  )
                }}
                type="button"
              >
                <UserRound className="h-4 w-4" />
                <span className="hidden md:inline">Account</span>
                <ChevronDown className="h-3 w-3" />
              </BakeryPressable>

              <BakeryPressable
                aria-label={`Open cart with ${cartQuantity} items`}
                className={cn(
                  headerClassNames.actionButton,
                  activePanel === 'bag' ? 'is-active' : null,
                )}
                onClick={() => {
                  openCartModal()
                }}
                type="button"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden md:inline">Cart</span>
                <span className={headerClassNames.actionBadge}>{cartQuantity}</span>
                <ChevronDown className="h-3 w-3" />
              </BakeryPressable>
            </div>
          </div>

          <div
            aria-live="polite"
            className={cn(
              headerClassNames.actionPanel,
              activePanel ? 'is-open' : null,
              activePanel === 'account'
                ? 'is-account'
                : activePanel === 'bag'
                  ? 'is-bag'
                  : activePanel === 'more'
                    ? 'is-more'
                    : '',
            )}
          >
            <BakeryCard
              className={headerClassNames.actionPanelInner}
              radius="xl"
              ref={panelInnerRef}
              spacing="none"
              tone="transparent"
            >
              {activePanel === 'more' ? (
                <div className="siteHeaderAppsPanel">
                  <div className="siteHeaderAppsHeader">
                    <div className="siteHeaderAppsBadge">
                      <PanelsTopLeft className="h-4 w-4" />
                      <span>{appsNavigationLabel}</span>
                    </div>
                    <div>
                      <p className="siteHeaderAppsTitle">Other Pages</p>
                      <p className="siteHeaderAppsDescription">
                        Open reusable public tools connected to the bakery.
                      </p>
                    </div>
                  </div>

                  <BakeryCard
                    as={Link}
                    className="siteHeaderAppCard"
                    href={blogHref}
                    onClick={() => setActivePanel(null)}
                    radius="md"
                    spacing="none"
                    tone="transparent"
                  >
                    <span className="siteHeaderAppIcon" aria-hidden="true">
                      <BookOpenText className="h-5 w-5" />
                    </span>
                    <span className="siteHeaderAppCopy">
                      <span className="siteHeaderAppEyebrow">Writing</span>
                      <span className="siteHeaderAppTitle">Blog</span>
                      <span className="siteHeaderAppDescription">
                        Notes and essays about school, business, community, and building the bakery.
                      </span>
                    </span>
                    <ArrowRight className="siteHeaderAppArrow h-4 w-4" />
                  </BakeryCard>

                  <BakeryCard
                    as={Link}
                    className="siteHeaderAppCard"
                    href={discussionBoardHref}
                    onClick={() => setActivePanel(null)}
                    radius="md"
                    spacing="none"
                    tone="transparent"
                  >
                    <span className="siteHeaderAppIcon" aria-hidden="true">
                      <MessageSquareText className="h-5 w-5" />
                    </span>
                    <span className="siteHeaderAppCopy">
                      <span className="siteHeaderAppEyebrow">Community</span>
                      <span className="siteHeaderAppTitle">Discussion Board</span>
                      <span className="siteHeaderAppDescription">
                        Open questions, replies, support paths, and challenges in one structured
                        board.
                      </span>
                    </span>
                    <ArrowRight className="siteHeaderAppArrow h-4 w-4" />
                  </BakeryCard>

                  <BakeryCard
                    as={Link}
                    className="siteHeaderAppCard"
                    href={blessingsNetworkHref}
                    onClick={() => setActivePanel(null)}
                    radius="md"
                    spacing="none"
                    tone="transparent"
                  >
                    <span className="siteHeaderAppIcon" aria-hidden="true">
                      <Handshake className="h-5 w-5" />
                    </span>
                    <span className="siteHeaderAppCopy">
                      <span className="siteHeaderAppEyebrow">Community advice</span>
                      <span className="siteHeaderAppTitle">Community Advice</span>
                      <span className="siteHeaderAppDescription">
                        Practical owner advice paired with public business profiles and links.
                      </span>
                    </span>
                    <ArrowRight className="siteHeaderAppArrow h-4 w-4" />
                  </BakeryCard>

                  <BakeryCard
                    as={Link}
                    className="siteHeaderAppCard"
                    href={reviewsHref}
                    onClick={() => setActivePanel(null)}
                    radius="md"
                    spacing="none"
                    tone="transparent"
                  >
                    <span className="siteHeaderAppIcon" aria-hidden="true">
                      <ClipboardCheck className="h-5 w-5" />
                    </span>
                    <span className="siteHeaderAppCopy">
                      <span className="siteHeaderAppEyebrow">Transparency</span>
                      <span className="siteHeaderAppTitle">Reviews</span>
                      <span className="siteHeaderAppDescription">
                        Reviews with photos, public responses, action logs, and boundaries around
                        unfair claims.
                      </span>
                    </span>
                    <ArrowRight className="siteHeaderAppArrow h-4 w-4" />
                  </BakeryCard>
                </div>
              ) : null}

              {activePanel === 'account' ? (
                <>
                  <p className={headerClassNames.actionPanelTitle}>
                    {hasSignedInAccount
                      ? 'Account quick actions'
                      : isAccountSessionPending
                        ? 'Checking account'
                        : 'Sign in'}
                  </p>
                  {hasSignedInAccount ? (
                    <div className="siteHeaderAccountSummary">
                      <span>{signedInAccountLabel}</span>
                      <strong>{signedInAccountDetail}</strong>
                    </div>
                  ) : null}
                  <ul className={headerClassNames.actionPanelList}>
                    {accountLinks.map((href) => (
                      <li key={href}>
                        <BakeryAction
                          as={Link}
                          className="siteHeaderActionLink"
                          end={<ArrowRight className="h-4 w-4" />}
                          href={href}
                          onClick={() => {
                            setActivePanel(null)
                          }}
                          size="sm"
                          variant="secondary"
                        >
                          <span>{getAccountLabel(href)}</span>
                        </BakeryAction>
                      </li>
                    ))}
                  </ul>

                  {isAccountSessionPending ? (
                    <p className="siteHeaderAuthIntro siteHeaderAuthIntro--pending">
                      Checking your signed-in account...
                    </p>
                  ) : null}

                  {!hasSignedInAccount && !isAccountSessionPending ? (
                    <form className="siteHeaderAuthPanel" onSubmit={handleCustomerLoginSubmit}>
                      <p className="siteHeaderAuthIntro">
                        Use the email or phone number connected to your account. We will keep you
                        on this page unless your account opens a management workspace.
                      </p>

                      {customerLoginError ? (
                        <p className="siteHeaderAuthError" role="alert">
                          {customerLoginError}
                        </p>
                      ) : null}

                      {!customerLoginError && accountWarning ? (
                        <p className="siteHeaderAuthNotice">{accountWarning}</p>
                      ) : null}

                      <label className="siteHeaderAuthField">
                        <span>Email or phone</span>
                        <input
                          autoComplete="username"
                          className="siteHeaderAuthInput"
                          inputMode="email"
                          onChange={(event) => setCustomerLoginIdentifier(event.target.value)}
                          placeholder="you@example.com"
                          type="text"
                          value={customerLoginIdentifier}
                        />
                      </label>

                      <label className="siteHeaderAuthField">
                        <span>Password</span>
                        <span className="siteHeaderPasswordShell">
                          <input
                            autoComplete="current-password"
                            className="siteHeaderAuthInput siteHeaderPasswordInput"
                            onChange={(event) => setCustomerLoginPassword(event.target.value)}
                            placeholder="Enter password"
                            type={showCustomerLoginPassword ? 'text' : 'password'}
                            value={customerLoginPassword}
                          />
                          <BakeryPressable
                            aria-label={
                              showCustomerLoginPassword ? 'Hide password' : 'Show password'
                            }
                            className="siteHeaderPasswordToggle"
                            onClick={() => setShowCustomerLoginPassword((current) => !current)}
                            type="button"
                          >
                            {showCustomerLoginPassword ? (
                              <EyeOff aria-hidden="true" className="h-4 w-4" />
                            ) : (
                              <Eye aria-hidden="true" className="h-4 w-4" />
                            )}
                          </BakeryPressable>
                        </span>
                      </label>

                      <button
                        className="siteHeaderAuthSubmit"
                        disabled={isCustomerLoginSubmitting}
                        type="submit"
                      >
                        {isCustomerLoginSubmitting ? (
                          <>
                            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                            Signing in
                          </>
                        ) : (
                          'Sign in'
                        )}
                      </button>

                      <div className="siteHeaderAuthLinks">
                        <Link href="/create-account" onClick={() => setActivePanel(null)}>
                          Create an account
                        </Link>
                      </div>
                    </form>
                  ) : null}

                  {hasSignedInAccount ? (
                    <BakeryAction
                      className="siteHeaderPanelButton"
                      loading={isLoggingOut}
                      onClick={handleLogout}
                      type="button"
                      variant="primary"
                    >
                      {isLoggingOut ? 'Signing out...' : 'Sign out'}
                    </BakeryAction>
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
                                      if (typeof option === 'object')
                                        return option.id === variantOptionID
                                      return option === variantOptionID
                                    }) || false
                                  )
                                },
                              )

                              if (imageVariant && typeof imageVariant.image === 'object') {
                                image = imageVariant.image
                              }
                            }

                            const resolvedImageSrc = resolveMediaDisplayURL(image)

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
                                  <div className="siteHeaderCartQuickThumb" aria-hidden="true">
                                    {resolvedImageSrc ? (
                                      <Image
                                        alt={image.alt || product.title || ''}
                                        className="siteHeaderCartQuickThumbImage"
                                        fill
                                        quality={95}
                                        sizes="192px"
                                        src={resolvedImageSrc}
                                      />
                                    ) : null}
                                  </div>

                                  <div className="siteHeaderCartQuickItemBody">
                                    <div className="siteHeaderCartQuickItemTop">
                                      <div className="siteHeaderCartQuickItemCopy">
                                        <p className="siteHeaderCartQuickItemEyebrow">
                                          {isVariant ? 'Configured item' : 'Bakery item'}
                                        </p>
                                        <p className="siteHeaderCartQuickItemName">
                                          {product.title}
                                        </p>
                                        {variantSummary ? (
                                          <p className="siteHeaderCartQuickItemVariant">
                                            {variantSummary}
                                          </p>
                                        ) : null}
                                        <TraySelectionSummary
                                          className="mt-3"
                                          compact
                                          itemsClassName="siteHeaderCartQuickTraySelections"
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
                          <Price
                            amount={cartSubtotal}
                            className="siteHeaderCartQuickSubtotalPrice"
                          />
                        </div>

                        <div className="siteHeaderCartQuickFooterActions">
                          <BakeryAction
                            as={Link}
                            className="siteHeaderCartQuickCheckout"
                            href="/menu"
                            onClick={() => setActivePanel(null)}
                            size="sm"
                            variant="primary"
                          >
                            Review cart
                          </BakeryAction>
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
                      <BakeryAction
                        as={Link}
                        className="siteHeaderCartQuickCheckout"
                        href={menuHref}
                        onClick={() => setActivePanel(null)}
                        size="sm"
                        variant="primary"
                      >
                        Browse the menu
                      </BakeryAction>
                    </div>
                  )}
                </div>
              ) : null}
            </BakeryCard>
          </div>
        </div>
      </div>
      <CartModal renderTrigger={false} />
    </header>
  )
}
