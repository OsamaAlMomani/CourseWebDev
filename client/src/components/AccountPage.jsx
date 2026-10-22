import { useEffect, useState } from 'react'
import { useShop } from '../context/ShopContext'
import { useSkin } from '../context/SkinContext'
import { useCatalog } from '../context/CatalogContext'
import { api } from '../lib/api'
import { authClient } from '../lib/authClient'
import { cover } from '../lib/asset'
import { formatDate, formatPrice } from '../lib/format'
import { voices } from '../data/themes'
import Container from './Container'
import Button from './Button'
import MathPlane from './MathPlane'
import PurchasedBook from './PurchasedBook'
import SlidingTabs from './SlidingTabs'

// small number card ("3 saved books")
function Stat({ value, label, icon }) {
  return (
    <div className="skin-card px-5 py-4 [box-shadow:none]">
      <p className="font-skin text-3xl leading-none font-extrabold md:text-4xl">
        <span aria-hidden="true" className="mr-1.5 text-2xl">{icon}</span>
        {value}
      </p>
      <p className="mt-1.5 text-sm font-bold text-skin-muted">{label}</p>
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

// round avatar with the person's initials; the colour comes from their name, so it stays the same every visit
const avatarColours = ['bg-coral', 'bg-sun', 'bg-mint']
function Avatar({ name }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
  const colour = avatarColours[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % avatarColours.length]
  return (
    <span aria-hidden="true" className={`grid size-20 shrink-0 place-items-center rounded-full border-2 border-skin-edge font-skin text-3xl font-extrabold text-ink md:size-24 md:text-4xl ${colour}`}>
      {initials}
    </span>
  )
}

function OrderCard({ o, onBuyAgain }) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-skin-muted">Shipping to {o.shipTo.name}, {o.shipTo.country}</p>
        <button type="button" onClick={() => onBuyAgain(o.items)} className="btn skin-btn skin-btn-soft">Buy again</button>
      </div>
    </li>
  )
}

const inputCls = 'skin-input min-h-12 w-full px-3 py-2.5 text-base'

// Profile tab: change my name, change my password. Both go straight to Better Auth, which checks the session on the server.
function ProfileTab({ user }) {
  const { notify } = useShop()
  const [name, setName] = useState(user.name)
  const [nameState, setNameState] = useState({ busy: false, error: '' })
  const [pwState, setPwState] = useState({ busy: false, error: '' })

  async function saveName(e) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean || clean === user.name) return
    setNameState({ busy: true, error: '' })
    // Better Auth returns { data, error } instead of throwing; the session (and the greeting) refresh by themselves
    const { error } = await authClient.updateUser({ name: clean })
    setNameState({ busy: false, error: error ? error.message || 'We could not save your name.' : '' })
    if (!error) notify('Your name is updated.')
  }

  async function savePassword(e) {
    e.preventDefault()
    const form = e.currentTarget // grab it now, it is gone after the await
    const { current, next, again } = Object.fromEntries(new FormData(form))
    if (next !== again) return setPwState({ busy: false, error: 'The two new passwords are not the same.' })
    if (next === current) return setPwState({ busy: false, error: 'Please choose a password you have not used just now.' })
    setPwState({ busy: true, error: '' })
    const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true })
    setPwState({ busy: false, error: error ? error.message || 'We could not change your password.' : '' })
    if (!error) {
      form.reset()
      notify('Password changed. Other devices were signed out.')
    }
  }

  return (
    <div role="tabpanel" id="panel-profile" aria-labelledby="tab-profile" className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveName} className="skin-card grid content-start gap-4 p-5 [box-shadow:none] md:p-6">
        <h2 className="font-skin text-2xl font-extrabold">Your details</h2>
        <label className="grid gap-1 font-medium">
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className={inputCls} />
        </label>
        <label className="grid gap-1 font-medium">
          Email
          <input value={user.email} readOnly aria-describedby="email-note" className={`${inputCls} opacity-70`} />
          <span id="email-note" className="text-sm font-normal text-skin-muted">This is how you sign in, so it can’t be changed here.</span>
        </label>
        <p role="alert" className="min-h-6 font-medium text-skin-danger">{nameState.error}</p>
        <Button as="button" type="submit" variant="skin" disabled={nameState.busy || !name.trim() || name.trim() === user.name} className="justify-self-start">
          {nameState.busy ? 'Saving…' : 'Save name'}
        </Button>
      </form>

      <form onSubmit={savePassword} className="skin-card grid content-start gap-4 p-5 [box-shadow:none] md:p-6">
        <h2 className="font-skin text-2xl font-extrabold">Change password</h2>
        <label className="grid gap-1 font-medium">
          Current password
          <input type="password" name="current" required autoComplete="current-password" className={inputCls} />
        </label>
        <label className="grid gap-1 font-medium">
          New password <span className="text-sm font-normal text-skin-muted">(at least 8 characters)</span>
          <input type="password" name="next" required minLength={8} autoComplete="new-password" className={inputCls} />
        </label>
        <label className="grid gap-1 font-medium">
          New password again
          <input type="password" name="again" required minLength={8} autoComplete="new-password" className={inputCls} />
        </label>
        <p role="alert" className="min-h-6 font-medium text-skin-danger">{pwState.error}</p>
        <Button as="button" type="submit" variant="skin" disabled={pwState.busy} className="justify-self-start">
          {pwState.busy ? 'Changing…' : 'Change password'}
        </Button>
      </form>
    </div>
  )
}

