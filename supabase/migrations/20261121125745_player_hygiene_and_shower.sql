alter table public.player_needs
  add column if not exists hygiene integer not null default 100;

alter table public.player_needs
  drop constraint if exists player_needs_hygiene_check;

alter table public.player_needs
  add constraint player_needs_hygiene_check check (hygiene >= 0 and hygiene <= 100);

create or replace function public.get_player_needs()
returns public.player_needs
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_row public.player_needs;
  v_minutes integer;
begin
  if v_uid is null then
    raise exception 'Inicia sessão.';
  end if;

  insert into public.player_needs(user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  select * into v_row
  from public.player_needs
  where user_id = v_uid
  for update;

  v_minutes := greatest(0, floor(extract(epoch from (now() - v_row.updated_at)) / 60)::integer);

  if v_minutes > 0 then
    update public.player_needs
    set energy = greatest(0, energy - floor(v_minutes / 90.0)::integer),
        hunger = greatest(0, hunger - floor(v_minutes / 22.0)::integer),
        hydration = greatest(0, hydration - floor(v_minutes / 16.0)::integer),
        hygiene = greatest(0, hygiene - floor(v_minutes / 60.0)::integer),
        updated_at = updated_at + make_interval(mins => v_minutes)
    where user_id = v_uid
    returning * into v_row;
  end if;

  return v_row;
end;
$function$;

create or replace function public.take_player_shower()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_hygiene integer;
begin
  if v_uid is null then
    raise exception 'Inicia sessão.';
  end if;

  insert into public.player_needs(user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  update public.player_needs
  set hygiene = 100,
      updated_at = now()
  where user_id = v_uid
  returning hygiene into v_hygiene;

  return jsonb_build_object('hygiene', v_hygiene, 'message', 'Banho concluído.');
end;
$function$;

revoke all on function public.take_player_shower() from public;
revoke all on function public.take_player_shower() from anon;
grant execute on function public.take_player_shower() to authenticated;
