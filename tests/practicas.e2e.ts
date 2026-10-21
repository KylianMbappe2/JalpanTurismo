import { test } from '@e2e-dev/web';
import { readFile } from 'node:fs/promises';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

test('PRAC-01: las cinco prácticas de Pinal aparecen con sus apartados para subir capturas', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  const practices = { '¿Cuándo vienen los turistas a Pinal?': ['t2', 't3'], 'Investiga a tu competencia con IA': ['k1', 'k3'], '¿Cuánto deberías cobrar?': ['r4', 'r8'], 'Tu estrategia para atraer clientes': ['e1'], 'Cierre · Mi estrategia turística con IA': ['z5'] };
  for (const [title, slots] of Object.entries(practices)) {
    await screen.getByRole('row').filter({ hasText: title }).getByRole('link', 'Comenzar').tap();
    await expect(screen.getByRole('heading', title, { exact: true }).first()).toBeVisible();
    for (const slot of slots) await expect(screen.getByTestId(`question-${slot}`).getByLabel(/Subir captura o foto/)).toHaveCount(1);
    await screen.getByRole('link', '← Volver a mi curso', { exact: true }).tap();
  }
  await screen.getByRole('row').filter({ hasText: '¿Cuándo vienen los turistas a Pinal?' }).getByRole('link', 'Continuar').tap();
  await expect(screen.getByRole('link', /Google Trends/)).toHaveAttribute('href', /trends\.google\.com\/trends\/explore.*Pinal%20de%20Amoles/);
  await expect(screen.getByRole('button', 'Copiar prompt')).toHaveCount(1);
});

test('PRAC-02: cada captura se sube a su apartado, se descarga, se quita y aparece en la revisión', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: '¿Cuánto deberías cobrar?' }).getByRole('link', 'Comenzar').tap();
  await expect(screen.getByText(/Precio = Costo ÷ \(1 − margen − comisión\)/)).toBeVisible();
  await screen.getByTestId('question-r1').getByRole('textbox').fill('Limpieza 150, luz 80, gas 70, insumos 200, ayuda 100: total 600');
  const slot = screen.getByTestId('question-r8');
  await slot.getByLabel(/Subir captura o foto/).setInputFiles(['tests/files/foto-grande.png']);
  await expect(slot.getByRole('status')).toContainText('Archivo guardado en tu cuenta ✓ foto-grande.jpg');
  await expect(fixture.files.at(-1).slot).toBe('r8');
  await expect(fixture.files.at(-1).mime).toBe('image/jpeg');
  await expect(slot.getByRole('listitem').filter({ hasText: 'foto-grande.jpg' })).toBeVisible();
  await expect(screen.getByTestId('question-r4').getByRole('listitem')).toHaveCount(0);
  await screen.getByTestId('question-r4').getByLabel(/Subir captura o foto/).setInputFiles(['tests/files/pagina.html']);
  await expect(screen.getByTestId('question-r4').getByRole('status')).toContainText('Tipo de archivo no permitido');
  await screen.getByTestId('question-r4').getByLabel(/Subir captura o foto/).setInputFiles(['tests/files/plan-de-negocio.pdf']);
  await expect(screen.getByTestId('question-r4').getByRole('status')).toContainText('plan-de-negocio.pdf');
  await expect(slot.getByLabel(/Agregar otra/)).toHaveCount(1);
  await screen.getByTestId('question-r4').scrollIntoView();
  await app.screenshot('practica-precios-capturas');
  await screen.getByRole('button', 'Quitar plan-de-negocio.pdf').tap();
  await expect(screen.getByTestId('question-r4').getByRole('listitem')).toHaveCount(0);
  await expect(fixture.files.filter(f => f.form_id === 'pinal-precios')).toHaveLength(1);
  await screen.getByRole('button', 'Guardar avance').tap();
  await expect(screen.getByText('Avance guardado en tu cuenta ✓')).toBeVisible();
  await browser.reload();
  await expect(screen.getByTestId('question-r8').getByRole('listitem').filter({ hasText: 'foto-grande.jpg' })).toBeVisible();
  await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
  await screen.getByRole('button', 'Entregar').tap();
  await expect(screen.getByText('ENTREGA RECIBIDA')).toBeVisible();
  await expect(fixture.responses.at(-1).form_id).toBe('pinal-precios');
  await expect(fixture.responses.at(-1).answers.r8).toBe(undefined);
});

test('GUIDE-01: la guía compara prompts, arma uno mejorado y el medidor marca sus ingredientes', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Guía para mejorar tus prompts' }).getByRole('link', 'Comenzar').tap();
  await expect(screen.getByText('Escribe un mensaje para mi negocio.')).toBeVisible();
  await screen.getByTestId('question-g1').getByRole('checkbox', 'El tono').check();
  await screen.getByTestId('question-g3').getByRole('textbox').fill('Soy dueña de Cabañas El Mirador en Pinal de Amoles');
  await screen.getByTestId('question-g4').getByRole('textbox').fill('Cabañas para 4 personas a $1,200 la noche');
  await screen.getByTestId('question-g5').getByRole('textbox').fill('Escribe 3 mensajes para invitar a familias al mar de nubes');
  await screen.getByTestId('question-g6').getByRole('radio', 'Amable y cercano').check();
  await screen.getByTestId('question-g7').getByRole('radio', 'Lista con viñetas').check();
  await expect(screen.getByRole('list', 'Ingredientes del prompt').first()).toContainText('0/5');
  await screen.getByRole('button', /Armar mi prompt/).tap();
  const built = screen.getByTestId('question-g8').getByRole('textbox');
  await expect(built).toHaveValue(/Soy dueña de Cabañas El Mirador.*Ofrezco: Cabañas para 4 personas.*Tu tarea: Escribe 3 mensajes.*tono amable y cercano.*Formato: Lista con viñetas/);
  await expect(screen.getByTestId('question-g8').getByRole('list', 'Ingredientes del prompt')).toContainText('5/5');
  await screen.getByTestId('question-g12').getByRole('textbox').fill('Escribe algo bonito');
  await expect(screen.getByTestId('question-g12').getByRole('list', 'Ingredientes del prompt')).toContainText('1/5');
  await screen.getByTestId('question-g9').getByLabel(/Subir captura o foto/).setInputFiles(['tests/files/foto-grande.png']);
  await expect(screen.getByTestId('question-g9').getByRole('status')).toContainText('Archivo guardado');
  await screen.getByRole('button', 'Guardar avance').tap();
  await expect(screen.getByText('Avance guardado en tu cuenta ✓')).toBeVisible();
  await expect(fixture.works.get('guia-prompts').payload.answers.g8).toContain('Cabañas El Mirador');
  await screen.getByTestId('question-g8').scrollIntoView();
  await app.screenshot('guia-prompt-armado');
});

