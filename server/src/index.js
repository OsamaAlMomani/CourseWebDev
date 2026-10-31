import { app } from './app.js'
import { config } from './config.js'
import { paymentsEnabled } from './stripe.js'
import { ensureResearch } from './researchSetup.js'

app.listen(config.port, () => {
  console.log(`GlobalBooks API listening on port ${config.port}`)
  console.log(`[site] payment return address: ${config.clientUrl}`)
  if (!paymentsEnabled) {
    console.warn('[stripe] STRIPE_SECRET_KEY is not set: the shop runs, but checkout will answer 503.')
  } else if (!config.stripeWebhookSecret) {
    console.warn('[stripe] STRIPE_WEBHOOK_SECRET is not set: orders can be created but can never be marked paid.')
  }
  ensureResearch() // create + fill the Research & Book tables if needed, then keep the news fresh
})
