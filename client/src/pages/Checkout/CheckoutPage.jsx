import { useEffect, useMemo, useRef, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { api } from '../../lib/api'
import { useShop } from '../../context/ShopContext'
import { formatDate, formatPrice } from '../../lib/format'
import { cover } from '../../lib/asset'
import Container from '../../shared/Container'
import Button from '../../shared/Button'
import Stepper from '../../shared/Stepper'
import CheckoutBackdrop from './CheckoutBackdrop'

// Checkout as four boxes on one screen:  1 Your books  ->  2 Delivery  ->  3 Pay  ->  4 Done.
// The box you are in is open, finished boxes fold into a one-line summary (with Edit), later boxes wait greyed out.
//
// How it is reached:
//   #/checkout                     the whole cart
//   #/checkout?book=<id>&qty=2     "Buy now" on one book
//   #/checkout/<orderId>           coming back from Stripe (or the hosted-page fallback at #/order/<orderId>): box 4
//
// Money rules did not change: prices are read from the database by the server, and only Stripe's signed webhook
// can mark an order paid. Box 4 just LOOKS at the order and re-checks a few times while the webhook is on its way.
const POLL_DELAYS = [1000, 1500, 2500, 3500, 5000, 7000]

const STATUS = {
  paid: { icon: '✓', title: 'Payment received', tone: 'bg-mint', line: 'Thank you! Your payment went through and your books are on their way.' },
  pending: { icon: '⏳', title: 'Confirming your payment', tone: 'bg-sun', line: 'Stripe is confirming the payment. This usually takes only a few seconds.' },
  cancelled: { icon: '×', title: 'Payment not completed', tone: 'bg-coral', line: 'The payment was not finished. Your cart is still saved.' },
  expired: { icon: '×', title: 'Payment page expired', tone: 'bg-coral', line: 'The payment was not finished in time. Your cart is still saved, so you can try again.' },
  failed: { icon: '!', title: 'Payment failed', tone: 'bg-coral', line: 'Stripe could not take the payment. Your cart is still saved, so you can try again.' },
  refunded: { icon: '↩', title: 'Payment refunded', tone: 'bg-lavender', line: 'The money for this order has been returned to you.' },
  placed: { icon: '✓', title: 'Order placed', tone: 'bg-sun', line: 'This is an older demo order from before card payments were switched on.' },
}

const inputCls = 'skin-input min-h-12 w-full px-3 py-2.5 text-base'
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// the part after "?" in "#/checkout?book=moon-bakery&qty=2"
const readQuery = () => new URLSearchParams((window.location.hash.split('?')[1] ?? '').trim())

export default function CheckoutPage({ orderId: returnedOrderId = null }) {
  const { user, sessionLoading, openAuth, cart, setQuantity, removeFromCart, refreshShop, payments } = useShop()

  // ---- what is being bought: one book (Buy now) or the whole cart
  const query = useMemo(readQuery, [])
  const singleBookId = returnedOrderId ? null : query.get('book')
  const [book, setBook] = useState(null)
  const [bookError, setBookError] = useState('')
  const [qty, setQty] = useState(() => Math.min(10, Math.max(1, Number(query.get('qty')) || 1)))

  useEffect(() => {
    if (!singleBookId) return
    let alive = true
    api(`/books/${singleBookId}`)
      .then((b) => alive && setBook(b))
      .catch((err) => alive && setBookError(err.message))
    return () => {
      alive = false
    }
  }, [singleBookId])

  const items = singleBookId ? (book ? [{ ...book, quantity: qty }] : []) : cart.items
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const copies = items.reduce((n, i) => n + i.quantity, 0)

  // ---- which box is open
  const [step, setStep] = useState(returnedOrderId ? 4 : 1)
  const [address, setAddress] = useState({ name: '', address: '', country: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pay, setPay] = useState(null) // { orderId, clientSecret, publishableKey } once box 3 is open
  const [redirecting, setRedirecting] = useState(false)
  const mountRef = useRef(null)

  useEffect(() => {
    if (user?.name) setAddress((a) => (a.name ? a : { ...a, name: user.name }))
  }, [user?.name])

  const setField = (e) => setAddress((a) => ({ ...a, [e.target.name]: e.target.value }))

  // Box 2 -> 3: the server makes the order (real prices from the database) and a Stripe session for it.
  async function startPayment(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const body = { ...address, embedded: true }
      const res = singleBookId
        ? await api('/checkout/buy-now', { method: 'POST', body: { ...body, bookId: singleBookId, quantity: qty } })
        : await api('/checkout/cart', { method: 'POST', body })
      if (res.clientSecret) {
        setPay(res)
        setStep(3)
      } else if (res.url) {
        // No publishable key on the server: fall back to Stripe's own page.
        setRedirecting(true)
        setStep(3)
        window.location.assign(res.url)
      } else {
        throw new Error('The payment box could not be opened. Please try again.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // Box 3: draw Stripe's payment form inside this box. Card details go straight to Stripe, never through our server.
  useEffect(() => {
    if (step !== 3 || !pay?.clientSecret) return undefined
    let cancelled = false
    let embedded = null
    ;(async () => {
      const stripe = await loadStripe(pay.publishableKey)
      if (!stripe) throw new Error('Stripe could not be loaded. Check your connection.')
      const init = stripe.initEmbeddedCheckout ?? stripe.createEmbeddedCheckoutPage
      embedded = await init.call(stripe, { clientSecret: pay.clientSecret })
      if (cancelled) {
        embedded.destroy()
        return
      }
      embedded.mount(mountRef.current)
    })().catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
      try {
        embedded?.destroy()
      } catch {
        // already gone
      }
    }
  }, [step, pay?.clientSecret, pay?.publishableKey])

  // Going back from the pay box: close the Stripe session and put the reserved copies back on the shelf first.
  async function goBack(to) {
    setError('')
    if (step === 3 && pay?.orderId) {
      setBusy(true)
      try {
        await api(`/checkout/${pay.orderId}/cancel`, { method: 'POST' })
      } catch (err) {
        if (err.status !== 404) {
          setError(err.message)
          setBusy(false)
          return
        }
      }
      setBusy(false)
      setPay(null)
      refreshShop()
    }
    setStep(to)
  }

  // ---- box 4: look at the order until the webhook has marked it paid
  const [order, setOrder] = useState(null)
  const [checking, setChecking] = useState(Boolean(returnedOrderId))
  const [manual, setManual] = useState(0)
  const refreshed = useRef(false)

  useEffect(() => {
    if (!returnedOrderId || sessionLoading || !user) return undefined
    let alive = true
    let timer
    let attempt = 0
    setChecking(true)
    const load = async () => {
      try {
        const data = await api(`/orders/${returnedOrderId}`)
        if (!alive) return
        setOrder(data)
        setChecking(false)
        if (data.paid && !refreshed.current) {
          refreshed.current = true
          refreshShop() // the webhook emptied the cart rows: refresh the drawer count once
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
        if (err.status === 401) openAuth('signin')
        else setError(err.message)
      }
    }
    // Stripe's hosted page sends the customer back to #/order/<id>?canceled=1 when they press its back link.
    // Close the pending order first (frees the reserved copies), then show what it became.
    const wasCanceled = readQuery().get('canceled') === '1'
    if (wasCanceled) {
      api(`/checkout/${returnedOrderId}/cancel`, { method: 'POST' }).catch(() => {}).finally(() => alive && load())
    } else {
      load()
    }
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
    // refreshShop changes identity with every cart update, so it is left out on purpose
  }, [returnedOrderId, user?.id, sessionLoading, manual]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- signed out / loading
  if (sessionLoading) return <Shell><p role="status" className="text-lg">One moment…</p></Shell>
  if (!user) {
    return (
      <Shell>
        <p className="text-6xl" aria-hidden="true">🔐</p>
        <h1 className="t-display">Sign in to check out</h1>
        <p className="text-lg text-skin-muted">Every order belongs to an account, so we need to know who is buying.</p>
        <Button as="button" type="button" variant="skin" large onClick={() => openAuth('signin')}>Sign in</Button>
        <a href="#/" className="font-bold text-skin-link underline">Back to the shop</a>
      </Shell>
    )
  }

  const meta = STATUS[order?.status] ?? STATUS.pending
  const waiting = order?.status === 'pending'
  const state = (n) => (step > n ? 'done' : step === n ? 'active' : 'locked')
  const paymentsOff = payments.loaded && !payments.enabled

  // summaries for the folded boxes (from the order itself when we came back from Stripe)
  const booksSummary = order ? `${plural(order.items.reduce((n, i) => n + i.quantity, 0), 'book')} · ${formatPrice(order.total)}` : `${plural(copies, 'book')} · ${formatPrice(total)}`
  const shipSummary = order?.shipTo?.name
    ? [order.shipTo.name, order.shipTo.address, order.shipTo.country].filter(Boolean).join(', ')
    : [address.name, address.address.replace(/\s*\n\s*/g, ', '), address.country].filter(Boolean).join(', ')
  // which mood the background wears: it follows the box you are working in
  const scene =
    step === 1 ? 'books'
    : step === 2 ? 'delivery'
    : step === 3 ? 'pay'
    : order?.paid ? 'paid'
    : ['cancelled', 'expired', 'failed', 'refunded'].includes(order?.status) ? 'problem'
    : 'wait'

  const paySummary = order ? (order.paid ? `Paid with Stripe${order.paidAt ? ` on ${formatDate(order.paidAt)}` : ''}` : 'Stripe is confirming…') : 'Secure payment by Stripe'

  return (
    <section className="relative isolate min-h-[70vh] overflow-hidden bg-skin-bg py-10 text-skin-ink md:py-16">
      <CheckoutBackdrop scene={scene} />
      <Container className="relative mx-auto grid max-w-3xl">
        <h1 className="t-display mb-3">Checkout</h1>
        <ol aria-hidden="true" className="mb-6 grid grid-cols-4 gap-2">
          {['Books', 'Delivery', 'Pay', 'Done'].map((label, i) => (
            <li key={label} className="grid gap-1">
              <span className={`h-2 rounded-full ${step > i + 1 ? 'bg-mint' : step === i + 1 ? 'bg-sun' : 'bg-skin-line'}`} />
              <span className={`text-xs font-bold ${step === i + 1 ? 'text-skin-ink' : 'text-skin-muted'}`}>{label}</span>
            </li>
          ))}
        </ol>

        {/* ---------------------------------------------------------------- box 1 */}
        <StepBox n={1} title="Your books" state={state(1)} summary={booksSummary} onEdit={step === 3 ? () => goBack(1) : step < 3 ? () => setStep(1) : null} busy={busy}>
          {bookError ? (
            <p role="alert" className="font-bold text-skin-danger">{bookError}</p>
          ) : singleBookId && !book ? (
            <p role="status">Loading the book…</p>
          ) : items.length === 0 ? (
            <div className="grid justify-items-start gap-3">
              <p className="text-lg">Your cart is empty.</p>
              <Button as="a" href="#/" variant="skin">Find a book</Button>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-skin-line overflow-hidden rounded-2xl border border-skin-line">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 p-3">
                    <img src={cover(item.id)} alt="" width="48" height="65" className="h-[65px] w-12 rounded border border-skin-edge object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{item.title}</span>
                      <span className="text-sm text-skin-muted">{item.author}</span>
                      {!singleBookId && (
                        <button type="button" onClick={() => removeFromCart(item.id)} className="mt-1 block min-h-9 text-sm font-bold text-skin-muted underline hover:text-skin-danger">Remove</button>
                      )}
                    </span>
                    <Stepper
                      value={item.quantity}
                      onChange={(n) => (singleBookId ? setQty(n) : setQuantity(item.id, n))}
                      max={Math.min(10, item.stock || 1)}
                      label={item.title}
                      className="border-skin-edge"
                    />
                    <span className="w-20 text-right font-extrabold">{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-3 bg-sun/50 p-3 font-display text-xl font-extrabold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button as="button" type="button" variant="skin" large onClick={() => setStep(2)}>Continue to delivery</Button>
                <Button as="a" href="#/" variant="skin" className="skin-btn-soft">Keep shopping</Button>
              </div>
            </>
          )}
        </StepBox>

        <Link2 done={step > 1} />

        {/* ---------------------------------------------------------------- box 2 */}
        <StepBox n={2} title="Delivery" state={state(2)} summary={shipSummary} onEdit={step === 3 ? () => goBack(2) : null} busy={busy}>
          <form onSubmit={startPayment} className="grid gap-3">
            <label className="grid gap-1 font-medium">Full name
              <input name="name" required value={address.name} onChange={setField} autoComplete="name" className={inputCls} />
            </label>
            <label className="grid gap-1 font-medium">Address
              <textarea name="address" required rows={3} value={address.address} onChange={setField} autoComplete="street-address" className={`${inputCls} resize-y`} />
            </label>
            <label className="grid gap-1 font-medium">Country
              <input name="country" required value={address.country} onChange={setField} autoComplete="country-name" className={inputCls} />
            </label>
            {paymentsOff && (
              <p className="rounded-2xl bg-coral/50 p-3 text-sm font-bold">Online payment is not switched on yet, so checkout cannot start. Please try again later.</p>
            )}
            <p role="alert" className="min-h-6 font-medium text-skin-danger">{error}</p>
            <div className="flex flex-wrap gap-3">
              <Button as="button" type="submit" variant="skin" large disabled={busy || paymentsOff || items.length === 0}>
                {busy ? 'Preparing payment…' : `Continue to payment · ${formatPrice(total)}`}
              </Button>
              <button type="button" onClick={() => setStep(1)} className="min-h-11 font-bold underline">Back</button>
            </div>
          </form>
        </StepBox>

        <Link2 done={step > 2} />

        {/* ---------------------------------------------------------------- box 3 */}
        <StepBox n={3} title="Pay" state={state(3)} summary={paySummary}>
          {redirecting ? (
            <p role="status" className="text-lg">Taking you to Stripe’s secure page…</p>
          ) : (
            <>
              <p className="mb-4 rounded-2xl bg-sun/40 p-4 text-sm leading-relaxed">
                You are paying <strong>{formatPrice(total)}</strong>. Stripe draws the card form below, so your card details never touch this shop.
                {' '}Test mode: <strong>4242 4242 4242 4242</strong>, any future date, any CVC.
              </p>
              <div ref={mountRef} aria-label="Stripe payment form" />
              <p role="alert" className="min-h-6 font-medium text-skin-danger">{error}</p>
              <button type="button" disabled={busy} onClick={() => goBack(2)} className="mt-2 min-h-11 font-bold underline">
                {busy ? 'Going back…' : 'Back to delivery'}
              </button>
            </>
          )}
        </StepBox>

        <Link2 done={step > 3} />

        {/* ---------------------------------------------------------------- box 4 */}
        <StepBox n={4} title="Done" state={state(4)}>
          {!order ? (
            error ? (
              <p role="alert" className="text-lg text-skin-danger">{error}</p>
            ) : (
              <p role="status" className="text-lg">Checking your payment…</p>
            )
          ) : (
            <div className="grid gap-4">
              <div className={`flex flex-wrap items-center gap-4 rounded-2xl p-5 text-ink ${meta.tone}`}>
                <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-white/70 text-2xl font-extrabold">{meta.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold tracking-[0.12em] uppercase">Order #{order.id}</p>
                  <p className="font-skin text-2xl font-extrabold">{meta.title}</p>
                </div>
              </div>
              <p aria-live="polite" className="text-lg">{waiting && checking ? 'Stripe is confirming the payment…' : meta.line}</p>

              <ul className="divide-y divide-skin-line overflow-hidden rounded-2xl border border-skin-line">
                {order.items.map((item) => (
                  <li key={item.bookId ?? item.title} className="flex items-center gap-3 p-3">
                    <span className="min-w-0 flex-1 font-bold">{item.title}</span>
                    <span className="text-sm text-skin-muted">× {item.quantity}</span>
                    <span className="font-extrabold">{formatPrice(item.unitPrice * item.quantity)}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-3 bg-sun/50 p-3 font-display text-xl font-extrabold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </li>
              </ul>

              {waiting && (
                <div className="grid gap-2 rounded-2xl bg-skin-bg p-4">
                  <p className="text-sm text-skin-muted">This checks again by itself for a few moments. Nothing is lost if you leave.</p>
                  <button type="button" onClick={() => setManual((n) => n + 1)} disabled={checking} className="btn skin-btn skin-btn-soft min-h-11 w-fit">
                    {checking ? 'Checking…' : 'Check again'}
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {order.paid || order.status === 'placed' ? (
                  <>
                    <a href="#/account" className="btn skin-btn min-h-12 px-6 text-lg font-bold">View my orders</a>
                    <a href="#/" className="btn skin-btn skin-btn-soft min-h-12 px-6 text-lg font-bold">Keep shopping</a>
                  </>
                ) : (
                  <>
                    <a href="#/checkout" className="btn skin-btn min-h-12 px-6 text-lg font-bold">Try again</a>
                    <a href="#/" className="btn skin-btn skin-btn-soft min-h-12 px-6 text-lg font-bold">Keep shopping</a>
                  </>
                )}
              </div>
            </div>
          )}
        </StepBox>

        <p className="mt-6 text-center text-sm text-skin-muted">Payments are handled by Stripe. This shop never sees or stores your card details.</p>
      </Container>
    </section>
  )
}

// One box. Three looks so you always see where you are:
//   working  open, thick sun-coloured ring with a soft glow, "Working on this" tag (no movement: the background does the moving)
//   done     folded to a summary, mint bar on the left, green tick, Edit button
//   waiting  dashed outline, greyed out, no content yet
const LOOKS = {
  active: { box: 'ring-4 ring-sun shadow-[0_0_36px_color-mix(in_oklch,var(--color-sun)_55%,transparent)]', badge: 'bg-sun text-ink', tag: 'Working on this', tagCls: 'bg-sun text-ink' },
  done: { box: 'border-l-8 border-l-mint', badge: 'bg-mint text-ink', tag: 'Done', tagCls: 'bg-mint/60 text-ink' },
  locked: { box: 'border-dashed opacity-50 grayscale', badge: 'bg-skin-bg text-skin-muted', tag: 'Waiting', tagCls: 'bg-skin-bg text-skin-muted' },
}

function StepBox({ n, title, state, summary, onEdit, busy = false, children }) {
  const look = LOOKS[state]
  return (
    <section aria-label={`Step ${n}: ${title}`} aria-current={state === 'active' ? 'step' : undefined} className={`skin-card overflow-hidden transition-colors duration-200 ${look.box}`}>
      <header className="flex items-center gap-4 p-4 md:p-5">
        <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-full border-2 border-skin-edge text-lg font-extrabold ${look.badge}`}>
          {state === 'done' ? '✓' : n}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-skin text-2xl font-extrabold">{title}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold tracking-wide uppercase ${look.tagCls}`}>{look.tag}</span>
          </div>
          {state === 'done' && summary && <p className="truncate text-sm text-skin-muted">{summary}</p>}
        </div>
        {state === 'done' && onEdit && (
          <button type="button" onClick={onEdit} disabled={busy} className="min-h-11 rounded-full border-2 border-skin-edge px-4 font-bold hover:bg-sun/40 disabled:opacity-45">Edit</button>
        )}
      </header>
      {state === 'active' && <div className="border-t-2 border-skin-line p-4 md:p-6">{children}</div>}
    </section>
  )
}

// the little line joining one box to the next (mint once the box above it is done)
const Link2 = ({ done = false }) => <div aria-hidden="true" className={`mx-auto h-5 rounded-full ${done ? 'w-1.5 bg-mint' : 'w-0.5 bg-skin-line'}`} />

function Shell({ children }) {
  return (
    <section className="grid min-h-[70vh] place-items-center bg-skin-bg py-16 text-center text-skin-ink">
      <Container className="grid max-w-xl justify-items-center gap-4">{children}</Container>
    </section>
  )
}
