import { useCatalog } from '../context/CatalogContext'
import { themes } from '../data/themes'
import Container from './Container'

// at the bottom of every shelf page: easy way over to another shelf, or to the other half of the shop
export default function OtherShelves({ current }) {
  const { groups } = useCatalog()
  const here = groups.find((g) => g.id === current)
  const kidsWorld = here?.world === 'kids'
  // same half of the shop first (the Kids Corner has just one shelf, so nothing to list there)
  const siblings = groups.filter((g) => g.world === here?.world && g.id !== current)
  const kids = groups.find((g) => g.world === 'kids')

  return (
    <section className="bg-paper py-12 text-ink md:py-16">
      <Container>
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em] md:text-5xl">
          {kidsWorld ? 'Shopping for someone older?' : 'Shopping for someone else?'}
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {siblings.map((g) => (
            <a
              key={g.id}
              href={`#/${g.id}`}
              className={`inline-flex min-h-12 items-center rounded-full px-6 text-lg font-bold transition hover:-translate-y-0.5 ${themes[g.id].pill}`}
            >
              {g.title}
            </a>
          ))}
          {kidsWorld ? (
            <a href="#/" className="inline-flex min-h-12 items-center rounded-full border-[3px] border-ink px-6 text-lg font-bold">
              Go to the main shop →
            </a>
          ) : (
            kids && (
              <a href={`#/${kids.id}`} className="inline-flex min-h-12 items-center rounded-full bg-sun px-6 text-lg font-extrabold text-ink transition hover:-translate-y-0.5">
                🧸 Kids Corner
              </a>
            )
          )}
          {!kidsWorld && (
            <a href="#/" className="inline-flex min-h-12 items-center rounded-full border-[3px] border-ink px-6 text-lg font-bold">
              All shelves
            </a>
          )}
        </div>
      </Container>
    </section>
  )
}
