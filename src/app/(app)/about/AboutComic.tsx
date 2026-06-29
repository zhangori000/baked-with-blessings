/**
 * A three-panel comic strip (Garfield-style: bold panel borders + speech
 * bubbles) telling the order → bake → meet-up story with simple hand-drawn
 * stick figures. Placeholder art on purpose — easy, cute, and swappable later.
 * Static by request. Figures ink with the theme foreground (currentColor).
 */

const COOKIE_FILL = '#cfa06a'
const COOKIE_DOT = '#5a3a18'

function Cookie({ r = 8, x, y }: { r?: number; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={0} cy={0} fill={COOKIE_FILL} r={r} stroke="currentColor" strokeWidth={2} />
      <circle cx={-r * 0.35} cy={-r * 0.2} fill={COOKIE_DOT} r={1.5} />
      <circle cx={r * 0.3} cy={r * 0.15} fill={COOKIE_DOT} r={1.5} />
      <circle cx={-r * 0.1} cy={r * 0.45} fill={COOKIE_DOT} r={1.5} />
    </g>
  )
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 3,
} as const

function OrderScene() {
  return (
    <svg className="aboutComicSvg" viewBox="0 0 120 100" aria-hidden="true">
      <g {...stroke}>
        <circle cx={46} cy={24} r={10} />
        <line x1={46} y1={34} x2={46} y2={66} />
        <line x1={46} y1={66} x2={37} y2={90} />
        <line x1={46} y1={66} x2={55} y2={90} />
        <line x1={46} y1={44} x2={33} y2={56} />
        <line x1={46} y1={44} x2={62} y2={50} />
      </g>
      <rect
        fill="var(--bakery-color-bg-primary)"
        height={19}
        rx={3}
        stroke="currentColor"
        strokeWidth={2.5}
        width={13}
        x={61}
        y={42}
      />
      <line stroke="currentColor" strokeLinecap="round" strokeWidth={2} x1={64} x2={71} y1={59} y2={59} />
      <Cookie x={88} y={22} />
    </svg>
  )
}

function BakeScene() {
  return (
    <svg className="aboutComicSvg" viewBox="0 0 120 100" aria-hidden="true">
      {/* chef hat */}
      <ellipse cx={58} cy={11} fill="var(--bakery-color-bg-primary)" rx={13} ry={7} stroke="currentColor" strokeWidth={2.5} />
      <rect fill="var(--bakery-color-bg-primary)" height={6} rx={2} stroke="currentColor" strokeWidth={2.5} width={24} x={46} y={14} />
      <g {...stroke}>
        <circle cx={58} cy={29} r={10} />
        <line x1={58} y1={39} x2={58} y2={66} />
        <line x1={58} y1={66} x2={49} y2={90} />
        <line x1={58} y1={66} x2={67} y2={90} />
        <line x1={58} y1={47} x2={43} y2={55} />
        <line x1={58} y1={47} x2={73} y2={55} />
      </g>
      {/* tray */}
      <ellipse cx={58} cy={58} fill="none" rx={20} ry={3.5} stroke="currentColor" strokeWidth={2.5} />
      {/* steam */}
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2} opacity={0.6}>
        <path d="M52 44 q -3 -4 0 -8 q 3 -4 0 -8" />
        <path d="M64 44 q -3 -4 0 -8 q 3 -4 0 -8" />
      </g>
      <Cookie x={58} y={49} />
    </svg>
  )
}

function MeetScene() {
  return (
    <svg className="aboutComicSvg" viewBox="0 0 120 100" aria-hidden="true">
      <g {...stroke}>
        {/* person A */}
        <circle cx={32} cy={28} r={9} />
        <line x1={32} y1={37} x2={32} y2={66} />
        <line x1={32} y1={66} x2={24} y2={90} />
        <line x1={32} y1={66} x2={40} y2={90} />
        <line x1={32} y1={46} x2={50} y2={54} />
        {/* person B */}
        <circle cx={88} cy={28} r={9} />
        <line x1={88} y1={37} x2={88} y2={66} />
        <line x1={88} y1={66} x2={80} y2={90} />
        <line x1={88} y1={66} x2={96} y2={90} />
        <line x1={88} y1={46} x2={70} y2={54} />
      </g>
      {/* heart */}
      <path
        d="M60 24 C 57 19, 49 20, 49 27 C 49 33, 57 37, 60 41 C 63 37, 71 33, 71 27 C 71 20, 63 19, 60 24 Z"
        fill="#e7779a"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <Cookie r={7} x={60} y={56} />
    </svg>
  )
}

const panels = [
  { bubble: 'One box of cookies, please!', Scene: OrderScene, step: 'You order' },
  { bubble: 'Fresh batch, coming right up!', Scene: BakeScene, step: 'We bake' },
  { bubble: 'See you nearby. Enjoy!', Scene: MeetScene, step: 'We meet up' },
]

export function AboutComic() {
  return (
    <div
      className="aboutComic"
      role="img"
      aria-label="A three-panel comic: you order, we bake a fresh batch, then we meet up to hand it over."
    >
      {panels.map((panel, index) => {
        const { Scene } = panel
        return (
          <figure className="aboutComicPanel" key={panel.step}>
            <div className="aboutComicBubble">
              <p>{panel.bubble}</p>
            </div>
            <div className="aboutComicScene">
              <Scene />
            </div>
            <figcaption className="aboutComicStep">
              {index + 1} · {panel.step}
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}
