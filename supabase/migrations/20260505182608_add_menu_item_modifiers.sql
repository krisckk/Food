-- Optional add-ons that can be attached to specific menu items
create table public.menu_item_modifiers (
  id            uuid primary key default gen_random_uuid(),
  menu_item_id  uuid not null references public.menu_items(id) on delete cascade,
  name          text not null,
  price_delta   numeric(10,2) not null default 0 check (price_delta >= 0),
  available     boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.menu_item_modifiers enable row level security;

create policy "menu_item_modifiers: public read"
  on public.menu_item_modifiers for select to anon, authenticated using (true);

-- Track which modifier was chosen per order line (nullable — most items have none)
alter table public.order_items
  add column modifier_id   uuid references public.menu_item_modifiers(id),
  add column modifier_name text;
