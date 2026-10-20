\set ON_ERROR_STOP on
-- Ejecutar después de supabase/setup.sql en un PostgreSQL aislado con los roles anon y authenticated.
begin;
set local role anon;
do $$
declare
  ana jsonb; luis jsonb; docente jsonb; result jsonb; saved jsonb; receipt jsonb; token text;
  payload jsonb := '{"id":"20000000-0000-4000-8000-000000000001","form_id":"agente-ia","version":1,"participant":{"name":"Ana Sierra","email":"ana@example.test"},"answers":{"a2":"Cabañas Ana"},"questions":"Mi duda","consent":false}';
begin
  -- P01-P04: registro con usuario y PIN, validación y usuarios únicos.
  ana := public.course_register('Ana.Sierra','Ana Sierra','1234');
  if ana->>'ok' <> 'true' or ana->>'token' !~ '^[0-9a-f]{64}$' then raise exception 'P01: registration failed %', ana; end if;
  if public.course_register('ana.sierra','Otra Ana','9999')->>'error' <> 'username_taken' then raise exception 'P02: duplicate username accepted'; end if;
  if public.course_register('ab','Nombre','1234')->>'error' <> 'invalid_username' then raise exception 'P03: short username accepted'; end if;
  if public.course_register('pin.corto','Nombre','12')->>'error' <> 'invalid_pin' then raise exception 'P03: short PIN accepted'; end if;
  if public.course_register('pin.letras','Nombre','12ab')->>'error' <> 'invalid_pin' then raise exception 'P03: letters in PIN accepted'; end if;
  if public.course_register('sin.nombre',' ','1234')->>'error' <> 'invalid_name' then raise exception 'P03: empty name accepted'; end if;
  luis := public.course_register('luis','Luis Turismo','5678');
  docente := public.course_register('docente','Docente Sierra','2468');
  result := public.course_load(ana->>'token');
  if result->>'role' <> 'student' or result->'profile'->>'username' <> 'ana.sierra' or jsonb_array_length(result->'activities') <> 5 then raise exception 'P04: load failed %', result; end if;

  -- P05-P07: acceso, PIN incorrecto y bloqueo tras cinco intentos.
  if public.course_login(' ANA.SIERRA ','1234')->>'ok' <> 'true' then raise exception 'P05: login failed'; end if;
  if public.course_login('ana.sierra','0000')->>'error' <> 'invalid_credentials' then raise exception 'P06: wrong PIN accepted'; end if;
  if public.course_login('nadie','1234')->>'error' <> 'invalid_credentials' then raise exception 'P06: unknown user revealed'; end if;
end $$;
reset role;
-- Los intentos fallidos se registran aunque el acceso no prospere.
do $$ begin
  if (select failed_attempts from public.aula_users where username = 'ana.sierra') <> 1 then raise exception 'P06: failed attempt not counted'; end if;
  if (select pin_hash from public.aula_users where username = 'ana.sierra') like '%1234%' then raise exception 'P06: PIN stored in clear text'; end if;
end $$;
set local role anon;
do $$
declare i integer; result jsonb;
begin
  for i in 1..4 loop perform public.course_login('luis','0000'); end loop;
  result := public.course_login('luis','0000');
  if result->>'error' <> 'locked' then
    result := public.course_login('luis','5678');
    if result->>'error' <> 'locked' then raise exception 'P07: account not locked after five failures %', result; end if;
  end if;
  if public.course_login('luis','5678')->>'error' <> 'locked' then raise exception 'P07: correct PIN bypassed lock'; end if;
end $$;
reset role;
select public.course_make_instructor('docente');
update public.aula_users set locked_until = null where username = 'luis';
set local role anon;
do $$
declare
  ana text := public.course_login('ana.sierra','1234')->>'token';
  luis text := public.course_login('luis','5678')->>'token';
  docente text := public.course_login('docente','2468')->>'token';
  payload jsonb := '{"id":"20000000-0000-4000-8000-000000000001","form_id":"agente-ia","version":1,"participant":{"name":"Ana Sierra","email":"ana@example.test"},"answers":{"a2":"Cabañas Ana"},"questions":"Mi duda","consent":false}';
  saved jsonb; receipt jsonb; result jsonb; luis_id uuid; ana_id uuid; edited jsonb;
