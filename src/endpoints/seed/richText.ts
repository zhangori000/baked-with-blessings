type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4'

type TextSegment =
  | string
  | {
      bold?: boolean
      italic?: boolean
      text: string
    }

const createTextNode = (
  text: string,
  options?: {
    bold?: boolean
    italic?: boolean
  },
) => ({
  detail: 0,
  format:
    options?.bold && options?.italic
      ? 3
      : options?.bold
        ? 1
        : options?.italic
          ? 2
          : 0,
  mode: 'normal' as const,
  style: '',
  text,
  type: 'text' as const,
  version: 1,
})

const createTextNodes = (segments: TextSegment[]) =>
  segments.map((segment) =>
    typeof segment === 'string'
      ? createTextNode(segment)
      : createTextNode(segment.text, { bold: segment.bold }),
  )

const createParagraphNode = (text: string) => ({
  children: [createTextNode(text)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  type: 'paragraph' as const,
  version: 1,
  textFormat: 0,
  textStyle: '',
})

const createParagraphNodeFromSegments = (segments: TextSegment[]) => ({
  children: createTextNodes(segments),
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  type: 'paragraph' as const,
  version: 1,
  textFormat: 0,
  textStyle: '',
})

const createHeadingNode = (text: string, tag: HeadingTag) => ({
  children: [createTextNode(text)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  tag,
  type: 'heading' as const,
  version: 1,
})

export const createParagraphRichText = (text: string) => ({
  root: {
    children: [createParagraphNode(text)],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'root' as const,
    version: 1,
  },
})

export const createSegmentedParagraphsRichText = (paragraphs: TextSegment[][]) => ({
  root: {
    children: paragraphs.map(createParagraphNodeFromSegments),
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'root' as const,
    version: 1,
  },
})

export const createParagraphsRichText = (paragraphs: string[]) => ({
  root: {
    children: paragraphs.map(createParagraphNode),
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'root' as const,
    version: 1,
  },
})

export const createHeadingAndParagraphsRichText = ({
  heading,
  headingTag = 'h2',
  paragraphs,
}: {
  heading: string
  headingTag?: HeadingTag
  paragraphs: string[]
}) => ({
  root: {
    children: [createHeadingNode(heading, headingTag), ...paragraphs.map(createParagraphNode)],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'root' as const,
    version: 1,
  },
})
