-- Aula Sierra: prácticas de Pinal de Amoles con capturas por apartado. Aditivo; conserva todos los datos.
begin;

update public.workshop_forms set position = case id
  when 'pinal-temporadas' then 6 when 'pinal-competencia' then 7 when 'pinal-precios' then 8
  when 'pinal-estrategia' then 9 when 'pinal-cierre' then 10 else position end
where id in ('pinal-temporadas','pinal-competencia','pinal-precios','pinal-estrategia','pinal-cierre');

-- Cada archivo puede pertenecer a un apartado "Sube:" de la actividad (null = archivo general).
alter table public.aula_files add column if not exists slot text;
do $$ begin
  if not exists(select 1 from pg_constraint where conname = 'aula_files_slot_format') then
    alter table public.aula_files add constraint aula_files_slot_format check (slot is null or slot ~ '^[a-z0-9_]{1,40}$');
  end if;
end $$;

create or replace function public.aula_file_list(p_user uuid,p_form_id text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'form_id',f.form_id,'slot',f.slot,'name',f.name,'mime',f.mime,'size',f.size,'created_at',f.created_at) order by f.created_at),'[]'::jsonb)
  from public.aula_files f where f.user_id = p_user and (p_form_id is null or f.form_id = p_form_id);
$$;

drop function if exists public.course_upload_file(text,text,text,text,text);
create or replace function public.course_upload_file(p_token text,p_form_id text,p_name text,p_mime text,p_data text,p_slot text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  content bytea;
  created public.aula_files%rowtype;
  clean_name text := btrim(regexp_replace(coalesce(p_name,''),'[\\/:*?"<>|[:cntrl:]]','_','g'));
begin
  perform public.aula_activity_open(p_form_id);
  if p_slot is not null and not exists(select 1 from public.workshop_forms f where f.id = p_form_id and coalesce(f.definition->'uploads','[]'::jsonb) @> jsonb_build_array(p_slot)) then
    raise exception 'Invalid upload slot' using errcode = '22023';
  end if;
  if p_mime is null or p_mime not in ('image/jpeg','image/png','image/webp','application/pdf','text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation') then raise exception 'File type not allowed' using errcode = 'PT415'; end if;
  if char_length(clean_name) not between 1 and 160 then raise exception 'Invalid file name' using errcode = '22023'; end if;
  if p_data is null or char_length(p_data) > 7000000 then raise exception 'File too large' using errcode = 'PT413'; end if;
  begin content := decode(p_data,'base64'); exception when others then raise exception 'Invalid file data' using errcode = '22023'; end;
  if octet_length(content) = 0 then raise exception 'Empty file' using errcode = '22023'; end if;
  if octet_length(content) > 5242880 then raise exception 'File too large' using errcode = 'PT413'; end if;
  perform 1 from public.aula_users where id = account.id for update;
  -- Hasta 3 archivos por apartado y 10 por actividad.
  if (select count(*) from public.aula_files where user_id = account.id and form_id = p_form_id) >= 10
    or (p_slot is not null and (select count(*) from public.aula_files where user_id = account.id and form_id = p_form_id and slot = p_slot) >= 3)
    or (p_slot is null and (select count(*) from public.aula_files where user_id = account.id and form_id = p_form_id and slot is null) >= 5) then
    raise exception 'Too many files' using errcode = 'PT429';
  end if;
  insert into public.aula_files(user_id,form_id,slot,name,mime,size,data) values(account.id,p_form_id,p_slot,clean_name,p_mime,octet_length(content),content) returning * into created;
  return jsonb_build_object('id',created.id,'form_id',created.form_id,'slot',created.slot,'name',created.name,'mime',created.mime,'size',created.size,'created_at',created.created_at);
end;
$$;

revoke all on function public.course_upload_file(text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.course_upload_file(text,text,text,text,text,text) to anon,authenticated;
revoke all on function public.aula_file_list(uuid,text) from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
