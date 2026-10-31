// Stripe calls THIS endpoint when a payment really completes. It is the only place that may mark an
// order as paid: the browser can lie about many things, but it cannot forge Stripe's signature.
//
// The route is mounted BEFORE express.json() and reads the raw bytes itself, because the signature is
// calculated over the exact body Stripe sent. Re-serialising the JSON would break the check.
import express, { Router } from 'express'
import { config } from '../config.js'
import { stripe } from '../stripe.js'
import { query } from '../db.js'
import { markPaid, expireOrder, refundOrder } from '../payments.js'

const router = Router()

const readOrderId = (session) => {
  const raw = session?.metadata?.orderId ?? session?.client_reference_id
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

// Stripe sends either an id string or the full object depending on the event version.
const idOf = (value) => (typeof value === 'string' ? value : value?.id ?? null)

// The address Stripe collected (used by the one-click Buy now flow; the cart flow already has one).
function readShipping(session) {
  const details = session?.shipping_details ?? session?.customer_details
  const address = details?.address
  if (!address) return null
  const lines = [
    address.line1,
    address.line2,
    [address.postal_code, address.city].filter(Boolean).join(' '),
    address.state,
  ].filter(Boolean)
  return {
    name: details?.name ?? session?.customer_details?.name ?? '',
    address: lines.join(', ').slice(0, 300),
    country: String(address.country ?? '').slice(0, 80),
  }
}

async function rememberEvent(event, orderId) {
  // The sub-select turns an unknown order id into NULL instead of failing the foreign key.
  await query(
    `insert into stripe_events (id, type, order_id)
     values ($1, $2, (select id from orders where id = $3))
     on conflict (id) do nothing`,
    [event.id, event.type, orderId ?? null],
  )
}

router.post('/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments are not configured on this server.' })
  if (!config.stripeWebhookSecret) {
    console.error('[stripe] A webhook arrived but STRIPE_WEBHOOK_SECRET is missing, so it cannot be verified.')
    return res.status(503).json({ error: 'Webhook secret is not configured.' })
  }

  const signature = req.get('stripe-signature')
  if (!signature || !Buffer.isBuffer(req.body)) return res.status(400).json({ error: 'Missing Stripe signature.' })

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, config.stripeWebhookSecret)
  } catch (err) {
    // An unsigned or tampered request. Never act on it.
    console.warn('[stripe] rejected a webhook with a bad signature:', err.message)
    return res.status(400).json({ error: 'Invalid Stripe signature.' })
  }

  // Stripe retries every event it is not sure about. Remembering the ids makes retries harmless.
  const seen = await query('select 1 from stripe_events where id = $1', [event.id])
  if (seen.rowCount) return res.json({ received: true, duplicate: true })

  let orderId = null
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        orderId = readOrderId(session)
        // Card payments are already 'paid' here. Delayed methods are 'unpaid' and get their own event later.
        if (orderId && session.payment_status === 'paid') {
          await markPaid(orderId, { paymentIntentId: idOf(session.payment_intent), shipping: readShipping(session) })
        }
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object
        orderId = readOrderId(session)
        if (orderId) await markPaid(orderId, { paymentIntentId: idOf(session.payment_intent), shipping: readShipping(session) })
        break
      }
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object
        orderId = readOrderId(session)
        if (orderId) await expireOrder(orderId, 'failed')
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object
        orderId = readOrderId(session)
        if (orderId) await expireOrder(orderId, 'cancelled')
        break
      }
      case 'charge.refunded': {
        const charge = event.data.object
        if (charge.refunded) {
          const paymentIntent = idOf(charge.payment_intent)
          if (paymentIntent) {
            await refundOrder(paymentIntent)
            const found = await query('select id from orders where stripe_payment_intent_id = $1', [paymentIntent])
            orderId = found.rows[0]?.id ?? null
          }
        }
        break
      }
      default:
        // Other event types are acknowledged and recorded, so Stripe stops retrying them.
        break
    }

    await rememberEvent(event, orderId)
    if (!orderId && (event.type.startsWith('checkout.session.') || event.type === 'charge.refunded')) {
      console.warn('[stripe] webhook had no matching order:', event.type, event.id)
    }
    res.json({ received: true })
  } catch (err) {
    // Return a 500 so Stripe retries. Do NOT record the event: the work was not finished.
    console.error('[stripe] webhook handling failed:', event.type, err)
    res.status(500).json({ error: 'Webhook handling failed.' })
  }
})

export default router
