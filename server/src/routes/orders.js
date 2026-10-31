import { Router } from 'express'
import { query } from '../db.js'
import { httpError } from '../middleware.js'

const router = Router() // mounted behind requireAuth

const ORDER_COLUMNS = `o.id, o.status, o.total_cents, o.currency, o.created_at, o.paid_at,
                       o.ship_name, o.ship_address, o.ship_country`

// One shape for every endpoint. "paid" is derived from the status the webhook sets; the browser
// can never make an order look paid by changing a request.
const toOrder = (row, items) => ({
  id: row.id,
  status: row.status,
  paid: row.status === 'paid',
  total: row.total_cents / 100,
  currency: row.currency ?? 'usd',
  createdAt: row.created_at,
  paidAt: row.paid_at,
  shipTo: {
    name: row.ship_name ?? '',
    address: row.ship_address ?? '',
    country: row.ship_country ?? '',
  },
  items: items.map((i) => ({
    bookId: i.book_id,
    title: i.title,
    quantity: i.quantity,
    unitPrice: i.unit_price_cents / 100,
  })),
})

// GET /api/orders -> my past orders, newest first, each with its lines
// (json_agg packs the lines into one JSON list per order instead of N+1 queries)
router.get('/', async (req, res) => {
  const { rows } = await query(
    `select ${ORDER_COLUMNS},
            coalesce(
              json_agg(json_build_object('book_id', i.book_id, 'title', i.title, 'quantity', i.quantity, 'unit_price_cents', i.unit_price_cents)
                       order by i.title) filter (where i.book_id is not null),
              '[]') as items
       from orders o left join order_items i on i.order_id = o.id
      where o.user_id = $1
      group by o.id
      order by o.created_at desc`,
    [req.user.id],
  )
  res.set('Cache-Control', 'no-store').json(rows.map((row) => toOrder(row, row.items)))
})

// GET /api/orders/:id -> one of MY orders. The success page polls this while the webhook is on its way.
// It only READS: marking an order paid is the webhook's job, never the page's.
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) throw httpError(404, 'Order not found.')

  const { rows } = await query(`select ${ORDER_COLUMNS} from orders o where o.id = $1 and o.user_id = $2`, [id, req.user.id])
  if (!rows[0]) throw httpError(404, 'Order not found.')

  const { rows: items } = await query(
    'select book_id, title, unit_price_cents, quantity from order_items where order_id = $1 order by title',
    [id],
  )
  res.set('Cache-Control', 'no-store').json(toOrder(rows[0], items))
})

export default router
