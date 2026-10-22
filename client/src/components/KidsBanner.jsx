import { useCatalog } from '../context/CatalogContext'
import { cover } from '../lib/asset'
import Container from './Container'

// On the main shop's home page: the doorway to the Kids Corner, so parents can find it straight away.
export default function KidsBanner() {
  const { books, groups } = useCatalog()
  const kids = groups.find((g) => g.world === 'kids')
  if (!kids) return null
  const picks = books.filter((b) => b.group === kids.id).slice(0, 3)

  return (
    <section aria-label="Kids Corner" className="bg-paper pb-16 md:pb-28">
      <Container>
        <a
          href={`#/${kids.id}`}
          className="group relative isolate flex flex-col gap-8 overflow-hidden rounded-[32px] border border-line bg-gradient-to-br from-[#d6ecff] to-[#ffe3e0] p-6 font-display text-ink shadow-[0_10px_24px_rgba(18,38,63,0.12)] transition-transform duration-200 hover:-translate-y-1 md:flex-row md:items-center md:justify-between md:p-12 [background-image:radial-gradient(rgba(255,255,255,0.55)_2.5px,transparent_3px)] [background-size:34px_34px]"
        >
          <div className="max-w-[34ch]">
            <p className="mb-4 inline-block rounded-full bg-white px-4 py-1.5 text-base font-bold shadow-[0_10px_24px_rgba(18,38,63,0.12)]">🧸 New: the Kids Corner</p>
            <h2 className="text-[clamp(2.4rem,8vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.02em]">A whole shop just for kids</h2>
            <p className="mt-3 text-xl md:text-2xl">Picture books, bedtime stories, learning, adventures and colouring. Ages 3 to 10.</p>
            <span className="mt-6 inline-flex min-h-14 items-center rounded-full bg-coral px-8 text-lg font-bold text-ink shadow-[0_10px_24px_rgba(18,38,63,0.12)] transition group-hover:-translate-y-0.5">
              Enter the Kids Corner →
            </span>
          </div>
          <div aria-hidden="true" className="flex justify-center -space-x-6 md:justify-end">
            {picks.map((b, i) => (
              <img
                key={b.id}
                src={cover(b.id)}
                alt=""
                width="200"
                height="270"
                loading="lazy"
                className="kids-pick h-auto w-28 rounded-2xl border-4 border-white shadow-[0_14px_30px_rgba(18,38,63,0.20)] transition-transform duration-200 group-hover:-translate-y-2 sm:w-36 md:w-40"
                style={{ '--rot': `${(i - 1) * 7}deg` }}
              />
            ))}
          </div>
        </a>
      </Container>
    </section>
  )
}
