import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

test('SESSION-01: sesión uno intacta, tres actividades nuevas y cinco extras separados', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  const first = screen.getByRole('region', 'Sesión 1');
  const today = screen.getByRole('region', 'Sesión 2 · Actividades de hoy');
  const extras = screen.getByRole('region', 'Extras');
  await expect(first.getByRole('row')).toHaveCount(6);
  await expect(today.getByRole('row')).toHaveCount(4);
  await expect(extras.getByRole('row')).toHaveCount(6);
  await expect(first).toContainText('Guía para mejorar tus prompts');
  await expect(first).toContainText('Tu agente de IA');
  await expect(extras).toContainText('¿Cuándo vienen los turistas a Pinal?');
  await expect(screen.getByText('0 de 8 actividades entregadas')).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await browser.setViewport({ width, height: 900 });
    expect(await browser.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await browser.setViewport({ width: 390, height: 844 });
  await app.screenshot('sesiones-y-extras');
});

test('SESSION-02: precios guarda un borrador con gráfica y entrega editable, competencia y calendario abren', async ({ app, screen, browser }) => {
  await browser.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { document.documentElement.dataset.copiedPrompt = text; } } }));
  const fixture = await courseFixture(browser); await login(app, screen);
  await screen.getByRole('region', 'Sesión 2 · Actividades de hoy').getByRole('row').filter({ hasText: 'Mi tabla de precios por temporada' }).getByRole('link', 'Comenzar').tap();
  await screen.getByText('Ver y copiar el prompt completo', { exact: true }).tap();
  await expect(screen.getByRole('button', 'Copiar prompt')).toBeVisible();
  await expect(screen.getByText(/PARTE 3 · MIS TEMPORADAS ALTAS Y BAJAS/)).toBeVisible();
  await screen.getByRole('button', 'Copiar prompt').tap();
  await expect(screen.getByRole('button', 'Copiado ✓')).toBeVisible();
  const copied = await browser.evaluate(() => document.documentElement.dataset.copiedPrompt);
  expect(copied).toContain('PARTE 1 · MI TABLA DE PRECIOS');
  expect(copied).toContain('PARTE 2 · COMPARACIÓN CON MI COMPETENCIA');
  expect(copied).toContain('PARTE 3 · MIS TEMPORADAS ALTAS Y BAJAS');
  expect(copied).toContain('No encontrado');
  await screen.getByTestId('question-sp1').getByRole('textbox').fill('Cabañas de prueba · Pinal de Amoles');
  await screen.getByTestId('question-sp7').getByLabel(/Subir captura o foto/).setInputFiles(['tests/files/plan-de-negocio.pdf']);
  await expect(screen.getByTestId('question-sp7').getByRole('status')).toContainText('Archivo guardado');
  await screen.getByTestId('question-sp10').getByRole('textbox').fill('Baja: $1,000; media: $1,200; alta: $1,400. Datos de prueba.');
  await screen.getByRole('button', 'Guardar avance').tap();
  await expect(screen.getByText('Avance guardado en tu cuenta ✓')).toBeVisible();
  await browser.reload();
  await expect(screen.getByTestId('question-sp1').getByRole('textbox')).toHaveValue('Cabañas de prueba · Pinal de Amoles');
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  await screen.getByRole('button', 'Entregar').tap();
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
  expect(fixture.responses[0].form_id).toBe('sesion2-precios');
  await screen.getByRole('link', 'Volver a mi curso').tap();
  await screen.getByRole('row').filter({ hasText: 'Mi tabla de precios por temporada' }).getByRole('link', 'Editar entrega').tap();
  await expect(screen.getByTestId('question-sp10').getByRole('textbox')).toHaveValue(/Baja: \$1,000/);
  await screen.getByRole('link', '← Volver a mi curso', { exact: true }).tap();
  for (const title of ['Compara mi negocio con 3 competidores', 'Mi calendario de temporadas y plan final']) {
    await screen.getByRole('row').filter({ hasText: title }).getByRole('link', 'Comenzar').tap();
    await expect(screen.getByRole('heading', title, { exact: true }).first()).toBeVisible();
    await screen.getByRole('link', '← Volver a mi curso', { exact: true }).tap();
  }
});

test('SESSION-03: un borrador de la sesión anterior sigue disponible en Extras sin perder datos', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  fixture.works.set('pinal-precios', { form_id: 'pinal-precios', status: 'draft', revision: 2, saved_at: new Date().toISOString(), payload: { id: '70000000-0000-4000-8000-000000000001', form_id: 'pinal-precios', version: 1, participant: { name: 'Ana Sierra' }, answers: { r1: 'Mis costos anteriores: 600' }, questions: 'Duda anterior', consent: false } });
  await login(app, screen);
  await screen.getByRole('region', 'Extras').getByRole('row').filter({ hasText: '¿Cuánto deberías cobrar?' }).getByRole('link', 'Continuar').tap();
  await expect(screen.getByTestId('question-r1').getByRole('textbox')).toHaveValue('Mis costos anteriores: 600');
  await expect(screen.getByRole('textbox', 'Tus preguntas para el instructor')).toHaveValue('Duda anterior');
});

test('SESSION-04: el docente abre las respuestas y archivos de una actividad nueva', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser, { instructor: true });
  fixture.responses.push({ id: '70000000-0000-4000-8000-000000000004', student_id: '10000000-0000-4000-8000-000000000002', form_id: 'sesion2-temporadas', full_name: 'Luis Turismo', submitted_at: new Date().toISOString(), answers: { st4: 'Tabla final de prueba: temporada, meses, precio y promoción' }, questions: '¿Cómo confirmo las fiestas locales?' });
  fixture.files.push({ id: '70000000-0000-4000-8000-000000000005', user_id: '10000000-0000-4000-8000-000000000002', form_id: 'sesion2-temporadas', slot: 'st7', name: 'plan-final.pdf', mime: 'application/pdf', size: 9, data: btoa('pdf-bytes') });
  await login(app, screen);
  await screen.getByRole('navigation', 'Administración').getByRole('link', 'Panel docente', { exact: true }).tap();
  await screen.getByRole('row').filter({ hasText: 'Mi calendario de temporadas y plan final' }).getByRole('button', 'Ver entrega ↗').tap();
  await expect(screen.getByText('Tabla final de prueba: temporada, meses, precio y promoción')).toBeVisible();
  await expect(screen.getByText('¿Cómo confirmo las fiestas locales?')).toBeVisible();
  await expect(screen.getByRole('listitem').filter({ hasText: 'plan-final.pdf' })).toBeVisible();
  await expect(screen.getByRole('listitem').filter({ hasText: 'plan-final.pdf' }).getByRole('button', 'Descargar')).toBeVisible();
});