begin
  if luis is null then raise exception 'P07: unlocked account cannot enter'; end if;
  -- C01-C11: borradores, revisiones, entrega definitiva e idempotencia.
  saved := public.course_save(ana,payload,1,0);
  if saved->>'revision' <> '1' then raise exception 'C02: initial revision'; end if;
  saved := public.course_save(ana,payload,1,0);
  if saved->>'revision' <> '1' then raise exception 'C03: identical retry duplicated revision'; end if;
  payload := jsonb_set(payload,'{answers,a3}','"Jalpan"');
  saved := public.course_save(ana,payload,1,1);
  if saved->>'revision' <> '2' then raise exception 'C04: draft update failed'; end if;
  begin
    perform public.course_save(ana,jsonb_set(payload,'{answers,a3}','"stale"'),1,1);
    raise exception 'C05: stale tab overwrote newer draft';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform public.course_save(ana,jsonb_set(payload,'{answers,a9}','["inventado"]'),1,2);
    raise exception 'C06: invalid draft choice accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.course_complete(ana,payload,2);
    raise exception 'C07: consent not enforced';
  exception when invalid_parameter_value then null; end;
  -- C08: el borrador persiste en una sesión nueva (otro dispositivo).
  result := public.course_load(public.course_login('ana.sierra','1234')->>'token');
  if result->'work'->0->'payload'->'answers'->>'a3' <> 'Jalpan' then raise exception 'C08: draft not restored in a new session'; end if;
  payload := jsonb_set(payload,'{consent}','true');
  receipt := public.course_complete(ana,payload,2);
  if receipt->>'saved' <> 'true' or receipt->'work'->>'status' <> 'submitted' then raise exception 'C09: no receipt'; end if;
  receipt := public.course_complete(ana,payload,2);
  if receipt->>'saved' <> 'true' then raise exception 'C10: identical resubmission rejected'; end if;
  saved := public.course_save(ana,payload,2,4);
  if saved->>'status' <> 'submitted' or saved->>'revision' <> '4' or saved->>'response_id' <> '20000000-0000-4000-8000-000000000001' then raise exception 'C11: identical save after submit changed the delivery %', saved; end if;
  begin
    perform public.course_complete(ana,'{"id":"20000000-0000-4000-8000-000000000009","form_id":"diagnostico","version":1,"participant":{"name":"Ana Sierra"},"answers":{},"questions":"","consent":true}',0);
    raise exception 'C12: incomplete diagnostic submitted';
  exception when invalid_parameter_value then null; end;
  result := public.course_load(ana);
  if jsonb_array_length(result->'work') <> 1 or result->'profile'->>'email' <> 'ana@example.test' then raise exception 'C12: partial row or profile not updated %', result; end if;

  -- C13-C17: aislamiento entre alumnos y permisos docentes.
  result := public.course_load(luis);
  if jsonb_array_length(result->'work') <> 0 then raise exception 'C13: another student data leaked'; end if;
  begin perform public.course_instructor(luis,0); raise exception 'C14: student opened instructor panel'; exception when sqlstate 'PT403' then null; end;
  begin perform public.course_set_activity(luis,'agente-ia',false,null); raise exception 'C15: student changed publication'; exception when sqlstate 'PT403' then null; end;
  begin perform public.course_responses(luis,'["20000000-0000-4000-8000-000000000001"]'); raise exception 'C16: student read responses'; exception when sqlstate 'PT403' then null; end;
  begin
    perform public.course_complete(luis,'{"id":"20000000-0000-4000-8000-000000000001","form_id":"agente-ia","version":1,"participant":{"name":"Luis"},"answers":{},"questions":"","consent":true}',0);
    raise exception 'C17: student claimed another response';
  exception when unique_violation then null; end;

  -- C18-C22: panel docente, publicación y restablecimiento de PIN.
  result := public.course_instructor(docente,0);
  if not exists(select 1 from jsonb_array_elements(result->'profiles') p where p->>'username' = 'ana.sierra') or jsonb_array_length(result->'work') < 1 or not exists(select 1 from jsonb_array_elements(result->'responses') r where r->>'id' = '20000000-0000-4000-8000-000000000001' and r->>'student_id' is not null) then raise exception 'C18: instructor cannot see course data %', result; end if;
  if result->'profiles'->0 ? 'pin_hash' then raise exception 'C18: PIN hash exposed'; end if;
  result := public.course_responses(docente,'["20000000-0000-4000-8000-000000000001"]');
  if result->0->'answers'->>'a2' <> 'Cabañas Ana' then raise exception 'C19: response detail missing'; end if;
  perform public.course_set_activity(docente,'agente-ia',false,'2026-12-01T18:00:00Z');
  if exists(select 1 from jsonb_array_elements(public.course_load(luis)->'activities') a where a->>'id' = 'agente-ia') then raise exception 'C20: closed activity visible to student'; end if;
  begin
    perform public.course_save(luis,'{"id":"20000000-0000-4000-8000-000000000002","form_id":"agente-ia","version":1,"participant":{"name":"Luis"},"answers":{},"questions":"","consent":false}',1,0);
    raise exception 'C20: closed activity accepted draft';
  exception when sqlstate 'PT403' then null; end;
  perform public.course_set_activity(docente,'agente-ia',true,null);
  luis_id := (public.course_load(luis)->'profile'->>'user_id')::uuid;
  perform public.course_reset_pin(docente,luis_id,'7777');
  begin perform public.course_load(luis); raise exception 'C21: old session survived PIN reset'; exception when sqlstate 'PT401' then null; end;
  if public.course_login('luis','5678')->>'ok' = 'true' then raise exception 'C21: old PIN still valid'; end if;
  if public.course_login('luis','7777')->>'ok' <> 'true' then raise exception 'C21: new PIN rejected'; end if;
  begin perform public.course_reset_pin(ana,luis_id,'1111'); raise exception 'C22: student reset a PIN'; exception when sqlstate 'PT403' then null; end;

  -- F01-F08: archivos adjuntos ligados a la cuenta y a la actividad.
  declare file jsonb; luis_file jsonb; i integer; lt text := public.course_login('luis','7777')->>'token';
  begin
    luis_file := public.course_upload_file(lt,'whatsapp','foto.jpg','image/jpeg',encode('jpeg-bytes'::bytea,'base64'));
    if luis_file->>'size' <> '10' or luis_file->>'name' <> 'foto.jpg' then raise exception 'F01: upload failed %', luis_file; end if;
    if public.course_download_file(lt,(luis_file->>'id')::uuid)->>'data' <> encode('jpeg-bytes'::bytea,'base64') then raise exception 'F02: download differs'; end if;
    if public.course_upload_file(lt,'whatsapp','../../a\b.pdf','application/pdf',encode('x'::bytea,'base64'))->>'name' like '%/%' then raise exception 'F03: unsafe name kept'; end if;
    begin perform public.course_download_file(public.course_login('docente','2468')->>'token',(luis_file->>'id')::uuid); exception when others then raise exception 'F04: instructor cannot download'; end;
    begin perform public.course_download_file(public.course_login('ana.sierra','1234')->>'token',(luis_file->>'id')::uuid); raise exception 'F05: another student downloaded'; exception when sqlstate 'PT404' then null; end;
    begin perform public.course_delete_file(public.course_login('ana.sierra','1234')->>'token',(luis_file->>'id')::uuid); raise exception 'F05: another student deleted'; exception when sqlstate 'PT404' then null; end;
    begin perform public.course_upload_file(lt,'whatsapp','page.html','text/html',encode('<script>'::bytea,'base64')); raise exception 'F06: html accepted'; exception when sqlstate 'PT415' then null; end;
    begin perform public.course_upload_file(lt,'whatsapp','big.pdf','application/pdf',encode(convert_to(repeat('a',5242881),'UTF8'),'base64')); raise exception 'F06: oversize accepted'; exception when sqlstate 'PT413' then null; end;
    for i in 1..3 loop perform public.course_upload_file(lt,'whatsapp','n.txt','text/plain',encode('n'::bytea,'base64')); end loop;
    begin perform public.course_upload_file(lt,'whatsapp','sexto.txt','text/plain',encode('n'::bytea,'base64')); raise exception 'F07: sixth file accepted'; exception when sqlstate 'PT429' then null; end;
    if jsonb_array_length(public.course_load(lt)->'files') <> 5 then raise exception 'F07: files not listed in load'; end if;
    perform public.course_delete_file(lt,(luis_file->>'id')::uuid);
    if jsonb_array_length(public.course_load(lt)->'files') <> 4 then raise exception 'F07: delete failed'; end if;
    declare at text := public.course_login('ana.sierra','1234')->>'token';
    begin
      file := public.course_upload_file(at,'diagnostico','x.pdf','application/pdf',encode('x'::bytea,'base64'));
      file := public.course_upload_file(at,'agente-ia','despues.pdf','application/pdf',encode('x'::bytea,'base64'));
      if file->>'name' <> 'despues.pdf' then raise exception 'F08: upload after submit failed %', file; end if;
      perform public.course_delete_file(at,(file->>'id')::uuid);
      perform public.course_set_activity(docente,'agente-ia',false,null);
      begin
        perform public.course_upload_file(at,'agente-ia','cerrado.pdf','application/pdf',encode('x'::bytea,'base64'));
        raise exception 'F08: hidden activity accepted a file';
      exception when sqlstate 'PT403' then null; end;
      perform public.course_set_activity(docente,'agente-ia',true,null);
    end;
  end;

  -- E01-E08: corregir la misma entrega, bloquear la actividad y seguir al grupo.
  ana_id := (public.course_load(ana)->'profile'->>'user_id')::uuid;
  edited := jsonb_set(payload,'{answers,a2}','"Cabañas editadas"');
  saved := public.course_save(ana,edited,1,4);
  if saved->>'revision' <> '5' or saved->>'status' <> 'submitted' or saved->>'response_id' <> '20000000-0000-4000-8000-000000000001' then raise exception 'E01: working copy %', saved; end if;
  result := public.course_student_work(docente,ana_id,'agente-ia');
  if result->'payload'->'answers'->>'a2' <> 'Cabañas editadas' or result->'response'->'answers'->>'a2' <> 'Cabañas Ana' or result->'response'->>'edit_count' <> '0' or jsonb_array_length(result->'versions') <> 0 then raise exception 'E01: official response changed on save %', result; end if;
  receipt := public.course_complete(ana,edited,5);
  if receipt->>'saved' <> 'true' or receipt->>'id' <> '20000000-0000-4000-8000-000000000001' or receipt->'work'->>'resubmitted_at' is null then raise exception 'E02: resubmit %', receipt; end if;
  result := public.course_student_work(docente,ana_id,'agente-ia');
  if result->>'state' <> 'edited' or result->'response'->>'edit_count' <> '1' or result->'response'->'answers'->>'a2' <> 'Cabañas editadas' or jsonb_array_length(result->'versions') <> 1 or result->'versions'->0->'answers'->>'a2' <> 'Cabañas Ana' then raise exception 'E02: version %', result; end if;
  if jsonb_array_length(public.course_instructor(docente,0)->'responses') <> 1 or jsonb_array_length(public.course_responses(docente,'["20000000-0000-4000-8000-000000000001"]')) <> 1 then raise exception 'E02: folio duplicated'; end if;
  perform public.course_complete(ana,edited,1);
  result := public.course_student_work(docente,ana_id,'agente-ia');
  if result->'response'->>'edit_count' <> '1' or jsonb_array_length(result->'versions') <> 1 then raise exception 'E03: identical resubmit created a version %', result->'response'; end if;
  -- E09: la idempotencia no acepta un folio distinto ni omite el consentimiento.
  begin
    perform public.course_complete(ana,jsonb_set(edited,'{id}','"20000000-0000-4000-8000-000000000099"'),(receipt->'work'->>'revision')::integer);
    raise exception 'E09: wrong folio accepted as an identical retry';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform public.course_complete(ana,jsonb_set(edited,'{consent}','false'),(receipt->'work'->>'revision')::integer);
    raise exception 'E09: retry without consent accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.course_save(ana,jsonb_set(edited,'{answers,a3}','"stale"'),1,1);
    raise exception 'E04: stale edit accepted';
  exception when sqlstate 'PT409' then null; end;
  perform public.course_set_activity(docente,'agente-ia',false,null);
  begin
    perform public.course_save(ana,jsonb_set(edited,'{answers,a4}','"oculta"'),1,(receipt->'work'->>'revision')::integer);
    raise exception 'E05: hidden activity accepted a save';
  exception when sqlstate 'PT403' then null; end;
  begin
    perform public.course_complete(ana,jsonb_set(edited,'{answers,a4}','"oculta"'),(receipt->'work'->>'revision')::integer);
    raise exception 'E05: hidden activity accepted a resubmit';
  exception when sqlstate 'PT403' then null; end;
  if public.course_complete(ana,edited,0)->>'saved' <> 'true' then raise exception 'E05: identical resubmit blocked while hidden'; end if;
  perform public.course_set_activity(docente,'agente-ia',true,null);
  perform public.course_set_activity(docente,'agente-ia',true,now() - interval '1 day',true);
  begin
    perform public.course_save(ana,jsonb_set(edited,'{answers,a5}','"vencida"'),1,(receipt->'work'->>'revision')::integer);
    raise exception 'E06: due date did not lock';
  exception when sqlstate 'PT403' then null; end;
  perform public.course_set_activity(docente,'agente-ia',true,now() - interval '1 day',false);
  saved := public.course_save(ana,jsonb_set(edited,'{answers,a5}','"referencia"'),1,(receipt->'work'->>'revision')::integer);
  if saved->>'status' <> 'submitted' then raise exception 'E06: unlocked due date blocked %', saved; end if;
  perform public.course_set_activity(docente,'agente-ia',true,null,false);
  begin perform public.course_tracking(ana); raise exception 'E07: student opened tracking'; exception when sqlstate 'PT403' then null; end;
  result := public.course_tracking(docente);
  if jsonb_array_length(result->'students') <> 2 or exists(select 1 from jsonb_array_elements(result->'students') s where s->>'username' = 'docente') then raise exception 'E07: roster %', result->'students'; end if;
  if not exists(select 1 from jsonb_array_elements(result->'cells') c where c->>'user_id' = ana_id::text and c->>'form_id' = 'agente-ia' and c->>'state' = 'edited') then raise exception 'E07: ana cell %', result->'cells'; end if;
  if not exists(select 1 from jsonb_array_elements(result->'cells') c where c->>'user_id' = luis_id::text and c->>'form_id' = 'agente-ia' and c->>'state' = 'pending') then raise exception 'E07: luis cell %', result->'cells'; end if;
  if not exists(select 1 from jsonb_array_elements(result->'activities') a where a->>'id' = 'agente-ia' and (a->>'submitted')::integer = 1 and (a->>'missing')::integer = 1) then raise exception 'E07: totals %', result->'activities'; end if;
  begin perform public.course_student_work(ana,luis_id,'agente-ia'); raise exception 'E08: student opened another student'; exception when sqlstate 'PT403' then null; end;
  result := public.course_student_work(docente,ana_id,'agente-ia');
  if result->'payload'->'answers'->>'a2' <> 'Cabañas editadas' or result->'versions'->0->'answers'->>'a2' <> 'Cabañas Ana' or result->>'state' <> 'edited' then raise exception 'E08: detail %', result; end if;

  -- C23-C25: cierre de sesión y tokens inválidos.
  perform public.course_logout(ana);
  begin perform public.course_load(ana); raise exception 'C23: logout kept the session'; exception when sqlstate 'PT401' then null; end;
  begin perform public.course_load(repeat('0',64)); raise exception 'C24: forged token accepted'; exception when sqlstate 'PT401' then null; end;
  begin perform public.course_load(null); raise exception 'C24: null token accepted'; exception when sqlstate 'PT401' then null; end;
