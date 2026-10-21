// A page section drawn on a maths plane: graph-paper grid, an x axis along the bottom, a y axis down the left,
// and numbers on both axes that are real pixel distances from the origin (so a book that jumps 64px reaches the "64" mark).
// Content sits on top of the plane. Colours come from the skin, so it fits every shelf.
// The unit lines are CSS gradients (see .math-plane in index.css); this file only adds the numbers and axis names.

// where the axes cross, measured from the bottom-left corner (px)
export const PLANE_ORIGIN = { x: 44, y: 36 }

export default function MathPlane({ as: Tag = 'div', unit = 24, major = 4, xLabel = 'x', yLabel = 'y', className = '', children, ...props }) {
  const step = unit * major // distance between numbered lines, px
  const style = {
    '--u': `${unit}px`,
    '--M': `${step}px`,
    '--ox': `${PLANE_ORIGIN.x}px`,
    '--oy': `${PLANE_ORIGIN.y}px`,
  }
  const xs = Array.from({ length: Math.ceil(1600 / step) }, (_, i) => i + 1)
  const ys = Array.from({ length: Math.ceil(2400 / step) }, (_, i) => i + 1)
  const tick = 'absolute font-mono text-[11px] leading-4 tabular-nums text-skin-muted'

  return (
    <Tag className={`math-plane relative isolate overflow-hidden ${className}`} style={style} {...props}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none">
        <span className="math-plane-axis-x" />
        <span className="math-plane-axis-y" />
        <span className={`${tick} -translate-x-full`} style={{ left: 'calc(var(--ox) - 6px)', bottom: 'calc(var(--oy) - 18px)' }}>0</span>
        {xs.map((i) => (
          <span key={`x${i}`} className={`${tick} -translate-x-1/2`} style={{ left: `calc(var(--ox) + ${i * step}px)`, bottom: 'calc(var(--oy) - 20px)' }}>
            {i * step}
          </span>
        ))}
        {ys.map((i) => (
          <span key={`y${i}`} className={`${tick} text-right`} style={{ left: 0, width: 'calc(var(--ox) - 8px)', bottom: `calc(var(--oy) + ${i * step - 8}px)` }}>
            {i * step}
          </span>
        ))}
        <span className={`${tick} font-bold italic`} style={{ right: 12, bottom: 'calc(var(--oy) + 6px)' }}>{xLabel}</span>
        <span className={`${tick} font-bold italic`} style={{ left: 'calc(var(--ox) + 8px)', top: 8 }}>{yLabel}</span>
      </div>
      {children}
    </Tag>
  )
}
