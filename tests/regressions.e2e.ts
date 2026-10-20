import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

test('BUG-LOGIN: usuario desconocido y mayúsculas muestran el mismo error y normalizan el usuario', async ({ app, screen, browser }) => {
  await courseFixture(browser);
  const attempted: string[] = [];
  await browser.route('https://qa.supabase.co/rest/v1/rpc/course_login', async route => {
    attempted.push(JSON.parse(route.request.postData!).p_username);
    await route.fulfill({ json: { ok: false, error: 'invalid_credentials' } });
  });
  await app.open('/#login');
  for (const username of ['no-existe', ' TEST123 ', 'ana.sierra']) {
    await screen.getByLabel('Nombre de usuario', { exact: true }).fill(username);
    await screen.getByLabel('PIN', { exact: true }).fill('0000');
    await screen.getByRole('button', 'Entrar a mi curso').tap();
    await expect(screen.getByRole('alert')).toHaveText('Usuario o PIN incorrectos.');
    await expect(screen.getByRole('button', 'Entrar a mi curso')).toBeEnabled();
    await expect(screen.getByRole('heading', 'Mis actividades')).toBeHidden();
  }
  expect(attempted).toEqual(['no-existe', 'test123', 'ana.sierra']);
  await app.screenshot('login-error-uniforme');
});

test('BUG-DIRTY: una entrega cargada no cambia al emitir input idéntico ni al deshacer una edición', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  const now = new Date().toISOString();
  const id = '20000000-0000-4000-8000-000000000088';
  // jsonb no conserva el orden de claves: la comparación debe ser por contenido.
  const payload = { consent: true, questions: '', answers: { a9: ['Transferencia'], a2: 'Negocio guardado' }, participant: { municipality: '', business: '', phone: '', email: '', name: 'Ana Sierra' }, version: 1, form_id: 'agente-ia', id };
  fixture.works.set('agente-ia', { user_id: '10000000-0000-4000-8000-000000000001', form_id: 'agente-ia', payload, step: 1, revision: 2, status: 'submitted', saved_at: now, submitted_at: now, response_id: id, resubmitted_at: null });
  await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Editar entrega').tap();
  await expect(screen.getByTestId('question-a2').getByRole('textbox')).toHaveValue('Negocio guardado');
  const status = browser.locator('#draft-status');
  await expect(status).not.toContainText('Cambios pendientes de guardar');
  await browser.evaluate(() => document.querySelector('[name="a2"]')!.dispatchEvent(new Event('input', { bubbles: true })));
  await expect(status).not.toContainText('Cambios pendientes de guardar');
  await browser.evaluate(() => {
    const input = document.querySelector<HTMLTextAreaElement>('[name="a2"]')!;
    input.value = 'Edición temporal'; input.dispatchEvent(new Event('input', { bubbles: true }));
    input.value = 'Negocio guardado'; input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(status).not.toContainText('Cambios pendientes de guardar');
  expect(fixture.works.get('agente-ia').revision).toBe(2);
  await app.screenshot('entrega-sin-cambios-falsos');
});

test('BUG-ROUTES: las rutas protegidas sin sesión cambian la URL a login', async ({ app, screen, browser }) => {
  await courseFixture(browser);
  for (const hash of ['#curso', '#actividad/agente-ia']) {
    await app.open(`/${hash}`);
    await expect(screen.getByRole('button', 'Entrar a mi curso')).toBeVisible();
    await expect(browser).toHaveURL('/#login');
  }
});

test('BUG-ROUTES: una actividad inexistente con sesión ofrece volver al curso', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
  await browser.goto('/#actividad/actividad-que-no-existe');
  await expect(screen.getByRole('heading', 'Actividad no encontrada')).toBeVisible();
  await screen.getByRole('link', 'Volver a mi curso', { exact: true }).tap();
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
  await expect(browser).toHaveURL('/#curso');
});

test('BUG-SLOW: una entrega de 3000 caracteres espera una respuesta de 20 segundos sin error falso', { timeout: 45000 }, async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  await browser.route('https://qa.supabase.co/rest/v1/rpc/course_complete', async route => {
    // Latencia controlada del transporte: supera el antiguo timeout de 18 segundos.
    await new Promise(resolve => setTimeout(resolve, 20000));
    await route.fallback();
  });
  await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  await screen.getByTestId('question-a2').getByRole('textbox').fill('C'.repeat(3000));
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  await screen.getByRole('button', 'Entregar').tap();
  await expect(screen.getByRole('button', 'Guardando tu entrega…')).toBeDisabled();
  await expect(browser.locator('.saving-spinner')).toBeVisible();
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible({ timeout: 30000 });
  expect(fixture.responses).toHaveLength(1);
  expect(fixture.responses[0].answers.a2).toHaveLength(3000);
  await app.screenshot('entrega-confirmada-tras-20-segundos');
});

test('BUG-PRIVACY: cambiar el hash cierra el diálogo de privacidad', async ({ app, screen, browser }) => {
  await courseFixture(browser); await app.open('/#registro');
  await screen.getByRole('button', 'Ver privacidad').tap();
  await expect(screen.getByRole('dialog')).toBeVisible();
  await browser.evaluate(() => { location.hash = '#login'; });
  await expect(screen.getByRole('button', 'Entrar a mi curso')).toBeVisible();
  await expect(screen.getByRole('dialog')).toBeHidden();
});

