-- Solo para quien administra Supabase: devuelve datos personales.
select
  r.id as folio,
  r.submitted_at as fecha,
  f.title as actividad,
  r.form_version as version,
  r.full_name as nombre,
  r.email as correo,
  r.phone as telefono,
  r.business as negocio,
  r.municipality as municipio,
  a.key as pregunta_id,
  coalesce(q.value->>'label', a.key) as pregunta,
  a.value as respuesta,
  r.questions as preguntas_al_instructor
from public.workshop_responses r
join public.workshop_forms f on f.id = r.form_id
left join lateral jsonb_each(r.answers) a on true
left join lateral jsonb_array_elements(f.definition->'questions') q on q.value->>'id' = a.key
order by r.submitted_at desc, r.id, a.key;
