import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { readFile } from 'node:fs/promises';
import { courseFixture, login } from './course-fixture.ts';

test('AUTH-01: login gate, wrong PIN and explicit sign out', async ({ app, screen, browser }) => {
  await courseFixture(browser); await app.open('/#actividad/agente-ia');
  await expect(screen.getByRole('button', 'Entrar a mi curso')).toBeVisible();
  await app.screenshot('acceso-al-curso');
  await login(app, screen, { open: false, pin: '0000' });
  await expect(screen.getByRole('alert')).toContainText('Usuario o PIN incorrectos.');
  await login(app, screen, { open: false });
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
  await screen.getByRole('button', 'Salir', { exact: true }).tap();
  await expect(screen.getByRole('button', 'Entrar a mi curso')).toBeVisible();
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeHidden();
  await browser.reload();
  await expect(screen.getByRole('button', 'Entrar a mi curso')).toBeVisible();
});
test('AUTH-02: registration with username and PIN enters the course directly', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser); await app.open('/#registro');
  await screen.getByLabel('Nombre completo', { exact: true }).fill('María Sierra');
  await screen.getByLabel('Nombre de usuario', { exact: true }).fill('Maria.Sierra');
  await screen.getByLabel('PIN', { exact: true }).fill('2580');
  await screen.getByLabel('Repite tu PIN', { exact: true }).fill('2581');
  await screen.getByRole('checkbox', /Acepto que se guarden/).check();
  await screen.getByRole('button', 'Crear mi cuenta').tap();
  await expect(screen.getByRole('alert')).toContainText('Los PIN no coinciden.');
  await screen.getByLabel('PIN', { exact: true }).fill('2580');
  await screen.getByLabel('Repite tu PIN', { exact: true }).fill('2580');
  await screen.getByRole('button', 'Crear mi cuenta').tap();
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
  await expect(fixture.registered[0]).toEqual({ p_username: 'maria.sierra', p_full_name: 'María Sierra', p_pin: '2580' });
  await app.screenshot('registro-con-pin');
});
test('COURSE-01: draft survives reload and a fresh login', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  await screen.getByTestId('question-a2').getByRole('textbox').fill('Cabañas que se conservan');
  await screen.getByRole('button', 'Guardar avance').tap();
  await expect(screen.getByRole('status').filter({ hasText: 'Avance guardado en tu cuenta' })).toContainText('Avance guardado en tu cuenta');
  await expect(fixture.works.get('agente-ia').payload.answers.a2).toBe('Cabañas que se conservan');
  await browser.reload();
  await expect(screen.getByTestId('question-a2').getByRole('textbox')).toHaveValue('Cabañas que se conservan');
  await screen.getByRole('link', '← Volver a mi curso', { exact: true }).tap();
  await screen.getByRole('button', 'Salir', { exact: true }).tap();
  await login(app, screen, { open: false });
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Continuar').tap();
  await expect(screen.getByTestId('question-a2').getByRole('textbox')).toHaveValue('Cabañas que se conservan');
  await app.screenshot('borrador-recuperado');
});
test('COURSE-02: failed autosave never claims the changes were saved', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  await screen.getByRole('button', 'Guardar avance').tap();
  fixture.setSaveOffline(true);
  await screen.getByTestId('question-a2').getByRole('textbox').fill('No perder esta respuesta');
  await screen.getByRole('button', 'Guardar avance').tap();
  await expect(screen.getByRole('status').filter({ hasText: 'No se pudo guardar' })).toContainText('No se pudo guardar');
  await expect(screen.getByTestId('question-a2').getByRole('textbox')).toHaveValue('No perder esta respuesta');
  fixture.setSaveOffline(false);
  await screen.getByRole('button', 'Guardar avance').tap();
  await expect(screen.getByRole('status').filter({ hasText: 'Avance guardado en tu cuenta' })).toContainText('Avance guardado en tu cuenta');
});
test('TEACHER-01: instructor sees participants, response details and CSV', async ({ app, screen, browser }) => {
  await courseFixture(browser, { instructor: true }); await login(app, screen);
  await expect(screen.getByRole('heading', 'Seguimiento del grupo.')).toBeVisible();
  await screen.getByRole('navigation', 'Administración').getByRole('link', 'Panel docente', { exact: true }).tap();
  await expect(screen.getByRole('heading', 'Trabajos entregados')).toBeVisible();
  await app.screenshot('panel-docente');
  await screen.getByRole('searchbox', 'Buscar por nombre, negocio o correo').fill('Cabañas');
  const file = await browser.waitForDownload(() => screen.getByRole('button', 'Exportar esta lista').tap());
  const csv = await readFile(file.absolutePath, 'utf8');
  await expect(csv).toContain('Cabañas del Bosque');
  await expect(csv).toContain('¿Cómo activo mi agente?');
  await screen.getByRole('button', 'Ver entrega ↗').tap();
  await expect(screen.getByRole('heading', 'Luis Turismo')).toBeVisible();
  await expect(screen.getByText('¿Cómo activo mi agente?')).toBeVisible();
});
test('TEACHER-02: instructor publication changes persist', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser, { instructor: true }); await login(app, screen);
  await screen.getByRole('link', 'Actividades', { exact: true }).tap();
  await expect(screen.getByRole('heading', 'Tabla de actividades')).toBeVisible();
  const row = screen.getByRole('row').filter({ hasText: 'Tu agente de IA' });
  await expect(row.getByRole('checkbox', 'Bloquear edición después de la fecha límite')).toBeVisible();
  await row.getByRole('checkbox', 'Publicada').uncheck();
  await row.getByRole('button', 'Guardar', { exact: true }).tap();
  await expect(screen.getByRole('status')).toContainText('Configuración de Tu agente de IA guardada');
  await expect(fixture.activities.find(a => a.id === 'agente-ia').is_published).toBe(false);
});
test('COURSE-03: a student route cannot display the instructor panel', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await browser.goto('/#docente');
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
  await expect(screen.getByRole('heading', 'Trabajos entregados')).toBeHidden();
});

