import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

const title = 'Perfil turístico: Google Maps, TripAdvisor o Airbnb';
test('PROFILES-01: práctica al final del bloque, prompt, límites, cinco evidencias y entrega editable', async ({ app, screen, browser }) => {
  await browser.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { document.documentElement.dataset.copiedPrompt = text; } } }));
  const fixture = await courseFixture(browser); await login(app, screen);
  const block = screen.getByRole('region', 'Actividades del curso');
  await expect(block.getByRole('row').nth(5)).toContainText(title);
  await block.getByRole('row').filter({ hasText: title }).getByRole('link', 'Comenzar', { exact: true }).tap();
  await expect(screen.getByRole('heading', title, { exact: true })).toBeVisible();
  await expect(screen.getByText('Regla de oro: los datos de práctica nunca se publican.', { exact: true })).toBeVisible();
  await screen.getByRole('radio', 'Airbnb', { exact: true }).check();
  await screen.getByRole('radio', 'No tengo hospedaje: borrador de práctica, sin publicar', { exact: true }).check();
  await screen.getByText('Ver y copiar el prompt completo', { exact: true }).tap();
  await screen.getByRole('button', 'Copiar prompt', { exact: true }).tap();
  await expect(await browser.evaluate(() => document.documentElement.dataset.copiedPrompt)).toContain('No inventes servicios que no te di.');
  for (const [id, limit] of [['pi_google', 750], ['pi_airbnb_titulo', 50], ['pi_airbnb_descripcion', 500]] as const) {
    await screen.getByRole('radio', id === 'pi_google' ? 'Google Maps' : 'Airbnb', { exact: true }).check();
    const question = screen.getByTestId(`question-${id}`);
    await expect(question.getByRole('textbox')).toHaveAttribute('maxlength', String(limit));
    await question.getByRole('textbox').fill('a'.repeat(limit));
    await expect(question).toContainText(`${limit} / ${limit} caracteres`);
  }
  await screen.getByTestId('question-pi_resena5').getByRole('textbox').fill('Gracias por visitarnos.');
  await screen.getByTestId('question-pi_resena2').getByRole('textbox').fill('Gracias por tus comentarios. Revisaremos la información del camino.');
  for (const slot of ['pi_ficha', 'pi_maps_antes', 'pi_maps_despues', 'pi_airbnb_captura', 'pi_tripadvisor']) {
    if (slot.startsWith('pi_maps')) await screen.getByRole('radio', 'Google Maps', { exact: true }).check();
    if (slot === 'pi_airbnb_captura') await screen.getByRole('radio', 'Airbnb', { exact: true }).check();
    if (slot === 'pi_tripadvisor') await screen.getByRole('radio', 'TripAdvisor', { exact: true }).check();
    const question = screen.getByTestId(`question-${slot}`);
    await question.getByLabel(/Subir captura o foto/).setInputFiles(['tests/files/plan-de-negocio.pdf']);
    await expect(question.getByRole('status')).toContainText('Archivo guardado');
  }
  await screen.getByRole('radio', 'Airbnb', { exact: true }).check();
  for (const key of ['descripcion', 'palabras', 'limites', 'fotos', 'resenas', 'verdad']) {
    await screen.getByTestId(`question-pi_revision_${key}`).getByRole('radio', 'Sí', { exact: true }).check();
  }
  await screen.getByRole('button', 'Guardar avance', { exact: true }).tap();
  await expect(screen.getByText('Avance guardado en tu cuenta ✓')).toBeVisible();
  await browser.reload();
  await expect(screen.getByTestId('question-pi_airbnb_titulo').getByRole('textbox')).toHaveValue('a'.repeat(50));
  await expect(fixture.files).toHaveLength(5);
  await expect(fixture.works.get('tema4-perfiles').payload.answers.pi_google).toBe('a'.repeat(750));
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  await screen.getByRole('button', 'Entregar', { exact: true }).tap();
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
  await expect(fixture.responses[0].form_id).toBe('tema4-perfiles');
  await expect(fixture.responses[0].answers.pi_modalidad).toBe('No tengo hospedaje: borrador de práctica, sin publicar');
  await app.screenshot('perfiles-entrega');
  await screen.getByRole('link', 'Volver a mi curso', { exact: true }).tap();
  await block.getByRole('link', 'Editar entrega', { exact: true }).tap();
  await expect(screen.getByTestId('question-pi_resena5').getByRole('textbox')).toHaveValue('Gracias por visitarnos.');
});

test('PROFILES-02: el docente consulta textos, revisión del compañero y captura de Airbnb', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser, { instructor: true });
  const id = '70000000-0000-4000-8000-000000000040';
  fixture.responses.push({ id, student_id: '10000000-0000-4000-8000-000000000002', form_id: 'tema4-perfiles', full_name: 'Luis Turismo', submitted_at: new Date().toISOString(), answers: { pi_google: 'Cabañas de prueba en Pinal de Amoles.', pi_resena5: 'Gracias por la visita.', pi_resena2: 'Gracias por comentar.', pi_revision_verdad: 'Sí' }, questions: '¿Cómo reviso mi borrador?' });
  fixture.files.push({ id: '70000000-0000-4000-8000-000000000041', user_id: '10000000-0000-4000-8000-000000000002', form_id: 'tema4-perfiles', slot: 'pi_airbnb_captura', name: 'borrador-airbnb.pdf', mime: 'application/pdf', size: 9, data: btoa('pdf-bytes') });
  await login(app, screen);
  await screen.getByRole('navigation', 'Administración').getByRole('link', 'Panel docente', { exact: true }).tap();
  await screen.getByRole('row').filter({ hasText: title }).getByRole('button', 'Ver entrega ↗').tap();
  await expect(screen.getByText('Cabañas de prueba en Pinal de Amoles.', { exact: true })).toBeVisible();
  await expect(screen.getByText('Gracias por la visita.', { exact: true })).toBeVisible();
  await expect(screen.getByText('Los datos reales están revisados o la simulación está identificada y no publicada.', { exact: true })).toBeVisible();
  await expect(screen.getByRole('listitem').filter({ hasText: 'borrador-airbnb.pdf' })).toBeVisible();
});
