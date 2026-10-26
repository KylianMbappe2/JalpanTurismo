import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { forms, activeForms, getAnswerQuestions, getUploadSlots } from '../public/forms.js';
import { courseProgress } from '../public/course-data.js';

test('session one keeps the exact activities, instructions, questions and options it already had', () => {
  const ids = ['diagnostico', 'guia-prompts', 'chatgpt', 'meta', 'agente-ia'];
  const before = '23fcbd18fafcc98fe02fcbc404eeefa4a2c06f814bb9e3a84ca5cc4a28e6c6e8';
  assert.equal(createHash('sha256').update(JSON.stringify(forms.filter(form => ids.includes(form.id)))).digest('hex'), before);
});

test('today has three independent activities with the full requested prompt and places to save evidence', () => {
  const today = forms.filter(form => form.id.startsWith('sesion2-'));
  assert.equal(today.length, 3);
  for (const form of today) {
    const prompt = form.sections.find(section => section.prompt)?.prompt ?? '';
    for (const part of ['MI NEGOCIO', 'MIS COSTOS', 'PARTE 1', 'PARTE 2', 'PARTE 3', 'No encontrado', 'Responde en español', 'Precio = Costo ÷ (1 − margen − comisión)']) assert.ok(prompt.includes(part), part);
    assert.ok(getAnswerQuestions(form).length > 0);
    assert.ok(getUploadSlots(form).length > 0);
    const ids = form.sections.flatMap(section => section.questions.map(question => question.id));
    assert.equal(new Set(ids).size, ids.length);
  }
});

test('extras remain available but do not become required progress', () => {
  const activities = activeForms().map(form => ({ ...form, is_published: true }));
  const work = [{ form_id: 'agente-ia', status: 'submitted' }, { form_id: 'pinal-precios', status: 'submitted' }];
  assert.deepEqual(courseProgress(activities, work), { completed: 1, total: 9, percent: 11 });
  assert.equal(activities.filter(form => form.id.startsWith('pinal-')).length, 5);
});
