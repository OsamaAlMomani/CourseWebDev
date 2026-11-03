import { Router } from 'express'
import { config } from '../config.js'
import { httpError } from '../middleware.js'
import { paymentsEnabled, testMode } from '../stripe.js'
import { reserveCartOrder, reserveBuyNowOrder, loadOrder, createCheckoutSession, failOrder, cancelOrder } from '../payments.js'
import { rateLimit } from '../rateLimit.js'

// Mounted behind attachUser + requireAuth (see app.js): every checkout belongs to a signed-in user.
const router = Router()

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

// What the browser gets back: either a clientSecret (pay box inside the page) or a url (Stripe's hosted page).
const sessionReply = (reserved, session, embedded) => ({
  orderId: reserved.id,
  ...(embedded ? { clientSecret: session.client_secret, publishableKey: config.stripePublishableKey } : { url: session.url }),
  total: reserved.totalCents / 100,
  currency: reserved.currency,
})
const wantsEmbedded = (req) => req.body?.embedded === true && Boolean(config.stripePublishableKey)

// Stripe refused to open a payment page (bad key, network, ...). Undo the stock reservation so the
// customer can simply try again, and keep the technical detail in the server log only.
async function refundReservation(orderId, err) {
  await failOrder(orderId).catch((cleanupError) => console.error('[checkout] could not undo order', orderId, cleanupError.message))
  if (err.status) throw err
  console.error('[checkout] Stripe could not create a session:', err.message)
  throw httpError(502, 'We could not reach the payment provider. Please try again in a moment.')
}

// POST /api/checkout/cart  { name, address, country }
// Prices are looked up in the database. The browser only says "this is my address".
router.post('/cart', rateLimit('checkout', 12, 10 * 60 * 1000), async (req, res) => {
  if (!paymentsEnabled) {
    throw httpError(503, 'Online payment is not set up yet. The shop owner needs to add a Stripe secret key on the server.')
  }
  const name = clean(req.body?.name, 120)
  const address = clean(req.body?.address, 300)
  const country = clean(req.body?.country, 80)
  if (!name || !address || !country) throw httpError(400, 'Please fill in your name, address and country.')

  const embedded = wantsEmbedded(req)
  const reserved = await reserveCartOrder(req.user.id, { name, address, country, email: req.user.email })
  try {
    const order = await loadOrder(reserved.id)
    const session = await createCheckoutSession(order, { embedded })
    res.status(201).json(sessionReply(reserved, session, embedded))
  } catch (err) {
    await refundReservation(reserved.id, err)
  }
})

// POST /api/checkout/buy-now  { bookId, quantity }
// The one-click "Buy now" on a book card. Stripe collects the delivery address; the webhook stores it.
router.post('/buy-now', rateLimit('checkout', 12, 10 * 60 * 1000), async (req, res) => {
  if (!paymentsEnabled) {
    throw httpError(503, 'Online payment is not set up yet. The shop owner needs to add a Stripe secret key on the server.')
  }
  const bookId = typeof req.body?.bookId === 'string' ? req.body.bookId.slice(0, 80) : ''
  if (!bookId) throw httpError(400, 'Please choose a book first.')

  // The delivery box sends the address with the request. Old clients that send none get Stripe's address form instead.
  const name = clean(req.body?.name, 120)
  const address = clean(req.body?.address, 300)
  const country = clean(req.body?.country, 80)
  const haveAddress = Boolean(name && address && country)
  const embedded = wantsEmbedded(req)

  const reserved = await reserveBuyNowOrder(req.user.id, { bookId, quantity: req.body?.quantity, email: req.user.email, name, address, country })
  try {
    const order = await loadOrder(reserved.id)
    const session = await createCheckoutSession(order, { collectShipping: !haveAddress, embedded })
    res.status(201).json(sessionReply(reserved, session, embedded))
  } catch (err) {
    await refundReservation(reserved.id, err)
  }
})

// POST /api/checkout/:orderId/cancel -> the customer went back from the pay box. Frees the reserved copies.
router.post('/:orderId/cancel', async (req, res) => {
  res.json(await cancelOrder(req.params.orderId, req.user.id))
})

// GET /api/checkout/config -> lets the site explain itself when payments are not configured yet.
router.get('/config', (_req, res) => {
  res.set('Cache-Control', 'no-store').json({ enabled: paymentsEnabled, currency: config.stripeCurrency, testMode, embedded: Boolean(config.stripePublishableKey) })
})

export default router
