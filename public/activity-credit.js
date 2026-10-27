import { courseOrder } from './course-plan.js';
import { sourceFormId, fileActivityTargets } from './activity-evidence.js';

// Acreditación general indicada por el docente; no genera respuestas ficticias.
export const teacherCredits = { diagnostico: 'Evaluación diagnóstica acreditada por indicación del docente.' };

// Vincula trabajos anteriores sin mover respuestas, archivos ni folios.
export const previousActivityTargets = {
  'guia-prompts': 'prompt-conjunto', chatgpt: 'prompt-conjunto',
  'sesion2-precios': 'prompt-conjunto', 'sesion2-competencia': 'prompt-conjunto', 'sesion2-temporadas': 'prompt-conjunto',
  'pinal-precios': 'prompt-conjunto', 'pinal-competencia': 'prompt-conjunto', 'pinal-temporadas': 'prompt-conjunto',
  'pinal-estrategia': 'prompt-conjunto', 'pinal-cierre': 'prompt-conjunto',
  meta: 'calendario-contenido', whatsapp: 'agente-ia',
};

export const relatedWork = (formId, work) => {
  const items = new Map();
  for (const item of work.filter(item => previousActivityTargets[item.form_id] === formId || (item.source_form_id && item.form_id === formId))) {
    const key = `${item.user_id ?? ''}/${sourceFormId(item)}`;
    const previous = items.get(key);
    items.set(key, previous ? { ...previous, evidence_files: [...(previous.evidence_files ?? []), ...(item.evidence_files ?? [])] } : item);
  }
  return [...items.values()];
};

export function activityCredit(formId, work) {
  const direct = work.find(item => item.form_id === formId && item.status === 'submitted');
  if (direct) return { submitted: true, sources: [direct], inherited: Boolean(direct.source_form_id) };
  if (teacherCredits[formId]) return { submitted: true, sources: [], inherited: false, teacherCredit: true };
  const submitted = relatedWork(formId, work).filter(item => item.status === 'submitted');
  const alias = formId === 'prompt-conjunto' && submitted.find(item => ['guia-prompts', 'chatgpt'].includes(sourceFormId(item)));
  if (alias) return { submitted: true, sources: [alias], inherited: true };
  const groups = formId === 'prompt-conjunto' ? [
    ['sesion2-precios', 'sesion2-competencia', 'sesion2-temporadas'],
    ['pinal-precios', 'pinal-competencia', 'pinal-temporadas', 'pinal-estrategia'],
  ] : [];
  const group = groups.find(ids => ids.every(id => submitted.some(item => sourceFormId(item) === id)));
  const partial = relatedWork(formId, work);
  return group ? { submitted: true, sources: group.map(id => submitted.find(item => sourceFormId(item) === id)), inherited: true } : { submitted: false, sources: partial, inherited: partial.length > 0, partial: partial.length > 0 };
}

export function applyPreviousCredits(matrix, work, files = []) {
  const cells = matrix.cells.map(cell => {
    const credit = activityCredit(cell.form_id, work.filter(item => item.user_id === cell.user_id));
    const sourceIds = relatedWork(cell.form_id, work.filter(item => item.user_id === cell.user_id)).map(sourceFormId);
    const matching = files.filter(file => file.user_id === cell.user_id && (file.form_id === cell.form_id || fileActivityTargets(file).includes(cell.form_id) || sourceIds.includes(file.form_id)));
    const next = { ...cell, file_ids: matching.map(file => file.id), files: Math.max(cell.files ?? 0, matching.length) };
    if (credit.teacherCredit && !['submitted', 'edited'].includes(cell.state)) return { ...next, state: 'credited', teacher_credit: true };
    if (credit.inherited && !['submitted', 'edited'].includes(cell.state)) return { ...next, state: credit.submitted ? 'submitted' : 'draft', previous_form_id: sourceFormId(credit.sources[0]) };
    if (next.files && cell.state === 'pending') return { ...next, state: 'draft' };
    return next;
  });
  return { ...matrix, cells, activities: matrix.activities.map(activity => {
    const submitted = cells.filter(cell => cell.form_id === activity.id && ['submitted', 'edited', 'credited'].includes(cell.state)).length;
    return { ...activity, submitted, missing: matrix.students.length - submitted };
  }).sort(courseOrder) };
}
