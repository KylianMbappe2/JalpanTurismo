-- Ejecutar con node scripts/verify-sessions.mjs: intercala la migración en los marcadores.
begin;
-- Recrea el catálogo anterior únicamente en la base aislada y vacía de esta prueba.
delete from public.workshop_forms where id like 'sesion2-%';
update public.workshop_forms set position = case id
  when 'pinal-temporadas' then 6 when 'pinal-competencia' then 7 when 'pinal-precios' then 8
  when 'pinal-estrategia' then 9 when 'pinal-cierre' then 10 else position end;
create temp table session_token (token text);
do $$
declare account jsonb; payload jsonb; receipt jsonb;
begin
  account := public.course_register('prueba.sesiones','PRUEBA TÉCNICA · sesiones','2468');
  insert into session_token values(account->>'token');
  payload := jsonb_build_object('id',gen_random_uuid(),'form_id','pinal-precios','version',1,
    'participant',jsonb_build_object('name','PRUEBA TÉCNICA · sesiones'),'answers',jsonb_build_object('r1','Costos originales'),
    'questions','Duda original','consent',true);
  receipt := public.course_complete(account->>'token',payload,0);
  payload := jsonb_set(payload,'{answers,r1}','"Borrador posterior sin volver a entregar"');
  perform public.course_save(account->>'token',payload,1,(receipt->'work'->>'revision')::integer);
  perform public.course_upload_file(account->>'token','pinal-precios','conservado.txt','text/plain',encode('archivo conservado'::bytea,'base64'),'r8');
end $$;
create temp table old_data as
  select 'users' as kind,to_jsonb(t) as data from public.aula_users t
  union all select 'sessions',to_jsonb(t) from public.aula_sessions t
  union all select 'work',to_jsonb(t) from public.aula_work t
  union all select 'responses',to_jsonb(t) from public.workshop_responses t
  union all select 'files',to_jsonb(t) from public.aula_files t
  union all select 'versions',to_jsonb(t) from public.workshop_response_versions t;
create temp table first_session as select to_jsonb(f) as data from public.workshop_forms f
  where id in ('diagnostico','guia-prompts','chatgpt','meta','agente-ia');

-- APPLY_SESSION_MIGRATION

-- El instructor conserva su decisión de cerrar una nueva actividad al reinstalar.
update public.workshop_forms set is_published = false,due_at = '2030-01-01',lock_after_due = true where id = 'sesion2-precios';

-- APPLY_SESSION_MIGRATION

do $$
declare account_token text := (select token from session_token); form_id text; payload jsonb; receipt jsonb; answer_id text; slot_id text;
begin
  if exists(
    with current_data as (
      select 'users' as kind,to_jsonb(t) as data from public.aula_users t
      union all select 'sessions',to_jsonb(t) from public.aula_sessions t
      union all select 'work',to_jsonb(t) from public.aula_work t
      union all select 'responses',to_jsonb(t) from public.workshop_responses t
      union all select 'files',to_jsonb(t) from public.aula_files t
      union all select 'versions',to_jsonb(t) from public.workshop_response_versions t
    ) (select * from old_data except all select * from current_data)
    union all (select * from current_data except all select * from old_data)
  ) then raise exception 'SESSION-SQL-01: datos existentes modificados'; end if;
  if exists(
    (select data from first_session except all select to_jsonb(f) from public.workshop_forms f where id in ('diagnostico','guia-prompts','chatgpt','meta','agente-ia'))
    union all (select to_jsonb(f) from public.workshop_forms f where id in ('diagnostico','guia-prompts','chatgpt','meta','agente-ia') except all select data from first_session)
  ) then raise exception 'SESSION-SQL-01: sesión uno modificada'; end if;
  if (select count(*) from public.workshop_forms where id like 'sesion2-%') <> 3 then raise exception 'SESSION-SQL-02: catálogo duplicado o incompleto'; end if;
  if not exists(select 1 from public.workshop_forms where id = 'sesion2-precios' and not is_published and due_at = '2030-01-01' and lock_after_due) then raise exception 'SESSION-SQL-02: configuración del instructor perdida'; end if;
  update public.workshop_forms set is_published = true,due_at = null,lock_after_due = false where id = 'sesion2-precios';
  foreach form_id in array array['sesion2-precios','sesion2-competencia','sesion2-temporadas'] loop
    select definition->'questions'->0->>'id' into answer_id from public.workshop_forms where id = form_id;
    payload := jsonb_build_object('id',gen_random_uuid(),'form_id',form_id,'version',1,'participant',jsonb_build_object('name','PRUEBA TÉCNICA · sesiones'),
      'answers',jsonb_build_object(answer_id,'Respuesta de prueba'),'questions','Duda de la sesión','consent',true);
    receipt := public.course_complete(account_token,payload,0);
    if receipt->>'saved' <> 'true' then raise exception 'SESSION-SQL-03: entrega sin confirmación'; end if;
    if public.course_complete(account_token,payload,0)->>'id' <> receipt->>'id' then raise exception 'SESSION-SQL-03: folio duplicado'; end if;
    select definition->'uploads'->>0 into slot_id from public.workshop_forms where id = form_id;
    perform public.course_upload_file(account_token,form_id,'evidencia.txt','text/plain',encode('evidencia nueva'::bytea,'base64'),slot_id);
  end loop;
  if jsonb_array_length(public.course_load(account_token)->'work') <> 4 then raise exception 'SESSION-SQL-03: trabajo anterior perdido o entregas incompletas'; end if;
  if jsonb_array_length(public.course_load(account_token)->'files') <> 4 then raise exception 'SESSION-SQL-03: archivo anterior perdido o adjuntos nuevos incompletos'; end if;
end $$;
rollback;
\echo SESSION-SQL-01: sesión uno, usuarios, borradores, entregas y archivos intactos.
\echo SESSION-SQL-02: migración aplicada dos veces; catálogo y configuración del instructor conservados.
\echo SESSION-SQL-03: tres entregas nuevas confirmadas sin duplicar folios.
