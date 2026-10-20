import { writeFile, readFile } from 'node:fs/promises';
import { forms, extraFields, getQuestions } from '../public/forms.js';

const rows = forms.map(form => {
  const questions = getQuestions(form).flatMap(q => [q, ...(extraFields[q.id] ? [{ id: extraFields[q.id].id, type: 'text', required: false, max: 300 }] : [])]);
  const values = [form.id, form.title, JSON.stringify({ questions })].map(v => `'${v.replace(/'/g, "''")}'`);
  return `(${values[0]}, ${values[1]}, ${form.version}, ${values[2]}::jsonb)`;
}).join(',\n');
const template = await readFile(new URL('../supabase/schema.template.sql', import.meta.url), 'utf8');
const base = template.replace('-- FORM_CATALOG', `insert into public.workshop_forms (id, title, version, definition) values\n${rows}\non conflict (id) do update set title = excluded.title, version = excluded.version, definition = excluded.definition;`);
const course = await readFile(new URL('../supabase/migrations/002_course.sql', import.meta.url), 'utf8');
const editable = await readFile(new URL('../supabase/migrations/003_editable.sql', import.meta.url), 'utf8');
// One transaction prevents the legacy anonymous grant from becoming visible mid-upgrade.
const transactionBody = sql => sql.replace(/^(begin|commit);[ \t]*$/gmi, '');
await writeFile(new URL('../supabase/setup.sql', import.meta.url), `-- Aula Sierra: instalación y actualización completa del curso.\nbegin;\n${transactionBody(base)}\n${transactionBody(course)}\n${transactionBody(editable)}\ncommit;\n`);
console.log('supabase/setup.sql actualizado: catálogo, cuentas, entregas editables y seguimiento.');
