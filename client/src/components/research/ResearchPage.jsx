import { useCallback, useEffect, useRef, useState } from 'react'
import useResearchParams, { LEVELS, hrefFor } from '../../lib/useResearchParams'
import { fetchBooks, fetchNews, fetchPapers } from '../../lib/researchApi'
import { asset } from '../../lib/asset'
import Modal, { DialogBar } from './Modal'
import SearchModal from './SearchModal'
import OrderModal from './OrderModal'
import { BookCard, LatestRow, NewsCard, NewsHero, PaperCard } from './cards'
import { NewsImage, formatDate } from './bits'
import PageHero, { fanOf } from '../PageHero'
import Container from '../Container'

// The floating covers in the hero (they live in public/assets/research/covers)
const heroCovers = ['data-atlas', 'learning-machines', 'statistics-without-fear', 'causal-notebook', 'quantum-questions']

// ---------------------------------------------------------------- tiny data hook
// Loads something from the server, cancels the request if the page changes first, and exposes loading / error / retry.
function useLoad(load, deps, enabled = true) {
  const [state, setState] = useState({ status: 'loading', data: null })
  const [tries, setTries] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    setState((s) => ({ ...s, status: 'loading' }))
    load(controller.signal)
      .then((data) => setState({ status: 'done', data }))
      .catch((err) => err.name !== 'AbortError' && setState({ status: 'error', data: null }))
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, tries])
  return { ...state, retry: () => setTries((t) => t + 1) }
}

// ---------------------------------------------------------------- layout pieces
// One block of the page. Same spacing, same heading size and same intro text as the sections on every other page.
// `tone` is the background; on the front page the blocks alternate so they read as separate bands.
function Block({ id, title, kicker, action, tone = 'bg-paper', children }) {
  return (
    <section aria-labelledby={`${id}-h`} className={`scroll-mt-32 py-16 md:py-24 ${tone}`}>
      <Container>
        <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
          <div>
            <h2 id={`${id}-h`} className="t-section">
              {title}
            </h2>
            {kicker && <p className="t-lede mt-3">{kicker}</p>}
          </div>
          {action}
        </div>
        {children}
      </Container>
    </section>
  )
}

const SeeAll = ({ href, children }) => (
  <a href={href} className="btn skin-btn skin-btn-soft">
    {children} →
  </a>
)

function Loading({ rows = 3 }) {
  return (
    <div role="status" aria-label="Loading" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skin-card h-72 bg-sun/60 motion-safe:animate-pulse" />
      ))}
    </div>
  )
}

function Problem({ children, onRetry }) {
  return (
    <div role="alert" className="grid justify-items-start gap-3 rounded-3xl bg-coral/50 p-5 font-bold text-ink">
      <p>{children}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn skin-btn">
          Try again
        </button>
      )}
    </div>
  )
}

function Empty({ children, resetHref }) {
  return (
    <div className="grid justify-items-start gap-3 rounded-3xl border-2 border-dashed border-line p-6">
      <p className="t-title">{children}</p>
      {resetHref && <SeeAll href={resetHref}>Show all levels</SeeAll>}
    </div>
  )
}

