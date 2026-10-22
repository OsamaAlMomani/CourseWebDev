import { asset } from '../../lib/asset'
import { LevelBadge, NewsImage, formatDate, money, stockInfo } from './bits'

// Every card here is a normal .skin-card (same radius, border and shadow as the book cards on the shelves),
// every button is a .skin-btn, every title uses the .t-* scale.

// ------------------------------------------------------------------ news
export function NewsHero({ article, onOpen }) {
  return (
    <article className="skin-card overflow-hidden">
      <NewsImage image={article.image} alt={article.hero_image_alt} eager sizes="(min-width: 1024px) 58vw, 100vw" />
      <div className="grid gap-4 p-5 md:p-8">
        <p className="flex flex-wrap items-center gap-3 t-meta">
          <span className="badge bg-coral">Top story</span>
          <span className="badge bg-sun">{article.category}</span>
          <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
        </p>
        <h3 className="t-title md:text-4xl">
          <button type="button" onClick={() => onOpen(article)} className="text-left underline-offset-8 hover:underline">
            {article.title}
          </button>
        </h3>
        <p className="t-lede max-w-[60ch]">{article.summary}</p>
        <p className="t-meta">By {article.authors.join(', ')}</p>
        <button type="button" onClick={() => onOpen(article)} className="btn skin-btn w-fit">
          Read the story →
        </button>
      </div>
    </article>
  )
}

export function NewsCard({ article, onOpen, lazy = true }) {
  return (
    <article className={`skin-card card-lift flex flex-col overflow-hidden ${lazy ? 'rb-lazy' : ''}`}>
      <NewsImage image={article.image} alt={article.hero_image_alt} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 100vw" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 t-meta">
          <span className="badge bg-sun">{article.category}</span>
          <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
        </p>
        <h3 className="t-card-title">
          <button type="button" onClick={() => onOpen(article)} className="text-left underline-offset-4 hover:underline">
            {article.title}
          </button>
        </h3>
        <p className="t-body">{article.summary}</p>
        <p className="t-meta mt-auto pt-2">By {article.authors.join(', ')}</p>
      </div>
    </article>
  )
}

// small headline row for the "latest" column next to the hero
export function LatestRow({ kind, title, date, onClick, href, external }) {
  const inner = (
    <>
      <span className="flex items-center gap-2 t-meta">
        <span className={`badge ${kind === 'Paper' ? 'bg-mint' : 'bg-sun'}`}>{kind}</span>
        <time dateTime={date}>{formatDate(date)}</time>
      </span>
      <span className="t-card-title group-hover:underline">{title}</span>
    </>
  )
  const cls = 'group grid gap-1.5 border-b border-line px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-sun/40'
  return href ? (
    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}

// ------------------------------------------------------------------ papers
export function PaperCard({ paper }) {
  return (
    <article id={`paper-${paper.id}`} tabIndex={-1} className="skin-card rb-lazy scroll-mt-28 target:bg-sun">
      <div className="grid gap-3 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <LevelBadge level={paper.difficulty_level} />
          <p className="t-meta">
            <time dateTime={paper.publication_date}>{formatDate(paper.publication_date)}</time> · {paper.journal_or_source}
          </p>
        </div>
        <h3 className="t-title">{paper.title}</h3>
        <p className="t-meta">{paper.authors.join(', ')}</p>
        <p className="t-body max-w-[75ch]">
          <span className="font-bold text-ink">Abstract. </span>
          {paper.abstract}
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer" className="btn skin-btn">
            PDF<span className="sr-only"> of {paper.title} (opens in a new tab)</span> ↗
          </a>
          {paper.doi && (
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="btn skin-btn skin-btn-soft">
              DOI<span className="sr-only"> of {paper.title} (opens in a new tab)</span> ↗
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

// ------------------------------------------------------------------ books
export function BookCard({ book, inCart, onAdd }) {
  const stock = stockInfo(book.stock_quantity)
  const out = book.stock_quantity <= 0
  return (
    <article id={`book-${book.slug}`} className="skin-card card-lift rb-lazy flex flex-col overflow-hidden">
      <div className="bg-[#e3f2ff] p-5">
        <img src={asset(book.cover_image_url)} alt={`Cover of ${book.title}`} width="300" height="400" loading="lazy" decoding="async" className="mx-auto aspect-[3/4] w-3/5 max-w-[220px] rounded-xl object-cover shadow-[0_18px_36px_rgba(18,38,63,0.20)]" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge level={book.difficulty_level} />
          <span className="t-meta">{book.category}</span>
        </div>
        <h3 className="t-card-title">{book.title}</h3>
        <p className="t-meta">by {book.author}</p>
        <p className="t-body">{book.description}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <p className="font-display text-3xl font-extrabold tracking-tight text-blue">{money(book.price)}</p>
          <p className={`badge ${stock.cls}`}>{stock.label}</p>
        </div>
        <button type="button" disabled={out} onClick={() => onAdd(book)} className="btn skin-btn mt-2 w-full">
          {out ? 'Sold out' : inCart ? `Add another (${inCart} in order)` : 'Add to order'}
          <span className="sr-only"> — {book.title}</span>
        </button>
      </div>
    </article>
  )
}
