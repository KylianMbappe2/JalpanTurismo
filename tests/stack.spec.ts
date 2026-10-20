import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

// Reenvía las llamadas del navegador a un PostgREST local real; nada se simula.
const rest = process.env.STACK_REST_URL ?? 'http://127.0.0.1:54392';
const container = process.env.STACK_DB_CONTAINER ?? 'aula-pin-qa';
const suffix = Date.now().toString(36);

test('STACK-BUGS: 3000 caracteres, doble clic y respuesta perdida conservan una entrega real', async ({ app, screen, browser }) => {
  const student = `qa.entrega.${suffix}`;
  const answer = 'PRUEBA TÉCNICA · '.padEnd(3000, 'A');
  await realBackend(browser);
  let calls = 0;
  const measurements: { ms: number; bytes: number }[] = [];
  await browser.route('https://qa.supabase.co/rest/v1/rpc/course_complete', async route => {
    calls++;
    const start = performance.now();
    const response = await fetch(`${rest}/rpc/course_complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: route.request.postData });
    const result = await response.json();
    measurements.push({ ms: Math.round(performance.now() - start), bytes: Buffer.byteLength(route.request.postData ?? '') });
    expect(response.status).toBe(200);
    expect(result.saved).toBe(true);
    // La transacción ya terminó; se pierde únicamente el paquete de respuesta.
    if (calls % 2 === 1) await route.abort();
    else await route.fulfill({ json: result });
  });
  await app.open('/#registro');
  await screen.getByLabel('Nombre completo', { exact: true }).fill('PRUEBA TÉCNICA · entrega larga');
  await screen.getByLabel('Nombre de usuario', { exact: true }).fill(student);
  await screen.getByLabel('PIN', { exact: true }).fill('2468');
  await screen.getByLabel('Repite tu PIN', { exact: true }).fill('2468');
  await screen.getByRole('checkbox', /Acepto que se guarden/).check();
  await screen.getByRole('button', 'Crear mi cuenta').tap();
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  await screen.getByTestId('question-a2').getByRole('textbox').fill(answer);
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  await browser.evaluate(() => {
    const button = document.querySelector('[data-action="deliver"]')!;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
  expect(calls).toBe(2);
  const folio = await browser.locator('.receipt code').textContent();
  await screen.getByRole('link', /Volver a mi curso/).tap();
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Editar entrega').tap();
  await expect(screen.getByTestId('question-a2').getByRole('textbox')).toHaveValue(answer);
  await expect(browser.locator('#draft-status')).not.toContainText('Cambios pendientes');
  await screen.getByTestId('question-a2').getByRole('textbox').fill(answer.replace('PRUEBA', 'CAMBIO'));
  await screen.getByRole('button', 'Guardar cambios de la entrega').tap();
  await expect(browser.locator('#draft-status')).toHaveText('Tu entrega se actualizó.');
  expect(calls).toBe(4);
  await expect(browser.locator('.edit-notice code')).toHaveText(folio);
  const rows = execFileSync('docker', ['exec', container, 'psql', '-U', 'postgres', '-tAc', `select count(*),max(char_length(r.answers->>'a2')),max(r.edit_count) from public.workshop_responses r join public.aula_users u on u.id=r.student_id where u.username='${student}'`], { encoding: 'utf8' }).trim();
  expect(rows).toBe('1|3000|1');
  console.log(`STACK-BUGS mediciones ${JSON.stringify(measurements)}`);
  await app.screenshot('entrega-real-larga-recuperada');
});

test('STACK-LOCK: el sexto intento encuentra la cuenta bloqueada y no omite la protección', async () => {
  const username = `qa.bloqueo.${suffix}`;
  const rpc = async (name, body) => {
    const response = await fetch(`${rest}/rpc/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    expect(response.status).toBe(200);
    return response.json();
  };
  await rpc('course_register', { p_username: username, p_full_name: 'PRUEBA TÉCNICA · bloqueo', p_pin: '2468' });
  for (let i = 0; i < 5; i++) expect((await rpc('course_login', { p_username: username, p_pin: '0000' })).error).toBe('invalid_credentials');
  expect((await rpc('course_login', { p_username: username, p_pin: '0000' })).error).toBe('locked');
  expect((await rpc('course_login', { p_username: username, p_pin: '2468' })).error).toBe('locked');
  expect((await rpc('course_login', { p_username: ` QA.INEXISTENTE.${suffix} `, p_pin: '0000' })).error).toBe('invalid_credentials');
});
async function realBackend(browser) {
  await browser.route('https://qa.supabase.co/**', async route => {
    const url = new URL(route.request.url);
    const response = await fetch(`${rest}${url.pathname.replace('/rest/v1', '')}`, { method: route.request.method, headers: { 'Content-Type': 'application/json' }, body: route.request.postData });
    await route.fulfill({ status: response.status, contentType: 'application/json', body: await response.text() });
  });
}
async function enter(screen, username, pin) {
  await screen.getByLabel('Nombre de usuario', { exact: true }).fill(username);
  await screen.getByLabel('PIN', { exact: true }).fill(pin);
  await screen.getByRole('button', 'Entrar a mi curso').tap();
}

test('STACK-01: alumno y docente con usuario y PIN sobre la base real', async ({ app, screen, browser }) => {
  const student = `qa.alumno.${suffix}`;
  const teacher = `qa.docente.${suffix}`;
  await realBackend(browser);

  // Registro del alumno y borrador guardado en la base.
  await app.open('/#registro');
  await screen.getByLabel('Nombre completo', { exact: true }).fill(`Ana Prueba ${suffix}`);
  await screen.getByLabel('Nombre de usuario', { exact: true }).fill(student);
  await screen.getByLabel('PIN', { exact: true }).fill('2468');
  await screen.getByLabel('Repite tu PIN', { exact: true }).fill('2468');
  await screen.getByRole('checkbox', /Acepto que se guarden/).check();
  await screen.getByRole('button', 'Crear mi cuenta').tap();
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  await screen.getByText('Tus datos', { exact: true }).tap();
  await screen.getByLabel(/Nombre de tu negocio/).fill('Cabañas Prueba');
  await screen.getByTestId('question-a2').getByRole('textbox').fill('Cabañas Prueba en Jalpan');
  await screen.getByLabel(/Agregar archivo/).setInputFiles(['tests/files/plan-de-negocio.pdf']);
  await expect(screen.getByRole('status').filter({ hasText: 'Archivo guardado' })).toContainText('plan-de-negocio.pdf');
  await screen.getByLabel(/Agregar archivo/).setInputFiles(['tests/files/foto-grande.png']);
  await expect(screen.getByRole('status').filter({ hasText: 'Archivo guardado' })).toContainText('foto-grande.jpg');
  await screen.getByRole('button', 'Guardar avance').tap();
  await expect(screen.getByText('Avance guardado en tu cuenta ✓')).toBeVisible();

  // Recargar conserva la sesión; salir y volver a entrar conserva el borrador.
  await browser.reload();
  await expect(screen.getByTestId('question-a2').getByRole('textbox')).toHaveValue('Cabañas Prueba en Jalpan');
  await screen.getByRole('link', '← Volver a mi curso', { exact: true }).tap();
  await screen.getByRole('button', 'Salir', { exact: true }).tap();
  await enter(screen, student, '0000');
  await expect(screen.getByRole('alert')).toContainText('Usuario o PIN incorrectos.');
  await enter(screen, student.toUpperCase(), '2468');
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Continuar').tap();
  await expect(screen.getByTestId('question-a2').getByRole('textbox')).toHaveValue('Cabañas Prueba en Jalpan');

  // Entrega definitiva.
  await screen.getByRole('textbox', 'Tus preguntas para el instructor').fill('¿Puedo conectar mi agente a WhatsApp?');
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  await screen.getByRole('button', 'Entregar').tap();
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
  await screen.getByRole('link', /Volver a mi curso/).tap();
  await expect(screen.getByRole('row').filter({ hasText: 'Tu agente de IA' })).toContainText('Entregada');
  await screen.getByRole('row').filter({ hasText: 'Guía para mejorar tus prompts' }).getByRole('link', 'Comenzar').tap();
  await screen.getByTestId('question-g2').getByRole('textbox').fill('Bienvenido: este mensaje sigue en borrador.');
  await screen.getByRole('button', 'Guardar avance').tap();
  await expect(screen.getByText('Avance guardado en tu cuenta ✓')).toBeVisible();
  await screen.getByRole('link', '← Volver a mi curso', { exact: true }).tap();
  await screen.getByRole('button', 'Salir', { exact: true }).tap();

  // Docente: se registra y se autoriza desde SQL, como hará el organizador.
  await expect(screen.getByRole('button', 'Entrar a mi curso')).toBeVisible();
  await screen.getByRole('link', 'Crear cuenta', { exact: true }).tap();
  await screen.getByLabel('Nombre completo', { exact: true }).fill('Docente Prueba');
  await screen.getByLabel('Nombre de usuario', { exact: true }).fill(teacher);
  await screen.getByLabel('PIN', { exact: true }).fill('1122');
  await screen.getByLabel('Repite tu PIN', { exact: true }).fill('1122');
  await screen.getByRole('checkbox', /Acepto que se guarden/).check();
  await screen.getByRole('button', 'Crear mi cuenta').tap();
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
  execFileSync('docker', ['exec', container, 'psql', '-U', 'postgres', '-tAc', `select public.course_make_instructor('${teacher}')`]);
  await screen.getByRole('button', 'Salir', { exact: true }).tap();
  await enter(screen, teacher, '1122');
  await expect(screen.getByRole('heading', 'Seguimiento del grupo.')).toBeVisible();
  await screen.getByRole('navigation', 'Administración').getByRole('link', 'Panel docente', { exact: true }).tap();
  await expect(screen.getByRole('heading', 'Trabajos entregados')).toBeVisible();
  await screen.getByRole('searchbox', 'Buscar por nombre, negocio o correo').fill('Cabañas Prueba');
  await screen.getByRole('row').filter({ hasText: `Ana Prueba ${suffix}` }).getByRole('button', 'Ver entrega ↗').tap();
  await expect(screen.getByText('¿Puedo conectar mi agente a WhatsApp?')).toBeVisible();
  await expect(screen.getByText('Cabañas Prueba en Jalpan')).toBeVisible();
  await expect(screen.getByRole('listitem').filter({ hasText: 'foto-grande.jpg' })).toBeVisible();
  const download = await browser.waitForDownload(() => screen.getByRole('listitem').filter({ hasText: 'plan-de-negocio.pdf' }).getByRole('button', 'Descargar').tap());
  await expect(await readFile(download.absolutePath, 'latin1')).toBe(await readFile('tests/files/plan-de-negocio.pdf', 'latin1'));

  // Restablecer el PIN del alumno; su entrega se conserva.
  await screen.getByRole('link', 'Participantes', { exact: true }).tap();
  await screen.getByRole('row').filter({ hasText: `@${student}` }).getByRole('button', 'Restablecer PIN').tap();
  await screen.getByLabel('Nuevo PIN', { exact: true }).fill('1357');
  await screen.getByRole('button', 'Guardar nuevo PIN').tap();
  await expect(screen.getByRole('heading', 'PIN actualizado')).toBeVisible();
  await screen.getByRole('button', 'Entendido').tap();
  await screen.getByRole('button', 'Salir', { exact: true }).tap();
  await enter(screen, student, '2468');
  await expect(screen.getByRole('alert')).toContainText('Usuario o PIN incorrectos.');
  await enter(screen, student, '1357');
  await expect(screen.getByRole('row').filter({ hasText: 'Tu agente de IA' })).toContainText('Entregada');
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Editar entrega').tap();
  await expect(screen.getByText('Ya entregaste; los cambios actualizan tu entrega')).toBeVisible();
  await expect(screen.getByText('Cabañas Prueba en Jalpan')).toBeVisible();
  await expect(screen.getByRole('listitem').filter({ hasText: 'plan-de-negocio.pdf' })).toBeVisible();
  await expect(screen.getByRole('button', /Quitar/)).toHaveCount(2);
  const folio = await browser.evaluate(() => document.querySelector('.edit-notice code')?.textContent ?? '');
  await screen.getByTestId('question-a2').getByRole('textbox').fill('Cabañas corregidas en la pila');
  await screen.getByRole('button', 'Guardar cambios de la entrega').tap();
  await expect(screen.getByRole('status').filter({ hasText: 'Tu entrega se actualizó.' })).toBeVisible();
  await screen.getByRole('button', 'Salir', { exact: true }).tap();
  await enter(screen, teacher, '1122');
  await screen.getByRole('navigation', 'Administración').getByRole('link', 'Panel docente', { exact: true }).tap();
  await screen.getByRole('searchbox', 'Buscar por nombre, negocio o correo').fill('Cabañas Prueba');
  await screen.getByRole('row').filter({ hasText: `Ana Prueba ${suffix}` }).getByRole('button', 'Ver entrega ↗').tap();
  await expect(screen.getByText('Cabañas corregidas en la pila')).toBeVisible();
  await expect(screen.getByText(`Folio: ${folio}`)).toBeVisible();
  await screen.getByRole('link', 'Seguimiento', { exact: true }).tap();
  await screen.getByRole('searchbox', 'Buscar por nombre o usuario').fill(student);
  await expect(screen.getByRole('row').filter({ hasText: `@${student}` })).toContainText('Editada tras entrega');
  await screen.getByRole('button', `Ana Prueba ${suffix}, Tu agente de IA: Editada tras entrega`).tap();
  await expect(screen.getByRole('heading', 'Versiones anteriores')).toBeVisible();
  await expect(screen.getByText('Cabañas corregidas en la pila')).toBeVisible();
  await expect(screen.getByText('Cabañas Prueba en Jalpan')).toBeVisible();
  await expect(screen.getByRole('listitem').filter({ hasText: 'plan-de-negocio.pdf' })).toBeVisible();
  await screen.getByRole('link', '← Volver al seguimiento').tap();
  await screen.getByRole('button', `Ana Prueba ${suffix}, Guía para mejorar tus prompts: En progreso`).tap();
  await expect(screen.getByText('Bienvenido: este mensaje sigue en borrador.')).toBeVisible();
  await expect(screen.getByText('Todavía no hay una entrega definitiva.')).toBeVisible();
  await app.screenshot('entrega-corregida-en-la-pila');
});

const activityIds = ['diagnostico', 'guia-prompts', 'chatgpt', 'meta', 'agente-ia', 'pinal-temporadas', 'pinal-competencia', 'pinal-precios', 'pinal-estrategia', 'pinal-cierre'];
const firstSlot = { 'pinal-temporadas': 't2', 'pinal-competencia': 'k1', 'pinal-precios': 'r4', 'pinal-estrategia': 'e1', 'pinal-cierre': 'z5' };

async function saveOnce(screen, browser, label) {
  const start = Date.now();
  await screen.getByRole('button', 'Guardar avance').tap();
  await expect(screen.getByText('Avance guardado en tu cuenta ✓')).toBeVisible();
  await expect(screen.getByText('Revisa los campos señalados')).toHaveCount(0);
  await expect(Date.now() - start < 5000, `${label} guardó en ${Date.now() - start} ms`).toBe(true);
}

test('HASH-01: cada actividad abierta directo por hash guarda y entrega a la primera; capturas por apartado', { timeout: 240000 }, async ({ app, screen, browser }) => {
  const student = `qa.hash.${suffix}`;
  const teacher = `qa.hashdoc.${suffix}`;
  await realBackend(browser);
  await app.open('/#registro');
  await screen.getByLabel('Nombre completo', { exact: true }).fill(`Hash Prueba ${suffix}`);
  await screen.getByLabel('Nombre de usuario', { exact: true }).fill(student);
  await screen.getByLabel('PIN', { exact: true }).fill('2468');
  await screen.getByLabel('Repite tu PIN', { exact: true }).fill('2468');
  await screen.getByRole('checkbox', /Acepto que se guarden/).check();
  await screen.getByRole('button', 'Crear mi cuenta').tap();
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
  await expect(screen.getByRole('row').filter({ hasText: '¿Cuándo vienen los turistas a Pinal?' })).toBeVisible();

  // A) Solo cambia el hash, sin recargar.
  for (const id of activityIds) {
    await browser.goto(`/#actividad/${id}`);
    const box = screen.getByRole('textbox').first();
    await box.fill(`Respuesta por hash ${id}`);
    await saveOnce(screen, browser, `hash ${id}`);
  }
  // B) Carga nueva directa en la URL de la actividad (como abrirla en otra pestaña).
  let folio = '';
  for (const [i, id] of activityIds.entries()) {
    await browser.goto(`/?carga=${i}#actividad/${id}`);
    await expect(screen.getByRole('button', 'Guardar avance')).toBeVisible();
    await screen.getByRole('textbox').first().fill(`Respuesta en carga nueva ${id}`);
    await saveOnce(screen, browser, `carga ${id}`);
    if (id === 'diagnostico') continue;
    if (firstSlot[id]) {
      await screen.getByTestId(`question-${firstSlot[id]}`).getByLabel(/Subir captura o foto/).setInputFiles(['tests/files/foto-grande.png']);
      await expect(screen.getByTestId(`question-${firstSlot[id]}`).getByRole('status')).toContainText('Archivo guardado en tu cuenta');
    }
    await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
    const start = Date.now();
    await screen.getByRole('button', 'Entregar').tap();
    await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
    await expect(Date.now() - start < 8000, `entrega ${id} en ${Date.now() - start} ms`).toBe(true);
    if (id === 'pinal-temporadas') folio = await browser.evaluate(() => document.querySelector('.receipt code')?.textContent ?? '');
  }
  await browser.goto('/?fin=1#curso');
  for (const title of ['Guía para mejorar tus prompts', '¿Cuándo vienen los turistas a Pinal?', 'Cierre · Mi estrategia turística con IA']) {
    await expect(screen.getByRole('row').filter({ hasText: title })).toContainText('Entregada');
  }
  await screen.getByRole('button', 'Salir', { exact: true }).tap();

  // El admin ve la captura con el nombre de su apartado.
  await app.open('/#registro');
  await screen.getByLabel('Nombre completo', { exact: true }).fill('Docente Hash');
  await screen.getByLabel('Nombre de usuario', { exact: true }).fill(teacher);
  await screen.getByLabel('PIN', { exact: true }).fill('1122');
  await screen.getByLabel('Repite tu PIN', { exact: true }).fill('1122');
  await screen.getByRole('checkbox', /Acepto que se guarden/).check();
  await screen.getByRole('button', 'Crear mi cuenta').tap();
  execFileSync('docker', ['exec', container, 'psql', '-U', 'postgres', '-tAc', `select public.course_make_instructor('${teacher}')`]);
  await screen.getByRole('button', 'Salir', { exact: true }).tap();
  await enter(screen, teacher, '1122');
  await expect(screen.getByRole('heading', 'Seguimiento del grupo.')).toBeVisible();
  await expect(folio).toMatch(/^[0-9a-f-]{36}$/);
  await browser.goto(`/#entrega/${folio}`);
  const capture = screen.getByRole('listitem').filter({ hasText: 'foto-grande.jpg' });
  await expect(capture).toContainText('2. Captura de tu gráfica');
  await app.screenshot('admin-captura-por-apartado');
});
