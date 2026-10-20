import { forms } from '../public/forms.js';

export const TOKEN = 'a'.repeat(64);

function closed(activity) {
  const duePast = activity.lock_after_due && activity.due_at && new Date(activity.due_at).getTime() <= Date.now();
  activity.editable = activity.is_published && !duePast;
  activity.closed_reason = !activity.is_published ? 'El instructor ocultó esta actividad.' : duePast ? 'El plazo para editar esta actividad ya terminó.' : null;
}

function sameOfficial(response, payload) {
  const person = payload.participant ?? {};
  return response.full_name === String(person.name ?? '').trim()
    && (response.email ?? '') === (person.email ?? '')
    && (response.phone ?? '') === (person.phone ?? '')
    && (response.business ?? '') === (person.business ?? '')
    && (response.municipality ?? '') === (person.municipality ?? '')
    && JSON.stringify(response.answers) === JSON.stringify(payload.answers ?? {})
    && (response.questions ?? '') === (payload.questions ?? '');
}

export async function courseFixture(browser, options = {}) {
  const ownId = '10000000-0000-4000-8000-000000000001';
  const luisId = '10000000-0000-4000-8000-000000000002';
  const mariaId = '10000000-0000-4000-8000-000000000003';
  const role = options.instructor ? 'instructor' : 'student';
  const profile = { user_id: ownId, username: options.instructor ? 'docente' : 'ana.sierra', full_name: options.instructor ? 'Docente Sierra' : 'Ana Sierra', email: '', business: '', phone: '', municipality: '', ...options.profile };
  const activities = forms.map((f, i) => ({ id: f.id, title: f.title, version: 1, position: i + 1, is_published: true, due_at: null, lock_after_due: false, editable: true, closed_reason: null }));
  if (options.closedForm) {
    const activity = activities.find(f => f.id === options.closedForm);
    activity.is_published = true;
    activity.lock_after_due = true;
    activity.due_at = '2020-01-01T00:00:00.000Z';
    closed(activity);
  }
  const works = new Map();
  const versions = [];
  const luisPayload = { id: '20000000-0000-4000-8000-000000000002', form_id: 'agente-ia', version: 1, participant: { name: 'Luis Turismo', email: 'luis@example.test', phone: '4411234567', business: 'Cabañas del Bosque', municipality: 'Jalpan' }, answers: { a2: 'Cabañas del Bosque', a9: ['Transferencia'] }, questions: '¿Cómo activo mi agente?', consent: true };
  const mariaPayload = { id: '20000000-0000-4000-8000-000000000030', form_id: 'whatsapp', version: 1, participant: { name: 'María Bosque', email: '', phone: '', business: 'Bosque Tours', municipality: 'Pinal de Amoles' }, answers: { w1: 'Hola, soy María y este es mi borrador' }, questions: '¿El horario de ausencia se guarda solo?', consent: false };
  const nowSeed = new Date().toISOString();
  const roster = options.instructor ? [
    { user_id: luisId, username: 'luis', full_name: 'Luis Turismo', email: 'luis@example.test', business: 'Cabañas del Bosque', municipality: 'Jalpan', role: 'student', updated_at: nowSeed, work: [{ user_id: luisId, form_id: 'agente-ia', payload: luisPayload, step: 1, revision: 2, status: 'submitted', saved_at: nowSeed, submitted_at: nowSeed, resubmitted_at: null, response_id: luisPayload.id }] },
    { user_id: mariaId, username: 'maria.bosque', full_name: 'María Bosque', email: '', business: 'Bosque Tours', municipality: 'Pinal de Amoles', role: 'student', updated_at: nowSeed, work: [{ user_id: mariaId, form_id: 'whatsapp', payload: mariaPayload, step: 1, revision: 1, status: 'draft', saved_at: nowSeed, submitted_at: null, resubmitted_at: null, response_id: null }] },
  ] : [];
  const responses = options.instructor ? [{ id: luisPayload.id, student_id: luisId, full_name: 'Luis Turismo', email: 'luis@example.test', phone: '4411234567', business: 'Cabañas del Bosque', municipality: 'Jalpan', form_id: 'agente-ia', submitted_at: nowSeed, questions: '¿Cómo activo mi agente?', answers: { a2: 'Cabañas del Bosque', a9: ['Transferencia'] }, edit_count: 0 }] : [];
  if (options.closedForm && !options.instructor) {
    const payload = { id: '20000000-0000-4000-8000-000000000001', form_id: options.closedForm, version: 1, participant: { name: 'Ana Sierra', email: '', phone: '', business: '', municipality: '' }, answers: { a2: 'Entrega cerrada' }, questions: '', consent: true };
    works.set(options.closedForm, { user_id: ownId, form_id: options.closedForm, payload, step: 1, revision: 2, status: 'submitted', saved_at: nowSeed, submitted_at: nowSeed, resubmitted_at: null, response_id: payload.id });
    responses.push({ id: payload.id, student_id: ownId, form_id: options.closedForm, submitted_at: nowSeed, full_name: 'Ana Sierra', email: '', phone: '', business: '', municipality: '', questions: '', answers: { a2: 'Entrega cerrada' }, edit_count: 0 });
  }
  const submitted = [];
  const pinResets = [];
  const registered = [];
  const files = options.instructor ? [{ id: '30000000-0000-4000-8000-000000000010', user_id: luisId, form_id: 'agente-ia', name: 'plan-de-negocio.pdf', mime: 'application/pdf', size: 9, created_at: nowSeed, data: btoa('pdf-bytes') }] : [];
  let attempts = 0;
  let failSave = false;
  const meta = ({ data, ...file }) => file;
  await browser.route('**/config.json', async route => route.fulfill({ json: { supabaseUrl: 'https://qa.supabase.co', supabaseKey: 'sb_publishable_public_test_key' } }));
  await browser.route('https://qa.supabase.co/**', async route => {
    const url = new URL(route.request.url);
    const body = route.request.postData ? JSON.parse(route.request.postData) : {};
    const now = new Date().toISOString();
    const fulfill = json => route.fulfill({ json });
    const name = url.pathname.replace('/rest/v1/rpc/', '');
    const granted = { ok: true, token: TOKEN, user: { id: ownId, username: profile.username } };
    if (name === 'course_login') return fulfill(body.p_pin === '0000' ? { ok: false, error: 'invalid_credentials' } : granted);
    if (name === 'course_register') {
      if (body.p_username === 'luis') return fulfill({ ok: false, error: 'username_taken' });
      registered.push(body); profile.username = body.p_username; profile.full_name = body.p_full_name;
      return fulfill({ ...granted, user: { id: ownId, username: body.p_username } });
    }
    if (name === 'course_logout') return fulfill({ ok: true });
    if (body.p_token !== TOKEN) return route.fulfill({ status: 401, json: { code: 'PT401' } });
    if (name === 'course_load') return fulfill({ role, profile, activities: activities.filter(f => options.instructor || f.is_published || works.has(f.id)), work: [...works.values()], files: files.filter(f => f.user_id === ownId).map(meta) });
    if (name === 'course_save') {
      if (failSave) return route.fulfill({ status: 503, json: {} });
      const payload = structuredClone(body.p_payload);
      const activity = activities.find(f => f.id === payload.form_id);
      if (!activity || activity.editable === false) return route.fulfill({ status: 403, json: { code: 'PT403' } });
      const old = works.get(payload.form_id);
      if (old && JSON.stringify(old.payload) === JSON.stringify(payload) && old.step === body.p_step) return fulfill(old);
      if (old && old.revision !== body.p_revision) return route.fulfill({ status: 409, json: { code: 'PT409' } });
      const work = { user_id: ownId, form_id: payload.form_id, payload, step: body.p_step, revision: (old?.revision ?? 0) + 1, status: old?.status === 'submitted' ? 'submitted' : 'draft', saved_at: now, submitted_at: old?.submitted_at ?? null, response_id: old?.response_id ?? null, resubmitted_at: old?.resubmitted_at ?? null };
      works.set(payload.form_id, work); return fulfill(work);
    }
    if (name === 'course_complete') {
      attempts++;
      if (options.failFirstSubmit && attempts === 1) return route.fulfill({ status: 503, json: {} });
      const payload = structuredClone(body.p_payload);
      const old = works.get(payload.form_id);
      const official = responses.find(r => r.id === old?.response_id);
      if (old?.status === 'submitted' && official && sameOfficial(official, payload)) return fulfill({ id: old.response_id, saved: true, work: old });
      const activity = activities.find(f => f.id === payload.form_id);
      if (!activity || activity.editable === false) return route.fulfill({ status: 403, json: { code: 'PT403' } });
      if (old && (old.revision !== body.p_revision || old.payload?.id !== payload.id)) return route.fulfill({ status: 409, json: { code: 'PT409' } });
      submitted.push(payload);
      if (old?.status === 'submitted' && official) {
        versions.unshift({ response_id: official.id, answers: structuredClone(official.answers), questions: official.questions, participant: { name: official.full_name, email: official.email, phone: official.phone, business: official.business, municipality: official.municipality }, saved_at: now });
        official.answers = structuredClone(payload.answers);
        official.questions = payload.questions ?? '';
        official.full_name = payload.participant?.name ?? official.full_name;
        official.email = payload.participant?.email ?? '';
        official.phone = payload.participant?.phone ?? '';
        official.business = payload.participant?.business ?? '';
        official.municipality = payload.participant?.municipality ?? '';
        official.edit_count = (official.edit_count ?? 0) + 1;
        const work = { ...old, payload, status: 'submitted', revision: old.revision + 1, saved_at: now, resubmitted_at: now };
        works.set(payload.form_id, work);
        return fulfill({ id: official.id, saved: true, work });
      }
      const work = { ...(old ?? {}), user_id: ownId, form_id: payload.form_id, payload, status: 'submitted', revision: (old?.revision ?? 0) + 1, submitted_at: now, saved_at: now, response_id: payload.id, resubmitted_at: null };
      works.set(payload.form_id, work);
      responses.push({ id: payload.id, student_id: ownId, form_id: payload.form_id, submitted_at: now, full_name: payload.participant?.name ?? '', email: payload.participant?.email ?? '', phone: payload.participant?.phone ?? '', business: payload.participant?.business ?? '', municipality: payload.participant?.municipality ?? '', questions: payload.questions ?? '', answers: structuredClone(payload.answers), edit_count: 0 });
      return fulfill({ id: payload.id, saved: true, work });
    }
    if (name === 'course_upload_file') {
      const activity = activities.find(f => f.id === body.p_form_id);
      if (!activity || activity.editable === false) return route.fulfill({ status: 403, json: { code: 'PT403' } });
      if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'].includes(body.p_mime)) return route.fulfill({ status: 415, json: { code: 'PT415' } });
      const file = { id: `30000000-0000-4000-8000-${String(files.length + 1).padStart(12, '0')}`, user_id: ownId, form_id: body.p_form_id, name: body.p_name, mime: body.p_mime, size: Math.floor(body.p_data.length * 3 / 4), created_at: now, data: body.p_data };
      files.push(file); return fulfill(meta(file));
    }
    if (name === 'course_delete_file') {
      const index = files.findIndex(f => f.id === body.p_file_id && f.user_id === ownId);
      if (index < 0) return route.fulfill({ status: 404, json: { code: 'PT404' } });
      const activity = activities.find(f => f.id === files[index].form_id);
      if (!activity || activity.editable === false) return route.fulfill({ status: 403, json: { code: 'PT403' } });
      files.splice(index, 1); return fulfill({ ok: true });
    }
    if (name === 'course_download_file') {
      const file = files.find(f => f.id === body.p_file_id && (options.instructor || f.user_id === ownId));
      return file ? fulfill(file) : route.fulfill({ status: 404, json: { code: 'PT404' } });
    }
    if (!options.instructor) return route.fulfill({ status: 403, json: { code: 'PT403' } });
    if (name === 'course_set_activity') {
      const activity = activities.find(f => f.id === body.p_form_id);
      activity.is_published = body.p_published; activity.due_at = body.p_due_at; activity.lock_after_due = Boolean(body.p_lock_after_due); closed(activity); return fulfill(activity);
    }
    if (name === 'course_instructor') return fulfill({ profiles: roster.map(({ work, ...person }) => person), work: roster.flatMap(person => person.work), responses });
    if (name === 'course_responses') return fulfill(responses.filter(r => body.p_ids.includes(r.id)).map(r => ({ ...r, files: files.filter(f => f.user_id === r.student_id && f.form_id === r.form_id).map(meta) })));
    if (name === 'course_reset_pin') { pinResets.push(body); return fulfill({ ok: true }); }
    if (name === 'course_tracking') {
      const students = roster.map(person => ({ user_id: person.user_id, username: person.username, full_name: person.full_name }));
      const published = activities.filter(f => f.is_published);
      const cells = students.flatMap(student => published.map(activity => {
        const work = roster.find(person => person.user_id === student.user_id).work.find(item => item.form_id === activity.id);
        const state = !work ? 'pending' : work.status === 'submitted' && work.resubmitted_at ? 'edited' : work.status === 'submitted' ? 'submitted' : 'draft';
        return { user_id: student.user_id, form_id: activity.id, state, saved_at: work?.saved_at ?? null, submitted_at: work?.submitted_at ?? null, files: files.filter(f => f.user_id === student.user_id && f.form_id === activity.id).length };
      }));
      return fulfill({
        students,
        activities: published.map(activity => {
          const submittedCount = cells.filter(cell => cell.form_id === activity.id && (cell.state === 'submitted' || cell.state === 'edited')).length;
          return { id: activity.id, title: activity.title, position: activity.position, total: students.length, submitted: submittedCount, missing: students.length - submittedCount };
        }),
        cells,
      });
    }
    if (name === 'course_student_work') {
      const student = roster.find(person => person.user_id === body.p_user_id);
      if (!student || !activities.some(f => f.id === body.p_form_id)) return route.fulfill({ status: 400, json: { code: '22023' } });
      const work = student.work.find(item => item.form_id === body.p_form_id);
      const response = responses.find(r => r.id === work?.response_id) ?? null;
      const state = !work ? 'pending' : work.status === 'submitted' && work.resubmitted_at ? 'edited' : work.status === 'submitted' ? 'submitted' : 'draft';
      return fulfill({
        user: { user_id: student.user_id, username: student.username, full_name: student.full_name },
        form_id: body.p_form_id, state, payload: work?.payload ?? null, saved_at: work?.saved_at ?? null, submitted_at: work?.submitted_at ?? null, resubmitted_at: work?.resubmitted_at ?? null, revision: work?.revision ?? null,
        response: response ? { id: response.id, answers: response.answers, questions: response.questions, full_name: response.full_name, edit_count: response.edit_count ?? 0 } : null,
        files: files.filter(f => f.user_id === student.user_id && f.form_id === body.p_form_id).map(meta),
        versions: versions.filter(v => v.response_id === work?.response_id),
      });
    }
    return route.fulfill({ status: 404, json: { code: 'PGRST202' } });
  });
  return { works, responses, submitted, activities, pinResets, registered, files, versions, setSaveOffline(value) { failSave = value; } };
}

export async function login(app, screen, { open = true, pin = '1234' } = {}) {
  if (open) await app.open('/#login');
  await screen.getByLabel('Nombre de usuario', { exact: true }).fill('ana.sierra');
  await screen.getByLabel('PIN', { exact: true }).fill(pin);
  await screen.getByRole('button', 'Entrar a mi curso').tap();
}
