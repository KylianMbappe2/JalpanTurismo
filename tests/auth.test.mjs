import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuth, usernamePattern, pinPattern } from '../public/auth.js';

const config = { supabaseUrl: 'https://example.supabase.co', supabaseKey: 'sb_publishable_public_test_key' };
const token = 'a'.repeat(64);
const granted = { ok: true, token, user: { id: 'student-1', username: 'ana.sierra' } };
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };
test.beforeEach(() => { globalThis.sessionStorage = memory(); });

test('login sends a normalized username and PIN, and later calls carry the session token', async () => {
  const calls = [];
  const auth = createAuth(config, async (url, options) => {
    calls.push([url, JSON.parse(options.body)]);
    assert.equal(options.headers.Authorization, undefined);
    return Response.json(url.endsWith('/course_login') ? granted : { ok: true });
  });
  await auth.signIn('  Ana.Sierra ', '1234');
  assert.equal(auth.user.username, 'ana.sierra');
  await auth.rpc('course_load');
  assert.deepEqual(calls[0], ['https://example.supabase.co/rest/v1/rpc/course_login', { p_username: 'ana.sierra', p_pin: '1234' }]);
  assert.deepEqual(calls[1], ['https://example.supabase.co/rest/v1/rpc/course_load', { p_token: token }]);
});
test('wrong PIN has a Spanish error and does not authenticate', async () => {
  const auth = createAuth(config, async () => Response.json({ ok: false, error: 'invalid_credentials' }));
  await assert.rejects(auth.signIn('ana.sierra', '0000'), /Usuario o PIN incorrectos/);
  assert.equal(auth.user, null);
});
test('locked accounts explain the wait and the instructor reset', async () => {
  const auth = createAuth(config, async () => Response.json({ ok: false, error: 'locked', retry_after: 600 }));
  await assert.rejects(auth.signIn('ana.sierra', '0000'), /Espera 10 minutos o pide al instructor/);
});
test('registration reports a taken username', async () => {
  const auth = createAuth(config, async () => Response.json({ ok: false, error: 'username_taken' }));
  await assert.rejects(auth.signUp('Ana Sierra', 'ana.sierra', '1234'), /Ese usuario ya existe/);
  assert.equal(auth.user, null);
});
test('the session survives a page reload in the same tab', async () => {
  const first = createAuth(config, async () => Response.json(granted));
  await first.signUp('Ana Sierra', 'ana.sierra', '1234');
  const reloaded = createAuth(config, async () => Response.json({}));
  assert.equal(reloaded.user.id, 'student-1');
});
test('an expired session is cleared so the login screen returns', async () => {
  const auth = createAuth(config, async url => url.endsWith('/course_login') ? Response.json(granted) : Response.json({ code: 'PT401' }, { status: 401 }));
  await auth.signIn('ana.sierra', '1234');
  await assert.rejects(auth.rpc('course_load'), /Vuelve a entrar con tu usuario y PIN/);
  assert.equal(auth.user, null);
  assert.equal(createAuth(config).user, null);
});
test('logout clears the local session even when the server is offline', async () => {
  const auth = createAuth(config, async url => { if (url.endsWith('/course_login')) return Response.json(granted); throw new Error('offline'); });
  await auth.signIn('ana.sierra', '1234');
  await auth.signOut();
  assert.equal(auth.user, null);
  assert.equal(createAuth(config).user, null);
  await assert.rejects(auth.rpc('course_load'), /iniciar sesión/);
});
test('usernames and PINs follow the same rules as the database', () => {
  for (const ok of ['ana', 'ana.sierra', 'luis_2', 'cabanas-del-bosque']) assert.ok(usernamePattern.test(ok), ok);
  for (const bad of ['an', 'Ana', 'josé', '.ana', 'ana sierra', 'a'.repeat(31)]) assert.ok(!usernamePattern.test(bad), bad);
  for (const ok of ['1234', '123456']) assert.ok(pinPattern.test(ok), ok);
  for (const bad of ['123', '1234567', '12a4', '']) assert.ok(!pinPattern.test(bad), bad);
});