test('AUTH-03: instructor resets a forgotten PIN', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser, { instructor: true }); await login(app, screen);
  await screen.getByRole('link', 'Participantes', { exact: true }).tap();
  const row = screen.getByRole('row').filter({ hasText: 'Luis Turismo' });
  await expect(row).toContainText('@luis');
  await row.getByRole('button', 'Restablecer PIN').tap();
  await screen.getByLabel('Nuevo PIN', { exact: true }).fill('12');
  await screen.getByRole('button', 'Guardar nuevo PIN').tap();
  await expect(screen.getByRole('alert')).toContainText('de 4 a 6 números');
  await screen.getByLabel('Nuevo PIN', { exact: true }).fill('4321');
  await app.screenshot('restablecer-pin');
  await screen.getByRole('button', 'Guardar nuevo PIN').tap();
  await expect(screen.getByRole('heading', 'PIN actualizado')).toBeVisible();
  await expect(fixture.pinResets[0]).toEqual({ p_token: 'a'.repeat(64), p_user_id: '10000000-0000-4000-8000-000000000002', p_pin: '4321' });
});

test('COURSE-04: seven original PDF materials are available', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await screen.getByRole('link', 'Materiales del curso', { exact: true }).tap();
  await expect(screen.getByRole('heading', 'Materiales del curso.')).toBeVisible();
  await expect(screen.getByRole('link', /Guía de la actividad/)).toHaveCount(5);
  const response = await fetch(new URL('/materiales/Evaluacion_diagnostica.pdf', app.baseUrl), { method: 'HEAD' });
  await expect(response.status).toBe(200);
  await expect(response.headers.get('content-type')).toBe('application/pdf');
});

test('COURSE-05: failed navigation keeps unsaved work and retry completes navigation', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  await screen.getByRole('button', 'Guardar avance').tap();
  fixture.setSaveOffline(true);
  await screen.getByTestId('question-a2').getByRole('textbox').fill('No salir sin guardar');
  await screen.getByRole('link', '← Volver a mi curso', { exact: true }).tap();
  await expect(screen.getByRole('alert')).toContainText('No pudimos completar la operación');
  await expect(screen.getByTestId('question-a2').getByRole('textbox')).toHaveValue('No salir sin guardar');
  fixture.setSaveOffline(false);
  await screen.getByRole('button', 'Guardar avance').tap();
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
});

test('FILE-01: student attaches, downloads and removes files; large photos are reduced', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  await screen.getByLabel(/Agregar archivo/).setInputFiles(['tests/files/plan-de-negocio.pdf']);
  await expect(screen.getByRole('status').filter({ hasText: 'Archivo guardado' })).toContainText('plan-de-negocio.pdf');
  await screen.getByLabel(/Agregar archivo/).setInputFiles(['tests/files/foto-grande.png']);
  await expect(screen.getByRole('status').filter({ hasText: 'Archivo guardado' })).toContainText('foto-grande.jpg');
  await expect(fixture.files[1].mime).toBe('image/jpeg');
  await expect(fixture.files[1].size < 1024 * 1024).toBe(true);
  await screen.getByLabel(/Agregar archivo/).setInputFiles(['tests/files/pagina.html']);
  await expect(screen.getByRole('status').filter({ hasText: 'No se pudo subir' })).toContainText('Tipo de archivo no permitido');
  const download = await browser.waitForDownload(() => screen.getByRole('listitem').filter({ hasText: 'plan-de-negocio.pdf' }).getByRole('button', 'Descargar').tap());
  await expect(await readFile(download.absolutePath, 'latin1')).toBe(await readFile('tests/files/plan-de-negocio.pdf', 'latin1'));
  await app.screenshot('archivos-adjuntos');
  await screen.getByRole('button', 'Quitar foto-grande.jpg').tap();
  await expect(screen.getByRole('listitem').filter({ hasText: 'foto-grande.jpg' })).toBeHidden();
  await expect(fixture.files.length).toBe(1);
  await expect(screen.getByText('Avance guardado en tu cuenta ✓')).toBeVisible();
  await browser.reload();
  await expect(screen.getByRole('listitem').filter({ hasText: 'plan-de-negocio.pdf' })).toBeVisible();
  await expect(screen.getByRole('button', 'Quitar plan-de-negocio.pdf')).toBeVisible();
});
