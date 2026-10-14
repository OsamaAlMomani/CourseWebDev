import { groups } from '../data/books'
import { themes } from '../data/themes'
import Container from './Container'

// at the bottom of every page: easy way over to someone else's shelf
export default function OtherShelves({ current }) {
  return (
    <section className="bg-paper py-12 md:py-16">
      <Container>
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em] md:text-5xl">Shopping for someone else?</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {groups
            .filter((g) => g.id !== current)
            .map((g) => (
              <a
                key={g.id}
                href={`#/${g.id}`}
                className={`inline-flex min-h-12 items-center rounded-full px-6 text-lg font-bold transition hover:-translate-y-0.5 ${themes[g.id].pill}`}
              >
                {g.title}
              </a>
            ))}
          <a href="#/" className="inline-flex min-h-12 items-center rounded-full border-[3px] border-ink px-6 text-lg font-bold">
            All shelves
          </a>
        </div>
      </Container>
    </section>
  )
}
