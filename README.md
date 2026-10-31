# GlobalBooks

An online bookstore for every kind of reader, with shelves for kids, teens, students and scientists, a cart, real sign-in, **secure Stripe payments**, and a **Research & Book** page with science news, research papers (with a built-in PDF viewer) and books to order.

Built for the CourseWebDev course (Assignment 3): React + Vite + Tailwind on the front end, an Express + Postgres JSON API on the back end.

> **Before the assessment:** the live shop is deployed, but the Stripe test keys still have to be pasted into Render.
> Follow **[PAYMENTS-SETUP.txt](PAYMENTS-SETUP.txt)** (10 minutes, exact clicks). Everything else is done and tested.

---

## Features

### Shop

- **Shelves by reader group** (Kids, Teens, Students, ...). Each shelf has its own look, a hero, and a book grid with "More" paging (5 at a time).
- **Section drop-down.** The highlighted shelf tab opens its sections (Everything, Fiction, Non-fiction, ...) as an animated menu. Hover a tab with the mouse, or click or tap the highlighted tab on touch screens. The chosen section lives in the address bar (`?cat=fiction`), so filtered views can be bookmarked and shared.
- **Price filter, search, wishlist and cart drawer** with quantity steppers and an order total.
- **Buy now or checkout in Stripe's hosted payment page.** The server looks up every price in the database, creates a `pending` order, and only a verified Stripe webhook can mark it `paid`. See [docs/STRIPE.md](docs/STRIPE.md).
- **Order confirmation page** (`#/order/12`) that checks a few times for the webhook, then shows the real status, the items and the delivery address.
- **Purchased books** show up on your account page with a small looping animation.

### Accounts

- **Sign up, sign in and sign out** with email and password (Better Auth, secure session cookie plus a bearer token, still signed in after a refresh).
- **Account page** with your profile (editable name, email status), your orders with their payment status, and the books you own.
- The top bar groups the account links, the Night theme and Pin buttons, the cart and Contact into one tidy row. On phones they fold into the burger menu.

### Research & Book

- **Three panels:** Science News, Research Papers, Books. The open panel is kept in the address bar (`?section=research`).
- **Level filter** (Beginner / Intermediate / Advanced) under "Advanced search", sent to the server so only matching items come back.
- **Search everything** with `/` from anywhere on the page: results appear as you type, arrow keys move, Enter opens.
- **Featured paper** card with a drawn PDF page, stats strip, and a finder toolbar (search, sort, reading list).
- **PDF viewer:** a fixed-size window with the browser's own PDF viewer (zoom, search, print), Prev / Next paper, Cite, BibTeX and Save, plus Open in new tab, Download and DOI.
- **Reading list:** star papers to save them on this device (localStorage, no account needed).
- **Cite:** copy an APA citation from any paper card, or BibTeX from the viewer.
- **Order books** window with a cart, name, email and address form, and CSRF protection on the order request.

### Look and feel

- **Night theme** (toggle in the top bar) and a light theme, both built on CSS variables.
- **Calm animations.** Every duration is multiplied by one speed dial, `--dur-scale` in `src/styles/tokens.css` (`1` = fast, `1.75` = default, `2.5` = very slow).
- **Auto-hiding menu** that tucks away while you scroll down. Pin it with the pin button and it stays.
- **Motion Lab** page that explores the book-flip physics.

### Accessibility

- Keyboard-friendly dialogs (focus trap, Escape to close, focus returns to the button that opened them), skip-friendly headings, live regions for results and copy actions.
- Respects `prefers-reduced-motion`, `prefers-contrast` and forced colours.
- A `skin-reduce-fx` class on `<body>` switches off the heavy effects for slow devices.

---

## Tech stack

| Part      | Tools                                                        |
| --------- | ------------------------------------------------------------ |
| Front end | React, Vite, Tailwind CSS v4, plain CSS for tokens and pages |
| Routing   | A tiny hash router (`#/kids`, `#/account`, ...), no library  |
| Auth      | Better Auth (client in `src/lib/authClient.js`)              |
| Payments  | Stripe Checkout + signed webhook (`stripe` Node SDK)         |
| API       | Express JSON API under `/api/...`                            |
| Database  | PostgreSQL (Neon)                                            |
| Hosting   | Vercel (front end) and Render (back end)                     |

---

## Getting started

### 1. Requirements

- Node.js 20 or newer and npm
- A PostgreSQL database (a free Neon project works)

### 2. Install

```bash
git clone https://github.com/OsamaAlMomani/CourseWebDev.git
cd CourseWebDev

# front end
cd client
npm install

# back end (in a second terminal)
cd ../server
npm install
```

### 3. Environment variables

Create the `.env` files yourself. They are never committed.

`server/.env`

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
BETTER_AUTH_SECRET=a-long-random-string
BETTER_AUTH_URL=http://localhost:5173
CLIENT_ORIGINS=http://localhost:5173
PORT=4000

