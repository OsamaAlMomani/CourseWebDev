# Stripe payments (setup, demo and how it works)

The shop takes real card payments through **Stripe Checkout** in **test mode**. No card details ever touch our
server: the customer pays on Stripe's own hosted page, and Stripe calls our webhook to tell us the money arrived.

## What is where

| File | Job |
|---|---|
| `server/src/stripe.js` | Creates the Stripe client from `STRIPE_SECRET_KEY`. `paymentsEnabled` says whether checkout can start. |
| `server/src/payments.js` | All the money logic: reserve stock, create the order, open a Checkout Session, mark paid, restore stock, refund. |
| `server/src/routes/checkout.js` | `POST /api/checkout/cart` and `POST /api/checkout/buy-now`. Login required. |
| `server/src/routes/stripeWebhook.js` | `POST /api/stripe/webhook`. Verifies the Stripe signature and is the **only** code that sets `status = 'paid'`. |
| `server/src/routes/orders.js` | `GET /api/orders` and `GET /api/orders/:id`. The success page polls the second one. |
| `client/src/layout/CartDrawer/CartDrawer.jsx` | "Pay … with Stripe" for the cart. |
| `client/src/pages/Shelf/BookCard.jsx` | "Buy now" for one book. |
| `client/src/pages/Order/OrderSuccessPage.jsx` | `#/order/:id`: checks a few times, then shows the real status. |
| `server/db/schema.sql` | `orders`, `order_items` and `stripe_events`. |

## The data model (what to show at assessment)

```
orders
  id                          integer, one row per purchase
  user_id                     who bought (from the session, never from the request body)
  total_cents                 integer, computed by the server from books.price_cents
  currency                    'usd'
  status                      pending | paid | cancelled | failed | refunded | placed (legacy demo)
  ship_name / ship_address / ship_country
  customer_email
  stripe_checkout_session_id  the hosted page Stripe made for this order
  stripe_payment_intent_id    the actual payment
  paid_at                     when the verified webhook said the money arrived
  stock_reserved              true while this order is holding copies of the book
  created_at / updated_at

order_items
  order_id, book_id, title, unit_price_cents, quantity
  (title and price are COPIES from the moment of purchase: a receipt never changes)

stripe_events
  id (Stripe's event id), type, order_id, received_at
  (Stripe retries webhooks; this table makes every retry harmless)
```

`order_items` is the "what was bought, and at what price" table. `stripe_events` is not strictly required, but it
is what makes replaying the same webhook twice safe.

## The flow, step by step

```
Browser                         Our API (Render)                    Stripe
   │  POST /api/checkout/cart        │                                  │
   │  { name, address, country }     │                                  │
   ├────────────────────────────────>│                                  │
   │                                 │ 1. read the cart, lock the books │
   │                                 │ 2. stock = stock - n             │
   │                                 │ 3. insert orders (pending)       │
   │                                 │ 4. insert order_items (snapshot) │
   │                                 │ 5. create Checkout Session ─────>│
   │                                 │<──────────── session.url ────────│
   │<──────── { orderId, url } ──────│                                  │
   │                                                                     │
   │  browser goes to Stripe's page, pays with 4242 4242 4242 4242       │
   │                                                                     │
   │                                 │<── webhook: session.completed ───│  (signed)
   │                                 │ verify signature                 │
   │                                 │ status = 'paid', paid_at = now() │
   │                                 │ delete the bought cart lines     │
   │                                 │                                  │
   │  Stripe redirects to #/order/12  │                                  │
   │  GET /api/orders/12 (maybe 6×)   │                                  │
   ├────────────────────────────────>│                                  │
   │<──────── status: paid ───────────│                                  │
```

Key points:

- **Prices come from `books.price_cents`.** The browser only says *which* book and *how many*. A `price` or `total`
  field in the request is ignored (`scripts/verify-checkout.js` proves this).
- **Stock is reserved when the order is created**, so two shoppers cannot buy the last copy. If the Checkout Session
  expires, `checkout.session.expired` cancels the order and puts the copies back.
- **Only the webhook marks an order paid.** `GET /api/orders/:id` only reads. A customer cannot make an order look
  paid, even by calling the API directly.
