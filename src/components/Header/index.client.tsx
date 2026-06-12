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
import type { SitePagesFlags } from '@/utilities/getSitePages'
import {
  blessingsNetworkHref,
  blogHref,
  communityHref,
  contactHref,
  discussionBoardHref,
  featureRequestsHref,
  menuHref,
  reviewsHref,
  rotationsHref,
} from '@/utilities/routes'
import { isPayloadMediaFileURL, resolveMediaDisplayURL } from '@/utilities/resolveMediaDisplayURL'
import {
  ArrowRight,
  BookOpenText,
  ChevronDown,
  ClipboardCheck,
  Eye,
  EyeOff,
  Handshake,
  Lightbulb,
  LoaderCircle,
  Megaphone,
  MessageSquareText,
  PanelsTopLeft,
  StickyNote,
  ShoppingBag,
  type LucideIcon,
  UserRound,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  buildHeaderNavigation,
  getEnabledHeaderAppPages,
  type HeaderAppPageIcon,
  isHeaderNavigationItemActive,
} from './constants'
import { MobileMenu } from './MobileMenu'
import { useHeaderVisibility } from './useHeaderVisibility'

type ActivePanel = 'account' | 'announcements' | 'bag' | 'more' | null
type AccountAuthMode = 'create' | 'login'

const customerCreateResendDelayMs = 7 * 1000
const announcementsSeenStorageKey = 'bwb-announcements-seen-at'

export type HeaderAnnouncementItem = {
  id?: null | string
  linkHref?: null | string
  linkLabel?: null | string
  message: string
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
  if (pathname === communityHref || pathname.startsWith(`${communityHref}/`)) {
    return 'Post-it Wall'
  }
  if (pathname === featureRequestsHref || pathname.startsWith(`${featureRequestsHref}/`)) {
    return 'Request Features'
  }

  return null
}

const appsNavigationLabel = 'Other pages'

const appIconByKey: Record<HeaderAppPageIcon, LucideIcon> = {
  'book-open-text': BookOpenText,
  'clipboard-check': ClipboardCheck,
  handshake: Handshake,
  lightbulb: Lightbulb,
  'message-square-text': MessageSquareText,
  'sticky-note': StickyNote,
}

const formatCartQuantity = (quantity: number) => `${quantity} item${quantity === 1 ? '' : 's'}`

const getSafeLocalRedirect = (value: null | string) => {
  if (!value?.startsWith('/') || value.startsWith('//')) {
    return null
  }

  return value
}

const isEmailLike = (value: string) => /\S+@\S+\.\S+/.test(value.trim())

