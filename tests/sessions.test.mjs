import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { forms, activeForms, getAnswerQuestions, getUploadSlots } from '../public/forms.js';
import { courseProgress } from '../public/course-data.js';

test('all previous question ids, types, options and evidence slots remain compatible', () => {
  const previous = JSON.parse(readFileSync(new URL('./fixtures/legacy-catalog.json', import.meta.url)));
  for (const old of previous) {
    const form = forms.find(form => form.id === old.id);
    assert.equal(form.version, old.version);
    for (const question of old.questions) {
      const current = form.sections.flatMap(s => s.questions).find(q => q.id === question.id);
      assert.ok(current, `${old.id}/${question.id}`);
      for (const key of ['type', 'options', 'max', 'required']) assert.deepEqual(current[key], question[key], `${old.id}/${question.id}/${key}`);
    }
  }
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
  assert.deepEqual(courseProgress(activities, work), { completed: 1, total: 6, percent: 17 });
  assert.deepEqual(activities.map(form => form.id), ['diagnostico', 'prompt-conjunto', 'calendario-contenido', 'flyers-ia', 'tema4-perfiles', 'agente-ia']);
  assert.equal(forms.filter(form => form.id.startsWith('pinal-')).length, 5);
});