test('BUG-SUBMIT: 3000 caracteres y doble clic producen una sola entrega', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  const answer = 'A'.repeat(3000);
  await screen.getByTestId('question-a2').getByRole('textbox').fill(answer);
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  let calls = 0;
  await browser.route('https://qa.supabase.co/rest/v1/rpc/course_complete', async route => {
    calls++;
    await pending;
    await route.fallback();
  });
  await browser.evaluate(() => {
    const button = document.querySelector<HTMLButtonElement>('[data-action="deliver"]')!;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  try {
    await expect.poll(() => calls).toBe(1);
    await expect(screen.getByRole('button', 'Guardando tu entrega…')).toBeDisabled();
  } finally { release(); }
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
  expect(calls).toBe(1);
  expect(fixture.submitted).toHaveLength(1);
  expect(fixture.responses).toHaveLength(1);
  expect(fixture.responses[0].answers.a2).toBe(answer);
  await app.screenshot('entrega-larga-sin-duplicados');
});

test('BUG-SUBMIT: si se pierde la respuesta después del commit se recupera el folio sin duplicar', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  let calls = 0;
  // Simula un commit confirmado en el servidor cuyo paquete de respuesta se pierde.
  await browser.route('https://qa.supabase.co/rest/v1/rpc/course_complete', async route => {
    calls++;
    if (calls > 1) return route.fallback();
    const body = JSON.parse(route.request.postData!);
    const payload = structuredClone(body.p_payload);
    const old = fixture.works.get(payload.form_id);
    const now = new Date().toISOString();
    const userId = old?.user_id ?? '10000000-0000-4000-8000-000000000001';
    fixture.works.set(payload.form_id, { ...old, user_id: userId, form_id: payload.form_id, step: 1, payload, status: 'submitted', revision: (old?.revision ?? 0) + 1, saved_at: now, submitted_at: now, response_id: payload.id, resubmitted_at: null });
    fixture.responses.push({ id: payload.id, student_id: userId, form_id: payload.form_id, submitted_at: now, full_name: payload.participant.name, email: '', phone: '', business: '', municipality: '', questions: payload.questions, answers: payload.answers, edit_count: 0 });
    fixture.submitted.push(payload);
    await route.abort();
  });
  await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  await screen.getByTestId('question-a2').getByRole('textbox').fill('B'.repeat(3000));
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  await screen.getByRole('button', 'Entregar').tap();
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
  await expect(screen.getByText(fixture.responses[0].id)).toBeVisible();
  await expect(screen.getByRole('alert')).toBeHidden();
  expect(calls).toBe(2);
  expect(fixture.responses).toHaveLength(1);
  await app.screenshot('folio-recuperado-tras-respuesta-perdida');
});

test('BUG-LIMITS: el registro explica los caracteres permitidos y anuncia los límites', async ({ app, screen, browser }) => {
  await courseFixture(browser); await app.open('/#registro');
  await expect(screen.getByText(/letras sin acentos, números, punto, guion o guion bajo/)).toBeVisible();
  await screen.getByLabel('Nombre de usuario', { exact: true }).fill('a'.repeat(30));
  await expect(screen.getByText(/30\s*\/\s*30/)).toBeVisible();
  await screen.getByLabel('PIN', { exact: true }).fill('123456');
  await expect(screen.getByText(/6\s*\/\s*6/)).toBeVisible();
  await app.screenshot('registro-limites-visibles');
});

test('BUG-NAV: el documento inicial no contiene enlaces vacíos y las marcas llevan a portada', async ({ app, screen, browser }) => {
  await courseFixture(browser);
  // Examina el HTML que llega antes de ejecutar la SPA, sin carreras con la carga de config.
  const response = await fetch(new URL('/', app.baseUrl));
  expect(response.status).toBe(200);
  const html = await response.text();
  await app.open('/#login');
  const initial = await browser.evaluate((source: string) => {
    const doc = new DOMParser().parseFromString(source, 'text/html');
    return {
      broken: [...doc.querySelectorAll('a[href="#"], a[href="#como-funciona"]')].map(a => a.textContent?.trim()),
      logo: doc.querySelector('.brand')?.getAttribute('href'),
      footer: doc.querySelector('.footer-brand')?.getAttribute('href'),
    };
  }, html);
  expect(initial).toEqual({ broken: [], logo: '/', footer: '/' });
  await expect(screen.getByRole('link', 'Aula Sierra, inicio')).toHaveAttribute('href', '/');
  await expect(screen.getByRole('contentinfo').getByRole('link', 'Aula Sierra')).toHaveAttribute('href', '/');
});

test('BUG-NUMBER: las respuestas rápidas de WhatsApp se numeran 3, 4 y 5', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'WhatsApp Business' }).getByRole('link', 'Comenzar').tap();
  await expect(screen.getByTestId('question-w3')).toContainText('3. /precios');
  await expect(screen.getByTestId('question-w4')).toContainText('4. /ubicacion');
  await expect(screen.getByTestId('question-w5')).toContainText('5. /horario');
  await app.screenshot('whatsapp-numeracion-correcta');
});
