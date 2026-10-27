import { courseOrder } from './course-plan.js';

// Vincula trabajos anteriores sin mover respuestas, archivos ni folios.
export const previousActivityTargets = {
  'guia-prompts': 'prompt-conjunto', chatgpt: 'prompt-conjunto',
  'sesion2-precios': 'prompt-conjunto', 'sesion2-competencia': 'prompt-conjunto', 'sesion2-temporadas': 'prompt-conjunto',
  'pinal-precios': 'prompt-conjunto', 'pinal-competencia': 'prompt-conjunto', 'pinal-temporadas': 'prompt-conjunto',
  'pinal-estrategia': 'prompt-conjunto', 'pinal-cierre': 'prompt-conjunto',
  meta: 'calendario-contenido', whatsapp: 'agente-ia',
};

export const relatedWork = (formId, work) => work.filter(item => previousActivityTargets[item.form_id] === formId);

export function activityCredit(formId, work) {
  const direct = work.find(item => item.form_id === formId && item.status === 'submitted');
  if (direct) return { submitted: true, sources: [direct], inherited: false };
  const submitted = relatedWork(formId, work).filter(item => item.status === 'submitted');
  const alias = formId === 'prompt-conjunto' && submitted.find(item => ['guia-prompts', 'chatgpt'].includes(item.form_id));
  if (alias) return { submitted: true, sources: [alias], inherited: true };
  const groups = formId === 'prompt-conjunto' ? [
    ['sesion2-precios', 'sesion2-competencia', 'sesion2-temporadas'],
    ['pinal-precios', 'pinal-competencia', 'pinal-temporadas', 'pinal-estrategia'],
  ] : [];
  const group = groups.find(ids => ids.every(id => submitted.some(item => item.form_id === id)));
  return group ? { submitted: true, sources: group.map(id => submitted.find(item => item.form_id === id)), inherited: true } : { submitted: false, sources: [], inherited: false };
}

export function applyPreviousCredits(matrix, work) {
  const cells = matrix.cells.map(cell => {
    const credit = activityCredit(cell.form_id, work.filter(item => item.user_id === cell.user_id));
    return credit.inherited && !['submitted', 'edited'].includes(cell.state) ? { ...cell, state: 'submitted', previous_form_id: credit.sources[0].form_id } : cell;
  });
  return { ...matrix, cells, activities: matrix.activities.map(activity => {
    const submitted = cells.filter(cell => cell.form_id === activity.id && ['submitted', 'edited'].includes(cell.state)).length;
    return { ...activity, submitted, missing: matrix.students.length - submitted };
  }).sort(courseOrder) };
}
