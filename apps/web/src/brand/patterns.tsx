/**
 * Brand patterns, ported from the main site (components/BrandCurve.tsx,
 * BrandPiping.tsx, BrandRipple.tsx). Decorative only.
 */

type Tone = 'onLight' | 'onNavy'

const line = (tone: Tone) => (tone === 'onNavy' ? { stroke: '#F3F8FB', opacity: '.3' } : { stroke: '#3F5478', opacity: '.5' })

const CURVES = {
  left: {
    viewBox: '0 0 300 400',
    fillBack: 'M0 120C80 140 150 220 190 330C205 370 215 390 225 400L0 400Z',
    fillFront: 'M0 180C70 190 120 260 155 340C170 375 185 392 195 400L0 400Z',
    strokes: [
      { d: 'M0 20C90 70 150 200 190 320C205 365 225 390 250 400', width: 1.2 },
      { d: 'M0 160C75 168 140 240 180 330C192 360 205 385 215 400', width: 1 },
    ],
    pos: 'left-0 bottom-0',
    size: { width: 220, height: 320 },
  },
  right: {
    viewBox: '0 0 260 500',
    fillBack: 'M260 0C200 80 230 200 180 300C150 360 90 430 60 500L260 500Z',
    fillFront: 'M260 120C230 220 240 300 200 370C175 420 140 470 120 500L260 500Z',
    strokes: [{ d: 'M250 60C190 200 220 300 160 380C130 420 90 470 70 500', width: 1.2 }],
    pos: 'right-0 bottom-0',
    size: { width: 190, height: 360 },
  },
}

/** The flowing corner curve used in page heroes. */
export function BrandCurve({ side = 'left', tone = 'onLight' }: { side?: 'left' | 'right'; tone?: Tone }) {
  const p = CURVES[side]
  const navy = tone === 'onNavy'
  return (
    <svg
      {...p.size}
      viewBox={p.viewBox}
      className={`pointer-events-none absolute ${p.pos} hidden sm:block`}
      aria-hidden="true"
    >
      <path d={p.fillBack} fill={navy ? '#9BB3D3' : '#C5D7EC'} opacity={navy ? 0.18 : 1} />
      <path d={p.fillFront} fill="#9BB3D3" opacity={navy ? 0.32 : 1} />
      {p.strokes.map((s) => (
        <path
          key={s.d}
          d={s.d}
          fill="none"
          stroke={navy ? '#F3F8FB' : '#3F5478'}
          strokeOpacity={navy ? 0.5 : 1}
          strokeWidth={s.width}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}

/** Piped-icing scallop edge, or the ripple curve as a thin divider ('wave', used above the footer). */
export function BrandPiping({ tone = 'onLight', shape = 'scallop' }: { tone?: Tone; shape?: 'scallop' | 'wave' }) {
  const { stroke, opacity } = line(tone)
  const id = shape === 'wave' ? 'bs-piping-wave' : 'bs-piping'
  return (
    <svg aria-hidden="true" className="h-6 w-full">
      <defs>
        <pattern id={id} width={shape === 'wave' ? 80 : 48} height="24" patternUnits="userSpaceOnUse">
          <path
            d={shape === 'wave' ? 'M0 12C20 2 20 2 40 12S60 22 80 12' : 'M0 24A12 12 0 0 1 24 24A12 12 0 0 1 48 24'}
            fill="none"
            stroke={stroke}
            strokeOpacity={opacity}
            strokeWidth="1.2"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/** Ripple background for navy bands. */
export function BrandRipple({ tone = 'onNavy', id = 'bs-ripple' }: { tone?: Tone; id?: string }) {
  const { stroke, opacity } = line(tone)
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <pattern id={id} width="80" height="20" patternUnits="userSpaceOnUse">
          <path d="M0 10C20 0 20 0 40 10S60 20 80 10" fill="none" stroke={stroke} strokeOpacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/** Short slate rule between sections (the main site's SectionSeam, without the draw-in animation). */
export function SectionSeam() {
  return <div aria-hidden="true" className="mx-auto h-px w-32 bg-slate" />
}
