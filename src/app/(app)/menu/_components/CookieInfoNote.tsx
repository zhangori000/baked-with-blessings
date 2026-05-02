import type { CookieInfoRichText } from './cookiePosterData'

type InfoTextNode = {
  format?: number
  text?: string
  type?: string
}

type InfoElementNode = {
  children?: InfoTextNode[]
  tag?: string
  type?: string
}

const isInfoTextNode = (node: unknown): node is InfoTextNode =>
  Boolean(node && typeof node === 'object' && (node as InfoTextNode).type === 'text')

const isInfoElementNode = (node: unknown): node is InfoElementNode =>
  Boolean(node && typeof node === 'object' && 'type' in node)

const renderInfoTextNodes = (nodes: InfoTextNode[] | undefined) =>
  nodes?.map((node, index) => {
    if (!isInfoTextNode(node) || !node.text) {
      return null
    }

    return node.format && (node.format & 1) === 1 ? (
      <strong key={`${node.text}-${index}`}>{node.text}</strong>
    ) : (
      <span key={`${node.text}-${index}`}>{node.text}</span>
    )
  }) ?? null

export function CookieInfoProse({ data }: { data: CookieInfoRichText }) {
  const nodes = data.root?.children ?? []

  return (
    <>
      {nodes.map((node, index) => {
        if (!isInfoElementNode(node)) {
          return null
        }

        if (node.type === 'heading') {
          return <h4 key={index}>{renderInfoTextNodes(node.children)}</h4>
        }

        return <p key={index}>{renderInfoTextNodes(node.children)}</p>
      })}
    </>
  )
}

type CookieInfoNoteProps = {
  allergens?: string[]
  body: CookieInfoRichText
  className?: string
}

export function CookieInfoNote({ allergens, body, className }: CookieInfoNoteProps) {
  return (
    <div className={className ? `cookieInfoNote ${className}` : 'cookieInfoNote'}>
      <CookieInfoProse data={body} />
      {allergens && allergens.length > 0 ? (
        <p className="cookieInfoNoteAllergens">
          <strong>Contains:</strong> {allergens.join(', ')}.
        </p>
      ) : null}
    </div>
  )
}
