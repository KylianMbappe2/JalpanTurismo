import test from 'node:test';
import assert from 'node:assert/strict';
import { forms, getAnswerQuestions, getUploadSlots } from '../public/forms.js';
import { groupedActivities } from '../public/activity-groups.js';
import { validateSubmission } from '../public/submission.js';

const activity = () => forms.find(form => form.id === 'tema4-perfiles');
const payload = answers => ({ id: '812d6f3f-292d-4fba-9b51-50b1e4c8920e', form_id: 'tema4-perfiles', version: 1, participant: { name: 'Prueba perfiles' }, answers, questions: '', consent: true });

test('profiles are the fifth main activity and retain all five historical evidence slots', () => {
  const form = activity();
  assert.ok(form, 'Práctica integradora disponible');
  const groups = groupedActivities(forms.filter(form => !form.retired));
  const block = groups.find(group => group.id === 'course');
  assert.equal(block.activities[4].id, form.id);
  assert.ok(groups.indexOf(block) < groups.findIndex(group => group.id === 'extras'));
  assert.equal(getUploadSlots(form).length, 5);
  const content = JSON.stringify(form);
  for (const part of ['4.2.1', '4.2.2', '4.2.3', '4.3', 'nunca se publican', 'TripAdvisor', 'compañero', 'UNA plataforma']) assert.ok(content.includes(part), part);
  assert.deepEqual(form.sections.flatMap(s => s.questions).find(q => q.id === 'pi_plataforma').options, ['Google Maps', 'TripAdvisor', 'Airbnb']);
});

test('the complete master prompt and two review responses are preserved', () => {
  const form = activity();
  assert.ok(form);
  const prompt = form.sections.find(section => section.prompt)?.prompt;
  for (const part of ['Actúa como experto en marketing turístico', '10 palabras clave', '750 caracteres', '50 caracteres', '500 caracteres', 'El espacio', '10 servicios', '5 reglas', '5 estrellas', '2 estrellas', 'Las 10 fotos', 'No inventes servicios que no te di.']) assert.ok(prompt.includes(part), part);
  const questions = getAnswerQuestions(form);
  assert.ok(questions.some(question => question.id === 'pi_resena5'));
  assert.ok(questions.some(question => question.id === 'pi_resena2'));
  assert.equal(questions.filter(question => question.id.startsWith('pi_revision_')).length, 6);
});

test('platform text limits accept their exact boundary and reject one character beyond it', () => {
  assert.ok(activity());
  for (const [id, limit] of [['pi_google', 750], ['pi_airbnb_titulo', 50], ['pi_airbnb_descripcion', 500]]) {
    assert.deepEqual(validateSubmission(payload({ [id]: 'a'.repeat(limit) })), {});
    assert.ok(validateSubmission(payload({ [id]: 'a'.repeat(limit + 1) }))[id]);
  }
});
