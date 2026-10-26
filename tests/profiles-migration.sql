begin;
-- Reconstruct the previous catalog only inside the isolated QA database.
delete from public.workshop_forms where id = 'tema4-perfiles';
create temp table profiles_token(token text);
do $$
declare account jsonb; payload jsonb;
begin
  account := public.course_register('prueba.perfiles','PRUEBA TÉCNICA · perfiles','2468');
  insert into profiles_token values(account->>'token');
  payload := jsonb_build_object('id',gen_random_uuid(),'form_id','pinal-precios','version',1,
    'participant',jsonb_build_object('name','PRUEBA TÉCNICA · perfiles'),'answers',jsonb_build_object('r1','Trabajo anterior'),
    'questions','Duda anterior','consent',true);
  perform public.course_complete(account->>'token',payload,0);
  perform public.course_upload_file(account->>'token','pinal-precios','anterior.txt','text/plain',encode('archivo anterior'::bytea,'base64'),'r8');
end $$;
create temp table profiles_old as
  select 'users' kind,to_jsonb(t) data from public.aula_users t
  union all select 'sessions',to_jsonb(t) from public.aula_sessions t
  union all select 'work',to_jsonb(t) from public.aula_work t
  union all select 'responses',to_jsonb(t) from public.workshop_responses t
  union all select 'files',to_jsonb(t) from public.aula_files t
  union all select 'versions',to_jsonb(t) from public.workshop_response_versions t
  union all select 'forms',to_jsonb(t) from public.workshop_forms t;

-- APPLY_PROFILES_MIGRATION
update public.workshop_forms set is_published=false,due_at='2030-01-01',lock_after_due=true where id='tema4-perfiles';
-- APPLY_PROFILES_MIGRATION

do $$
begin
  if exists (
    with current_data as (
      select 'users' kind,to_jsonb(t) data from public.aula_users t
      union all select 'sessions',to_jsonb(t) from public.aula_sessions t
      union all select 'work',to_jsonb(t) from public.aula_work t
      union all select 'responses',to_jsonb(t) from public.workshop_responses t
      union all select 'files',to_jsonb(t) from public.aula_files t
      union all select 'versions',to_jsonb(t) from public.workshop_response_versions t
      union all select 'forms',to_jsonb(t) from public.workshop_forms t where id<>'tema4-perfiles'
    ) (select * from profiles_old except all select * from current_data)
    union all (select * from current_data except all select * from profiles_old)
  ) then raise exception 'PROFILES-SQL-01: datos anteriores alterados'; end if;
  if not exists(select 1 from public.workshop_forms where id='tema4-perfiles' and position=9 and not is_published and due_at='2030-01-01' and lock_after_due)
    then raise exception 'PROFILES-SQL-02: reejecutar la migración perdió la configuración docente'; end if;
end $$;
update public.workshop_forms set is_published=true,due_at=null,lock_after_due=false where id='tema4-perfiles';
grant select on profiles_token to anon;
set local role anon;
do $$
declare token text := (select token from profiles_token); payload jsonb; saved jsonb; receipt jsonb; slot text; field text; limit_chars integer;
begin
  payload := jsonb_build_object('id',gen_random_uuid(),'form_id','tema4-perfiles','version',1,
    'participant',jsonb_build_object('name','PRUEBA TÉCNICA · perfiles'),
    'answers',jsonb_build_object('pi_modalidad','No tengo hospedaje: borrador de práctica, sin publicar',
      'pi_google',repeat('g',750),'pi_airbnb_titulo',repeat('t',50),'pi_airbnb_descripcion',repeat('d',500),
      'pi_resena5','Gracias por visitarnos.','pi_resena2','Gracias por tus comentarios.'),
    'questions','Prueba aislada','consent',true);
  saved := public.course_save(token,payload,1,0);
  foreach slot in array array['pi_ficha','pi_maps_antes','pi_maps_despues','pi_airbnb_captura','pi_tripadvisor'] loop
    perform public.course_upload_file(token,'tema4-perfiles','evidencia.txt','text/plain',encode('evidencia de prueba'::bytea,'base64'),slot);
  end loop;
  receipt := public.course_complete(token,payload,(saved->>'revision')::integer);
  if receipt->>'saved'<>'true' then raise exception 'PROFILES-SQL-03: entrega sin confirmar'; end if;
  if public.course_complete(token,payload,0)->>'id'<>receipt->>'id' then raise exception 'PROFILES-SQL-03: folio duplicado'; end if;
  if (select count(*) from jsonb_array_elements(public.course_load(token)->'files') f where f->>'form_id'='tema4-perfiles')<>5
    then raise exception 'PROFILES-SQL-03: no se conservaron las cinco capturas'; end if;
  foreach field in array array['pi_google','pi_airbnb_titulo','pi_airbnb_descripcion'] loop
    limit_chars := case field when 'pi_google' then 750 when 'pi_airbnb_titulo' then 50 else 500 end;
    begin
      perform public.course_save(token,jsonb_set(payload,array['answers',field],to_jsonb(repeat('x',limit_chars+1))),1,(receipt->'work'->>'revision')::integer);
      raise exception 'PROFILES-SQL-04: texto demasiado largo aceptado';
    exception when invalid_parameter_value then null;
    end;
  end loop;
end $$;
rollback;
\echo PROFILES-SQL-01 aprobado: usuarios, trabajos, archivos, versiones y catálogo anterior conservados.
\echo PROFILES-SQL-02 aprobado: migración idempotente y configuración docente conservada.
\echo PROFILES-SQL-03 aprobado: borrador, cinco capturas y entrega sin duplicar folio.
\echo PROFILES-SQL-04 aprobado: límites 750, 50 y 500 verificados en PostgreSQL.