// ---------------------------------------------------------------- article reader
function ArticleModal({ article, onClose }) {
  return (
    <Modal label={article.title} onClose={onClose} className="md:max-w-3xl">
      <DialogBar title={article.category} onClose={onClose} />
      <article className="grid gap-4 pb-8">
        <NewsImage image={article.image} alt={article.hero_image_alt} eager sizes="(min-width: 768px) 48rem, 100vw" />
        <div className="grid gap-4 px-5 md:px-8">
          <h2 className="t-title md:text-4xl">{article.title}</h2>
          <p className="t-meta">
            By {article.authors.join(', ')} · <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
          </p>
          <p className="t-lede max-w-none font-medium text-ink">{article.summary}</p>
          {article.source_url && (
            <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="btn skin-btn w-fit">
              Read the full story at {article.source_name} ↗<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          {article.body.split('\n\n').map((para, i) => (
            <p key={i} className="t-body max-w-[65ch] text-ink">
              {para}
            </p>
          ))}
        </div>
      </article>
    </Modal>
  )
}

// ---------------------------------------------------------------- the page
const TABS = [
  ['', 'Front page'],
  ['news', 'Science News'],
  ['research', 'Research Papers'],
  ['books', 'Books'],
]

export default function ResearchPage() {
  const [params, update] = useResearchParams()
  const { section, level } = params
  const front = section === ''
  const showNews = front || section === 'news'
  const showPapers = front || section === 'research'
  const showBooks = front || section === 'books'

  // The level filter is sent to the server: the database returns only matching papers / books.
  const news = useLoad((signal) => fetchNews(signal), [])
  const papers = useLoad((signal) => fetchPapers(level, signal), [level], showPapers)
  const books = useLoad((signal) => fetchBooks({ level }, signal), [level], showBooks)

  // dialogs
  const [searchOpen, setSearchOpen] = useState(() => params.q !== '')
  const [orderOpen, setOrderOpen] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [article, setArticle] = useState(null)
  const [cart, setCart] = useState({})
  const [announce, setAnnounce] = useState('')
  const [flashPaper, setFlashPaper] = useState(null)
  const searchQuery = useRef(params.q)
  const cartCount = Object.values(cart).reduce((n, l) => n + l.quantity, 0)

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = () => {
    setSearchOpen(false)
    update({ q: '' }, { replace: true })
  }

  // "/" opens the search from anywhere on the page (like on most news sites), unless you are typing
  useEffect(() => {
    const onKey = (e) => {
      const el = e.target
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      if (el.closest?.('input, textarea, select, [contenteditable], [role=dialog]')) return
      e.preventDefault()
      openSearch()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openSearch])

  const addToCart = (book) => {
    setCart((c) => ({ ...c, [book.id]: { book, quantity: Math.min((c[book.id]?.quantity ?? 0) + 1, 10, book.stock_quantity) } }))
    setAnnounce(`${book.title} added to your order.`)
  }

  // When someone opens a search result: news opens the reader, a book opens the order window, a paper scrolls into view.
  const selectResult = (r, q) => {
    searchQuery.current = q
    setSearchOpen(false)
    update({ q: '' }, { replace: true })
    if (r.type === 'news') {
      const found = news.data?.find((a) => a.id === r.id)
      if (found) setArticle(found)
      else update({ section: 'news' })
    } else if (r.type === 'book') {
      setOrderSearch(r.title)
      setOrderOpen(true)
    } else {
      setFlashPaper(r.id)
      update({ section: 'research', level: level && level !== r.level ? '' : level })
    }
  }

  // after a paper was picked: wait until it is on the page, then scroll to it and move keyboard focus there
  useEffect(() => {
    if (!flashPaper || papers.status !== 'done') return
    const el = document.getElementById(`paper-${flashPaper}`)
    if (!el) return
    el.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    el.focus({ preventScroll: true })
    const t = setTimeout(() => setFlashPaper(null), 2500)
    return () => clearTimeout(t)
  }, [flashPaper, papers.status, papers.data])

  const link = (changes) => hrefFor({ section, level, ...changes })
  const articles = news.data ?? []
  const [hero, ...restNews] = articles.some((a) => a.is_featured) ? [articles.find((a) => a.is_featured), ...articles.filter((a) => !a.is_featured)] : articles
  const today = new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(new Date())

  // background bands: alternate on the front page, plain on a single-section page
  const band = (n) => (front ? ['bg-paper', 'bg-white', 'bg-[#e3f2ff]', 'bg-paper'][n] : 'bg-paper')

  return (
    <div className="font-body text-ink">
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      {/* ============================ hero: the same PageHero as the home page and every shelf */}
      <PageHero
        kicker={today}
        title={<>Research <span className="text-blue">&amp;</span> Book</>}
        intro="Today’s science, the papers behind it, and the books to read next. Pick your level."
        covers={fanOf(heroCovers.map((id) => asset(`research/covers/${id}.svg`)), 95)}
        actions={
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={openSearch} aria-haspopup="dialog" className="btn btn-lg skin-btn">
              <span aria-hidden="true">⌕</span> Search news, papers and books
              <kbd aria-hidden="true" className="ml-1 hidden rounded-md bg-white/20 px-2 text-sm font-bold sm:block">/</kbd>
              <span className="sr-only">(press slash from anywhere on the page)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderSearch('')
                setOrderOpen(true)
              }}
              aria-haspopup="dialog"
              className="btn btn-lg skin-btn skin-btn-pop"
            >
              Order books
              {cartCount > 0 && (
                <span className="rounded-full bg-ink px-2 text-sm text-white">
                  {cartCount}
                  <span className="sr-only"> in your order</span>
                </span>
              )}
            </button>
          </div>
        }
      />

      {/* ============================ section tabs + level filter (pills, same as every filter on the shelves) */}
      <div className="top-[calc(var(--header-h)_+_env(safe-area-inset-top,0px))] z-30 border-b border-line bg-white/90 backdrop-blur md:sticky">
        <Container className="flex flex-col gap-x-6 py-2 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Sections" className="-mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] py-1 md:mx-0 md:px-0">
            {TABS.map(([value, label]) => (
              <a key={label} href={hrefFor({ section: value, level: value === 'news' ? '' : level })} aria-current={section === value ? 'page' : undefined} className="chip">
                {label}
              </a>
            ))}
          </nav>
          {section !== 'news' && (
            <nav aria-label="Difficulty level (papers and books)" className="-mx-[var(--gutter)] flex items-center gap-2 overflow-x-auto px-[var(--gutter)] py-1 md:mx-0 md:px-0">
              <span className="t-meta font-bold text-ink">Level</span>
              {[['', 'All'], ...LEVELS.map((l) => [l, l])].map(([value, label]) => (
                <a key={label} href={link({ level: value })} aria-current={level === value ? 'true' : undefined} className="chip capitalize">
                  {label}
                </a>
              ))}
            </nav>
          )}
        </Container>
      </div>

      {/* ============================ content */}
      {/* ---- hero story + latest feed (front page only) */}
      {front && (
        <Block id="top-stories" title="Top stories" kicker="What is happening in science today." tone={band(0)}>
          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
            {news.status === 'error' ? (
              <Problem onRetry={news.retry}>We couldn’t load the news.</Problem>
            ) : news.status === 'loading' && !hero ? (
              <div role="status" aria-label="Loading the top story" className="skin-card h-[32rem] bg-sun/60 motion-safe:animate-pulse" />
            ) : (
              hero && <NewsHero article={hero} onOpen={setArticle} />
            )}
            <div className="skin-card overflow-hidden">
              <h3 className="t-title border-b border-line px-5 py-4">Latest news and papers</h3>
              {restNews.slice(0, 4).map((a) => (
                <LatestRow key={a.id} kind="News" title={a.title} date={a.published_at} onClick={() => setArticle(a)} />
              ))}
              {(papers.data ?? []).slice(0, 2).map((p) => (
                <LatestRow key={p.id} kind="Paper" title={p.title} date={p.publication_date} href={link({ section: 'research' })} />
              ))}
              {!restNews.length && news.status === 'done' && <p className="t-body p-5">Nothing new yet.</p>}
            </div>
          </div>
        </Block>
      )}

      {/* ---- science news */}
      {showNews && (
        <Block id="news" title="Science News" tone={band(1)} action={front && <SeeAll href={hrefFor({ section: 'news' })}>All news</SeeAll>}>
          {news.status === 'error' ? (
            <Problem onRetry={news.retry}>We couldn’t load the news.</Problem>
          ) : news.status === 'loading' && !articles.length ? (
            <Loading />
          ) : (
            <>
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2 lg:grid-cols-3">
                {(front ? restNews.slice(4, 10) : section === 'news' && hero ? [hero, ...restNews] : restNews).map((a, i) => (
                  <li key={a.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
                    <NewsCard article={a} onOpen={setArticle} lazy={i > 2} />
                  </li>
                ))}
              </ul>
              {front && restNews.length <= 4 && <p className="t-meta mt-4">That’s everything for now. More stories soon.</p>}
            </>
          )}
        </Block>
      )}

      {/* ---- research papers */}
      {showPapers && (
        <Block id="papers" title="Research Papers" kicker={level ? `Papers for ${level} readers.` : 'The papers behind the headlines.'} tone={band(2)} action={front && <SeeAll href={link({ section: 'research' })}>All papers</SeeAll>}>
          {papers.status === 'error' ? (
            <Problem onRetry={papers.retry}>We couldn’t load the papers.</Problem>
          ) : papers.status === 'loading' && !papers.data ? (
            <Loading rows={2} />
          ) : papers.data?.length === 0 ? (
            <Empty resetHref={link({ level: '' })}>No {level} papers yet.</Empty>
          ) : (
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
              {(front ? papers.data.slice(0, 4) : papers.data ?? []).map((p) => (
                <li key={p.id} className={`grid min-w-0 grid-cols-[minmax(0,1fr)] ${flashPaper === p.id ? '[&_article]:bg-sun' : ''}`}>
                  <PaperCard paper={p} />
                </li>
              ))}
            </ul>
          )}
        </Block>
      )}

      {/* ---- books */}
      {showBooks && (
        <Block id="books" title="Books" kicker={level ? `Books for ${level} readers.` : 'Books to read next, from first steps to proofs.'} tone={band(3)} action={front && <SeeAll href={link({ section: 'books' })}>All books</SeeAll>}>
          {books.status === 'error' ? (
            <Problem onRetry={books.retry}>We couldn’t load the books.</Problem>
          ) : books.status === 'loading' && !books.data ? (
            <Loading />
          ) : books.data?.length === 0 ? (
            <Empty resetHref={link({ level: '' })}>No {level} books yet.</Empty>
          ) : (
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(front ? books.data.slice(0, 6) : books.data ?? []).map((b) => (
                <li key={b.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
                  <BookCard book={b} inCart={cart[b.id]?.quantity ?? 0} onAdd={addToCart} />
                </li>
              ))}
            </ul>
          )}
        </Block>
      )}

      {/* ============================ dialogs */}
      {searchOpen && (
        <SearchModal
          initialQuery={params.q}
          initialType={params.type}
          initialLevel={level}
          onQueryChange={(q) => {
            searchQuery.current = q
            update({ q }, { replace: true })
          }}
          onClose={closeSearch}
          onSelect={selectResult}
        />
      )}
      {orderOpen && <OrderModal cart={cart} setCart={setCart} initialSearch={orderSearch} onClose={() => { setOrderOpen(false); books.retry() }} />}
      {article && <ArticleModal article={article} onClose={() => setArticle(null)} />}
    </div>
  )
}
