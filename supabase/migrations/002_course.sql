-- Aula Sierra v2: acceso con usuario y PIN. Ejecutar después del SQL inicial. Conserva todas las entregas.
begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

alter table public.workshop_forms add column if not exists position integer not null default 0;
alter table public.workshop_forms add column if not exists is_published boolean not null default true;
alter table public.workshop_forms add column if not exists due_at timestamptz;
update public.workshop_forms set position = case id when 'diagnostico' then 1 when 'whatsapp' then 2 when 'chatgpt' then 3 when 'meta' then 4 when 'agente-ia' then 5 else 99 end;

-- Retira la versión anterior basada en correo (si llegó a instalarse); sus tablas se conservan.
drop function if exists public.course_context();
drop function if exists public.save_course_activity(jsonb,integer,integer);
drop function if exists public.complete_course_activity(jsonb,integer);
drop function if exists public.set_course_activity(text,boolean,timestamptz);
drop policy if exists course_activity_read on public.workshop_forms;
drop policy if exists course_response_read on public.workshop_responses;
revoke all on public.workshop_forms,public.workshop_responses from public,anon,authenticated;

create table if not exists public.aula_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9._-]{2,29}$'),
  pin_hash text not null,
  role text not null default 'student' check (role in ('student','instructor')),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  email text not null default '' check (char_length(email) <= 254),
  phone text not null default '' check (char_length(phone) <= 30),
  business text not null default '' check (char_length(business) <= 160),
  municipality text not null default '' check (char_length(municipality) <= 120),
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.aula_sessions (
  token_hash bytea primary key,
  user_id uuid not null references public.aula_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists aula_sessions_user on public.aula_sessions(user_id);
create table if not exists public.aula_work (
  user_id uuid not null references public.aula_users(id) on delete cascade,
  form_id text not null references public.workshop_forms(id),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  step integer not null default 0 check (step between 0 and 2),
  revision integer not null default 1 check (revision > 0),
  status text not null default 'draft' check (status in ('draft','submitted')),
  saved_at timestamptz not null default now(),
  submitted_at timestamptz,
  response_id uuid references public.workshop_responses(id),
  primary key(user_id,form_id),
  check ((status = 'submitted') = (submitted_at is not null and response_id is not null))
);
create index if not exists aula_work_form_status on public.aula_work(form_id,status);
create table if not exists public.aula_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.aula_users(id) on delete cascade,
  form_id text not null references public.workshop_forms(id),
  name text not null check (char_length(name) between 1 and 160),
  mime text not null,
  size integer not null check (size between 1 and 5242880),
  data bytea not null,
  created_at timestamptz not null default now()
);
create index if not exists aula_files_owner on public.aula_files(user_id,form_id);
alter table public.aula_files enable row level security;
revoke all on public.aula_files from public,anon,authenticated;
alter table public.workshop_responses add column if not exists student_id uuid references public.aula_users(id) on delete set null;
create index if not exists workshop_responses_student on public.workshop_responses(student_id);
alter table public.aula_users enable row level security;
alter table public.aula_sessions enable row level security;
alter table public.aula_work enable row level security;
-- Sin políticas: el navegador solo accede mediante las funciones de abajo.
revoke all on public.aula_users,public.aula_sessions,public.aula_work from public,anon,authenticated;

