import { forms, extraFields, getQuestions } from './forms.js';
import { validateSubmission, isConfigured } from './submission.js';
import { createCourse } from './course.js';
import { fileLimits, fileAccept, fileType, formatSize, activityOpen, closedReason } from './course-data.js';

const main = document.querySelector('main');
const dialog = document.querySelector('#info-dialog');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paths = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
  message: '<path d="M21 11a9 9 0 0 1-13 8l-5 2 1.5-5A9 9 0 1 1 21 11Z"/><path d="M8 10h8m-8 4h5"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
  bot: '<rect x="3" y="6" width="18" height="15" rx="4"/><path d="M12 2v4M8 11v3m8-3v3m-8 3h8"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.spark}</svg>`;
let config = {};
try { const response = await fetch('/config.json', { cache: 'no-store' }); if (response.ok) config = await response.json(); } catch { /* The unavailable state remains explicit at submission. */ }
const emptyState = () => ({ form: null, step: 1, participant: { name: '', email: '', phone: '', business: '', municipality: '' }, answers: {}, questions: '', consent: false, id: '', receipt: null, busy: false, errors: {}, revision: 0, dirty: false, savePromise: null, savedAt: null, saveError: '', submitted: false, locked: false, lockReason: '' });
let state = emptyState();
let saveTimer;
let routeGeneration = 0;
const course = createCourse({ config, main, icon, navigate, beforeSignOut: async () => { if (state.form && !state.locked && (state.dirty || state.savePromise)) await saveDraft(); state = emptyState(); clearTimeout(saveTimer); } });

function navigate(hash) { if (location.hash === hash) route(); else location.hash = hash; }

function saveStatus(message, error = false) {
  const status = document.querySelector('#draft-status');
  if (status) { status.textContent = message; status.classList.toggle('save-warning', error); }
}

function scheduleSave() {
  if (!state.form || state.locked) return;
  state.dirty = true;
  state.saveError = '';
  saveStatus('Cambios pendientes de guardar');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveDraft().catch(() => {}), 900);
}

async function saveDraft() {
  clearTimeout(saveTimer);
  if (!state.form || state.locked || !course.user) return;
  const current = state;
  if (current.savePromise) { await current.savePromise; if (current.dirty) return saveDraft(); return; }
  if (!current.dirty && current.revision > 0) return;
  const snapshot = structuredClone(payload());
  const step = current.step;
  current.dirty = false;
  saveStatus('Guardando tu avance…');
  current.savePromise = (async () => {
    try {
      const work = await course.save(snapshot, step, current.revision);
      current.revision = work.revision;
      current.savedAt = work.saved_at;
      current.saveError = '';
      if (state === current) saveStatus(current.dirty ? 'Cambios pendientes de guardar' : 'Avance guardado en tu cuenta ✓');
    } catch (error) {
      current.dirty = true;
      current.saveError = error.message;
      if (state === current) saveStatus(`No se pudo guardar. ${error.message}`, true);
      throw error;
    } finally { current.savePromise = null; }
  })();
  return current.savePromise;
}

function payload() {
  return { id: state.id, form_id: state.form.id, version: state.form.version, participant: state.participant, answers: state.answers, questions: state.questions, consent: state.consent };
}

function field(key, label, { type = 'text', placeholder = '', required = false, autocomplete = '' } = {}) {
  return `<div class="field"><label for="${key}">${label}${required ? ' <span aria-hidden="true">*</span>' : ' <span class="optional">Opcional</span>'}</label><input id="${key}" name="${key}" type="${type}" value="${escape(state.participant[key])}" placeholder="${placeholder}" ${required ? 'required' : ''} ${autocomplete ? `autocomplete="${autocomplete}"` : ''} maxlength="${({ name: 120, email: 254, phone: 30, business: 160, municipality: 120 })[key]}" ${state.errors[key] ? 'aria-invalid="true"' : ''} aria-describedby="error-${key}"><span id="error-${key}" class="field-error">${escape(state.errors[key] ?? '')}</span></div>`;
}