test('AGENT-01: el agente de IA junta las respuestas en un prompt que se copia y se descarga', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Tu agente de IA' }).getByRole('link', 'Comenzar').tap();
  await screen.getByTestId('question-a1').getByRole('radio', 'Hospedaje (hotel, cabañas, posada)').check();
  await screen.getByTestId('question-a2').getByRole('textbox').fill('Cabañas El Mirador');
  await screen.getByTestId('question-a3').getByRole('textbox').fill('Pinal de Amoles, a 5 min de Cuatro Palos');
  await screen.getByTestId('question-a6').getByRole('textbox').fill('Cabaña para 4 personas: $1,200 la noche con desayuno');
  await screen.getByTestId('question-a9').getByRole('checkbox', 'Transferencia').check();
  await screen.getByTestId('question-a19').getByRole('checkbox', 'Grupo de más de ____ personas').check();
  await screen.getByLabel(/A partir de cuántas personas/).fill('10');
  await expect(screen.getByText(/Eres el asistente virtual de Cabañas El Mirador, hospedaje/)).toBeVisible();
  await expect(screen.getByText(/Grupo de más de 10 personas/)).toBeVisible();
  const file = await browser.waitForDownload(() => screen.getByRole('button', /Descargar \.txt/).tap());
  const text = await readFile(file.absolutePath, 'utf8');
  await expect(text).toContain('Cabaña para 4 personas: $1,200 la noche con desayuno');
  await expect(text).toContain('Formas de pago: Transferencia');
  await expect(text).toContain('Nunca inventes precios');
  await expect(screen.getByRole('link', 'Abrir ChatGPT ↗')).toHaveAttribute('href', 'https://chatgpt.com/');
  await screen.getByRole('heading', 'Tu prompt para el agente de IA').scrollIntoView();
  await app.screenshot('prompt-del-agente');
});

test('META-01: Meta pide captura del perfil, de las redes conectadas y de la publicación programada', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser); await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Meta Business Suite' }).getByRole('link', 'Comenzar').tap();
  await screen.getByText('Instrucciones', { exact: true }).tap();
  await expect(screen.getByText(/Play Store \(Android\) o App Store \(iPhone\)/)).toBeVisible();
  for (const [slot, label] of [['m7', 'perfil configurado'], ['m8', 'redes conectadas'], ['m10', 'publicación programada']]) {
    await expect(screen.getByTestId(`question-${slot}`)).toContainText(label);
    await screen.getByTestId(`question-${slot}`).getByLabel(/Subir captura o foto/).setInputFiles(['tests/files/plan-de-negocio.pdf']);
    await expect(screen.getByTestId(`question-${slot}`).getByRole('status')).toContainText('Archivo guardado');
  }
  await expect(fixture.files.filter(f => f.form_id === 'meta').map(f => f.slot)).toEqual(['m7', 'm8', 'm10']);
});

test('META-02: sin mensajes automáticos; un borrador viejo con esos datos se abre y guarda sin error', async ({ app, screen, browser }) => {
  const fixture = await courseFixture(browser);
  const old = { id: '50000000-0000-4000-8000-000000000001', form_id: 'meta', version: 1, participant: { name: 'Ana Sierra' }, answers: { m1: 'Messenger', m2: 'Hola, bienvenido', m3: 'Volvemos mañana', m4: true }, questions: '', consent: false };
  fixture.works.set('meta', { user_id: '10000000-0000-4000-8000-000000000001', form_id: 'meta', payload: old, step: 1, revision: 1, status: 'draft', saved_at: new Date().toISOString(), submitted_at: null, response_id: null });
  await login(app, screen);
  await screen.getByRole('row').filter({ hasText: 'Meta Business Suite' }).getByRole('link', 'Continuar').tap();
  await expect(screen.getByText(/mensaje de ausencia|saludo automático|Respuesta automática activa/i)).toHaveCount(0);
  await screen.getByTestId('question-m1').getByRole('radio', 'Facebook e Instagram').check();
  await screen.getByTestId('question-m9').getByRole('textbox').fill('Promoción del mar de nubes para el 15 de noviembre');
  await screen.getByRole('button', 'Guardar avance').tap();
  await expect(screen.getByText('Avance guardado en tu cuenta ✓')).toBeVisible();
  await expect(fixture.works.get('meta').payload.answers).toEqual({ m1: 'Facebook e Instagram', m9: 'Promoción del mar de nubes para el 15 de noviembre' });
});
