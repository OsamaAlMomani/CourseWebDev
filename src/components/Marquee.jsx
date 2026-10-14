import { books } from '../data/books'
import { cover } from '../lib/asset'

// the list is doubled so the loop (it slides left by exactly half) has no visible jump
const loop = [...books, ...books]

export default function Marquee() {
  return (
    <div
      aria-hidden="true"
      className="group overflow-hidden bg-ink-soft py-8 [-webkit-mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)] [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)] motion-reduce:overflow-x-auto"
    >
      <div className="flex w-max animate-marquee-slow group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {loop.map((book, i) => (
          <img
            key={i}
            src={cover(book.id)}
            alt=""
            width="200"
            height="270"
            loading="lazy"
            decoding="async"
            className="mr-6 h-auto w-[clamp(130px,32vw,230px)] shrink-0 rounded-xl shadow-[0_14px_30px_rgba(0,0,0,0.45)]"
          />
        ))}
      </div>
    </div>
  )
}
