import type { Media } from '@/payload-types'
import type { Payload } from 'payload'

import { isLocalDatabaseURL, resolveDatabaseURL } from './resolveDatabaseURL'

type MediaSize = NonNullable<Media['sizes']>[keyof NonNullable<Media['sizes']>]

type SourceMediaDoc = Pick<
  Media,
  | 'alt'
  | 'caption'
  | 'filesize'
  | 'filename'
  | 'focalX'
  | 'focalY'
  | 'height'
  | 'mimeType'
  | 'sizes'
  | 'thumbnailURL'
  | 'url'
  | 'width'
> & {
  id: Media['id']
}

type SourceMediaResponse = {
  docs?: SourceMediaDoc[]
  hasNextPage?: boolean
  nextPage?: number | null
  page?: number
  totalDocs?: number
}

export type MediaSyncOptions = {
  allowEmptySourcePrune?: boolean
  allowRemoteTarget?: boolean
  dryRun?: boolean
  keepLocalMissing?: boolean
  limit?: number
  payload?: Payload
  skipExisting?: boolean
  sourceURL?: string
}

export type MediaSyncResult = {
  created: number
  deleted: number
  skipped: number
  sourceCount: number
  sourceURL: string
  updated: number
}

type LocalMediaDoc = Pick<Media, 'filename'> & {
  id: Media['id']
}

export const defaultMediaSyncSourceURL = 'https://bakedwithblessings.com'

const defaultMediaSyncLimit = 100

const getFlagValue = (arg: string, name: string) => {
  const prefix = `--${name}=`

  return arg.startsWith(prefix) ? arg.slice(prefix.length) : null
}

export const parseMediaSyncOptions = (
  args = process.argv.slice(2),
  env = process.env,
): Required<Omit<MediaSyncOptions, 'payload'>> => {
  let sourceURL = env.MEDIA_SYNC_SOURCE_URL || defaultMediaSyncSourceURL
  let limit = defaultMediaSyncLimit
  let allowEmptySourcePrune = false
  let dryRun = false
  let keepLocalMissing = env.MEDIA_SYNC_KEEP_LOCAL_MISSING === 'true'
  let skipExisting = false
  let allowRemoteTarget = env.MEDIA_SYNC_ALLOW_REMOTE_TARGET === 'true'

  for (const arg of args) {
    if (arg === '--') {
      continue
    }

    const sourceArg = getFlagValue(arg, 'source')
    const limitArg = getFlagValue(arg, 'limit')

    if (sourceArg) {
      sourceURL = sourceArg
      continue
    }

    if (limitArg) {
      const parsedLimit = Number(limitArg)

      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
        throw new Error('--limit must be an integer between 1 and 1000.')
      }

      limit = parsedLimit
      continue
    }

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--allow-empty-source-prune') {
      allowEmptySourcePrune = true
      continue
    }

    if (arg === '--keep-local-missing' || arg === '--no-prune') {
      keepLocalMissing = true
      continue
    }

    if (arg === '--skip-existing') {
      skipExisting = true
      continue
    }

    if (arg === '--allow-remote-target') {
      allowRemoteTarget = true
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return {
    allowEmptySourcePrune,
    allowRemoteTarget,
    dryRun,
    keepLocalMissing,
    limit,
    skipExisting,
    sourceURL: sourceURL.replace(/\/+$/, ''),
  }
}

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

const assertSafeTarget = (options: Required<Omit<MediaSyncOptions, 'payload'>>) => {
  if (options.allowRemoteTarget) {
    return
  }

  const databaseURL = resolveDatabaseURL()

  if (!isLocalDatabaseURL(databaseURL)) {
    throw new Error(
      [
        'Refusing to sync media into a non-local database target.',
        'This sync is intended for production-to-local media metadata.',
        'Pass --allow-remote-target only when you intentionally want to write to a hosted DB.',
      ].join(' '),
    )
  }
}

const fetchSourceMediaPage = async ({
  limit,
  page,
  sourceURL,
}: {
  limit: number
  page: number
  sourceURL: string
}): Promise<SourceMediaResponse> => {
  const url = new URL('/api/media', sourceURL)
  url.searchParams.set('depth', '0')
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('page', String(page))
  url.searchParams.set('sort', '-updatedAt')

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url.toString()}: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as SourceMediaResponse
}

const fetchAllSourceMedia = async (options: Required<Omit<MediaSyncOptions, 'payload'>>) => {
  const docs: SourceMediaDoc[] = []
  let page = 1

  while (true) {
    const result = await fetchSourceMediaPage({
      limit: options.limit,
      page,
      sourceURL: options.sourceURL,
    })

    docs.push(...(result.docs ?? []))

    if (!result.hasNextPage || !result.nextPage) {
      break
    }

    page = result.nextPage
  }

  return docs
}

const fetchAllLocalMedia = async ({
  limit,
  payload,
}: {
  limit: number
  payload: Payload
}) => {
  const docs: LocalMediaDoc[] = []
  let page = 1

  while (true) {
    const result = await payload.find({
      collection: 'media',
      depth: 0,
      limit,
      overrideAccess: true,
      page,
      sort: 'filename',
    })

    docs.push(
      ...result.docs.map((doc) => ({
        filename: doc.filename ?? null,
        id: doc.id,
      })),
    )

    if (!result.hasNextPage || !result.nextPage) {
      break
    }

    page = result.nextPage
  }

  return docs
}

