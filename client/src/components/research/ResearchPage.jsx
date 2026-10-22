import { useCallback, useEffect, useRef, useState } from 'react'
import useResearchParams, { LEVELS, hrefFor } from '../../lib/useResearchParams'
import { fetchBooks, fetchNews, fetchPapers } from '../../lib/researchApi'
import Modal, { WindowBar } from './Modal'
import SearchModal from './SearchModal'
import OrderModal from './OrderModal'
import { BookCard, LatestRow, NewsCard, NewsHero, PaperCard } from './cards'
import { NewsImage, formatDate } from './bits'

const BTN = 'rb-press min-h-11 border-2 border-ink px-4 font-mono text-sm font-bold tracking-wide uppercase shadow-[0_10px_30px_rgba(18,38,63,0.10)]'

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
function Window({ id, title, kicker, action, children }) {
  return (
    <section aria-labelledby={`${id}-h`} className="scroll-mt-32 border-2 border-ink bg-rb-paper shadow-[0_10px_30px_rgba(18,38,63,0.10)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-rb-sky px-3 py-2 text-ink">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex gap-1.5">
            <span className="size-3 bg-rb-coral" />
            <span className="size-3 bg-rb-rose" />
            <span className="size-3 bg-rb-mint" />
          </span>
          <h2 id={`${id}-h`} className="font-mono text-sm font-medium tracking-widest uppercase">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="p-4 md:p-6">
        {kicker && <p className="mb-5 max-w-[70ch] font-display text-2xl leading-tight font-extrabold md:text-3xl">{kicker}</p>}
        {children}
      </div>
    </section>
  )
}

const SeeAll = ({ href, children }) => (
  <a href={href} className="inline-flex min-h-11 items-center bg-rb-rose px-3 font-mono text-sm font-bold text-ink uppercase hover:bg-white">
    {children} →
  </a>
)

function Loading({ rows = 3 }) {
  return (
    <div role="status" aria-label="Loading" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-72 border-2 border-ink bg-rb-sky motion-safe:animate-pulse" />
      ))}
    </div>
  )
}

