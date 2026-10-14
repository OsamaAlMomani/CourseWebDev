import { books, formatPrice, orderLink } from '../data/books'
import { cover } from '../lib/asset'
import Button from './Button'

// book of the month: we just look it up in the same books array
const book = books.find((b) => b.id === 'cartographer')

export default function FeatureBook() {
  return (
    <section aria-label="Book of the month" className="bg-paper py-16 md:py-28">
      <div className="reveal mx-auto grid w-[min(1180px,calc(100%_-_2*var(--gutter)))] grid-cols-[minmax(0,1fr)] items-center gap-8 rounded-[36px] bg-coral p-7 text-white md:grid-cols-[260px_1fr] md:gap-10 md:p-12 lg:grid-cols-[300px_1fr]">
        <img
          src={cover(book.id)}
          alt={`Cover of ${book.title}`}
          width="200"
          height="270"
          loading="lazy"
          decoding="async"
          className="mx-auto h-auto w-[min(240px,70%)] md:w-full animate-sway rounded-lg shadow-[0_18px_36px_rgba(0,0,0,0.3)] motion-reduce:animate-none"
        />
        <div>
          <span className="mb-4 inline-block rounded-full bg-ink px-4 py-1 text-base font-bold">
            Book of the month
          </span>
          <h2 className="font-display text-[clamp(1.6rem,7.5vw,4rem)] leading-[0.95] font-extrabold tracking-[-0.03em] md:text-[clamp(2rem,4.8vw,3.75rem)]">
            {book.title}
          </h2>
          <p className="mt-4 mb-6 max-w-[48ch] text-xl">
            {book.author}. {book.blurb}
          </p>
          <span className="mr-4 font-display text-4xl font-extrabold">{formatPrice(book.price)}</span>
          <Button large href={orderLink(book.title)}>Order</Button>
        </div>
      </div>
    </section>
  )
}