function question(q) {
  const value = state.answers[q.id];
  const error = state.errors[q.id];
  const caption = `${q.number ? `<span class="question-number">${q.number}.</span> ` : ''}${escape(q.label)}${q.required ? ' <span class="required-marker" aria-hidden="true">*</span>' : ''}`;
  let body;
  if (q.type === 'text') {
    body = `<label for="${q.id}" class="question-label">${caption}</label>${q.hint ? `<p class="field-hint" id="hint-${q.id}">${escape(q.hint)}</p>` : ''}<textarea id="${q.id}" name="${q.id}" rows="3" maxlength="4000" placeholder="Escribe tu respuesta aquí…" ${q.required ? 'required' : ''} ${error ? 'aria-invalid="true"' : ''} aria-describedby="error-${q.id}${q.hint ? ` hint-${q.id}` : ''}">${escape(value)}</textarea>`;
  } else if (q.type === 'check') {
    body = `<label class="check-line"><input type="checkbox" name="${q.id}" ${value ? 'checked' : ''}><span>${escape(q.label)}</span></label>`;
  } else {
    body = `<fieldset><legend class="question-label">${caption}</legend><div class="choices ${q.options.length === 2 ? 'binary' : ''}">${q.options.map((option, i) => `<label class="choice"><input type="${q.type === 'multi' ? 'checkbox' : 'radio'}" name="${q.id}" value="${escape(option)}" ${(Array.isArray(value) ? value.includes(option) : value === option) ? 'checked' : ''}><span>${escape(option)}</span></label>`).join('')}</div></fieldset>`;
  }
  const extra = extraFields[q.id];
  return `<div class="question ${error ? 'has-error' : ''}" id="question-${q.id}" data-testid="question-${q.id}">${body}<span class="field-error" id="error-${q.id}">${escape(error ?? '')}</span>${extra ? `<div class="extra-field"><label for="${extra.id}">${extra.label} <span class="optional">Opcional</span></label><input id="${extra.id}" name="${extra.id}" maxlength="300" value="${escape(state.answers[extra.id])}" ${state.errors[extra.id] ? 'aria-invalid="true"' : ''}><span class="field-error">${escape(state.errors[extra.id] ?? '')}</span></div>` : ''}</div>`;
}

function participantContent() {
  return `<p class="eyebrow">PRIMERO, CONOZCÁMONOS</p><h1>Lo que sabes empieza contigo.</h1><p class="intro">Escribe tu nombre para identificar tu entrega. Puedes agregar los datos de tu negocio y una forma de contacto.</p><p class="required-note">Los campos con * son obligatorios.</p><div class="fields-grid">${field('name', 'Nombre completo', { required: true, placeholder: 'Como te gustaría que te llamemos', autocomplete: 'name' })}${field('business', 'Nombre de tu negocio', { placeholder: 'Tu negocio o emprendimiento', autocomplete: 'organization' })}${field('email', 'Correo electrónico', { type: 'email', placeholder: 'tu@correo.com', autocomplete: 'email' })}${field('phone', 'Teléfono / WhatsApp', { type: 'tel', placeholder: 'Ej. 441 123 4567', autocomplete: 'tel' })}${field('municipality', 'Municipio', { placeholder: 'Ej. Jalpan de Serra', autocomplete: 'address-level2' })}</div><div class="privacy-note">${icon('lock')}<p>Solo el equipo que imparte el taller podrá consultar tus datos y tus respuestas. <button type="button" class="text-button" data-action="privacy">Conoce cómo los usamos.</button></p></div>`;
}

