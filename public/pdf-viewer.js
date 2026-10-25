let library;
async function pdfLibrary() {
  library ??= import('/vendor/pdfjs/pdf.mjs').catch(error => { library = null; throw error; });
  const pdfjs = await library;
  pdfjs.GlobalWorkerOptions.workerSrc = `/vendor/pdfjs/pdf.worker.mjs?v=${pdfjs.version}`;
  return pdfjs;
}

export function mountPdfViewer(root, presentations) {
  const select = root.querySelector('select');
  const stage = root.querySelector('.pdf-stage');
  const status = root.querySelector('[role="status"]');
  const error = root.querySelector('[role="alert"]');
  const text = root.querySelector('.pdf-page-text');
  const previous = root.querySelector('[data-pdf="previous"]');
  const next = root.querySelector('[data-pdf="next"]');
  const zoomOut = root.querySelector('[data-pdf="out"]');
  const zoomIn = root.querySelector('[data-pdf="in"]');
  const fit = root.querySelector('[data-pdf="fit"]');
  let documentTask, pdf, rendering, page = 1, zoom = 1, loadId = 0, renderId = 0, disposed = false;
  let width = stage.clientWidth;
  let resizeFrame;

  function controls(busy) {
    previous.disabled = busy || !pdf || page <= 1;
    next.disabled = busy || !pdf || page >= pdf.numPages;
    zoomOut.disabled = busy || !pdf || zoom <= 0.75;
    zoomIn.disabled = busy || !pdf || zoom >= 3;
    fit.disabled = busy || !pdf;
    stage.setAttribute('aria-busy', String(busy));
  }

  function showError() {
    status.textContent = '';
    error.hidden = false;
    controls(true);
    stage.setAttribute('aria-busy', 'false');
  }

  async function renderPage() {
    const id = ++renderId;
    rendering?.cancel();
    controls(true);
    status.textContent = 'Cargando página…';
    try {
      const number = page;
      const sheet = await pdf.getPage(number);
      if (disposed || id !== renderId) return;
      const natural = sheet.getViewport({ scale: 1 });
      const viewport = sheet.getViewport({ scale: Math.max(1, stage.clientWidth - 24) / natural.width * zoom });
      const density = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(16000000 / (viewport.width * viewport.height)));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width * density));
      canvas.height = Math.max(1, Math.floor(viewport.height * density));
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `${presentations[Number(select.value)][1]}. Página ${number} de ${pdf.numPages}.`);
      canvas.setAttribute('aria-describedby', text.id);
      rendering = sheet.render({ canvasContext: canvas.getContext('2d'), viewport, transform: [density, 0, 0, density, 0, 0] });
      await rendering.promise;
      if (disposed || id !== renderId) return;
      stage.replaceChildren(canvas);
      stage.scrollTo(0, 0);
      status.textContent = `Página ${number} de ${pdf.numPages}`;
      controls(false);
      const content = await sheet.getTextContent();
      if (!disposed && id === renderId) text.textContent = content.items.map(item => item.str ?? '').join(' ');
    } catch (problem) {
      if (!disposed && id === renderId && problem.name !== 'RenderingCancelledException') showError();
    }
  }

  async function openPresentation() {
    const id = ++loadId;
    ++renderId;
    rendering?.cancel();
    void documentTask?.destroy().catch(() => {});
    pdf = null; page = 1; zoom = 1;
    stage.replaceChildren();
    text.textContent = '';
    error.hidden = true;
    controls(true);
    status.textContent = 'Cargando presentación…';
    const [file] = presentations[Number(select.value)];
    const url = `/materiales/${file}`;
    root.querySelectorAll('a').forEach(link => { link.href = url; });
    root.querySelector('[download]').download = file;
    try {
      const pdfjs = await pdfLibrary();
      if (disposed || id !== loadId) return;
      const task = pdfjs.getDocument({ url, cMapUrl: '/vendor/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: '/vendor/pdfjs/standard_fonts/', wasmUrl: '/vendor/pdfjs/wasm/', isEvalSupported: false, useWasm: false });
      documentTask = task;
      const document = await task.promise;
      if (disposed || id !== loadId) { await document.destroy(); return; }
      pdf = document;
      await renderPage();
    } catch {
      if (!disposed && id === loadId) showError();
    }
  }

  function onClick(event) {
    const action = event.target.closest('[data-pdf]')?.dataset.pdf;
    if (!action) return;
    if (action === 'retry') { void openPresentation(); return; }
    if (!pdf) return;
    if (action === 'previous') page = Math.max(1, page - 1);
    if (action === 'next') page = Math.min(pdf.numPages, page + 1);
    if (action === 'out') zoom = Math.max(0.75, zoom - 0.25);
    if (action === 'in') zoom = Math.min(3, zoom + 0.25);
    if (action === 'fit') zoom = 1;
    void renderPage();
  }

  const observer = new ResizeObserver(() => {
    if (Math.abs(stage.clientWidth - width) < 2) return;
    width = stage.clientWidth;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { if (pdf && !disposed) void renderPage(); });
  });
  observer.observe(stage);
  select.addEventListener('change', openPresentation);
  root.addEventListener('click', onClick);
  void openPresentation();
  return () => {
    disposed = true; ++loadId; ++renderId;
    cancelAnimationFrame(resizeFrame);
    observer.disconnect();
    select.removeEventListener('change', openPresentation);
    root.removeEventListener('click', onClick);
    rendering?.cancel();
    void documentTask?.destroy().catch(() => {});
    stage.querySelectorAll('canvas').forEach(canvas => { canvas.width = 0; canvas.height = 0; });
  };
}