// "My account", in four tabs so it is one calm thing at a time instead of one long page:
// Overview (who I am, my numbers, latest order), Wishlist, Orders, Profile. Only makes sense when signed in.
export default function AccountPage() {
  const { user, sessionLoading, openAuth, wishlist, toggleWishlist, addToCart, setCartOpen, notify } = useShop()
  const { groups, books } = useCatalog()
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
          <h1 className="t-display">Your account</h1>
          <p className="text-xl">Please sign in to see your wishlist and orders.</p>
          <Button as="button" type="button" variant="skin" large onClick={() => openAuth('signin')}>Sign in</Button>
        </Container>
      </section>
    )
  }

  const ready = orders.status === 'ready'
  const spent = orders.list.reduce((sum, o) => sum + o.total, 0)
  const booksBought = orders.list.reduce((sum, o) => sum + o.items.reduce((n, i) => n + i.quantity, 0), 0)
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : ''

  // favourite shelf = the reader group you have bought the most books from (needs the catalog to know each book's group)
  const bought = {}
  for (const o of orders.list) {
    for (const i of o.items) {
      const group = books.find((b) => b.id === i.bookId)?.group
      if (group) bought[group] = (bought[group] ?? 0) + i.quantity
    }
  }
  const favId = Object.keys(bought).sort((a, b) => bought[b] - bought[a])[0]
  const favourite = groups.find((g) => g.id === favId)

  const inStock = wishlist.filter((b) => b.stock !== 0)
  const wishlistTotal = inStock.reduce((sum, b) => sum + b.price, 0)

  async function addAllToCart(list) {
    for (const book of list) await addToCart(book) // one at a time, the server checks stock for each
    setCartOpen(true)
  }
  const buyAgain = (items) => addAllToCart(items.map((i) => ({ id: i.bookId, title: i.title })))

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'wishlist', label: 'Wishlist', count: wishlist.length || undefined },
    { id: 'orders', label: 'Orders', count: ready && orders.list.length ? orders.list.length : undefined },
    { id: 'profile', label: 'Profile' },
  ]

  return (
    <MathPlane as="section" className="animate-page bg-skin-bg pt-10 pb-[calc(36px+2.5rem)] text-skin-ink motion-reduce:animate-none md:pt-16 md:pb-[calc(36px+4rem)]">
      <Container className="grid gap-8">
        <header className="flex flex-wrap items-center gap-5">
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <h1 className="t-display">{voice.greeting(user.name)}</h1>
            <p className="mt-2 text-lg break-words text-skin-muted">
              {user.email}
              {memberSince && <span> · Member since {memberSince}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await authClient.signOut()
              notify('You are signed out.')
              window.location.hash = '#/'
            }}
            className="btn skin-btn skin-btn-soft"
          >
            Sign out
          </button>
        </header>

        <div className="border-b-2 border-skin-line pb-2">
          <SlidingTabs mode="tabs" label="Account sections" items={tabs} activeId={tab} onSelect={(t) => setTab(t.id)} />
        </div>

        {tab === 'overview' && (
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" className="grid gap-8">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat icon="💙" value={wishlist.length} label="Saved books" />
              <Stat icon="📦" value={ready ? orders.list.length : '–'} label={orders.list.length === 1 ? 'Order' : 'Orders'} />
              <Stat icon="📚" value={ready ? booksBought : '–'} label="Books bought" />
              <Stat icon="💳" value={ready ? formatPrice(spent) : '–'} label="Spent so far" />
            </div>

            {favourite && (
              <a href={`#/${favourite.id}`} className="skin-card flex flex-wrap items-center gap-3 px-5 py-4 text-lg [box-shadow:none] transition hover:-translate-y-0.5">
                <span aria-hidden="true" className="text-3xl">{(voices[favourite.id] ?? voices.home).icon}</span>
                <span>
                  Your favourite shelf is <strong>{favourite.title}</strong>
                  <span className="text-skin-muted"> · {bought[favourite.id]} {bought[favourite.id] === 1 ? 'book' : 'books'} bought</span>
                </span>
                <span className="ml-auto font-bold text-skin-link underline">Browse it →</span>
              </a>
            )}

            <div>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-skin text-2xl font-extrabold">Latest order</h2>
                {ready && orders.list.length > 1 && (
                  <button type="button" onClick={() => setTab('orders')} className="min-h-11 font-bold text-skin-link underline">See all {orders.list.length} orders</button>
                )}
              </div>
              {orders.status === 'loading' && <p role="status">Loading your orders…</p>}
              {orders.status === 'error' && <p role="alert">We couldn’t load your orders. Please refresh.</p>}
              {ready && orders.list.length === 0 && <Empty icon={voice.icon}>{voice.ordersEmpty}</Empty>}
              {ready && orders.list.length > 0 && <ul><OrderCard o={orders.list[0]} onBuyAgain={buyAgain} /></ul>}
            </div>

            {wishlist.length > 0 && (
              <div>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-skin text-2xl font-extrabold">On your wishlist</h2>
                  <button type="button" onClick={() => setTab('wishlist')} className="min-h-11 font-bold text-skin-link underline">See all {wishlist.length}</button>
                </div>
                <ul className="flex flex-wrap gap-3">
                  {wishlist.slice(0, 6).map((book) => (
                    <li key={book.id}>
                      <img src={cover(book.id)} alt={book.title} width="72" height="97" loading="lazy" className="h-[97px] w-[72px] rounded-md border-2 border-skin-edge" />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="mb-3 font-skin text-2xl font-extrabold">Keep shopping</h2>
              <div className="flex flex-wrap gap-3">
                <a href="#/" className="skin-btn inline-flex min-h-12 items-center px-6 text-lg font-bold">All shelves</a>
                {groups.map((g) => (
                  <a key={g.id} href={`#/${g.id}`} className="btn skin-btn skin-btn-soft">
                    <span aria-hidden="true" className="mr-1.5">{(voices[g.id] ?? voices.home).icon}</span>
                    {g.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'wishlist' && (
          <div role="tabpanel" id="panel-wishlist" aria-labelledby="tab-wishlist" className="grid gap-5">
            {wishlist.length === 0 ? (
              <Empty icon={voice.icon}>{voice.wishlistEmpty}</Empty>
            ) : (
              <>
                <div className="skin-card flex flex-wrap items-center justify-between gap-3 px-5 py-4 [box-shadow:none]">
                  <p className="text-lg">
                    <strong>{wishlist.length}</strong> saved {wishlist.length === 1 ? 'book' : 'books'}
                    {inStock.length > 0 && <span className="text-skin-muted"> · {formatPrice(wishlistTotal)} for the {inStock.length === wishlist.length ? 'lot' : `${inStock.length} in stock`}</span>}
                  </p>
                  <button type="button" disabled={inStock.length === 0} onClick={() => addAllToCart(inStock)} className="btn skin-btn skin-btn-pop">
                    Add {inStock.length === wishlist.length ? 'all' : 'available'} to cart
                  </button>
                </div>
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
              </>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <div role="tabpanel" id="panel-orders" aria-labelledby="tab-orders">
            {orders.status === 'loading' && <p role="status">Loading your orders…</p>}
            {orders.status === 'error' && <p role="alert">We couldn’t load your orders. Please refresh.</p>}
            {ready && orders.list.length === 0 && <Empty icon={voice.icon}>{voice.ordersEmpty}</Empty>}
            <ul className="grid gap-4">
              {orders.list.map((o) => <OrderCard key={o.id} o={o} onBuyAgain={buyAgain} />)}
            </ul>
          </div>
        )}

        {tab === 'profile' && <ProfileTab user={user} />}
      </Container>
    </MathPlane>
  )
}