function answersContent() {
  return `<p class="eyebrow">${state.form.category}</p><h1>${state.form.title}</h1><p class="intro">${state.form.instructions}</p><div class="activity-meta"><span>${icon('clock')} ${state.form.minutes} min aproximadamente</span><span>${state.form.id === 'diagnostico' ? 'Todas las preguntas son obligatorias.' : 'Puedes dejar en blanco lo que aún no sabes.'}</span></div>${state.form.sections.map((section, i) => `<section class="question-section"><div class="question-section-heading"><span>${String(i + 1).padStart(2, '0')}</span><div><h2>${section.title}</h2>${section.description ? `<p>${section.description}</p>` : ''}</div></div>${section.prompt ? `<blockquote>${escape(section.prompt)}<button type="button" class="text-button copy-prompt" data-prompt="${i}">Copiar prompt</button></blockquote>` : ''}${section.questions.map(question).join('')}</section>`).join('')}<section class="question-section doubts-section"><p class="eyebrow">TU ESPACIO</p><h2>¿Te quedó alguna pregunta?</h2><p>Escribe tus dudas o comentarios para quien imparte el taller. Es opcional.</p><label class="sr-only" for="questions">Tus preguntas para el instructor</label><textarea name="questions" id="questions" maxlength="2000" rows="4" placeholder="Me gustaría saber más sobre…">${escape(state.questions)}</textarea><span class="field-error">${escape(state.errors.questions ?? '')}</span></section><section class="question-section files-section" id="files-section">${filesContent(!state.locked)}</section>`;
}

function filesContent(editable) {
  const files = course.files(state.form.id);
  const list = files.length ? `<ul class="file-list">${files.map(f => `<li><span class="file-name">${escape(f.name)}</span><small>${escape(formatSize(f.size))}</small><button type="button" class="text-button" data-download-file="${escape(f.id)}">Descargar</button>${editable ? `<button type="button" class="text-button file-remove" data-delete-file="${escape(f.id)}" aria-label="Quitar ${escape(f.name)}">Quitar</button>` : ''}</li>`).join('')}</ul>` : `<p class="file-empty">${editable ? 'Aún no adjuntas archivos.' : 'No adjuntaste archivos.'}</p>`;
  if (!editable) return list;
  return `<p class="eyebrow">TUS ARCHIVOS</p><h2>Adjunta tu trabajo</h2><p>Sube fotos, capturas, PDF, Word, Excel o PowerPoint de esta actividad. Es opcional. Hasta ${fileLimits.maxFiles} archivos de 5 MB; las fotos grandes se reducen automáticamente.</p>${list}${files.length < fileLimits.maxFiles ? `<label class="button secondary file-picker" for="activity-file">${icon('download')} Agregar archivo</label><input type="file" id="activity-file" class="sr-only" accept="${fileAccept}">` : ''}<p id="file-status" role="status" class="inline-status"></p>`;
}

function refreshFiles(message = '', error = false) {
  const section = document.querySelector('#files-section');
  if (section) section.innerHTML = filesContent(!state.locked);
  const status = document.querySelector('#file-status');
  if (status) { status.textContent = message; status.classList.toggle('save-warning', error); }
}

async function prepareFile(file) {
  let type = fileType(file);
  if (!type) throw new Error('Tipo de archivo no permitido. Usa foto (JPG, PNG, WebP), PDF, Word, Excel, PowerPoint o texto.');
  let blob = file;
  let name = file.name || 'archivo';
  // Las fotos del celular suelen pesar varios MB: se reducen a 1600 px antes de subirlas.
  if (type.startsWith('image/') && file.size > 1024 * 1024) {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const reduced = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
      if (reduced && reduced.size < file.size) { blob = reduced; type = 'image/jpeg'; name = `${name.replace(/\.[^.]+$/, '')}.jpg`; }
    } catch { /* Se intenta subir el original. */ }
  }
  if (blob.size > fileLimits.maxBytes) throw new Error('El archivo supera 5 MB. Elige uno más pequeño.');
  if (!blob.size) throw new Error('El archivo está vacío.');
  const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] ?? ''); reader.onerror = () => reject(new Error('No pudimos leer el archivo.')); reader.readAsDataURL(blob); });
  return { name: name.slice(-160), type, base64 };
}

