-- Add English text columns to menu_items.
-- All columns are nullable; the app falls back to the zh-TW columns when _en is null.
ALTER TABLE public.menu_items
  ADD COLUMN name_en                  text,
  ADD COLUMN description_en           text,
  ADD COLUMN category_en              text,
  ADD COLUMN customization_options_en jsonb;

-- Add English text column to menu_item_modifiers.
ALTER TABLE public.menu_item_modifiers
  ADD COLUMN name_en text;
