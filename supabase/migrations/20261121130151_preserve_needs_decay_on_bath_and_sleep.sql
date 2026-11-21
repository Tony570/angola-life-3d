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

  -- Processa primeiro a fome, energia e hidratação acumuladas antes de actualizar o relógio.
  perform public.get_player_needs();

  update public.player_needs
  set hygiene = 100,
      updated_at = now()
  where user_id = v_uid
  returning hygiene into v_hygiene;

  return jsonb_build_object('hygiene', v_hygiene, 'message', 'Banho concluído.');
end;
$function$;

create or replace function public.sleep_player()
returns public.player_needs
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_row public.player_needs;
begin
  if v_uid is null then
    raise exception 'Inicia sessão.';
  end if;

  -- Aplica o consumo das necessidades antes de recuperar a energia.
  perform public.get_player_needs();

  update public.player_needs
  set energy = 100,
      hunger = greatest(0, hunger - 15),
      hydration = greatest(0, hydration - 20),
      updated_at = now()
  where user_id = v_uid
  returning * into v_row;

  return v_row;
end;
$function$;
