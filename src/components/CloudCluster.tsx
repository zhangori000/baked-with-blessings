import type { CSSProperties, FC, SVGProps } from 'react'

type CloudVariant = 'story' | 'halfEgg' | 'stacked'

type ShapeRect = {
  height: number
  rx: number
  width: number
  x: number
  y: number
}

type ShapeEllipse = {
  cx: number
  cy: number
  rx: number
  ry: number
}

type ShapePath = {
  d: string
}

type CloudDefinition = {
  ellipses?: ShapeEllipse[]
  paths?: ShapePath[]
  rects?: ShapeRect[]
  viewBox: string
}

type CloudClusterProps = SVGProps<SVGSVGElement> & {
  className?: string
  style?: CSSProperties
  variant?: CloudVariant
}

const cloudVariants: Record<CloudVariant, CloudDefinition> = {
  story: {
    ellipses: [
      { cx: 42, cy: 58, rx: 26, ry: 20 },
      { cx: 86, cy: 48, rx: 34, ry: 28 },
      { cx: 132, cy: 48, rx: 34, ry: 28 },
      { cx: 178, cy: 58, rx: 26, ry: 20 },
    ],
    viewBox: '0 0 220 96',
  },
  halfEgg: {
    paths: [
      {
        d: 'M16 88V66c0-19 16-34 35-34 13 0 24 6 30 17 10-24 35-41 64-41s54 17 64 41c6-11 17-17 30-17 19 0 35 15 35 34v22Z',
      },
    ],
    viewBox: '0 0 240 108',
  },
  stacked: {
    rects: [
      { height: 24, rx: 12, width: 88, x: 26, y: 44 },
      { height: 34, rx: 17, width: 116, x: 84, y: 18 },
      { height: 26, rx: 13, width: 92, x: 114, y: 50 },
    ],
    viewBox: '0 0 232 96',
  },
}

const renderEllipse = (shape: ShapeEllipse, key: string) => {
  return <ellipse cx={shape.cx} cy={shape.cy} key={key} rx={shape.rx} ry={shape.ry} />
}

const renderRect = (shape: ShapeRect, key: string) => {
  return (
    <rect
      height={shape.height}
      key={key}
      rx={shape.rx}
      width={shape.width}
      x={shape.x}
      y={shape.y}
    />
  )
}

const renderPath = (shape: ShapePath, key: string) => {
  return <path d={shape.d} key={key} />
}

export const CloudCluster: FC<CloudClusterProps> = ({
  className,
  style,
  variant = 'story',
  ...props
}) => {
  const definition = cloudVariants[variant]

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      {...props}
      style={style}
      viewBox={definition.viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor" stroke="none">
        {definition.ellipses?.map((shape, index) => renderEllipse(shape, `ellipse-${index}`))}
        {definition.rects?.map((shape, index) => renderRect(shape, `rect-${index}`))}
        {definition.paths?.map((shape, index) => renderPath(shape, `path-${index}`))}
      </g>
    </svg>
  )
}
