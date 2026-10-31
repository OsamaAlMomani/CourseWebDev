// All money-moving database work lives here, away from the HTTP layer:
//   reserveCartOrder / reserveBuyNowOrder  create a 'pending' order and take its copies out of stock
//   createCheckoutSession                  opens the hosted Stripe Checkout page for that order
//   markPaid / expireOrder / refundOrder   the state changes the WEBHOOK is allowed to make
//
// Two rules this file exists to enforce:
//   1. prices ALWAYS come from `books` in the database, never from the browser;
//   2. only a verified Stripe webhook may turn 'pending' into 'paid'.
import { query, transaction } from './db.js'
import { config } from './config.js'
import { stripe, testMode } from './stripe.js'
import { httpError } from './middleware.js'

const MAX_COPIES = 10

// Countries Stripe may collect a shipping address for on the one-click "Buy now" path.
// (The cart form collects the address itself, so it does not need this list.)
const SHIPPING_COUNTRIES = [
  'US', 'CA', 'GB', 'IE', 'DE', 'FR', 'NL', 'BE', 'LU', 'AT', 'CH', 'ES', 'PT', 'IT', 'GR',
  'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT',
  'AU', 'NZ', 'JP', 'KR', 'SG', 'MY', 'TH', 'IN', 'AE', 'SA', 'QA', 'JO', 'EG', 'MA', 'ZA',
  'BR', 'MX', 'TR',
]

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

// ------------------------------------------------------------------ creating orders

// Turns the signed-in user's cart into a 'pending' order. The cart is NOT emptied yet:
// if the customer abandons Stripe, their cart is still there. The paid webhook empties it.
export async function reserveCartOrder(userId, { name, address, country, email }) {
  return transaction(async (db) => {
    // Lock the book rows in id order: two checkouts can never deadlock, and stock cannot be oversold.
    const { rows: lines } = await db.query(
      `select c.book_id, c.quantity, b.title, b.price_cents
         from cart_items c join books b on b.id = c.book_id
        where c.user_id = $1
        order by c.book_id
        for update of c, b`,
      [userId],
    )
    if (!lines.length) throw httpError(400, 'Your cart is empty.')

    let totalCents = 0
    for (const line of lines) {
      const result = await db.query('update books set stock = stock - $2 where id = $1 and stock >= $2', [line.book_id, line.quantity])
      if (result.rowCount === 0) throw httpError(409, `Sorry, “${line.title}” doesn’t have enough copies left.`)
      totalCents += line.price_cents * line.quantity
    }

    const {
      rows: [order],
    } = await db.query(
      `insert into orders (user_id, total_cents, status, currency, customer_email, ship_name, ship_address, ship_country, stock_reserved)
       values ($1, $2, 'pending', $3, $4, $5, $6, $7, true)
       returning id, total_cents, currency`,
      [userId, totalCents, config.stripeCurrency, clean(email, 254), clean(name, 120), clean(address, 300), clean(country, 80)],
    )

    for (const line of lines) {
      await db.query(
        `insert into order_items (order_id, book_id, title, unit_price_cents, quantity)
         values ($1, $2, $3, $4, $5)`,
        [order.id, line.book_id, line.title, line.price_cents, line.quantity],
      )
    }

    return { id: order.id, totalCents: order.total_cents, currency: order.currency }
  })
}

// One-click "Buy now": a single book, no address form. Stripe collects the address and the webhook stores it.
export async function reserveBuyNowOrder(userId, { bookId, quantity, email }) {
  const qty = Number(quantity ?? 1)
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_COPIES) throw httpError(400, `Quantity must be whole number from 1 to ${MAX_COPIES}.`)

  return transaction(async (db) => {
    const {
      rows: [book],
    } = await db.query('select id, title, price_cents, stock from books where id = $1 for update', [bookId])
    if (!book) throw httpError(404, 'That book is not in our shop any more.')

    const taken = await db.query('update books set stock = stock - $2 where id = $1 and stock >= $2', [book.id, qty])
    if (taken.rowCount === 0) throw httpError(409, book.stock === 0 ? `“${book.title}” is sold out.` : `Only ${book.stock} copies of “${book.title}” are left.`)

    const {
      rows: [order],
    } = await db.query(
      `insert into orders (user_id, total_cents, status, currency, customer_email, stock_reserved)
       values ($1, $2, 'pending', $3, $4, true)
       returning id, total_cents, currency`,
      [userId, book.price_cents * qty, config.stripeCurrency, clean(email, 254)],
    )
    await db.query(
      `insert into order_items (order_id, book_id, title, unit_price_cents, quantity) values ($1, $2, $3, $4, $5)`,
      [order.id, book.id, book.title, book.price_cents, qty],
    )
    return { id: order.id, totalCents: order.total_cents, currency: order.currency }
  })
}

// ------------------------------------------------------------------ Stripe Checkout

