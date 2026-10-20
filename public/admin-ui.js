import { escapeHtml as e } from './course-data.js';

export function adminNavigation(active, icon) {
  const items = [
    ['seguimiento', 'compass', 'Seguimiento', 'Inicio'],
    ['docente', 'message', 'Entregas y preguntas', 'Entregas'],
    ['participantes', 'bot', 'Participantes', 'Alumnos'],
    ['gestionar', 'layers', 'Actividades', 'Actividades'],
    ['perfil', 'lock', 'Mi perfil', 'Perfil'],
  ];
  return `<nav class="admin-nav" aria-label="Administración">${items.map(([route, symbol, label, short]) => `<a href="#${route}" aria-label="${label}" ${active === route ? 'aria-current="page" class="selected"' : ''}>${icon(symbol)}<span class="nav-full">${label}</span><span class="nav-short" aria-hidden="true">${short}</span></a>`).join('')}</nav>`;
}

export function adminSummary(matrix) {
  const submissions = matrix.activities.reduce((sum, activity) => sum + activity.submitted, 0);
  const missing = matrix.activities.reduce((sum, activity) => sum + activity.missing, 0);
  return `<div class="admin-summary" data-testid="admin-summary"><article><p><strong>${matrix.students.length}</strong> alumnos</p><span>En tu grupo</span></article><article><p><strong>${submissions}</strong> entregas</p><span>Recibidas</span></article><article><p><strong>${missing}</strong> pendientes</p><span>Por entregar</span></article></div>`;
}

export function adminProfile(person, activities, icon) {
  return `<div class="course-page-heading"><div><p class="eyebrow">TU CUENTA</p><h1>Mi perfil de administrador</h1><p>Tu espacio para organizar el curso y acompañar a los alumnos.</p></div></div><section class="admin-profile" aria-label="Perfil de administrador"><div class="profile-identity"><span class="profile-avatar" aria-hidden="true">${e(person.full_name.slice(0, 1).toUpperCase())}</span><div><h2>${e(person.full_name)}</h2><p>@${e(person.username)}</p><span class="admin-role" data-testid="account-role">${icon('lock')} Administrador</span></div></div><dl class="profile-information"><div><dt>Curso</dt><dd>IA aplicada al turismo</dd></div><div><dt>Actividades publicadas</dt><dd>${activities.filter(activity => activity.is_published).length}</dd></div>${person.email ? `<div><dt>Correo</dt><dd>${e(person.email)}</dd></div>` : ''}${person.phone ? `<div><dt>Teléfono</dt><dd>${e(person.phone)}</dd></div>` : ''}</dl><div class="profile-permissions"><h3>Lo que puedes hacer</h3><ul><li>Ver quién entregó y quién necesita apoyo.</li><li>Abrir respuestas, borradores y archivos.</li><li>Publicar actividades y ajustar sus fechas.</li><li>Restablecer el PIN de los participantes.</li></ul></div><a class="button primary" href="#seguimiento">Volver al seguimiento ${icon('arrow')}</a><div class="profile-links"><a href="#curso">Ver mi curso</a><a href="#materiales">Materiales del curso</a></div></section><p class="course-security-note">${icon('lock')} Tu cuenta tiene permisos de administración. Mantén tu PIN privado.</p>`;
}
