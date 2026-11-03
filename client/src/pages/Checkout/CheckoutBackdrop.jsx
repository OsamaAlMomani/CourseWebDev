import { useEffect, useState } from 'react'
import './Checkout.css'

// The living background of the checkout. It never holds information, it only sets the mood of the step you are in:
//   books     cool blue and lavender      delivery  fresh mint and sky      pay      warm gold and coral
//   wait      gold while Stripe confirms  paid      mint, gold and falling confetti
//   problem   soft coral (cancelled / failed / refunded)
// All the movement is in Checkout.css and only uses transform and opacity.

// [left %, top %, size px, delay s]
const SPARKS = [[8, 12, 6, 0], [22, 70, 5, 0.8], [35, 28, 7, 1.6], [48, 86, 5, 0.4], [60, 18, 6, 2.1], [72, 60, 8, 1.2], [84, 30, 5, 0.2], [92, 78, 6, 1.8], [15, 45, 4, 2.6], [66, 92, 5, 0.6]]

// deterministic pieces (no Math.random, so the page looks the same on every render)
const PIECES = Array.from({ length: 22 }, (_, i) => ({
  x: `${(i * 47) % 100}%`,
  s: `${7 + (i % 3) * 3}px`,
  d: `${((i * 0.43) % 4).toFixed(2)}s`,
  t: `${6 + ((i * 7) % 5)}s`,
  dx: `${((i * 37) % 50) - 25}vw`,
  r: `${240 + ((i * 61) % 360)}deg`,
  piece: ['var(--color-mint)', 'var(--color-sun)', 'var(--color-coral)', 'var(--color-lavender)', 'var(--color-blue)'][i % 5],
}))

export default function CheckoutBackdrop({ scene }) {
  // A scene is built the first time it is needed and then kept. It is added switched off, and one frame
  // later switched on, so the browser has something to fade FROM (otherwise it would just pop in).
  const [seen, setSeen] = useState(() => [scene])
  const [on, setOn] = useState(scene)
  useEffect(() => {
    setSeen((list) => (list.includes(scene) ? list : [...list, scene]))
    let second
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setOn(scene))
    })
    return () => {
      window.cancelAnimationFrame(first)
      window.cancelAnimationFrame(second)
    }
  }, [scene])

  return (
    <div className="co-stage" aria-hidden="true">
      {seen.map((name) => (
        <div key={name} className="co-scene" data-scene={name} data-on={name === on}>
          <div className="co-wash" />
          <div className="co-rays" />
          <div className="co-grid math-plane" />
          <div className="co-blob co-blob-a" />
          <div className="co-blob co-blob-b" />
          <div className="co-blob co-blob-c" />
          {SPARKS.map(([left, top, size, delay]) => (
            <span key={`${left}-${top}`} className="co-spark" style={{ left: `${left}%`, top: `${top}%`, '--s': `${size}px`, '--d': `${delay}s` }} />
          ))}
          {name === 'paid' &&
            PIECES.map((p, i) => (
              <span key={i} className="co-confetti" style={{ '--x': p.x, '--s': p.s, '--d': p.d, '--t': p.t, '--dx': p.dx, '--r': p.r, '--piece': p.piece }} />
            ))}
        </div>
      ))}
    </div>
  )
}
