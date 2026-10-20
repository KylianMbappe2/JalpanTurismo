-- Ejecutar setup.sql (generado), NO esta plantilla, en Supabase SQL Editor.
begin;

create table if not exists public.workshop_forms (
  id text primary key,
  title text not null,
  version integer not null,
  definition jsonb not null
);

create table if not exists public.workshop_responses (
  id uuid primary key,
  form_id text not null references public.workshop_forms(id),
  form_version integer not null,
  submitted_at timestamptz not null default now(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  email text not null default '' check (char_length(email) <= 254),
  phone text not null default '' check (char_length(phone) <= 30),
  business text not null default '' check (char_length(business) <= 160),
  municipality text not null default '' check (char_length(municipality) <= 120),
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  questions text not null default '' check (char_length(questions) <= 2000),
  consent_at timestamptz not null default now(),
  privacy_version text not null default '2026-10-19'
);
create index if not exists workshop_responses_form_date on public.workshop_responses (form_id, submitted_at desc);

alter table public.workshop_forms enable row level security;
alter table public.workshop_responses enable row level security;
revoke all on table public.workshop_forms, public.workshop_responses from public, anon, authenticated;
-- No policies: participants cannot read, update, delete, or directly insert records.
-- The instructor uses Supabase Table Editor with their own authenticated dashboard.

-- FORM_CATALOG

-- This deliberately narrow SECURITY DEFINER function is the only participant write path.
-- It validates against the server-side catalog and never returns personal information.
create or replace function public.submit_workshop_response(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity public.workshop_forms%rowtype;
  person jsonb;
  answers jsonb;
  q jsonb;
  answer jsonb;
  option_value jsonb;
  submission_id uuid;
  key text;
  limit_size integer;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text) > 60000 then
    raise exception 'Invalid submission' using errcode = '22023';
  end if;
  if (p_payload->>'id') is null or (p_payload->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'Invalid submission id' using errcode = '22023';
  end if;
  submission_id := (p_payload->>'id')::uuid;
  select * into activity from public.workshop_forms where id = p_payload->>'form_id';
  if not found or p_payload->'version' is distinct from to_jsonb(activity.version) then
    raise exception 'Invalid activity' using errcode = '22023';
  end if;
  person := p_payload->'participant';
  answers := p_payload->'answers';
  if jsonb_typeof(person) is distinct from 'object' or jsonb_typeof(answers) is distinct from 'object' or p_payload->'consent' is distinct from 'true'::jsonb then
    raise exception 'Invalid participant, answers or consent' using errcode = '22023';
  end if;
  if jsonb_typeof(person->'name') is distinct from 'string' or char_length(btrim(person->>'name')) not between 2 and 120 then
    raise exception 'Invalid name' using errcode = '22023';
  end if;
  foreach key in array array['email', 'phone', 'business', 'municipality'] loop
    limit_size := case key when 'email' then 254 when 'phone' then 30 when 'business' then 160 else 120 end;
    if person ? key and (jsonb_typeof(person->key) is distinct from 'string' or char_length(person->>key) > limit_size) then
      raise exception 'Invalid contact information' using errcode = '22023';
    end if;
  end loop;
  if coalesce(person->>'email', '') <> '' and person->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid email' using errcode = '22023';
  end if;
  if coalesce(person->>'phone', '') <> '' and (person->>'phone' !~ '^[+()0-9 .-]+$' or char_length(regexp_replace(person->>'phone', '[^0-9]', '', 'g')) < 7) then
    raise exception 'Invalid phone' using errcode = '22023';
  end if;
  if jsonb_typeof(p_payload->'questions') is distinct from 'string' or char_length(p_payload->>'questions') > 2000 then
    raise exception 'Invalid questions' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_object_keys(answers) as incoming(key)
    where not exists (select 1 from jsonb_array_elements(activity.definition->'questions') as known(q) where known.q->>'id' = incoming.key)
  ) then
    raise exception 'Unknown answer' using errcode = '22023';
  end if;

  for q in select value from jsonb_array_elements(activity.definition->'questions') loop
    key := q->>'id';
    if not answers ? key then
      if (q->>'required')::boolean then raise exception 'Missing required answer' using errcode = '22023'; end if;
      continue;
    end if;
    answer := answers->key;
    case q->>'type'
      when 'text' then
        if jsonb_typeof(answer) is distinct from 'string' or char_length(answers->>key) > coalesce((q->>'max')::integer, 4000) or (coalesce((q->>'required')::boolean, false) and btrim(answers->>key) = '') then
          raise exception 'Invalid text answer' using errcode = '22023';
        end if;
      when 'radio' then
        if jsonb_typeof(answer) is distinct from 'string' or not (q->'options' @> jsonb_build_array(answer)) then
          raise exception 'Invalid selected option' using errcode = '22023';
        end if;
      when 'multi' then
        if jsonb_typeof(answer) is distinct from 'array' then raise exception 'Invalid options' using errcode = '22023'; end if;
        if jsonb_array_length(answer) > jsonb_array_length(q->'options') or (select count(distinct value) from jsonb_array_elements(answer)) <> jsonb_array_length(answer) then
          raise exception 'Invalid options' using errcode = '22023';
        end if;
        for option_value in select value from jsonb_array_elements(answer) loop
          if not (q->'options' @> jsonb_build_array(option_value)) then raise exception 'Invalid selected option' using errcode = '22023'; end if;
        end loop;
      when 'check' then
        if jsonb_typeof(answer) is distinct from 'boolean' then raise exception 'Invalid checkbox' using errcode = '22023'; end if;
      else raise exception 'Invalid question type' using errcode = '22023';
    end case;
  end loop;

  insert into public.workshop_responses (id, form_id, form_version, full_name, email, phone, business, municipality, answers, questions)
  values (submission_id, activity.id, activity.version, btrim(person->>'name'), coalesce(person->>'email', ''), coalesce(person->>'phone', ''), coalesce(person->>'business', ''), coalesce(person->>'municipality', ''), answers, p_payload->>'questions')
  on conflict (id) do nothing;
  -- A receipt confirms these exact answers, including after a timed-out first request.
  if not exists (
    select 1 from public.workshop_responses r where r.id = submission_id
      and r.form_id = activity.id and r.form_version = activity.version
      and r.full_name = btrim(person->>'name')
      and r.email = coalesce(person->>'email', '') and r.phone = coalesce(person->>'phone', '')
      and r.business = coalesce(person->>'business', '') and r.municipality = coalesce(person->>'municipality', '')
      and r.answers = p_payload->'answers' and r.questions = p_payload->>'questions'
  ) then
    raise exception 'This submission id already has different answers' using errcode = '23505';
  end if;
  return jsonb_build_object('saved', true, 'id', submission_id);
end;
$$;
revoke all on function public.submit_workshop_response(jsonb) from public, anon, authenticated;
grant execute on function public.submit_workshop_response(jsonb) to anon, authenticated;
comment on function public.submit_workshop_response(jsonb) is 'Insert-only workshop submissions. Validated server-side; no PII returned. UUID retries are idempotent.';
notify pgrst, 'reload schema';
commit;
