// Reads settings from environment variables (.env locally, the host's dashboard in production)
// and stops the server at startup if something important is missing, instead of failing later in a confusing way.
const required = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL']
const missing = required.filter((name) => !process.env[name])
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill it in.`)
  process.exit(1)
}

// "https://site.com/" and "https://site.com" must be treated as the same origin, otherwise CORS
// silently refuses the real site (that is exactly how the deployed shop broke once).
export function normalizeOrigin(value) {
  if (!value) return null
  try {
    const url = new URL(String(value).trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return `${url.protocol}//${url.host}`.toLowerCase()
  } catch {
    return null
  }
}

const splitList = (value) => String(value ?? '').split(',').map(normalizeOrigin).filter(Boolean)

// The site the browser actually uses. In production this is the Vercel URL, and it is where Stripe
// sends the customer back to. Set CLIENT_URL explicitly if the site ever moves.
const DEFAULT_SITE = 'https://course-web-dev.vercel.app'
const authOrigin = normalizeOrigin(process.env.BETTER_AUTH_URL)
const onHost = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.NODE_ENV === 'production')
const authLooksLikeSite = authOrigin && !/onrender\.com|localhost|127\.0\.0\.1/.test(authOrigin)
const clientUrl = normalizeOrigin(process.env.CLIENT_URL) || (authLooksLikeSite ? authOrigin : onHost ? DEFAULT_SITE : authOrigin) || DEFAULT_SITE

// Origins the browser may call us from. The configured ones plus this project's known homes, so a missing
// CLIENT_ORIGINS on the host can no longer take the whole production site down.
const knownOrigins = [
  DEFAULT_SITE,
  'https://book-store-db-o3h2.onrender.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://localhost:4000',
]
const origins = [...new Set([authOrigin, clientUrl, ...splitList(process.env.CLIENT_ORIGINS), ...knownOrigins].filter(Boolean))]
// Vercel gives every branch/preview deployment its own host name. Allow this project's previews only.
const previewPattern = /^https:\/\/course-web-dev-[a-z0-9-]+\.vercel\.app$/i
const isAllowedOrigin = (origin) => !origin || origins.includes(normalizeOrigin(origin)) || previewPattern.test(origin)

const currency = String(process.env.STRIPE_CURRENCY || 'usd').trim().toLowerCase()

export const config = {
  port: Number(process.env.PORT) || 4000,
  // Neon gives ...?sslmode=require. pg treats that as 'verify-full' anyway but prints a scary warning,
  // so we say 'verify-full' explicitly (same secure behaviour, no warning).
  databaseUrl: process.env.DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full'),
  authSecret: process.env.BETTER_AUTH_SECRET,
  publicUrl: process.env.BETTER_AUTH_URL,
  // where Stripe sends the customer back after paying (the website, not the API)
  clientUrl,
  // allowed browser origins: the configured ones plus the known live site and Vercel previews
  origins,
  isAllowedOrigin,
  isProd: process.env.NODE_ENV === 'production',

  // ---- payments (Stripe). The secret key is only ever read here, on the server. ----
  stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() || null,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || null,
  // Publishable key (pk_test_...) is meant to be public. With it the pay box opens INSIDE the page (Embedded Checkout).
  // Without it the shop falls back to sending the customer to Stripe's hosted page.
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY?.trim() || null,
  stripeUiMode: process.env.STRIPE_UI_MODE?.trim() || 'embedded',
  stripeCurrency: /^[a-z]{3}$/.test(currency) ? currency : 'usd',
  // Allow tests to point the Stripe SDK at a local stub. Never set these in production.
  stripeApiHost: process.env.STRIPE_API_HOST?.trim() || null,
  stripeApiPort: Number(process.env.STRIPE_API_PORT) || 443,
  stripeApiProtocol: process.env.STRIPE_API_PROTOCOL?.trim() || 'https',
}
