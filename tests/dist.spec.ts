import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

test('DIST-01: el sitio compilado carga las 10 actividades igual en PC y celular, con URL versionadas', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  await browser.unroute('**/config.json');
  const config = await (await fetch(new URL('/config.json', app.baseUrl))).json();
  await browser.route('**/config.json', route => route.fulfill({ json: { ...config, supabaseUrl: 'https://qa.supabase.co', supabaseKey: 'sb_publishable_public_test_key' } }));
  await login(app, screen);
  await expect(screen.getByRole('table').getByRole('row')).toHaveCount(11);
  for (const title of ['Guía para mejorar tus prompts', '¿Cuándo vienen los turistas a Pinal?', 'Cierre · Mi estrategia turística con IA']) await expect(screen.getByRole('row').filter({ hasText: title })).toBeVisible();
  await expect(screen.getByRole('row').filter({ hasText: 'WhatsApp Business' })).toHaveCount(0);
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
  await screen.getByRole('row').filter({ hasText: 'Guía para mejorar tus prompts' }).getByRole('link', 'Comenzar').tap();
  await screen.getByTestId('question-g2').getByRole('textbox').fill('Le falta decir quién soy');
  version = 'publicacion-nueva';
  await browser.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(screen.getByText('Hay una versión nueva del curso.')).toBeVisible();
  await app.screenshot('aviso-version-nueva');
  version = config.version;
  await screen.getByRole('button', 'Actualizar').tap();
  await expect(screen.getByTestId('question-g2').getByRole('textbox')).toHaveValue('Le falta decir quién soy');
  await expect(fixture.works.get('guia-prompts').payload.answers.g2).toBe('Le falta decir quién soy');
});
