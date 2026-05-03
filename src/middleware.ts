import { NextRequest, NextResponse } from 'next/server'

/**
 * If a customer is logged in but no admin token is present, Payload's
 * built-in /admin/unauthorized page dead-ends them: the "Log out" button on
 * that page only clears the admin cookie (which they don't have), so their
 * customer session stays intact. Redirect them to a Next.js page that
 * handles a real customer logout instead.
 *
 * Anyone with an admin cookie is passed through normally; anyone with no
 * cookies at all is passed through so Payload can serve /admin/login.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Don't interfere with Payload's API or its login screen.
  if (pathname.startsWith('/admin/api')) return NextResponse.next()
  if (pathname === '/admin/login') return NextResponse.next()

  const hasCustomerToken = Boolean(req.cookies.get('payload-token-customers'))
  const hasAdminToken = Boolean(req.cookies.get('payload-token-admins'))

  if (hasCustomerToken && !hasAdminToken) {
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
