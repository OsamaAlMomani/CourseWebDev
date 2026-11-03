-- Payments schema. Safe to run any number of times (npm run db:migrate).
-- It creates orders / order_items / stripe_events if they are missing, and adds any column
-- the Stripe code needs if an older version of the table is already there.

create table if not exists orders (
  id                          serial primary key,
  user_id                     text not null references "user"(id) on delete cascade,
  total_cents                 integer not null check (total_cents >= 0),
  status                      text not null default 'pending',
  currency                    text not null default 'usd',
  customer_email              text,
  ship_name                   text,
  ship_address                text,
  ship_country                text,
  stock_reserved              boolean not null default false,
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text,
  paid_at                     timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- older orders table (from before Stripe): add whatever is missing
alter table orders add column if not exists currency                   text not null default 'usd';
alter table orders add column if not exists customer_email             text;
alter table orders add column if not exists ship_name                  text;
alter table orders add column if not exists ship_address               text;
alter table orders add column if not exists ship_country               text;
alter table orders add column if not exists stock_reserved             boolean not null default false;
alter table orders add column if not exists stripe_checkout_session_id text;
alter table orders add column if not exists stripe_payment_intent_id   text;
alter table orders add column if not exists paid_at                    timestamptz;
alter table orders add column if not exists updated_at                 timestamptz not null default now();

-- an old CHECK on status (e.g. only 'placed') would block 'pending' / 'paid'. Replace it.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'orders'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table orders drop constraint %I', c.conname);
  end loop;
end $$;
alter table orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'cancelled', 'failed', 'refunded', 'placed'));

create unique index if not exists orders_session_uidx on orders (stripe_checkout_session_id) where stripe_checkout_session_id is not null;
create index if not exists orders_user_idx    on orders (user_id, created_at desc);
create index if not exists orders_payment_idx on orders (stripe_payment_intent_id);

-- one row per book in an order. The price is copied here at purchase time, so changing a book's
-- price later never rewrites history.
create table if not exists order_items (
  id                serial primary key,
  order_id          integer not null references orders(id) on delete cascade,
  book_id           text references books(id) on delete set null,
  title             text not null,
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  quantity          integer not null check (quantity > 0)
);
alter table order_items add column if not exists title            text;
alter table order_items add column if not exists unit_price_cents integer;
create index if not exists order_items_order_idx on order_items (order_id);

-- every Stripe event we handled, so a retried webhook is harmless
create table if not exists stripe_events (
  id          text primary key,
  type        text not null,
  order_id    integer references orders(id) on delete set null,
  received_at timestamptz not null default now()
);