export async function loadOrder(orderId) {
  const {
    rows: [order],
  } = await query('select * from orders where id = $1', [Number(orderId)])
  if (!order) return null
  const { rows: items } = await query(
    'select book_id, title, unit_price_cents, quantity from order_items where order_id = $1 order by title',
    [order.id],
  )
  return { ...order, items }
}

export async function createCheckoutSession(order, { collectShipping = false } = {}) {
  if (!stripe) throw httpError(503, 'Online payment is not set up yet: the shop owner needs to add a Stripe secret key on the server.')

  const lineItems = order.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: order.currency,
      // The amount comes from our database (in cents). A price sent by the browser is never used.
      unit_amount: item.unit_price_cents,
      product_data: {
        name: item.title,
        metadata: { bookId: item.book_id },
      },
    },
  }))

  const successUrl = `${config.clientUrl}/#/order/${order.id}?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${config.clientUrl}/#/order/${order.id}?canceled=1`

  const params = {
    mode: 'payment',
    line_items: lineItems,
    client_reference_id: String(order.id),
    metadata: { orderId: String(order.id), userId: order.user_id },
    payment_intent_data: {
      metadata: { orderId: String(order.id) },
      description: `GlobalBooks order #${order.id}`,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: 'auto',
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // the hosted page is valid for one hour
  }
  if (order.customer_email) params.customer_email = order.customer_email
  if (collectShipping) {
    params.shipping_address_collection = { allowed_countries: SHIPPING_COUNTRIES }
  }
  if (testMode) {
    // A gentle reminder on the real Stripe page that this is play money.
    params.custom_text = { submit: { message: 'Test mode: use 4242 4242 4242 4242, any future date, any CVC. No real money moves.' } }
  }

  const session = await stripe.checkout.sessions.create(params)
  await query(
    'update orders set stripe_checkout_session_id = $2, updated_at = now() where id = $1 and status = $3',
    [order.id, session.id, 'pending'],
  )
  return session
}

// ------------------------------------------------------------------ webhook state changes

// Put the order's copies back on the shelf. Only ever runs once per order (guarded by stock_reserved).
async function restock(db, orderId) {
  await db.query('update orders set stock_reserved = false, updated_at = now() where id = $1', [orderId])
  await db.query(
    `update books b
        set stock = b.stock + i.quantity
       from order_items i
      where i.order_id = $1 and b.id = i.book_id`,
    [orderId],
  )
}

// The ONLY function that marks an order paid. Called from the verified Stripe webhook.
export async function markPaid(orderId, { paymentIntentId, shipping } = {}) {
  return transaction(async (db) => {
    const {
      rows: [changed],
    } = await db.query(
      `update orders
          set status = 'paid',
              paid_at = coalesce(paid_at, now()),
              updated_at = now(),
              stripe_payment_intent_id = coalesce($2, stripe_payment_intent_id),
              ship_name = coalesce(nullif($3, ''), ship_name),
              ship_address = coalesce(nullif($4, ''), ship_address),
              ship_country = coalesce(nullif($5, ''), ship_country)
        where id = $1 and status <> 'paid'
        returning id, user_id`,
      [Number(orderId), paymentIntentId ?? null, shipping?.name ?? '', shipping?.address ?? '', shipping?.country ?? ''],
    )

    // Even if the order was already paid (Stripe retried the event), clearing the cart again is harmless.
    let owner = changed
    if (!owner) {
      const lookup = await db.query('select id, user_id from orders where id = $1', [Number(orderId)])
      owner = lookup.rows[0]
    }
    if (owner) {
      await db.query(
        `delete from cart_items c
               using order_items i
               where c.user_id = $1 and i.order_id = $2 and c.book_id = i.book_id`,
        [owner.user_id, Number(orderId)],
      )
    }
    return { changed: Boolean(changed), userId: owner?.user_id ?? null }
  })
}

// Cancel/fail an unpaid order and put its copies back. A paid order is never touched.
export async function expireOrder(orderId, status = 'cancelled') {
  if (!['cancelled', 'failed'].includes(status)) throw new Error(`Unexpected expired status: ${status}`)
  return transaction(async (db) => {
    const { rowCount } = await db.query(
      `update orders set status = $2, updated_at = now()
        where id = $1 and status = 'pending' and stock_reserved`,
      [Number(orderId), status],
    )
    if (rowCount) await restock(db, Number(orderId))
    return { changed: rowCount > 0 }
  })
}

// A refunded payment stays in the order history (a receipt), but stops counting as money earned.
export async function refundOrder(paymentIntentId) {
  const { rowCount } = await query(
    `update orders set status = 'refunded', updated_at = now()
      where stripe_payment_intent_id = $1 and status = 'paid'`,
    [paymentIntentId],
  )
  return { changed: rowCount > 0 }
}

// Used when Stripe refused to create the session: undo the reservation so the customer can try again.
export async function failOrder(orderId) {
  return expireOrder(orderId, 'failed')
}
