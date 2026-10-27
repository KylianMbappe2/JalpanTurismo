import test from 'node:test';
import assert from 'node:assert/strict';
import { activityCredit, relatedWork, applyPreviousCredits } from '../public/activity-credit.js';

test('un prompt anterior entregado cuenta una sola vez y conserva su folio', () => {
  const work = [{ form_id: 'guia-prompts', status: 'submitted', response_id: 'folio-anterior' }, { form_id: 'chatgpt', status: 'submitted' }];
  const before = JSON.stringify(work);
  const credit = activityCredit('prompt-conjunto', work);
  assert.equal(credit.submitted, true);
  assert.equal(credit.sources.length, 1);
  assert.equal(credit.sources[0].response_id, 'folio-anterior');
  assert.equal(JSON.stringify(work), before);
});
test('tres partes entregadas equivalen al conjunto; una sola parte o un borrador no', () => {
  const work = ['sesion2-precios', 'sesion2-competencia', 'sesion2-temporadas'].map(form_id => ({ form_id, status: 'submitted' }));
  assert.equal(activityCredit('prompt-conjunto', work).submitted, true);
  assert.equal(activityCredit('prompt-conjunto', work.slice(0, 2)).submitted, false);
  assert.equal(activityCredit('prompt-conjunto', [{ form_id: 'guia-prompts', status: 'draft' }]).submitted, false);
});
test('una publicación programada se relaciona con calendario sin fingir un calendario completo', () => {
  const work = [{ form_id: 'meta', status: 'submitted' }];
  assert.equal(relatedWork('calendario-contenido', work).length, 1);
  assert.equal(activityCredit('calendario-contenido', work).submitted, false);
  assert.equal(activityCredit('flyers-ia', work).submitted, false);
});
test('los créditos docentes se calculan por alumno y no modifican la matriz original', () => {
  const matrix = { students: [{ user_id: 'ana' }, { user_id: 'luis' }], activities: [{ id: 'prompt-conjunto', submitted: 0, missing: 2 }], cells: [{ user_id: 'ana', form_id: 'prompt-conjunto', state: 'pending' }, { user_id: 'luis', form_id: 'prompt-conjunto', state: 'pending' }] };
  const before = JSON.stringify(matrix);
  const result = applyPreviousCredits(matrix, [{ user_id: 'ana', form_id: 'guia-prompts', status: 'submitted' }]);
  assert.equal(result.activities[0].submitted, 1);
  assert.equal(result.cells[0].previous_form_id, 'guia-prompts');
  assert.equal(result.cells[1].state, 'pending');
  assert.equal(JSON.stringify(matrix), before);
});
