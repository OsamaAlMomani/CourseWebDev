# How the backend works (assessment notes)

Everything you need to explain at assessment, in the order Farshid will probably ask.

## 1. The big picture

```
 Browser (React)                 Vercel                       Render                  Neon
 ┌──────────────┐  /api/...  ┌───────────┐   fetch      ┌──────────────────┐  SQL  ┌────────────┐
 │ client/      │ ─────────▶ │ serves    │ ──────────▶  │ server/ (Express)│ ────▶ │ Postgres   │
 │ fetch(API)   │ ◀───────── │ the site  │ ◀──────────  │ + Better Auth    │ ◀──── │            │
 └──────────────┘   JSON     └───────────┘              └──────────────────┘       └────────────┘
                                                              ▲
                                                              │ signed webhook
                                                         ┌────┴─────┐
                                                         │  Stripe  │
                                                         └──────────┘
```

- The **frontend** never talks to the database. It only calls our API and gets JSON back.
- The **API** is the only thing that holds the database and Stripe secret keys.
- The site and the API are on **two different domains**, so the browser sends the session as an
  `Authorization: Bearer ...` token (Better Auth's `bearer` plugin) in addition to the cookie. That is why the
  server exposes `set-auth-token` through CORS — without it the browser cannot read the token and a refresh signs
  the customer out.

## 2. Folder structure

```
server/
  src/
    index.js            starts the listener (the app itself is in app.js, so tests can mount it)
    app.js              Express: CORS, auth routes, Stripe webhook (raw body), JSON routes, errors
    config.js           reads .env, normalises origins, reads the Stripe settings
    db.js               the Postgres connection pool + query() + transaction()
    auth.js             Better Auth setup (cookie + bearer token)
    middleware.js       attachUser (who is this?), requireAuth (401 if nobody), error handler
    rateLimit.js        small in-memory limiter shared by checkout and research
    stripe.js           the Stripe client (null when no key: checkout then answers 503)
    payments.js         reserve stock, create order, Checkout Session, markPaid, expireOrder, refund
    routes/
      catalog.js        GET /api/groups, /api/books, /api/books/:id        (public)
      forms.js          POST /api/newsletter, /api/contact                 (public)
      cart.js           GET/POST/PUT/DELETE /api/cart                      (needs login)
      wishlist.js       GET/PUT/DELETE /api/wishlist                       (needs login)
      orders.js         GET /api/orders, GET /api/orders/:id               (needs login)
      checkout.js       POST /api/checkout/cart, POST /api/checkout/buy-now (needs login)
      stripeWebhook.js  POST /api/stripe/webhook                           (Stripe only, signature checked)
      research.js       the Research & Book page API
  db/schema.sql         every table, readable top to bottom
  seed/catalog.js       the old hardcoded books, now only used to fill the database
  scripts/migrate.js    runs schema.sql        (npm run db:migrate)
  scripts/seed.js       copies seed data in    (npm run db:seed)
  scripts/verify-checkout.js  the whole payment flow against a fake Stripe (npm run verify:checkout)

client/src/
  lib/api.js            the one fetch() helper (sends the bearer token, turns errors into Error objects)
  lib/authClient.js     Better Auth's browser client (saves/forgets the bearer token)
  context/CatalogContext.jsx   loads groups + books once, everyone reads them
  context/ShopContext.jsx      who is signed in + cart + wishlist + checkout + dialogs
  pages/Order/OrderSuccessPage.jsx  the payment confirmation page (#/order/12)
  components/           the UI (AuthDialog, CartDrawer, AccountPage, Toast, ...)
```

Rule of thumb: **routes** talk HTTP, **db.js** talks SQL, **auth.js** talks login. Each file has one job.

## 3. The database in plain English

| Table | In one sentence |
|---|---|
| `user`, `account`, `session`, `verification` | Owned by Better Auth. A *user* is a person; their password hash sits in *account*; each signed-in browser gets a *session* row. |
| `groups` | The reader groups (kids, teens...) with the texts for their page. `world` says which half of the shop it belongs to (`kids` or `general`) and `categories` lists its sections. |
| `books` | Everything we sell. Belongs to one group. Price is in **cents** (integers don't have rounding errors). Has a `category` (its section) and, for kids' books, `age_min` and `age_max`. Has `stock` and a flag `is_featured` for "book of the month" (a unique index allows only one). |
| `cart_items` | "Osama has 2 copies of Deep Blue in his cart." Primary key `(user_id, book_id)` = one row per user per book. |
| `wishlist_items` | "Osama saved Static." Same key idea. |
| `orders` | One row per checkout: who, total, status (`pending`/`paid`/`cancelled`/`failed`/`refunded`), delivery address, Stripe session + payment id, `paid_at`. |
| `order_items` | The lines of an order. Copies the **title and price at purchase time** so later price changes never rewrite old orders. |
| `stripe_events` | The Stripe webhook ids we already handled, so a retry cannot pay an order twice or put stock back twice. |
| `newsletter_subscribers` | One row per email (email is the primary key, so no duplicates). |
| `contact_messages` | What people send through the contact form; topic-specific answers are in a JSON column. |

Relationships: a user has many cart items / wishlist items / orders; an order has many order items; a group has many books.
`on delete cascade` means deleting a user also deletes their cart, wishlist and orders.

## 4. How login works (be ready to draw this)

1. **Sign up:** the browser calls `authClient.signUp.email({name, email, password})` → `POST /api/auth/sign-up/email`.
   Better Auth hashes the password (scrypt — never stored in plain text), inserts a row in `user` and `account`,
   creates a row in `session`, and answers with a `Set-Cookie` header **and** a `set-auth-token` header.
2. **The cookie** holds a signed session token. It is `HttpOnly` (JavaScript can't read it, so XSS can't steal it).
   The bearer token is the same session, returned in a header, because the site and the API are different domains.
3. **The browser keeps the token** in `localStorage.gb_token` and sends `Authorization: Bearer ...` on every request.
   The server's `bearer` plugin accepts it, so login survives even when the browser blocks third-party cookies.
   This only works because CORS exposes `set-auth-token` (`app.js`).
4. **Every protected request:** `attachUser` calls `auth.api.getSession()` with the request's headers → Better Auth looks the
   token up in the `session` table → `req.user` is set. `requireAuth` answers **401** if `req.user` is empty.
5. **Surviving a refresh:** on page load `authClient.useSession()` asks `/api/auth/get-session` with the bearer token.
   The session lasts 30 days (`auth.js`).
6. **Sign out:** `authClient.signOut()` deletes the session row, clears the cookie, and the browser forgets `gb_token`.

Important design point: **the server never trusts the browser about who the user is.** Routes use `req.user.id` from the session,
never a `userId` sent in the request body, so nobody can read another person's cart by changing a number.

## 5. API reference

| Method + path | Login? | What it does |
|---|---|---|
| `GET /api/health` | no | Checks the server and the database are alive |
| `GET /api/groups` | no | The reader groups, with `world` and `categories` |
| `GET /api/books?group=&category=&ageFrom=&ageTo=&q=&min=&max=&sort=` | no | Books; every filter optional (`ageFrom`/`ageTo` match books whose age range overlaps); `sort` = `price_asc`, `price_desc`, `title`, `new` |
| `GET /api/books/:id` | no | One book (404 if unknown) |
| `POST /api/newsletter` `{email}` | no | Subscribe (same answer if already subscribed) |
| `POST /api/contact` | no | Save a contact message (linked to the user if signed in) |
| `GET /api/cart` | yes | My cart + total |
| `POST /api/cart` `{bookId, quantity}` | yes | Add copies (max 10 per book) |
| `PUT /api/cart/:bookId` `{quantity}` | yes | Set an exact number |
| `DELETE /api/cart/:bookId` | yes | Remove |
| `GET /api/wishlist` / `PUT` / `DELETE` `/api/wishlist/:bookId` | yes | List / save / un-save |
| `GET /api/orders` | yes | My order history (every status) |
| `GET /api/orders/:id` | yes | One of my orders; the success page polls it |
| `POST /api/checkout/cart` `{name, address, country}` | yes | Create a `pending` order from the cart + a Stripe Checkout URL |
| `POST /api/checkout/buy-now` `{bookId, quantity}` | yes | The same for one book (Stripe collects the address) |
| `GET /api/payments/config` | no | `{ enabled, currency }`: is Stripe configured on this server? |
| `POST /api/stripe/webhook` | Stripe | Signature-checked; the only route that marks an order paid |
| `/api/auth/*` | — | Handled entirely by Better Auth |

Status codes used: 200/201 ok, 400 bad input, 401 not signed in, 404 not found, 409 conflict (not enough stock), 502 Stripe unreachable, 503 payments not configured, 500 our bug.

**Checkout is two steps.** `POST /api/checkout/cart` runs one transaction (`payments.js`): read the cart, lock the book rows,
`UPDATE books SET stock = stock - n WHERE stock >= n` (so two people cannot buy the last copy), insert the `orders` row as
`pending`, and copy the lines into `order_items`. Then it opens a Stripe Checkout Session and returns its URL. If Stripe
refuses, the reservation is undone and the order becomes `failed`. The cart is **not** emptied yet.

**Only the webhook finishes the purchase.** `POST /api/stripe/webhook` verifies the signature against the raw body, records
the event id in `stripe_events`, and calls `markPaid()`: `status = 'paid'`, `paid_at = now()`, save the payment intent and
the address Stripe collected, then delete the bought cart lines. The customer's success page only ever **reads**
`GET /api/orders/:id`; it cannot mark anything paid. `checkout.session.expired` cancels the order and puts stock back.

**SQL injection:** every query uses `$1, $2` placeholders; user text is never glued into SQL. The only dynamic SQL is `ORDER BY`,
which comes from a fixed whitelist (`SORTS` in `catalog.js`).

## 6. Setup checklist (local)

1. Create a free project on [neon.tech](https://neon.tech), copy the connection string.
2. `cd server && cp .env.example .env` and fill `DATABASE_URL`; generate `BETTER_AUTH_SECRET` with the command written in the file.
3. `npm install && npm run db:setup` → tables + 16 books.
4. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (see [STRIPE.md](STRIPE.md)). Without them the shop runs but checkout is off.
5. `npm run dev` (server) and, in `client/`, `npm install && npm run dev`.
6. Check: <http://localhost:4000/api/books> shows JSON; <http://localhost:5173> shows the shop; create an account, refresh, still signed in.
7. `npm run verify:checkout` proves the whole payment flow without a Stripe account.

## 7. Deploy checklist

**Live now:** front end <https://course-web-dev.vercel.app>, API <https://book-store-db-o3h2.onrender.com>, database Neon.

**Database:** the same Neon database works for production (run `npm run db:migrate` once, or `npm run db:setup` on a new one).

**Backend → Render**
1. Web Service → *Deploy from GitHub repo* → **Root Directory = `server`**, build `npm install`, start `npm start`.
2. Variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_ORIGINS`, `NODE_ENV=production`,
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
3. `BETTER_AUTH_URL` / `CLIENT_ORIGINS` should be the Vercel URL. The code also trusts the known live site and Vercel previews,
   so a missing/typo'd `CLIENT_ORIGINS` no longer breaks the whole shop.
4. Test `https://book-store-db-o3h2.onrender.com/api/health` → `{ ok: true, payments: true, ... }`.

**Frontend → Vercel**
1. Import the repo → **Root Directory = `client`** (framework: Vite, build `npm run build`, output `dist`).
2. `client/src/lib/api.js` already points at the Render API. Only set `VITE_API_URL` if that address changes.
3. `client/vercel.json` is not needed for API calls; it is kept as an optional proxy example.

**Stripe**
1. Add a webhook endpoint for `https://book-store-db-o3h2.onrender.com/api/stripe/webhook` (events listed in [STRIPE.md](STRIPE.md)).
2. Put its signing secret on Render as `STRIPE_WEBHOOK_SECRET` and redeploy.

**Verify on the live URL:** books load, sign up, refresh (still signed in), Buy now, pay `4242 4242 4242 4242`, land on
**Payment received**, and the order shows as **Paid** in My account.

## 8. Security checklist ("no secrets committed")

- `.gitignore` excludes `.env` and `.env.*` (but keeps `.env.example`). Prove it: `git check-ignore -v server/.env`
  and `git ls-files | grep -i env` should list only `.env.example` files.
- If a secret was ever committed by accident, rotating it (new Neon password, new `BETTER_AUTH_SECRET`) is the fix; deleting the file is not enough because git remembers.
- Production uses different secrets from local development.

## 9. Questions to expect

- *Why Express and a separate server?* The API is its own program; the database and Stripe secret keys never reach the browser.
- *Why a connection pool?* Opening a database connection is slow; a pool reuses a few.
- *Why cents?* `0.1 + 0.2 !== 0.3` in JavaScript; integers are exact.
- *Why snapshot price in `order_items`?* Receipts must not change when the catalog does.
- *Why does `/api/auth/*` come before `express.json()`?* Better Auth reads the raw request body itself.
- *Why does the Stripe webhook come before `express.json()`?* The signature is over the raw bytes; parsing and re-serialising breaks it.
- *Where is the password?* Only as a scrypt hash in `account.password`, written by Better Auth.
- *What stops a customer from setting `status = 'paid'`?* No route accepts a status. `markPaid()` is called only from the signature-checked webhook.
- *What if Stripe retries a webhook?* `stripe_events.id` is the primary key, and the state changes are guarded, so a retry is a no-op.
- *What if the customer closes the payment page?* The order stays `pending`; after the Checkout Session expires, Stripe sends `checkout.session.expired`, the order becomes `cancelled`, and stock is put back.
- *Can someone read another customer's order?* `GET /api/orders/:id` filters on `req.user.id`, so it answers 404 for someone else's order.

## 10. Honest limits and next steps

- No email verification or password reset (needs an email service).
- No rate limiting on the public newsletter/contact forms yet; checkout and research search have a small in-memory limit.
- Stripe is in **test mode**. Going live means swapping in live keys and a live webhook endpoint; the code is the same.
- Free tiers sleep: Neon pauses idle databases and Render sleeps idle web services, so the first request after a break can take a few seconds (the site shows "Opening the shop…").
