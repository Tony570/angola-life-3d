create or replace function public.save_player_home_decor(p_room text, p_settings jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_item jsonb;
  v_key text;
  v_count integer;
  v_other_count integer;
  v_owned integer;
  v_x numeric;
  v_z numeric;
  v_rotation numeric;
begin
  if v_uid is null then raise exception 'Inicia sessão.'; end if;
  if p_room not in ('sala','quarto','cozinha','banheiro') then raise exception 'Divisão inválida.'; end if;
  if jsonb_typeof(p_settings) <> 'object' then raise exception 'Decoração inválida.'; end if;

  if coalesce(p_settings->>'wallColor','') !~ '^#[0-9A-Fa-f]{6}$'
     or coalesce(p_settings->>'floorColor','') !~ '^#[0-9A-Fa-f]{6}$'
     or coalesce(p_settings->>'rugColor','') !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Escolhe cores válidas para as paredes, o chão e o tapete.';
  end if;

  if jsonb_typeof(coalesce(p_settings->'items','[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_settings->'items','[]'::jsonb)) > 12 then
    raise exception 'Podes colocar até 12 móveis por divisão.';
  end if;

  perform 1 from public.player_furniture_inventory
  where user_id = v_uid order by item_key for update;

  for v_item in select value from jsonb_array_elements(coalesce(p_settings->'items','[]'::jsonb))
  loop
    v_key := v_item->>'key';
    v_x := nullif(v_item->>'x','')::numeric;
    v_z := nullif(v_item->>'z','')::numeric;
    v_rotation := coalesce(nullif(v_item->>'rotation','')::numeric,0);

    if v_key is null or v_x is null or v_z is null
       or v_x < -3.2 or v_x > 3.2 or v_z < -3.2 or v_z > 3.2
       or v_rotation < 0 or v_rotation > 359 then
      raise exception 'A posição ou rotação de um móvel está fora dos limites da divisão.';
    end if;

    select count(*) into v_count from jsonb_array_elements(coalesce(p_settings->'items','[]'::jsonb)) e where e->>'key'=v_key;
    select coalesce(sum(room_items.item_count),0)::integer into v_other_count
    from public.player_home_decor d
    cross join lateral (
      select count(*)::integer as item_count
      from jsonb_array_elements(coalesce(d.settings->'items','[]'::jsonb)) e
      where e->>'key'=v_key
    ) room_items
    where d.user_id=v_uid and d.room<>p_room;

    select quantity into v_owned from public.player_furniture_inventory where user_id=v_uid and item_key=v_key;
    if coalesce(v_owned,0)<v_count+coalesce(v_other_count,0) then
      raise exception 'Não tens unidades suficientes de % para todas as divisões.',v_key;
    end if;
  end loop;

  insert into public.player_home_decor(user_id,room,settings,updated_at)
  values(v_uid,p_room,p_settings,now())
  on conflict(user_id,room) do update set settings=excluded.settings,updated_at=now();

  return jsonb_build_object('saved',true,'room',p_room);
end;
$function$;
