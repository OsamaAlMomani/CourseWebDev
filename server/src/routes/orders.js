import { Router } from 'express'
import { query, transaction } from '../db.js'
import { httpError } from '../middleware.js'

const router = Router() // mounted behind requireAuth

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

// GET /api/orders -> my past orders, newest first, each with its lines (json_agg packs the lines into one JSON list per order)
router.get('/', async (req, res) => {
  const { rows } = await query(
    `select o.id, o.total_cents, o.status, o.created_at, o.ship_name, o.ship_address, o.ship_country,
            coalesce(
              json_agg(json_build_object('bookId', i.book_id, 'title', i.title, 'quantity', i.quantity, 'unitPriceCents', i.unit_price_cents)
                       order by i.title) filter (where i.book_id is not null),
              '[]') as items
       from orders o left join order_items i on i.order_id = o.id
      where o.user_id = $1
      group by o.id
      order by o.created_at desc`,
    [req.user.id],
  )
  res.json(
    rows.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total_cents / 100,
      createdAt: o.created_at,
      shipTo: { name: o.ship_name, address: o.ship_address, country: o.ship_country },
      items: o.items.map((i) => ({ bookId: i.bookId, title: i.title, quantity: i.quantity, unitPrice: i.unitPriceCents / 100 })),
    })),
  )
})

// POST /api/orders  { name, address, country } -> turns the cart into an order.
// Everything happens inside ONE transaction: check stock, reduce stock, write the order, empty the cart.
// If any step fails, all of it is undone, so nobody is charged for a half-finished order.
router.post('/', async (req, res) => {
  const name = clean(req.body?.name, 120)
  const address = clean(req.body?.address, 300)
  const country = clean(req.body?.country, 80)
  if (!name || !address || !country) throw httpError(400, 'Please fill in your name, address and country.')

  const order = await transaction(async (db) => {
    // order by book_id so two people checking out at once always lock rows in the same order (avoids deadlocks)
    const { rows: lines } = await db.query(
      `select c.book_id, c.quantity, b.title, b.price_cents
         from cart_items c join books b on b.id = c.book_id
        where c.user_id = $1 order by c.book_id`,
      [req.user.id],
    )
    if (!lines.length) throw httpError(400, 'Your cart is empty.')

    for (const line of lines) {
      // "stock >= quantity" inside the UPDATE makes the check and the change one atomic step (no overselling)
      const result = await db.query('update books set stock = stock - $2 where id = $1 and stock >= $2', [line.book_id, line.quantity])
      if (result.rowCount === 0) throw httpError(409, `Sorry, "${line.title}" doesn't have enough copies left.`)
    }

    const totalCents = lines.reduce((sum, l) => sum + l.price_cents * l.quantity, 0)
    const {
      rows: [created],
    } = await db.query(
      `insert into orders (user_id, total_cents, ship_name, ship_address, ship_country)
       values ($1, $2, $3, $4, $5) returning id`,
      [req.user.id, totalCents, name, address, country],
    )
    // copy title + price into the order lines (the "snapshot")
    await db.query(
      `insert into order_items (order_id, book_id, title, unit_price_cents, quantity)
       select $1, c.book_id, b.title, b.price_cents, c.quantity
         from cart_items c join books b on b.id = c.book_id where c.user_id = $2`,
      [created.id, req.user.id],
    )
    await db.query('delete from cart_items where user_id = $1', [req.user.id])
    return { id: created.id, total: totalCents / 100 }
  })

  res.status(201).json(order)
})

export default router
