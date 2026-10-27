import { escapeHtml as e } from './course-data.js';

const duration = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export function videoLibraryMarkup(videos) {
  return `<section class="video-library" aria-labelledby="chatbot-videos-heading"><div class="classes-heading"><h2 id="chatbot-videos-heading" tabindex="-1">Videos para el chatbot</h2><p>Apoyo para la actividad 6 · WhatsApp Business. Elige un video para verlo aquí mismo.</p><a class="text-button" href="#actividad/agente-ia">Volver a la actividad del chatbot</a></div><div class="video-library-layout"><ol class="video-list">${videos.map((item, index) => `<li><button type="button" data-open-video="${e(item.id)}" aria-pressed="false" aria-label="Ver video ${index + 1}: ${e(item.title)}"><span class="video-number" aria-hidden="true">${index + 1}</span><span><strong>${e(item.title)}</strong><small>${e(item.description)}</small><span class="video-duration">${duration(item.seconds)} min</span></span><span aria-hidden="true">▶</span></button></li>`).join('')}</ol><div class="video-detail"><div class="video-stage"><p>Elige uno de los cuatro videos para comenzar.</p></div><h3 class="video-title" hidden></h3><p role="status" aria-label="Estado del video" class="inline-status"></p><a class="text-button video-download" hidden download>Descargar video</a></div></div></section>`;
}

export function mountVideoLibrary(root, videos) {
  const stage = root.querySelector('.video-stage');
  const title = root.querySelector('.video-title');
  const status = root.querySelector('[role="status"]');
  const download = root.querySelector('.video-download');
  let active;
  function stop() {
    if (!active) return;
    active.pause(); active.removeAttribute('src'); active.load(); active = null;
  }
  function onClick(event) {
    const button = event.target.closest('[data-open-video]');
    const item = videos.find(item => item.id === button?.dataset.openVideo);
    if (!item) return;
    stop();
    root.querySelectorAll('[data-open-video]').forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    title.textContent = item.title; title.hidden = false;
    download.href = item.src; download.hidden = false;
    status.textContent = 'Cargando video…';
    const video = document.createElement('video');
    video.controls = true; video.playsInline = true; video.preload = 'none';
    video.setAttribute('aria-label', item.title);
    video.textContent = 'Tu navegador no puede reproducir este video. Usa Descargar video.';
    video.addEventListener('loadeddata', () => { if (active === video) status.textContent = 'Video listo'; });
    video.addEventListener('error', () => { if (active === video) status.textContent = 'No se pudo reproducir el video. Vuelve a elegirlo para reintentar o descarga el archivo.'; });
    active = video; stage.replaceChildren(video); video.src = item.src;
    void video.play().catch(() => { if (active === video && !video.error) status.textContent = 'Pulsa reproducir para comenzar.'; });
    stage.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  root.addEventListener('click', onClick);
  return () => { stop(); root.removeEventListener('click', onClick); };
}
