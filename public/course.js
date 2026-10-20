import { createAuth, normalizeUsername, usernamePattern, pinPattern } from './auth.js';
import { createCourseData, base64ToBlob, formatSize, escapeHtml as e, statusLabel, workState, activityAction, courseProgress, formatDate, responsesCsv, trackingCsv, downloadText } from './course-data.js';
import { forms, getQuestions, extraFields } from './forms.js';
import { adminNavigation, adminSummary, adminProfile } from './admin-ui.js';

export function createCourse({ config, main, icon, navigate, beforeSignOut }) {
  const auth = createAuth(config);
  const data = createCourseData(auth);
  let loaded = null;
  let loading = null;
  let teacher = null;
  let offset = 0;
  let viewGeneration = 0;
  let search = '';
  let activityFilter = '';
  let matrix = null;
  let trackSearch = '';
  let trackActivity = '';
  let trackStatus = '';
  let trackMissing = false;
  const trackText = { pending: 'Pendiente', draft: 'En progreso', submitted: 'Entregada', edited: 'Editada tras entrega' };

  const badge = work => {
    const kind = workState(work);
    return `<span class="status-badge ${kind}"><span aria-hidden="true">${kind === 'pending' ? '○' : kind === 'draft' ? '◐' : '✓'}</span> ${statusLabel(work)}</span>`;
  };
  const courseForms = () => (loaded?.activities ?? []).map(row => ({ ...forms.find(f => f.id === row.id), ...row })).filter(f => f.sections);
  const role = () => loaded?.context.role;
  const workFor = id => loaded?.work.find(w => w.form_id === id);
  const profile = () => loaded?.context.profile;

  function header() {
    document.querySelector('.site-header nav').innerHTML = auth.user ? `<a href="#curso" class="nav-active">Mi curso</a>${role() === 'instructor' ? '<a href="#seguimiento">Panel docente</a>' : '<a href="#materiales">Materiales</a>'}` : '<a href="#login" class="nav-active">Acceder al curso</a>';
    const label = document.querySelector('.course-label');
    label.classList.toggle('course-user', !!auth.user);
    const avatar = `<span class="user-avatar" aria-hidden="true">${e((profile()?.full_name ?? auth.user?.username ?? 'A').slice(0, 1).toUpperCase())}</span>`;
    label.innerHTML = auth.user ? `${role() === 'instructor' ? `<a class="header-profile" href="#perfil" aria-label="Abrir perfil de administrador">${avatar}<span>Administrador</span></a>` : `${avatar}<span class="user-label">${e(profile()?.full_name ?? 'Mi cuenta')}</span>`}<button class="text-button" data-course-action="logout">Salir</button>` : '<span class="small-dot"></span> Taller de IA y turismo';
  }

  function shell(content, active = 'curso') {
    const person = profile();
    if (role() === 'instructor') {
      main.innerHTML = `<div class="course-layout admin-layout page-width"><aside class="course-sidebar"><div class="course-identity"><span class="admin-role">${icon('lock')} Administrador</span><h2>${e(person.full_name)}</h2><p>@${e(person.username)}</p></div>${adminNavigation(active, icon)}<div class="sidebar-course-info"><strong>Aula Sierra</strong><span>IA aplicada al turismo</span><a class="row-action" href="#materiales">Materiales del curso</a></div></aside><section class="course-body">${content}</section></div>`;
      return;
    }
    main.innerHTML = `<div class="course-layout page-width"><aside class="course-sidebar"><p class="eyebrow">TU ESPACIO DE APRENDIZAJE</p><div class="course-identity"><span class="user-avatar large">${e((person?.full_name ?? 'A').slice(0, 1).toUpperCase())}</span><h2>${e(person?.full_name ?? 'Mi curso')}</h2><p>${role() === 'instructor' ? 'Instructor del curso' : 'Participante del curso'}</p></div><nav aria-label="Menú del curso"><a href="#curso" class="${active === 'curso' ? 'selected' : ''}">${icon('compass')} Mi aprendizaje</a><a href="#materiales" class="${active === 'materiales' ? 'selected' : ''}">${icon('layers')} Materiales del curso</a>${role() === 'instructor' ? `<span class="sidebar-divider">GESTIÓN DEL CURSO</span><a href="#seguimiento" class="${active === 'seguimiento' ? 'selected' : ''}">${icon('compass')} Seguimiento</a><a href="#docente" class="${active === 'docente' ? 'selected' : ''}">${icon('message')} Entregas y preguntas</a><a href="#participantes" class="${active === 'participantes' ? 'selected' : ''}">${icon('bot')} Participantes</a><a href="#gestionar" class="${active === 'gestionar' ? 'selected' : ''}">${icon('layers')} Actividades</a>` : ''}</nav><div class="sidebar-course-info"><strong>IA aplicada al turismo</strong><span>Sierra Gorda · Querétaro</span><p>Ideas pequeñas. Nuevas posibilidades para tu negocio.</p></div></aside><section class="course-body">${content}</section></div>`;
  }

  async function load(force = false) {
    if (loaded && !force) return loaded;
    if (loading) return loading;
    loading = data.load().then(result => { loaded = result; header(); return result; }).finally(() => { loading = null; });
    return loading;
  }

  const pinField = (id, label, autocomplete, hint = '') => `<div class="field"><label for="${id}">${label}</label><div class="password-field"><input type="password" id="${id}" name="${id === 'auth-pin' ? 'pin' : 'pin2'}" inputmode="numeric" pattern="[0-9]{4,6}" minlength="4" maxlength="6" autocomplete="${autocomplete}" placeholder="••••" required><button type="button" class="text-button" data-course-action="show-password" data-target="${id}" aria-pressed="false">Mostrar</button></div>${hint ? `<span class="field-hint">${hint}</span>` : ''}</div>`;

  function showAuth(mode = 'login', message = '') {
    header();
    const signup = mode === 'registro';
    main.innerHTML = `<section class="auth-layout page-width"><div class="auth-story"><p class="eyebrow">AULA SIERRA · ESPACIO DEL CURSO</p><h1>Aprende algo nuevo.<br><em>Haz crecer lo tuyo.</em></h1><p>Tu experiencia y la inteligencia artificial pueden hacer un gran equipo. Aquí tienes un lugar para ponerlo en práctica.</p><img src="/landscape.svg" width="560" height="350" alt="Montañas y una cabaña de la Sierra Gorda"><div class="auth-story-foot"><span>5 actividades prácticas</span><span>Tu avance, guardado</span></div></div><div class="auth-panel"><div class="auth-tabs"><a href="#login" ${!signup ? 'aria-current="page"' : ''}>Iniciar sesión</a><a href="#registro" ${signup ? 'aria-current="page"' : ''}>Crear cuenta</a></div><p class="eyebrow">${signup ? 'BIENVENIDO AL CURSO' : 'CONTINÚA DONDE TE QUEDASTE'}</p><h2>${signup ? 'Tu próxima idea empieza aquí.' : 'Qué gusto tenerte de vuelta.'}</h2><p class="auth-description">${signup ? 'Elige un nombre de usuario y un PIN para guardar tus actividades y consultar tu avance.' : 'Entra con tu usuario y tu PIN para retomar tus actividades.'}</p><form id="course-auth" data-mode="${mode}" novalidate>${signup ? '<div class="field"><label for="auth-name">Nombre completo</label><input id="auth-name" name="name" autocomplete="name" maxlength="120" placeholder="Tu nombre y apellido" required></div>' : ''}<div class="field"><label for="auth-username">Nombre de usuario</label><input id="auth-username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" minlength="3" maxlength="30" placeholder="Ej. ana.sierra" required>${signup ? '<span class="field-hint">De 3 a 30 caracteres: letras sin acentos, números, punto o guion.</span>' : ''}</div>${pinField('auth-pin', 'PIN', signup ? 'new-password' : 'current-password', signup ? 'De 4 a 6 números. Anótalo: lo necesitarás para volver a entrar.' : '')}${signup ? pinField('auth-pin2', 'Repite tu PIN', 'new-password') : '<p class="field-hint pin-help">¿Olvidaste tu PIN? Pide al instructor que lo restablezca.</p>'}${signup ? '<label class="check-line auth-consent"><input type="checkbox" name="consent" required><span>Acepto que se guarden mis datos y actividades para participar en el curso. <button type="button" class="text-button" data-action="privacy">Ver privacidad</button></span></label>' : ''}<p class="form-error" id="auth-error" role="alert">${e(message)}</p><button class="button primary auth-submit">${signup ? 'Crear mi cuenta' : 'Entrar a mi curso'} ${icon('arrow')}</button></form><p class="auth-footer-note">${icon('lock')} Cada participante tiene su propio espacio.</p></div></section>`;
    document.querySelector('#course-auth').addEventListener('submit', submitAuth);
  }

  async function submitAuth(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const signup = form.dataset.mode === 'registro';
    const fields = new FormData(form);
    const name = String(fields.get('name') ?? '').trim();
    const username = normalizeUsername(fields.get('username'));
    const pin = String(fields.get('pin') ?? '');
    const errorBox = document.querySelector('#auth-error');
    const problem = signup
      ? name.length < 2 ? 'Escribe tu nombre completo.' : !usernamePattern.test(username) ? 'El usuario debe tener de 3 a 30 letras sin acentos, números, punto, guion o guion bajo.' : !pinPattern.test(pin) ? 'El PIN debe tener de 4 a 6 números.' : pin !== String(fields.get('pin2') ?? '') ? 'Los PIN no coinciden.' : fields.get('consent') !== 'on' ? 'Acepta la autorización para participar en el curso.' : ''
      : !username || !pin ? 'Escribe tu usuario y tu PIN.' : '';
    if (problem) { errorBox.textContent = problem; return; }
    const button = form.querySelector('button.auth-submit');
    button.disabled = true; button.textContent = 'Un momento…'; errorBox.textContent = '';
    try {
      if (signup) await auth.signUp(name, username, pin); else await auth.signIn(username, pin);
      await load(true); teacher = null;
      navigate(role() === 'instructor' ? '#seguimiento' : '#curso');
    } catch (error) {
      errorBox.textContent = error.message;
      form.querySelectorAll('input[type="password"], input[name="pin"], input[name="pin2"]').forEach(input => { input.value = ''; });
    } finally {
      if (button.isConnected) { button.disabled = false; button.innerHTML = `${signup ? 'Crear mi cuenta' : 'Entrar a mi curso'} ${icon('arrow')}`; }
    }
  }

  function showMessage(title, message) {
    main.innerHTML = `<section class="account-message page-width"><span class="success-icon">${icon('message')}</span><p class="eyebrow">TU CUENTA EN AULA SIERRA</p><h1>${e(title)}</h1><p>${e(message)}</p><a class="button primary" href="#login">Volver a iniciar sesión ${icon('arrow')}</a></section>`;
  }

  function studentDashboard() {
    const activities = courseForms().filter(f => f.is_published || workFor(f.id));
    const progress = courseProgress(activities, loaded.work);
    const next = activities.find(f => workFor(f.id)?.status !== 'submitted');
    shell(`<div class="course-page-heading"><div><p class="eyebrow">IA APLICADA AL TURISMO</p><h1>Tu próximo paso empieza aquí.</h1><p>Cada actividad acerca una nueva idea a tu negocio.</p></div><button class="button secondary" data-course-action="refresh">Actualizar</button></div><div class="learning-summary"><div><span class="summary-label">TU RECORRIDO</span><h2>${progress.completed} de ${progress.total} actividades entregadas</h2><p>${progress.completed === progress.total && progress.total ? 'Terminaste las actividades publicadas. Tu experiencia sigue creciendo.' : next ? `Siguiente paso: ${e(next.title)}.` : 'Tu instructor publicará las actividades del curso aquí.'}</p><progress class="progress-track" max="100" value="${progress.percent}" aria-label="Avance del curso">${progress.percent}%</progress><span class="progress-caption">${progress.percent}% completado</span></div><div class="learning-summary-icon">${icon(progress.percent === 100 ? 'check' : 'compass')}</div></div><section class="course-table-section"><div class="table-heading"><div><h2>Mis actividades</h2><p>Tus borradores y entregas quedan guardados en tu cuenta.</p></div><span class="count-pill">${activities.length} actividades</span></div>${activities.length ? `<div class="table-scroll"><table class="course-table student-table" role="table"><caption class="sr-only">Actividades del curso y avance personal</caption><thead><tr><th>Actividad</th><th>Estado</th><th>Último guardado</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>${activities.map(f => { const work = workFor(f.id); return `<tr><td><div class="activity-table-title"><span class="table-activity-icon">${icon(f.icon)}</span><div><strong>${e(f.title)}</strong><small>${f.minutes} min${f.due_at ? ` · Hasta ${e(formatDate(f.due_at))}` : ''}</small></div></div></td><td>${badge(work)}</td><td class="table-date">${e(formatDate(work?.saved_at))}</td><td><a class="row-action" href="#actividad/${f.id}">${activityAction(work, f)} ${icon('arrow')}</a></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="course-empty"><h3>Aún no hay actividades publicadas</h3><p>Vuelve cuando tu instructor indique que pueden comenzar.</p></div>'}</section><div class="course-help-note">${icon('lock')}<p>Tu avance es personal. El instructor puede revisar tus entregas y las dudas que compartes.</p></div>`);
  }

  function materials() {
    shell(`<div class="course-page-heading"><div><p class="eyebrow">PARA ACOMPAÑAR TU APRENDIZAJE</p><h1>Materiales del curso.</h1><p>Consulta las guías originales y tenlas a mano al practicar.</p></div></div><div class="resource-list"><a class="resource-item featured-resource" href="/materiales/Presentacion_IA_y_Chatbots.pdf" target="_blank" rel="noopener"><span class="activity-icon">${icon('layers')}</span><div><span class="eyebrow">PRESENTACIÓN</span><h2>IA y chatbots para tu negocio</h2><p>Los conceptos y ejemplos que veremos en el curso.</p></div><span aria-hidden="true">↗</span></a>${forms.map(f => `<a class="resource-item" href="/materiales/${f.source}" target="_blank" rel="noopener"><span class="table-activity-icon">${icon(f.icon)}</span><div><h3>${e(f.title)}</h3><p>Guía de la actividad · PDF</p></div><span aria-hidden="true">↗</span></a>`).join('')}<a class="resource-item" href="/materiales/Ejemplo_lleno_Agente_IA.pdf" target="_blank" rel="noopener"><span class="table-activity-icon">${icon('bot')}</span><div><h3>Un ejemplo de agente de IA</h3><p>Cuestionario y prompt de referencia. Sus datos son inventados.</p></div><span aria-hidden="true">↗</span></a></div>`, 'materiales');
  }

  const filteredResponses = () => (teacher?.responses ?? []).filter(r => (!activityFilter || r.form_id === activityFilter) && [r.full_name, r.business, r.email].some(value => String(value ?? '').toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))));
  function responseRows() {
    const rows = filteredResponses();
    return rows.length ? rows.map(r => `<tr><td><strong>${e(r.full_name)}</strong><small class="table-subtitle">${e(r.business || r.email || 'Participante')}</small></td><td>${e(forms.find(f => f.id === r.form_id)?.title ?? r.form_id)}</td><td class="table-date">${e(formatDate(r.submitted_at))}</td><td><span class="question-indicator">${r.questions ? 'Con preguntas' : 'Sin preguntas'}</span></td><td><button class="row-action" data-response="${e(r.id)}">Ver entrega ↗</button></td></tr>`).join('') : '<tr><td colspan="5"><div class="course-empty"><h3>No hay entregas en esta vista</h3><p>Las respuestas aparecerán cuando los participantes entreguen sus actividades.</p></div></td></tr>';
  }

  async function teacherDashboard(view) {
    if (role() !== 'instructor') return studentDashboard();
    if (view === 'seguimiento') return showTracking();
    if (!teacher) teacher = await data.instructor(offset);
    const title = view === 'participantes' ? 'Personas que aprenden contigo.' : view === 'gestionar' ? 'Prepara el recorrido del curso.' : 'Un lugar para acompañar su avance.';
    const heading = `<div class="course-page-heading"><div><p class="eyebrow">PANEL DE ADMINISTRACIÓN</p><h1>${title}</h1><p>Da seguimiento a las actividades y a las preguntas de tu grupo.</p></div><button class="button secondary" data-course-action="refresh">Actualizar</button></div>`;
    const metrics = `<div class="course-metrics"><article><span>Participantes${teacher.profiles.length === 200 ? ' en esta lista' : ''}</span><strong>${teacher.profiles.length}</strong><small>Con usuario en el curso</small></article><article><span>Entregas en esta página</span><strong>${teacher.responses.length}</strong><small>Hasta 200 por página</small></article><article><span>Con preguntas</span><strong>${teacher.responses.filter(r => r.questions?.trim()).length}</strong><small>Para retomar durante la clase</small></article></div>`;
    if (view === 'participantes') {
      shell(`${heading}${metrics}<section class="course-table-section"><div class="table-heading"><div><h2>Participantes</h2><p>Avance de cada cuenta. Si alguien olvida su PIN, restablécelo aquí.</p></div></div><div class="table-scroll"><table class="course-table participants-table"><caption class="sr-only">Participantes y actividades guardadas</caption><thead><tr><th>Nombre y usuario</th><th>Negocio</th><th>Entregadas</th><th>En progreso</th><th>Municipio</th><th><span class="sr-only">PIN</span></th></tr></thead><tbody>${teacher.profiles.length ? teacher.profiles.map(p => { const work = teacher.work.filter(w => w.user_id === p.user_id); return `<tr><td><strong>${e(p.full_name)}</strong><small class="table-subtitle">@${e(p.username)}${p.role === 'instructor' ? ' · instructor' : ''}</small></td><td>${e(p.business || '—')}</td><td>${work.filter(w => w.status === 'submitted').length}</td><td>${work.filter(w => w.status === 'draft').length}</td><td>${e(p.municipality || '—')}</td><td><button class="row-action" data-reset-pin="${e(p.user_id)}" data-reset-name="${e(p.full_name)}">Restablecer PIN</button></td></tr>`; }).join('') : '<tr><td colspan="6"><div class="course-empty"><h3>El grupo está por llegar</h3><p>Las cuentas aparecerán cuando cada participante cree su usuario.</p></div></td></tr>'}</tbody></table></div></section>`, view); return;
    }
    if (view === 'gestionar') {
      shell(`${heading}<div class="notice">Las actividades publicadas aparecen en el curso de los participantes. Sus entregas anteriores se conservan aunque ocultes una actividad.</div><section class="course-table-section"><div class="table-heading"><div><h2>Tabla de actividades</h2><p>Publicación y fecha de referencia para cada ejercicio.</p></div></div><div class="table-scroll"><table class="course-table management-table"><caption class="sr-only">Configurar publicación y fechas de actividades</caption><thead><tr><th>Actividad</th><th>Disponible</th><th>Fecha y hora límite</th><th><span class="sr-only">Guardar cambios</span></th></tr></thead><tbody>${courseForms().map(f => `<tr data-manage="${f.id}"><td><strong>${e(f.title)}</strong><small class="table-subtitle">Actividad ${e(f.number)} · ${f.minutes} min</small></td><td><label class="check-line"><input type="checkbox" name="published-${f.id}" ${f.is_published ? 'checked' : ''}><span>Publicada</span></label><label class="check-line"><input type="checkbox" name="lock-${f.id}" ${f.lock_after_due ? 'checked' : ''}><span>Bloquear edición después de la fecha límite</span></label></td><td><label class="sr-only" for="due-${f.id}">Fecha de ${e(f.title)}</label><input type="datetime-local" id="due-${f.id}" value="${f.due_at ? e(new Date(new Date(f.due_at).getTime() - new Date(f.due_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16)) : ''}"></td><td><button class="button secondary" data-save-activity="${f.id}">Guardar</button></td></tr>`).join('')}</tbody></table></div><p class="table-footnote">Ocultar la actividad cierra guardados y entregas. Si bloqueas la edición, al pasar la fecha tampoco se puede corregir; si no, la fecha es solo una referencia.</p><p id="management-status" role="status" class="inline-status"></p></section>`, view); return;
    }
    shell(`${heading}${metrics}<section class="course-table-section"><div class="table-heading"><div><h2>Entregas y preguntas</h2><p>Revisa respuestas, identifica dudas y descarga la lista que estás viendo.</p></div><button class="button secondary" data-course-action="export-csv">${icon('download')} Exportar esta lista</button></div><div class="table-toolbar"><label class="search-field"><span class="sr-only">Buscar por nombre, negocio o correo</span><input id="instructor-search" type="search" value="${e(search)}" placeholder="Buscar nombre, negocio o correo…"></label><label class="filter-field"><span class="sr-only">Filtrar por actividad</span><select id="filter-activity"><option value="">Todas las actividades</option>${forms.map(f => `<option value="${f.id}" ${activityFilter === f.id ? 'selected' : ''}>${e(f.title)}</option>`).join('')}</select></label></div><div class="table-scroll"><table class="course-table responses-table"><caption class="sr-only">Entregas de los participantes</caption><thead><tr><th>Participante</th><th>Actividad</th><th>Entregada</th><th>Preguntas</th><th><span class="sr-only">Ver respuestas</span></th></tr></thead><tbody id="responses-body">${responseRows()}</tbody></table></div><div class="table-pagination"><span id="response-count">${filteredResponses().length} entregas en esta vista</span><div><button class="text-button" data-course-action="previous-page" ${offset === 0 ? 'disabled' : ''}>← Anteriores</button><button class="text-button" data-course-action="next-page" ${teacher.responses.length < 200 ? 'disabled' : ''}>Siguientes →</button></div></div><p id="export-status" role="status" class="inline-status"></p></section>`, 'docente');
  }

  async function showResponse(id) {
    const response = await data.response(id);
    const form = forms.find(f => f.id === response.form_id);
    shell(`<a class="back-link" href="#docente">← Volver a las entregas</a><div class="course-page-heading"><div><p class="eyebrow">ENTREGA DEL PARTICIPANTE</p><h1>${e(response.full_name)}</h1><p>${e(form?.title ?? response.form_id)} · ${e(formatDate(response.submitted_at))}</p></div><button class="button secondary" data-export-response="${e(response.id)}">${icon('download')} Descargar CSV</button></div><section class="response-detail"><h2>Datos del participante</h2><dl class="person-review">${[['Correo', response.email], ['Teléfono', response.phone], ['Negocio', response.business], ['Municipio', response.municipality]].map(([key, value]) => `<div><dt>${key}</dt><dd>${e(value || 'No indicado')}</dd></div>`).join('')}</dl><h2>Respuestas</h2><dl class="answers-review">${(form ? getQuestions(form) : []).map(q => `<div><dt>${q.number ? `${q.number}. ` : ''}${e(q.label)}</dt><dd>${e(Array.isArray(response.answers[q.id]) ? response.answers[q.id].join(', ') : typeof response.answers[q.id] === 'boolean' ? response.answers[q.id] ? 'Completado' : 'Pendiente' : response.answers[q.id] || 'Sin responder')}</dd>${extraFields[q.id] && response.answers[extraFields[q.id].id] ? `<dd>${e(response.answers[extraFields[q.id].id])}</dd>` : ''}</div>`).join('')}</dl><h2>Preguntas para el instructor</h2><p class="review-doubts">${e(response.questions || 'No agregó preguntas adicionales.')}</p><h2>Archivos adjuntos</h2>${response.files?.length ? `<ul class="file-list">${response.files.map(f => `<li><span class="file-name">${e(f.name)}</span><small>${e(formatSize(f.size))}</small><button class="text-button" data-download-file="${e(f.id)}">Descargar</button></li>`).join('')}</ul>` : '<p class="review-doubts">No adjuntó archivos.</p>'}<p class="table-footnote">Folio: ${e(response.id)}</p></section>`, 'docente');
  }

  const visibleActivities = () => (matrix?.activities ?? []).filter(activity => !trackActivity || activity.id === trackActivity);
  const cellFor = (userId, formId) => matrix?.cells?.find(cell => cell.user_id === userId && cell.form_id === formId);
  function filteredMatrix() {
    const activities = visibleActivities();
    const query = trackSearch.trim().toLocaleLowerCase('es');
    const students = (matrix?.students ?? []).filter(student => {
      if (query && !`${student.full_name} ${student.username}`.toLocaleLowerCase('es').includes(query)) return false;
      const states = activities.map(activity => cellFor(student.user_id, activity.id)?.state ?? 'pending');
      if (trackStatus && !states.includes(trackStatus)) return false;
      if (trackMissing && states.every(state => state === 'submitted' || state === 'edited')) return false;
      return true;
    });
    return { ...matrix, students, activities };
  }
  function trackingRows() {
    const view = filteredMatrix();
    if (!view.students.length) return `<tr><td colspan="${view.activities.length + 1}"><div class="course-empty"><h3>Nadie coincide con estos filtros</h3><p>Prueba con otro nombre, actividad o estado.</p></div></td></tr>`;
    return view.students.map(student => `<tr><th scope="row"><strong>${e(student.full_name)}</strong><small class="table-subtitle">@${e(student.username)}</small></th>${view.activities.map(activity => { const state = cellFor(student.user_id, activity.id)?.state ?? 'pending'; return `<td><button type="button" class="track-cell" data-track-user="${e(student.user_id)}" data-track-form="${e(activity.id)}" aria-label="${e(student.full_name)}, ${e(activity.title)}: ${trackText[state]}"><span class="track-activity-title">${e(activity.title)}</span><span class="status-badge ${state}">${trackText[state]}</span></button></td>`; }).join('')}</tr>`).join('');
  }
  function paintTracking() {
    const body = document.querySelector('#track-body');
    if (!body || !matrix) return;
    body.innerHTML = trackingRows();
    const count = document.querySelector('#track-count');
    if (count) count.textContent = `${filteredMatrix().students.length} alumnos en esta vista`;
  }
  async function showTracking() {
    if (!matrix) matrix = await data.tracking();
    const activities = matrix.activities;
    shell(`<div class="course-page-heading"><div><p class="eyebrow">PANEL DE ADMINISTRACIÓN</p><h1>Seguimiento del grupo.</h1><p>Hola, ${e(profile().full_name.split(' ')[0])}. Aquí puedes revisar el avance de tus alumnos.</p></div><button class="button secondary" data-course-action="refresh">Actualizar</button></div>${adminSummary(matrix)}<section class="course-table-section"><div class="table-heading"><div><h2>Alumnos y actividades</h2><p>Toca una actividad para abrir el trabajo del alumno.</p></div><button class="button secondary" data-course-action="export-tracking">${icon('download')} Exportar seguimiento</button></div><div class="table-toolbar"><label class="search-field"><span class="sr-only">Buscar por nombre o usuario</span><input id="track-search" type="search" value="${e(trackSearch)}" placeholder="Buscar nombre o usuario…"></label><label class="filter-field"><span class="sr-only">Filtrar por actividad</span><select id="track-activity"><option value="">Todas las actividades</option>${activities.map(activity => `<option value="${activity.id}" ${trackActivity === activity.id ? 'selected' : ''}>${e(activity.title)}</option>`).join('')}</select></label><label class="filter-field"><span class="sr-only">Filtrar por estado</span><select id="track-status"><option value="">Todos los estados</option>${Object.entries(trackText).map(([value, label]) => `<option value="${value}" ${trackStatus === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="check-line track-missing"><input type="checkbox" id="track-missing" ${trackMissing ? 'checked' : ''}><span>Solo quienes no entregaron</span></label></div><div class="activity-totals" data-testid="activity-totals">${activities.map(activity => `<div><strong>${e(activity.title)}</strong><span>entregaron ${activity.submitted} / faltan ${activity.missing}</span></div>`).join('')}</div><div class="table-scroll"><table class="course-table tracking-table"><caption class="sr-only">Seguimiento de alumnos por actividad</caption><thead><tr><th>Alumno</th>${visibleActivities().map(activity => `<th scope="col">${e(activity.title)}<small class="table-subtitle">entregaron ${activity.submitted} / faltan ${activity.missing}</small></th>`).join('')}</tr></thead><tbody id="track-body">${trackingRows()}</tbody></table></div><p class="table-footnote" id="track-count">${filteredMatrix().students.length} alumnos en esta vista</p><p id="track-status-line" role="status" class="inline-status"></p></section>`, 'seguimiento');
  }
  function answerList(form, answers = {}) {
    return (form ? getQuestions(form) : []).map(q => `<div><dt>${q.number ? `${q.number}. ` : ''}${e(q.label)}</dt><dd>${e(Array.isArray(answers[q.id]) ? answers[q.id].join(', ') : typeof answers[q.id] === 'boolean' ? answers[q.id] ? 'Completado' : 'Pendiente' : answers[q.id] || 'Sin responder')}</dd>${extraFields[q.id] && answers[extraFields[q.id].id] ? `<dd>${e(answers[extraFields[q.id].id])}</dd>` : ''}</div>`).join('');
  }
  async function showStudentWork(userId, formId) {
    if (role() !== 'instructor') return studentDashboard();
    const detail = await data.studentWork(userId, formId);
    const form = forms.find(item => item.id === formId);
    const answers = detail.payload?.answers ?? detail.response?.answers ?? {};
    const doubts = detail.payload?.questions ?? detail.response?.questions ?? '';
    const versions = Array.isArray(detail.versions) ? detail.versions : [];
    shell(`<a class="back-link" href="#seguimiento">← Volver al seguimiento</a><div class="course-page-heading"><div><p class="eyebrow">TRABAJO DEL ALUMNO</p><h1>${e(detail.user.full_name)}</h1><p>@${e(detail.user.username)} · ${e(form?.title ?? formId)} · <span class="status-badge ${detail.state}">${trackText[detail.state] ?? 'Pendiente'}</span></p></div></div><section class="response-detail"><p class="table-footnote">Solo lectura. ${detail.response?.id ? `Folio: <code>${e(detail.response.id)}</code>` : '<span>Todavía no hay una entrega definitiva.</span>'}${detail.saved_at ? ` · Último guardado: ${e(formatDate(detail.saved_at))}` : ''}</p><h2>Respuestas</h2>${detail.payload || detail.response ? `<dl class="answers-review">${answerList(form, answers)}</dl>` : '<p class="review-doubts">Este alumno aún no empieza la actividad.</p>'}<h2>Preguntas para el instructor</h2><p class="review-doubts">${e(doubts || 'No agregó preguntas adicionales.')}</p><h2>Archivos adjuntos</h2>${detail.files?.length ? `<ul class="file-list">${detail.files.map(file => `<li><span class="file-name">${e(file.name)}</span><small>${e(formatSize(file.size))}</small><button type="button" class="text-button" data-download-file="${e(file.id)}">Descargar</button></li>`).join('')}</ul>` : '<p class="review-doubts">No hay archivos.</p>'}<h2>Versiones anteriores</h2>${versions.length ? `<ol class="version-list">${versions.map(version => `<li><strong>${e(formatDate(version.saved_at))}</strong><span>${e(version.participant?.name || '')}</span><p class="review-doubts">${e(version.questions || 'Sin preguntas en esa versión.')}</p><dl class="answers-review">${answerList(form, version.answers)}</dl></li>`).join('')}</ol>` : '<p class="review-doubts">No hay versiones anteriores.</p>'}</section>`, 'seguimiento');
  }

  async function render(hash) {
    const ticket = ++viewGeneration;
    if (!auth.user) return showAuth(hash === '#registro' ? 'registro' : 'login');
    try {
      if (!loaded) { main.innerHTML = '<div class="initial-loading" role="status">Preparando tu espacio de aprendizaje…</div>'; await load(); }
      if (ticket !== viewGeneration || !auth.user) return;
      header();
      if (hash === '#perfil' && role() === 'instructor') return shell(adminProfile(profile(), courseForms(), icon), 'perfil');
      if (role() === 'instructor' && ['', '#', '#login', '#registro'].includes(hash)) return await showTracking();
      if (hash === '#materiales') return materials();
      if (['#docente', '#participantes', '#gestionar', '#seguimiento'].includes(hash)) return await teacherDashboard(hash.slice(1));
      if (hash.startsWith('#entrega/')) return await showResponse(hash.slice(9));
      if (hash.startsWith('#trabajo/')) {
        const match = hash.match(/^#trabajo\/([0-9a-f-]{36})\/([a-z0-9-]+)$/i);
        if (match) return showStudentWork(match[1], match[2]);
      }
      studentDashboard();
    } catch (error) {
      if (ticket !== viewGeneration) return;
      if (!auth.user) { loaded = null; teacher = null; return showAuth('login', error.message); }
      main.innerHTML = `<section class="account-message page-width"><p class="eyebrow">TU ESPACIO DEL CURSO</p><h1>No pudimos cargar tu curso.</h1><p role="alert">${e(error.message)}</p><button class="button primary" data-course-action="refresh">Volver a intentar</button><button class="button secondary" data-course-action="logout">Cerrar sesión</button></section>`;
    }
  }

  document.addEventListener('input', event => {
    if (event.target.id === 'track-search') { trackSearch = event.target.value; paintTracking(); return; }
    if (event.target.id !== 'instructor-search') return;
    search = event.target.value;
    const body = document.querySelector('#responses-body');
    if (!body) return;
    body.innerHTML = responseRows();
    document.querySelector('#response-count').textContent = `${filteredResponses().length} entregas en esta vista`;
  });
  document.addEventListener('change', event => {
    if (event.target.id === 'track-activity' || event.target.id === 'track-status' || event.target.id === 'track-missing') {
      if (event.target.id === 'track-activity') trackActivity = event.target.value;
      if (event.target.id === 'track-status') trackStatus = event.target.value;
      if (event.target.id === 'track-missing') trackMissing = event.target.checked;
      const head = document.querySelector('.tracking-table thead');
      if (head && matrix) head.innerHTML = `<tr><th>Alumno</th>${visibleActivities().map(activity => `<th scope="col">${e(activity.title)}<small class="table-subtitle">entregaron ${activity.submitted} / faltan ${activity.missing}</small></th>`).join('')}</tr>`;
      paintTracking(); return;
    }
    if (event.target.id !== 'filter-activity') return;
    activityFilter = event.target.value;
    document.querySelector('#responses-body').innerHTML = responseRows();
    document.querySelector('#response-count').textContent = `${filteredResponses().length} entregas en esta vista`;
  });
  document.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.courseAction;
    try {
      if (action === 'show-password') {
        const input = document.getElementById(button.dataset.target); const show = input.type === 'password'; input.type = show ? 'text' : 'password'; button.textContent = show ? 'Ocultar' : 'Mostrar'; button.setAttribute('aria-pressed', String(show)); return;
      }
      if (action === 'logout') {
        button.disabled = true; await beforeSignOut(); await auth.signOut(); loaded = null; teacher = null; matrix = null; offset = 0; viewGeneration++; header(); return navigate('#login');
      }
      if (action === 'refresh') { teacher = null; matrix = null; loaded = null; await render(location.hash); return; }
      if (button.dataset.trackUser && button.dataset.trackForm) return navigate(`#trabajo/${button.dataset.trackUser}/${button.dataset.trackForm}`);
      if (action === 'export-tracking') {
        if (!matrix) return;
        downloadText(trackingCsv(filteredMatrix()), `aula-sierra-seguimiento-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
        const status = document.querySelector('#track-status-line'); if (status) status.textContent = 'Seguimiento exportado.'; return;
      }
      if (action === 'next-page' || action === 'previous-page') { offset = Math.max(0, offset + (action === 'next-page' ? 200 : -200)); teacher = null; return await render('#docente'); }
      if (button.dataset.response) return navigate(`#entrega/${button.dataset.response}`);
      if (action === 'export-csv' || button.dataset.exportResponse) {
        button.disabled = true;
        const ids = button.dataset.exportResponse ? [button.dataset.exportResponse] : filteredResponses().map(r => r.id);
        if (!ids.length) { const status = document.querySelector('#export-status'); if (status) status.textContent = 'No hay entregas en esta lista para exportar.'; return; }
        const records = await data.exportResponses(ids);
        downloadText(responsesCsv(records), `aula-sierra-entregas-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
        const status = document.querySelector('#export-status'); if (status) status.textContent = `Exportadas ${records.length} entregas de esta lista.`;
      }
      if (button.dataset.downloadFile) { button.disabled = true; return await downloadFile(button.dataset.downloadFile); }
      if (button.dataset.resetPin) return resetPinDialog(button.dataset.resetPin, button.dataset.resetName);
      if (button.dataset.saveActivity) {
        button.disabled = true;
        const id = button.dataset.saveActivity;
        const row = button.closest('tr');
        const value = row.querySelector('input[type="datetime-local"]').value;
        const result = await data.setActivity(id, row.querySelector(`input[name="published-${id}"]`).checked, value ? new Date(value).toISOString() : null, row.querySelector(`input[name="lock-${id}"]`).checked);
        loaded.activities = loaded.activities.map(a => a.id === id ? { ...a, ...result } : a);
        document.querySelector('#management-status').textContent = `Configuración de ${result.title} guardada.`;
      }
    } catch (error) {
      const status = document.querySelector('#management-status, #export-status, #auth-error');
      if (status) status.textContent = error.message;
      else { document.querySelector('#dialog-body').innerHTML = `<h2 id="dialog-title">No se pudo completar</h2><p>${e(error.message)}</p>`; document.querySelector('#info-dialog').showModal(); }
    } finally { if (button.isConnected) button.disabled = false; }
  });

  async function downloadFile(id) {
    const file = await data.downloadFile(id);
    const url = URL.createObjectURL(base64ToBlob(file.data, file.mime));
    const link = document.createElement('a'); link.href = url; link.download = file.name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function resetPinDialog(userId, name) {
    const dialog = document.querySelector('#info-dialog');
    document.querySelector('#dialog-body').innerHTML = `<p class="eyebrow">RESTABLECER ACCESO</p><h2 id="dialog-title">Nuevo PIN para ${e(name)}</h2><p>Comparte el nuevo PIN con la persona. Su sesión abierta se cerrará; sus actividades y entregas se conservan.</p><form id="reset-pin-form" novalidate><div class="field"><label for="reset-pin">Nuevo PIN</label><input id="reset-pin" name="pin" inputmode="numeric" pattern="[0-9]{4,6}" minlength="4" maxlength="6" autocomplete="off" required></div><p class="form-error" id="reset-pin-error" role="alert"></p><button class="button primary">Guardar nuevo PIN</button></form>`;
    dialog.showModal();
    document.querySelector('#reset-pin').addEventListener('input', () => { document.querySelector('#reset-pin-error').textContent = ''; });
    document.querySelector('#reset-pin-form').addEventListener('submit', async event => {
      event.preventDefault();
      const pin = event.currentTarget.elements.pin.value.trim();
      const errorBox = document.querySelector('#reset-pin-error');
      if (!pinPattern.test(pin)) { errorBox.textContent = 'El PIN debe tener de 4 a 6 números.'; return; }
      const submit = event.currentTarget.querySelector('button');
      submit.disabled = true;
      try {
        await data.resetPin(userId, pin);
        document.querySelector('#dialog-body').innerHTML = `<p class="eyebrow">RESTABLECER ACCESO</p><h2 id="dialog-title">PIN actualizado</h2><p>${e(name)} ya puede entrar con su usuario y el nuevo PIN.</p>`;
      } catch (error) { errorBox.textContent = error.message; submit.disabled = false; }
    });
  }

  function updateWork(work) { loaded.work = [...loaded.work.filter(w => w.form_id !== work.form_id), work]; teacher = null; }
  const ownFiles = id => (loaded?.files ?? []).filter(f => f.form_id === id);
  return {
    auth, render,
    get user() { return auth.user; }, get profile() { return profile(); }, get role() { return role(); },
    async ready() { return load(); },
    activity(id) {
      const form = courseForms().find(f => f.id === id);
      if (!form) return null;
      if (role() === 'instructor' || form.is_published || workFor(id)) return form;
      return null;
    },
    work(id) { const work = workFor(id); return work ? structuredClone(work) : null; },
    files(id) { return structuredClone(ownFiles(id)); },
    async uploadFile(formId, name, type, base64) { const file = await data.uploadFile(formId, name, type, base64); loaded.files = [...(loaded.files ?? []), file]; teacher = null; return file; },
    async deleteFile(id) { await data.deleteFile(id); loaded.files = (loaded.files ?? []).filter(f => f.id !== id); },
    async save(payload, step, revision) { const work = await data.save(payload, step, revision); updateWork(work); return work; },
    async complete(payload, revision) { const receipt = await data.complete(payload, revision); updateWork(receipt.work); return receipt; },
    async initialize() { header(); },
  };
}
