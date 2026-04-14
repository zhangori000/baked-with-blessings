type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4'

const createTextNode = (text: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal' as const,
  style: '',
  text,
  type: 'text' as const,
  version: 1,
})

const createParagraphNode = (text: string) => ({
  children: [createTextNode(text)],
  direction: 'ltr' as const,
  format: '',
  indent: 0,
  type: 'paragraph' as const,
  version: 1,
  textFormat: 0,
  textStyle: '',
})

const createHeadingNode = (text: string, tag: HeadingTag) => ({
  children: [createTextNode(text)],
  direction: 'ltr' as const,
  format: '',
  indent: 0,
  tag,
  type: 'heading' as const,
  version: 1,
})

export const createParagraphRichText = (text: string) => ({
  root: {
    children: [createParagraphNode(text)],
    direction: 'ltr' as const,
    format: '',
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
    format: '',
    indent: 0,
    type: 'root' as const,
    version: 1,
  },
})
