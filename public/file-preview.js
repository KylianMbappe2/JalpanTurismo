import { base64ToBlob } from './course-data.js';
import { previewAssets } from './preview-assets.js';

let current;
export const closeFilePreview = () => current?.close();
let pdfModule;
const decode = data => Uint8Array.from(atob(data), char => char.charCodeAt(0));

export async function openFilePreview(load) {
  current?.close();
  const dialog = document.createElement('dialog'); dialog.className = 'file-preview-dialog';
  dialog.setAttribute('aria-labelledby', 'file-preview-title');
  dialog.innerHTML = '<header class="file-preview-heading"><h2 id="file-preview-title">Vista previa del archivo</h2><button type="button" class="button secondary" data-preview-close>Cerrar vista previa</button></header><p class="file-preview-name"></p><p class="file-preview-status" role="status">Cargando archivo…</p><div class="file-preview-tools" hidden></div><div class="file-preview-body"></div><footer><button type="button" class="button secondary" data-preview-download disabled>Descargar original</button></footer>';
  document.body.append(dialog); current = dialog;
  const body = dialog.querySelector('.file-preview-body'); const status = dialog.querySelector('[role="status"]'); const tools = dialog.querySelector('.file-preview-tools');
  let disposed = false, pdfTask, pdf, renderTask, file;
  dialog.querySelector('[data-preview-close]').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    disposed = true; renderTask?.cancel(); pdfTask?.destroy().catch(() => {});
    dialog.remove(); if (current === dialog) current = null;
  }, { once: true });
  dialog.querySelector('[data-preview-download]').onclick = () => {
    const url = URL.createObjectURL(base64ToBlob(file.data, file.mime)); const link = document.createElement('a');
    link.href = url; link.download = file.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  dialog.showModal();
  try {
    file = await load(); if (disposed) return;
    if (typeof file.data !== 'string' || file.data.length > 7100000) throw new Error('No pudimos leer este archivo.');
    dialog.querySelector('.file-preview-name').textContent = file.name;
    dialog.querySelector('[data-preview-download]').disabled = false;
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mime)) {
      const image = new Image(); image.alt = file.name; image.src = `data:${file.mime};base64,${file.data}`;
      await image.decode(); if (disposed) return;
      body.append(image); status.textContent = 'Imagen lista'; return;
    }
    const bytes = decode(file.data);
    if (file.mime === 'application/pdf') {
      pdfModule ??= import(previewAssets.pdf).catch(error => { pdfModule = null; throw error; });
      const library = await pdfModule; if (disposed) return;
      library.GlobalWorkerOptions.workerSrc = previewAssets.worker;
      pdfTask = library.getDocument({ data: bytes, isEvalSupported: false, disableFontFace: true, useSystemFonts: true, useWasm: false, maxImageSize: 16000000 });
      pdf = await pdfTask.promise; if (disposed) return;
      let page = 1, zoom = 1, busy = false;
      tools.hidden = false;
      tools.innerHTML = '<button type="button" class="button secondary" data-pdf-prev aria-label="Página anterior del archivo">←</button><button type="button" class="button secondary" data-pdf-next aria-label="Página siguiente del archivo">→</button><button type="button" class="button secondary" data-pdf-out aria-label="Alejar archivo">−</button><button type="button" class="button secondary" data-pdf-in aria-label="Acercar archivo">+</button>';
      const render = async () => {
        if (busy || disposed) return; busy = true; tools.querySelectorAll('button').forEach(button => { button.disabled = true; });
        try {
          status.textContent = `Cargando página ${page}…`;
          const content = await pdf.getPage(page); if (disposed) return;
          const natural = content.getViewport({ scale: 1 });
          const pixelRatio = Math.min(devicePixelRatio || 1, 2);
          const desired = Math.max(240, body.clientWidth - 32) / natural.width * zoom;
          const scale = Math.min(desired, 3200 / natural.width, 6000 / natural.height, Math.sqrt(8000000 / (natural.width * natural.height * pixelRatio * pixelRatio)));
          const viewport = content.getViewport({ scale }); const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width * pixelRatio); canvas.height = Math.ceil(viewport.height * pixelRatio);
          canvas.style.width = `${Math.round(viewport.width)}px`; canvas.style.height = `${Math.round(viewport.height)}px`;
          canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', `${file.name}, página ${page} de ${pdf.numPages}`);
          renderTask = content.render({ canvasContext: canvas.getContext('2d'), viewport, transform: pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : undefined });
          await renderTask.promise; if (disposed) return;
          body.replaceChildren(canvas); status.textContent = `Página ${page} de ${pdf.numPages}`;
        } catch (error) { if (!disposed) status.textContent = 'No se pudo mostrar esta página. Puedes descargar el original.'; }
        finally {
          busy = false;
          if (!disposed) {
            tools.querySelector('[data-pdf-prev]').disabled = page <= 1; tools.querySelector('[data-pdf-next]').disabled = page >= pdf.numPages;
            tools.querySelector('[data-pdf-out]').disabled = zoom <= 0.75; tools.querySelector('[data-pdf-in]').disabled = zoom >= 2;
          }
        }
      };
      tools.querySelector('[data-pdf-prev]').onclick = () => { page--; render(); }; tools.querySelector('[data-pdf-next]').onclick = () => { page++; render(); };
      tools.querySelector('[data-pdf-out]').onclick = () => { zoom -= 0.25; render(); }; tools.querySelector('[data-pdf-in]').onclick = () => { zoom += 0.25; render(); };
      await render(); return;
    }
    if (/\.(docx|xlsx|pptx)$/i.test(file.name)) {
      const officeUrl = new URL('./office-preview.js', import.meta.url); officeUrl.search = new URL(import.meta.url).search;
      const { renderOffice } = await import(officeUrl.href); if (disposed) return;
      await renderOffice(bytes, file.name, body); if (!disposed) status.textContent = 'Contenido listo'; return;
    }
    if (file.mime === 'text/plain') {
      const pre = document.createElement('pre'); pre.className = 'preview-text'; pre.textContent = new TextDecoder().decode(bytes).slice(0, 400000);
      body.append(pre); status.textContent = 'Vista de texto · hasta 400 000 caracteres'; return;
    }
    status.textContent = 'Este formato se puede descargar para abrirlo en su aplicación.';
  } catch (error) {
    if (!disposed) status.textContent = 'No se pudo mostrar el archivo. Usa Descargar original o vuelve a intentarlo.';
  }
}
