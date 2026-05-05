-- customization_options: JSONB config for free-text choice groups (no price impact)
-- customization_note: stores the customer's selections as a snapshot text
alter table public.menu_items add column customization_options jsonb;
alter table public.order_items add column customization_note text;

-- Set up 雪花冰 choice groups: 口味 (required) and 配料 (optional)
update public.menu_items
set customization_options = '{"groups":[{"name":"口味","required":true,"options":["牛奶","巧克力"]},{"name":"配料","required":false,"options":["湯圓","珍珠","脆笛蘇","棉花糖","巧克力碎","煉乳"]}]}'::jsonb
where name = '雪花冰';