function answerText(value) {
  if (Array.isArray(value)) return value.join(', ') || 'Sin responder';
  if (typeof value === 'boolean') return value ? 'Completado' : 'Pendiente';
  return value?.trim() || 'Sin responder';
}

function reviewContent() {
  return `<p class="eyebrow">UN ÚLTIMO VISTAZO</p><h1>Todo listo para compartir.</h1><p class="intro">Revisa tus datos y respuestas. Puedes volver para cambiar lo que necesites antes de enviar.</p><section class="review-section"><div class="review-heading"><h2>Tus datos</h2><button type="button" class="text-button" data-edit="0">Editar datos ↗</button></div><dl class="person-review">${Object.entries({ name: 'Nombre', business: 'Negocio', email: 'Correo', phone: 'Teléfono', municipality: 'Municipio' }).map(([key, label]) => `<div><dt>${label}</dt><dd>${escape(state.participant[key] || 'No indicado')}</dd></div>`).join('')}</dl></section><section class="review-section"><div class="review-heading"><h2>${state.form.title}</h2><button type="button" class="text-button" data-edit="1">Editar respuestas ↗</button></div>${state.form.sections.map(s => `<h3 class="review-subtitle">${s.title}</h3><dl class="answers-review">${s.questions.map(q => `<div><dt>${q.number ? `${q.number}. ` : ''}${escape(q.label)}</dt><dd>${escape(answerText(state.answers[q.id]))}</dd>${extraFields[q.id] && state.answers[extraFields[q.id].id] ? `<dd>${escape(state.answers[extraFields[q.id].id])}</dd>` : ''}</div>`).join('')}</dl>`).join('')}<h3 class="review-subtitle">Tus preguntas para el instructor</h3><p class="review-doubts">${escape(state.questions || 'No agregaste preguntas adicionales.')}</p><h3 class="review-subtitle">Archivos adjuntos</h3>${filesContent(false)}</section><section class="consent-section"><label class="check-line"><input type="checkbox" name="consent" ${state.consent ? 'checked' : ''}><span>Autorizo que el equipo del taller guarde mis datos y respuestas para dar seguimiento a esta actividad.</span></label><button type="button" class="text-button" data-action="privacy">Leer aviso de privacidad</button><span class="field-error">${escape(state.errors.consent ?? '')}</span></section>${!isConfigured(config) ? '<div class="notice" role="status">El formulario todavía no está habilitado para recibir entregas. Puedes revisar y descargar tus respuestas; solicita al instructor que habilite el envío.</div>' : ''}<button type="button" class="text-button download-link" data-action="download">${icon('download')} Descargar mis respuestas</button>`;
}

function sheetContent() {
  const notice = state.locked
    ? `<div class="notice edit-notice">${escape(state.lockReason)}</div>`
    : state.submitted
      ? `<div class="notice edit-notice"><span>Ya entregaste; los cambios actualizan tu entrega</span>. Folio: <code>${escape(state.id)}</code></div>`
      : '';
  const consent = state.locked ? '' : `<section class="consent-section"><label class="check-line"><input type="checkbox" name="consent" ${state.consent ? 'checked' : ''}><span>Autorizo que el equipo del taller guarde mis datos y respuestas para dar seguimiento a esta actividad.</span></label><button type="button" class="text-button" data-action="privacy">Leer aviso de privacidad</button><span class="field-error">${escape(state.errors.consent ?? '')}</span></section>${isConfigured(config) ? '' : '<div class="notice">El formulario todavía no está habilitado para recibir entregas. Puedes revisar y descargar tus respuestas; solicita al instructor que habilite el envío.</div>'}`;
  return `${notice}<fieldset class="activity-sheet" ${state.locked ? 'disabled' : ''}><details class="profile-fold" open><summary>Tus datos</summary><p class="intro">Estos datos identifican tu entrega. Puedes plegarlos para ir a las preguntas.</p><p class="required-note">Los campos con * son obligatorios.</p><div class="fields-grid">${field('name', 'Nombre completo', { required: true, placeholder: 'Como te gustaría que te llamemos', autocomplete: 'name' })}${field('business', 'Nombre de tu negocio', { placeholder: 'Tu negocio o emprendimiento', autocomplete: 'organization' })}${field('email', 'Correo electrónico', { type: 'email', placeholder: 'tu@correo.com', autocomplete: 'email' })}${field('phone', 'Teléfono / WhatsApp', { type: 'tel', placeholder: 'Ej. 441 123 4567', autocomplete: 'tel' })}${field('municipality', 'Municipio', { placeholder: 'Ej. Jalpan de Serra', autocomplete: 'address-level2' })}</div></details>${answersContent()}${consent}</fieldset>`;
}

