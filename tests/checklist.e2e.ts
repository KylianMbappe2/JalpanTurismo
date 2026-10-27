import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

const oldPrompt = { id: '20000000-0000-4000-8000-000000000093', form_id: 'guia-prompts', version: 1, participant: { name: 'Luis Turismo' }, answers: { g8: 'Soy dueño de cabañas. Crea una tabla con mis promociones reales.' }, consent: true, questions: '' };

test('COTEJO-01: un recuadro por alumno, palomita visible y entrega anterior asignada', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser, { instructor: true });
  const user = fixture.roster[0];
  fixture.roster[0].work.push({ user_id: user.user_id, form_id: 'guia-prompts', payload: oldPrompt, status: 'submitted', revision: 2, step: 1, response_id: oldPrompt.id, submitted_at: new Date().toISOString() });
  fixture.responses.push({ id: oldPrompt.id, student_id: user.user_id, form_id: 'guia-prompts', full_name: 'Luis Turismo', answers: oldPrompt.answers, questions: '', submitted_at: new Date().toISOString() });
  const before = JSON.stringify(fixture.roster);
  await login(app, screen);
  const card = screen.getByRole('article', 'Entregas de Luis Turismo', { exact: true });
  await expect(card.getByRole('heading', 'Luis Turismo', { exact: true })).toBeVisible();
  const delivery = card.getByRole('button', 'Luis Turismo, Crea el prompt conjunto: Entregada', { exact: true });
  await expect(delivery).toContainText('✓');
  await expect(delivery).toContainText('Entrega anterior reconocida');
  await expect(card).toContainText('Guía para mejorar tus prompts');
  await expect(card.getByRole('button')).toHaveCount(6);
  await delivery.scrollIntoView();
  await app.screenshot('lista-cotejo-entregas');
  await delivery.tap();
  await expect(screen.getByText(oldPrompt.answers.g8, { exact: true })).toBeVisible();
  await expect(JSON.stringify(fixture.roster)).toBe(before);
});

test('COTEJO-02: el alumno recibe crédito por su prompt anterior sin duplicar su entrega', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  fixture.works.set('guia-prompts', { form_id: 'guia-prompts', status: 'submitted', payload: { ...oldPrompt, participant: { name: 'Ana Sierra' } }, step: 1, revision: 2, response_id: oldPrompt.id, submitted_at: new Date().toISOString() });
  const before = JSON.stringify([...fixture.works.values()]);
  await login(app, screen);
  await expect(screen.getByRole('heading', '1 de 6 actividades entregadas')).toBeVisible();
  const row = screen.getByRole('region', 'Actividades del curso').getByRole('row').filter({ hasText: 'Crea el prompt conjunto' });
  await expect(row).toContainText('Entregada');
  await row.getByRole('link', 'Ver entrega anterior', { exact: true }).tap();
  await expect(screen.getByTestId('question-g8').getByRole('textbox')).toHaveValue(oldPrompt.answers.g8);
  await expect(screen.getByTestId('question-g8').getByRole('textbox')).toBeDisabled();
  await expect(JSON.stringify([...fixture.works.values()])).toBe(before);
  await expect(fixture.responses).toHaveLength(0);
});

test('COTEJO-03: perfiles turísticos acepta simulación parcial sin negocio ni publicación', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Perfil turístico:' }).getByRole('link', 'Comenzar').tap();
  await expect(screen.getByText('Se acepta avance parcial, ficha o simulación.', { exact: true })).toBeVisible();
  await screen.getByRole('radio', 'TripAdvisor', { exact: true }).check();
  await screen.getByTestId('question-pi_pendientes').getByRole('textbox').fill('Simulación: no publicada. No tengo negocio; preparé un ejemplo de descripción.');
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  await screen.getByRole('button', 'Entregar', { exact: true }).tap();
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
  await expect(fixture.responses[0].answers.pi_pendientes).toContain('Simulación: no publicada');
  await expect(fixture.files).toHaveLength(0);
});
