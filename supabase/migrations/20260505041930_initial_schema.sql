-- menu items that customers browse
create table public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       numeric(10,2) not null check (price >= 0),
  category    text not null,
  image_url   text,
  available   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- one row per customer order
create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  customer_name  text not null,
  customer_email text,
  total          numeric(10,2) not null check (total >= 0),
  status         text not null default 'pending'
                   check (status in ('pending', 'preparing', 'done')),
  notion_page_id text,
  created_at     timestamptz not null default now()
);

-- line items linking orders <-> menu_items
create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id),
  quantity     integer not null default 1 check (quantity > 0),
  unit_price   numeric(10,2) not null  -- price snapshot at order time
);

-- RLS: all tables locked down; only anon gets menu read
alter table public.menu_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- public menu browsing via anon key
create policy "menu_items: public read"
  on public.menu_items for select to anon, authenticated using (true);

-- orders and order_items have no client-facing policies --
-- all writes go through API routes using the service role key (bypasses RLS)
