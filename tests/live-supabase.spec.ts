import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// Opt-in explícito: crea un usuario de prueba y una entrega marcada en el Supabase configurado.
const suffix = Date.now().toString(36);
const username = `prueba.tecnica.${suffix}`;
const pin = String(Math.floor(100000 + Math.random() * 900000));
const longAnswer = 'PRUEBA TÉCNICA · conexión con 3000 caracteres. '.padEnd(3000, 'A');

test('LIVE-01: usuario y PIN, borrador, archivo y entrega en el Supabase real', async ({ app, screen, browser }) => {
  await app.open('/#registro');
  await screen.getByLabel('Nombre completo', { exact: true }).fill('PRUEBA TÉCNICA · conexión');
  await screen.getByLabel('Nombre de usuario', { exact: true }).fill(username);
  await screen.getByLabel('PIN', { exact: true }).fill(pin);
  await screen.getByLabel('Repite tu PIN', { exact: true }).fill(pin);
  await screen.getByRole('checkbox', /Acepto que se guarden/).check();
  await screen.getByRole('button', 'Crear mi cuenta').tap();
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  await screen.getByText('Tus datos', { exact: true }).tap();
  await screen.getByLabel(/Nombre de tu negocio/).fill('Registro de verificación de Aula Sierra');
  await screen.getByTestId('question-a2').getByRole('textbox').fill(longAnswer);
  await screen.getByLabel(/Agregar archivo/).setInputFiles(['tests/files/plan-de-negocio.pdf']);
  await expect(screen.getByRole('status').filter({ hasText: 'Archivo guardado' })).toContainText('plan-de-negocio.pdf');
  await screen.getByRole('button', 'Guardar avance').tap();
  await expect(screen.getByText('Avance guardado en tu cuenta ✓')).toBeVisible();
  await browser.reload();
  await expect(screen.getByTestId('question-a2').getByRole('textbox')).toHaveValue(longAnswer);
  await screen.getByRole('link', '← Volver a mi curso', { exact: true }).tap();
  await screen.getByRole('button', 'Salir', { exact: true }).tap();
  await screen.getByLabel('Nombre de usuario', { exact: true }).fill(username.toUpperCase());
  await screen.getByLabel('PIN', { exact: true }).fill(pin);
  await screen.getByRole('button', 'Entrar a mi curso').tap();
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Continuar').tap();
  await expect(screen.getByRole('listitem').filter({ hasText: 'plan-de-negocio.pdf' })).toBeVisible();
  await screen.getByRole('textbox', 'Tus preguntas para el instructor').fill('Entrega técnica para comprobar el guardado desde la web. Puedes eliminar este registro.');
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  await screen.getByRole('button', 'Entregar').tap();
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
  await screen.getByRole('link', /Volver a mi curso/).tap();
  await expect(screen.getByRole('row').filter({ hasText: 'Tu agente de IA' })).toContainText('Entregada');
  const timings = await browser.evaluate(() => performance.getEntriesByType('resource').filter(entry => entry.name.includes('/rest/v1/rpc/')).map(entry => ({ rpc: entry.name.split('/').pop(), ms: Math.round(entry.duration) })));
  console.log(`LIVE-01 tiempos RPC ${JSON.stringify(timings)}`);
  await app.screenshot('supabase-real-entregada');
  console.log(`Usuario de prueba creado: ${username}`);
});

test('LIVE-02: la entrega de prueba se puede corregir en el Supabase real', async ({ app, screen }) => {
  await app.open('/#login');
  await screen.getByLabel('Nombre de usuario', { exact: true }).fill(username);
  await screen.getByLabel('PIN', { exact: true }).fill(pin);
  await screen.getByRole('button', 'Entrar a mi curso').tap();
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Editar entrega').tap();
  await expect(screen.getByText('Ya entregaste; los cambios actualizan tu entrega')).toBeVisible();
  await screen.getByTestId('question-a2').getByRole('textbox').fill('PRUEBA TÉCNICA · entrega corregida');
  await screen.getByRole('button', 'Guardar cambios de la entrega').tap();
  await expect(screen.getByRole('status').filter({ hasText: 'Tu entrega se actualizó.' })).toBeVisible();
  await app.screenshot('supabase-real-corregida');
});