function Problem({ children, onRetry }) {
  return (
    <div role="alert" className="grid justify-items-start gap-3 border-2 border-ink bg-rb-coral p-5 font-bold text-ink">
      <p>{children}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${BTN} bg-white`}>
          Try again
        </button>
      )}
    </div>
  )
}

function Empty({ children, resetHref }) {
  return (
    <div className="grid justify-items-start gap-3 border-2 border-dashed border-ink p-6">
      <p className="font-display text-2xl font-extrabold">{children}</p>
      {resetHref && <SeeAll href={resetHref}>Show all levels</SeeAll>}
    </div>
  )
}

// ---------------------------------------------------------------- article reader
function ArticleModal({ article, onClose }) {
  return (
    <Modal label={article.title} onClose={onClose} className="md:max-w-3xl">
      <WindowBar title={article.category} onClose={onClose} />
      <article className="grid gap-4 pb-8">
        <NewsImage image={article.image} alt={article.hero_image_alt} eager sizes="(min-width: 768px) 48rem, 100vw" className="border-b-2" />
        <div className="grid gap-4 px-5 md:px-8">
          <h2 className="font-display text-4xl leading-[0.95] font-extrabold tracking-tight text-balance md:text-5xl">{article.title}</h2>
          <p className="font-mono text-sm">
            By {article.authors.join(', ')} · <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
          </p>
          <p className="text-xl leading-snug font-bold">{article.summary}</p>
          {article.source_url && (
            <a href={article.source_url} target="_blank" rel="noopener noreferrer" className={`${BTN} inline-flex w-fit items-center bg-rb-blue text-white`}>
              Read the full story at {article.source_name} ↗<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          {article.body.split('\n\n').map((para, i) => (
            <p key={i} className="max-w-[65ch] text-lg leading-relaxed">
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
  const showNews = section === '' || section === 'news'
  const showPapers = section === '' || section === 'research'
  const showBooks = section === '' || section === 'books'

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

  return (
    <div className="rb bg-rb-paper font-body text-rb-ink">
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      {/* ============================ masthead */}
      <header className="border-b-2 border-ink">
        <div className="mx-auto max-w-[1400px] px-[var(--gutter)]">
          <div className="flex flex-wrap items-center justify-between gap-x-6 border-b-2 border-ink py-2 font-mono text-xs font-bold tracking-widest uppercase">
            <span>{today}</span>
            <span>Science news · Research papers · Books</span>
          </div>
          <div className="grid items-end gap-4 py-6 md:grid-cols-[1fr_auto] md:py-8">
            <h1 className="font-display text-[clamp(3rem,11.5vw,9.5rem)] leading-[0.9] font-extrabold tracking-[-0.04em]">
              Research <span className="text-rb-blue">&amp;</span> Book
            </h1>
            <p className="max-w-[28ch] border-l-4 border-rb-coral pl-4 font-display text-lg leading-tight font-extrabold md:text-xl">Today’s science, the papers behind it, and the books to read next. Pick your level.</p>
          </div>

          {/* search + order */}
          <div className="grid gap-3 pb-5 sm:grid-cols-[1fr_auto]">
            <button type="button" onClick={openSearch} aria-haspopup="dialog" className="rb-press flex min-h-14 items-center justify-between gap-3 border-2 border-ink bg-white px-4 text-left shadow-[0_10px_30px_rgba(18,38,63,0.10)]">
              <span className="font-display text-lg font-bold md:text-xl">
                <span aria-hidden="true">⌕ </span>Search news, papers and books…
              </span>
              <kbd aria-hidden="true" className="hidden border-2 border-ink bg-rb-paper px-2 font-mono text-sm font-bold sm:block">
                /
              </kbd>
              <span className="sr-only">(press slash from anywhere on the page)</span>
            </button>
            <button type="button" onClick={() => { setOrderSearch(''); setOrderOpen(true) }} aria-haspopup="dialog" className={`${BTN} min-h-14 bg-rb-rose text-base`}>
              Order books{cartCount > 0 && <span className="ml-2 bg-ink px-2 py-0.5 text-white">{cartCount}<span className="sr-only"> in your order</span></span>}
            </button>
          </div>
        </div>
      </header>

      {/* ============================ section tabs + level filter */}
      <div className="sticky top-[calc(64px_+_env(safe-area-inset-top,0px))] z-30 border-b-2 border-ink bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-x-6 px-[var(--gutter)] md:flex-row md:items-center md:justify-between md:px-[var(--gutter)]">
          <nav aria-label="Sections" className="-mx-[var(--gutter)] flex overflow-x-auto border-l-2 border-ink md:mx-0">
            {TABS.map(([value, label]) => (
              <a key={label} href={hrefFor({ section: value, level: value === 'news' ? '' : level })} aria-current={section === value ? 'page' : undefined} className="flex min-h-12 shrink-0 items-center border-r-2 border-ink px-4 font-mono text-sm font-bold tracking-wide whitespace-nowrap uppercase aria-[current=page]:bg-rb-blue aria-[current=page]:text-white hover:bg-rb-rose aria-[current=page]:hover:bg-rb-blue">
                {label}
              </a>
            ))}
          </nav>
          {section !== 'news' && (
            <nav aria-label="Difficulty level (papers and books)" className="-mx-[var(--gutter)] flex items-center gap-2 overflow-x-auto border-t-2 border-ink px-[var(--gutter)] py-2 md:mx-0 md:border-t-0 md:px-0">
              <span className="font-mono text-xs font-bold tracking-widest uppercase">Level</span>
              {[['', 'All'], ...LEVELS.map((l) => [l, l])].map(([value, label]) => (
                <a key={label} href={link({ level: value })} aria-current={level === value ? 'true' : undefined} className="flex min-h-11 items-center border-2 border-ink px-3 font-mono text-sm font-bold whitespace-nowrap uppercase aria-[current=true]:bg-rb-blue aria-[current=true]:text-white hover:bg-rb-rose aria-[current=true]:hover:bg-rb-blue">
                  {label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* ============================ content */}
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] gap-10 px-[var(--gutter)] py-8 md:gap-14 md:py-12">
        {/* ---- hero story + latest feed (front page only) */}
        {section === '' && (
          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
            {news.status === 'error' ? (
              <Problem onRetry={news.retry}>We couldn’t load the news.</Problem>
            ) : news.status === 'loading' && !hero ? (
              <div role="status" aria-label="Loading the top story" className="h-[32rem] border-2 border-ink bg-rb-sky motion-safe:animate-pulse" />
            ) : (
              hero && <NewsHero article={hero} onOpen={setArticle} />
            )}
            <Window id="latest" title="Science news & research papers">
              <div className="-m-4 md:-m-6">
                {restNews.slice(0, 4).map((a) => (
                  <LatestRow key={a.id} kind="News" title={a.title} date={a.published_at} onClick={() => setArticle(a)} />
                ))}
                {(papers.data ?? []).slice(0, 2).map((p) => (
                  <LatestRow key={p.id} kind="Paper" title={p.title} date={p.publication_date} href={link({ section: 'research' })} />
                ))}
                {!restNews.length && news.status === 'done' && <p className="p-4">Nothing new yet.</p>}
              </div>
            </Window>
          </div>
        )}

        {/* ---- science news */}
        {showNews && (
          <Window id="news" title="Science News" action={section === '' && <SeeAll href={hrefFor({ section: 'news' })}>All news</SeeAll>}>
            {news.status === 'error' ? (
              <Problem onRetry={news.retry}>We couldn’t load the news.</Problem>
            ) : news.status === 'loading' && !articles.length ? (
              <Loading />
            ) : (
              <>
                <ul className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {(section === '' ? restNews.slice(4, 10) : section === 'news' && hero ? [hero, ...restNews] : restNews).map((a, i) => (
                    <li key={a.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
                      <NewsCard article={a} onOpen={setArticle} lazy={i > 2} />
                    </li>
                  ))}
                </ul>
                {section === '' && restNews.length <= 4 && <p className="mt-4 font-mono text-sm">That’s everything for now. More stories soon.</p>}
              </>
            )}
          </Window>
        )}

        {/* ---- research papers */}
        {showPapers && (
          <Window id="papers" title="Research Papers" kicker={level ? `Papers for ${level} readers.` : 'The papers behind the headlines.'} action={section === '' && <SeeAll href={link({ section: 'research' })}>All papers</SeeAll>}>
            {papers.status === 'error' ? (
              <Problem onRetry={papers.retry}>We couldn’t load the papers.</Problem>
            ) : papers.status === 'loading' && !papers.data ? (
              <Loading rows={2} />
            ) : papers.data?.length === 0 ? (
              <Empty resetHref={link({ level: '' })}>No {level} papers yet.</Empty>
            ) : (
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
                {(section === '' ? papers.data.slice(0, 4) : papers.data ?? []).map((p) => (
                  <li key={p.id} className={`grid min-w-0 grid-cols-[minmax(0,1fr)] ${flashPaper === p.id ? '[&_article]:bg-rb-rose' : ''}`}>
                    <PaperCard paper={p} />
                  </li>
                ))}
              </ul>
            )}
          </Window>
        )}

        {/* ---- books */}
        {showBooks && (
          <Window id="books" title="Books" kicker={level ? `Books for ${level} readers.` : 'Books to read next, from first steps to proofs.'} action={section === '' && <SeeAll href={link({ section: 'books' })}>All books</SeeAll>}>
            {books.status === 'error' ? (
              <Problem onRetry={books.retry}>We couldn’t load the books.</Problem>
            ) : books.status === 'loading' && !books.data ? (
              <Loading />
            ) : books.data?.length === 0 ? (
              <Empty resetHref={link({ level: '' })}>No {level} books yet.</Empty>
            ) : (
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2 lg:grid-cols-3">
                {(section === '' ? books.data.slice(0, 6) : books.data ?? []).map((b) => (
                  <li key={b.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
                    <BookCard book={b} inCart={cart[b.id]?.quantity ?? 0} onAdd={addToCart} />
                  </li>
                ))}
              </ul>
            )}
          </Window>
        )}
      </div>

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