create or replace function public.aula_open_session(p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  token text := encode(extensions.gen_random_bytes(32),'hex');
  account public.aula_users%rowtype;
begin
  delete from public.aula_sessions where user_id = p_user and expires_at < now();
  insert into public.aula_sessions(token_hash,user_id,expires_at) values(sha256(convert_to(token,'UTF8')),p_user,now() + interval '30 days');
  select * into account from public.aula_users where id = p_user;
  return jsonb_build_object('ok',true,'token',token,'user',jsonb_build_object('id',account.id,'username',account.username));
end;
$$;

create or replace function public.aula_session_user(p_token text) returns public.aula_users
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype;
  hashed bytea;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'Session required' using errcode = 'PT401'; end if;
  hashed := sha256(convert_to(p_token,'UTF8'));
  select u.* into account from public.aula_sessions s join public.aula_users u on u.id = s.user_id where s.token_hash = hashed and s.expires_at > now();
  if not found then raise exception 'Session expired' using errcode = 'PT401'; end if;
  update public.aula_sessions set expires_at = now() + interval '30 days' where token_hash = hashed and expires_at < now() + interval '29 days';
  return account;
end;
$$;

create or replace function public.aula_require_instructor(p_token text) returns public.aula_users
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype := public.aula_session_user(p_token);
begin
  if account.role <> 'instructor' then raise exception 'Instructor required' using errcode = 'PT403'; end if;
  return account;
end;
$$;

-- Los errores de acceso se devuelven como resultado (no excepción) para que el contador de intentos se conserve.
create or replace function public.course_register(p_username text,p_full_name text,p_pin text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  name text := lower(btrim(coalesce(p_username,'')));
  created uuid;
begin
  if name !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then return jsonb_build_object('ok',false,'error','invalid_username'); end if;
  if char_length(btrim(coalesce(p_full_name,''))) not between 2 and 120 then return jsonb_build_object('ok',false,'error','invalid_name'); end if;
  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then return jsonb_build_object('ok',false,'error','invalid_pin'); end if;
  insert into public.aula_users(username,full_name,pin_hash) values(name,btrim(p_full_name),extensions.crypt(p_pin,extensions.gen_salt('bf',8)))
  on conflict(username) do nothing returning id into created;
  if created is null then return jsonb_build_object('ok',false,'error','username_taken'); end if;
  return public.aula_open_session(created);
end;
$$;

create or replace function public.course_login(p_username text,p_pin text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype;
begin
  select * into account from public.aula_users where username = lower(btrim(coalesce(p_username,''))) for update;
  if not found then
    perform extensions.crypt(coalesce(p_pin,''),extensions.gen_salt('bf',8));
    return jsonb_build_object('ok',false,'error','invalid_credentials');
  end if;
  if account.locked_until > now() then
    return jsonb_build_object('ok',false,'error','locked','retry_after',ceil(extract(epoch from account.locked_until - now())));
  end if;
  if p_pin is null or account.pin_hash <> extensions.crypt(p_pin,account.pin_hash) then
    -- Cinco intentos fallidos bloquean la cuenta 15 minutos.
    update public.aula_users set
      locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else locked_until end,
      failed_attempts = case when failed_attempts + 1 >= 5 then 0 else failed_attempts + 1 end
    where id = account.id;
    return jsonb_build_object('ok',false,'error','invalid_credentials');
  end if;
  update public.aula_users set failed_attempts = 0,locked_until = null where id = account.id;
  return public.aula_open_session(account.id);
end;
$$;

create or replace function public.course_logout(p_token text) returns jsonb
language sql security definer set search_path = '' as $$
  delete from public.aula_sessions where token_hash = sha256(convert_to(coalesce(p_token,''),'UTF8'));
  select jsonb_build_object('ok',true);
$$;

create or replace function public.aula_file_list(p_user uuid,p_form_id text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'form_id',f.form_id,'name',f.name,'mime',f.mime,'size',f.size,'created_at',f.created_at) order by f.created_at),'[]'::jsonb)
  from public.aula_files f where f.user_id = p_user and (p_form_id is null or f.form_id = p_form_id);
$$;

create or replace function public.course_load(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype := public.aula_session_user(p_token);
begin
  return jsonb_build_object(
    'role',account.role,
    'profile',jsonb_build_object('user_id',account.id,'username',account.username,'full_name',account.full_name,'email',account.email,'phone',account.phone,'business',account.business,'municipality',account.municipality),
    'activities',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'title',f.title,'version',f.version,'position',f.position,'is_published',f.is_published,'due_at',f.due_at) order by f.position)
      from public.workshop_forms f where f.is_published or account.role = 'instructor'),'[]'::jsonb),
    'work',coalesce((select jsonb_agg(to_jsonb(w)) from public.aula_work w where w.user_id = account.id),'[]'::jsonb),
    'files',public.aula_file_list(account.id,null));
