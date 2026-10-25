import { escapeHtml as e } from './course-data.js';

export function classListMarkup(presentations) {
  return `<section class="class-library" aria-label="Clases del curso"><div data-class-index><div class="classes-heading"><h2>Clases del curso</h2><p>Elige una clase para ver sus diapositivas aquí mismo.</p></div><ol class="class-list">${presentations.map(item => `<li><button type="button" class="class-card" data-open-class="${item.id}" aria-label="Ver clase ${item.number}: ${e(item.title)}"><img class="class-cover" src="${item.assets}/cover.webp" width="480" height="${Math.round(480 * item.height / item.width)}" alt="" loading="${item.number === 1 ? 'eager' : 'lazy'}" decoding="async"><span class="class-info"><span class="class-number">Clase ${item.number}</span><strong>${e(item.title)}</strong><span class="class-description">${e(item.description)}</span><span class="class-meta">${e(item.topic.split(' · ')[0])} · ${item.pages} diapositivas</span></span><span class="class-action" aria-hidden="true">Ver clase <span>→</span></span></button></li>`).join('')}</ol></div><div class="class-detail" data-class-detail hidden></div></section>`;
}

function viewerMarkup(item) {
  const url = `/materiales/${item.file}`;
  return `<section aria-label="Visor de presentaciones"><button type="button" class="text-button class-back" data-class-back aria-label="Todas las clases"><span aria-hidden="true">←</span> Todas las clases</button><div class="class-view-heading"><p class="eyebrow">Clase ${item.number} · ${e(item.topic.split(' · ')[0])}</p><h2 tabindex="-1">${e(item.title)}</h2><p>${item.pages} diapositivas</p></div><div class="pdf-viewer"><div class="pdf-toolbar"><div class="pdf-controls"><button class="button secondary" type="button" data-slide="previous" aria-label="Página anterior" disabled>← Anterior</button><p role="status" aria-live="polite">Cargando página…</p><button class="button secondary" type="button" data-slide="next" aria-label="Página siguiente" disabled>Siguiente →</button></div><div class="pdf-controls"><button class="button secondary" type="button" data-slide="out" aria-label="Alejar" disabled>−</button><button class="button secondary" type="button" data-slide="fit" disabled>Ajustar al ancho</button><button class="button secondary" type="button" data-slide="in" aria-label="Acercar" disabled>+</button></div></div><div class="pdf-error" role="alert" hidden><p>No se pudo mostrar esta página. Puedes reintentar o abrir el PDF original.</p><button class="button secondary" type="button" data-slide="retry">Reintentar</button></div><div class="pdf-stage" tabindex="0" role="group" aria-label="Página de la presentación" aria-busy="true"></div><p id="slide-page-text" class="sr-only"></p><div class="pdf-links"><a href="${url}" target="_blank" rel="noopener">Abrir PDF <span aria-hidden="true">↗</span></a><a href="${url}" download>Descargar PDF</a></div></div></section>`;
}

export function mountClassLibrary(root, presentations) {
  const index = root.querySelector('[data-class-index]');
  const detail = root.querySelector('[data-class-detail]');
  let disposeViewer;
  let selected;
  function onClick(event) {
    const opener = event.target.closest('[data-open-class]');
    if (opener) {
      selected = opener;
      const item = presentations.find(item => item.id === opener.dataset.openClass);
      if (!item) return;
      disposeViewer?.();
      index.hidden = true;
      detail.hidden = false;
      detail.innerHTML = viewerMarkup(item);
      disposeViewer = mountSlides(detail, item);
      detail.querySelector('h2').focus({ preventScroll: true });
      detail.scrollIntoView({ block: 'start' });
    } else if (event.target.closest('[data-class-back]')) {
      disposeViewer?.();
      disposeViewer = null;
      detail.hidden = true;
      detail.replaceChildren();
      index.hidden = false;
      selected?.focus({ preventScroll: true });
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }
  root.addEventListener('click', onClick);
  return () => { disposeViewer?.(); root.removeEventListener('click', onClick); };
}

function mountSlides(root, item) {
  const stage = root.querySelector('.pdf-stage');
  const status = root.querySelector('[role="status"]');
  const error = root.querySelector('[role="alert"]');
  const text = root.querySelector('#slide-page-text');
  const control = action => root.querySelector(`[data-slide="${action}"]`);
  let page = 1, zoom = 1, generation = 0, disposed = false, busy = true, texts;
  const slideUrl = (number, suffix = '') => `${item.assets}/page-${String(number).padStart(3, '0')}${suffix}.webp`;
  if (item.hasText) fetch(`${item.assets}/text.json`).then(response => response.json()).then(value => {
    texts = value;
    if (!disposed) text.textContent = texts[page - 1] ?? '';
  }).catch(() => {});

  function controls(loading) {
    busy = loading;
    control('previous').disabled = loading || page === 1;
    control('next').disabled = loading || page === item.pages;
    control('in').disabled = loading || zoom >= 3;
    control('out').disabled = loading || zoom <= 0.75;
    control('fit').disabled = loading;
    stage.setAttribute('aria-busy', String(loading));
  }
  function fitImage(image = stage.querySelector('img')) {
    if (!image) return;
    const width = Math.max(1, stage.clientWidth - 24) * zoom;
    image.style.width = `${width}px`;
    image.style.height = 'auto';
    image.sizes = `${Math.ceil(width)}px`;
  }
  async function showPage(number) {
    const ticket = ++generation;
    page = number;
    controls(true);
    status.textContent = 'Cargando página…';
    error.hidden = true;
    try {
      const image = new Image();
      image.width = item.width; image.height = item.height;
      image.alt = `${item.title}. Página ${number} de ${item.pages}.`;
      image.decoding = 'async';
      image.setAttribute('aria-describedby', text.id);
      fitImage(image);
      image.srcset = `${slideUrl(number, '-960')} 960w, ${slideUrl(number)} 1920w`;
      image.src = slideUrl(number, '-960');
      await image.decode();
      if (disposed || ticket !== generation) return;
      stage.replaceChildren(image);
      stage.scrollTo(0, 0);
      text.textContent = texts?.[number - 1] ?? '';
      status.textContent = `Página ${number} de ${item.pages}`;
      controls(false);
      if (number < item.pages) { const upcoming = new Image(); upcoming.src = slideUrl(number + 1, '-960'); }
    } catch {
      if (disposed || ticket !== generation) return;
      status.textContent = '';
      error.hidden = false;
      stage.setAttribute('aria-busy', 'false');
    }
  }
  function onClick(event) {
    const action = event.target.closest('[data-slide]')?.dataset.slide;
    if (action === 'retry') { void showPage(page); return; }
    if (!action || busy) return;
    if (action === 'previous' && page > 1) { void showPage(page - 1); return; }
    if (action === 'next' && page < item.pages) { void showPage(page + 1); return; }
    if (action === 'in') zoom = Math.min(3, zoom + 0.25);
    if (action === 'out') zoom = Math.max(0.75, zoom - 0.25);
    if (action === 'fit') zoom = 1;
    fitImage(); controls(false);
  }
  const observer = new ResizeObserver(() => { if (!disposed) fitImage(); });
  observer.observe(stage);
  root.addEventListener('click', onClick);
  void showPage(1);
  return () => { disposed = true; ++generation; observer.disconnect(); root.removeEventListener('click', onClick); };
}
