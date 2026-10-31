import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'
import { useShop } from '../../context/ShopContext'
import { formatDate, formatPrice } from '../../lib/format'
import { cover } from '../../lib/asset'
import Container from '../../shared/Container'
import Button from '../../shared/Button'

// Delays between the automatic checks. Stripe's webhook can arrive a moment after the browser is
// redirected back, so the page looks a few times before it says "still waiting".
const POLL_DELAYS = [1000, 1500, 2500, 3500, 5000, 7000]

const STATUS = {
  paid: { icon: '✓', title: 'Payment received', tone: 'bg-mint text-ink', line: 'Thank you! Your payment went through and your books are on their way.' },
  pending: { icon: '⏳', title: 'Confirming your payment', tone: 'bg-sun text-ink', line: 'Stripe is confirming the payment. This usually takes only a few seconds.' },
  cancelled: { icon: '×', title: 'Payment not completed', tone: 'bg-coral text-ink', line: 'The payment page was closed before the payment finished. Your cart is still saved.' },
  expired: { icon: '×', title: 'Payment page expired', tone: 'bg-coral text-ink', line: 'The payment was not finished in time. Your cart is still saved, so you can try again.' },
  failed: { icon: '!', title: 'Payment failed', tone: 'bg-coral text-ink', line: 'Stripe could not take the payment. Your cart is still saved, so you can try again.' },
  refunded: { icon: '↩', title: 'Payment refunded', tone: 'bg-lavender text-ink', line: 'The money for this order has been returned to you.' },
  placed: { icon: '✓', title: 'Order placed', tone: 'bg-sun text-ink', line: 'This is an older demo order from before card payments were switched on.' },
}

