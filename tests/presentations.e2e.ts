import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

test('PDF-01: las cinco presentaciones se leen dentro del curso, con páginas y zoom en PC y celular', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await screen.getByRole('link', 'Materiales del curso', { exact: true }).tap();
  const viewer = screen.getByRole('region', 'Visor de presentaciones');
  await expect(viewer).toBeVisible();
  await expect(screen.getByLabel('Presentación', { exact: true }).getByRole('option')).toHaveCount(5);
  await expect(screen.getByRole('status').filter({ hasText: 'Página 1 de' })).toBeVisible();
  await expect(screen.getByRole('button', 'Página anterior', { exact: true })).toBeDisabled();
  await screen.getByRole('button', 'Página siguiente', { exact: true }).tap();
  await expect(screen.getByRole('status').filter({ hasText: 'Página 2 de' })).toBeVisible();
  await screen.getByRole('button', 'Acercar', { exact: true }).tap();
  await expect(screen.getByRole('button', 'Ajustar al ancho', { exact: true })).toBeEnabled();
  await screen.getByRole('button', 'Ajustar al ancho', { exact: true }).tap();
  for (const value of ['1', '2', '3', '4']) {
    await screen.getByLabel('Presentación', { exact: true }).selectOption({ value });
    await expect(screen.getByRole('status').filter({ hasText: 'Página 1 de' })).toBeVisible();
    await expect(screen.getByRole('button', 'Página anterior', { exact: true })).toBeDisabled();
  }
  await expect(viewer.getByRole('link', 'Abrir PDF', { exact: true })).toHaveAttribute('href', '/materiales/5_Tema_IV_Clase_3_Tu_perfil_en_vivo.pdf');
  const fits = await browser.evaluate(() => {
    const canvas = document.querySelector('.pdf-stage canvas') as HTMLCanvasElement;
    return canvas.width > 0 && canvas.height > 0 && document.documentElement.scrollWidth <= window.innerWidth;
  });
  await expect(fits).toBe(true);
  await app.screenshot('visor-presentaciones');
});

test('PDF-02: un PDF que no carga ofrece reintento y acceso al archivo original', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await browser.route('**/materiales/1_Temas_I_y_II_IA_y_Chatbots.pdf', route => route.fulfill({ status: 503, body: 'Sin conexión' }));
  await screen.getByRole('link', 'Materiales del curso', { exact: true }).tap();
  await expect(screen.getByRole('alert')).toContainText('No se pudo mostrar');
  await expect(screen.getByRole('link', 'Abrir PDF', { exact: true })).toBeVisible();
  await browser.unroute('**/materiales/1_Temas_I_y_II_IA_y_Chatbots.pdf');
  await screen.getByRole('button', 'Reintentar', { exact: true }).tap();
  await expect(screen.getByRole('status').filter({ hasText: 'Página 1 de' })).toBeVisible();
});