end;
$$;

-- Partial responses are validated without requiring completion of the diagnostic.
create or replace function public.validate_course_draft(p_payload jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  activity public.workshop_forms%rowtype;
  person jsonb;
  answer jsonb;
  answers jsonb;
  q jsonb;
  item jsonb;
  key text;
  max_length integer;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text) > 60000
    or p_payload->>'id' is null or p_payload->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'Invalid draft' using errcode = '22023';
  end if;
  select * into activity from public.workshop_forms where id = p_payload->>'form_id';
  if not found or p_payload->'version' is distinct from to_jsonb(activity.version) then raise exception 'Invalid activity' using errcode = '22023'; end if;
  person := p_payload->'participant'; answers := p_payload->'answers';
  if jsonb_typeof(person) is distinct from 'object' or jsonb_typeof(answers) is distinct from 'object'
    or jsonb_typeof(p_payload->'questions') is distinct from 'string' or char_length(p_payload->>'questions') > 2000
    or jsonb_typeof(p_payload->'consent') is distinct from 'boolean' then
    raise exception 'Invalid draft fields' using errcode = '22023';
  end if;
  foreach key in array array['name','email','phone','business','municipality'] loop
    max_length := case key when 'name' then 120 when 'email' then 254 when 'phone' then 30 when 'business' then 160 else 120 end;
    if person ? key and (jsonb_typeof(person->key) is distinct from 'string' or char_length(person->>key) > max_length) then raise exception 'Invalid participant' using errcode = '22023'; end if;
  end loop;
  if exists(select 1 from jsonb_object_keys(answers) incoming(key) where not exists(
    select 1 from jsonb_array_elements(activity.definition->'questions') known(q) where known.q->>'id' = incoming.key
  )) then raise exception 'Unknown answer' using errcode = '22023'; end if;
  for q in select value from jsonb_array_elements(activity.definition->'questions') loop
    key := q->>'id';
    if not answers ? key then continue; end if;
    answer := answers->key;
    case q->>'type'
      when 'text' then
        if jsonb_typeof(answer) is distinct from 'string' or char_length(answers->>key) > coalesce((q->>'max')::integer,4000) then raise exception 'Invalid text' using errcode = '22023'; end if;
      when 'radio' then
        if jsonb_typeof(answer) is distinct from 'string' or not(q->'options' @> jsonb_build_array(answer)) then raise exception 'Invalid option' using errcode = '22023'; end if;
      when 'multi' then
        if jsonb_typeof(answer) is distinct from 'array' then raise exception 'Invalid options' using errcode = '22023'; end if;
        if jsonb_array_length(answer) > jsonb_array_length(q->'options') or (select count(distinct value) from jsonb_array_elements(answer)) <> jsonb_array_length(answer) then raise exception 'Invalid options' using errcode = '22023'; end if;
        for item in select value from jsonb_array_elements(answer) loop
          if not(q->'options' @> jsonb_build_array(item)) then raise exception 'Invalid option' using errcode = '22023'; end if;
        end loop;
      when 'check' then
        if jsonb_typeof(answer) is distinct from 'boolean' then raise exception 'Invalid checkbox' using errcode = '22023'; end if;
      else raise exception 'Invalid question' using errcode = '22023';
    end case;
  end loop;
end;
$$;