export default function OrderSuccessPage({ orderId }) {
  const { user, sessionLoading, openAuth, setCartOpen, refreshShop } = useShop()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)
  const [manual, setManual] = useState(0)
  const refreshed = useRef(false)

  useEffect(() => {
    if (sessionLoading) return
    if (!user) {
      setChecking(false)
      return
    }

    let alive = true
    let timer
    let attempt = 0
    setChecking(true)
    setError('')

    const load = async () => {
      try {
        const data = await api(`/orders/${orderId}`)
        if (!alive) return
        setOrder(data)
        setChecking(false)
        // The cart rows are deleted by the webhook when the payment is confirmed. Refresh the drawer once.
        if (data.paid && !refreshed.current) {
          refreshed.current = true
          refreshShop()
        }
        if (data.status === 'pending' && attempt < POLL_DELAYS.length) {
          const delay = POLL_DELAYS[attempt]
          attempt += 1
          setChecking(true)
          timer = window.setTimeout(load, delay)
        }
      } catch (err) {
        if (!alive) return
        setChecking(false)
        if (err.status === 401) {
          setError('Your session expired. Please sign in again to see this order.')
          openAuth('signin')
        } else {
          setError(err.message)
        }
      }
    }

    load()
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
    // refreshShop is intentionally not a dependency: its identity changes with every cart update.
  }, [orderId, user?.id, sessionLoading, manual]) // eslint-disable-line react-hooks/exhaustive-deps

  if (sessionLoading) {
    return <Shell><p role="status" className="text-lg">One moment…</p></Shell>
  }

  if (!user) {
    return (
      <Shell>
        <p className="text-6xl" aria-hidden="true">🔐</p>
        <h1 className="t-display">Sign in to see this order</h1>
        <p className="text-lg text-skin-muted">Orders belong to the account that paid for them.</p>
        <Button as="button" type="button" variant="skin" large onClick={() => openAuth('signin')}>Sign in</Button>
        <a href="#/" className="font-bold text-skin-link underline">Back to the shop</a>
      </Shell>
    )
  }

  if (error && !order) {
    return (
      <Shell>
        <p className="text-6xl" aria-hidden="true">😕</p>
        <h1 className="t-display">We couldn’t find that order</h1>
        <p role="alert" className="text-lg text-skin-muted">{error}</p>
        <a href="#/account" className="btn skin-btn min-h-12 px-6">Go to My account</a>
      </Shell>
    )
  }

  if (!order) {
    return (
      <Shell>
        <p className="animate-hop text-6xl motion-reduce:animate-none" aria-hidden="true">📦</p>
        <h1 className="t-display">Checking your payment…</h1>
        <p role="status" className="text-lg text-skin-muted">Talking to the shop. This takes a moment.</p>
      </Shell>
    )
  }

  const meta = STATUS[order.status] ?? STATUS.pending
  const waiting = order.status === 'pending'

  return (
    <section className="min-h-[70vh] bg-skin-bg py-12 text-skin-ink md:py-20">
      <Container className="mx-auto grid max-w-3xl gap-6">
        <div className="skin-card overflow-hidden">
          <div className={`flex flex-wrap items-center gap-4 p-6 md:p-8 ${meta.tone}`}>
            <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-white/70 text-3xl font-extrabold">
              {meta.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold tracking-[0.12em] uppercase">Order #{order.id}</p>
              <h1 className="font-skin text-3xl font-extrabold md:text-4xl">{meta.title}</h1>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:p-8">
            <p aria-live="polite" className="text-lg">
              {waiting && checking ? 'Stripe is confirming the payment…' : meta.line}
            </p>

            {order.paid && order.paidAt && (
              <p className="text-sm font-bold text-skin-muted">Paid on {formatDate(order.paidAt)}</p>
            )}

            <ul className="divide-y divide-skin-line overflow-hidden rounded-2xl border border-skin-line">
              {order.items.map((item) => (
                <li key={item.bookId} className="flex items-center gap-4 p-3">
                  {item.bookId && (
                    <img src={cover(item.bookId)} alt="" width="48" height="65" className="h-[65px] w-12 rounded border border-skin-edge object-cover" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{item.title}</span>
                    <span className="text-sm text-skin-muted">× {item.quantity} · {formatPrice(item.unitPrice)} each</span>
                  </span>
                  <span className="font-extrabold">{formatPrice(item.unitPrice * item.quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-3 bg-sun/50 p-3 font-display text-xl font-extrabold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </li>
            </ul>

            {order.shipTo?.name && (
              <p className="text-sm text-skin-muted">
                Delivering to <strong className="text-skin-ink">{order.shipTo.name}</strong>
                {order.shipTo.address ? `, ${order.shipTo.address}` : ''}
                {order.shipTo.country ? `, ${order.shipTo.country}` : ''}
              </p>
            )}

            {waiting && (
              <div className="grid gap-3 rounded-2xl bg-skin-bg p-4">
                <p className="text-sm text-skin-muted">
                  This page checks again by itself for a few moments. You can also check now — nothing is lost if you leave.
                </p>
                <button
                  type="button"
                  onClick={() => setManual((n) => n + 1)}
                  disabled={checking}
                  className="btn skin-btn skin-btn-soft min-h-11 w-fit"
                >
                  {checking ? 'Checking…' : 'Check again'}
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {order.paid || order.status === 'placed' ? (
                <>
                  <a href="#/account" className="btn skin-btn min-h-12 px-6 text-lg font-bold">View my orders</a>
                  <a href="#/" className="btn skin-btn skin-btn-soft min-h-12 px-6 text-lg font-bold">Keep shopping</a>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setCartOpen(true); window.location.hash = '#/' }}
                    className="btn skin-btn min-h-12 px-6 text-lg font-bold"
                  >
                    Back to my cart
                  </button>
                  <a href="#/" className="btn skin-btn skin-btn-soft min-h-12 px-6 text-lg font-bold">Keep shopping</a>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-skin-muted">
          Payments are handled by Stripe. This shop never sees or stores your card details.
        </p>
      </Container>
    </section>
  )
}

function Shell({ children }) {
  return (
    <section className="grid min-h-[70vh] place-items-center bg-skin-bg py-16 text-center text-skin-ink">
      <Container className="grid max-w-xl justify-items-center gap-4">{children}</Container>
    </section>
  )
}
