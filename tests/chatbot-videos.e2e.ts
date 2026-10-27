import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

const titles = ['Recorrido inicial y listas de chats', 'Perfil y horarios del negocio', 'Catálogo, ubicación y enlaces', 'Mensajes automáticos y respuestas rápidas'];

test('VIDEO-01: los cuatro videos del chatbot se reproducen dentro del aula sin descargas iniciales', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  const requests: string[] = [];
  await browser.route('**/materiales/videos/**/*.mp4', route => { requests.push(route.request.url); return route.continue(); });
  await screen.getByRole('link', 'Materiales del curso', { exact: true }).tap();
  await expect(screen.getByRole('region', 'Videos para el chatbot')).toBeVisible();
  await expect(screen.getByRole('button', /^Ver video \d:/)).toHaveCount(4);
  await expect(requests).toEqual([]);
  for (let index = 0; index < titles.length; index++) {
    await screen.getByRole('button', `Ver video ${index + 1}: ${titles[index]}`).tap();
    await expect(screen.getByRole('heading', titles[index], { exact: true })).toBeVisible();
    await expect.poll(() => browser.evaluate(() => {
      const video = document.querySelector('video');
      return Boolean(video && video.readyState >= 2 && video.videoWidth > 0 && video.currentTime > 0 && !video.paused && !video.error);
    })).toBe(true);
    await expect(await browser.evaluate(() => document.querySelectorAll('video').length)).toBe(1);
    await expect(await browser.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await app.screenshot('videos-chatbot-inline');
  await screen.getByRole('link', 'Volver a la actividad del chatbot').tap();
  await expect(screen.getByRole('heading', 'Chatbot personalizado para WhatsApp', { exact: true })).toBeVisible();
  await expect(await browser.evaluate(() => document.querySelectorAll('video').length)).toBe(0);
});

test('VIDEO-02: acceso desde la actividad, reintento ante error y navegación con teclado', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await screen.getByRole('link', 'Comenzar', { exact: false }).last().tap();
  await screen.getByRole('link', 'Ver videos de apoyo para WhatsApp').tap();
  await expect(screen.getByRole('heading', 'Videos para el chatbot', { exact: true })).toBeVisible();
  await browser.route('**/materiales/videos/**/*.mp4', route => route.abort());
  await screen.getByRole('button', `Ver video 1: ${titles[0]}`).press('Enter');
  await expect(screen.getByRole('status', 'Estado del video')).toContainText('No se pudo reproducir');
  await expect(screen.getByRole('link', 'Descargar video')).toBeVisible();
  await browser.unroute('**/materiales/videos/**/*.mp4');
  await screen.getByRole('button', `Ver video 1: ${titles[0]}`).tap();
  await expect.poll(() => browser.evaluate(() => (document.querySelector('video')?.readyState ?? 0) >= 2)).toBe(true);
  for (const width of [320, 768, 1024]) {
    await browser.setViewport({ width, height: 900 });
    await expect(await browser.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('VIDEO-03: el servidor permite reproducir y adelantar con rangos de bytes', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await screen.getByRole('link', 'Materiales del curso', { exact: true }).tap();
  await screen.getByRole('button', `Ver video 1: ${titles[0]}`).tap();
  const path = await screen.getByRole('link', 'Descargar video').getAttribute('href');
  const response = await fetch(new URL(path!, app.baseUrl), { headers: { Range: 'bytes=0-1023' } });
  await expect(response.status).toBe(206);
  await expect(response.headers.get('content-type')).toContain('video/mp4');
  await expect((await response.arrayBuffer()).byteLength).toBe(1024);
  const invalid = await fetch(new URL(path!, app.baseUrl), { headers: { Range: 'bytes=999999999-' } });
  await expect(invalid.status).toBe(416);
});
