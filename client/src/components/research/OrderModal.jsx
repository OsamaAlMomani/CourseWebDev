import { useEffect, useRef, useState } from 'react'
import Modal, { WindowBar } from './Modal'
import { Highlight, LevelBadge, money, stockInfo } from './bits'
import { asset } from '../../lib/asset'
import { fetchBooks, placeOrder } from '../../lib/researchApi'

const MAX_QTY = 10
const field = 'min-h-12 w-full border-2 border-ink bg-white px-3 text-base text-ink placeholder:text-ink/60'
const BTN = 'rb-press min-h-11 border-2 border-ink px-4 font-mono text-sm font-bold tracking-wide uppercase shadow-[0_10px_30px_rgba(18,38,63,0.10)]'

// The order window. Left: find books (title, author, ISBN or subject). Right: your order + delivery details.
// The cart only remembers book ids and quantities. The server looks up prices and stock itself when you submit,
// so the total shown here is a convenience, never what you are charged.
export default function OrderModal({ cart, setCart, initialSearch = '', onClose }) {
  const [q, setQ] = useState(initialSearch)
  const [found, setFound] = useState({ status: 'loading', books: [] })
  const [form, setForm] = useState({ name: '', email: '', address: '' })
  const [state, setState] = useState({ status: 'idle', error: '' }) // idle | sending | error
  const [receipt, setReceipt] = useState(null)
  const searchInput = useRef(null)
  const errorBox = useRef(null)

  // debounce + cancel older requests, same idea as the main search
  useEffect(() => {
    const controller = new AbortController()
    setFound((f) => ({ ...f, status: 'loading' }))
    const timer = setTimeout(async () => {
      try {
        setFound({ status: 'done', books: await fetchBooks({ q: q.trim() }, controller.signal) })
      } catch (err) {
        if (err.name !== 'AbortError') setFound({ status: 'error', books: [] })
      }
    }, q ? 300 : 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [q])

  // cart: { [bookId]: { book, quantity } }
  const add = (book) =>
    setCart((c) => {
      const have = c[book.id]?.quantity ?? 0
      return { ...c, [book.id]: { book, quantity: Math.min(have + 1, MAX_QTY, book.stock_quantity) } }
    })
  const setQty = (id, quantity) =>
    setCart((c) => {
      const next = { ...c }
      if (quantity < 1) delete next[id]
      else next[id] = { ...c[id], quantity: Math.min(quantity, MAX_QTY, c[id].book.stock_quantity) }
      return next
    })

  const lines = Object.values(cart)
  const total = lines.reduce((sum, l) => sum + l.book.price * l.quantity, 0)

  const submit = async (e) => {
    e.preventDefault()
    if (!lines.length) return
    setState({ status: 'sending', error: '' })
    try {
      const order = await placeOrder({ ...form, items: lines.map((l) => ({ bookId: l.book.id, quantity: l.quantity })) })
      setReceipt(order)
      setCart({})
      setState({ status: 'idle', error: '' })
    } catch (err) {
      setState({ status: 'error', error: err.message })
      fetchBooks({ q: q.trim() }).then((books) => setFound({ status: 'done', books })).catch(() => {}) // stock may have changed: refresh the list
      setTimeout(() => errorBox.current?.focus(), 0)
    }
  }

  // ------------------------------------------------------------ after the order
  if (receipt) {
    return (
      <Modal label="Order placed" onClose={onClose} className="md:max-w-xl">
        <WindowBar title="Order placed" onClose={onClose} />
        <div className="grid gap-4 p-5 md:p-8">
          <h3 className="font-display text-4xl leading-none font-extrabold">Thank you! Order #{receipt.id} is in.</h3>
          <ul className="border-2 border-ink bg-white">
            {receipt.items.map((i) => (
              <li key={i.title} className="flex justify-between gap-3 border-b-2 border-ink p-3 last:border-b-0">
                <span>
                  {i.quantity} × {i.title}
                </span>
                <span className="font-mono">{money(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 bg-rb-rose p-3 font-display text-xl font-extrabold">
              <span>Total</span>
              <span>{money(receipt.total)}</span>
            </li>
          </ul>
          <p>We will send the details to the email address you entered.</p>
          <button type="button" onClick={onClose} className={`${BTN} w-fit bg-rb-rose`}>
            Back to the page
          </button>
        </div>
      </Modal>
    )
  }

  // ------------------------------------------------------------ the order window
  return (
    <Modal label="Order books" onClose={onClose} initialFocus={searchInput} className="md:max-w-6xl">
      <WindowBar title="Order window" onClose={onClose} />
      <div className="grid gap-6 p-4 md:grid-cols-[1.15fr_1fr] md:p-6">
        {/* ---------- find books */}
        <section aria-labelledby="ow-find" className="grid content-start gap-4">
          <h3 id="ow-find" className="font-display text-3xl leading-none font-extrabold">
            1. Pick your books
          </h3>
          <div>
            <label htmlFor="ow-search" className="mb-1 block font-mono text-xs font-bold tracking-widest uppercase">
              Search by title, author, ISBN or subject
            </label>
            <input ref={searchInput} id="ow-search" type="search" autoComplete="off" maxLength={80} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. statistics, Lindqvist, 9798891000018" className={field} />
          </div>
          <p role="status" aria-live="polite" className="font-mono text-sm font-bold uppercase">
            {found.status === 'loading' ? 'Loading…' : found.status === 'error' ? 'Could not load books.' : `${found.books.length} book${found.books.length === 1 ? '' : 's'}`}
          </p>
          <ul className="grid max-h-[26rem] gap-3 overflow-y-auto pr-1 md:max-h-[34rem]">
            {found.books.map((b) => {
              const stock = stockInfo(b.stock_quantity)
              const inCart = cart[b.id]?.quantity ?? 0
              const out = b.stock_quantity <= 0 || inCart >= Math.min(MAX_QTY, b.stock_quantity)
              return (
                <li key={b.id} className="rb-lazy grid grid-cols-[72px_1fr] gap-3 border-2 border-ink bg-white p-3 sm:grid-cols-[72px_1fr_auto]">
                  <img src={asset(b.cover_image_url)} alt={`Cover of ${b.title}`} width="72" height="96" loading="lazy" decoding="async" className="aspect-[3/4] w-[72px] border-2 border-ink" />
                  <div className="grid content-start gap-1">
                    <p className="font-display text-lg leading-tight font-extrabold">
                      <Highlight text={b.title} query={q} />
                    </p>
                    <p className="font-mono text-xs">
                      <Highlight text={b.author} query={q} /> · ISBN {b.isbn}
                    </p>
                    <p className="flex flex-wrap items-center gap-2">
                      <LevelBadge level={b.difficulty_level} />
                      <span className="font-display text-lg font-extrabold">{money(b.price)}</span>
                      <span className={`border-2 border-ink px-1.5 font-mono text-[0.7rem] font-bold uppercase ${stock.cls}`}>{stock.label}</span>
                    </p>
                  </div>
                  <button type="button" disabled={out} onClick={() => add(b)} className={`${BTN} col-span-2 sm:col-span-1 sm:self-center ${out ? 'cursor-not-allowed bg-rb-sky/50 text-ink/60 shadow-none' : 'bg-rb-rose'}`}>
                    {b.stock_quantity <= 0 ? 'Sold out' : inCart ? `Added (${inCart})` : 'Add'}
                    <span className="sr-only"> {b.title} to your order</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ---------- order + details */}
        <form onSubmit={submit} className="grid content-start gap-4 border-2 border-ink bg-white p-4 shadow-[0_10px_30px_rgba(18,38,63,0.10)]" aria-labelledby="ow-order">
          <h3 id="ow-order" className="font-display text-3xl leading-none font-extrabold">
            2. Your order
          </h3>

          {lines.length === 0 ? (
            <p className="border-2 border-dashed border-ink p-4">Your order is empty. Add a book from the list.</p>
          ) : (
            <ul className="border-2 border-ink">
              {lines.map(({ book, quantity }) => (
                <li key={book.id} className="grid gap-2 border-b-2 border-ink p-3 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold">{book.title}</p>
                    <p className="font-mono text-sm">{money(book.price * quantity)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setQty(book.id, quantity - 1)} className="min-h-11 min-w-11 border-2 border-ink bg-white font-mono text-lg font-bold hover:bg-rb-rose" aria-label={`One fewer ${book.title}`}>
                      −
                    </button>
                    <output aria-label={`Quantity of ${book.title}`} className="min-w-8 text-center font-mono text-lg font-bold">
                      {quantity}
                    </output>
                    <button type="button" onClick={() => setQty(book.id, quantity + 1)} disabled={quantity >= Math.min(MAX_QTY, book.stock_quantity)} className="min-h-11 min-w-11 border-2 border-ink bg-white font-mono text-lg font-bold hover:bg-rb-rose disabled:cursor-not-allowed disabled:opacity-40" aria-label={`One more ${book.title}`}>
                      +
                    </button>
                    <button type="button" onClick={() => setQty(book.id, 0)} className="ml-auto min-h-11 px-2 font-mono text-sm font-bold underline underline-offset-4 hover:bg-rb-rose">
                      Remove<span className="sr-only"> {book.title}</span>
                    </button>
                  </div>
                </li>
              ))}
              <li className="flex justify-between bg-rb-rose p-3 font-display text-xl font-extrabold">
                <span>Total</span>
                <span>{money(total)}</span>
              </li>
            </ul>
          )}
          <p className="font-mono text-xs">Prices and stock are confirmed by our server when you order.</p>

          <div>
            <label htmlFor="ow-name" className="mb-1 block font-mono text-xs font-bold tracking-widest uppercase">
              Full name
            </label>
            <input id="ow-name" name="name" autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
          </div>
          <div>
            <label htmlFor="ow-email" className="mb-1 block font-mono text-xs font-bold tracking-widest uppercase">
              Email
            </label>
            <input id="ow-email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
          </div>
          <div>
            <label htmlFor="ow-address" className="mb-1 block font-mono text-xs font-bold tracking-widest uppercase">
              Delivery address
            </label>
            <textarea id="ow-address" name="address" autoComplete="street-address" required minLength={6} maxLength={300} rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`${field} py-2`} />
          </div>

          {state.status === 'error' && (
            <p ref={errorBox} tabIndex={-1} role="alert" className="border-2 border-ink bg-rb-coral p-3 font-bold text-ink">
              {state.error}
            </p>
          )}
          <button type="submit" disabled={!lines.length || state.status === 'sending'} className={`${BTN} w-full bg-rb-blue py-3 text-base text-white disabled:cursor-not-allowed disabled:opacity-50`}>
            {state.status === 'sending' ? 'Placing order…' : `Place order · ${money(total)}`}
          </button>
        </form>
      </div>
    </Modal>
  )
}
