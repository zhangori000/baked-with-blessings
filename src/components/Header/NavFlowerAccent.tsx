import { useId } from 'react'

type Props = {
  tone?: 'orange' | 'plum'
}

const palettes = {
  orange: {
    centerInner: '#6b4a07',
    centerOuter: '#2e2208',
    edge: '#8a2d00',
    leaf: '#8a9740',
    petalInner: '#ffb56c',
    petalOuter: '#dd5b08',
    pollen: '#f6e4a4',
  },
  plum: {
    centerInner: '#857445',
    centerOuter: '#3d3517',
    edge: '#4f3341',
    leaf: '#7f8c35',
    petalInner: '#8f687a',
    petalOuter: '#5a3949',
    pollen: '#f0e8bb',
  },
} as const

const petalRotations = [0, 60, 120, 180, 240, 300] as const

export function NavFlowerAccent({ tone = 'orange' }: Props) {
  const gradientId = useId()
  const highlightId = useId()
  const centerId = useId()
  const stemId = useId()
  const palette = palettes[tone]

  return (
    <svg aria-hidden="true" viewBox="0 0 120 148" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient cx="42%" cy="32%" id={gradientId} r="74%">
          <stop offset="0%" stopColor={palette.petalInner} />
          <stop offset="68%" stopColor={palette.petalOuter} />
          <stop offset="100%" stopColor={palette.edge} />
        </radialGradient>

        <linearGradient id={highlightId} x1="0.5" x2="0.5" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff7df" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#fff7df" stopOpacity="0" />
        </linearGradient>

        <radialGradient cx="38%" cy="34%" id={centerId} r="70%">
          <stop offset="0%" stopColor={palette.centerInner} />
          <stop offset="100%" stopColor={palette.centerOuter} />
        </radialGradient>

        <linearGradient id={stemId} x1="0.2" x2="0.8" y1="0" y2="1">
          <stop offset="0%" stopColor="#b8c452" />
          <stop offset="100%" stopColor="#647321" />
        </linearGradient>
      </defs>

      <path
        d="M60 76 C56 95 57 112 61 136"
        fill="none"
        stroke={`url(#${stemId})`}
        strokeLinecap="round"
        strokeWidth="5"
      />
      <path d="M61 96 C74 93 84 98 88 111 C77 113 69 110 61 101 Z" fill="#87963b" opacity="0.94" />
      <path
        d="M60 108 C49 103 40 105 32 117 C44 121 52 118 60 112 Z"
        fill="#798634"
        opacity="0.9"
      />

      <g transform="translate(60 53)">
        <path
          d="M0 -28 C10 -28 16 -16 14 -2 C12 14 7 24 0 34 C-7 24 -12 14 -14 -2 C-16 -16 -10 -28 0 -28 Z"
          fill={`url(#${gradientId})`}
          stroke={palette.edge}
          strokeWidth="1.5"
        />
        <path
          d="M-2 -6 C-12 -19 -18 -27 -25 -36 C-20 -43 -11 -43 -6 -36 C-3 -31 -1 -23 -1 -9 Z"
          fill={`url(#${gradientId})`}
          stroke={palette.edge}
          strokeWidth="1.5"
        />
        <path
          d="M2 -6 C12 -19 18 -27 25 -36 C20 -43 11 -43 6 -36 C3 -31 1 -23 1 -9 Z"
          fill={`url(#${gradientId})`}
          stroke={palette.edge}
          strokeWidth="1.5"
        />
        <path
          d="M0 -22 C5 -21 8 -14 7 -4 C6 8 3 17 0 24 C-3 17 -6 8 -7 -4 C-8 -14 -5 -21 0 -22 Z"
          fill={`url(#${highlightId})`}
          opacity="0.5"
        />
        <circle
          cx="0"
          cy="3"
          fill={`url(#${centerId})`}
          r="10"
          stroke={palette.centerOuter}
          strokeWidth="1.1"
        />
        <circle cx="-5" cy="-3" fill={palette.pollen} r="1.7" />
        <circle cx="3" cy="-6" fill={palette.pollen} r="1.5" />
        <circle cx="5" cy="2" fill={palette.pollen} r="1.6" />
        <circle cx="-2" cy="5" fill={palette.pollen} r="1.4" />
      </g>
    </svg>
  )
}
