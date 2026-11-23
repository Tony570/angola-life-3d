CREATE OR REPLACE FUNCTION public.city_transit_update_bus(
 p_bus_id text,
 p_x double precision,
 p_z double precision,
 p_rotation double precision,
 p_current_node text,
 p_route_index integer,
 p_requested_node text,
 p_active_path text[],
 p_path_index integer,
 p_status text,
 p_doors_open boolean,
 p_stop_until timestamp with time zone
)
RETURNS public.city_transit_buses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
declare
 v_uid uuid := auth.uid();
 v_bus public.city_transit_buses;
begin
 if v_uid is null then
  raise exception 'Inicia sessão.';
 end if;

 -- A rede rodoviária real vai de x=-70 a 330 e de z=-130 a 96.
 -- A margem permite a dimensão do autocarro sem aceitar posições fora da cidade.
 if p_x is null or p_z is null or p_x not between -80 and 340 or p_z not between -140 and 106 then
  raise exception 'Posição do autocarro inválida.';
 end if;
 if p_status not in ('moving','stopped') then
  raise exception 'Estado do autocarro inválido.';
 end if;
 if not exists(select 1 from public.city_transit_road_nodes where node_id=p_current_node) then
  raise exception 'Estrada inválida.';
 end if;
 if p_requested_node is not null and not exists(select 1 from public.city_transit_road_nodes where node_id=p_requested_node) then
  raise exception 'Paragem inválida.';
 end if;
 if p_active_path is not null and exists(
  select 1 from unnest(p_active_path) n
  where not exists(select 1 from public.city_transit_road_nodes r where r.node_id=n)
 ) then
  raise exception 'Percurso inválido.';
 end if;

 update public.city_transit_buses
 set x=p_x,z=p_z,rotation=p_rotation,current_node=p_current_node,
     route_index=greatest(0,p_route_index),requested_node=p_requested_node,
     active_path=p_active_path,path_index=greatest(0,p_path_index),
     status=p_status,doors_open=p_doors_open,stop_until=p_stop_until,
     controller_until=now()+interval '15 seconds',updated_at=now()
 where bus_id=p_bus_id and controller_id=v_uid and controller_until>now()
 returning * into v_bus;

 if not found then
  raise exception 'O controlo deste autocarro expirou. A sincronizar novamente.';
 end if;

 update public.social_world_presence
 set x=p_x,z=p_z,updated_at=now()
 where user_id in (
  select user_id from public.city_transit_passengers
  where bus_id=p_bus_id and status='onboard'
 );

 return v_bus;
end;
$function$;
