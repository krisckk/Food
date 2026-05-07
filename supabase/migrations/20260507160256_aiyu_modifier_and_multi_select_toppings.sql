-- Soft-delete standalone item (avoids FK issues on existing order_items)
update public.menu_items set available = false where name = '體驗手搓愛玉';

-- Add 體驗手搓愛玉 as a +$20 paid modifier on 愛玉冬瓜檸檬
insert into public.menu_item_modifiers (menu_item_id, name, price_delta, display_order)
select id, '體驗手搓愛玉', 20, 1 from public.menu_items where name = '愛玉冬瓜檸檬';

-- Add "multiple":true to 雪花冰 配料 group
update public.menu_items
set customization_options = '{"groups":[{"name":"口味","required":true,"options":["牛奶","巧克力"]},{"name":"配料","required":false,"multiple":true,"options":["湯圓","珍珠","脆笛蘇","棉花糖","巧克力碎","煉乳"]}]}'::jsonb
where name = '雪花冰';