end $$;
-- C25: sin acceso directo a tablas ni a funciones internas.
do $$ begin
  begin perform * from public.aula_users; raise exception 'C25: users table readable'; exception when insufficient_privilege then null; end;
  begin perform * from public.aula_sessions; raise exception 'C25: sessions readable'; exception when insufficient_privilege then null; end;
  begin perform * from public.aula_work; raise exception 'C25: drafts readable'; exception when insufficient_privilege then null; end;
  begin perform * from public.aula_files; raise exception 'C25: files readable'; exception when insufficient_privilege then null; end;
  begin perform * from public.workshop_responses; raise exception 'C25: responses readable'; exception when insufficient_privilege then null; end;
  begin perform * from public.workshop_response_versions; raise exception 'C25: versions readable'; exception when insufficient_privilege then null; end;
  begin perform public.submit_workshop_response('{}'); raise exception 'C25: anonymous legacy write remained open'; exception when insufficient_privilege then null; end;
  begin perform public.course_seed_instructor('nadie','Nombre Largo','9753'); raise exception 'C25: seed function exposed'; exception when insufficient_privilege then null; end;
  begin perform public.course_make_instructor('luis'); raise exception 'C25: self-promotion allowed'; exception when insufficient_privilege then null; end;
  begin perform public.aula_open_session(gen_random_uuid()); raise exception 'C25: internal session function exposed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
