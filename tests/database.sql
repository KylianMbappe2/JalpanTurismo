\set ON_ERROR_STOP on
begin;
set local role anon;

-- DB-01: anonymous insert through the validated RPC succeeds.
select public.submit_workshop_response('{"id":"812d6f3f-292d-4fba-9b51-50b1e4c8920e","form_id":"agente-ia","version":1,"participant":{"name":"Persona de prueba","email":"qa@example.test"},"answers":{"a9":["Tarjeta","Transferencia"]},"questions":"Pregunta de prueba","consent":true}'::jsonb);

-- DB-02: identical retries return the same receipt without duplicating rows.
select public.submit_workshop_response('{"id":"812d6f3f-292d-4fba-9b51-50b1e4c8920e","form_id":"agente-ia","version":1,"participant":{"name":"Persona de prueba","email":"qa@example.test"},"answers":{"a9":["Tarjeta","Transferencia"]},"questions":"Pregunta de prueba","consent":true}'::jsonb);

do $$ begin
  -- Reusing a receipt with changed answers must not silently confirm the old data.
  begin
    perform public.submit_workshop_response('{"id":"812d6f3f-292d-4fba-9b51-50b1e4c8920e","form_id":"agente-ia","version":1,"participant":{"name":"Persona de prueba","email":"qa@example.test"},"answers":{},"questions":"Changed","consent":true}');
    raise exception 'FAIL: changed retry falsely confirmed';
  exception when unique_violation then null; end;
  -- DB-03: participants cannot read collected personal information.
  begin
    perform * from public.workshop_responses;
    raise exception 'FAIL: anon can read responses';
  exception when insufficient_privilege then null; end;
  -- DB-04: direct inserts, updates, and deletes are denied.
  begin
    insert into public.workshop_responses (id,form_id,form_version,full_name,answers) values (gen_random_uuid(),'agente-ia',1,'Forbidden','{}');
    raise exception 'FAIL: direct insert permitted';
  exception when insufficient_privilege then null; end;
  begin
    update public.workshop_responses set full_name = 'Tampered';
    raise exception 'FAIL: direct update permitted';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.workshop_responses;
    raise exception 'FAIL: direct delete permitted';
  exception when insufficient_privilege then null; end;
  -- DB-05: consent and required diagnostic answers are enforced on the server.
  begin
    perform public.submit_workshop_response('{"id":"812d6f3f-292d-4fba-9b51-50b1e4c89201","form_id":"agente-ia","version":1,"participant":{"name":"Prueba"},"answers":{},"questions":"","consent":false}');
    raise exception 'FAIL: missing consent accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.submit_workshop_response('{"id":"812d6f3f-292d-4fba-9b51-50b1e4c89201","form_id":"diagnostico","version":1,"participant":{"name":"Prueba"},"answers":{},"questions":"","consent":true}');
    raise exception 'FAIL: missing required answers accepted';
  exception when invalid_parameter_value then null; end;
  -- DB-06: made-up choices, extra keys, and JSON nulls are rejected.
  begin
    perform public.submit_workshop_response('{"id":"812d6f3f-292d-4fba-9b51-50b1e4c89201","form_id":"agente-ia","version":1,"participant":{"name":"Prueba"},"answers":{"a9":["Inventado"]},"questions":"","consent":true}');
    raise exception 'FAIL: invalid option accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.submit_workshop_response('{"id":"812d6f3f-292d-4fba-9b51-50b1e4c89201","form_id":"agente-ia","version":1,"participant":{"name":"Prueba"},"answers":{"surprise":"value"},"questions":"","consent":true}');
    raise exception 'FAIL: unknown answer accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.submit_workshop_response('{"id":"812d6f3f-292d-4fba-9b51-50b1e4c89201","form_id":"agente-ia","version":1,"participant":{"name":null},"answers":{},"questions":"","consent":true}');
    raise exception 'FAIL: null name accepted';
  exception when invalid_parameter_value then null; end;
end $$;

reset role;
do $$ begin
  if (select count(*) from public.workshop_responses where id = '812d6f3f-292d-4fba-9b51-50b1e4c8920e') <> 1 then raise exception 'FAIL: retries duplicated records'; end if;
  if not exists (select 1 from public.workshop_responses where full_name = 'Persona de prueba' and questions = 'Pregunta de prueba') then raise exception 'FAIL: data did not persist'; end if;
end $$;

-- DB-07: authenticated participants have the same private-data restrictions.
set local role authenticated;
do $$ begin
  begin perform * from public.workshop_responses; raise exception 'FAIL: authenticated can read responses';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
\echo DB-01 to DB-07 passed; all test submissions rolled back.
