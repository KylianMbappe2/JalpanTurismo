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
  assert.deepEqual(courseProgress([{ id: 'a' }, { id: 'b' }, { id: 'c', is_published: false }], [{ form_id: 'a', status: 'submitted' }, { form_id: 'b', status: 'draft' }, { form_id: 'c', status: 'submitted' }]), { completed: 1, total: 2, percent: 50 });
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
