import { NextRequest, NextResponse } from 'next/server'

/**
 * Payload uses a single cookie named `payload-token` for ALL auth
 * collections (customers, admins). The collection is stored inside the
 * JWT payload, not the cookie name. So when a customer is logged in and
 * hits /admin, Payload's built-in /admin/unauthorized page renders, and
 * its "Log out" button only knows how to clear the admin auth state.
 * The customer session stays.
 *
 * This proxy intercepts /admin/* requests, decodes the JWT (no signature
 * verification — that's Payload's job at the actual route handler), and
 * if the cookie's `collection` is anything other than 'admins', redirects
 * to /admin-not-allowed where the customer can actually sign out.
 *
 * Anyone with no cookie passes through so Payload can serve /admin/login.
 * /admin/api/* and /admin/login are explicitly skipped so they keep
 * working.
 */

const PAYLOAD_COOKIE_NAME = 'payload-token'
const ADMIN_COLLECTION_SLUG = 'admins'

const decodeJwtPayload = (token: string): { collection?: string } | null => {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin/api')) return NextResponse.next()
  if (pathname === '/admin/login') return NextResponse.next()

  const tokenCookie = req.cookies.get(PAYLOAD_COOKIE_NAME)?.value
  if (!tokenCookie) return NextResponse.next()

  const payload = decodeJwtPayload(tokenCookie)
  if (!payload) return NextResponse.next()

  if (payload.collection !== ADMIN_COLLECTION_SLUG) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin-not-allowed'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
