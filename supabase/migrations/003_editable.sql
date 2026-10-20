-- Aula Sierra: las entregas se pueden corregir mientras la actividad siga abierta.
-- Conserva usuarios, borradores, entregas y archivos. Se puede ejecutar más de una vez.
begin;

alter table public.workshop_forms add column if not exists lock_after_due boolean not null default false;
alter table public.workshop_responses add column if not exists updated_at timestamptz;
alter table public.workshop_responses add column if not exists edit_count integer not null default 0;
alter table public.aula_work add column if not exists resubmitted_at timestamptz;

create table if not exists public.workshop_response_versions (
  id bigint generated always as identity primary key,
  response_id uuid not null references public.workshop_responses(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  questions text not null default '' check (char_length(questions) <= 2000),
  participant jsonb not null check (jsonb_typeof(participant) = 'object'),
  saved_at timestamptz not null default now()
);
create index if not exists workshop_response_versions_response on public.workshop_response_versions(response_id, saved_at desc);
alter table public.workshop_response_versions enable row level security;
revoke all on public.workshop_response_versions from public, anon, authenticated;

-- La actividad acepta guardados solo si está publicada y, si así se configuró, aún no vence.
create or replace function public.aula_activity_open(p_form_id text) returns void
language plpgsql stable security definer set search_path = '' as $$
declare activity public.workshop_forms%rowtype;
begin
  select * into activity from public.workshop_forms where id = p_form_id;
  if not found or not activity.is_published then raise exception 'Activity closed' using errcode = 'PT403'; end if;
  if activity.lock_after_due and activity.due_at is not null and activity.due_at <= now() then raise exception 'Activity closed' using errcode = 'PT403'; end if;
end;
$$;

create or replace function public.aula_save_work(p_user uuid,p_payload jsonb,p_step integer,p_revision integer) returns public.aula_work
language plpgsql security definer set search_path = '' as $$
declare work public.aula_work%rowtype;
begin
  if p_step is null or p_step not between 0 and 2 or p_revision is null or p_revision < 0 then raise exception 'Invalid step or revision' using errcode = '22023'; end if;
  perform public.validate_course_draft(p_payload);
  perform public.aula_activity_open(p_payload->>'form_id');
  insert into public.aula_work(user_id,form_id,payload,step,revision)
  values(p_user,p_payload->>'form_id',p_payload,p_step,1) on conflict(user_id,form_id) do nothing;
  select * into work from public.aula_work where user_id = p_user and form_id = p_payload->>'form_id' for update;
  if work.payload = p_payload and work.step = p_step then return work; end if;
  if work.revision <> p_revision or work.payload->>'id' <> p_payload->>'id' then raise exception 'Draft changed in another tab' using errcode = 'PT409'; end if;
  update public.aula_work set payload = p_payload,step = p_step,revision = revision + 1,saved_at = now()
  where user_id = p_user and form_id = work.form_id returning * into work;
  return work;
end;
$$;

create or replace function public.course_complete(p_token text,p_payload jsonb,p_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  work public.aula_work%rowtype;
  previous public.workshop_responses%rowtype;
  receipt jsonb;
  person jsonb := p_payload->'participant';
  clone_id uuid;
begin
  perform public.validate_course_draft(p_payload);
  if p_payload->'consent' is distinct from 'true'::jsonb or p_revision is null or p_revision < 0 then
    raise exception 'Invalid consent or revision' using errcode = '22023';
  end if;
  select * into work from public.aula_work where user_id = account.id and form_id = p_payload->>'form_id' for update;
  if found and work.status = 'submitted' then
    if work.payload->>'id' is distinct from p_payload->>'id' then raise exception 'Draft changed in another tab' using errcode = 'PT409'; end if;
    select * into previous from public.workshop_responses where id = work.response_id for update;
    if not found or previous.student_id is distinct from account.id then raise exception 'Submission id unavailable' using errcode = '23505'; end if;
    -- El mismo contenido no crea otra versión, aunque la actividad ya esté cerrada.
    if previous.full_name = btrim(coalesce(person->>'name',''))
      and previous.email = coalesce(person->>'email','') and previous.phone = coalesce(person->>'phone','')
      and previous.business = coalesce(person->>'business','') and previous.municipality = coalesce(person->>'municipality','')
      and previous.answers = p_payload->'answers' and previous.questions = coalesce(p_payload->>'questions','') then
      return jsonb_build_object('saved',true,'id',work.response_id,'work',to_jsonb(work));
    end if;
    perform public.aula_activity_open(p_payload->>'form_id');
    if work.revision <> p_revision or work.payload->>'id' is distinct from p_payload->>'id' then raise exception 'Draft changed in another tab' using errcode = 'PT409'; end if;
    -- La función original valida la entrega. Se inserta una copia temporal y se descarta tras copiar sus campos.
    clone_id := pg_catalog.gen_random_uuid();
    perform public.submit_workshop_response(jsonb_set(p_payload,'{id}',to_jsonb(clone_id::text)));
    insert into public.workshop_response_versions(response_id,answers,questions,participant)
    values(previous.id,previous.answers,previous.questions,jsonb_build_object('name',previous.full_name,'email',previous.email,'phone',previous.phone,'business',previous.business,'municipality',previous.municipality));
    update public.workshop_responses as orig set full_name = clone.full_name,email = clone.email,phone = clone.phone,
      business = clone.business,municipality = clone.municipality,answers = clone.answers,questions = clone.questions,
      form_version = clone.form_version,updated_at = now(),edit_count = orig.edit_count + 1
    from public.workshop_responses as clone where orig.id = previous.id and clone.id = clone_id;
    delete from public.workshop_responses where id = clone_id;
    perform public.aula_save_work(account.id,p_payload,2,p_revision);
    update public.aula_work set resubmitted_at = now(),saved_at = now(),revision = revision + 1
    where user_id = account.id and form_id = p_payload->>'form_id' returning * into work;
    update public.aula_users set full_name = btrim(person->>'name'),email = coalesce(person->>'email',''),phone = coalesce(person->>'phone',''),
      business = coalesce(person->>'business',''),municipality = coalesce(person->>'municipality',''),updated_at = now() where id = account.id;
    return jsonb_build_object('saved',true,'id',work.response_id,'work',to_jsonb(work));
  end if;

  perform public.aula_save_work(account.id,p_payload,2,p_revision);
  if exists(select 1 from public.workshop_responses where id = (p_payload->>'id')::uuid and student_id is distinct from account.id) then raise exception 'Submission id unavailable' using errcode = '23505'; end if;
  receipt := public.submit_workshop_response(p_payload);
  update public.workshop_responses set student_id = account.id where id = (receipt->>'id')::uuid;
  update public.aula_work set status = 'submitted',submitted_at = now(),saved_at = now(),response_id = (receipt->>'id')::uuid,revision = revision + 1
  where user_id = account.id and form_id = p_payload->>'form_id' returning * into work;
  update public.aula_users set full_name = btrim(person->>'name'),email = coalesce(person->>'email',''),phone = coalesce(person->>'phone',''),
    business = coalesce(person->>'business',''),municipality = coalesce(person->>'municipality',''),updated_at = now() where id = account.id;
  return jsonb_build_object('saved',true,'id',work.response_id,'work',to_jsonb(work));
end;
$$;

create or replace function public.course_load(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype := public.aula_session_user(p_token);
begin
  return jsonb_build_object(
    'role',account.role,
    'profile',jsonb_build_object('user_id',account.id,'username',account.username,'full_name',account.full_name,'email',account.email,'phone',account.phone,'business',account.business,'municipality',account.municipality),
    'activities',coalesce((select jsonb_agg(jsonb_build_object(
      'id',f.id,'title',f.title,'version',f.version,'position',f.position,'is_published',f.is_published,'due_at',f.due_at,'lock_after_due',f.lock_after_due,
      'editable',f.is_published and not (f.lock_after_due and f.due_at is not null and f.due_at <= now()),
      'closed_reason',case
        when not f.is_published then 'El instructor ocultó esta actividad.'
        when f.lock_after_due and f.due_at is not null and f.due_at <= now() then 'El plazo para editar esta actividad ya terminó.'
        else null end
    ) order by f.position) from public.workshop_forms f
      where f.is_published or account.role = 'instructor' or exists(select 1 from public.aula_work w where w.user_id = account.id and w.form_id = f.id)),'[]'::jsonb),
    'work',coalesce((select jsonb_agg(to_jsonb(w)) from public.aula_work w where w.user_id = account.id),'[]'::jsonb),
    'files',public.aula_file_list(account.id,null));
end;
$$;

create or replace function public.course_upload_file(p_token text,p_form_id text,p_name text,p_mime text,p_data text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  content bytea;
  created public.aula_files%rowtype;
  clean_name text := btrim(regexp_replace(coalesce(p_name,''),'[\\/:*?"<>|[:cntrl:]]','_','g'));
begin
  perform public.aula_activity_open(p_form_id);
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
  perform public.aula_activity_open(target.form_id);
  delete from public.aula_files where id = target.id;
  return jsonb_build_object('ok',true);
end;
$$;

drop function if exists public.course_set_activity(text,text,boolean,timestamptz);
create or replace function public.course_set_activity(p_token text,p_form_id text,p_published boolean,p_due_at timestamptz default null,p_lock_after_due boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare activity public.workshop_forms%rowtype;
begin
  perform public.aula_require_instructor(p_token);
  if p_published is null or p_lock_after_due is null or (p_due_at is not null and not isfinite(p_due_at)) then raise exception 'Invalid activity settings' using errcode = '22023'; end if;
  update public.workshop_forms set is_published = p_published,due_at = p_due_at,lock_after_due = p_lock_after_due where id = p_form_id returning * into activity;
  if not found then raise exception 'Activity not found' using errcode = '22023'; end if;
  return jsonb_build_object('id',activity.id,'title',activity.title,'version',activity.version,'position',activity.position,'is_published',activity.is_published,'due_at',activity.due_at,'lock_after_due',activity.lock_after_due,
    'editable',activity.is_published and not (activity.lock_after_due and activity.due_at is not null and activity.due_at <= now()),
    'closed_reason',case when not activity.is_published then 'El instructor ocultó esta actividad.' when activity.lock_after_due and activity.due_at is not null and activity.due_at <= now() then 'El plazo para editar esta actividad ya terminó.' else null end);
end;
$$;

create or replace function public.course_tracking(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype := public.aula_require_instructor(p_token);
begin
  return jsonb_build_object(
    'students',coalesce((select jsonb_agg(jsonb_build_object('user_id',u.id,'username',u.username,'full_name',u.full_name) order by u.full_name)
      from public.aula_users u where u.role = 'student'),'[]'::jsonb),
    'activities',coalesce((select jsonb_agg(jsonb_build_object(
      'id',f.id,'title',f.title,'position',f.position,
      'total',(select count(*) from public.aula_users where role = 'student'),
      'submitted',(select count(*) from public.aula_work w join public.aula_users stu on stu.id = w.user_id where w.form_id = f.id and w.status = 'submitted' and stu.role = 'student'),
      'missing',(select count(*) from public.aula_users where role = 'student') - (select count(*) from public.aula_work w join public.aula_users stu on stu.id = w.user_id where w.form_id = f.id and w.status = 'submitted' and stu.role = 'student')
    ) order by f.position) from public.workshop_forms f where f.is_published),'[]'::jsonb),
    'cells',coalesce((select jsonb_agg(jsonb_build_object(
      'user_id',stu.id,'form_id',f.id,
      'state',case when w.user_id is null then 'pending' when w.status = 'submitted' and w.resubmitted_at is not null then 'edited' when w.status = 'submitted' then 'submitted' else 'draft' end,
      'saved_at',w.saved_at,'submitted_at',w.submitted_at,
      'files',(select count(*) from public.aula_files file where file.user_id = stu.id and file.form_id = f.id)
    )) from public.aula_users stu join public.workshop_forms f on f.is_published
      left join public.aula_work w on w.user_id = stu.id and w.form_id = f.id where stu.role = 'student'),'[]'::jsonb));
end;
$$;

create or replace function public.course_student_work(p_token text,p_user_id uuid,p_form_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  student public.aula_users%rowtype;
  work public.aula_work%rowtype;
  response public.workshop_responses%rowtype;
  state text;
begin
  perform public.aula_require_instructor(p_token);
  select * into student from public.aula_users where id = p_user_id;
  if not found then raise exception 'User not found' using errcode = '22023'; end if;
  if not exists(select 1 from public.workshop_forms where id = p_form_id) then raise exception 'Activity not found' using errcode = '22023'; end if;
  select * into work from public.aula_work where user_id = student.id and form_id = p_form_id;
  if found and work.response_id is not null then select * into response from public.workshop_responses where id = work.response_id; end if;
  state := case when not found then 'pending' when work.status = 'submitted' and work.resubmitted_at is not null then 'edited' when work.status = 'submitted' then 'submitted' else 'draft' end;
  return jsonb_build_object(
    'user',jsonb_build_object('user_id',student.id,'username',student.username,'full_name',student.full_name),
    'form_id',p_form_id,'state',state,
    'payload',case when found then work.payload else null end,
    'saved_at',work.saved_at,'submitted_at',work.submitted_at,'resubmitted_at',work.resubmitted_at,'revision',work.revision,
    'response',case when response.id is null then null else jsonb_build_object('id',response.id,'answers',response.answers,'questions',response.questions,'full_name',response.full_name,'email',response.email,'phone',response.phone,'business',response.business,'municipality',response.municipality,'edit_count',response.edit_count,'updated_at',response.updated_at,'submitted_at',response.submitted_at) end,
    'files',public.aula_file_list(student.id,p_form_id),
    'versions',coalesce((select jsonb_agg(jsonb_build_object('answers',v.answers,'questions',v.questions,'participant',v.participant,'saved_at',v.saved_at) order by v.saved_at desc)
      from public.workshop_response_versions v where v.response_id = work.response_id),'[]'::jsonb));
end;
$$;

-- Solo SQL Editor. Crea o promueve al instructor. Si la cuenta ya existe, no cambia su PIN.
create or replace function public.course_seed_instructor(p_username text,p_full_name text,p_pin text) returns text
language plpgsql security definer set search_path = '' as $$
declare name text := lower(btrim(coalesce(p_username,'')));
begin
  if name !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then raise exception 'Usuario inválido' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_full_name,''))) not between 2 and 120 then raise exception 'Nombre inválido' using errcode = '22023'; end if;
  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then raise exception 'PIN inválido' using errcode = '22023'; end if;
  insert into public.aula_users(username,full_name,pin_hash,role)
  values(name,btrim(p_full_name),extensions.crypt(p_pin,extensions.gen_salt('bf',8)),'instructor')
  on conflict(username) do update set role = 'instructor',full_name = excluded.full_name,failed_attempts = 0,locked_until = null,updated_at = now();
  return 'Instructor listo: ' || name;
end;
$$;

revoke all on function public.aula_activity_open(text),public.course_seed_instructor(text,text,text),
  public.course_set_activity(text,text,boolean,timestamptz,boolean),public.course_tracking(text),public.course_student_work(text,uuid,text)
  from public,anon,authenticated;
grant execute on function public.course_set_activity(text,text,boolean,timestamptz,boolean),public.course_tracking(text),public.course_student_work(text,uuid,text)
  to anon,authenticated;
notify pgrst,'reload schema';
commit;
