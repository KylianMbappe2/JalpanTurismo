import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { readFile } from 'node:fs/promises';
import { courseFixture, login } from './course-fixture.ts';

test('EDIT-01: entregar, corregir y volver a entregar conserva el folio', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  await expect(await browser.evaluate(() => {
    const bar = document.querySelector('.draft-save-bar')!.getBoundingClientRect();
    return bar.top >= 0 && bar.bottom <= window.innerHeight;
  })).toBe(true);
  await screen.getByTestId('question-a2').getByRole('textbox').fill('Mi negocio de prueba');
  await screen.getByRole('textbox', 'Tus preguntas para el instructor').fill('¿Cómo publico mi agente?');
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  await screen.getByRole('button', 'Entregar').tap();
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
  const folio = fixture.responses[0].id;
  await screen.getByRole('link', 'Volver a mi curso').tap();
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Editar entrega').tap();
  await expect(screen.getByText('Ya entregaste; los cambios actualizan tu entrega')).toBeVisible();
  await expect(screen.getByText(folio)).toBeVisible();
  await screen.getByTestId('question-a2').getByRole('textbox').fill('Cabañas corregidas');
  await screen.getByRole('button', 'Guardar cambios de la entrega').tap();
  await expect(screen.getByRole('status').filter({ hasText: 'Tu entrega se actualizó.' })).toBeVisible();
  await expect(fixture.responses).toHaveLength(1);
  await expect(fixture.responses[0].id).toBe(folio);
  await expect(fixture.responses[0].answers.a2).toBe('Cabañas corregidas');
  await expect(fixture.versions).toHaveLength(1);
  await expect(fixture.versions[0].answers.a2).toBe('Mi negocio de prueba');
  const layout = await browser.evaluate(() => ({ left: window.scrollX, width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  await expect(layout).toEqual({ left: 0, width: layout.viewport, viewport: layout.viewport });
  await app.screenshot('entrega-corregida');
});

test('EDIT-02: una actividad cerrada se consulta en solo lectura', async ({ app, screen, browser }) => {
  await courseFixture(browser, { closedForm: 'agente-ia' }); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Ver entrega').tap();
  await expect(screen.getByText('El plazo para editar esta actividad ya terminó.')).toBeVisible();
  await expect(screen.getByTestId('question-a2').getByRole('textbox')).toBeDisabled();
  await expect(screen.getByTestId('question-a2').getByRole('textbox')).toHaveValue('Entrega cerrada');
  await expect(screen.getByRole('button', 'Entregar')).toBeHidden();
  await expect(screen.getByRole('button', 'Guardar cambios de la entrega')).toBeHidden();
  await expect(screen.getByRole('button', 'Guardar avance')).toBeHidden();
  await app.screenshot('actividad-cerrada');
});

test('TRACK-01: la matriz muestra quién entregó y quién no', async ({ app, screen, browser }) => {
  await courseFixture(browser, { instructor: true }); await login(app, screen);
  await expect(screen.getByRole('heading', 'Seguimiento del grupo.')).toBeVisible();
  await expect(screen.getByRole('heading', 'Alumnos y actividades')).toBeVisible();
  await screen.getByLabel('Filtrar por actividad').selectOption({ label: 'Tu agente de IA' });
  await screen.getByRole('checkbox', 'Solo quienes no entregaron').check();
  await expect(screen.getByRole('row').filter({ hasText: 'María Bosque' })).toBeVisible();
  await expect(screen.getByRole('row').filter({ hasText: 'Luis Turismo' })).toBeHidden();
  const totals = await browser.evaluate(() => innerWidth <= 767) ? screen.getByTestId('activity-totals') : screen.getByRole('columnheader').filter({ hasText: 'Tu agente de IA' });
  await expect(totals).toContainText('entregaron 1 / faltan 1');
  const file = await browser.waitForDownload(() => screen.getByRole('button', 'Exportar seguimiento').tap());
  const csv = await readFile(file.absolutePath, 'utf8');
  await expect(csv).toContain('María Bosque');
  await expect(csv.includes('Luis Turismo')).toBe(false);
  await app.screenshot('seguimiento-faltantes');
});

test('TRACK-02: el detalle abre un borrador y una entrega con archivos', async ({ app, screen, browser }) => {
  await courseFixture(browser, { instructor: true }); await login(app, screen);
  await screen.getByRole('button', 'Luis Turismo, Tu agente de IA: Entregada').tap();
  await expect(screen.getByRole('heading', 'Luis Turismo')).toBeVisible();
  await expect(screen.getByText('Cabañas del Bosque')).toBeVisible();
  await expect(screen.getByText('¿Cómo activo mi agente?')).toBeVisible();
  await expect(screen.getByRole('listitem').filter({ hasText: 'plan-de-negocio.pdf' })).toBeVisible();
  const download = await browser.waitForDownload(() => screen.getByRole('listitem').filter({ hasText: 'plan-de-negocio.pdf' }).getByRole('button', 'Descargar').tap());
  await expect(await readFile(download.absolutePath, 'utf8')).toBe('pdf-bytes');
  await screen.getByRole('link', '← Volver al seguimiento').tap();
  await screen.getByRole('button', 'María Bosque, Guía para mejorar tus prompts: En progreso').tap();
  await expect(screen.getByText('Hola, soy María y este es mi borrador')).toBeVisible();
  await expect(screen.getByText('Todavía no hay una entrega definitiva.')).toBeVisible();
  await app.screenshot('detalle-borrador-y-entrega');
});