function renderForm() {
  const deliverLabel = state.submitted ? 'Guardar cambios de la entrega' : 'Entregar';
  main.innerHTML = `<div class="form-layout page-width"><aside class="form-sidebar"><a class="back-link" href="#curso">← Volver a mi curso</a><div class="sidebar-title"><span class="activity-icon">${icon(state.form.icon)}</span><p class="eyebrow">ACTIVIDAD ${state.form.number}</p><h2>${state.form.title}</h2></div><div class="sidebar-note">${icon('lock')}<p>${state.locked ? 'Puedes consultar esta actividad y descargar una copia.' : 'Puedes guardar y retomar esta actividad desde tu cuenta.'}</p></div><button type="button" class="text-button draft-copy" data-action="download">Descargar una copia</button></aside><div class="form-panel"><form id="activity-form" novalidate><div class="form-content">${sheetContent()}<div id="form-error" role="alert" class="form-error">${escape(state.errors.submit ?? (Object.keys(state.errors).length ? 'Revisa los campos señalados para continuar.' : ''))}</div></div><div class="draft-save-bar"><span id="draft-status" role="status" aria-live="polite"></span>${state.locked ? '' : `<div class="draft-save-actions">${state.submitted ? '' : '<button type="button" class="text-button" data-action="save-draft">Guardar avance</button>'}<button type="button" class="button primary" data-action="deliver" ${state.busy || !isConfigured(config) ? 'disabled' : ''}>${state.busy ? 'Guardando tu entrega…' : `${deliverLabel} ${icon('check')}`}</button></div>`}</div></form></div></div>`;
  const form = document.querySelector('#activity-form');
  saveStatus(state.saveError ? `No se pudo guardar. ${state.saveError}` : state.savePromise ? 'Guardando tu avance…' : state.dirty ? 'Cambios pendientes de guardar' : state.savedAt ? 'Avance guardado en tu cuenta ✓' : state.locked ? state.lockReason : 'Tu avance se guardará en esta cuenta', !!state.saveError);
  form.addEventListener('input', capture);
  form.addEventListener('change', capture);
  form.addEventListener('submit', event => event.preventDefault());
}

function capture(event) {
  const { name, type, value, checked } = event.target;
  if (!name || state.locked) return;
  if (['name', 'email', 'phone', 'business', 'municipality'].includes(name)) state.participant[name] = value;
  else if (name === 'questions') state.questions = value;
  else if (name === 'consent') state.consent = checked;
  else if (type === 'checkbox') {
    const q = getQuestions(state.form).find(q => q.id === name);
    state.answers[name] = q?.type === 'multi' ? Array.from(document.querySelectorAll(`input[name="${name}"]:checked`), input => input.value) : checked;
  } else state.answers[name] = value;
  scheduleSave();
}

function moveTo(step) {
  state.step = step; state.errors = {}; renderForm(); scheduleSave(); focusMain();
}
function focusMain() { main.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }

