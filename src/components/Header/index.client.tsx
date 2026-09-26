'use client'

import { DeleteItemButton } from '@/components/Cart/DeleteItemButton'
import { EditItemQuantityButton } from '@/components/Cart/EditItemQuantityButton'
import { CartModal } from '@/components/Cart/CartModal'
import { Price } from '@/components/Price'
import { TraySelectionSummary } from '@/components/TraySelectionSummary'
import { CustomerAuthForm, customerAuthTitle } from '@/components/CustomerAuth/CustomerAuthForm'
import {
  type AdminSessionUser,
  type CustomerAuthMode,
  useCustomerAuthForm,
} from '@/components/CustomerAuth/useCustomerAuthForm'
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
import type { SitePagesFlags } from '@/utilities/getSitePages'
import {
  blessingsNetworkHref,
  blogHref,
  communityHref,
  contactHref,
  discussionBoardHref,
  featureRequestsHref,
  menuHref,
  privacyHref,
  reviewsHref,
  rotationsHref,
  termsHref,
} from '@/utilities/routes'
import { isPayloadMediaFileURL, resolveMediaDisplayURL } from '@/utilities/resolveMediaDisplayURL'
import { ArrowRight, ChevronDown, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

import { AnnouncementsInbox } from './AnnouncementsInbox'
import {
  buildHeaderNavigation,
  getEnabledHeaderAppPages,
  isHeaderNavigationItemActive,
} from './constants'
import { AccountGlyph, BagGlyph } from './HeaderGlyphs'
import { appMenuFlowerTones, HeaderMenuCard } from './HeaderMenuCard'
import { MobileMenu } from './MobileMenu'
import { useHeaderVisibility } from './useHeaderVisibility'

type ActivePanel = 'account' | 'announcements' | 'bag' | 'more' | null
const announcementsSeenStorageKey = 'bwb-announcements-seen-at'
const announcementsAutoOpenStorageKey = 'bwb-announcements-auto-opened'

export type HeaderAnnouncementItem = {
  id?: null | string
  message: string
  pinned?: boolean | null
  postedOn?: null | string
  title: string
}

export type HeaderAnnouncementsData = {
  items: HeaderAnnouncementItem[]
  updatedAt: null | string
}

type Props = {
  announcements: HeaderAnnouncementsData
  brand: {
    brandName: string
    darkLogoUrl: string | null
    logoAlt: string
    logoUrl: string | null
  }
  header: Header
  sitePages: SitePagesFlags
  textsOffered: boolean
}

type HeaderAdminUser = AdminSessionUser

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
  if (pathname === communityHref || pathname.startsWith(`${communityHref}/`)) {
    return 'Post-it Wall'
  }
  if (pathname === featureRequestsHref || pathname.startsWith(`${featureRequestsHref}/`)) {
    return 'Request Features'
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

export function HeaderClient({ announcements, brand, header, sitePages, textsOffered }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const headerRef = useRef<HTMLElement | null>(null)
  const panelInnerRef = useRef<HTMLDivElement | null>(null)
  const announcementsSheetRef = useRef<HTMLDivElement | null>(null)
  const { isScrolled } = useHeaderVisibility()
  const { announce } = useBakeryAnnouncer()
  const { cart } = useCart()
  const { user, logout } = useAuth()
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [accountWarning, setAccountWarning] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [adminSessionUser, setAdminSessionUser] = useState<HeaderAdminUser | null>(null)
  const [portalReady, setPortalReady] = useState(false)
  const [announcementsBackdropReady, setAnnouncementsBackdropReady] = useState(false)
  const [isAdminSessionLoading, setIsAdminSessionLoading] = useState(true)

  const customerAuth = useCustomerAuthForm({
    onAdminSignedIn: (adminUser) => {
      setAdminSessionUser(adminUser)
      setActivePanel(null)
      announce('Owner account signed in.')
      toast.success('Signed in.')
      router.refresh()
    },
    onSignedIn: (kind: CustomerAuthMode) => {
      const redirectPath = getSafeLocalRedirect(
        new URLSearchParams(window.location.search).get('redirect'),
      )

      if (kind === 'create') {
        setActivePanel('account')
        announce('Customer account created.')
      } else {
        setActivePanel(null)
        announce('Customer account signed in.')
      }

      if (redirectPath) {
        router.push(redirectPath)
      } else {
        router.refresh()
      }
    },
    textsOffered,
  })
  const { setMode: setCustomerAuthMode } = customerAuth

  const hasSignedInAccount = Boolean(user || adminSessionUser)
  const isAccountSessionPending = !user && isAdminSessionLoading
  const signedInAccountLabel = user
    ? 'Customer account'
    : adminSessionUser
      ? 'Owner workspace'
      : null
  const signedInAccountIdentifier = (() => {
    const candidates = user
      ? [user.name, user.email, user.phone, user.username]
      : [adminSessionUser?.email]
    const trimmed = candidates
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .find((value) => value.length > 0)
    return trimmed || null
  })()
  const signedInAccountDetail = signedInAccountIdentifier
    ? `Signed in as ${signedInAccountIdentifier}`
    : 'Signed in'

  const navigationItems = useMemo(() => {
    return buildHeaderNavigation(header.navItems || [], sitePages).map((item) => ({
      ...item,
      isActive: isHeaderNavigationItemActive(pathname, item),
    }))
  }, [header.navItems, pathname, sitePages])

  const [hasUnseenAnnouncements, setHasUnseenAnnouncements] = useState(false)

  useEffect(() => {
    // Computed in an effect so server and first client render agree (no dot),
    // then localStorage decides. Any save in the admin bumps updatedAt and
    // brings the dot back for everyone.
    if (!announcements.items.length || !announcements.updatedAt) {
      setHasUnseenAnnouncements(false)
      return
    }

    const seenAt = window.localStorage.getItem(announcementsSeenStorageKey)
    setHasUnseenAnnouncements(seenAt !== announcements.updatedAt)
  }, [announcements.items.length, announcements.updatedAt])

  const markAnnouncementsSeen = () => {
    if (announcements.updatedAt) {
      try {
        window.localStorage.setItem(announcementsSeenStorageKey, announcements.updatedAt)
      } catch {
        // Storage can be unavailable (private mode); the dot just stays.
      }
    }

    setHasUnseenAnnouncements(false)
  }

  const openAnnouncementsPanel = (event?: {
    preventDefault?: () => void
    stopPropagation: () => void
  }) => {
    event?.preventDefault?.()
    event?.stopPropagation()

    if (activePanel === 'announcements') {
      setActivePanel(null)
      announce('Announcements closed.')
      return
    }

    setActivePanel('announcements')
    announce('Announcements opened.')
    markAnnouncementsSeen()
  }

  const enabledAppPages = useMemo(() => getEnabledHeaderAppPages(sitePages), [sitePages])

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
    return []
  }, [user])
  const activeAppLabel = getActiveAppLabel(pathname)

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

  const appsButtonLabel = activeAppLabel || appsNavigationLabel

  useEffect(() => {
    setActivePanel(null)
  }, [pathname])

  useEffect(() => {
    const currentSearchParams = new URLSearchParams(window.location.search)
    setAccountWarning(currentSearchParams.get('warning'))

    const requestedMode = currentSearchParams.get('account')

    if (!user && (requestedMode === 'login' || requestedMode === 'create')) {
      setCustomerAuthMode(requestedMode)
      setActivePanel('account')
    }
  }, [pathname, setCustomerAuthMode, user])

  useEffect(() => {
    router.prefetch(menuHref)
    router.prefetch(rotationsHref)
    router.prefetch(contactHref)
    enabledAppPages.forEach((page) => {
      router.prefetch(page.href)
    })
  }, [enabledAppPages, router])

  useEffect(() => {
    const closePanel = () => setActivePanel(null)
    const onPointerDown = (event: PointerEvent) => {
      if (!event.target || !activePanel) return
      if (panelInnerRef.current?.contains(event.target as Node)) return
      if (announcementsSheetRef.current?.contains(event.target as Node)) return

      const target = event.target as HTMLElement
      if (target.closest(`.${headerClassNames.actionButton}`)) return
      if (target.closest(`.${headerClassNames.bannerLink}`)) return
      if (target.closest('.siteHeaderBannerButton')) return
      if (target.closest('.siteHeaderMobileAccountButton')) return
      if (target.closest('.siteHeaderMobileBagButton')) return
      if (target.closest('.siteHeaderMobileAnnouncementsButton')) return
      if (target.closest('.siteHeaderMobileIconButton')) return

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
      return
    }

    if (panel === 'announcements') {
      announce('Announcements closed.')
    }
  }

  const closeActiveHeaderPanel = () => {
    if (!activePanel) return
    announceHeaderPanelClosed(activePanel)
    setActivePanel(null)
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

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      if (user && logout) {
        await logout()
      }

      if (adminSessionUser) {
        const adminLogoutResponse = await fetch('/api/admins/logout', {
          body: JSON.stringify({}),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (!adminLogoutResponse.ok) {
          throw new Error('Admin logout failed.')
        }

        setAdminSessionUser(null)
        window.dispatchEvent(new Event('bwb:admin-auth-changed'))
      }

      customerAuth.reset()
      setActivePanel(null)
      announce('You have successfully signed out.')
      toast.success("You've successfully signed out.")
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'We could not sign you out. Please try again.'

      announce('Sign out failed.')
      toast.error(message)
    } finally {
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (!portalReady) return
    // Carrier reviewers screenshot these pages; keep the opt-in and policy text uncovered.
    if ([privacyHref, termsHref].includes(pathname)) return
    if (new URLSearchParams(window.location.search).get('account')) return

    try {
      if (window.localStorage.getItem(announcementsAutoOpenStorageKey)) return
      window.localStorage.setItem(announcementsAutoOpenStorageKey, '1')
    } catch {
      return
    }

    setActivePanel('announcements')
    markAnnouncementsSeen()
    announce('Announcements opened.')
  }, [announce, pathname, portalReady])

  useEffect(() => {
    if (activePanel !== 'announcements') {
      setAnnouncementsBackdropReady(false)
      return
    }

    const timeoutId = window.setTimeout(() => setAnnouncementsBackdropReady(true), 50)
    return () => window.clearTimeout(timeoutId)
  }, [activePanel])

  return (
    <>
    <header
      className={headerClassNames.root}
      data-open={Boolean(activePanel)}
      data-scrolled={isScrolled}
      ref={headerRef}
    >
      {activePanel && activePanel !== 'announcements' ? (
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
              href={rotationsHref}
            >
              {brand.logoUrl ? (
                <span className="siteHeaderBrandLogoFrame">
                  <Image
                    alt={brand.logoAlt}
                    className={`${headerClassNames.brandLogo} siteHeaderBrandLogo--default`}
                    height={80}
                    priority
                    src={brand.logoUrl}
                    unoptimized
                    width={180}
                  />
                  {brand.darkLogoUrl ? (
                    <Image
                      alt=""
                      aria-hidden="true"
                      className={`${headerClassNames.brandLogo} siteHeaderBrandLogo--dark`}
                      height={80}
                      priority
                      src={brand.darkLogoUrl}
                      unoptimized
                      width={180}
                    />
                  ) : null}
                </span>
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
              hasUnseenAnnouncements={hasUnseenAnnouncements}
              isAccountOpen={activePanel === 'account'}
              isAnnouncementsOpen={activePanel === 'announcements'}
              items={navigationItems}
              onOpenAnnouncements={openAnnouncementsPanel}
              onOpenAccount={() => {
                toggleHeaderPanel(
                  'account',
                  `${accountPanelName} opened.`,
                  `${accountPanelName} closed.`,
                )
              }}
              onOpenCart={openCartModal}
              onOpenMenu={closeActiveHeaderPanel}
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
                      ) : item.kind === 'announcements' ? (
                        <button
                          aria-expanded={activePanel === 'announcements'}
                          aria-label={
                            activePanel === 'announcements'
                              ? 'Close announcements'
                              : hasUnseenAnnouncements
                                ? 'Open announcements. New announcements available'
                                : 'Open announcements'
                          }
                          className={cn(headerClassNames.bannerLink, 'siteHeaderBannerButton', {
                            'is-active': activePanel === 'announcements',
                          })}
                          data-testid="open-announcements-desktop"
                          onClick={openAnnouncementsPanel}
                          type="button"
                        >
                          <span className="siteHeaderBannerLabel">{item.label}</span>
                          {hasUnseenAnnouncements ? (
                            <span aria-hidden="true" className="siteHeaderNewDot" />
                          ) : null}
                          <ChevronDown className="siteHeaderBannerDropdownIcon" />
                        </button>
                      ) : (
                        <Link
                          className={cn(headerClassNames.bannerLink, {
                            'is-active': item.isActive,
                          })}
                          href={item.href}
                          onClick={closeActiveHeaderPanel}
                        >
                          {item.label}
                        </Link>
                      )}

                      {item.kind === 'apps' || item.kind === 'announcements' ? null : (
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
                <AccountGlyph className="h-5 w-5" />
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
                <BagGlyph className="h-5 w-5" />
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
              activePanel && activePanel !== 'announcements' ? 'is-open' : null,
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
                  <div className="siteHeaderMenuSectionDivider" role="separator">
                    <span>{appsNavigationLabel}</span>
                  </div>

                  <div className="siteHeaderAppsGrid">
                    {enabledAppPages.map((appPage, index) => (
                      <HeaderMenuCard
                        description={appPage.description}
                        eyebrow={appPage.eyebrow}
                        href={appPage.href}
                        key={appPage.id}
                        onNavigate={() => setActivePanel(null)}
                        title={appPage.title}
                        tone={appMenuFlowerTones[index % appMenuFlowerTones.length]}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {activePanel === 'account' ? (
                <>
                  <p className={headerClassNames.actionPanelTitle}>
                    {hasSignedInAccount
                      ? 'Account quick actions'
                      : isAccountSessionPending
                        ? 'Checking account'
                        : customerAuthTitle(customerAuth)}
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
                    <CustomerAuthForm auth={customerAuth} notice={accountWarning} />
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
                      <BagGlyph className="h-4 w-4" />
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
                                        unoptimized={isPayloadMediaFileURL(resolvedImageSrc)}
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
    {portalReady && activePanel === 'announcements'
      ? createPortal(
          <div className="announcementsPortal" role="dialog" aria-label="Announcements">
            {announcementsBackdropReady ? (
              <button
                aria-label="Close announcements"
                className="announcementsPortalBackdrop"
                onClick={() => {
                  announceHeaderPanelClosed('announcements')
                  setActivePanel(null)
                }}
                type="button"
              />
            ) : null}
            <div className="announcementsPortalSheet" ref={announcementsSheetRef}>
              <AnnouncementsInbox
                items={announcements.items}
                onClose={() => setActivePanel(null)}
              />
            </div>
          </div>,
          document.body,
        )
      : null}
    </>
  )
}
