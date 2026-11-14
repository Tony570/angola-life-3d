-- ANGOLA LIFE 3D · Catálogo adicional de vestuário
-- Executar uma vez no Supabase SQL Editor.
-- Acrescenta modelos de roupa sem apagar artigos nem inventário existente.

insert into public.game_catalog (item_key, item_name, category, price, active)
values
  ('clothing:T-shirt básica branca', 'T-shirt básica branca', 'clothing', 8000, true),
  ('clothing:T-shirt preta estampada', 'T-shirt preta estampada', 'clothing', 11000, true),
  ('clothing:T-shirt desportiva', 'T-shirt desportiva', 'clothing', 14500, true),
  ('clothing:Polo clássico', 'Polo clássico', 'clothing', 16000, true),
  ('clothing:Camisa social branca', 'Camisa social branca', 'clothing', 18000, true),
  ('clothing:Camisa xadrez', 'Camisa xadrez', 'clothing', 17500, true),
  ('clothing:Camisa africana estampada', 'Camisa africana estampada', 'clothing', 26000, true),
  ('clothing:Calças de ganga azuis', 'Calças de ganga azuis', 'clothing', 22000, true),
  ('clothing:Calças de ganga pretas', 'Calças de ganga pretas', 'clothing', 24000, true),
  ('clothing:Calças clássicas', 'Calças clássicas', 'clothing', 19000, true),
  ('clothing:Calções desportivos', 'Calções desportivos', 'clothing', 12000, true),
  ('clothing:Vestido casual', 'Vestido casual', 'clothing', 28000, true),
  ('clothing:Vestido elegante', 'Vestido elegante', 'clothing', 42000, true),
  ('clothing:Casaco casual', 'Casaco casual', 'clothing', 32000, true),
  ('clothing:Blusão desportivo', 'Blusão desportivo', 'clothing', 38000, true),
  ('clothing:Sapatos sociais', 'Sapatos sociais', 'clothing', 26000, true),
  ('clothing:Ténis brancos', 'Ténis brancos', 'clothing', 30000, true),
  ('clothing:Ténis desportivos', 'Ténis desportivos', 'clothing', 42000, true),
  ('clothing:Botas urbanas', 'Botas urbanas', 'clothing', 45000, true)
on conflict (item_key) do update
set item_name = excluded.item_name,
    category = excluded.category,
    price = excluded.price,
    active = true;
