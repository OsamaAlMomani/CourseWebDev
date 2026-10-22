import { asset } from '../../lib/asset'
import { formatPrice, formatDate } from '../../lib/format'

// ---- difficulty badge: green / yellow / red with black text (all pass WCAG AA contrast)
const BADGE = {
  beginner: 'bg-rb-mint',
  intermediate: 'bg-rb-sky',
  advanced: 'bg-rb-coral',
}
export function LevelBadge({ level, className = '' }) {
  if (!level) return null
  return <span className={`inline-block border-2 border-ink px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-ink uppercase ${BADGE[level]} ${className}`}>{level}</span>
}

// ---- responsive picture: AVIF first, WebP next, the browser picks the best it supports and the smallest width that fits
const withBase = (set) => set.split(', ').map((part) => asset(part)).join(', ')
export function NewsImage({ image, alt, sizes, eager = false, className = '' }) {
  // imported stories come with the publisher's own picture (one size, no AVIF/WebP set)
  if (image.remote) {
    return <img src={image.src} alt={alt} width="800" height="450" loading={eager ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer" className={`aspect-video w-full border-ink object-cover ${className}`} />
  }
  return (
    <picture>
      <source type="image/avif" srcSet={withBase(image.avif)} sizes={sizes} />
      <source type="image/webp" srcSet={withBase(image.webp)} sizes={sizes} />
      <img
        src={asset(image.src)}
        alt={alt}
        width="800"
        height="450"
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        className={`aspect-video w-full border-ink object-cover ${className}`}
      />
    </picture>
  )
}

// ---- wraps the words you searched for in <mark>. Plain strings only (no dangerouslySetInnerHTML), so it is injection-safe.
export function Highlight({ text, query }) {
  const words = (query.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!words.length) return text
  const re = new RegExp(`(${words.join('|')})`, 'giu')
  return text.split(re).map((part, i) =>
    i % 2 ? (
      <mark key={i} className="bg-rb-rose px-0.5 text-ink">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

export { formatDate, formatPrice as money }

export function stockInfo(qty) {
  if (qty <= 0) return { label: 'Sold out', cls: 'bg-rb-blue text-white' }
  if (qty <= 5) return { label: `Only ${qty} left`, cls: 'bg-rb-coral text-ink' }
  return { label: 'In stock', cls: 'bg-white text-ink' }
}
