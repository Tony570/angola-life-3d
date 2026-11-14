-- ANGOLA LIFE 3D · Integração online
-- Executar no projeto Supabase bxytwtzihwobriozvknx depois de supabase.sql.
-- Não apaga dados dos jogadores.

-- Perfis: leitura permitida, mas nenhuma escrita direta pelo navegador.
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_read_authenticated on public.profiles;
-- A política profiles_read já existente continua a permitir a leitura autenticada.

revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- Operações financeiras e transferências só podem ser chamadas por jogadores autenticados.
revoke all on function public.create_player_profile() from public, anon, authenticated;
revoke all on function public.move_wallet_to_bank(bigint, boolean, uuid) from public, anon;
revoke all on function public.purchase_game_item(text, integer, uuid) from public, anon;
revoke all on function public.transfer_inventory_item(text, text, integer, uuid) from public, anon;
revoke all on function public.transfer_money(text, bigint, uuid) from public, anon;
revoke all on function public.spend_credits(bigint) from public, anon;

grant execute on function public.move_wallet_to_bank(bigint, boolean, uuid) to authenticated;
grant execute on function public.purchase_game_item(text, integer, uuid) to authenticated;
grant execute on function public.transfer_inventory_item(text, text, integer, uuid) to authenticated;
grant execute on function public.transfer_money(text, bigint, uuid) to authenticated;
grant execute on function public.spend_credits(bigint) to authenticated;

-- Compra de vários artigos numa única operação atómica (por exemplo, um pedido de restaurante).
create or replace function public.purchase_game_order(p_items jsonb, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_line jsonb;
  v_item public.game_catalog%rowtype;
  v_item_key text;
  v_quantity integer;
  v_total bigint := 0;
  v_balance bigint;
  v_existing public.game_transactions%rowtype;
  v_details jsonb := '[]'::jsonb;
begin
  if v_user is null then raise exception 'Inicia sessão para comprar.'; end if;
  if p_request_id is null then raise exception 'Pedido inválido.'; end if;
  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Lista de produtos inválida.';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then
    raise exception 'Lista de produtos inválida.';
  end if;

  select * into v_existing
  from public.game_transactions
  where actor_id = v_user and request_id = p_request_id;

  if found then
    return jsonb_build_object('ok', true, 'replayed', true, 'transaction_id', v_existing.id);
  end if;

  for v_line in select value from jsonb_array_elements(p_items)
  loop
    v_item_key := nullif(v_line ->> 'item_key', '');
    v_quantity := (v_line ->> 'quantity')::integer;
    if v_item_key is null or v_quantity is null or v_quantity < 1 or v_quantity > 30 then
      raise exception 'Produto ou quantidade inválida.';
    end if;

    select * into v_item
    from public.game_catalog
    where item_key = v_item_key and active = true;

    if not found then raise exception 'Produto indisponível: %.', v_item_key; end if;

    v_total := v_total + (v_item.price * v_quantity);
    if v_total > 1000000000 then raise exception 'Valor total demasiado elevado.'; end if;

    v_details := v_details || jsonb_build_array(jsonb_build_object(
      'item_key', v_item.item_key,
      'item_name', v_item.item_name,
      'category', v_item.category,
      'quantity', v_quantity,
      'unit_price', v_item.price
    ));
  end loop;

  update public.profiles
  set money = money - v_total
  where id = v_user and money >= v_total
  returning money into v_balance;

  if not found then raise exception 'Saldo insuficiente.'; end if;

  for v_line in select value from jsonb_array_elements(v_details)
  loop
    insert into public.player_inventory(player_id, item_key, item_name, category, quantity)
    values(v_user, v_line ->> 'item_key', v_line ->> 'item_name',
      v_line ->> 'category', (v_line ->> 'quantity')::integer)
    on conflict (player_id, item_key)
    do update set quantity = public.player_inventory.quantity + excluded.quantity,
      updated_at = now();
  end loop;

  insert into public.game_transactions(
    request_id, actor_id, transaction_type, amount, details
  ) values (
    p_request_id, v_user, 'purchase', v_total, jsonb_build_object('items', v_details)
  );

  return jsonb_build_object('ok', true, 'balance', v_balance, 'total', v_total, 'items', v_details);
end;
$function$;

revoke all on function public.purchase_game_order(jsonb, uuid) from public, anon;
grant execute on function public.purchase_game_order(jsonb, uuid) to authenticated;
