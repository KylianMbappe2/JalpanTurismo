import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

const titles = ['IA y chatbots', 'Tendencias y precios', 'Contenido para redes', 'Perfiles turísticos', 'Tu perfil en vivo', 'Configura tus perfiles turísticos'];

test('PDF-01: las seis presentaciones se leen dentro del curso, con páginas y zoom en PC y celular', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await screen.getByRole('link', 'Materiales del curso', { exact: true }).tap();
  await expect(screen.getByRole('region', 'Clases del curso')).toBeVisible();
  await expect(screen.getByRole('button', /^Ver clase \d:/)).toHaveCount(6);
  await app.screenshot('clases-del-curso');
  await screen.getByRole('button', 'Ver clase 1: IA y chatbots', { exact: true }).tap();
  const viewer = screen.getByRole('region', 'Visor de presentaciones');
  await expect(viewer).toBeVisible();
  await expect(screen.getByRole('status').filter({ hasText: 'Página 1 de' })).toBeVisible();
  await expect(screen.getByRole('button', 'Página anterior', { exact: true })).toBeDisabled();
  await screen.getByRole('button', 'Página siguiente', { exact: true }).tap();
  await expect(screen.getByRole('status').filter({ hasText: 'Página 2 de' })).toBeVisible();
  await screen.getByRole('button', 'Acercar', { exact: true }).tap();
  await expect(screen.getByRole('button', 'Ajustar al ancho', { exact: true })).toBeEnabled();
  await screen.getByRole('button', 'Ajustar al ancho', { exact: true }).tap();
  for (let i = 1; i < titles.length; i++) {
    await screen.getByRole('button', 'Todas las clases', { exact: true }).tap();
    await screen.getByRole('button', `Ver clase ${i + 1}: ${titles[i]}`, { exact: true }).tap();
    await expect(screen.getByRole('status').filter({ hasText: 'Página 1 de' })).toBeVisible();
    await expect(screen.getByRole('button', 'Página anterior', { exact: true })).toBeDisabled();
  }
  await expect(viewer.getByRole('link', 'Abrir PDF', { exact: true })).toHaveAttribute('href', '/materiales/6_Tema_IV_Practica_integradora_Perfiles_turisticos.pdf');
  const fits = await browser.evaluate(() => {
    const slide = document.querySelector('.pdf-stage img') as HTMLImageElement;
    return slide.complete && slide.naturalWidth > 0 && document.documentElement.scrollWidth <= window.innerWidth;
  });
  await expect(fits).toBe(true);
  await app.screenshot('visor-por-clase');
});

test('PDF-02: una vista que no carga ofrece reintento y acceso al archivo original', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await browser.route('**/materiales/clases/**/page-001*.webp', route => route.fulfill({ status: 503, body: 'Sin conexión' }));
  await screen.getByRole('link', 'Materiales del curso', { exact: true }).tap();
  await screen.getByRole('button', 'Ver clase 1: IA y chatbots', { exact: true }).tap();
  await expect(screen.getByRole('alert')).toContainText('No se pudo mostrar');
  await expect(screen.getByRole('link', 'Abrir PDF', { exact: true })).toBeVisible();
  await browser.unroute('**/materiales/clases/**/page-001*.webp');
  await screen.getByRole('button', 'Reintentar', { exact: true }).tap();
  await expect(screen.getByRole('status').filter({ hasText: 'Página 1 de' })).toBeVisible();
});

test('PDF-03: las clases y el zoom se adaptan a pantallas de 320, 768 y 1024 px', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await screen.getByRole('link', 'Materiales del curso', { exact: true }).tap();
  for (const width of [320, 768, 1024]) {
    await browser.setViewport({ width, height: 900 });
    await expect(screen.getByRole('button', 'Ver clase 1: IA y chatbots', { exact: true })).toBeVisible();
    await expect(await browser.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await screen.getByRole('button', 'Ver clase 1: IA y chatbots', { exact: true }).tap();
    await expect(screen.getByRole('status').filter({ hasText: 'Página 1 de' })).toBeVisible();
    await screen.getByRole('button', 'Acercar', { exact: true }).tap();
    const zoomFits = await browser.evaluate(() => {
      const stage = document.querySelector('.pdf-stage') as HTMLElement;
      return stage.scrollWidth > stage.clientWidth && document.documentElement.scrollWidth <= innerWidth;
    });
    await expect(zoomFits).toBe(true);
    await screen.getByRole('button', 'Todas las clases', { exact: true }).tap();
  }
});
