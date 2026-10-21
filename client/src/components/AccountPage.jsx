import { useEffect, useState } from 'react'
import { useShop } from '../context/ShopContext'
import { useSkin } from '../context/SkinContext'
import { api } from '../lib/api'
import { authClient } from '../lib/authClient'
import { cover } from '../lib/asset'
import { formatDate, formatPrice } from '../lib/format'
import { voices } from '../data/themes'
import Container from './Container'
import Button from './Button'
import MathPlane from './MathPlane'
import PurchasedBook from './PurchasedBook'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'orders', label: 'Orders' },
]

// small number card ("3 saved books")
function Stat({ value, label }) {
  return (
    <div className="skin-card px-5 py-4 [box-shadow:none]">
      <p className="font-skin text-4xl leading-none font-extrabold">{value}</p>
      <p className="mt-1 text-sm font-bold text-skin-muted">{label}</p>
    </div>
  )
}

function Empty({ icon, children }) {
  return (
    <p className="skin-card px-5 py-6 text-lg [box-shadow:none]">
      <span aria-hidden="true" className="mr-2">{icon}</span>
      {children}
    </p>
  )
}

function OrderCard({ o }) {
  return (
    <li className="skin-card p-5 [box-shadow:none]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-skin text-xl font-extrabold">Order #{o.id}</h3>
        <p className="flex items-center gap-2 text-sm text-skin-muted">
          {formatDate(o.createdAt)}
          <span className="rounded-full bg-skin-pop px-3 py-0.5 text-xs font-extrabold tracking-wide text-skin-pop-ink uppercase">{o.status}</span>
        </p>
      </div>
      <ul className="mt-3 divide-y divide-skin-line">
        {o.items.map((i) => (
          <li key={i.bookId} className="flex justify-between gap-4 py-2">
            <span>{i.title} <span className="text-skin-muted">× {i.quantity}</span></span>
            <span>{formatPrice(i.unitPrice * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex justify-between font-extrabold"><span>Total</span><span>{formatPrice(o.total)}</span></p>
      <div className="mt-4 border-t border-skin-line pt-3">
        <p className="text-sm text-skin-muted">Tap a book to see it celebrate again.</p>
        <div className="flex flex-wrap gap-4 pt-16 pb-3">
          {o.items.map((i) => (
            <PurchasedBook key={i.bookId} size="sm" auto={false} book={{ id: i.bookId, title: i.title }} />
          ))}
        </div>
      </div>
      <p className="mt-1 text-sm text-skin-muted">Shipping to {o.shipTo.name}, {o.shipTo.country}</p>
    </li>
  )
}

// "My account", in three tabs so it is one calm thing at a time instead of one long page:
// Overview (who I am + latest order), Wishlist, Orders. Only makes sense when signed in.
export default function AccountPage() {
  const { user, sessionLoading, openAuth, wishlist, toggleWishlist, addToCart, notify } = useShop()
  const voice = voices[useSkin()] ?? voices.home
  const [tab, setTab] = useState('overview')
  const [orders, setOrders] = useState({ status: 'loading', list: [] })

  // load my orders from the API whenever the signed-in user changes
  useEffect(() => {
    if (!user) return
    let ignore = false
    api('/orders')
      .then((list) => !ignore && setOrders({ status: 'ready', list }))
      .catch(() => !ignore && setOrders({ status: 'error', list: [] }))
    return () => {
      ignore = true
    }
  }, [user])

  if (sessionLoading) return <section className="min-h-[60vh] bg-skin-bg" />

  if (!user) {
    return (
      <section className="grid min-h-[60vh] place-items-center bg-skin-bg py-20 text-center text-skin-ink">
        <Container className="grid justify-items-center gap-4">
          <p className="animate-hop text-6xl motion-reduce:animate-none" aria-hidden="true">{voice.icon}</p>
          <h1 className="font-skin text-5xl font-extrabold tracking-[-0.03em]">Your account</h1>
          <p className="text-xl">Please sign in to see your wishlist and orders.</p>
          <Button as="button" type="button" variant="skin" large onClick={() => openAuth('signin')}>Sign in</Button>
        </Container>
      </section>
    )
  }

  const ready = orders.status === 'ready'
  const spent = orders.list.reduce((sum, o) => sum + o.total, 0)

  return (
    <MathPlane as="section" className="animate-page bg-skin-bg pt-10 pb-[calc(36px+2.5rem)] text-skin-ink motion-reduce:animate-none md:pt-16 md:pb-[calc(36px+4rem)]">
      <Container className="grid gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-skin text-[clamp(2.2rem,7vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.04em]">{voice.greeting(user.name)}</h1>
            <p className="mt-2 text-lg text-skin-muted">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await authClient.signOut()
              notify('You are signed out.')
              window.location.hash = '#/'
            }}
            className="min-h-11 font-bold underline"
          >
            Sign out
          </button>
        </header>

        <div role="tablist" aria-label="Account sections" className="flex gap-2 border-b-2 border-skin-line">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mb-0.5 min-h-12 border-b-4 px-4 text-lg font-bold transition ${tab === t.id ? 'border-skin-link text-skin-ink' : 'border-transparent text-skin-muted hover:text-skin-ink'}`}
            >
              {t.label}
              {t.id === 'wishlist' && wishlist.length > 0 && <span className="ml-2 rounded-full bg-skin-pop px-2 py-0.5 text-xs font-extrabold text-skin-pop-ink">{wishlist.length}</span>}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" className="grid gap-8">
            <div className="grid max-w-xl grid-cols-3 gap-3">
              <Stat value={wishlist.length} label="Saved books" />
              <Stat value={ready ? orders.list.length : '–'} label="Orders" />
              <Stat value={ready ? formatPrice(spent) : '–'} label="Spent so far" />
            </div>

            <div>
              <h2 className="mb-3 font-skin text-2xl font-extrabold">Latest order</h2>
              {orders.status === 'loading' && <p role="status">Loading your orders…</p>}
              {orders.status === 'error' && <p role="alert">We couldn’t load your orders. Please refresh.</p>}
              {ready && orders.list.length === 0 && <Empty icon={voice.icon}>{voice.ordersEmpty}</Empty>}
              {ready && orders.list.length > 0 && <ul><OrderCard o={orders.list[0]} /></ul>}
            </div>

            <div>
              <h2 className="mb-3 font-skin text-2xl font-extrabold">Keep shopping</h2>
              <div className="flex flex-wrap gap-3">
                <a href="#/" className="skin-btn inline-flex min-h-12 items-center px-6 text-lg font-bold">Main shop</a>
                <a href="#/kids" className="inline-flex min-h-12 items-center rounded-full bg-sun px-6 text-lg font-extrabold text-ink transition hover:-translate-y-0.5">🧸 Kids Corner</a>
              </div>
            </div>
          </div>
        )}

        {tab === 'wishlist' && (
          <div role="tabpanel" id="panel-wishlist" aria-labelledby="tab-wishlist">
            {wishlist.length === 0 ? (
              <Empty icon={voice.icon}>{voice.wishlistEmpty}</Empty>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wishlist.map((book) => (
                  <li key={book.id} className="skin-card flex gap-4 p-4 [box-shadow:none]">
                    <img src={cover(book.id)} alt="" width="72" height="97" className="h-[97px] w-[72px] rounded-md border-2 border-skin-edge" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="font-skin text-lg leading-tight font-extrabold">{book.title}</p>
                      <p className="text-sm text-skin-muted">{book.author} · {formatPrice(book.price)}</p>
                      <div className="mt-auto flex flex-wrap gap-3 text-sm font-bold">
                        <button type="button" disabled={book.stock === 0} onClick={() => addToCart(book)} className="min-h-11 text-skin-link underline disabled:opacity-40">
                          {book.stock === 0 ? 'Sold out' : 'Add to cart'}
                        </button>
                        <button type="button" onClick={() => toggleWishlist(book)} className="min-h-11 text-skin-muted underline hover:text-skin-danger">Remove</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <div role="tabpanel" id="panel-orders" aria-labelledby="tab-orders">
            {orders.status === 'loading' && <p role="status">Loading your orders…</p>}
            {orders.status === 'error' && <p role="alert">We couldn’t load your orders. Please refresh.</p>}
            {ready && orders.list.length === 0 && <Empty icon={voice.icon}>{voice.ordersEmpty}</Empty>}
            <ul className="grid gap-4">
              {orders.list.map((o) => <OrderCard key={o.id} o={o} />)}
            </ul>
          </div>
        )}
      </Container>
    </MathPlane>
  )
}
