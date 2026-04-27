import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache.js'

const blogIndexPath = '/blog'

const getPostPath = (slug?: null | string) => {
  if (!slug) return blogIndexPath

  return `${blogIndexPath}/${slug}`
}

export const revalidatePost: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) {
    return doc
  }

  revalidatePath(blogIndexPath)

  if (doc._status === 'published') {
    const path = getPostPath(doc.slug)

    payload.logger.info(`Revalidating blog post at path: ${path}`)
    revalidatePath(path)
  }

  if (
    previousDoc?._status === 'published' &&
    (doc._status !== 'published' || previousDoc.slug !== doc.slug)
  ) {
    const oldPath = getPostPath(previousDoc.slug)

    payload.logger.info(`Revalidating old blog post at path: ${oldPath}`)
    revalidatePath(oldPath)
  }

  return doc
}

export const revalidatePostDelete: CollectionAfterDeleteHook = ({ doc, req: { context } }) => {
  if (context.disableRevalidate) {
    return doc
  }

  revalidatePath(blogIndexPath)
  revalidatePath(getPostPath(doc?.slug))

  return doc
}
