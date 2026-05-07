-- Dev seed data — real menu
insert into public.menu_items (name, description, price, category, image_url) values
  -- 烤物 (Grilled)
  ('海苔飯卷 日式鮪魚沙拉', null,                      65, '烤物', '/images/grill/2.jpg'),
  ('海苔飯卷 古早味肉香',   null,                      65, '烤物', '/images/grill/2.jpg'),
  ('海苔飯卷 kimchi豬肉',   null,                      75, '烤物', '/images/grill/2.jpg'),
  ('熱壓吐司 皮蛋肉鬆',    null,                      60, '烤物', '/images/grill/3.jpg'),
  ('熱壓吐司 巧克力脆脆',  null,                      50, '烤物', null),
  ('台式肉燥飯',           '含油豆腐',                 50, '烤物', '/images/grill/1.jpg'),

  -- 創新 (Desserts)
  ('提拉米蘇',            null,                       50, '創新', null),
  ('杜拜巧克力',          null,                      100, '創新', '/images/創新/杜拜巧克力.jpg'),
  ('檸檬糖霜磅蛋糕',      null,                       35, '創新', '/images/創新/檸檬糖霜磅蛋糕.jpg'),
  ('千層蛋糕',            null,                       70, '創新', '/images/創新/千層蛋糕.jpg'),
  ('焦糖烤布蕾',          null,                       30, '創新', '/images/創新/焦糖烤布蕾.jpg'),
  ('脆皮布朗尼',          null,                       45, '創新', '/images/創新/脆皮布朗尼.jpg'),
  ('貓舌頭',              null,                       20, '創新', '/images/創新/貓舌頭.jpg'),
  ('葡式蛋撻',            null,                       45, '創新', null),
  ('巴斯克蛋糕 原味',     null,                       70, '創新', '/images/創新/原味巴斯克蛋糕.jpg'),
  ('巴斯克蛋糕 巧克力',   null,                       75, '創新', '/images/創新/巧克力巴斯克蛋糕.jpg'),
  ('曲奇 原味',           null,                       30, '創新', '/images/創新/原味曲奇.jpg'),
  ('曲奇 巧克力',         null,                       30, '創新', null),
  ('脆皮原味蛋糕',        null,                       30, '創新', '/images/創新/脆皮原味蛋糕.jpg'),
  ('費南雪',              null,                       45, '創新', '/images/創新/費南雪.jpg'),

  -- 冰物 (Cold)
  ('雪花冰',              null,                       60, '冰物', '/images/ice/3.jpg'),
  ('愛玉冬瓜檸檬',        null,                       35, '冰物', '/images/ice/2.jpg'),
  ('仙草凍',                null,                       45, '冰物', '/images/ice/1.jpg');

-- Modifiers for 台式肉燥飯
insert into public.menu_item_modifiers (menu_item_id, name, price_delta, display_order)
select id, '加滷蛋',   10, 1 from public.menu_items where name = '台式肉燥飯'
union all
select id, '加滷豆乾', 10, 2 from public.menu_items where name = '台式肉燥飯';

-- Modifier for 雪花冰 (paid add-on; flavor/topping choices are stored via customization_note)
insert into public.menu_item_modifiers (menu_item_id, name, price_delta, display_order)
select id, '加布丁', 15, 1 from public.menu_items where name = '雪花冰';

-- Modifier for 愛玉冬瓜檸檬 (體驗手搓愛玉 upsell)
insert into public.menu_item_modifiers (menu_item_id, name, price_delta, display_order)
select id, '體驗手搓愛玉', 20, 1 from public.menu_items where name = '愛玉冬瓜檸檬';

-- Customization groups for 雪花冰 (口味 required, 配料 optional)
update public.menu_items
set customization_options = '{"groups":[{"name":"口味","required":true,"options":["牛奶","巧克力"]},{"name":"配料","required":false,"multiple":true,"options":["湯圓","珍珠","脆笛蘇","棉花糖","巧克力碎","煉乳"]}]}'::jsonb
where name = '雪花冰';
