import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

test('UX-01: acceso directo a sesiones sin cambiar ruta y ayuda en palabras sencillas', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
  await screen.getByRole('button', 'Ir a Sesión 2').tap();
  await expect(browser).toHaveURL(/#curso$/);
  expect(await browser.evaluate(() => document.activeElement?.id)).toBe('group-session2');
  await screen.getByText('¿Cómo hago una actividad?', { exact: true }).tap();
  await expect(screen.getByText('Toca Entregar cuando termines. Tu docente recibirá tu trabajo.')).toBeVisible();
  await screen.getByRole('link', 'Seguir con mi curso').tap();
  await expect(browser).toHaveURL(/#actividad\/diagnostico$/);
  await expect(screen.getByText('¿Cómo guardo mi trabajo?', { exact: true })).toBeVisible();
});

test('UX-02: controles legibles y navegación móvil sin tapar contenido', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await browser.setViewport({ width, height: 844 });
    expect(await browser.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await browser.evaluate(() => [...document.querySelectorAll('.student-table .row-action')].every(el => el.getBoundingClientRect().height >= 44))).toBe(true);
  }
  await browser.setViewport({ width: 390, height: 844 });
  await app.screenshot('inicio-familiar-movil');
  await screen.getByRole('navigation', 'Menú del curso').getByRole('link', 'Materiales del curso', { exact: true }).tap();
  await expect(screen.getByRole('heading', 'Materiales del curso.')).toBeVisible();
  await screen.getByRole('navigation', 'Menú del curso').getByRole('link', 'Mis actividades', { exact: true }).tap();
  await screen.getByRole('region', 'Sesión 2 · Actividades de hoy').getByRole('row').filter({ hasText: 'Mi tabla de precios' }).getByRole('link', 'Comenzar').tap();
  await screen.getByText('¿Cómo guardo mi trabajo?', { exact: true }).tap();
  await expect(screen.getByText(/Guardar avance: guarda lo que llevas/)).toBeVisible();
  await screen.getByText('¿Cómo guardo mi trabajo?', { exact: true }).tap();
  await app.screenshot('actividad-familiar-movil');
  await screen.getByTestId('question-sp1').getByRole('textbox').fill('Cabañas de prueba');
  await screen.getByRole('button', 'Guardar avance', { exact: true }).tap();
  await expect(screen.getByText('Avance guardado en tu cuenta ✓')).toBeVisible();
  expect(await browser.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, overflowing: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right })) }))).toEqual({ width: 390, scroll: 390, overflowing: [] });
});


test('UX-03: acceso clásico compacto y ayuda de registro bajo demanda', async ({ app, screen, browser }) => {
  await courseFixture(browser); await app.open('/#login');
  await expect(screen.getByRole('heading', 'Iniciar sesión')).toBeVisible();
  await expect(screen.getByRole('img', 'Montañas y una cabaña de la Sierra Gorda')).toBeVisible();
  await app.screenshot('login-con-ilustracion');
  await expect(screen.getByText(/máximo 30 caracteres/)).toBeHidden();
  await browser.setViewport({ width: 320, height: 740 });
  expect(await browser.evaluate(() => {
    const button = document.querySelector('.auth-submit').getBoundingClientRect();
    return button.bottom <= innerHeight && document.documentElement.scrollWidth === innerWidth;
  })).toBe(true);
  await app.screenshot('login-clasico-movil');
  await screen.getByRole('link', 'Crear cuenta', { exact: true }).tap();
  await expect(screen.getByLabel('Repite tu PIN', { exact: true })).toBeVisible();
  await expect(screen.getByRole('img', 'Montañas y una cabaña de la Sierra Gorda')).toBeVisible();
  await expect(screen.getByText(/letras sin acentos, números/)).toBeHidden();
  await screen.getByText('¿Qué puedo usar?', { exact: true }).tap();
  await expect(screen.getByText(/letras sin acentos, números/)).toBeVisible();
  await screen.getByText('¿Qué puedo usar?', { exact: true }).tap();
  await app.screenshot('registro-clasico-movil');
  for (const width of [320, 390, 768, 1024, 1440]) {
    await browser.setViewport({ width, height: 900 });
    expect(await browser.evaluate(() => document.documentElement.scrollWidth === innerWidth)).toBe(true);
  }
  await app.screenshot('registro-con-ilustracion');
});