const cleanSize = (size: MediaSize | undefined): MediaSize | undefined => {
  if (!size) {
    return undefined
  }

  return {
    filename: size.filename ?? null,
    filesize: size.filesize ?? null,
    height: size.height ?? null,
    mimeType: size.mimeType ?? null,
    url: size.url ?? null,
    width: size.width ?? null,
  }
}

const toMediaData = (doc: SourceMediaDoc) => ({
  alt: doc.alt,
  caption: doc.caption ?? null,
  filename: doc.filename ?? null,
  filesize: doc.filesize ?? null,
  focalX: doc.focalX ?? null,
  focalY: doc.focalY ?? null,
  height: doc.height ?? null,
  mimeType: doc.mimeType ?? null,
  sizes: {
    card: cleanSize(doc.sizes?.card),
    poster: cleanSize(doc.sizes?.poster),
    tablet: cleanSize(doc.sizes?.tablet),
    thumbnail: cleanSize(doc.sizes?.thumbnail),
  },
  thumbnailURL: doc.thumbnailURL ?? null,
  url: doc.url ?? null,
  width: doc.width ?? null,
})

const getPayloadInstance = async () => {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config')

  return getPayload({ config })
}

export const syncMediaFromPayload = async (
  options: MediaSyncOptions = {},
): Promise<MediaSyncResult> => {
  const normalizedOptions = {
    allowEmptySourcePrune: options.allowEmptySourcePrune ?? false,
    allowRemoteTarget: options.allowRemoteTarget ?? false,
    dryRun: options.dryRun ?? false,
    keepLocalMissing: options.keepLocalMissing ?? false,
    limit: options.limit ?? defaultMediaSyncLimit,
    skipExisting: options.skipExisting ?? false,
    sourceURL: (options.sourceURL || defaultMediaSyncSourceURL).replace(/\/+$/, ''),
  }
  assertSafeTarget(normalizedOptions)

  const payload = options.payload ?? (await getPayloadInstance())
  const shouldDestroyPayload = !options.payload

  try {
    const sourceDocs = await fetchAllSourceMedia(normalizedOptions)
    const sourceFilenames = new Set(
      sourceDocs.flatMap((doc) => (doc.filename ? [doc.filename] : [])),
    )
    const result: MediaSyncResult = {
      created: 0,
      deleted: 0,
      skipped: 0,
      sourceCount: sourceDocs.length,
      sourceURL: normalizedOptions.sourceURL,
      updated: 0,
    }

    if (
      !normalizedOptions.keepLocalMissing &&
      sourceFilenames.size === 0 &&
      !normalizedOptions.allowEmptySourcePrune
    ) {
      throw new Error(
        [
          'Refusing to prune local Media because the source returned zero usable filenames.',
          'If this is intentional, rerun with --allow-empty-source-prune.',
        ].join(' '),
      )
    }

    for (const doc of sourceDocs) {
      if (!doc.filename) {
        console.warn(`- Skipping source media ${doc.id}: missing filename.`)
        result.skipped += 1
        continue
      }

      const existing = await payload.find({
        collection: 'media',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          filename: {
            equals: doc.filename,
          },
        },
      })

      const existingDoc = existing.docs[0]

      if (existingDoc && normalizedOptions.skipExisting) {
        console.log(`- Exists: ${doc.filename}. Skipping.`)
        result.skipped += 1
        continue
      }

      if (normalizedOptions.dryRun) {
        console.log(`- ${existingDoc ? 'Would update' : 'Would create'}: ${doc.filename}`)

        if (existingDoc) {
          result.updated += 1
        } else {
          result.created += 1
        }

        continue
      }

      const data = toMediaData(doc)

      if (existingDoc) {
        await payload.db.updateOne({
          id: existingDoc.id,
          collection: 'media',
          data,
        })

        console.log(`- Updated: ${doc.filename}`)
        result.updated += 1
        continue
      }

      await payload.db.create({
        collection: 'media',
        data,
      })

      console.log(`- Created: ${doc.filename}`)
      result.created += 1
    }

    if (normalizedOptions.keepLocalMissing) {
      console.log('- Keeping local-only Media documents because --keep-local-missing was passed.')
      return result
    }

    const localDocs = await fetchAllLocalMedia({
      limit: normalizedOptions.limit,
      payload,
    })

    for (const doc of localDocs) {
      if (doc.filename && sourceFilenames.has(doc.filename)) {
        continue
      }

      const displayName = doc.filename || `media id ${doc.id}`

      if (normalizedOptions.dryRun) {
        console.log(`- Would delete local-only Media document: ${displayName}`)
        result.deleted += 1
        continue
      }

      await payload.db.deleteOne({
        collection: 'media',
        where: {
          id: {
            equals: doc.id,
          },
        },
      })

      console.log(`- Deleted local-only Media document: ${displayName}`)
      result.deleted += 1
    }

    return result
  } finally {
    if (shouldDestroyPayload) {
      await destroyWithTimeout(() => payload.destroy())
    }
  }
}

export const formatMediaSyncResult = (result: MediaSyncResult) =>
  `Media sync finished. Source: ${result.sourceCount}; created: ${result.created}; updated: ${result.updated}; deleted: ${result.deleted}; skipped: ${result.skipped}.`
