import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// Opt-in: reproduce en el Supabase real la apertura directa por hash y mide guardado y entrega.
const suffix = Date.now().toString(36);
const ids = (process.env.LIVE_ACTIVITIES ?? 'diagnostico,whatsapp,chatgpt,meta,agente-ia').split(',');

test('LIVE-HASH: cada actividad abierta directo por hash guarda y entrega a la primera', { timeout: 300000 }, async ({ app, screen, browser }) => {
  const timings: string[] = [];
  const failures: string[] = [];
  browser.on?.('console', () => {});
  await app.open('/#registro');
  await screen.getByLabel('Nombre completo', { exact: true }).fill('PRUEBA TÉCNICA · hash');
  await screen.getByLabel('Nombre de usuario', { exact: true }).fill(`prueba.hash.${suffix}`);
  await screen.getByLabel('PIN', { exact: true }).fill('258025');
  await screen.getByLabel('Repite tu PIN', { exact: true }).fill('258025');
  await screen.getByRole('checkbox', /Acepto que se guarden/).check();
  await screen.getByRole('button', 'Crear mi cuenta').tap();
  await expect(screen.getByRole('heading', 'Mis actividades')).toBeVisible();
  for (const [mode, index] of [['hash', 0], ['carga', 1]] as const) {
    for (const id of ids) {
      await browser.goto(mode === 'hash' ? `/#actividad/${id}` : `/?carga=${index}${id}#actividad/${id}`);
      await expect(screen.getByRole('button', 'Guardar avance')).toBeVisible();
      await screen.getByRole('textbox').first().fill(`PRUEBA TÉCNICA ${mode} ${id}`);
      let start = Date.now();
      await screen.getByRole('button', 'Guardar avance').tap();
      await expect(screen.getByText(/Avance guardado en tu cuenta ✓|No se pudo guardar/)).toBeVisible({ timeout: 70000 });
      const saved = await screen.getByText('Avance guardado en tu cuenta ✓').count();
      timings.push(`${mode} ${id} guardar ${Date.now() - start} ms ${saved ? 'OK' : 'FALLÓ'}`);
      if (!saved) failures.push(`${mode} ${id} guardar`);
      if (mode === 'carga' && id !== 'diagnostico') {
        await screen.getByRole('checkbox', /Autorizo que el equipo/).check();
        start = Date.now();
        await screen.getByRole('button', /^(Entregar|Guardar cambios de la entrega)/).tap();
        await expect(screen.getByText(/ENTREGA RECIBIDA|Tu entrega se actualizó|No se pudo|No pudimos/)).toBeVisible({ timeout: 70000 });
        const ok = await screen.getByText(/ENTREGA RECIBIDA|Tu entrega se actualizó/).count();
        timings.push(`${mode} ${id} entregar ${Date.now() - start} ms ${ok ? 'OK' : 'FALLÓ'}`);
        if (!ok) failures.push(`${mode} ${id} entregar`);
      }
    }
  }
  console.log(`Usuario: prueba.hash.${suffix}\n${timings.join('\n')}`);
  await expect(failures).toEqual([]);
});