async function deliver() {
  if (state.busy || state.locked || !state.form) return;
  state.participant = Object.fromEntries(Object.entries(state.participant).map(([key, value]) => [key, value.trim()]));
  const errors = validateSubmission(payload());
  if (Object.keys(errors).length) {
    state.errors = errors;
    renderForm();
    const key = Object.keys(errors)[0];
    const target = document.getElementById(key) ?? document.querySelector(`#question-${key} textarea, #question-${key} input`) ?? document.querySelector('[name="consent"]');
    target?.focus(); target?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return;
  }
  const editing = state.submitted;
  state.busy = true; renderForm();
  try {
    await saveDraft();
    state.receipt = await course.complete(payload(), state.revision);
    state.revision = state.receipt.work.revision;
    state.savedAt = state.receipt.work.saved_at;
    state.submitted = true;
    state.dirty = false;
    state.busy = false;
    clearTimeout(saveTimer);
    if (editing) { renderForm(); saveStatus('Tu entrega se actualizó.'); }
    else renderSuccess();
    focusMain();
  }
  catch (error) { state.busy = false; state.errors = { submit: error.message }; renderForm(); document.querySelector('#form-error').scrollIntoView({ block: 'center', behavior: 'smooth' }); }
}

function renderSuccess() {
  main.innerHTML = `<section class="success-panel page-width"><div class="success-icon">${icon('check')}</div><p class="eyebrow">ENTREGA RECIBIDA</p><h1>Gracias por compartir,<br><em>${escape(state.participant.name.split(' ')[0])}.</em></h1><p>Tus respuestas de <strong>${state.form.title}</strong> se guardaron correctamente. El equipo del taller podrá consultarlas junto con tus preguntas.</p><div class="receipt"><span>Folio de tu entrega</span><code>${state.id}</code></div><div class="success-actions"><a href="#curso" class="button primary">Volver a mi curso ${icon('arrow')}</a><button class="button secondary" data-action="download">${icon('download')} Descargar mi entrega</button></div><p class="success-footnote">Una nueva idea puede cambiar la forma en que crece tu negocio.</p></section>`;
}