# Stripe TEST mode (see docs/STRIPE.md)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=usd
```

`client/.env` (optional)

```env
# Leave empty in development: Vite forwards /api to the Express server.
# Set it only if the API lives on a different address.
VITE_API_URL=
```

### 4. Create and fill the database

```bash
cd server
npm run db:setup       # creates/updates the tables and loads the books, papers and news
npm run verify:checkout # proves the whole payment flow with a fake local Stripe (no account needed)
```

### 5. Run

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

Open the address Vite prints (usually http://localhost:5173).

> The script names above (`dev`, `seed`) and the variable names are the usual ones. Check them against your own `package.json` and `server/.env.example`, and fix this section if they differ.

### Useful scripts

| Command                                   | What it does                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`                             | Starts the dev server with hot reload                                        |
| `npm run build`                           | Makes the production build in `dist/`                                        |
| `npm run verify:checkout`                 | End-to-end payment test against a fake Stripe (no account/keys needed)       |
| `npm run check:motion`                    | Runs the maths checks for the book-motion rules (`scripts/check-motion.mjs`) |
| `python scripts/generate-research-art.py` | Regenerates the research cover art                                           |

---

## Pages and addresses

The app uses hash routes, so it works on any static host without special rewrites.

| Address                                        | Page                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `#/`                                           | Home: hero, shelf chooser, featured book, perks, newsletter, contact |
| `#/kids`, `#/teens`, ...                       | One shelf per reader group                                           |
| `#/<shelf>?cat=fiction`                        | A shelf filtered to one section                                      |
| `#/scientists`                                 | Research & Book                                                      |
| `#/scientists?section=research&level=beginner` | Papers, beginner only                                                |
| `#/scientists?q=attention`                     | Opens the search with this text                                      |
| `#/account`                                    | Your account (sign in required)                                      |
| `#/order/12`                                   | Payment confirmation for order 12 (checks again while pending)       |

---

## Project structure

```text
client/src/
  index.css          style entry point: only @import lines and the cascade order
  App.jsx            picks the page from the address
  layout/            Header, Footer, CartDrawer, AuthDialog, Toast, ChatFab, Main
  pages/             Home, Shelf, Account, Research, MotionLab (JSX and CSS together)
  shared/            parts used by several pages (PageHero, LoadMore, Button, ...)
  styles/            global CSS: tokens, night theme, animations, accessibility
  context/           Shop, Catalog and Skin state
  lib/               api helper, auth client, hooks (useRoute, useCategory, useSavedPapers, ...)
  data/              static data (themes, filters)
```

Full folder guide: `src/STRUCTURE.md`. Every CSS file starts with a header that says what it is for and lists its classes.

---

## Settings worth knowing

| What                      | Where                                                    |
| ------------------------- | -------------------------------------------------------- |
| Animation speed           | `--dur-scale` in `src/styles/tokens.css`                 |
| Colours, fonts, easing    | `@theme` and `:root` in `src/styles/tokens.css`          |
| Night theme colours       | `src/styles/theme-night.css`                             |
| Cards shown before "More" | `PAGE_SIZE` in `src/shared/LoadMore.jsx`                 |
| Section drop-down timing  | `FLY_CLOSE_DELAY` in `src/layout/Header/SlidingTabs.jsx` |
| Saved papers storage key  | `gb-saved-papers` in `src/lib/useSavedPapers.js`         |
| Pinned menu storage key   | `gb-header-pinned` (localStorage)                        |

---

## Deploying

The live shop is **<https://course-web-dev.vercel.app>** and the live API is **<https://book-store-db-o3h2.onrender.com>**. Both are connected to this GitHub repository and redeploy on a push to `main`.

1. **Back end on Render.** Root directory `server/`, start command `npm start`. Environment: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_ORIGINS`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Then run `npm run db:migrate` once against the production database (`npm run db:setup` on a new one). The Stripe part is spelled out click-by-click in **[PAYMENTS-SETUP.txt](PAYMENTS-SETUP.txt)**.
2. **Front end on Vercel.** Root directory `client/`, build `npm run build`, output `dist`. `client/src/lib/api.js` calls the Render API; set `VITE_API_URL` in Vercel only if that address ever changes.
3. **Stripe webhook.** Dashboard → Developers → Webhooks → add `https://<render-domain>/api/stripe/webhook`, choose `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired` and `charge.refunded`, then copy its signing secret to Render as `STRIPE_WEBHOOK_SECRET`.
4. **Check on the live URL:** books load, sign up, refresh (still signed in), Buy now, pay with the test card, land on a success page that says **Payment received**.

Full walkthrough: [docs/STRIPE.md](docs/STRIPE.md).

---

## Troubleshooting

- **You are signed out after every refresh.** Check that `BETTER_AUTH_URL` matches the site address and that the browser stores the bearer token (`localStorage.gb_token`). The server must expose the `set-auth-token` header through CORS; it does in `server/src/app.js`.
- **Checkout answers 503.** `STRIPE_SECRET_KEY` is missing on the server. See [docs/STRIPE.md](docs/STRIPE.md).
- **Payment succeeds but the order stays pending.** The webhook is not reaching `/api/stripe/webhook` or `STRIPE_WEBHOOK_SECRET` is wrong; check the Stripe dashboard's webhook attempts and the server log.
- **The PDF viewer shows nothing.** Some publishers forbid their PDFs inside a frame, and most phone browsers cannot show PDFs inline. Use "Open in new tab" or "Download" in the viewer footer.
- **Everything feels too slow or too fast.** Change `--dur-scale` in `tokens.css`.
- **The saved reading list is empty on another device.** It is stored in the browser, per device.

---

## Author

Osama Momani, M.Sc. Artificial Intelligence, Berlin School of Business & Innovation.
