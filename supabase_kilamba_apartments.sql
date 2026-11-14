
-- ANGOLA LIFE 3D · Compra e mobília de apartamentos do Kilamba
-- Este ficheiro documenta as migrações aplicadas no projeto Supabase do jogo.
-- A compra é validada no servidor e cada piso só pode ter um proprietário.

create unique index if not exists properties_property_name_unique
  on public.properties (property_name);

create or replace function public.purchase_kilamba_apartment(
  p_property_name text,
  p_location_name text,
  p_price bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_property public.properties%rowtype;
  v_balance bigint;
begin
  if v_user is null then raise exception 'Inicia sessão para comprar um apartamento.'; end if;
  if p_property_name is null or p_property_name !~ '^Bloco [A-J] · Piso [1-4]$'
     or p_location_name is null or length(p_location_name) > 100 then
    raise exception 'Apartamento inválido.';
  end if;
  if p_price is distinct from 500000::bigint then raise exception 'Preço de compra inválido.'; end if;
  perform pg_advisory_xact_lock(hashtext(p_property_name));
  select * into v_property from public.properties where property_name=p_property_name;
  if found then
    if v_property.owner_id=v_user then
      return jsonb_build_object('ok',true,'already_owned',true,'property_id',v_property.id,'property_name',v_property.property_name);
    end if;
    raise exception 'Este apartamento já pertence a outro jogador.';
  end if;
  update public.profiles set money=money-500000 where id=v_user and money>=500000 returning money into v_balance;
  if not found then raise exception 'Saldo insuficiente. São necessários 500.000 Kz.'; end if;
  insert into public.properties(owner_id,property_name,property_type,location_name,interior_data)
  values(v_user,p_property_name,'apartamento T2',p_location_name,
    jsonb_build_object('floor',split_part(p_property_name,'Piso ',2),'furnished',false))
  returning * into v_property;
  return jsonb_build_object('ok',true,'already_owned',false,'property_id',v_property.id,'property_name',v_property.property_name,'balance',v_balance);
end;
$function$;
revoke all on function public.purchase_kilamba_apartment(text,text,bigint) from public,anon;
grant execute on function public.purchase_kilamba_apartment(text,text,bigint) to authenticated;

insert into public.game_catalog(item_key,item_name,category,price,active)
values('furniture:Planta decorativa','Planta decorativa','furniture',5000,true)
on conflict(item_key) do update set item_name=excluded.item_name,category=excluded.category,price=excluded.price,active=true;

create or replace function public.save_kilamba_apartment_furniture(p_property_id uuid,p_furniture jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_property public.properties%rowtype;
  v_item jsonb;
begin
  if v_user is null then raise exception 'Inicia sessão para mobilar o apartamento.'; end if;
  if p_furniture is null or jsonb_typeof(p_furniture)<>'array' or jsonb_array_length(p_furniture)>100 then
    raise exception 'Lista de móveis inválida.';
  end if;
  for v_item in select value from jsonb_array_elements(p_furniture) loop
    if jsonb_typeof(v_item)<>'object' or coalesce(v_item->>'type','') not in ('plant','table','chair')
      or not (v_item ? 'x' and v_item ? 'z' and v_item ? 'rotation')
      or abs((v_item->>'x')::numeric)>15 or abs((v_item->>'z')::numeric)>15 then
      raise exception 'Um dos móveis tem dados inválidos.';
    end if;
  end loop;
  update public.properties
  set interior_data=jsonb_set(coalesce(interior_data,'{}'::jsonb),'{furniture}',p_furniture,true)
  where id=p_property_id and owner_id=v_user returning * into v_property;
  if not found then raise exception 'Este apartamento não pertence à tua conta.'; end if;
  return jsonb_build_object('ok',true,'property_id',v_property.id,'furniture_count',jsonb_array_length(p_furniture));
end;
$function$;
revoke all on function public.save_kilamba_apartment_furniture(uuid,jsonb) from public,anon;
grant execute on function public.save_kilamba_apartment_furniture(uuid,jsonb) to authenticated;