function download() {
  const form = state.form;
  const copy = { actividad: form.title, folio: state.id, estado: state.submitted || state.receipt ? 'Entregada y guardada en Supabase' : state.revision > 0 ? 'Borrador guardado en Supabase' : 'Copia sin guardar', participante: state.participant, respuestas: form.sections.map(s => ({ seccion: s.title, respuestas: s.questions.map(q => ({ pregunta: q.label, respuesta: state.answers[q.id] ?? null, detalle: extraFields[q.id] ? state.answers[extraFields[q.id].id] ?? null : undefined })) })), preguntas_al_instructor: state.questions };
  const url = URL.createObjectURL(new Blob([JSON.stringify(copy, null, 2)], { type: 'application/json;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = `${form.id}-${state.id.slice(0, 8)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function privacy() {
  document.querySelector('#dialog-body').innerHTML = '<p class="eyebrow">TU INFORMACIÓN</p><h2 id="dialog-title">Privacidad de tus datos</h2><p>Tu usuario identifica tu participación en el curso. El instructor recibe tu nombre, tu usuario, los datos de contacto y de negocio que compartas, tus actividades y tus preguntas.</p><p>Tu PIN se guarda cifrado; nadie puede consultarlo, ni siquiera el instructor, que solo puede asignarte uno nuevo si lo olvidas. Tus borradores y entregas se guardan en Supabase para que puedas retomarlos al volver a entrar con tu usuario y PIN. Los demás participantes no pueden ver tu información.</p><p>Los datos se utilizan para acompañar el aprendizaje, revisar actividades y responder dudas. El instructor puede descargar las entregas para dar seguimiento al curso.</p><p>No incluyas contraseñas, datos bancarios ni información privada de tus clientes en las respuestas. Para solicitar acceso, corrección o eliminación de tus datos, contacta a quien imparte el curso e indica tu usuario y el folio de tu entrega.</p><p>Antes de cerrar la página, comprueba que aparezca “Avance guardado en tu cuenta”. Si no hay conexión, puedes descargar una copia de lo que escribiste.</p>';
  dialog.showModal();
}

document.addEventListener('click', async event => {
  const trigger = event.target.closest('button');
  if (!trigger) return;
  if (trigger.dataset.form) {
    navigate(`#actividad/${trigger.dataset.form}`);
  }
  if (trigger.dataset.action === 'save-draft') { trigger.disabled = true; try { await saveDraft(); if (location.hash !== `#actividad/${state.form?.id}`) await route(); } catch {} finally { if (trigger.isConnected) trigger.disabled = false; } }
  if (trigger.dataset.action === 'deliver') { trigger.disabled = true; try { await deliver(); } finally { if (trigger.isConnected) trigger.disabled = false; } }
  if (trigger.dataset.edit !== undefined) moveTo(Number(trigger.dataset.edit));
  if (trigger.dataset.action === 'previous') moveTo(state.step - 1);
  if (trigger.dataset.action === 'privacy') privacy();
  if (trigger.dataset.action === 'download') download();
  if (trigger.dataset.deleteFile) {
    trigger.disabled = true;
    try { await course.deleteFile(trigger.dataset.deleteFile); refreshFiles('Archivo quitado.'); }
    catch (error) { refreshFiles(error.message, true); }
  }
  if (trigger.dataset.prompt !== undefined) {
    try { await navigator.clipboard.writeText(state.form.sections[Number(trigger.dataset.prompt)].prompt); trigger.textContent = 'Copiado ✓'; }
    catch { trigger.textContent = 'Selecciona el texto para copiarlo'; }
  }
});

async function route() {
  const ticket = ++routeGeneration;
  try {
    if (state.form && !state.locked && (state.dirty || state.savePromise)) await saveDraft();
    if (ticket !== routeGeneration) return;
    const hash = location.hash;
    if (hash.startsWith('#actividad/') && course.user) {
      await course.ready();
      if (ticket !== routeGeneration) return;
      const id = hash.slice(11);
      const form = course.activity(id);
      if (!form) { state = emptyState(); return await course.render('#curso'); }
      const work = course.work(id);
      const person = course.profile ?? {};
      const profile = { name: person.full_name ?? '', email: person.email ?? '', phone: person.phone ?? '', business: person.business ?? '', municipality: person.municipality ?? '' };
      state = { ...emptyState(), form, step: 1, revision: work?.revision ?? 0, savedAt: work?.saved_at ?? null, participant: profile, id: crypto.randomUUID(), ...(work?.payload ?? {}), errors: {} };
      state.participant = { ...profile, ...(work?.payload?.participant ?? {}) };
      state.submitted = work?.status === 'submitted';
      state.locked = !activityOpen(form);
      state.lockReason = state.locked ? closedReason(form) : '';
      renderForm();
      if (!work && !state.locked) scheduleSave();
      focusMain(); return;
    }
    state = emptyState();
    await course.render(hash);
    if (ticket === routeGeneration) focusMain();
  } catch (error) {
    state.errors.submit = error.message;
    const alert = document.querySelector('#form-error');
    if (alert) { alert.textContent = error.message; alert.scrollIntoView({ block: 'center' }); }
    else { await course.render(location.hash); }
  }
}
document.addEventListener('change', async event => {
  if (event.target.id !== 'activity-file' || !event.target.files?.[0] || !state.form || state.locked) return;
  const file = event.target.files[0];
  const formId = state.form.id;
  const status = document.querySelector('#file-status');
  const picker = document.querySelector('.file-picker');
  if (status) { status.textContent = `Subiendo ${file.name}…`; status.classList.remove('save-warning'); }
  picker?.classList.add('is-busy');
  try {
    const prepared = await prepareFile(file);
    const saved = await course.uploadFile(formId, prepared.name, prepared.type, prepared.base64);
    if (state.form?.id === formId) refreshFiles(`Archivo guardado en tu cuenta ✓ ${saved.name}`);
  } catch (error) { if (state.form?.id === formId) refreshFiles(`No se pudo subir. ${error.message}`, true); }
});
window.addEventListener('hashchange', route);
window.addEventListener('beforeunload', event => { if (state.dirty || state.savePromise) event.preventDefault(); });
await course.initialize();
await route();
