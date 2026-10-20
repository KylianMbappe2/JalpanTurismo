import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

test('WEB-01: ten activities and privacy notice are available', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
  await expect(screen.getByRole('table').getByRole('row')).toHaveCount(11);
  await app.screenshot('tabla-de-actividades');
  await screen.getByRole('button', /Privacidad de tus datos/).tap();
  await expect(screen.getByRole('dialog')).toBeVisible();
  await screen.getByRole('button', 'Entendido').tap();
  await expect(screen.getByRole('dialog')).toBeHidden();
});
test('WEB-02: name and diagnostic answers are required, No is valid', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Evaluación diagnóstica' }).getByRole('link', 'Comenzar').tap();
  await screen.getByText('Tus datos', { exact: true }).tap();
  await screen.getByLabel(/Nombre completo/).fill('');
  await screen.getByRole('button', 'Entregar').tap();
  await expect(screen.getByText('Escribe tu nombre completo (de 2 a 120 caracteres).')).toBeVisible();
  await screen.getByLabel(/Nombre completo/).fill('Ana Sierra');
  await screen.getByRole('button', 'Entregar').tap();
  await expect(screen.getByText('Responde esta pregunta para continuar.')).toHaveCount(14);
  for (let i = 1; i <= 10; i++) await screen.getByTestId(`question-d${i}`).getByRole('radio', 'No').check();
  for (let i = 11; i <= 14; i++) await screen.getByTestId(`question-d${i}`).getByRole('textbox').fill('Quiero aprender a responder mejor a mis clientes.');
  await screen.getByRole('textbox', 'Tus preguntas para el instructor').fill('¿Cómo activo un agente de IA?');
  await expect(screen.getByTestId('question-d1').getByRole('radio', 'No')).toBeChecked();
  await expect(screen.getByRole('textbox', 'Tus preguntas para el instructor')).toHaveValue('¿Cómo activo un agente de IA?');
});
test('WEB-03: agent practice keeps optional answers and original choices', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  await expect(screen.getByTestId('question-a20')).toBeAttached();
  await screen.getByRole('checkbox', 'Transferencia', { exact: true }).check();
  await screen.getByRole('checkbox', 'Tarjeta', { exact: true }).check();
  await screen.getByRole('textbox', '¿A partir de cuántas personas debe pasarte un grupo? Opcional').fill('12');
  await expect(screen.getByRole('checkbox', 'Tarjeta', { exact: true })).toBeChecked();
  await expect(screen.getByRole('checkbox', 'Transferencia', { exact: true })).toBeChecked();
  await expect(screen.getByRole('textbox', '¿A partir de cuántas personas debe pasarte un grupo? Opcional')).toHaveValue('12');
});
test('WEB-04: consent, failed send, retry and confirmed receipt', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser, { failFirstSubmit: true }); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  await screen.getByTestId('question-a2').getByRole('textbox').fill('Mi negocio de prueba');
  await screen.getByRole('button', 'Entregar').tap();
  await expect(screen.getByText('Necesitamos tu autorización para guardar esta entrega.')).toBeVisible();
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  await screen.getByRole('button', 'Entregar').tap();
  await expect(screen.getByRole('alert')).toContainText('No pudimos completar la operación');
  await expect(screen.getByText('Mi negocio de prueba')).toBeVisible();
  await screen.getByRole('button', 'Entregar').tap();
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
  await expect(fixture.submitted).toHaveLength(1);
  await app.screenshot('entrega-confirmada-curso');
  await screen.getByRole('link', 'Volver a mi curso').tap();
  await expect(screen.getByRole('row').filter({ hasText: 'Tu agente de IA' })).toContainText('Entregada');
  await expect(screen.getByText('10% completado')).toBeVisible();
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Editar entrega').tap();
  await expect(screen.getByText('Ya entregaste; los cambios actualizan tu entrega')).toBeVisible();
  await expect(screen.getByTestId('question-a2').getByRole('textbox')).toHaveValue('Mi negocio de prueba');
  await expect(screen.getByRole('button', 'Guardar cambios de la entrega')).toBeVisible();
});
test('WEB-05: layouts fit 320, 768, 1024 and 1440px; unknown routes recover', async ({ app, screen, browser }) => {
  await courseFixture(browser); await app.open('/#actividad/no-existe');
  await expect(screen.getByRole('button', 'Entrar a mi curso')).toBeVisible();
  for (const width of [320, 768, 1024, 1440]) { await browser.setViewport({ width, height: 900 }); await expect(await browser.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth > window.innerWidth ? [...document.querySelectorAll('.course-layout,.course-body,.course-sidebar,.table-scroll,.course-table-section,.site-footer,.course-help-note,.course-help-note p,.learning-summary,.course-page-heading,.course-page-heading>div,.site-header,.header-inner')].map(el => ({ class: el.className, right: Math.round(el.getBoundingClientRect().right), width: Math.round(el.getBoundingClientRect().width), scroll: el.scrollWidth, overflow: getComputedStyle(el).overflowX, minWidth: getComputedStyle(el).minWidth })) : [] }))).toEqual({ viewport: width, document: width, overflow: [] }); }
  await login(app, screen, { open: false });
  for (const width of [320, 768, 1024, 1440]) { await browser.setViewport({ width, height: 900 }); await expect(await browser.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth > window.innerWidth ? [...document.querySelectorAll('.course-layout,.course-body,.course-sidebar,.table-scroll,.course-table-section,.site-footer,.course-help-note,.course-help-note p,.learning-summary,.course-page-heading,.course-page-heading>div,.site-header,.header-inner')].map(el => ({ class: el.className, right: Math.round(el.getBoundingClientRect().right), width: Math.round(el.getBoundingClientRect().width), scroll: el.scrollWidth, overflow: getComputedStyle(el).overflowX, minWidth: getComputedStyle(el).minWidth })) : [] }))).toEqual({ viewport: width, document: width, overflow: [] }); }
});
