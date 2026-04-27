import type { PayloadRequest } from 'payload'

import { createStableHash } from '@/utilities/idempotency'

export const DISCUSSION_VISITOR_COOKIE = 'bwb_discussion_visitor'

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

const parseCookieHeader = (cookieHeader: null | string) => {
  const cookies = new Map<string, string>()

  if (!cookieHeader) {
    return cookies
  }

  for (const cookiePair of cookieHeader.split(';')) {
    const separatorIndex = cookiePair.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const name = cookiePair.slice(0, separatorIndex).trim()
    const value = cookiePair.slice(separatorIndex + 1).trim()

    if (name) {
      cookies.set(name, decodeURIComponent(value))
    }
  }

  return cookies
}

const sanitizeVisitorKey = (value: string) => {
  const normalized = value.trim()

  if (/^[a-zA-Z0-9_-]{12,80}$/.test(normalized)) {
    return normalized
  }

  return ''
}

export const getDiscussionVisitor = (headers: Headers) => {
  const cookieValue = sanitizeVisitorKey(
    parseCookieHeader(headers.get('cookie')).get(DISCUSSION_VISITOR_COOKIE) || '',
  )

  if (cookieValue) {
    return {
      setCookieHeader: null as null | string,
      visitorKey: cookieValue,
    }
  }

  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
  const realIP = headers.get('x-real-ip')?.trim() || ''
  const userAgent = headers.get('user-agent')?.trim() || ''
  const visitorKey = `anon_${createStableHash(`${forwardedFor || realIP || 'unknown'}:${userAgent}`, 40)}`

  return {
    setCookieHeader: `${DISCUSSION_VISITOR_COOKIE}=${encodeURIComponent(
      visitorKey,
    )}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`,
    visitorKey,
  }
}

export const getDiscussionActorKey = ({
  user,
  visitorKey,
}: {
  user?: null | PayloadRequest['user']
  visitorKey: string
}) => {
  if (user?.collection && user.id) {
    return `user:${user.collection}:${String(user.id)}`
  }

  return `visitor:${visitorKey}`
}
