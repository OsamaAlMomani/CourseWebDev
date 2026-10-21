import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { authClient } from '../lib/authClient'

// Everything about "me as a shopper": who is signed in, my cart, my wishlist, and the pop-ups (sign-in dialog, cart drawer, toast).
// Components call small actions like addToCart(book) and never worry about fetch or sign-in checks.
const ShopContext = createContext(null)
const emptyCart = { items: [], total: 0 }

export function ShopProvider({ children }) {
  // Better Auth's hook: `data` is the session (or null) and it updates by itself after sign-in / sign-out.
  const { data: session, isPending: sessionLoading } = authClient.useSession()
  const user = session?.user ?? null

  const [cart, setCart] = useState(emptyCart)
  const [wishlist, setWishlist] = useState([])
  const [purchased, setPurchased] = useState(() => new Set()) // ids of every book this person has ordered before
  const [authMode, setAuthMode] = useState(null) // null (closed) | 'signin' | 'signup'
  const [cartOpen, setCartOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState('ok') // 'ok' gets a tick, 'error' gets a !

  // a short message at the bottom of the screen
  const notify = useCallback((message, tone = 'ok') => {
    setNotice(message)
    setNoticeTone(tone)
    window.setTimeout(() => setNotice((current) => (current === message ? '' : current)), 3500)
  }, [])

  // Whenever the signed-in person changes: load their cart + wishlist from the server (or clear them on sign-out).
  useEffect(() => {
    if (!user) {
      setCart(emptyCart)
      setWishlist([])
      setPurchased(new Set())
      return
    }
    let ignore = false // if the user changes before the answer arrives, drop the old answer
    Promise.all([
      api('/cart'),
      api('/wishlist'),
      // past orders -> the ids of the books in them (if this one fails the shelves just show no "owned" books)
      api('/orders')
        .then((orders) => orders.flatMap((o) => o.items.map((i) => i.bookId)))
        .catch(() => []),
    ])
      .then(([c, w, ownedIds]) => {
        if (ignore) return
        setCart(c)
        setWishlist(w.items)
        setPurchased(new Set(ownedIds))
      })
      .catch(() => notify('Could not load your cart. Please refresh.', 'error'))
    return () => {
      ignore = true
    }
  }, [user?.id, notify]) // eslint-disable-line react-hooks/exhaustive-deps

  // run a server action; show its error as a toast instead of crashing
  const attempt = useCallback(
    async (work) => {
      try {
        return await work()
      } catch (err) {
        notify(err.message, 'error')
      }
    },
    [notify],
  )

  // Anything that needs an account first checks this. Signed out? Open the sign-in dialog and stop.
  const needLogin = () => {
    if (user) return false
    setAuthMode('signin')
    return true
  }

  const value = useMemo(
    () => ({
      user,
      sessionLoading,
      authMode,
      openAuth: setAuthMode,
      closeAuth: () => setAuthMode(null),
      cartOpen,
      setCartOpen,
      notice,
      noticeTone,
      notify,

      cart,
      cartCount: cart.items.reduce((n, i) => n + i.quantity, 0),
      // true = it worked, false = sign in first, undefined = the server said no (the toast tells why)
      addToCart: (book, quantity = 1) =>
        needLogin()
          ? false
          : attempt(async () => {
              setCart(await api('/cart', { method: 'POST', body: { bookId: book.id, quantity } }))
              notify(`Added “${book.title}” to your cart.`)
              return true
            }),
      setQuantity: (bookId, quantity) =>
        attempt(async () => setCart(await api(`/cart/${bookId}`, { method: 'PUT', body: { quantity } }))),
      removeFromCart: (bookId) => attempt(async () => setCart(await api(`/cart/${bookId}`, { method: 'DELETE' }))),
      // checkout throws on purpose: the cart drawer shows the error inside the form
      checkout: async (form) => {
        const order = await api('/orders', { method: 'POST', body: form })
        // the books in the cart are now owned, so the shelves can start celebrating them straight away
        setPurchased((prev) => new Set([...prev, ...cart.items.map((i) => i.id)]))
        setCart(emptyCart)
        return order
      },

      isPurchased: (bookId) => purchased.has(bookId),
      wishlist,
      isSaved: (bookId) => wishlist.some((b) => b.id === bookId),
      toggleWishlist: (book) =>
        needLogin() ||
        attempt(async () => {
          const saved = wishlist.some((b) => b.id === book.id)
          const result = await api(`/wishlist/${book.id}`, { method: saved ? 'DELETE' : 'PUT' })
          setWishlist(result.items)
        }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, sessionLoading, authMode, cartOpen, notice, noticeTone, cart, wishlist, purchased],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export const useShop = () => useContext(ShopContext)
