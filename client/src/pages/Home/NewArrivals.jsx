import { useCatalog } from '../../context/CatalogContext'
import { cover } from '../../lib/asset'
import { formatPrice } from '../../lib/format'
import useDragRail from '../../lib/useDragRail'
import Container from '../../shared/Container'

// "New arrivals": the sideways shelf from the INKWELL page. A vertical title on the left, a row of books on the
// right that you drag, swipe, scroll with the wheel / keyboard, or step with the two arrows.
// The books are the newest in the catalog (flagged isNew); if there are few, it is topped up with other books.
// Styles: pages/Home/NewArrivals.css. Drag engine: lib/useDragRail.js.
const SHOWN = 8

export default function NewArrivals() {
  const { books } = useCatalog()
  const { rail, prev, next } = useDragRail()

  const fresh = books.filter((b) => b.isNew)
  const list = [...fresh, ...books.filter((b) => !b.isNew)].slice(0, SHOWN)
  if (list.length < 3) return null

  return (
    <section aria-labelledby="arrivals-h" className="py-16 md:py-28">
      <Container className="side-shelf">
        <h2 id="arrivals-h" className="sideways-title ink-reveal">
          New <em>arrivals</em>
        </h2>

        <div className="rail-col ink-reveal">
          <div className="rail-head">
            <div>
              <p className="t-eyebrow mb-3">Pull the shelf sideways</p>
              <p className="t-lede">
                {list.length} fresh spines. Drag, swipe, or use the arrows.
              </p>
            </div>
            <div className="rail-nav">
              <button ref={prev} type="button" className="rail-btn" aria-label="Scroll shelf left">←</button>
              <button ref={next} type="button" className="rail-btn" aria-label="Scroll shelf right">→</button>
            </div>
          </div>

          <div ref={rail} className="rail" tabIndex={0} role="region" aria-label="New arrivals, a horizontally scrollable shelf">
            {list.map((b) => (
              <a key={b.id} href={`#/${b.group}`} className="rail-card skin-card" draggable={false}>
                <img src={cover(b.id)} alt="" width="200" height="270" loading="lazy" decoding="async" draggable={false} />
                <h3>{b.title}</h3>
                <p>{b.author}</p>
                <span className="price">{formatPrice(b.price)}</span>
              </a>
            ))}
          </div>

          <p className="rail-hint" aria-hidden="true">
            <span>Drag</span>
            <i>→</i>
            <span>to browse</span>
          </p>
        </div>
      </Container>
    </section>
  )
}