create or replace function public.aula_save_work(p_user uuid,p_payload jsonb,p_step integer,p_revision integer) returns public.aula_work
language plpgsql security definer set search_path = '' as $$
declare work public.aula_work%rowtype;
begin
  if p_step is null or p_step not between 0 and 2 or p_revision is null or p_revision < 0 then raise exception 'Invalid step or revision' using errcode = '22023'; end if;
  perform public.validate_course_draft(p_payload);
  if not exists(select 1 from public.workshop_forms where id = p_payload->>'form_id' and is_published) then raise exception 'Activity closed' using errcode = 'PT403'; end if;
  -- Initial row creation and subsequent revision checks serialize concurrent tabs.
  insert into public.aula_work(user_id,form_id,payload,step,revision)
  values(p_user,p_payload->>'form_id',p_payload,p_step,1) on conflict(user_id,form_id) do nothing;
  select * into work from public.aula_work where user_id = p_user and form_id = p_payload->>'form_id' for update;
  if work.status = 'submitted' then raise exception 'Already submitted' using errcode = 'PT403'; end if;
  if work.payload = p_payload and work.step = p_step then return work; end if;
  if work.revision <> p_revision or work.payload->>'id' <> p_payload->>'id' then raise exception 'Draft changed in another tab' using errcode = 'PT409'; end if;
  update public.aula_work set payload = p_payload,step = p_step,revision = revision + 1,saved_at = now()
  where user_id = p_user and form_id = work.form_id returning * into work;
  return work;
end;
$$;

create or replace function public.course_save(p_token text,p_payload jsonb,p_step integer,p_revision integer default 0) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype := public.aula_session_user(p_token);
begin
  return to_jsonb(public.aula_save_work(account.id,p_payload,p_step,p_revision));
end;
$$;

