import type { PayloadRequest } from 'payload'

import { randomBytes, randomUUID } from 'node:crypto'

import { createStableHash } from '@/utilities/idempotency'

export const DISCUSSION_VISITOR_COOKIE = 'bwb_discussion_visitor'

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
export type DiscussionVisitor = {
  setCookieHeader: null | string
  visitorKey: string
}

const visitorCache = new WeakMap<Headers, DiscussionVisitor>()

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

const createRandomVisitorKey = () => {
  try {
    return `anon_${randomUUID().replace(/-/g, '')}`
  } catch {
    try {
      return `anon_${randomBytes(24).toString('base64url')}`
    } catch {
      return ''
    }
  }
}

const createDeterministicFallbackVisitorKey = (headers: Headers) => {
  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
  const realIP = headers.get('x-real-ip')?.trim() || ''
  const userAgent = headers.get('user-agent')?.trim() || ''

  return `anon_${createStableHash(`${forwardedFor || realIP || 'unknown'}:${userAgent}`, 40)}`
}

export const getDiscussionVisitor = (headers: Headers): DiscussionVisitor => {
  const cachedVisitor = visitorCache.get(headers)

  if (cachedVisitor) {
    return cachedVisitor
  }

  const cookieValue = sanitizeVisitorKey(
    parseCookieHeader(headers.get('cookie')).get(DISCUSSION_VISITOR_COOKIE) || '',
  )

  if (cookieValue) {
    const visitor = {
      setCookieHeader: null as null | string,
      visitorKey: cookieValue,
    }

    visitorCache.set(headers, visitor)
    return visitor
  }

  const visitorKey = createRandomVisitorKey() || createDeterministicFallbackVisitorKey(headers)

  const visitor = {
    setCookieHeader: `${DISCUSSION_VISITOR_COOKIE}=${encodeURIComponent(
      visitorKey,
    )}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax`,
    visitorKey,
  }

  visitorCache.set(headers, visitor)
  return visitor
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
