import test from 'node:test';
import assert from 'node:assert/strict';
import { isConfigured, submitResponse } from '../public/submission.js';
const config = { supabaseUrl: 'https://example.supabase.co', supabaseKey: 'sb_publishable_test_public_key' };
const data = { id: '812d6f3f-292d-4fba-9b51-50b1e4c8920e', form_id: 'agente-ia', version: 1, participant: { name: 'Ana Sierra' }, answers: {}, questions: '', consent: true };
test('secret keys and legacy service_role keys are never browser configuration', () => {
  assert.equal(isConfigured({ ...config, supabaseKey: 'sb_secret_never_use_in_browser' }), false);
  const payload = btoa(JSON.stringify({ role: 'service_role' }));
  assert.equal(isConfigured({ ...config, supabaseKey: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature` }), false);
});
test('accepts modern publishable and legacy anon keys', () => {
  assert.equal(isConfigured(config), true);
  const payload = btoa(JSON.stringify({ role: 'anon' }));
  assert.equal(isConfigured({ ...config, supabaseKey: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature` }), true);
});
test('unconfigured forms cannot claim saved responses', async () => {
  await assert.rejects(submitResponse({}, data), /aún no está habilitado/);
});
test('a receipt must confirm the same submission id', async () => {
  await assert.rejects(submitResponse(config, data, async () => Response.json({ saved: true, id: 'other' })), /confirmación/);
});
test('network failure preserves a clear retry message', async () => {
  await assert.rejects(submitResponse(config, data, async () => { throw new Error('offline'); }), /conservamos tus respuestas/);
});
test('publishable keys are sent in apikey without a bearer token', async () => {
  const result = await submitResponse(config, data, async (url, options) => {
    assert.equal(url, 'https://example.supabase.co/rest/v1/rpc/submit_workshop_response');
    assert.equal(options.headers.apikey, config.supabaseKey);
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(JSON.parse(options.body).p_payload.id, data.id);
    return Response.json({ id: data.id, saved: true });
  });
  assert.equal(result.saved, true);
});
