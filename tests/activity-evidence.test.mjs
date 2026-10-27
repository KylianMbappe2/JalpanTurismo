import test from 'node:test';
import assert from 'node:assert/strict';
import { fileActivityTargets, evidenceWork } from '../public/activity-evidence.js';
import { activityCredit, applyPreviousCredits } from '../public/activity-credit.js';

test('vincula flyer, calendario de contenido y perfil por nombres explícitos', () => {
  assert.deepEqual(fileActivityTargets({ name: 'Flyer_final.PNG' }), ['flyers-ia']);
  assert.deepEqual(fileActivityTargets({ name: 'Cartel turístico.png' }), ['flyers-ia']);
  assert.deepEqual(fileActivityTargets({ name: 'calendario_redes.xlsx', form_id: 'meta' }), ['calendario-contenido']);
  assert.deepEqual(fileActivityTargets({ name: 'Perfil Google Maps.pdf' }), ['tema4-perfiles']);
  assert.deepEqual(fileActivityTargets({ name: 'Calendario temporadas.pdf', form_id: 'sesion2-temporadas' }), []);
  assert.deepEqual(fileActivityTargets({ name: 'WhatsApp Image 2026.jpg' }), []);
  assert.deepEqual(fileActivityTargets({ name: 'informe posterior.docx' }), []);
  assert.deepEqual(fileActivityTargets({ name: 'Calendario temporadas.pdf', form_id: 'agente-ia' }), []);
  assert.deepEqual(fileActivityTargets({ name: 'Flyer y calendario de redes.pdf' }), ['flyers-ia', 'calendario-contenido']);
});
test('los archivos guardados dan avance y las evidencias de una entrega se reconocen sin mover datos', () => {
  const work = [{ user_id: 'ana', form_id: 'agente-ia', status: 'submitted', response_id: 'folio' }];
  const files = [{ id: 'foto', user_id: 'ana', form_id: 'agente-ia', name: 'Flyer final.png' }];
  const before = JSON.stringify({ work, files });
  const credited = activityCredit('flyers-ia', evidenceWork(work, files));
  assert.equal(credited.submitted, true); assert.equal(credited.sources[0].source_form_id, 'agente-ia');
  assert.equal(activityCredit('flyers-ia', evidenceWork([], files)).partial, true);
  assert.equal(JSON.stringify({ work, files }), before);
});
test('la diagnóstica se acredita para todos sin inventar respuestas ni cambiar sus trabajos', () => {
  const matrix = { students: [{ user_id: 'ana' }, { user_id: 'luis' }], activities: [{ id: 'diagnostico' }], cells: [{ user_id: 'ana', form_id: 'diagnostico', state: 'pending' }, { user_id: 'luis', form_id: 'diagnostico', state: 'submitted' }] };
  const before = JSON.stringify(matrix); const result = applyPreviousCredits(matrix, []);
  assert.equal(result.activities[0].submitted, 2); assert.equal(result.cells[0].state, 'credited');
  assert.equal(result.cells[1].state, 'submitted'); assert.equal(JSON.stringify(matrix), before);
  assert.equal(activityCredit('diagnostico', []).teacherCredit, true);
});
