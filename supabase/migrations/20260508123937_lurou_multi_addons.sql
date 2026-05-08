-- Migrate 台式肉燥飯 add-ons to multi-select customization_options
UPDATE public.menu_items
SET customization_options = '{"groups":[{"name":"加料","required":false,"multiple":true,"options":[{"label":"加滷蛋","price_delta":10},{"label":"加滷豆乾","price_delta":10}]}]}'::jsonb
WHERE name = '台式肉燥飯';

-- Hide the now-redundant modifier rows (can't delete — order_items FK references them)
UPDATE public.menu_item_modifiers
SET available = false
WHERE menu_item_id = (SELECT id FROM public.menu_items WHERE name = '台式肉燥飯');
