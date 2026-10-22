import { asset } from '../../lib/asset'
import { LevelBadge, NewsImage, formatDate, money, stockInfo } from './bits'

const BTN = 'rb-press min-h-11 border-2 border-ink px-4 font-mono text-sm font-bold tracking-wide uppercase shadow-[0_10px_30px_rgba(18,38,63,0.10)]'

// ------------------------------------------------------------------ news
export function NewsHero({ article, onOpen }) {
  return (
    <article className="border-2 border-ink bg-white shadow-[0_10px_30px_rgba(18,38,63,0.10)]">
      <NewsImage image={article.image} alt={article.hero_image_alt} eager sizes="(min-width: 1024px) 58vw, 100vw" className="border-b-2" />
      <div className="grid gap-4 p-5 md:p-8">
        <p className="flex flex-wrap items-center gap-3 font-mono text-sm font-bold tracking-widest uppercase">
          <span className="bg-rb-coral px-2 py-0.5 text-ink">Top story</span>
          <span>{article.category}</span>
          <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
        </p>
        <h2 className="font-display text-[clamp(2rem,5.2vw,4.25rem)] leading-[0.95] font-extrabold tracking-tight text-balance">
          <button type="button" onClick={() => onOpen(article)} className="text-left underline-offset-8 hover:underline">
            {article.title}
          </button>
        </h2>
        <p className="max-w-[60ch] text-lg leading-snug md:text-xl">{article.summary}</p>
        <p className="font-mono text-sm">By {article.authors.join(', ')}</p>
        <button type="button" onClick={() => onOpen(article)} className={`${BTN} w-fit bg-rb-rose`}>
          Read the story →
        </button>
      </div>
    </article>
  )
}

export function NewsCard({ article, onOpen, lazy = true }) {
  return (
    <article className={`flex flex-col border-2 border-ink bg-white shadow-[0_10px_30px_rgba(18,38,63,0.10)] ${lazy ? 'rb-lazy' : ''}`}>
      <NewsImage image={article.image} alt={article.hero_image_alt} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 100vw" className="border-b-2" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="flex flex-wrap items-center gap-x-3 font-mono text-xs font-bold tracking-widest uppercase">
          <span className="bg-ink px-2 py-0.5 text-white">{article.category}</span>
          <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
        </p>
        <h3 className="font-display text-2xl leading-[1.02] font-extrabold tracking-tight">
          <button type="button" onClick={() => onOpen(article)} className="text-left underline-offset-4 hover:underline">
            {article.title}
          </button>
        </h3>
        <p className="leading-snug">{article.summary}</p>
        <p className="mt-auto pt-2 font-mono text-xs">By {article.authors.join(', ')}</p>
      </div>
    </article>
  )
}

// small headline row for the "latest" column next to the hero
export function LatestRow({ kind, title, date, onClick, href, external }) {
  const inner = (
    <>
      <span className="font-mono text-xs font-bold tracking-widest uppercase">
        <span className="mr-2 bg-ink px-1.5 py-0.5 text-white">{kind}</span>
        <time dateTime={date}>{formatDate(date)}</time>
      </span>
      <span className="font-display text-xl leading-tight font-extrabold group-hover:underline">{title}</span>
    </>
  )
  const cls = 'group grid gap-1 border-b-2 border-ink p-4 text-left last:border-b-0 hover:bg-rb-rose'
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
    <article id={`paper-${paper.id}`} tabIndex={-1} className="rb-lazy scroll-mt-28 border-2 border-ink bg-white shadow-[0_10px_30px_rgba(18,38,63,0.10)] target:bg-rb-rose">
      <div className="grid gap-3 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <LevelBadge level={paper.difficulty_level} />
          <p className="font-mono text-xs font-bold tracking-widest uppercase">
            <time dateTime={paper.publication_date}>{formatDate(paper.publication_date)}</time> · {paper.journal_or_source}
          </p>
        </div>
        <h3 className="font-display text-2xl leading-[1.02] font-extrabold tracking-tight md:text-3xl">{paper.title}</h3>
        <p className="font-mono text-sm">{paper.authors.join(', ')}</p>
        <p className="max-w-[75ch] leading-snug">
          <span className="font-bold">Abstract. </span>
          {paper.abstract}
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer" className={`${BTN} inline-flex items-center bg-rb-blue text-white`}>
            PDF<span className="sr-only"> of {paper.title} (opens in a new tab)</span> ↗
          </a>
          {paper.doi && (
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className={`${BTN} inline-flex items-center bg-white`}>
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
    <article id={`book-${book.slug}`} className="rb-lazy flex flex-col border-2 border-ink bg-white shadow-[0_10px_30px_rgba(18,38,63,0.10)]">
      <div className="border-b-2 border-ink bg-rb-paper p-4">
        <img src={asset(book.cover_image_url)} alt={`Cover of ${book.title}`} width="300" height="400" loading="lazy" decoding="async" className="mx-auto aspect-[3/4] w-3/5 max-w-[220px] border-2 border-ink shadow-[0_10px_30px_rgba(18,38,63,0.10)]" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge level={book.difficulty_level} />
          <span className="font-mono text-xs font-bold tracking-widest uppercase">{book.category}</span>
        </div>
        <h3 className="font-display text-2xl leading-[1.02] font-extrabold tracking-tight">{book.title}</h3>
        <p className="font-mono text-sm">by {book.author}</p>
        <p className="leading-snug">{book.description}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <p className="font-display text-3xl font-extrabold">{money(book.price)}</p>
          <p className={`border-2 border-ink px-2 py-0.5 font-mono text-xs font-bold tracking-wider uppercase ${stock.cls}`}>{stock.label}</p>
        </div>
        <button type="button" disabled={out} onClick={() => onAdd(book)} className={`${BTN} mt-2 w-full ${out ? 'cursor-not-allowed bg-rb-sky/50 text-ink/60 shadow-none' : 'bg-rb-rose'}`}>
          {out ? 'Sold out' : inCart ? `Add another (${inCart} in order)` : 'Add to order'}
          <span className="sr-only"> — {book.title}</span>
        </button>
      </div>
    </article>
  )
}
