UPDATE public.menu_items
SET name = '脆皮蛋糕'
WHERE name = '脆皮原味蛋糕';

UPDATE public.menu_items
SET customization_options = '{"groups":[{"name":"口味","required":true,"options":[{"label":"原味","price_delta":0},{"label":"開心果","price_delta":10},{"label":"巧克力","price_delta":0}]}]}'::jsonb
WHERE name = '脆皮蛋糕';
