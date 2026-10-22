import { useState } from 'react'
import { scientistQuotes } from '../data/quotes'

// Rows of scientists' quotes drifting across the hero, each row in its own direction and speed.
// Decoration only: aria-hidden, and it sits behind the text. The parent section must be `relative isolate overflow-hidden`.
// People who asked their device for less motion get still rows and no button.
const ROWS = [
  { dir: 'animate-marquee-slow', secs: 110, size: 'text-[clamp(1.6rem,3.2vw,3rem)]', tone: 'text-teal/25' },
  { dir: 'animate-marquee-rev', secs: 85, size: 'text-[clamp(1.3rem,2.4vw,2.2rem)]', tone: 'text-teal/15' },
  { dir: 'animate-marquee-slow', secs: 140, size: 'text-[clamp(1.8rem,3.8vw,3.6rem)]', tone: 'text-teal/20' },
  { dir: 'animate-marquee-rev', secs: 100, size: 'text-[clamp(1.3rem,2.4vw,2.2rem)]', tone: 'text-teal/15' },
]

// deal the quotes out to the rows, then double each row so the loop has no visible jump
const rows = ROWS.map((row, r) => {
  const mine = scientistQuotes.filter((_, i) => i % ROWS.length === r)
  return { ...row, items: [...mine, ...mine] }
})

export default function QuoteBackground({ buttonClass = 'bg-lab/70 text-teal' }) {
  const [paused, setPaused] = useState(false)
  const hold = paused ? '[animation-play-state:paused]' : ''

  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 flex flex-col justify-around overflow-hidden py-4 [-webkit-mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]"
      >
        {rows.map((row, r) => (
          <div
            key={r}
            className={`quote-row flex w-max whitespace-nowrap font-display italic motion-reduce:animate-none ${row.dir} ${row.size} ${row.tone} ${hold}`}
            style={{ '--secs': `${row.secs}s` }}
          >
            {row.items.map((q, i) => (
              <span key={i} className="mr-16 shrink-0">
                “{q.text}” <span className="font-mono text-[0.45em] tracking-widest uppercase not-italic">— {q.who}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        className={`absolute right-4 bottom-4 z-10 min-h-11 rounded-full px-4 text-sm font-bold backdrop-blur motion-reduce:hidden ${buttonClass}`}
      >
        {paused ? 'Play quotes' : 'Pause quotes'}
      </button>
    </>
  )
}
