import { escapeHtml as e } from './course-data.js';
import { relatedWork } from './activity-credit.js';

const shortTitles = { diagnostico: 'Diagnóstico', 'prompt-conjunto': 'Prompt conjunto', 'calendario-contenido': 'Calendario', 'flyers-ia': 'Flyers con IA', 'tema4-perfiles': 'Perfil turístico', 'agente-ia': 'Chatbot WhatsApp' };
const delivered = cell => ['submitted', 'edited'].includes(cell?.state);
const cellFor = (view, user, activity) => view.cells.find(cell => cell.user_id === user && cell.form_id === activity);

export const registerHead = view => `<tr><th scope="col" class="register-name">Alumno</th>${view.activities.map(activity => `<th scope="col" aria-label="${e(activity.title)}"><span title="${e(activity.title)}">${e(shortTitles[activity.id] ?? activity.title)}</span></th>`).join('')}<th scope="col" class="register-total">Total</th></tr>`;

export function registerRows(view, work, forms, labels) {
  if (!view.students.length) return `<tr><td colspan="${view.activities.length + 2}"><div class="course-empty"><h3>Nadie coincide con estos filtros</h3><p>Prueba con otro nombre, actividad o estado.</p></div></td></tr>`;
  return view.students.map((student, index) => {
    const total = view.activities.filter(activity => delivered(cellFor(view, student.user_id, activity.id))).length;
    return `<tr><th scope="row" class="register-name"><span class="register-number">${index + 1}.</span><strong>${e(student.full_name)}</strong><small>@${e(student.username)}</small></th>${view.activities.map(activity => {
      const cell = cellFor(view, student.user_id, activity.id);
      const state = cell?.state ?? 'pending';
      const originals = relatedWork(activity.id, work.filter(item => item.user_id === student.user_id));
      const previousTitle = cell?.previous_form_id ? ` · Entrega anterior reconocida: ${forms.find(form => form.id === cell.previous_form_id)?.title ?? cell.previous_form_id}` : '';
      return `<td><button type="button" class="register-open" data-track-user="${e(student.user_id)}" data-track-form="${e(cell?.previous_form_id ?? activity.id)}" aria-label="${e(student.full_name)}, ${e(activity.title)}: ${e(labels[state])}" title="${e(labels[state] + previousTitle)}"><span class="register-state ${state}" aria-hidden="true">${delivered(cell) ? '✓' : state === 'draft' ? '◐' : '–'}</span><span class="sr-only">${e(labels[state] + previousTitle)}</span></button>${originals.length ? `<button type="button" class="register-previous" data-previous-user="${e(student.user_id)}" data-previous-form="${e(activity.id)}" aria-label="Ver trabajos anteriores de ${e(student.full_name)} en ${e(activity.title)}">+${originals.length}</button>` : ''}</td>`;
    }).join('')}<td class="register-total"><strong>${total}/${view.activities.length}</strong></td></tr>`;
  }).join('');
}

export function registerFoot(view) {
  const totals = view.activities.map(activity => view.students.filter(student => delivered(cellFor(view, student.user_id, activity.id))).length);
  return `<tr><th scope="row" class="register-name">Total entregadas</th>${totals.map(total => `<td>${total}</td>`).join('')}<td class="register-total">${totals.reduce((sum, total) => sum + total, 0)}</td></tr>`;
}
