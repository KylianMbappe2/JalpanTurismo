import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

for (const [title, id, answer, slot] of [
  ['Crea el prompt conjunto', 'prompt-conjunto', 'pc_revision', 'pc_resultado'],
  ['Calendario de contenido', 'calendario-contenido', 'cc_calendario', 'cc_archivo'],
  ['Flyers hechos con IA', 'flyers-ia', 'fi_prompt', 'fi_flyer'],
] as const) {
  test(`CURSO-01-${id}: guarda evidencia, recarga y entrega sin duplicar el trabajo`, async ({ app, screen, browser }) => {
    const fixture = await courseFixture(browser); await login(app, screen);
    await screen.getByRole('row').filter({ hasText: title }).getByRole('link', 'Comenzar').tap();
    await screen.getByTestId(`question-${answer}`).getByRole('textbox').fill('Trabajo revisado con datos reales de mi negocio.');
    await screen.getByTestId(`question-${slot}`).getByLabel(/Subir captura o foto/).setInputFiles(['tests/files/plan-de-negocio.pdf']);
    await expect(screen.getByTestId(`question-${slot}`).getByRole('status')).toContainText('Archivo guardado');
    await screen.getByRole('button', 'Guardar avance', { exact: true }).tap();
    await expect(screen.getByText('Avance guardado en tu cuenta ✓')).toBeVisible();
    const folio = fixture.works.get(id).payload.id;
    await browser.reload();
    await expect(screen.getByTestId(`question-${answer}`).getByRole('textbox')).toHaveValue('Trabajo revisado con datos reales de mi negocio.');
    await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
    await screen.getByRole('button', 'Entregar', { exact: true }).tap();
    await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
    await expect(fixture.responses).toHaveLength(1);
    await expect(fixture.responses[0].id).toBe(folio);
    await expect(fixture.files).toHaveLength(1);
    await screen.getByRole('link', 'Volver a mi curso', { exact: true }).tap();
    await expect(screen.getByRole('heading', '1 de 6 actividades entregadas')).toBeVisible();
  });
}

test('CURSO-02: conserva entregas retiradas y borradores extra con su folio y archivo', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  const now = new Date().toISOString();
  for (const [id, status, answers] of [['whatsapp', 'submitted', { w1: 'Bienvenida original' }], ['meta', 'draft', { m9: 'Publicación anterior' }]] as const) {
    const folio = `20000000-0000-4000-8000-0000000000${id === 'meta' ? '71' : '72'}`;
    fixture.works.set(id, { form_id: id, status, payload: { id: folio, form_id: id, version: 1, participant: { name: 'Ana Sierra' }, answers, consent: true, questions: '' }, step: 1, revision: 4, saved_at: now, response_id: status === 'submitted' ? folio : null, submitted_at: status === 'submitted' ? now : null });
  }
  fixture.files.push({ id: '30000000-0000-4000-8000-000000000071', user_id: '10000000-0000-4000-8000-000000000001', form_id: 'whatsapp', name: 'evidencia-anterior.pdf', mime: 'application/pdf', size: 9, created_at: now, data: btoa('pdf-bytes') });
  const before = JSON.stringify([...fixture.works.values()]);
  await login(app, screen);
  await expect(screen.getByRole('heading', '0 de 6 actividades entregadas')).toBeVisible();
  const extras = screen.getByRole('region', 'Extras · Tus trabajos anteriores');
  await expect(extras.getByRole('row')).toHaveCount(3);
  await expect(extras).toContainText('WhatsApp Business');
  await expect(extras).toContainText('Meta Business Suite');
  await extras.getByRole('row').filter({ hasText: 'WhatsApp Business' }).getByRole('link', 'Ver entrega').tap();
  await expect(screen.getByTestId('question-w1').getByRole('textbox')).toHaveValue('Bienvenida original');
  await expect(screen.getByTestId('question-w1').getByRole('textbox')).toBeDisabled();
  await expect(screen.getByText('evidencia-anterior.pdf', { exact: true })).toBeVisible();
  await expect(JSON.stringify([...fixture.works.values()])).toBe(before);
  await app.screenshot('extras-conservados');
});

test('CURSO-03: basta un perfil de TripAdvisor y se conserva la selección al recargar', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Perfil turístico:' }).getByRole('link', 'Comenzar').tap();
  await screen.getByRole('radio', 'TripAdvisor', { exact: true }).check();
  await expect(screen.getByTestId('question-pi_google')).toBeHidden();
  await expect(screen.getByTestId('question-pi_airbnb_titulo')).toBeHidden();
  await screen.getByTestId('question-pi_tripadvisor').getByLabel(/Subir captura o foto/).setInputFiles(['tests/files/plan-de-negocio.pdf']);
  await expect(screen.getByTestId('question-pi_tripadvisor').getByRole('status')).toContainText('Archivo guardado');
  await screen.getByRole('button', 'Guardar avance', { exact: true }).tap();
  await expect(screen.getByText('Avance guardado en tu cuenta ✓')).toBeVisible();
  await browser.reload();
  await expect(screen.getByRole('radio', 'TripAdvisor', { exact: true })).toBeChecked();
  await expect(screen.getByTestId('question-pi_airbnb_titulo')).toBeHidden();
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  await screen.getByRole('button', 'Entregar', { exact: true }).tap();
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
  await expect(fixture.responses[0].answers.pi_plataforma).toBe('TripAdvisor');
  await expect(fixture.files).toHaveLength(1);
});

test('CURSO-04: el chatbot conserva el cuestionario y agrega configuración y prueba', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Chatbot personalizado para WhatsApp' }).getByRole('link', 'Comenzar').tap();
  await screen.getByTestId('question-a2').getByRole('textbox').fill('Cabañas Sierra');
  await expect(browser.locator('#agent-prompt')).toContainText('Cabañas Sierra');
  await screen.getByRole('radio', 'WhatsApp: chatbot configurado', { exact: true }).check();
  await screen.getByTestId('question-a22').getByRole('textbox').fill('Contestó precios y ubicación; pasó la reservación a una persona.');
  await screen.getByTestId('question-a24').getByLabel(/Subir captura o foto/).setInputFiles(['tests/files/plan-de-negocio.pdf']);
  await expect(screen.getByTestId('question-a24').getByRole('status')).toContainText('Archivo guardado');
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  await screen.getByRole('button', 'Entregar', { exact: true }).tap();
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
  await expect(fixture.responses[0].answers.a2).toBe('Cabañas Sierra');
  await expect(fixture.responses[0].answers.a21).toBe('WhatsApp: chatbot configurado');
  await expect(fixture.files[0].slot).toBe('a24');
});
