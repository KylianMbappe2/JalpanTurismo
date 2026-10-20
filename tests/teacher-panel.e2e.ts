import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { readFile } from 'node:fs/promises';
import { courseFixture, login } from './course-fixture.ts';

test('PANEL-01: el enlace directo abre los trabajos entregados después de entrar', async ({ app, screen, browser }) => {
  await courseFixture(browser, { instructor: true });
  await app.open('/#docente');
  await login(app, screen, { open: false });
  await expect(screen.getByRole('heading', 'Panel docente', { exact: true })).toBeVisible();
  await expect(screen.getByRole('heading', 'Trabajos entregados')).toBeVisible();
  await expect(screen.getByRole('row').filter({ hasText: 'Luis Turismo' })).toContainText('Entregada');
  await browser.reload();
  await expect(screen.getByRole('heading', 'Panel docente', { exact: true })).toBeVisible();
  await app.screenshot('panel-docente-entregas');
});

test('PANEL-02: filtra entregas por alumno, actividad y preguntas', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser, { instructor: true });
  fixture.responses.push({ id: '20000000-0000-4000-8000-000000000090', student_id: null, full_name: 'Nora Sierra', business: 'Tours Nora', email: '', form_id: 'whatsapp', submitted_at: new Date().toISOString(), questions: '', answers: { w1: 'Bienvenidos' } });
  await login(app, screen);
  await screen.getByRole('navigation', 'Administración').getByRole('link', 'Panel docente').tap();
  await expect(screen.getByTestId('received-count')).toContainText('2 entregas');
  await screen.getByText('Filtrar entregas').tap();
  await screen.getByRole('checkbox', 'Solo entregas con preguntas').check();
  await expect(screen.getByRole('row').filter({ hasText: 'Nora Sierra' })).toBeHidden();
  await expect(screen.getByRole('row').filter({ hasText: 'Luis Turismo' })).toBeVisible();
  await screen.getByRole('checkbox', 'Solo entregas con preguntas').uncheck();
  await screen.getByLabel('Filtrar por actividad').selectOption({ label: 'WhatsApp Business' });
  await expect(screen.getByRole('row').filter({ hasText: 'Nora Sierra' })).toBeVisible();
  await expect(screen.getByRole('row').filter({ hasText: 'Luis Turismo' })).toBeHidden();
  await screen.getByRole('searchbox', 'Buscar por nombre, negocio o correo').fill('sin coincidencias');
  await expect(screen.getByText('No hay entregas con estos filtros')).toBeVisible();
  await screen.getByRole('button', 'Limpiar filtros').tap();
  await expect(screen.getByTestId('received-count')).toContainText('2 entregas');
});

test('PANEL-03: consulta respuestas y descarga archivos desde el celular', async ({ app, screen, browser }) => {
  await courseFixture(browser, { instructor: true });
  await login(app, screen);
  await screen.getByRole('navigation', 'Administración').getByRole('link', 'Panel docente').tap();
  for (const width of [320, 390, 768, 1440]) {
    await browser.setViewport({ width, height: 844 });
    await expect(await browser.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
  await browser.setViewport({ width: 390, height: 844 });
  await screen.getByRole('row').filter({ hasText: 'Luis Turismo' }).getByRole('button', 'Ver entrega ↗').tap();
  await expect(screen.getByRole('heading', 'Luis Turismo')).toBeVisible();
  await expect(screen.getByText('Cabañas del Bosque')).toHaveCount(2);
  await expect(screen.getByText('¿Cómo activo mi agente?')).toBeVisible();
  const download = await browser.waitForDownload(() => screen.getByRole('listitem').filter({ hasText: 'plan-de-negocio.pdf' }).getByRole('button', 'Descargar').tap());
  await expect(await readFile(download.absolutePath, 'utf8')).toBe('pdf-bytes');
  await screen.getByRole('link', '← Volver a las entregas').tap();
  await expect(screen.getByRole('heading', 'Panel docente', { exact: true })).toBeVisible();
});
