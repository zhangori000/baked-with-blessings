import path from 'node:path'

import { del, list } from '@vercel/blob'
import type { Payload } from 'payload'

const getSeedBlobToken = () => process.env.BLOB_READ_WRITE_TOKEN?.trim()

const isBlobForSeedFilename = ({ filename, pathname }: { filename: string; pathname: string }) => {
  const seedFile = path.posix.parse(filename)
  const blobName = path.posix.basename(decodeURIComponent(pathname))

  return (
    blobName === filename ||
    (blobName.startsWith(`${seedFile.name}-`) && blobName.endsWith(seedFile.ext))
  )
}

export const clearSeedMediaBlobs = async ({
  filename,
  payload,
}: {
  filename: string
  payload: Payload
}) => {
  const token = getSeedBlobToken()

  if (!token) {
    return 0
  }

  const seedFile = path.posix.parse(filename)
  const pathnamesToDelete: string[] = []
  let cursor: string | undefined

  do {
    const page = await list({
      cursor,
      limit: 1000,
      prefix: seedFile.name,
      token,
    })

    for (const blob of page.blobs) {
      if (isBlobForSeedFilename({ filename, pathname: blob.pathname })) {
        pathnamesToDelete.push(blob.pathname)
      }
    }

    cursor = page.cursor
  } while (cursor)

  if (pathnamesToDelete.length === 0) {
    return 0
  }

  await del(pathnamesToDelete, { token })

  payload.logger.info(
    `- Cleared ${pathnamesToDelete.length} existing Blob object(s) for ${filename}`,
  )

  return pathnamesToDelete.length
}
