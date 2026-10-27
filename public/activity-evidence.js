// Se vinculan evidencias por nombres explícitos; nunca se cambia su dueño ni su folio.
const normalize = value => String(value ?? '').replace(/([a-z])([A-Z])/g, '$1 $2').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[_-]+/g, ' ');
export function fileActivityTargets(file) {
  const name = normalize(file.name);
  const targets = [];
  if (/\b(flyers?|volantes?|cartel(?:es)?|posters?)(?=[^a-z]|$)/.test(name)) targets.push('flyers-ia');
  const contentCalendar = /contenido|publicacion|redes|editorial/.test(name);
  if (/calendario|parrilla|plan.*contenido/.test(name) && (contentCalendar || (!/temporada|estacional|festivo|puentes/.test(name) && !/^(pinal|sesion2)-/.test(file.form_id ?? '')))) targets.push('calendario-contenido');
  if (/google\s*maps|trip\s*advisor|airbnb|aribnb|airbnv|perfil.*turisti/.test(name)) targets.push('tema4-perfiles');
  if (/chatbot|agente.*\bia\b|bot.*personaliz/.test(name)) targets.push('agente-ia');
  if (/prompt.*conjunto/.test(name)) targets.push('prompt-conjunto');
  if (/ficha.*maestra/.test(name)) targets.push('tema4-perfiles');
  return [...new Set(targets)];
}

export function evidenceWork(work, files = []) {
  const projected = new Map();
  for (const file of files) for (const target of fileActivityTargets(file)) {
    if (target === file.form_id) continue;
    const source = work.find(item => item.form_id === file.form_id && (!file.user_id || item.user_id === file.user_id));
    const key = `${file.user_id ?? ''}/${file.form_id}/${target}`;
    const item = projected.get(key) ?? { form_id: target, source_form_id: file.form_id, user_id: file.user_id ?? source?.user_id,
      status: source?.status ?? 'draft', response_id: source?.response_id, saved_at: source?.saved_at ?? file.created_at, evidence_files: [] };
    item.evidence_files.push(file); projected.set(key, item);
  }
  return [...work, ...projected.values()];
}

export const sourceFormId = work => work.source_form_id ?? work.form_id;
