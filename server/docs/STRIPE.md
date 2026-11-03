# Stripe test checkout: setup and demo notes

## 1. One-time setup (about 10 minutes)

1. Make a free account at stripe.com. In the dashboard, check the **Test mode** switch is ON (orange banner).
2. Developers → API keys → copy the **Secret key** (`sk_test_...`).
3. Put it in `server/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_xxxxxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxx   # same API keys page; lets the pay box open inside the page
   STRIPE_WEBHOOK_SECRET=        # filled in at step 4
   STRIPE_CURRENCY=usd
   ```
4. Install the Stripe CLI (https://docs.stripe.com/stripe-cli), run `stripe login`, then in a spare terminal:
   ```
   stripe listen --forward-to localhost:4000/api/stripe/webhook
   ```
   It prints `whsec_...`. Paste that into `STRIPE_WEBHOOK_SECRET` and restart the server.
   (Leave this terminal open while you test, no listener means no webhook means the order stays "pending".)
5. Add the dependencies and scripts if they aren't in the package.json files yet:
   ```
   (server)  npm i stripe
   (client)  npm i @stripe/stripe-js
   ```
   ```json
   "db:migrate": "node scripts/migrate.js",
   "verify:checkout": "node scripts/verify-checkout.js"
   ```
6. `npm run db:migrate` creates `orders`, `order_items`, `stripe_events`.

## 2. Test it

`npm run dev` in server and client, sign in, click **Buy now** on any book (or add to cart and press Checkout).
You get one screen with four boxes: Your books → Delivery → Pay → Done. Fill in delivery, then pay in the Stripe form inside box 3 with
`4242 4242 4242 4242`, any future date, any CVC, any name/postcode.
Box 4 opens, says "Confirming…" for a second or two, then "Payment received".
Pressing Back or Edit from the pay box cancels that pending order and puts the copies back on the shelf.
If `STRIPE_PUBLISHABLE_KEY` is not set, box 3 sends you to Stripe's hosted page instead and you come back to the same four boxes on the last one.

`npm run verify:checkout` runs the whole flow against a fake Stripe, no account needed. Good to run right before the assessment.

Other test cards: `4000 0000 0000 9995` (declined, insufficient funds), `4000 0025 0000 3155` (asks for 3D Secure).

## 3. Deploying (step 8)

On the API host (Render), add env vars: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` (still `sk_test_` if you want fake money live),
`STRIPE_WEBHOOK_SECRET`, `STRIPE_CURRENCY`, `CLIENT_URL` (your Vercel URL).
In Stripe → Developers → Webhooks → Add endpoint:
- URL: `https://<your-api>.onrender.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `charge.refunded`
- Copy that endpoint's signing secret into the host's `STRIPE_WEBHOOK_SECRET` (it is different from the CLI one) and redeploy.
Render's free tier sleeps: open `/api/health` a minute before the demo.

## 4. How to explain it at the assessment

- **Tables**: `orders` is one row per purchase (user, total, status, Stripe ids, paid_at). `order_items` is what was bought, with the book id, title, quantity and the unit price copied at purchase time. `stripe_events` remembers webhook ids so a retry can't double-process.
- **Login check**: `requireAuth` middleware on `/api/checkout` and `/api/orders`. No session, 401, no order.
- **Price safety**: the browser only sends a book id and quantity. `payments.js` reads `price_cents` from `books`, so nobody can edit a price in dev tools.
- **Flow**: four boxes on `#/checkout`. Finishing the delivery box calls `POST /api/checkout/cart` (or `/buy-now`) → order saved as `pending`, stock reserved → Stripe Checkout Session created (embedded) → Stripe's form is drawn in box 3. Going back calls `POST /api/checkout/:id/cancel`.
- **Webhook**: `POST /api/stripe/webhook` checks Stripe's signature on the raw body, then `markPaid()` flips `pending` → `paid`. It is the only code that does that. The success page just reads `GET /api/orders/:id` and re-checks a few times while it waits.
- **Failure paths**: closed or expired Stripe page → order `cancelled`, stock put back. Stripe outage while creating the session → order `failed`, stock put back.
