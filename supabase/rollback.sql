-- Desinstalación deliberadamente no destructiva: conserva todas las entregas.
begin;
revoke execute on function public.submit_workshop_response(jsonb) from anon, authenticated;
drop function public.submit_workshop_response(jsonb);
commit;
-- Las tablas se conservan para exportar o respaldar la información desde Supabase.