\echo P01-P07, C01-C25, F01-F08 y E01-E09 aprobados; datos de prueba revertidos.

\if :{?reinstall}
begin;
do $$
declare
  account jsonb := public.course_register('reinstala','Usuario Reinstalado','8642');
  payload jsonb := '{"id":"30000000-0000-4000-8000-000000000098","form_id":"agente-ia","version":1,"participant":{"name":"Usuario Reinstalado"},"answers":{"a2":"Entrega original"},"questions":"Prueba de conservación","consent":true}';
  receipt jsonb;
begin
  receipt := public.course_complete(account->>'token',payload,0);
  payload := jsonb_set(payload,'{answers,a2}','"Entrega corregida"');
  perform public.course_complete(account->>'token',payload,(receipt->'work'->>'revision')::integer);
  perform public.course_save(account->>'token','{"id":"30000000-0000-4000-8000-000000000097","form_id":"whatsapp","version":1,"participant":{"name":"Usuario Reinstalado"},"answers":{},"questions":"Borrador conservado","consent":false}',1,0);
  perform public.course_upload_file(account->>'token','agente-ia','conservado.txt','text/plain',encode('archivo conservado'::bytea,'base64'));
end $$;
insert into public.workshop_responses (id, form_id, form_version, full_name, answers)
values ('30000000-0000-4000-8000-000000000099','agente-ia',1,'Legado Sin Cuenta','{"a2":"legado"}'::jsonb);
-- Compara todos los datos, incluidos sesiones, revisiones, archivos binarios y versiones.
create temporary table before_reinstall as
select 'aula_users' as table_name,to_jsonb(t) as row_data from public.aula_users t
union all select 'aula_sessions',to_jsonb(t) from public.aula_sessions t
union all select 'aula_work',to_jsonb(t) from public.aula_work t
union all select 'aula_files',to_jsonb(t) from public.aula_files t
union all select 'workshop_responses',to_jsonb(t) from public.workshop_responses t
union all select 'workshop_response_versions',to_jsonb(t) from public.workshop_response_versions t
union all select 'workshop_forms',to_jsonb(t) from public.workshop_forms t;
commit;
\ir ../supabase/setup.sql
\ir ../supabase/setup.sql
do $$
declare login jsonb;
begin
  if exists(
    with after_reinstall as (
      select 'aula_users' as table_name,to_jsonb(t) as row_data from public.aula_users t
      union all select 'aula_sessions',to_jsonb(t) from public.aula_sessions t
      union all select 'aula_work',to_jsonb(t) from public.aula_work t
      union all select 'aula_files',to_jsonb(t) from public.aula_files t
      union all select 'workshop_responses',to_jsonb(t) from public.workshop_responses t
      union all select 'workshop_response_versions',to_jsonb(t) from public.workshop_response_versions t
      union all select 'workshop_forms',to_jsonb(t) from public.workshop_forms t
    )
    (select * from before_reinstall except all select * from after_reinstall)
    union all (select * from after_reinstall except all select * from before_reinstall)
  ) then raise exception 'REINSTALL: existing data changed'; end if;
  if not exists(select 1 from public.aula_users where username = 'reinstala') then raise exception 'REINSTALL: user lost'; end if;
  if (select pin_hash from public.aula_users where username = 'reinstala') like '%8642%' then raise exception 'REINSTALL: pin stored in clear text'; end if;
  if not exists(select 1 from public.workshop_responses where id = '30000000-0000-4000-8000-000000000099' and full_name = 'Legado Sin Cuenta' and answers->>'a2' = 'legado' and student_id is null) then raise exception 'REINSTALL: legacy response lost'; end if;
  login := public.course_login('reinstala','8642');
  if login->>'ok' <> 'true' then raise exception 'REINSTALL: login failed %', login; end if;
  if public.course_seed_instructor('docente.prueba','Docente Prueba','9753') not like 'Instructor listo:%' then raise exception 'SEED: create failed'; end if;
  if public.course_login('docente.prueba','9753')->>'ok' <> 'true' then raise exception 'SEED: login failed'; end if;
  update public.aula_users set pin_hash = extensions.crypt('8642', extensions.gen_salt('bf', 8)) where username = 'docente.prueba';
  perform public.course_seed_instructor('docente.prueba','Docente Prueba','9753');
  if public.course_login('docente.prueba','9753')->>'ok' = 'true' then raise exception 'SEED: existing pin was reset'; end if;
  if public.course_login('docente.prueba','8642')->>'ok' <> 'true' then raise exception 'SEED: changed pin rejected'; end if;
  if (select role from public.aula_users where username = 'docente.prueba') <> 'instructor' then raise exception 'SEED: role lost'; end if;
  delete from public.aula_sessions where user_id in (select id from public.aula_users where username in ('reinstala','docente.prueba'));
  delete from public.aula_users where username in ('reinstala','docente.prueba');
  delete from public.workshop_responses where id in ('30000000-0000-4000-8000-000000000098','30000000-0000-4000-8000-000000000099');
end $$;
drop table before_reinstall;
\echo Reinstalacion doble: usuarios, PIN, sesiones, borradores, entregas, archivos, versiones y catálogo intactos.
\endif