export function HeaderClient({ announcements, brand, header, sitePages }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const headerRef = useRef<HTMLElement | null>(null)
  const panelInnerRef = useRef<HTMLDivElement | null>(null)
  const lastAutoSubmittedCreateCodeRef = useRef('')
  const { isScrolled } = useHeaderVisibility()
  const { announce } = useBakeryAnnouncer()
  const { cart } = useCart()
  const { create, user, login, logout } = useAuth()
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [accountAuthMode, setAccountAuthMode] = useState<AccountAuthMode>('login')
  const [accountWarning, setAccountWarning] = useState<string | null>(null)
  const [customerLoginIdentifier, setCustomerLoginIdentifier] = useState('')
  const [customerLoginPassword, setCustomerLoginPassword] = useState('')
  const [customerLoginError, setCustomerLoginError] = useState<string | null>(null)
  const [customerCreateEmail, setCustomerCreateEmail] = useState('')
  const [customerCreatePassword, setCustomerCreatePassword] = useState('')
  const [customerCreatePasswordConfirm, setCustomerCreatePasswordConfirm] = useState('')
  const [customerCreateVerificationCode, setCustomerCreateVerificationCode] = useState('')
  const [customerCreateError, setCustomerCreateError] = useState<string | null>(null)
  const [customerCreateNotice, setCustomerCreateNotice] = useState<string | null>(null)
  const [customerCreateNeedsVerification, setCustomerCreateNeedsVerification] = useState(false)
  const [customerCreateVerificationRecipient, setCustomerCreateVerificationRecipient] = useState('')
  const [customerCreateResendAvailableAt, setCustomerCreateResendAvailableAt] = useState<
    number | null
  >(null)
  const [customerCreateResendSeconds, setCustomerCreateResendSeconds] = useState(0)
  const [isCustomerLoginSubmitting, setIsCustomerLoginSubmitting] = useState(false)
  const [isCustomerCreateSubmitting, setIsCustomerCreateSubmitting] = useState(false)
  const [isCustomerCreateResending, setIsCustomerCreateResending] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showCustomerLoginPassword, setShowCustomerLoginPassword] = useState(false)
  const [adminSessionUser, setAdminSessionUser] = useState<HeaderAdminUser | null>(null)
  const [isAdminSessionLoading, setIsAdminSessionLoading] = useState(true)

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

  const openAnnouncementsPanel = () => {
    toggleHeaderPanel('announcements', 'Announcements opened.', 'Announcements closed.')
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

  const submitCustomerCreateFromVerificationCode = useEffectEvent(() => {
    void handleCustomerCreateSubmit({
      preventDefault: () => undefined,
    } as FormEvent<HTMLFormElement>)
  })

  useEffect(() => {
    setActivePanel(null)
  }, [pathname])

  useEffect(() => {
    const currentSearchParams = new URLSearchParams(window.location.search)
    setAccountWarning(currentSearchParams.get('warning'))

    if (!user && currentSearchParams.get('account') === 'login') {
      setAccountAuthMode('login')
      setActivePanel('account')
    }
  }, [pathname, user])

  useEffect(() => {
    if (!customerCreateNeedsVerification || customerCreateResendAvailableAt == null) {
      setCustomerCreateResendSeconds(0)
      return
    }

    const updateResendSeconds = () => {
      setCustomerCreateResendSeconds(
        Math.max(0, Math.ceil((customerCreateResendAvailableAt - Date.now()) / 1000)),
      )
    }

    updateResendSeconds()
    const interval = window.setInterval(updateResendSeconds, 250)

    return () => {
      window.clearInterval(interval)
    }
  }, [customerCreateNeedsVerification, customerCreateResendAvailableAt])

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
          const data = (await adminLoginResponse.json().catch(() => null)) as AdminMeResponse | null
          setCustomerLoginIdentifier('')
          setCustomerLoginPassword('')
          setShowCustomerLoginPassword(false)
          setAdminSessionUser(data?.user ?? { email: identifier.toLowerCase() })
          setActivePanel(null)
          announce('Owner account signed in.')
          toast.success('Signed in.')
          router.refresh()
          return
        }
      }

      setCustomerLoginError('That email, phone, and password combination did not match an account.')
    } finally {
      setIsCustomerLoginSubmitting(false)
    }
  }

  const getCustomerCreateContactPayload = () => {
    const contact = customerCreateEmail.trim()
    const isEmailSignup = isEmailLike(contact)

    if (!contact) {
      return {
        error: 'Enter an email address or phone number first.',
      }
    }

    if (!isEmailSignup && contact.replace(/\D/g, '').length < 7) {
      return {
        error: 'Enter a valid email address or phone number.',
      }
    }

    return {
      contact,
      data: {
        email: isEmailSignup ? contact : undefined,
        phone: isEmailSignup ? undefined : contact,
      },
    }
  }

  const getCustomerCreatePasswordError = () => {
    const password = customerCreatePassword.trim()
    const passwordConfirm = customerCreatePasswordConfirm.trim()

    if (!password || !passwordConfirm) {
      return 'Enter and confirm your password before creating the account.'
    }

    if (password.length < 3) {
      return 'Password must be at least 3 characters.'
    }

    if (password !== passwordConfirm) {
      return 'The password confirmation does not match.'
    }

    return null
  }

  const handleCustomerCreateSendCode = async () => {
    if (
      isCustomerCreateSubmitting ||
      isCustomerCreateResending ||
      customerCreateResendSeconds > 0
    ) {
      return
    }

    const contactPayload = getCustomerCreateContactPayload()

    if ('error' in contactPayload) {
      setCustomerCreateError(contactPayload.error || 'Enter a valid email address or phone number.')
      return
    }

    setCustomerCreateError(null)
    setCustomerCreateNotice(null)
    setIsCustomerCreateResending(true)

    try {
      const response = await fetch('/api/customer-auth/signup', {
        body: JSON.stringify(contactPayload.data),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const result = (await response.json()) as {
        error?: string
        maskedEmail?: string
        maskedPhone?: string
        requiresEmailVerification?: boolean
        requiresPhoneVerification?: boolean
      }

      if (!response.ok) {
        throw new Error(result.error || 'Could not send a verification code.')
      }

      if (result.requiresEmailVerification) {
        setCustomerCreateVerificationRecipient(result.maskedEmail || contactPayload.contact)
      } else if (result.requiresPhoneVerification) {
        setCustomerCreateVerificationRecipient(result.maskedPhone || contactPayload.contact)
      }

      setCustomerCreateNeedsVerification(true)
      setCustomerCreateVerificationCode('')
      lastAutoSubmittedCreateCodeRef.current = ''
      setCustomerCreateNotice('Verification code sent. You can finish the password fields now.')
      setCustomerCreateResendAvailableAt(Date.now() + customerCreateResendDelayMs)
    } catch (error) {
      setCustomerCreateError(
        error instanceof Error && error.message
          ? error.message
          : 'Could not send a verification code. Please try again.',
      )
    } finally {
      setIsCustomerCreateResending(false)
    }
  }

  const handleCustomerCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isCustomerCreateSubmitting) {
      return
    }

    const password = customerCreatePassword.trim()
    const passwordConfirm = customerCreatePasswordConfirm.trim()
    const verificationCode = customerCreateVerificationCode.trim()
    const contactPayload = getCustomerCreateContactPayload()

    if ('error' in contactPayload) {
      setCustomerCreateError(contactPayload.error || 'Enter a valid email address or phone number.')
      return
    }

    if (!customerCreateNeedsVerification) {
      await handleCustomerCreateSendCode()
      return
    }

    const passwordError = getCustomerCreatePasswordError()

    if (passwordError) {
      setCustomerCreateError(passwordError)
      return
    }

    if (verificationCode.length !== 6) {
      setCustomerCreateError('Enter the 6-digit verification code.')
      return
    }

    setCustomerCreateError(null)
    setCustomerCreateNotice(null)
    setIsCustomerCreateSubmitting(true)

    try {
      const result = await create({
        ...contactPayload.data,
        password,
        passwordConfirm,
        verificationCode,
      })

      if (result.requiresEmailVerification) {
        setCustomerCreateNeedsVerification(true)
        setCustomerCreateVerificationRecipient(result.maskedEmail || contactPayload.contact)
        setCustomerCreateVerificationCode('')
        lastAutoSubmittedCreateCodeRef.current = ''
        setCustomerCreateResendAvailableAt(Date.now() + customerCreateResendDelayMs)
        setCustomerCreateNotice(null)
        return
      }

      if (result.requiresPhoneVerification) {
        setCustomerCreateNeedsVerification(true)
        setCustomerCreateVerificationRecipient(result.maskedPhone || contactPayload.contact)
        setCustomerCreateVerificationCode('')
        lastAutoSubmittedCreateCodeRef.current = ''
        setCustomerCreateResendAvailableAt(Date.now() + customerCreateResendDelayMs)
        setCustomerCreateNotice(null)
        return
      }

      setCustomerCreateEmail('')
      setCustomerCreatePassword('')
      setCustomerCreatePasswordConfirm('')
      setCustomerCreateVerificationCode('')
      lastAutoSubmittedCreateCodeRef.current = ''
      setCustomerCreateNeedsVerification(false)
      setCustomerCreateVerificationRecipient('')
      setCustomerCreateResendAvailableAt(null)
      setCustomerCreateNotice(null)
      setShowCustomerLoginPassword(false)
      setActivePanel('account')
      announce('Customer account created.')
      toast.success('Account created.')
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'There was a problem creating your account. Please try again.'
      setCustomerCreateError(message)
    } finally {
      setIsCustomerCreateSubmitting(false)
    }
  }

  useEffect(() => {
    if (!customerCreateNeedsVerification) {
      lastAutoSubmittedCreateCodeRef.current = ''
      return
    }

    const code = customerCreateVerificationCode.trim()

    if (code.length < 6) {
      lastAutoSubmittedCreateCodeRef.current = ''
      return
    }

    if (
      code.length !== 6 ||
      isCustomerCreateSubmitting ||
      isCustomerCreateResending ||
      lastAutoSubmittedCreateCodeRef.current === code
    ) {
      return
    }

    lastAutoSubmittedCreateCodeRef.current = code
    const timeout = window.setTimeout(() => {
      submitCustomerCreateFromVerificationCode()
    }, 120)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [
    customerCreateNeedsVerification,
    customerCreatePassword,
    customerCreatePasswordConfirm,
    customerCreateVerificationCode,
    isCustomerCreateResending,
    isCustomerCreateSubmitting,
  ])

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

      setCustomerLoginIdentifier('')
      setCustomerLoginPassword('')
      setCustomerCreateEmail('')
      setCustomerCreatePassword('')
      setCustomerCreatePasswordConfirm('')
      setCustomerCreateVerificationCode('')
      setCustomerCreateError(null)
      setCustomerCreateNotice(null)
      setCustomerCreateNeedsVerification(false)
      setCustomerCreateVerificationRecipient('')
      setCustomerCreateResendAvailableAt(null)
      setAccountAuthMode('login')
      setShowCustomerLoginPassword(false)
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
                        <BakeryPressable
                          aria-expanded={activePanel === 'announcements'}
                          aria-label={
                            hasUnseenAnnouncements
                              ? 'Open announcements. New announcements available'
                              : 'Open announcements'
                          }
                          className={cn(headerClassNames.bannerLink, 'siteHeaderBannerButton', {
                            'is-active': activePanel === 'announcements',
                          })}
                          onClick={openAnnouncementsPanel}
                          type="button"
                        >
                          <span className="siteHeaderBannerLabel">{item.label}</span>
                          {hasUnseenAnnouncements ? (
                            <span aria-hidden="true" className="siteHeaderNewDot" />
                          ) : null}
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
                  : activePanel === 'more' || activePanel === 'announcements'
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

                  {enabledAppPages.map((appPage) => {
                    const Icon = appIconByKey[appPage.icon]

                    return (
                      <BakeryCard
                        as={Link}
                        className="siteHeaderAppCard"
                        href={appPage.href}
                        key={appPage.id}
                        onClick={() => setActivePanel(null)}
                        radius="md"
                        spacing="none"
                        tone="transparent"
                      >
                        <span className="siteHeaderAppIcon" aria-hidden="true">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="siteHeaderAppCopy">
                          <span className="siteHeaderAppEyebrow">{appPage.eyebrow}</span>
                          <span className="siteHeaderAppTitle">{appPage.title}</span>
                          <span className="siteHeaderAppDescription">{appPage.description}</span>
                        </span>
                        <ArrowRight className="siteHeaderAppArrow h-4 w-4" />
                      </BakeryCard>
                    )
                  })}
                </div>
              ) : null}

              {activePanel === 'announcements' ? (
                <div className="siteHeaderAppsPanel">
                  <div className="siteHeaderAppsHeader">
                    <div className="siteHeaderAppsBadge">
                      <Megaphone className="h-4 w-4" />
                      <span>Announcements</span>
                    </div>
                    <div>
                      <p className="siteHeaderAppsTitle">From the baker</p>
                      <p className="siteHeaderAppsDescription">
                        Bake days, market dates, pickup windows, and other news.
                      </p>
                    </div>
                  </div>

                  {announcements.items.length ? (
                    <div className="siteHeaderAnnouncementsList">
                      {announcements.items.map((entry, index) => (
                        <article
                          className="siteHeaderAnnouncementCard"
                          key={entry.id || `${entry.title}-${index}`}
                        >
                          <h3 className="siteHeaderAnnouncementTitle">{entry.title}</h3>
                          <p className="siteHeaderAnnouncementMessage">{entry.message}</p>
                          {entry.linkHref && entry.linkLabel ? (
                            <BakeryAction
                              as={Link}
                              className="siteHeaderAnnouncementLink"
                              end={<ArrowRight className="h-4 w-4" />}
                              href={entry.linkHref}
                              onClick={() => setActivePanel(null)}
                              size="sm"
                              variant="secondary"
                            >
                              <span>{entry.linkLabel}</span>
                            </BakeryAction>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="siteHeaderAnnouncementsEmpty">
                      Nothing new right now — check back soon.
                    </p>
                  )}
                </div>
              ) : null}

              {activePanel === 'account' ? (
                <>
                  <p className={headerClassNames.actionPanelTitle}>
                    {hasSignedInAccount
                      ? 'Account quick actions'
                      : isAccountSessionPending
                        ? 'Checking account'
                        : accountAuthMode === 'create'
                          ? customerCreateNeedsVerification
                            ? 'Verify code'
                            : 'Create account'
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
                    <form
                      className="siteHeaderAuthPanel"
                      onSubmit={
                        accountAuthMode === 'create'
                          ? handleCustomerCreateSubmit
                          : handleCustomerLoginSubmit
                      }
                    >
                      <p className="siteHeaderAuthIntro">
                        {accountAuthMode === 'create'
                          ? 'Create a customer account without leaving this page. Send a code to your email or phone, then finish your password while it arrives. Phone-only works — the baker texts you personally — but automatic emails (receipts, announcements) need an email on file.'
                          : 'Use the email or phone number connected to your account. We will keep you on this page unless your account opens a management workspace.'}
                      </p>

                      {accountAuthMode === 'login' && customerLoginError ? (
                        <p className="siteHeaderAuthError" role="alert">
                          {customerLoginError}
                        </p>
                      ) : null}

                      {accountAuthMode === 'create' && customerCreateError ? (
                        <p className="siteHeaderAuthError" role="alert">
                          {customerCreateError}
                        </p>
                      ) : null}

                      {accountAuthMode === 'create' && customerCreateNotice ? (
                        <p className="siteHeaderAuthNotice">{customerCreateNotice}</p>
                      ) : null}

                      {accountAuthMode === 'login' && !customerLoginError && accountWarning ? (
                        <p className="siteHeaderAuthNotice">{accountWarning}</p>
                      ) : null}

                      {accountAuthMode === 'login' ? (
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
                      ) : (
                        <>
                          <div className="siteHeaderAuthContactGroup">
                            <label className="siteHeaderAuthField">
                              <span>Email or phone</span>
                              <input
                                autoComplete="username"
                                className="siteHeaderAuthInput"
                                inputMode="email"
                                onChange={(event) => {
                                  setCustomerCreateEmail(event.target.value)
                                  setCustomerCreateError(null)
                                }}
                                placeholder="you@example.com or 555-123-4567"
                                type="text"
                                value={customerCreateEmail}
                              />
                            </label>
                            <button
                              className="siteHeaderAuthInlineButton"
                              disabled={
                                isCustomerCreateResending || customerCreateResendSeconds > 0
                              }
                              onClick={handleCustomerCreateSendCode}
                              type="button"
                            >
                              {isCustomerCreateResending
                                ? 'Sending...'
                                : customerCreateResendSeconds > 0
                                  ? `Resend ${customerCreateResendSeconds}s`
                                  : customerCreateNeedsVerification
                                    ? 'Resend code'
                                    : 'Send code'}
                            </button>
                          </div>

                          <AnimatePresence initial={false} mode="wait">
                            {customerCreateNeedsVerification ? (
                              <motion.div
                                animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                                className="siteHeaderAuthVerificationStep"
                                exit={{ filter: 'blur(4px)', opacity: 0, y: -8 }}
                                initial={{ filter: 'blur(4px)', opacity: 0, y: -10 }}
                                key="customer-create-verification"
                                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                              >
                                <p className="siteHeaderAuthMicrocopy">
                                  Code sent to{' '}
                                  {customerCreateVerificationRecipient || 'your contact method'}.
                                </p>
                                <label className="siteHeaderAuthField">
                                  <span>Verification code</span>
                                  <input
                                    autoComplete="one-time-code"
                                    className="siteHeaderAuthInput siteHeaderVerificationInput"
                                    inputMode="numeric"
                                    maxLength={6}
                                    onChange={(event) => {
                                      const nextCode = event.target.value
                                        .replace(/\D/g, '')
                                        .slice(0, 6)
                                      setCustomerCreateVerificationCode(nextCode)
                                      setCustomerCreateError(null)
                                    }}
                                    pattern="[0-9]*"
                                    placeholder="6-digit code"
                                    type="text"
                                    value={customerCreateVerificationCode}
                                  />
                                </label>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </>
                      )}

                      {accountAuthMode === 'login' || accountAuthMode === 'create' ? (
                        <label className="siteHeaderAuthField">
                          <span>Password</span>
                          <span className="siteHeaderPasswordShell">
                            <input
                              autoComplete={
                                accountAuthMode === 'create' ? 'new-password' : 'current-password'
                              }
                              className="siteHeaderAuthInput siteHeaderPasswordInput"
                              onChange={(event) => {
                                if (accountAuthMode === 'create') {
                                  setCustomerCreatePassword(event.target.value)
                                  return
                                }

                                setCustomerLoginPassword(event.target.value)
                              }}
                              placeholder="Enter password"
                              type={showCustomerLoginPassword ? 'text' : 'password'}
                              value={
                                accountAuthMode === 'create'
                                  ? customerCreatePassword
                                  : customerLoginPassword
                              }
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
                      ) : null}

                      {accountAuthMode === 'create' ? (
                        <label className="siteHeaderAuthField">
                          <span>Verify password</span>
                          <input
                            autoComplete="new-password"
                            className="siteHeaderAuthInput"
                            onChange={(event) =>
                              setCustomerCreatePasswordConfirm(event.target.value)
                            }
                            placeholder="Re-enter password"
                            type={showCustomerLoginPassword ? 'text' : 'password'}
                            value={customerCreatePasswordConfirm}
                          />
                        </label>
                      ) : null}

                      <button
                        className="siteHeaderAuthSubmit"
                        disabled={
                          isCustomerLoginSubmitting ||
                          isCustomerCreateSubmitting ||
                          isCustomerCreateResending
                        }
                        type="submit"
                      >
                        {isCustomerLoginSubmitting || isCustomerCreateSubmitting ? (
                          <>
                            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                            {accountAuthMode === 'create' ? 'Creating account' : 'Signing in'}
                          </>
                        ) : accountAuthMode === 'create' ? (
                          customerCreateNeedsVerification ? (
                            'Create account'
                          ) : (
                            'Send code to continue'
                          )
                        ) : (
                          'Sign in'
                        )}
                      </button>

                      {!customerCreateNeedsVerification ? (
                        <div className="siteHeaderAuthLinks">
                          <button
                            className="siteHeaderAuthLinkButton"
                            onClick={() => {
                              setCustomerLoginError(null)
                              setCustomerCreateError(null)
                              setCustomerCreateNotice(null)
                              setCustomerCreateNeedsVerification(false)
                              setCustomerCreateVerificationCode('')
                              setCustomerCreateVerificationRecipient('')
                              setCustomerCreateResendAvailableAt(null)
                              setAccountAuthMode((current) =>
                                current === 'create' ? 'login' : 'create',
                              )
                            }}
                            type="button"
                          >
                            {accountAuthMode === 'create'
                              ? 'Already have an account? Sign in'
                              : 'Create an account'}
                          </button>
                        </div>
                      ) : null}
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
  )
}
