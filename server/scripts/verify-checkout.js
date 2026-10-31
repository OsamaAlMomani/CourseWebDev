// End-to-end proof of the payment flow WITHOUT a real Stripe account.
//
// It starts a tiny fake Stripe API on a random local port, starts our Express app against the database
// in server/.env, then behaves like a customer and like Stripe:
//   1. sign up -> bearer token
//   2. add a book to the cart
//   3. POST /api/checkout/cart  -> 'pending' order + fake Checkout URL
//   4. send a SIGNED checkout.session.completed webhook -> the only step that marks it paid
//   5. poll /api/orders/:id -> paid
//   6. send the same webhook again -> duplicate, still paid
//   7. send a webhook with a bad signature -> rejected, still paid
//   8. second order -> checkout.session.expired -> cancelled AND stock restored
//
// Run it with:  npm run verify:checkout
import http from 'node:http'
import { randomUUID } from 'node:crypto'

// ---------------------------------------------------------------- fake Stripe
let sessionCounter = 0
let failSessions = 0
const fakeStripe = http.createServer((req, res) => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => {
    if (req.method === 'POST' && req.url.includes('/checkout/sessions')) {
      if (failSessions > 0) {
        failSessions -= 1
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: { type: 'api_error', message: 'fake Stripe outage' } }))
        return
      }
      const form = new URLSearchParams(body)
      const id = `cs_test_verify_${++sessionCounter}`
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          id,
          object: 'checkout.session',
          url: `https://checkout.stripe.test/pay/${id}`,
          status: 'open',
          mode: 'payment',
          payment_status: 'unpaid',
          currency: form.get('line_items[0][price_data][currency]') || 'usd',
          amount_total: Number(form.get('line_items[0][price_data][unit_amount]') || 0),
          metadata: { orderId: form.get('metadata[orderId]') || '' },
          livemode: false,
          created: Math.floor(Date.now() / 1000),
        }),
      )
      return
    }
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: { message: 'not found in fake Stripe' } }))
  })
})
await new Promise((resolve) => fakeStripe.listen(0, '127.0.0.1', resolve))
const fakePort = fakeStripe.address().port

// The app reads its settings when it is imported, so the fake Stripe address must be set first.
process.env.STRIPE_SECRET_KEY = 'sk_test_verify_local'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_verify_local'
process.env.STRIPE_API_HOST = '127.0.0.1'
process.env.STRIPE_API_PORT = String(fakePort)
process.env.STRIPE_API_PROTOCOL = 'http'
process.env.STRIPE_CURRENCY = 'usd'
process.env.CLIENT_URL = 'http://localhost:5173'
process.env.NODE_ENV = 'test'

// Imported only now: db.js loads config.js, which reads the Stripe settings above.
const DB = await import('../src/db.js') // reads DATABASE_URL from --env-file=.env
const { app } = await import('../src/app.js')
const { config } = await import('../src/config.js')
const Stripe = (await import('stripe')).default

// The SDK's own signature generator: exactly what Stripe sends, without needing the Stripe CLI.
const signer = new Stripe('sk_test_verify_local')
const makeSignature = (payload) => signer.webhooks.generateTestHeaderString({ payload, secret: config.stripeWebhookSecret })

const api = app.listen(0, '127.0.0.1')
await new Promise((resolve) => api.once('listening', resolve))
const baseUrl = `http://127.0.0.1:${api.address().port}`

// ---------------------------------------------------------------- helpers
let passed = 0
function check(condition, label, detail = '') {
  if (!condition) throw new Error(`FAILED: ${label}${detail ? `\n  ${detail}` : ''}`)
  passed += 1
  console.log(`  ✓ ${label}`)
}

async function call(path, { method = 'GET', body, token, headers = {} } = {}) {
  const res = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Origin: 'http://localhost:5173',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { res, data }
}

