import test from 'node:test';
import assert from 'node:assert/strict';
import { forms } from '../public/forms.js';
import { validateSubmission } from '../public/submission.js';

const valid = () => ({
  id: '812d6f3f-292d-4fba-9b51-50b1e4c8920e', form_id: 'diagnostico', version: 1,
  participant: { name: 'María López', email: '', phone: '', business: '', municipality: '' },
  answers: Object.fromEntries(forms[0].sections.flatMap(s => s.questions).map(q => [q.id, q.type === 'radio' ? 'No' : 'Necesito aprender.'])),
  questions: '¿Cómo activo mi agente?', consent: true,
});

test('retains all 14 diagnostic and 20 agent questions', () => {
  assert.equal(forms[0].sections.flatMap(s => s.questions).length, 14);
  assert.deepEqual(forms.find(f => f.id === 'agente-ia').sections.flatMap(s => s.questions).slice(0, 20).map(q => q.id), Array.from({ length: 20 }, (_, i) => `a${i + 1}`));
});
test('allows No as a complete diagnostic answer', () => assert.deepEqual(validateSubmission(valid()), {}));
test('rejects a missing diagnostic answer', () => {
  const data = valid(); delete data.answers.d1;
  assert.ok(validateSubmission(data).d1);
});
test('requires real name and affirmative consent', () => {
  const data = valid(); data.participant.name = ' '; data.consent = false;
  const errors = validateSubmission(data);
  assert.ok(errors.name); assert.ok(errors.consent);
});
test('validates supplied email and bounds free text', () => {
  const data = valid(); data.participant.email = 'correo'; data.questions = 'a'.repeat(2001);
  assert.ok(validateSubmission(data).email); assert.ok(validateSubmission(data).questions);
});
test('rejects unknown forms, extra answer keys, and unsupported choices', () => {
  const data = valid(); data.answers.d1 = 'quizás'; data.answers.injected = 'x';
  assert.ok(validateSubmission(data).d1); assert.ok(validateSubmission(data).answers);
  data.form_id = 'inexistente'; assert.ok(validateSubmission(data).form_id);
});
test('practice answers are optional but choices must be from the source', () => {
  const data = { ...valid(), form_id: 'agente-ia', answers: {} };
  assert.deepEqual(validateSubmission(data), {});
  data.answers.a9 = ['Transferencia', 'Tarjeta'];
  assert.deepEqual(validateSubmission(data), {});
  data.answers.a9.push('Criptomonedas'); assert.ok(validateSubmission(data).a9);
});
