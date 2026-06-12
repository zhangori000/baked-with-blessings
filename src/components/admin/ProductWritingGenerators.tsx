'use client'

import { extractRichTextPlainText } from '@/utilities/extractRichTextPlainText'
import { Button, toast, useField, useForm } from '@payloadcms/ui'
import React from 'react'

import './ProductWritingGenerators.css'

type RichTextNode = {
  children?: RichTextNode[]
  detail?: number
  direction?: 'ltr' | 'rtl' | null
  format?: '' | number
  indent?: number
  mode?: 'normal'
  style?: string
  tag?: 'h3' | 'h4'
  text?: string
  textFormat?: number
  textStyle?: string
  type: 'heading' | 'paragraph' | 'root' | 'text'
  version: number
}

type RichTextValue = {
  root: RichTextNode
}

type TextSegment =
  | string
  | {
      bold?: boolean
      text: string
    }

const baseClass = 'product-writing-generator'
const sharedKitchenAllergyNote =
  'Baked in a shared kitchen with wheat, milk, eggs, soy, peanuts, and tree nuts.'

const createTextNode = (text: string, options?: { bold?: boolean }): RichTextNode => ({
  detail: 0,
  format: options?.bold ? 1 : 0,
  mode: 'normal',
  style: '',
  text,
  type: 'text',
  version: 1,
})

const createParagraphNode = (segments: TextSegment[]): RichTextNode => ({
  children: segments.map((segment) =>
    typeof segment === 'string' ? createTextNode(segment) : createTextNode(segment.text, segment),
  ),
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  type: 'paragraph',
  version: 1,
})

const createHeadingNode = (text: string, tag: 'h3' | 'h4' = 'h3'): RichTextNode => ({
  children: [createTextNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  tag,
  type: 'heading',
  version: 1,
})

const createRichText = (children: RichTextNode[]): RichTextValue => ({
  root: {
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''

const getProductTitle = (getDataByPath: <T = unknown>(path: string) => T) =>
  normalizeText(getDataByPath('title')) || 'This product'

const getFlavorName = (title: string) => title.replace(/\s+cookie$/i, '').trim()

const getProductKind = (title: string) => (/\bcookie\b/i.test(title) ? 'cookie' : 'treat')

const getDescriptionPlainText = (getDataByPath: <T = unknown>(path: string) => T) =>
  extractRichTextPlainText(getDataByPath('description'))

const buildProductSummaryText = (title: string) => {
  const flavorName = getFlavorName(title)
  const productKind = getProductKind(title)

  return `${title} is a bakery-style ${productKind} with ${flavorName.toLowerCase()} flavor, a soft satisfying bite, and a made-with-care finish.`
}

const buildExpandedMenuRichText = (title: string, productDescription: string): RichTextValue => {
  const productKind = getProductKind(title)
  const intro = productDescription || buildProductSummaryText(title)

  return createRichText([
    createHeadingNode(`About ${title}`),
    createParagraphNode([intro]),
    createParagraphNode([
      `This ${productKind} is a good fit when customers want something memorable, giftable, and easy to share. Add exact ingredients, texture details, and seasonal notes here before publishing.`,
    ]),
  ])
}

const buildProductInfoRichText = (title: string, productDescription: string): RichTextValue => {
  const flavorName = getFlavorName(title)
  const productKind = getProductKind(title)
  const flavorNote =
    productDescription ||
    `${title} is a bakery-style ${productKind} built around ${flavorName.toLowerCase()} flavor.`

  return createRichText([
    createParagraphNode([{ bold: true, text: 'Flavor notes: ' }, flavorNote]),
    createParagraphNode([
      { bold: true, text: 'Serving notes: ' },
      'Best enjoyed fresh. Warm slightly if you want a softer bite.',
    ]),
    createParagraphNode([{ bold: true, text: 'Allergy: ' }, sharedKitchenAllergyNote]),
  ])
}

const GeneratorShell = ({
  buttonLabel,
  children,
  onClick,
}: {
  buttonLabel: string
  children: React.ReactNode
  onClick: () => void
}) => (
  <div className={baseClass}>
    <Button buttonStyle="secondary" onClick={onClick} size="small">
      {buttonLabel}
    </Button>
    <p className={`${baseClass}__description`}>{children}</p>
  </div>
)

export const GenerateProductDescription: React.FC = () => {
  const { getDataByPath } = useForm()
  const { setValue } = useField<RichTextValue>({
    path: 'description',
  })

  const generateDescription = () => {
    const title = getProductTitle(getDataByPath)

    setValue(createRichText([createParagraphNode([buildProductSummaryText(title)])]))
    toast.success('Generated editable product description.')
  }

  return (
    <GeneratorShell buttonLabel="Auto-generate product description" onClick={generateDescription}>
      Creates a short customer-facing starter description from the product title.
    </GeneratorShell>
  )
}

export const GenerateExpandedMenuDescription: React.FC = () => {
  const { getDataByPath } = useForm()
  const { setValue } = useField<RichTextValue>({
    path: 'menuExpandedPitch',
  })

  const generateExpandedMenuDescription = () => {
    const title = getProductTitle(getDataByPath)
    const productDescription = getDescriptionPlainText(getDataByPath)

    setValue(buildExpandedMenuRichText(title, productDescription))
    toast.success('Generated editable expanded menu description.')
  }

  return (
    <GeneratorShell
      buttonLabel="Auto-generate expanded menu description"
      onClick={generateExpandedMenuDescription}
    >
      Uses the Product Description when present, then adds editable menu-card detail.
    </GeneratorShell>
  )
}

export const GenerateProductInfoPopup: React.FC = () => {
  const { getDataByPath } = useForm()
  const { setValue } = useField<RichTextValue>({
    path: 'poster.receiptBody',
  })

  const generateProductInfoPopup = () => {
    const title = getProductTitle(getDataByPath)
    const productDescription = getDescriptionPlainText(getDataByPath)

    setValue(buildProductInfoRichText(title, productDescription))
    toast.success('Generated editable product info popup.')
  }

  return (
    <GeneratorShell buttonLabel="Auto-generate product info" onClick={generateProductInfoPopup}>
      Creates flavor notes, serving notes, and the standard shared-kitchen allergy note.
    </GeneratorShell>
  )
}
