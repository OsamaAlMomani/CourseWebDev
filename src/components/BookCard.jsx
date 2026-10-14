import { useState } from 'react'
import { formatPrice, orderLink } from '../data/books'
import { cover } from '../lib/asset'
import Stepper from './Stepper'

export default function BookCard({ book, theme }) {
  // every card gets its own copy of this state, so changing one card never touches the others
  const [copies, setCopies] = useState(1)

  return (
    <article
      className={`flex min-w-0 shrink-0 basis-[min(80vw,300px)] snap-start flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-2 min-[360px]:basis-[min(76vw,300px)] sm:basis-auto ${theme.card}`}
    >
      <img
        src={cover(book.id)}
        alt={`Cover of ${book.title}`}
        width="200"
        height="270"
        loading="lazy"
        decoding="async"
        className="h-auto w-full"
      />
      <div className="flex flex-1 flex-col gap-1 p-5">
        <h3 className={`text-xl leading-[1.1] md:text-2xl ${theme.cardTitle}`}>
          {book.title}
          {book.isNew && (
            <span className={`ml-1.5 inline-block rounded-full px-2.5 py-0.5 align-middle font-sans text-xs font-bold ${theme.badge}`}>
              New
            </span>
          )}
        </h3>
        <p className={theme.cardMeta}>
          {book.author} · {book.detail}
        </p>
        <p className={`mt-1 ${theme.cardBlurb}`}>{book.blurb}</p>

        <div className="mt-auto flex flex-col gap-3 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`text-3xl font-extrabold ${theme.cardPrice}`}>{formatPrice(book.price)}</span>
            <Stepper value={copies} onChange={setCopies} label={book.title} className={theme.stepper} />
          </div>
          <a
            href={orderLink(book.title, copies)}
            className={`inline-flex min-h-12 items-center justify-center px-5 text-lg font-bold transition active:scale-[0.97] ${theme.order}`}
          >
            {copies > 1 ? `Order x${copies}` : 'Order'}
          </a>
        </div>
      </div>
    </article>
  )
}
