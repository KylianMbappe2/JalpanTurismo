import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

test('DIST-01: el sitio compilado carga las seis actividades igual en PC y celular, con URL versionadas', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  await browser.unroute('**/config.json');
  const config = await (await fetch(new URL('/config.json', app.baseUrl))).json();
  await browser.route('**/config.json', route => route.fulfill({ json: { ...config, supabaseUrl: 'https://qa.supabase.co', supabaseKey: 'sb_publishable_public_test_key' } }));
  await login(app, screen);
  const block = screen.getByRole('region', 'Actividades del curso');
  await expect(block.getByRole('row')).toHaveCount(7);
  await expect(block.getByRole('row').nth(1)).toContainText('Evaluación diagnóstica');
  await expect(block.getByRole('row').nth(2)).toContainText('Crea el prompt conjunto');
  await expect(block.getByRole('row').nth(3)).toContainText('Calendario de contenido');
  await expect(block.getByRole('row').nth(4)).toContainText('Flyers hechos con IA');
  await expect(block.getByRole('row').nth(5)).toContainText('Perfil turístico: Google Maps, TripAdvisor o Airbnb');
  await expect(block.getByRole('row').nth(6)).toContainText('Chatbot personalizado para WhatsApp');
  await expect(screen.getByRole('region', 'Extras · Tus trabajos anteriores')).toHaveCount(0);
  await expect(screen.getByRole('heading', '1 de 6 actividades cumplidas')).toBeVisible();
  await app.screenshot('seis-actividades');
  const urls = await browser.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name).filter(name => /\.(js|css)(\?|$)/.test(name) && name.startsWith(location.origin)));
  await expect(urls.length > 8).toBe(true);
  await expect(urls.filter(url => !url.includes(`?v=${config.version}`))).toEqual([]);
  void fixture;
});

test('DIST-02: una pestaña abierta durante una publicación avisa y se actualiza guardando el avance', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  await browser.unroute('**/config.json');
  const config = await (await fetch(new URL('/config.json', app.baseUrl))).json();
  let version = config.version;
  await browser.route('**/config.json', route => route.fulfill({ json: { ...config, version, supabaseUrl: 'https://qa.supabase.co', supabaseKey: 'sb_publishable_public_test_key' } }));
  await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Crea el prompt conjunto' }).getByRole('link', 'Comenzar').tap();
  await screen.getByTestId('question-pc_revision').getByRole('textbox').fill('Le falta decir quién soy');
  version = 'publicacion-nueva';
  await browser.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(screen.getByText('Hay una versión nueva del curso.')).toBeVisible();
  await app.screenshot('aviso-version-nueva');
  version = config.version;
  await screen.getByRole('button', 'Actualizar').tap();
  await expect(screen.getByTestId('question-pc_revision').getByRole('textbox')).toHaveValue('Le falta decir quién soy');
  await expect(fixture.works.get('prompt-conjunto').payload.answers.pc_revision).toBe('Le falta decir quién soy');
});
