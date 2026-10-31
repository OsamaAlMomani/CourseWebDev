import express from 'express'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { config } from './config.js'
import { query } from './db.js'
import { auth } from './auth.js'
import { attachUser, requireAuth, notFound, errorHandler } from './middleware.js'
import { paymentsEnabled } from './stripe.js'
import catalogRoutes from './routes/catalog.js'
import cartRoutes from './routes/cart.js'
import wishlistRoutes from './routes/wishlist.js'
import orderRoutes from './routes/orders.js'
import checkoutRoutes from './routes/checkout.js'
import stripeWebhookRoutes from './routes/stripeWebhook.js'
import formRoutes from './routes/forms.js'
import researchRoutes from './routes/research.js'

// The Express app on its own (no listen), so tests and other programs can mount it.
export const app = express()

// Render/Railway put a proxy in front of us; this makes Express trust it (correct https / client IP detection).
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff')
  next()
})

// CORS: the browser site (Vercel) and this API (Render) are different origins.
// config.isAllowedOrigin accepts the configured sites, this project's live site and its Vercel previews.
// `exposedHeaders` is essential for login: without it the browser cannot read `set-auth-token`,
// so the bearer token would never be saved and every refresh would sign the customer out.
app.use(
  cors({
    origin(origin, callback) {
      if (config.isAllowedOrigin(origin)) return callback(null, true)
      console.warn(`[cors] refused origin: ${origin}`)
      return callback(null, false)
    },
    credentials: true,
    exposedHeaders: ['set-auth-token'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  }),
)

// 1) Auth routes: /api/auth/sign-up/email, /sign-in/email, /sign-out, /get-session ...
//    Better Auth handles all of them. It reads the raw request itself, so this MUST come before express.json().
app.all('/api/auth/*splat', toNodeHandler(auth))

// 2) Stripe webhook: signatures are checked against the RAW body, so this must also come before express.json().
app.use('/api/stripe', stripeWebhookRoutes)

app.use(express.json({ limit: '50kb' }))

// 3) Our own API. Public routes first, then routes that need a signed-in user.
app.get('/api/health', async (_req, res) => {
  await query('select 1') // proves the database connection works, handy for the host's health check
  res.json({
    ok: true,
    payments: paymentsEnabled,
    commit: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? null,
    time: new Date().toISOString(),
  })
})
app.get('/api/payments/config', (_req, res) => {
  // public on purpose: the shop shows a clear note when payment is not configured yet
  res.set('Cache-Control', 'no-store').json({ enabled: paymentsEnabled, currency: config.stripeCurrency })
})
app.use('/api', catalogRoutes) //                                          GET  /api/groups, /api/books, /api/books/:id
app.use('/api', researchRoutes) //                                         GET  /api/research/news|papers|books|search|csrf, POST /api/research/orders
app.use('/api', formRoutes) //                                             POST /api/newsletter, /api/contact
app.use('/api/cart', attachUser, requireAuth, cartRoutes) //               needs login
app.use('/api/wishlist', attachUser, requireAuth, wishlistRoutes) //       needs login
app.use('/api/orders', attachUser, requireAuth, orderRoutes) //            needs login
app.use('/api/checkout', attachUser, requireAuth, checkoutRoutes) //       needs login: every order belongs to a user

app.use(notFound)
app.use(errorHandler)
