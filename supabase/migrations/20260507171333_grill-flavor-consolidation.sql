-- Soft-delete the five old rows (FK-safe)
UPDATE public.menu_items SET available = false
WHERE name IN (
  '海苔飯卷 日式鮪魚沙拉','海苔飯卷 古早味肉香','海苔飯卷 kimchi豬肉',
  '熱壓吐司 皮蛋肉鬆','熱壓吐司 巧克力脆脆'
);

-- Insert consolidated items
INSERT INTO public.menu_items (name, description, price, category, image_url) VALUES
  ('海苔飯卷', null, 65, '烤物', '/images/grill/2.jpg'),
  ('熱壓吐司', null, 50, '烤物', '/images/grill/3.jpg');

-- Set per-option-price customization groups
UPDATE public.menu_items
SET customization_options = '{"groups":[{"name":"口味","required":true,"options":[{"label":"古早味肉香","price_delta":0},{"label":"日式鮪魚沙拉","price_delta":0},{"label":"kimchi豬肉","price_delta":10}]}]}'::jsonb
WHERE name = '海苔飯卷' AND available = true;

UPDATE public.menu_items
SET customization_options = '{"groups":[{"name":"口味","required":true,"options":[{"label":"巧克力脆脆","price_delta":0},{"label":"皮蛋肉鬆","price_delta":10}]}]}'::jsonb
WHERE name = '熱壓吐司' AND available = true;
