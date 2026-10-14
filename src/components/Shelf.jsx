import { useState } from 'react'
import { books, priceFilters } from '../data/books'
import BookCard from './BookCard'
import Container from './Container'
import Decor from './Decor'
import PriceFilter from './PriceFilter'

// The main grid of one reader group, with the price filter on top.
export default function Shelf({ group, theme }) {
  // the one piece of state for the filter: just the id of the chosen option
  const [priceId, setPriceId] = useState('any')

  // everything below is worked out from priceId on every render. no extra state needed
  const range = priceFilters.find((f) => f.id === priceId)
  const groupBooks = books.filter((b) => b.group === group.id)
  const visible = groupBooks.filter((b) => b.price >= range.min && b.price <= range.max)

  return (
    <section
      id="shelf"
      className={`relative isolate overflow-hidden py-16 md:py-28 ${theme.font} ${theme.shelfBg} ${theme.shelfPattern}`}
    >
      <Decor id={group.id} />
      <Container className="relative z-10">
        <header className="reveal mb-8 md:mb-10">
          <h2 className={`text-[clamp(3rem,13vw,7rem)] leading-[0.92] font-extrabold ${theme.shelfHeading}`}>
            {group.shelfTitle}
          </h2>
          <p className={`mt-3 max-w-[40ch] text-xl md:text-2xl ${theme.shelfNote}`}>{group.shelfNote}</p>
        </header>

        <PriceFilter selected={priceId} onChange={setPriceId} shown={visible.length} total={groupBooks.length} theme={theme} />

        {visible.length === 0 ? (
          <p className={`py-6 text-xl ${theme.shelfNote}`}>Nothing here in that price range.</p>
        ) : (
          // phones: one swipeable row that bleeds to the screen edge. sm and up: a normal grid
          <div className="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-px-[var(--gutter)] px-[var(--gutter)] pt-1 pb-6 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] sm:overflow-visible sm:px-0 md:gap-8 md:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] [&::-webkit-scrollbar]:hidden">
            {visible.map((book) => (
              <BookCard key={book.id} book={book} theme={theme} />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