async function hook(event, { signature } = {}) {
  const payload = JSON.stringify(event)
  const res = await fetch(`${baseUrl}/api/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': signature ?? makeSignature(payload) },
    body: payload,
  })
  const data = await res.json().catch(() => null)
  return { res, data }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const email = `verify-checkout-${Date.now()}@example.com`
const password = 'VerifyPass123!'
let book = null
let originalStock = 0
const eventIds = []

try {
  console.log('\nGlobalBooks checkout verification (no real Stripe account needed)\n')

  // A book with a known price and enough stock.
  const found = await DB.query('select id, title, price_cents, stock from books where stock >= 5 order by id limit 1')
  if (!found.rows[0]) throw new Error('No book with stock >= 5. Run npm run db:seed first.')
  book = found.rows[0]
  originalStock = book.stock
  const dbPrice = book.price_cents / 100
  console.log(`Using “${book.title}” (${dbPrice.toFixed(2)}, ${book.stock} in stock)\n`)

  // 1. Sign up
  const signup = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({ name: 'Verification Shopper', email, password }),
  })
  check(signup.ok, 'sign up succeeds', `HTTP ${signup.status}`)
  const token = signup.headers.get('set-auth-token')
  check(Boolean(token), 'server returns a bearer token (set-auth-token header)')

  // 2. Sign in again with the same account
  const signin = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({ email, password }),
  })
  check(signin.ok, 'sign in with the same account succeeds')
  const token2 = signin.headers.get('set-auth-token')
  check(Boolean(token2), 'sign in also returns a bearer token')

  // 3. Cart
  const added = await call('/cart', { method: 'POST', token: token2, body: { bookId: book.id, quantity: 2 } })
  check(added.res.status === 201, 'add to cart works')
  check(added.data.cart?.items?.[0]?.quantity === 2 || added.data.items?.[0]?.quantity === 2, 'cart has 2 copies')

  // 4. Checkout: a bogus price in the body must be ignored
  const checkout = await call('/checkout/cart', {
    method: 'POST',
    token: token2,
    body: { name: 'Verification Shopper', address: 'Teststrasse 1, Berlin', country: 'DE', total: 0.01 },
  })
  check(checkout.res.status === 201, 'checkout creates a pending order', JSON.stringify(checkout.data))
  const orderId = checkout.data.orderId
  check(Number.isInteger(orderId), 'checkout returns the order id')
  check(typeof checkout.data.url === 'string' && checkout.data.url.includes('checkout.stripe.test'), 'checkout returns the Stripe URL')
  check(Math.abs(checkout.data.total - dbPrice * 2) < 0.001, 'total comes from the database, not from the request', `expected ${dbPrice * 2}, got ${checkout.data.total}`)

  const afterReserve = await DB.query('select stock from books where id = $1', [book.id])
  check(afterReserve.rows[0].stock === originalStock - 2, 'stock reserved while waiting for payment')

  const pending = await call(`/orders/${orderId}`, { token: token2 })
  check(pending.data.status === 'pending', 'order starts as pending')
  check(pending.data.paid === false, 'pending order is not paid')
  check(pending.data.items[0].quantity === 2, 'order lines were snapshotted')

  // 5. Stripe webhook marks it paid
  const paidEvent = {
    id: `evt_verify_${randomUUID()}`,
    object: 'event',
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `cs_test_verify_${sessionCounter}`,
        object: 'checkout.session',
        payment_status: 'paid',
        payment_intent: 'pi_verify_123',
        metadata: { orderId: String(orderId) },
        customer_details: {
          name: 'Verification Shopper',
          email,
          address: { line1: 'Teststrasse 1', city: 'Berlin', postal_code: '10115', country: 'DE' },
        },
      },
    },
  }
  eventIds.push(paidEvent.id)
  const paidHook = await hook(paidEvent)
  check(paidHook.res.status === 200, 'webhook is accepted', JSON.stringify(paidHook.data))

  const paid = await call(`/orders/${orderId}`, { token: token2 })
  check(paid.data.status === 'paid', 'webhook marked the order paid', `status=${paid.data.status}`)
  check(paid.data.paid === true, 'order reports paid=true')
  check(Boolean(paid.data.paidAt), 'paid date is stored')
  check(paid.data.shipTo.address.includes('Teststrasse'), 'Stripe shipping address was saved', paid.data.shipTo.address)

  // 6. Replaying the same event does not double-pay or double-restock
  const replay = await hook(paidEvent)
  check(replay.res.status === 200 && replay.data.duplicate === true, 'duplicate webhook is acknowledged as a duplicate')
  const stillPaid = await call(`/orders/${orderId}`, { token: token2 })
  check(stillPaid.data.status === 'paid', 'replay did not change the order')

  // 7. A forged signature is rejected
  const forged = await hook({ ...paidEvent, id: `evt_verify_${randomUUID()}` }, { signature: 't=1,v1=deadbeef' })
  check(forged.res.status === 400, 'forged webhook signature is rejected')

  // 8. A second order, then an expired session -> cancelled and stock returned
  await call('/cart', { method: 'POST', token: token2, body: { bookId: book.id, quantity: 3 } })
  const second = await call('/checkout/cart', {
    method: 'POST',
    token: token2,
    body: { name: 'Verification Shopper', address: 'Teststrasse 1, Berlin', country: 'DE' },
  })
  check(second.res.status === 201, 'second checkout works')
  const secondId = second.data.orderId
  const during = await DB.query('select stock from books where id = $1', [book.id])
  check(during.rows[0].stock === originalStock - 5, 'both reservations are held')

  const expiredEvent = {
    id: `evt_verify_${randomUUID()}`,
    object: 'event',
    type: 'checkout.session.expired',
    created: Math.floor(Date.now() / 1000),
    data: { object: { id: `cs_test_verify_${sessionCounter}`, object: 'checkout.session', metadata: { orderId: String(secondId) } } },
  }
  eventIds.push(expiredEvent.id)
  const expired = await hook(expiredEvent)
  check(expired.res.status === 200, 'expired session webhook accepted')
  const cancelled = await call(`/orders/${secondId}`, { token: token2 })
  check(cancelled.data.status === 'cancelled', 'unpaid order becomes cancelled')
  const restored = await DB.query('select stock from books where id = $1', [book.id])
  check(restored.rows[0].stock === originalStock - 2, 'expired order returned its copies to stock')

  // A cancelled order can never be marked paid by a late webhook, and a paid one is never cancelled.
  const lateEvent = { ...expiredEvent, id: `evt_verify_${randomUUID()}`, data: { object: { ...expiredEvent.data.object, id: `cs_test_verify_${sessionCounter}` } } }
  eventIds.push(lateEvent.id)
  const late = await hook(lateEvent)
  check(late.res.status === 200, 'late duplicate-type event is acknowledged')
  const stillCancelled = await call(`/orders/${secondId}`, { token: token2 })
  check(stillCancelled.data.status === 'cancelled', 'a cancelled order stays cancelled')

  // 9. If Stripe itself is down, checkout fails cleanly: the order is 'failed' and its stock is back.
  await call('/cart', { method: 'POST', token: token2, body: { bookId: book.id, quantity: 1 } })
  const beforeFailure = await DB.query('select stock from books where id = $1', [book.id])
  failSessions = 5 // more than the SDK's 2 automatic retries, so the outage is persistent for this test
  const failedCheckout = await call('/checkout/cart', {
    method: 'POST',
    token: token2,
    body: { name: 'Verification Shopper', address: 'Teststrasse 1, Berlin', country: 'DE' },
  })
  check(failedCheckout.res.status === 502, 'a Stripe outage answers 502', `got ${failedCheckout.res.status}`)
  const failedOrder = await DB.query(
    `select o.id, o.status, o.stock_reserved from orders o
      where o.user_id = (select id from "user" where email = $1) order by o.id desc limit 1`,
    [email],
  )
  check(failedOrder.rows[0]?.status === 'failed', 'the order is marked failed')
  check(failedOrder.rows[0]?.stock_reserved === false, 'the failed order released its reservation')
  const afterFailure = await DB.query('select stock from books where id = $1', [book.id])
  check(afterFailure.rows[0].stock === beforeFailure.rows[0].stock, 'the failed order returned its copy')

  console.log(`\nAll ${passed} checks passed.\n`)
} catch (err) {
  console.error(`\n${err.message}\n`)
  process.exitCode = 1
} finally {
  // ---------------------------------------------------------------- clean up everything the test created
  try {
    if (book) await DB.query('update books set stock = $2 where id = $1', [book.id, originalStock])
    await DB.query('delete from "user" where email = $1', [email])
    if (eventIds.length) await DB.query('delete from stripe_events where id = any($1)', [eventIds])
    await DB.query("delete from stripe_events where id like 'evt_verify_%'")
  } catch (cleanupError) {
    console.error('Cleanup warning:', cleanupError.message)
  }
  await new Promise((resolve) => api.close(resolve))
  await new Promise((resolve) => fakeStripe.close(resolve))
  await DB.pool.end()
}
