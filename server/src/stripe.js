import Stripe from 'stripe'
import { config } from './config.js'

// The Stripe SDK talks to Stripe's API with our SECRET key. That key must never reach the browser.
// When it is missing the shop still runs; checkout answers 503 with a clear message instead of crashing.
const options = { maxNetworkRetries: 2, timeout: 20_000 }
if (config.stripeApiHost) {
  // Used only by the automated checkout test, which points the SDK at a local fake Stripe.
  Object.assign(options, { host: config.stripeApiHost, port: config.stripeApiPort, protocol: config.stripeApiProtocol })
}

export const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey, options) : null
export const paymentsEnabled = Boolean(stripe)
export const testMode = Boolean(config.stripeSecretKey?.startsWith('sk_test_'))
