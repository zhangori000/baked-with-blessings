import type { ContentBlock, DiscussionContent } from './types'

export const normalizeTags = (tags: string[] = []) => {
  return Array.from(
    new Set(
      tags
        .map((tag) =>
          tag
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
        )
        .filter(Boolean),
    ),
  )
}

export const getContentBlocks = (content: unknown): ContentBlock[] => {
  if (!content || typeof content !== 'object' || !('blocks' in content)) {
    return []
  }

  const blocks = (content as DiscussionContent).blocks
  return Array.isArray(blocks) ? blocks : []
}

export const getContentText = (content: unknown) => {
  return getContentBlocks(content)
    .map((block) => block.text)
    .filter(Boolean)
    .join(' ')
}

export const getShortPreview = (content: unknown, maxLength = 180) => {
  const text = getContentText(content).replace(/\s+/g, ' ').trim()

  if (text.length <= maxLength) return text

  return `${text.slice(0, maxLength - 1).trim()}...`
}

export const buildSearchText = ({
  content,
  tags,
  title,
}: {
  content: unknown
  tags?: string[]
  title?: string
}) => {
  return [title, getContentText(content), ...(tags || [])]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const createClaimContent = (text: string): DiscussionContent => ({
  blocks: [
    {
      id: 'claim_1',
      text,
      type: 'claim',
    },
  ],
})
