import { useCatalog } from '../context/CatalogContext'
import Container from './Container'

// Each section gets its own bright colour. They repeat if there are more sections than colours.
const colours = [
  'bg-sun text-ink',
  'bg-coral text-white',
  'bg-mint text-ink',
  'bg-[#7dd3fc] text-ink',
  'bg-[#ffb3d9] text-ink',
  'bg-[#c4b5fd] text-ink',
]

// The Kids Corner's own menu: one big tile per kind of book. Clicking one filters the shelf below.
export default function KidsCategories({ group, onPick }) {
  const { books } = useCatalog()
  return (
    <section aria-label="What are you looking for?" className="font-kids bg-white py-12 text-ink md:py-20">
      <Container>
        <h2 className="font-kids text-[clamp(2.2rem,8vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.02em]">What do you feel like?</h2>
        <p className="mt-3 mb-8 max-w-[40ch] text-xl text-muted md:text-2xl">Pick a corner. Everything for little readers is in here.</p>

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {group.categories.map((c, i) => {
            const count = books.filter((b) => b.group === group.id && b.category === c.id).length
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onPick(c.id)}
                  className={`flex min-h-36 w-full flex-col items-start justify-between gap-3 rounded-[28px] border-4 border-ink p-4 text-left shadow-[0_8px_0_#14122b] transition hover:-translate-y-1 hover:rotate-1 active:translate-y-1 active:shadow-[0_2px_0_#14122b] md:min-h-44 md:p-6 ${colours[i % colours.length]}`}
                >
                  <span aria-hidden="true" className="text-5xl md:text-6xl">{c.icon}</span>
                  <span>
                    <span className="block text-xl leading-tight font-bold md:text-2xl">{c.label}</span>
                    <span className="block text-base opacity-80">{count} {count === 1 ? 'book' : 'books'}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
