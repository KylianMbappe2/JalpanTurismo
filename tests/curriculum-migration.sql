begin;
-- Reconstrucción del catálogo anterior, solo en la base aislada de QA.
delete from public.workshop_forms where id in ('prompt-conjunto','calendario-contenido','flyers-ia');
update public.workshop_forms set is_published=true;
create temp table curriculum_tokens(kind text,token text);
do $$
declare account jsonb; payload jsonb; receipt jsonb;
begin
  account := public.course_register('qa.historial','PRUEBA TÉCNICA · historial','2468');
  insert into curriculum_tokens values('owner',account->>'token');
  payload := jsonb_build_object('id',gen_random_uuid(),'form_id','whatsapp','version',1,
    'participant',jsonb_build_object('name','PRUEBA TÉCNICA · historial'),
    'answers',jsonb_build_object('w1','Bienvenida original'),'questions','Duda anterior','consent',true);
  receipt := public.course_complete(account->>'token',payload,0);
  perform public.course_upload_file(account->>'token','whatsapp','anterior.txt','text/plain',encode('archivo anterior'::bytea,'base64'),null);
  payload := jsonb_set(payload,'{answers,w1}','"Bienvenida corregida"');
  perform public.course_complete(account->>'token',payload,(receipt->'work'->>'revision')::integer);
  payload := jsonb_build_object('id',gen_random_uuid(),'form_id','meta','version',1,
    'participant',jsonb_build_object('name','PRUEBA TÉCNICA · historial'),
    'answers',jsonb_build_object('m9','Borrador anterior'),'questions','','consent',false);
  perform public.course_save(account->>'token',payload,1,0);
  account := public.course_register('qa.nuevo','PRUEBA TÉCNICA · nuevo','2468');
  insert into curriculum_tokens values('new',account->>'token');
  account := public.course_register('qa.docente','PRUEBA TÉCNICA · docente','2468');
  update public.aula_users set role='instructor' where username='qa.docente';
  insert into curriculum_tokens values('teacher',account->>'token');
end $$;
update public.workshop_forms set due_at='2030-01-01',lock_after_due=true where id='agente-ia';
create temp table curriculum_before as
  select 'users' kind,to_jsonb(t) data from public.aula_users t
  union all select 'sessions',to_jsonb(t) from public.aula_sessions t
  union all select 'work',to_jsonb(t) from public.aula_work t
  union all select 'responses',to_jsonb(t) from public.workshop_responses t
  union all select 'files',to_jsonb(t) from public.aula_files t
  union all select 'versions',to_jsonb(t) from public.workshop_response_versions t;

-- APPLY_CURRICULUM_MIGRATION
create temp table curriculum_catalog as select to_jsonb(t) data from public.workshop_forms t;
-- APPLY_CURRICULUM_MIGRATION

do $$
begin
  if exists (
    with after_data as (
      select 'users' kind,to_jsonb(t) data from public.aula_users t
      union all select 'sessions',to_jsonb(t) from public.aula_sessions t
      union all select 'work',to_jsonb(t) from public.aula_work t
      union all select 'responses',to_jsonb(t) from public.workshop_responses t
      union all select 'files',to_jsonb(t) from public.aula_files t
      union all select 'versions',to_jsonb(t) from public.workshop_response_versions t
    ) (select * from curriculum_before except all select * from after_data)
    union all (select * from after_data except all select * from curriculum_before)
  ) then raise exception 'CURSO-SQL-01: se alteró el historial'; end if;
  if exists((select data from curriculum_catalog except all select to_jsonb(t) from public.workshop_forms t)
    union all (select to_jsonb(t) from public.workshop_forms t except all select data from curriculum_catalog))
    then raise exception 'CURSO-SQL-02: migración no idempotente'; end if;
  if (select array_agg(id order by position) from public.workshop_forms where is_published) <>
    array['diagnostico','prompt-conjunto','calendario-contenido','flyers-ia','tema4-perfiles','agente-ia']
    then raise exception 'CURSO-SQL-02: catálogo publicado incorrecto'; end if;
  if not exists(select 1 from public.workshop_forms where id='agente-ia' and due_at='2030-01-01' and lock_after_due)
    then raise exception 'CURSO-SQL-02: se alteró el plazo docente'; end if;
end $$;
grant select on curriculum_tokens to anon;
set local role anon;
do $$
declare token text := (select ct.token from curriculum_tokens ct where kind='owner'); loaded jsonb; payload jsonb; saved jsonb; receipt jsonb; task text; field text; slot text;
begin
  loaded := public.course_load(token);
  if jsonb_array_length(loaded->'activities')<>8 or jsonb_array_length(loaded->'work')<>2 or jsonb_array_length(loaded->'files')<>1
    then raise exception 'CURSO-SQL-03: el dueño perdió sus extras'; end if;
  if jsonb_array_length(public.course_load((select ct.token from curriculum_tokens ct where kind='new'))->'activities')<>6
    then raise exception 'CURSO-SQL-03: un alumno nuevo recibió extras'; end if;
  if jsonb_array_length(public.course_tracking((select ct.token from curriculum_tokens ct where kind='teacher'))->'activities')<>6
    then raise exception 'CURSO-SQL-03: el seguimiento docente no contiene seis actividades'; end if;
  foreach task in array array['prompt-conjunto','calendario-contenido','flyers-ia','tema4-perfiles','agente-ia'] loop
    field := case task when 'prompt-conjunto' then 'pc_revision' when 'calendario-contenido' then 'cc_calendario' when 'flyers-ia' then 'fi_prompt' when 'tema4-perfiles' then 'pi_plataforma' else 'a21' end;
    slot := case task when 'prompt-conjunto' then 'pc_resultado' when 'calendario-contenido' then 'cc_archivo' when 'flyers-ia' then 'fi_flyer' when 'tema4-perfiles' then 'pi_tripadvisor' else 'a24' end;
    payload := jsonb_build_object('id',gen_random_uuid(),'form_id',task,'version',1,
      'participant',jsonb_build_object('name','PRUEBA TÉCNICA · historial'),'questions','','consent',true,
      'answers',jsonb_build_object(field,case task when 'tema4-perfiles' then 'TripAdvisor' when 'agente-ia' then 'WhatsApp: chatbot configurado' else 'Trabajo revisado' end));
    saved := public.course_save(token,payload,1,0);
    perform public.course_upload_file(token,task,'evidencia.txt','text/plain',encode('prueba'::bytea,'base64'),slot);
    receipt := public.course_complete(token,payload,(saved->>'revision')::integer);
    if receipt->>'saved'<>'true' or public.course_complete(token,payload,0)->>'id'<>receipt->>'id'
      then raise exception 'CURSO-SQL-04: entrega duplicada o sin confirmar: %',task; end if;
  end loop;
end $$;
rollback;
\echo CURSO-SQL-01 aprobado: usuarios, sesiones, folios, borradores, entregas, archivos e historial intactos.
\echo CURSO-SQL-02 aprobado: seis actividades publicadas en orden, migración idempotente y plazos conservados.
\echo CURSO-SQL-03 aprobado: extras solo para su dueño y seis actividades en seguimiento docente.
\echo CURSO-SQL-04 aprobado: cinco prácticas guardan evidencia y entregan sin duplicar; basta TripAdvisor.
