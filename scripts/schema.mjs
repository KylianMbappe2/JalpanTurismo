import { writeFile, readFile } from 'node:fs/promises';
import { forms, extraFields, getAnswerQuestions, getUploadSlots } from '../public/forms.js';
import { mainActivityIds } from '../public/course-plan.js';

const catalogValues = form => {
  const questions = getAnswerQuestions(form).flatMap(q => [q, ...(extraFields[q.id] ? [{ id: extraFields[q.id].id, type: 'text', required: false, max: 300 }] : [])]);
  const values = [form.id, form.title, JSON.stringify({ questions, uploads: getUploadSlots(form).map(q => q.id) })].map(v => `'${v.replace(/'/g, "''")}'`);
  return `${values[0]}, ${values[1]}, ${form.version}, ${values[2]}::jsonb`;
};
const rows = forms.map(form => `(${catalogValues(form)})`).join(',\n');
const template = await readFile(new URL('../supabase/schema.template.sql', import.meta.url), 'utf8');
const base = template.replace('-- FORM_CATALOG', `insert into public.workshop_forms (id, title, version, definition) values\n${rows}\non conflict (id) do update set title = excluded.title, version = excluded.version, definition = excluded.definition;`);
const course = await readFile(new URL('../supabase/migrations/002_course.sql', import.meta.url), 'utf8');
const editable = await readFile(new URL('../supabase/migrations/003_editable.sql', import.meta.url), 'utf8');
const practices = await readFile(new URL('../supabase/migrations/004_practicas.sql', import.meta.url), 'utf8');
const guide = await readFile(new URL('../supabase/migrations/005_guia_prompts.sql', import.meta.url), 'utf8');
const todayRows = forms.filter(form => form.id.startsWith('sesion2-')).map((form, index) => `(${catalogValues(form)}, ${index + 6})`).join(',\n');
const sessionTwo = `-- Generado por pnpm schema. Agrega la sesión 2 y ordena las prácticas anteriores como extras.\n-- No borra usuarios, trabajos, entregas, archivos ni versiones. Conserva publicación, fechas y bloqueos existentes.\nbegin;\ninsert into public.workshop_forms (id,title,version,definition,position) values\n${todayRows}\non conflict (id) do update set title = excluded.title,version = excluded.version,definition = excluded.definition,position = excluded.position;\nupdate public.workshop_forms set position = case id\n  when 'pinal-temporadas' then 20 when 'pinal-competencia' then 21 when 'pinal-precios' then 22\n  when 'pinal-estrategia' then 23 when 'pinal-cierre' then 24 else position end\nwhere id in ('pinal-temporadas','pinal-competencia','pinal-precios','pinal-estrategia','pinal-cierre');\nnotify pgrst,'reload schema';\ncommit;\n`;
await writeFile(new URL('../supabase/migrations/006_sesion_dos.sql', import.meta.url), sessionTwo);
// Las migraciones publicadas se conservan; la reorganización vive en 008.
const profiles = await readFile(new URL('../supabase/migrations/007_perfiles_turisticos.sql', import.meta.url), 'utf8');
const mainRows = mainActivityIds.map((id, index) => `(${catalogValues(forms.find(form => form.id === id))}, ${index + 1}, true)`).join(',\n');
const curriculum = `-- Generado por pnpm schema. Publica solo los seis trabajos acordados.
-- No modifica usuarios, borradores, entregas, respuestas, archivos, folios ni versiones.
-- Los trabajos anteriores siguen consultables por sus dueños y por el docente.
begin;
insert into public.workshop_forms (id,title,version,definition,position,is_published) values
${mainRows}
on conflict (id) do update set title=excluded.title,version=excluded.version,definition=excluded.definition,position=excluded.position,is_published=true;
update public.workshop_forms set is_published=false where id not in (${mainActivityIds.map(id => `'${id}'`).join(',')});
notify pgrst,'reload schema';
commit;
`;
await writeFile(new URL('../supabase/migrations/008_seis_actividades.sql', import.meta.url), curriculum);
// One transaction prevents the legacy anonymous grant from becoming visible mid-upgrade.
const transactionBody = sql => sql.replace(/^(begin|commit);[ \t]*$/gmi, '');
await writeFile(new URL('../supabase/setup.sql', import.meta.url), `-- Aula Sierra: instalación y actualización completa del curso.\nbegin;\n${transactionBody(base)}\n${transactionBody(course)}\n${transactionBody(editable)}\n${transactionBody(practices)}\n${transactionBody(guide)}\n${transactionBody(sessionTwo)}\n${transactionBody(profiles)}\n${transactionBody(curriculum)}\ncommit;\n`);
console.log('supabase/setup.sql actualizado: seis actividades principales y trabajos anteriores conservados.');
