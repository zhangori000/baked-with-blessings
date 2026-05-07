type RichTextNode = {
  children?: RichTextNode[]
  text?: string
}

const collectText = (node: RichTextNode | undefined, chunks: string[]) => {
  if (!node) {
    return
  }

  if (typeof node.text === 'string' && node.text.trim()) {
    chunks.push(node.text.trim())
  }

  node.children?.forEach((child) => collectText(child, chunks))
}

export const extractRichTextPlainText = (value: unknown): string => {
  if (!value || typeof value !== 'object') {
    return ''
  }

  const root = (value as { root?: RichTextNode }).root
  const chunks: string[] = []

  collectText(root, chunks)

  return chunks.join(' ').replace(/\s+/g, ' ').trim()
}
