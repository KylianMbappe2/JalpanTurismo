import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { readFile } from 'node:fs/promises';
import { courseFixture, login } from './course-fixture.ts';

const userId = '10000000-0000-4000-8000-000000000002';
async function evidence(name, mime, index = 1, owner = userId, form = 'agente-ia') {
  const bytes = await readFile(`tests/files/${name}`);
  return { id: `30000000-0000-4000-8000-${String(index + 500).padStart(12, '0')}`, user_id: owner, form_id: form, name, mime, size: bytes.length, data: bytes.toString('base64'), slot: null };
}

test('VISTA-01: PDF de dos páginas se ve dentro de la tabla y no carga el motor al entrar', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser, { instructor: true });
  fixture.files.splice(0, fixture.files.length, await evidence('evidencia-dos-paginas.pdf', 'application/pdf'));
  await login(app, screen);
  await expect(screen.getByRole('table', 'Lista de cotejo de entregas')).toBeVisible();
  const initial = await browser.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  await expect(initial.some(name => name.includes('/vendor/file-preview/'))).toBe(false);
  await screen.getByRole('button', 'Ver archivos de Luis Turismo en Chatbot personalizado para WhatsApp', { exact: true }).tap();
  await screen.getByRole('dialog', 'Archivos de la actividad').getByRole('button', 'Ver archivo', { exact: true }).tap();
  const viewer = screen.getByRole('dialog', 'Vista previa del archivo', { exact: true });
  await expect(viewer.getByRole('status')).toHaveText('Página 1 de 2');
  await expect(viewer.getByRole('img', 'evidencia-dos-paginas.pdf, página 1 de 2')).toBeVisible();
  await viewer.getByRole('button', 'Página siguiente del archivo', { exact: true }).tap();
  await expect(viewer.getByRole('status')).toHaveText('Página 2 de 2');
  await app.screenshot('archivo-pdf-inline');
  await viewer.getByRole('button', 'Cerrar vista previa').tap();
  await expect(screen.getByRole('dialog', 'Archivos de la actividad')).toBeVisible();
  await expect(fixture.responses).toHaveLength(1);
});

test('VISTA-02: el alumno ve imagen y documentos guardados sin una entrega nueva', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  const ownId = '10000000-0000-4000-8000-000000000001';
  const examples = [
    ['flyer-prueba.png', 'image/png', 'Imagen lista', ''],
    ['documento-prueba.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Contenido listo', 'Mi negocio de práctica'],
    ['calendario-redes.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Contenido listo', 'Promoción real'],
    ['diapositivas-prueba.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'Contenido listo', 'Mi presentación del negocio'],
  ];
  for (const [index, item] of examples.entries()) fixture.files.push(await evidence(item[0], item[1], index + 10, ownId, 'whatsapp'));
  const before = JSON.stringify(fixture.files);
  await login(app, screen);
  const saved = screen.getByRole('region', 'Mis archivos guardados', { exact: true });
  for (const [name, , state, content] of examples) {
    await saved.getByRole('listitem').filter({ hasText: name }).getByRole('button', 'Ver archivo').tap();
    const viewer = screen.getByRole('dialog', 'Vista previa del archivo');
    await expect(viewer.getByRole('status')).toHaveText(state);
    if (content) await expect(viewer).toContainText(content);
    if (name.endsWith('.docx')) { await expect(viewer).toContainText('<img src=x onerror=alert(1)>'); await expect(viewer.getByRole('img', 'Imagen 1 del documento')).toBeVisible(); }
    await viewer.getByRole('button', 'Cerrar vista previa').tap();
  }
  await expect(fixture.works.size).toBe(0);
  await expect(fixture.responses).toHaveLength(0);
  await expect(JSON.stringify(fixture.files)).toBe(before);
});

test('VISTA-03: archivos antiguos se vinculan a flyer y calendario y la diagnóstica está acreditada', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser, { instructor: true });
  fixture.files.splice(0, fixture.files.length, await evidence('flyer-prueba.png', 'image/png', 30), await evidence('calendario-redes.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 31));
  const before = JSON.stringify(fixture.responses);
  await login(app, screen);
  const table = screen.getByRole('table', 'Lista de cotejo de entregas');
  await expect(table.getByRole('button', 'Luis Turismo, Evaluación diagnóstica: Acreditada por docente', { exact: true })).toContainText('✓');
  await expect(table.getByRole('button', 'María Bosque, Evaluación diagnóstica: Acreditada por docente', { exact: true })).toContainText('✓');
  await expect(table.getByRole('button', 'Luis Turismo, Flyers hechos con IA: Entregada', { exact: true })).toContainText('✓');
  await expect(table.getByRole('button', 'Luis Turismo, Calendario de contenido: Entregada', { exact: true })).toContainText('✓');
  const csv = await browser.waitForDownload(() => screen.getByRole('button', 'Exportar seguimiento', { exact: true }).tap());
  await expect(await readFile(csv.absolutePath, 'utf8')).toContain('Acreditada por docente');
  await expect(JSON.stringify(fixture.responses)).toBe(before);
});

test('VISTA-04: un alumno no puede previsualizar archivos de otra cuenta', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  const foreign = await evidence('flyer-prueba.png', 'image/png', 90);
  fixture.files.push(foreign);
  await login(app, screen);
  await expect(screen.getByRole('heading', '1 de 6 actividades cumplidas')).toBeVisible();
  await expect(screen.getByRole('region', 'Mis archivos guardados')).toHaveCount(0);
  await browser.evaluate(id => {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.previewFile = id; button.textContent = 'Prueba de acceso protegido'; document.querySelector('main').append(button);
  }, foreign.id);
  await screen.getByRole('button', 'Prueba de acceso protegido', { exact: true }).tap();
  const viewer = screen.getByRole('dialog', 'Vista previa del archivo');
  await expect(viewer.getByRole('status')).toContainText('No se pudo mostrar el archivo');
  await expect(viewer.getByRole('button', 'Descargar original')).toBeDisabled();
  await expect(viewer.getByRole('img')).toHaveCount(0);
});
