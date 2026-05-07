-- Soft-delete old items (preserves FK integrity on existing order_items)
UPDATE public.menu_items
SET available = false
WHERE name IN ('曲奇 原味', '曲奇 巧克力');

-- Insert consolidated item
INSERT INTO public.menu_items (name, description, price, category, image_url)
VALUES ('曲奇', null, 30, '創新', '/images/創新/原味曲奇.jpg');

-- Set flavor selector (mirrors 雪花冰 口味 pattern)
UPDATE public.menu_items
SET customization_options = '{"groups":[{"name":"口味","required":true,"options":["原味","巧克力"]}]}'::jsonb
WHERE name = '曲奇' AND available = true;
