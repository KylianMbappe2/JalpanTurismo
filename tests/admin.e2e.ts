import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

test('ADMIN-01: administrador entra al panel y consulta su perfil', async ({ app, screen, browser }) => {
  await courseFixture(browser, { instructor: true, profile: { username: 'jonathan', full_name: 'Jonathan Sanchez' } });
  await login(app, screen);
  await expect(screen.getByRole('heading', 'Seguimiento del grupo.')).toBeVisible();
  await expect(screen.getByRole('navigation', 'Administración')).toBeVisible();
  await expect(screen.getByTestId('admin-summary')).toContainText('2 alumnos');
  await screen.getByRole('link', 'Mi perfil', { exact: true }).tap();
  await expect(screen.getByRole('heading', 'Mi perfil de administrador')).toBeVisible();
  await expect(screen.getByRole('region', 'Perfil de administrador').getByText('@jonathan', { exact: true })).toBeVisible();
  await expect(screen.getByTestId('account-role')).toContainText('Administrador');
  await screen.getByRole('link', 'Volver al seguimiento').tap();
  await expect(screen.getByRole('heading', 'Seguimiento del grupo.')).toBeVisible();
  await app.screenshot('admin-movil-inicio');
});

test('ADMIN-02: el nombre de usuario no concede permisos de administrador', async ({ app, screen, browser }) => {
  await courseFixture(browser, { profile: { username: 'jonathan', full_name: 'Jonathan Sanchez' } });
  await login(app, screen);
  await browser.goto('/#perfil');
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
  await expect(screen.getByRole('navigation', 'Administración')).toBeHidden();
  await expect(screen.getByRole('heading', 'Mi perfil de administrador')).toBeHidden();
});

test('ADMIN-03: todas las vistas caben desde 320px y los accesos son táctiles', async ({ app, screen, browser }) => {
  await courseFixture(browser, { instructor: true });
  await login(app, screen);
  for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
    await browser.setViewport({ width, height: 844 });
    for (const [link, heading] of [['Seguimiento', 'Seguimiento del grupo.'], ['Entregas y preguntas', 'Entregas y preguntas'], ['Participantes', 'Participantes'], ['Actividades', 'Tabla de actividades'], ['Mi perfil', 'Mi perfil de administrador']]) {
      await screen.getByRole('navigation', 'Administración').getByRole('link', link, { exact: true }).tap();
      await expect(screen.getByRole('heading', heading, { exact: true })).toBeVisible();
      const layout = await browser.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, links: [...document.querySelectorAll('.admin-nav a')].map(el => el.getBoundingClientRect().height >= 44) }));
      await expect(layout.document).toBe(width);
      await expect(layout.links.every(Boolean)).toBe(true);
    }
  }
  await browser.setViewport({ width: 390, height: 844 });
  await app.screenshot('perfil-admin-movil');
});

test('ADMIN-04: avance móvil muestra actividad, estado y abre el trabajo', async ({ app, screen, browser }) => {
  await browser.setViewport({ width: 390, height: 844 });
  await courseFixture(browser, { instructor: true });
  await login(app, screen);
  await screen.getByLabel('Filtrar por actividad').selectOption({ label: 'Tu agente de IA' });
  await screen.getByRole('checkbox', 'Solo quienes no entregaron').check();
  await expect(screen.getByTestId('activity-totals')).toContainText('entregaron 1 / faltan 1');
  await screen.getByRole('button', 'María Bosque, Tu agente de IA: Pendiente').tap();
  await expect(screen.getByRole('heading', 'María Bosque')).toBeVisible();
  await expect(screen.getByText('Este alumno aún no empieza la actividad.')).toBeVisible();
  await expect(screen.getByRole('navigation', 'Administración')).toBeVisible();
  await app.screenshot('trabajo-alumno-en-movil');
});
