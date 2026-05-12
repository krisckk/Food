-- Add Pork Floss Cake (肉鬆小貝) to menu items
INSERT INTO public.menu_items (
  name, 
  name_en, 
  price, 
  category, 
  category_en, 
  image_url,
  customization_options,
  customization_options_en
) VALUES (
  '肉鬆小貝',
  'Pork Floss Cake',
  35,
  '創新',
  'Desserts',
  '/images/創新/肉鬆小貝.jpg',
  '{"groups":[{"name":"數量","required":true,"multiple":false,"options":[{"label":"一顆","price_delta":0},{"label":"四顆","price_delta":85}]}]}'::jsonb,
  '{"groups":[{"name":"Pack Size","required":true,"multiple":false,"options":[{"label":"1 pc","price_delta":0},{"label":"4 pcs","price_delta":85}]}]}'::jsonb
);
