-- ANGOLA LIFE 3D: moderação do chat público.
-- Aplicado no projeto Supabase bxytwtzihwobriozvknx.

create table if not exists public.player_chat_offenses (
  player_id uuid primary key references auth.users(id) on delete cascade,
  offensive_words integer not null default 0 check (offensive_words >= 0),
  updated_at timestamptz not null default now()
);

alter table public.player_chat_offenses enable row level security;
grant select, insert, update on public.player_chat_offenses to authenticated;

drop policy if exists "Players can read their own chat offense count" on public.player_chat_offenses;
create policy "Players can read their own chat offense count"
on public.player_chat_offenses for select to authenticated
using ((select auth.uid()) = player_id);

drop policy if exists "Players can create their own chat offense count" on public.player_chat_offenses;
create policy "Players can create their own chat offense count"
on public.player_chat_offenses for insert to authenticated
with check ((select auth.uid()) = player_id);

drop policy if exists "Players can update their own chat offense count" on public.player_chat_offenses;
create policy "Players can update their own chat offense count"
on public.player_chat_offenses for update to authenticated
using ((select auth.uid()) = player_id)
with check ((select auth.uid()) = player_id);

create or replace function public.register_public_chat_message(p_message text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_words text[];
  v_offensive integer := 0;
  v_count integer := 0;
  v_fines integer := 0;
  v_balance bigint := null;
begin
  if (select auth.uid()) is null then
    raise exception 'É necessário iniciar sessão.';
  end if;
  if p_message is null or length(trim(p_message)) = 0 or length(p_message) > 240 then
    raise exception 'Mensagem inválida.';
  end if;

  v_words := regexp_split_to_array(
    translate(lower(p_message), 'áàâãéêíóôõúç', 'aaaaeeiooouc'),
    '[^a-z0-9]+'
  );

  select count(*)::integer into v_offensive
  from unnest(v_words) as token
  where token = any(array[
    'caralho', 'porra', 'merda', 'puta', 'puto',
    'foda', 'idiota', 'otario', 'vagabundo', 'burro'
  ]);

  if v_offensive = 0 then
    select coalesce(offensive_words, 0) into v_count
    from public.player_chat_offenses
    where player_id = (select auth.uid());
    return jsonb_build_object(
      'offensive_words', 0, 'total_count', coalesce(v_count, 0),
      'fines_applied', 0, 'fine_amount', 5000, 'balance', null
    );
  end if;

  insert into public.player_chat_offenses (player_id, offensive_words, updated_at)
  values ((select auth.uid()), v_offensive, now())
  on conflict (player_id) do update
  set offensive_words = public.player_chat_offenses.offensive_words + excluded.offensive_words,
      updated_at = now()
  returning offensive_words into v_count;

  while v_count >= 10 loop
    begin
      v_balance := public.spend_credits(5000);
      v_count := v_count - 10;
      v_fines := v_fines + 1;
    exception when others then
      exit;
    end;
  end loop;

  update public.player_chat_offenses
  set offensive_words = v_count, updated_at = now()
  where player_id = (select auth.uid());

  return jsonb_build_object(
    'offensive_words', v_offensive, 'total_count', v_count,
    'fines_applied', v_fines, 'fine_amount', 5000, 'balance', v_balance
  );
end;
$function$;

revoke all on function public.register_public_chat_message(text) from public, anon;
grant execute on function public.register_public_chat_message(text) to authenticated;