- Orders are always tied to `req.user.id`, which comes from the session. Signed-out visitors get **401** before any
  order is created.
- The cart is emptied by the webhook (not before), so abandoning Stripe keeps the cart intact.

## 1. Create a Stripe account (test mode)

1. Sign up at <https://dashboard.stripe.com/register>.
2. In the dashboard, keep the **Test mode** switch (top right) turned **on**.
3. Open **Developers → API keys** and copy the **Secret key** (`sk_test_...`). Do not use a live key.

## 2. Add the key to the server

In `server/.env` (this file is git-ignored):

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=usd
```

Restart the API (`npm run dev`). `GET /api/health` should now contain `"payments": true`.

> Without the key the shop still runs; checkout answers **503** with a message instead of crashing.

## 3. Local webhook (Stripe CLI)

The success page cannot say "paid" until the webhook arrives. Locally, forward Stripe's events to your laptop:

```bash
# install once: https://docs.stripe.com/stripe-cli
stripe login
stripe listen --forward-to localhost:4000/api/stripe/webhook
```

The CLI prints a signing secret (`whsec_...`). Put it in `server/.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Restart the server, run the shop, and pay with:

- card **4242 4242 4242 4242**
- any future expiry date
- any CVC
- any name / country

The CLI shows `checkout.session.completed [200]`, and `#/order/<id>` changes from "Confirming your payment" to
**Payment received**.

## 4. Production webhook (Render)

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://book-store-db-o3h2.onrender.com/api/stripe/webhook`.
3. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`.
4. Copy the endpoint's **Signing secret** (`whsec_...`).
5. Render → the API service → **Environment**: add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, then redeploy.
6. Pay on <https://course-web-dev.vercel.app> with the test card and confirm the success page says **Payment received**.

If the payment succeeds but the page keeps saying "Confirming", open the webhook's **Attempts** tab in Stripe: a
`400` means the signing secret is wrong, a `503` means the server has no key, and no attempts means the URL/events are wrong.

## 5. Test without a Stripe account at all

`server/scripts/verify-checkout.js` starts a fake Stripe API on a random local port and runs the complete flow against
your database: sign up, cart, checkout, signed webhook, paid, duplicate webhook, forged signature, expiry + restock.

```bash
cd server
npm run verify:checkout
```

It cleans up the test user and restores stock afterwards. This is the fastest way to prove the code works before an
assessment, and it also runs without internet.

## 6. Assessment demo (2 minutes)

1. Sign in (or create an account) on the live site.
2. Add a book to the cart → **Checkout** → fill name/address/country → **Pay … with Stripe**.
3. On Stripe's page use `4242 4242 4242 4242`, a future date, any CVC.
4. You land on `#/order/<id>`. It briefly says "Confirming your payment", then **Payment received**, with the order
   number, items, total and delivery address.
5. Open **My account → Orders**: the same order shows **Paid**. `orders.status = 'paid'` and `paid_at` are set.
6. Show the `stripe_events` row for the webhook, and explain that the browser cannot set `paid`.

## Security notes

- The secret key lives only in `server/.env` / the Render environment. It is never sent to the browser.
- The webhook verifies `Stripe-Signature` against the **raw** request body, which is why the route is mounted before
  `express.json()`.
- Marking paid is idempotent: `status <> 'paid'` plus `stripe_events.id` make retries harmless.
- An order can only be read by the user who owns it (`GET /api/orders/:id` filters on `req.user.id`).
- Test keys (`sk_test_...`) are used throughout this project; no real money moves.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Checkout button says "not switched on" | `STRIPE_SECRET_KEY` missing/bad; check `GET /api/health` → `payments`. |
| Stripe says "No such price" / amount wrong | Prices are read from `books.price_cents`; re-run `npm run db:seed` if the catalog is empty. |
| Success page stays "Confirming" | Webhook not delivered or `STRIPE_WEBHOOK_SECRET` wrong. Check Stripe → Webhooks → Attempts. |
| Webhook answers 400 | Signature check failed: wrong secret, or a proxy changed the raw body. |
| Webhook answers 503 | `STRIPE_WEBHOOK_SECRET` missing on the server. |
| Order `cancelled` after an hour | Stripe Checkout Sessions expire after 1 hour; stock was returned automatically. |
