import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

import type { Media } from '../src/payload-types'
import type { Payload } from 'payload'
import { isLocalDatabaseURL, resolveDatabaseURL } from '../src/utilities/resolveDatabaseURL'

/*
 * Reconcile Payload Media documents from a source Payload API into the
 * database configured for this local process. The source files already live in
 * Vercel Blob; this script syncs the database rows that make those files
 * appear in the Admin Media collection.
 *
 * Typical local usage:
 *   pnpm sync:media:prod-to-local
 *
 * Safety:
 * - Reads from the public production Media API by default.
 * - Writes to the current Payload database from `.env` / `.env.local`.
 * - Refuses remote targets unless `--allow-remote-target` is passed.
 * - Deletes local-only Media database rows by default so local matches prod.
 * - Does not upload, download, or delete Blob files.
 */

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

type SyncOptions = {
  allowEmptySourcePrune: boolean
  allowRemoteTarget: boolean
  dryRun: boolean
  keepLocalMissing: boolean
  limit: number
  skipExisting: boolean
  sourceURL: string
}

type SyncResult = {
  created: number
  deleted: number
  skipped: number
  updated: number
}

type LocalMediaDoc = Pick<Media, 'filename'> & {
  id: Media['id']
}

const defaultSourceURL = 'https://bakedwithblessings.com'

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

const getFlagValue = (arg: string, name: string) => {
  const prefix = `--${name}=`

  return arg.startsWith(prefix) ? arg.slice(prefix.length) : null
}

const parseOptions = (): SyncOptions => {
  const args = process.argv.slice(2)
  let sourceURL = process.env.MEDIA_SYNC_SOURCE_URL || defaultSourceURL
  let limit = 100
  let allowEmptySourcePrune = false
  let dryRun = false
  let keepLocalMissing = process.env.MEDIA_SYNC_KEEP_LOCAL_MISSING === 'true'
  let skipExisting = false
  let allowRemoteTarget = process.env.MEDIA_SYNC_ALLOW_REMOTE_TARGET === 'true'

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

const assertSafeTarget = (options: SyncOptions) => {
  if (options.allowRemoteTarget) {
    return
  }

  const databaseURL = resolveDatabaseURL()

  if (!isLocalDatabaseURL(databaseURL)) {
    throw new Error(
      [
        'Refusing to sync media into a non-local database target.',
        'This script is intended for production-to-local media metadata sync.',
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

const fetchAllSourceMedia = async (options: SyncOptions) => {
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

const syncMedia = async (options: SyncOptions): Promise<SyncResult> => {
  assertSafeTarget(options)

  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  try {
    const sourceDocs = await fetchAllSourceMedia(options)
    const sourceFilenames = new Set(
      sourceDocs.flatMap((doc) => (doc.filename ? [doc.filename] : [])),
    )
    const result: SyncResult = {
      created: 0,
      deleted: 0,
      skipped: 0,
      updated: 0,
    }

    console.log(`Found ${sourceDocs.length} media document(s) at ${options.sourceURL}.`)

    if (!options.keepLocalMissing && sourceFilenames.size === 0 && !options.allowEmptySourcePrune) {
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

      if (existingDoc && options.skipExisting) {
        console.log(`- Exists: ${doc.filename}. Skipping.`)
        result.skipped += 1
        continue
      }

      if (options.dryRun) {
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

    if (options.keepLocalMissing) {
      console.log('- Keeping local-only Media documents because --keep-local-missing was passed.')
      return result
    }

    const localDocs = await fetchAllLocalMedia({
      limit: options.limit,
      payload,
    })

    for (const doc of localDocs) {
      if (doc.filename && sourceFilenames.has(doc.filename)) {
        continue
      }

      const displayName = doc.filename || `media id ${doc.id}`

      if (options.dryRun) {
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
    await destroyWithTimeout(() => payload.destroy())
  }
}

void syncMedia(parseOptions())
  .then((result) => {
    console.log(
      `Media sync finished. Created: ${result.created}, updated: ${result.updated}, deleted: ${result.deleted}, skipped: ${result.skipped}.`,
    )
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