create or replace function public.course_complete(p_token text,p_payload jsonb,p_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  work public.aula_work%rowtype;
  receipt jsonb;
  person jsonb := p_payload->'participant';
begin
  select * into work from public.aula_work where user_id = account.id and form_id = p_payload->>'form_id' for update;
  if found and work.status = 'submitted' then
    if work.payload <> p_payload then raise exception 'Submitted work cannot be changed' using errcode = 'PT409'; end if;
    return jsonb_build_object('saved',true,'id',work.response_id,'work',to_jsonb(work));
  end if;
  perform public.aula_save_work(account.id,p_payload,2,p_revision);
  if exists(select 1 from public.workshop_responses where id = (p_payload->>'id')::uuid and student_id is distinct from account.id) then raise exception 'Submission id unavailable' using errcode = '23505'; end if;
  -- The original, fully validated insertion function remains internal only.
  receipt := public.submit_workshop_response(p_payload);
  update public.workshop_responses set student_id = account.id where id = (receipt->>'id')::uuid;
  update public.aula_work set status = 'submitted',submitted_at = now(),saved_at = now(),response_id = (receipt->>'id')::uuid,revision = revision + 1
  where user_id = account.id and form_id = p_payload->>'form_id' returning * into work;
  update public.aula_users set full_name = btrim(person->>'name'),email = coalesce(person->>'email',''),phone = coalesce(person->>'phone',''),
    business = coalesce(person->>'business',''),municipality = coalesce(person->>'municipality',''),updated_at = now() where id = account.id;
  return jsonb_build_object('saved',true,'id',work.response_id,'work',to_jsonb(work));
end;
$$;

create or replace function public.course_instructor(p_token text,p_offset integer default 0) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype := public.aula_require_instructor(p_token);
begin
  return jsonb_build_object(
    'profiles',coalesce((select jsonb_agg(p order by p.updated_at desc) from (
      select u.id as user_id,u.username,u.full_name,u.email,u.phone,u.business,u.municipality,u.role,u.updated_at
      from public.aula_users u where u.id <> account.id order by u.updated_at desc limit 200) p),'[]'::jsonb),
    'work',coalesce((select jsonb_agg(w) from (
      select user_id,form_id,status,saved_at,submitted_at,response_id from public.aula_work limit 1000) w),'[]'::jsonb),
    'responses',coalesce((select jsonb_agg(r order by r.submitted_at desc) from (
      select id,full_name,email,phone,business,municipality,form_id,submitted_at,questions,student_id from public.workshop_responses
      order by submitted_at desc limit 200 offset greatest(coalesce(p_offset,0),0)) r),'[]'::jsonb));
end;
$$;

create or replace function public.course_responses(p_token text,p_ids jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.aula_require_instructor(p_token);
  if jsonb_typeof(p_ids) is distinct from 'array' or jsonb_array_length(p_ids) > 200
    or exists(select 1 from jsonb_array_elements(p_ids) v where jsonb_typeof(v) <> 'string' or v #>> '{}' !~* '^[0-9a-f-]{36}$') then
    raise exception 'Invalid ids' using errcode = '22023';
  end if;
  return coalesce((select jsonb_agg(to_jsonb(r) || jsonb_build_object('files',case when r.student_id is null then '[]'::jsonb else public.aula_file_list(r.student_id,r.form_id) end) order by r.submitted_at desc) from public.workshop_responses r
    where r.id in (select (v #>> '{}')::uuid from jsonb_array_elements(p_ids) v)),'[]'::jsonb);
end;
$$;

create or replace function public.course_set_activity(p_token text,p_form_id text,p_published boolean,p_due_at timestamptz default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare activity public.workshop_forms%rowtype;
begin
  perform public.aula_require_instructor(p_token);
  if p_published is null or (p_due_at is not null and not isfinite(p_due_at)) then raise exception 'Invalid activity settings' using errcode = '22023'; end if;
  update public.workshop_forms set is_published = p_published,due_at = p_due_at where id = p_form_id returning * into activity;
  if not found then raise exception 'Activity not found' using errcode = '22023'; end if;
  return jsonb_build_object('id',activity.id,'title',activity.title,'version',activity.version,'position',activity.position,'is_published',activity.is_published,'due_at',activity.due_at);
end;
$$;

create or replace function public.course_reset_pin(p_token text,p_user_id uuid,p_pin text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.aula_require_instructor(p_token);
  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then raise exception 'Invalid PIN' using errcode = '22023'; end if;
  update public.aula_users set pin_hash = extensions.crypt(p_pin,extensions.gen_salt('bf',8)),failed_attempts = 0,locked_until = null where id = p_user_id;
  if not found then raise exception 'User not found' using errcode = '22023'; end if;
  delete from public.aula_sessions where user_id = p_user_id;
  return jsonb_build_object('ok',true);
end;
$$;

-- Archivos adjuntos: hasta 5 por actividad y 5 MB cada uno; solo tipos que el navegador descarga sin ejecutar.
create or replace function public.course_upload_file(p_token text,p_form_id text,p_name text,p_mime text,p_data text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  content bytea;
  created public.aula_files%rowtype;
  clean_name text := btrim(regexp_replace(coalesce(p_name,''),'[\\/:*?"<>|[:cntrl:]]','_','g'));
begin
  if not exists(select 1 from public.workshop_forms where id = p_form_id and is_published) then raise exception 'Activity closed' using errcode = 'PT403'; end if;
  if exists(select 1 from public.aula_work where user_id = account.id and form_id = p_form_id and status = 'submitted') then raise exception 'Already submitted' using errcode = 'PT403'; end if;
  if p_mime is null or p_mime not in ('image/jpeg','image/png','image/webp','application/pdf','text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation') then raise exception 'File type not allowed' using errcode = 'PT415'; end if;
  if char_length(clean_name) not between 1 and 160 then raise exception 'Invalid file name' using errcode = '22023'; end if;
  if p_data is null or char_length(p_data) > 7000000 then raise exception 'File too large' using errcode = 'PT413'; end if;
  begin content := decode(p_data,'base64'); exception when others then raise exception 'Invalid file data' using errcode = '22023'; end;
  if octet_length(content) = 0 then raise exception 'Empty file' using errcode = '22023'; end if;
  if octet_length(content) > 5242880 then raise exception 'File too large' using errcode = 'PT413'; end if;
  perform 1 from public.aula_users where id = account.id for update;
  if (select count(*) from public.aula_files where user_id = account.id and form_id = p_form_id) >= 5 then raise exception 'Too many files' using errcode = 'PT429'; end if;
  insert into public.aula_files(user_id,form_id,name,mime,size,data) values(account.id,p_form_id,clean_name,p_mime,octet_length(content),content) returning * into created;
  return jsonb_build_object('id',created.id,'form_id',created.form_id,'name',created.name,'mime',created.mime,'size',created.size,'created_at',created.created_at);
end;
$$;

create or replace function public.course_delete_file(p_token text,p_file_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  target public.aula_files%rowtype;
begin
  select * into target from public.aula_files where id = p_file_id and user_id = account.id;
  if not found then raise exception 'File not found' using errcode = 'PT404'; end if;
  if exists(select 1 from public.aula_work where user_id = account.id and form_id = target.form_id and status = 'submitted') then raise exception 'Already submitted' using errcode = 'PT403'; end if;
  delete from public.aula_files where id = target.id;
  return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.course_download_file(p_token text,p_file_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  target public.aula_files%rowtype;
begin
  select * into target from public.aula_files where id = p_file_id and (user_id = account.id or account.role = 'instructor');
  if not found then raise exception 'File not found' using errcode = 'PT404'; end if;
  return jsonb_build_object('id',target.id,'name',target.name,'mime',target.mime,'size',target.size,'data',translate(encode(target.data,'base64'),E'\n',''));
end;
$$;

-- Solo desde SQL Editor: convierte una cuenta ya registrada en instructor.
create or replace function public.course_make_instructor(p_username text) returns text
language plpgsql security definer set search_path = '' as $$
begin
  update public.aula_users set role = 'instructor' where username = lower(btrim(p_username));
  if not found then raise exception 'No existe el usuario %. Créalo primero en la web.', p_username; end if;
  return 'Instructor: ' || lower(btrim(p_username));
end;
$$;

-- Supabase concede EXECUTE por defecto; se retira de todo y se concede solo la API pública.
revoke all on function public.aula_open_session(uuid),public.aula_session_user(text),public.aula_require_instructor(text),
  public.validate_course_draft(jsonb),public.aula_save_work(uuid,jsonb,integer,integer),public.course_make_instructor(text),public.aula_file_list(uuid,text),
  public.course_upload_file(text,text,text,text,text),public.course_delete_file(text,uuid),public.course_download_file(text,uuid),
  public.course_register(text,text,text),public.course_login(text,text),public.course_logout(text),public.course_load(text),
  public.course_save(text,jsonb,integer,integer),public.course_complete(text,jsonb,integer),public.course_instructor(text,integer),
  public.course_responses(text,jsonb),public.course_set_activity(text,text,boolean,timestamptz),public.course_reset_pin(text,uuid,text)
  from public,anon,authenticated;
grant execute on function public.course_register(text,text,text),public.course_login(text,text),public.course_logout(text),public.course_load(text),
  public.course_save(text,jsonb,integer,integer),public.course_complete(text,jsonb,integer),public.course_instructor(text,integer),
  public.course_responses(text,jsonb),public.course_set_activity(text,text,boolean,timestamptz),public.course_reset_pin(text,uuid,text),
  public.course_upload_file(text,text,text,text,text),public.course_delete_file(text,uuid),public.course_download_file(text,uuid)
  to anon,authenticated;
-- Las entregas nuevas requieren una cuenta del curso. Las existentes se conservan.
revoke all on function public.submit_workshop_response(jsonb) from public,anon,authenticated;
notify pgrst,'reload schema';
commit;

-- Para dar acceso docente: crea tu cuenta en la web y después ejecuta en SQL Editor:
-- select public.course_make_instructor('TU_USUARIO');
