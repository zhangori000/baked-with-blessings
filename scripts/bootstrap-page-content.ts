import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

/*
 * Populate hero copy globals (BlogPageContent, DiscussionBoardContent,
 * CommunityPageContent) with sensible defaults the first time they are run
 * against a database.
 *
 * Idempotent: if a global already has non-empty fields, this script leaves
 * them alone so editor tweaks are never overwritten.
 *
 * Local usage:
 *   pnpm bootstrap:page-content
 *
 * Hosted environments (after the matching migration has been applied):
 *   vercel env run -e preview     -- pnpm bootstrap:page-content
 *   vercel env run -e production  -- pnpm bootstrap:page-content
 */

const destroyWithTimeout = async (destroy: () => Promise<void>) => {
  await Promise.race([
    destroy(),
    new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn('Payload shutdown timed out after 2s. Forcing process exit.')
        resolve()
      }, 2000)
    }),
  ])
}

type ContentDefaults = {
  eyebrow: string
  summary: string
  title: string
}

const isEmpty = (value: string | null | undefined) => {
  if (typeof value !== 'string') return true
  return value.trim().length === 0
}

const bootstrap = async () => {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const { BLOG_PAGE_CONTENT_DEFAULTS } = await import('../src/globals/BlogPageContent')
  const { COMMUNITY_PAGE_CONTENT_DEFAULTS } = await import('../src/globals/CommunityPageContent')
  const { DISCUSSION_BOARD_CONTENT_DEFAULTS } = await import(
    '../src/globals/DiscussionBoardContent'
  )
  const { FEATURE_REQUESTS_CONTENT_DEFAULTS } = await import(
    '../src/globals/FeatureRequestsContent'
  )

  const payload = await getPayload({ config })

  const targets: {
    defaults: ContentDefaults
    label: string
    slug:
      | 'blog-page-content'
      | 'community-page-content'
      | 'discussion-board-content'
      | 'feature-requests-content'
  }[] = [
    {
      defaults: BLOG_PAGE_CONTENT_DEFAULTS,
      label: 'Blog page content',
      slug: 'blog-page-content',
    },
    {
      defaults: DISCUSSION_BOARD_CONTENT_DEFAULTS,
      label: 'Discussion board content',
      slug: 'discussion-board-content',
    },
    {
      defaults: COMMUNITY_PAGE_CONTENT_DEFAULTS,
      label: 'Community page content',
      slug: 'community-page-content',
    },
    {
      defaults: FEATURE_REQUESTS_CONTENT_DEFAULTS,
      label: 'Feature requests page content',
      slug: 'feature-requests-content',
    },
  ]

  try {
    for (const target of targets) {
      const current = await payload.findGlobal({ slug: target.slug, depth: 0 })

      const nextEyebrow = isEmpty(current.eyebrow) ? target.defaults.eyebrow : current.eyebrow
      const nextTitle = isEmpty(current.title) ? target.defaults.title : current.title
      const nextSummary = isEmpty(current.summary) ? target.defaults.summary : current.summary

      const nothingChanged =
        nextEyebrow === current.eyebrow &&
        nextTitle === current.title &&
        nextSummary === current.summary

      if (nothingChanged) {
        console.log(`${target.label}: already populated. Skipping.`)
        continue
      }

      await payload.updateGlobal({
        slug: target.slug,
        data: {
          eyebrow: nextEyebrow,
          summary: nextSummary,
          title: nextTitle,
        },
      })

      console.log(`${target.label}: filled empty fields with defaults.`)
    }
  } finally {
    await destroyWithTimeout(() => payload.destroy())
  }
}

void bootstrap()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
