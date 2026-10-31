import { formatDate, formatPrice } from '../../lib/format'
import PurchasedBook from '../../shared/PurchasedBook/PurchasedBook'

// Small number card ("3 saved books"). Lives inside a <dl> on the page.
export function Stat({ value, label, icon }) {
  return (
    <div className="skin-card skin-card--flat px-5 py-4">
      <dt className="sr-only">{label}</dt>
      <dd className="m-0">
        <p className="font-skin text-3xl leading-none font-extrabold md:text-4xl">
          <span aria-hidden="true" className="mr-1.5 text-2xl">{icon}</span>
          {value}
        </p>
        <p className="mt-1.5 text-sm font-bold text-skin-muted">{label}</p>
      </dd>
    </div>
  )
}

export function Empty({ icon, children }) {
  return (
    <p className="skin-card skin-card--flat skin-empty px-5 py-6 text-lg">
      <span aria-hidden="true" className="mr-2">{icon}</span>
      {children}
    </p>
  )
}

// Round avatar with the person's initials; colour comes from the name,
// so it stays the same every visit.
const avatarColours = ['bg-coral', 'bg-sun', 'bg-mint']
export function Avatar({ name, size = 'md' }) {
  const initials =
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
  const colour =
    avatarColours[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % avatarColours.length]
  return (
    <span
      aria-hidden="true"
      className={`skin-avatar skin-avatar--${size} ${colour}`}
    >
      {initials}
    </span>
  )
}

// How each order status should look to a shopper. The database decides the status; the webhook is
// the only thing that can move an order to "paid".
const STATUS = {
  paid: { label: 'Paid', cls: 'bg-mint text-ink' },
  pending: { label: 'Awaiting payment', cls: 'bg-sun text-ink' },
  cancelled: { label: 'Not paid', cls: 'bg-coral text-ink' },
  expired: { label: 'Not paid', cls: 'bg-coral text-ink' },
  failed: { label: 'Payment failed', cls: 'bg-coral text-ink' },
  refunded: { label: 'Refunded', cls: 'bg-lavender text-ink' },
  placed: { label: 'Placed (demo)', cls: 'bg-sun text-ink' },
}

export function OrderStatus({ status }) {
  const meta = STATUS[status] ?? { label: status, cls: 'bg-sun text-ink' }
  return (
    <span className={`rounded-full px-3 py-0.5 text-xs font-extrabold tracking-wide uppercase ${meta.cls}`}>
      {meta.label}
    </span>
  )
}

export function OrderCard({ o, onBuyAgain, busy = false }) {
  const paid = o.paid || o.status === 'placed'
  return (
    <li className="skin-card skin-card--flat skin-order p-5">
      <div className="skin-order__header flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-skin text-xl font-extrabold">
          <a href={`#/order/${o.id}`} className="underline-offset-4 hover:underline">Order #{o.id}</a>
        </h3>
        <p className="flex items-center gap-2 text-sm text-skin-muted">
          {formatDate(o.createdAt)}
          <OrderStatus status={o.status} />
        </p>
      </div>

      <ul className="skin-order__items mt-3 divide-y divide-skin-line">
        {o.items.map((i) => (
          <li key={i.bookId} className="flex justify-between gap-4 py-2">
            <span>
              {i.title} <span className="text-skin-muted">× {i.quantity}</span>
            </span>
            <span>{formatPrice(i.unitPrice * i.quantity)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 flex justify-between font-extrabold">
        <span>Total</span>
        <span>{formatPrice(o.total)}</span>
      </p>

      {paid && (
        <div className="mt-4 border-t border-skin-line pt-3">
          <p className="text-sm text-skin-muted">Tap a book to see it celebrate again.</p>
          <div className="flex flex-wrap gap-4 pt-16 pb-3">
            {o.items.map((i) => (
              <PurchasedBook
                key={i.bookId}
                size="sm"
                auto={false}
                book={{ id: i.bookId, title: i.title }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="skin-order__footer flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-skin-muted">
          {o.shipTo?.name
            ? `Shipping to ${o.shipTo.name}${o.shipTo.country ? `, ${o.shipTo.country}` : ''}`
            : 'Delivery address is collected on the payment page.'}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a href={`#/order/${o.id}`} className="min-h-11 py-2 font-bold text-skin-link underline">
            {o.status === 'pending' ? 'Check payment' : 'View order'}
          </a>
          <button
            type="button"
            disabled={busy}
            onClick={() => onBuyAgain(o.items)}
            className="btn skin-btn skin-btn-soft min-h-11"
          >
            {busy ? 'Adding…' : 'Buy again'}
          </button>
        </div>
      </div>
    </li>
  )
}