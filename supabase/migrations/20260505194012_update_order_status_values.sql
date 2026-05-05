-- Replace old status values with new ones
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders alter column status set default '已點餐';
alter table public.orders add constraint orders_status_check
  check (status in ('已點餐', '已付款', '已做完', '已送達', 'Done'));

-- Migrate any existing rows
update public.orders set status = '已點餐' where status in ('pending', 'preparing');
update public.orders set status = 'Done'   where status = 'done';
