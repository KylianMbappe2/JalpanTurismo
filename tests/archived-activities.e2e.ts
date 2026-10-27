import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { readFile } from 'node:fs/promises';
import { courseFixture, login } from './course-fixture.ts';

test('ARCHIVO-01: el administrador identifica quién entregó tareas retiradas y abre su evidencia', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser, { instructor: true });
  const id = '20000000-0000-4000-8000-000000000091';
  fixture.responses.push({ id, student_id: '10000000-0000-4000-8000-000000000002', full_name: 'Luis Turismo', business: 'Cabañas del Bosque', email: '', form_id: 'whatsapp', submitted_at: '2026-10-20T12:00:00Z', questions: '¿Cómo actualizo mi saludo?', answers: { w1: 'Bienvenida anterior conservada' } });
  fixture.files.push({ id: '30000000-0000-4000-8000-000000000091', user_id: '10000000-0000-4000-8000-000000000002', form_id: 'whatsapp', name: 'captura-anterior.pdf', mime: 'application/pdf', size: 9, data: btoa('pdf-bytes') });
  const before = JSON.stringify(fixture.responses);
  await login(app, screen);
  await screen.getByRole('link', 'Ver tareas retiradas', { exact: true }).tap();
  await expect(screen.getByRole('heading', 'Entregas de tareas retiradas', { exact: true })).toBeVisible();
  await expect(screen.getByTestId('received-count')).toContainText('1 entrega');
  const row = screen.getByRole('table', 'Entregas de los participantes').getByRole('row').filter({ hasText: 'Luis Turismo' });
  await expect(row).toContainText('WhatsApp Business');
  await expect(row).toContainText('Tarea retirada');
  await expect(row).toContainText('Vinculada a: Chatbot personalizado');
  await browser.reload();
  await expect(screen.getByRole('heading', 'Entregas de tareas retiradas', { exact: true })).toBeVisible();
  await app.screenshot('administrador-tareas-retiradas');
  const csv = await browser.waitForDownload(() => screen.getByRole('button', 'Exportar esta lista', { exact: true }).tap());
  const content = await readFile(csv.absolutePath, 'utf8');
  await expect(content).toContain('Bienvenida anterior conservada');
  await expect(content).not.toContain('¿Cómo activo mi agente?');
  await row.getByRole('button', 'Ver entrega ↗').tap();
  await expect(screen.getByText('Bienvenida anterior conservada', { exact: true })).toBeVisible();
  const file = await browser.waitForDownload(() => screen.getByRole('listitem').filter({ hasText: 'captura-anterior.pdf' }).getByRole('button', 'Descargar').tap());
  await expect(await readFile(file.absolutePath, 'utf8')).toBe('pdf-bytes');
  await screen.getByRole('link', '← Volver a las entregas').tap();
  await expect(screen.getByRole('heading', 'Entregas de tareas retiradas', { exact: true })).toBeVisible();
  await screen.getByRole('link', 'Actividades del curso', { exact: true }).tap();
  await expect(screen.getByRole('row').filter({ hasText: 'WhatsApp Business' })).toBeVisible();
  await expect(screen.getByRole('row').filter({ hasText: 'Chatbot personalizado' })).toHaveCount(2);
  await expect(JSON.stringify(fixture.responses)).toBe(before);
});

test('ARCHIVO-02: una actividad principal ocultada queda en Extras solo para quien ya tiene entrega', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  Object.assign(fixture.activities.find(activity => activity.id === 'flyers-ia'), { is_published: false, editable: false, closed_reason: 'Trabajo anterior conservado.' });
  const payload = { id: '20000000-0000-4000-8000-000000000092', form_id: 'flyers-ia', version: 1, participant: { name: 'Ana Sierra' }, answers: { fi_prompt: 'Mi flyer entregado antes de retirar la tarea' }, consent: true, questions: '' };
  fixture.works.set('flyers-ia', { form_id: 'flyers-ia', status: 'submitted', payload, step: 1, revision: 2, response_id: payload.id, saved_at: new Date().toISOString() });
  const before = JSON.stringify(fixture.works.get('flyers-ia'));
  await login(app, screen);
  await expect(screen.getByRole('heading', '1 de 5 actividades cumplidas')).toBeVisible();
  await expect(screen.getByRole('region', 'Actividades del curso').getByRole('row').filter({ hasText: 'Flyers hechos con IA' })).toHaveCount(0);
  await screen.getByRole('region', 'Extras · Tus trabajos anteriores').getByRole('row').filter({ hasText: 'Flyers hechos con IA' }).getByRole('link', 'Ver entrega').tap();
  await expect(screen.getByTestId('question-fi_prompt').getByRole('textbox')).toHaveValue(payload.answers.fi_prompt);
  await expect(screen.getByTestId('question-fi_prompt').getByRole('textbox')).toBeDisabled();
  await browser.reload();
  await expect(screen.getByTestId('question-fi_prompt').getByRole('textbox')).toHaveValue(payload.answers.fi_prompt);
  await expect(JSON.stringify(fixture.works.get('flyers-ia'))).toBe(before);
});

test('ARCHIVO-03: quien no realizó una tarea retirada no recibe una actividad nueva en Extras', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await expect(screen.getByRole('heading', '1 de 6 actividades cumplidas')).toBeVisible();
  await expect(screen.getByRole('region', 'Extras · Tus trabajos anteriores')).toHaveCount(0);
  await expect(screen.getByRole('row').filter({ hasText: 'WhatsApp Business' })).toHaveCount(0);
});

test('ARCHIVO-04: paginar entregas anteriores conserva la vista de tareas retiradas', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser, { instructor: true });
  const base = fixture.responses[0];
  fixture.responses.splice(0, 1, ...Array.from({ length: 200 }, (_, index) => ({ ...base, id: `20000000-0000-4000-8000-${String(index + 100).padStart(12, '0')}`, full_name: `Participante ${index}` })), { ...base, id: '20000000-0000-4000-8000-000000000099', full_name: 'Entrega anterior', form_id: 'whatsapp', answers: { w1: 'Saludo conservado' } });
  await login(app, screen);
  await screen.getByRole('link', 'Ver tareas retiradas', { exact: true }).tap();
  await expect(screen.getByTestId('received-count')).toContainText('0 entregas');
  await screen.getByRole('button', 'Siguientes →', { exact: true }).tap();
  await expect(screen.getByRole('heading', 'Entregas de tareas retiradas', { exact: true })).toBeVisible();
  await expect(screen.getByTestId('received-count')).toContainText('1 entrega');
  await expect(screen.getByRole('row').filter({ hasText: 'Entrega anterior' })).toContainText('WhatsApp Business');
  await screen.getByRole('button', '← Anteriores', { exact: true }).tap();
  await expect(screen.getByRole('heading', 'Entregas de tareas retiradas', { exact: true })).toBeVisible();
  await expect(screen.getByTestId('received-count')).toContainText('0 entregas');
});
