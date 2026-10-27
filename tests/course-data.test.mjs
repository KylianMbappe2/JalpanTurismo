import test from 'node:test';
import assert from 'node:assert/strict';
import { statusLabel, workState, activityAction, activityOpen, trackingCsv, courseProgress, csvCell, responsesCsv, createCourseData } from '../public/course-data.js';

test('pending, saved, submitted and edited work have distinct labels', () => {
  assert.equal(statusLabel(null), 'Pendiente');
  assert.equal(statusLabel({ status: 'draft' }), 'En progreso');
  assert.equal(statusLabel({ status: 'submitted' }), 'Entregada');
  assert.equal(workState({ status: 'submitted' }), 'submitted');
  assert.equal(statusLabel({ status: 'submitted', resubmitted_at: '2026-10-19T12:00:00Z' }), 'Editada tras entrega');
});
test('activity actions follow publication and delivery', () => {
  const open = { is_published: true };
  assert.equal(activityAction(null, open), 'Comenzar');
  assert.equal(activityAction({ status: 'draft' }, open), 'Continuar');
  assert.equal(activityAction({ status: 'submitted' }, open), 'Editar entrega');
  assert.equal(activityAction({ status: 'submitted' }, { is_published: false }), 'Ver entrega');
  assert.equal(activityAction(null, { editable: false }), 'Ver actividad');
  assert.equal(activityOpen({ is_published: true }), true);
  assert.equal(activityOpen({ is_published: true, lock_after_due: true, due_at: '2000-01-01T00:00:00Z' }), false);
  assert.equal(activityOpen({ is_published: true, lock_after_due: false, due_at: '2000-01-01T00:00:00Z' }), true);
});
test('tracking CSV labels each cell and escapes formulas', () => {
  const csv = trackingCsv({ students: [{ user_id: 'u', full_name: '=Ana', username: 'ana' }], activities: [{ id: 'agente-ia', title: 'Tu agente de IA' }], cells: [{ user_id: 'u', form_id: 'agente-ia', state: 'edited' }] });
  assert.equal(csv.startsWith('\uFEFF'), true);
  assert.ok(csv.includes('Editada tras entrega'));
  assert.ok(csv.includes("'=Ana"));
});
test('progress counts only published activities and submitted work', () => {
  assert.deepEqual(courseProgress([{ id: 'diagnostico' }, { id: 'prompt-conjunto' }, { id: 'agente-ia', is_published: false }, { id: 'meta', is_published: true }], [{ form_id: 'diagnostico', status: 'submitted' }, { form_id: 'prompt-conjunto', status: 'draft' }, { form_id: 'agente-ia', status: 'submitted' }, { form_id: 'meta', status: 'submitted' }]), { completed: 1, total: 2, percent: 50 });
  assert.equal(courseProgress([], []).percent, 0);
});
test('CSV protects spreadsheet formulas, quotes and line breaks', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell('  +SUM(1)'), '"\'  +SUM(1)"');
  assert.equal(csvCell('Ana\nSierra'), '"Ana\nSierra"');
});
test('exports real question labels and participant questions', () => {
  const csv = responsesCsv([{ form_id: 'agente-ia', full_name: 'Ana', answers: { a2: 'Cabañas' }, questions: '¿Cómo publico mi agente?' }]);
  assert.ok(csv.includes('¿Cómo se llama tu negocio?')); assert.ok(csv.includes('Cabañas')); assert.ok(csv.includes('¿Cómo publico mi agente?'));
});
test('draft confirmation must belong to the same activity and id', async () => {
  const api = createCourseData({ rpc: async () => ({ form_id: 'other', payload: { id: 'x' }, revision: 2 }) });
  await assert.rejects(api.save({ form_id: 'diagnostico', id: 'x' }, 1, 1), /confirmación/);
});
test('completion does not treat a draft response as submitted', async () => {
  const api = createCourseData({ rpc: async () => ({ saved: true, id: 'x', work: { status: 'draft' } }) });
  await assert.rejects(api.complete({ id: 'x' }, 1), /confirmación/);
});
const delivery = { id: '20000000-0000-4000-8000-000000000099', form_id: 'agente-ia', version: 1, participant: { name: 'Ana' }, answers: { a2: 'A'.repeat(3000) }, questions: '', consent: true };
test('a lost response recovers the official receipt with one idempotent retry', async () => {
  let submits = 0;
  const work = { form_id: delivery.form_id, payload: delivery, status: 'submitted', revision: 4, response_id: delivery.id, submitted_at: '2026-10-20T10:00:00Z' };
  const api = createCourseData({ rpc: async name => {
    if (name === 'course_complete') { submits++; if (submits === 1) throw new Error('offline'); return { id: delivery.id, saved: true, work }; }
    if (name === 'course_load') return { work: [work] };
    throw new Error('unexpected');
  } });
  assert.deepEqual(await api.complete(delivery, 2), { id: delivery.id, saved: true, work });
  assert.equal(submits, 2);
});
test('a submitted work with only autosaved edits must not count as a confirmed updated delivery', async () => {
  const original = new Error('offline');
  const work = { form_id: delivery.form_id, payload: delivery, status: 'submitted', revision: 2, response_id: delivery.id };
  const api = createCourseData({ rpc: async name => { if (name === 'course_complete') throw original; return { work: [work] }; } });
  await assert.rejects(api.complete(delivery, 2), error => error === original);
});
test('a concurrent autosave never substitutes the official receipt or bypasses the original revision', async () => {
  const original = new Error('offline');
  const conflict = Object.assign(new Error('conflict'), { code: 'PT409', status: 409 });
  const work = { form_id: delivery.form_id, payload: delivery, status: 'submitted', revision: 4, response_id: delivery.id, submitted_at: '2026-10-20T08:00:00Z', resubmitted_at: '2026-10-20T10:00:00Z' };
  let calls = 0;
  const api = createCourseData({ rpc: async (name, body) => {
    if (name === 'course_load') return { work: [work] };
    calls++;
    assert.equal(body.p_revision, 2);
    assert.deepEqual(body.p_payload, delivery);
    throw calls === 1 ? original : conflict;
  } });
  await assert.rejects(api.complete(delivery, 2), error => error === conflict);
  assert.equal(calls, 2);
});
test('a lost idempotent receipt confirms existing unchanged content without requiring a new revision', async () => {
  let calls = 0;
  const work = { form_id: delivery.form_id, payload: delivery, status: 'submitted', revision: 2, response_id: delivery.id };
  const api = createCourseData({ rpc: async name => {
    if (name === 'course_load') return { work: [work] };
    if (++calls === 1) throw new Error('offline');
    return { id: delivery.id, saved: true, work };
  } });
  assert.equal((await api.complete(delivery, 2)).work.revision, 2);
  assert.equal(calls, 2);
});
test('a receipt for different content or a different folio cannot confirm this delivery', async () => {
  for (const change of [{ answers: { a2: 'old content' } }, { id: 'another-folio' }]) {
    const original = new Error('offline');
    const api = createCourseData({ rpc: async name => {
      if (name === 'course_complete') throw original;
      return { work: [{ form_id: delivery.form_id, payload: { ...delivery, ...change }, status: 'submitted', revision: 4, response_id: delivery.id }] };
    } });
    await assert.rejects(api.complete(delivery, 2), error => error === original);
  }
});
test('concurrent delivery calls share one request for the same user, activity and folio', async () => {
  let submits = 0;
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const work = { form_id: delivery.form_id, payload: delivery, status: 'submitted', revision: 4, response_id: delivery.id };
  const api = createCourseData({ user: { id: 'student-1' }, rpc: async () => { submits++; await pending; return { id: delivery.id, saved: true, work }; } });
  const first = api.complete(delivery, 2);
  const second = api.complete(structuredClone(delivery), 2);
  finish();
  assert.deepEqual(await first, await second);
  assert.equal(submits, 1);
});
test('tracking rejects a payload that is not a matrix', async () => {
  const api = createCourseData({ rpc: async () => ({ students: [] }) });
  await assert.rejects(api.tracking(), /seguimiento/);
  const detail = createCourseData({ rpc: async () => ({ state: 'pending' }) });
  await assert.rejects(detail.studentWork('10000000-0000-4000-8000-000000000002', 'agente-ia'), /trabajo/);
});
test('attachments accept documents and photos but never web pages', async () => {
  const { fileType, formatSize } = await import('../public/course-data.js');
  assert.equal(fileType({ type: '', name: 'Plan.DOCX' }), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assert.equal(fileType({ type: 'image/jpeg', name: 'foto' }), 'image/jpeg');
  assert.equal(fileType({ type: 'text/html', name: 'pagina.html' }), '');
  assert.equal(fileType({ type: 'image/svg+xml', name: 'logo.svg' }), '');
  assert.equal(formatSize(2 * 1048576), '2.0 MB');
});
test('old drafts drop removed Meta questions and retired options so they can still be saved', async () => {
  const { knownAnswers } = await import('../public/course-data.js');
  const { forms } = await import('../public/forms.js');
  const meta = forms.find(form => form.id === 'meta');
  assert.deepEqual(knownAnswers(meta, { m1: 'Messenger', m2: 'Hola', m3: 'Ausente', m4: true, m9: 'Promo de noviembre' }), { m9: 'Promo de noviembre' });
  assert.deepEqual(knownAnswers(meta, { m1: 'Facebook e Instagram' }), { m1: 'Facebook e Instagram' });
  const agent = forms.find(form => form.id === 'agente-ia');
  assert.deepEqual(knownAnswers(agent, { a9: ['Efectivo', 'Bitcoin'], a9_other: 'Vales', zz: 'x' }), { a9: ['Efectivo'], a9_other: 'Vales' });
});
