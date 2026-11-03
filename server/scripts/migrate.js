// Creates (or updates) all tables by running db/schema.sql (the shop), db/research.sql (Research & Book page)
// and db/stripe.sql (orders, order_items, stripe_events).
// Usage: npm run db:migrate
import { readFile } from 'node:fs/promises'
import { pool } from '../src/db.js'

for (const file of ['schema.sql', 'research.sql', 'stripe.sql']) {
  const sql = await readFile(new URL(`../db/${file}`, import.meta.url), 'utf8')
  await pool.query(sql) // the files have no parameters, so Postgres accepts many statements in one go
  console.log(`${file} is up to date.`)
}
await pool.end()
