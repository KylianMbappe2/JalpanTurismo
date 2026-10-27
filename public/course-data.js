import { forms, getQuestions, extraFields, getAnswerQuestions } from './forms.js';
import { activityGroup } from './activity-groups.js';
import { activityCredit } from './activity-credit.js';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function workState(work) {
  if (!work) return 'pending';
  if (work.teacher_credit) return 'credited';
  if (work.status === 'submitted' && work.resubmitted_at) return 'edited';
  return work.status === 'submitted' ? 'submitted' : 'draft';
}
export const statusLabel = work => ({ pending: 'Pendiente', draft: 'En progreso', submitted: 'Entregada', edited: 'Editada tras entrega', credited: 'Acreditada por docente' })[workState(work)];
export function activityOpen(activity) {
  if (!activity || activity.is_published === false || activity.editable === false) return false;
  if (activity.lock_after_due && activity.due_at && Number.isFinite(new Date(activity.due_at).getTime()) && new Date(activity.due_at).getTime() <= Date.now()) return false;
  return true;
}
export function closedReason(activity) {
  if (activity?.closed_reason) return activity.closed_reason;
  if (activity?.is_published === false) return 'El instructor ocultó esta actividad.';
  if (activity?.lock_after_due) return 'El plazo para editar esta actividad ya terminó.';
  return 'Esta actividad está cerrada.';
}
export function activityAction(work, activity) {
  if (!activityOpen(activity)) return work?.status === 'submitted' ? 'Ver entrega' : 'Ver actividad';
  if (work?.status === 'submitted') return 'Editar entrega';
  return work ? 'Continuar' : 'Comenzar';
}
const trackLabels = { pending: 'Pendiente', draft: 'En progreso', submitted: 'Entregada', edited: 'Editada tras entrega', credited: 'Acreditada por docente' };
export function trackingCsv(matrix) {
  const activities = matrix?.activities ?? [];
  const cells = matrix?.cells ?? [];
  const rows = [['Alumno', 'Usuario', ...activities.map(activity => activity.title)]];
  for (const student of matrix?.students ?? []) {
    rows.push([student.full_name, student.username, ...activities.map(activity => trackLabels[cells.find(cell => cell.user_id === student.user_id && cell.form_id === activity.id)?.state] ?? 'Pendiente')]);
  }
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
export function courseProgress(activities, work) {
  const published = activities.filter(a => a.is_published !== false && activityGroup(a) !== 'extras');
  const completed = published.filter(a => activityCredit(a.id, work).submitted).length;
  return { completed, total: published.length, percent: published.length ? Math.round(completed / published.length * 100) : 0 };
}
export function formatDate(value) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
export function csvCell(value) {
  let text = Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? value ? 'Sí' : 'No' : String(value ?? '');
  if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function responsesCsv(records) {
  const rows = [['Folio', 'Fecha', 'Actividad', 'Nombre', 'Correo', 'Teléfono', 'Negocio', 'Municipio', 'Pregunta', 'Respuesta', 'Preguntas al instructor']];
  for (const record of records) {
    const form = forms.find(f => f.id === record.form_id);
    const questions = form ? getAnswerQuestions(form) : [];
    const entries = questions.length ? questions.flatMap(q => [q, ...(extraFields[q.id] ? [{ ...extraFields[q.id] }] : [])]) : [{ id: '', label: 'Sin respuestas registradas' }];
    for (const q of entries) rows.push([record.id, record.submitted_at, form?.title ?? record.form_id, record.full_name, record.email, record.phone, record.business, record.municipality, q.label, record.answers?.[q.id] ?? '', record.questions]);
  }
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
export function downloadText(text, name, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Descarta respuestas de preguntas que ya no existen u opciones retiradas, para que los borradores antiguos sigan guardando.
export function knownAnswers(form, answers = {}) {
  const result = {};
  for (const q of getAnswerQuestions(form)) {
    const value = answers?.[q.id];
    if (value !== undefined) {
      if (q.type === 'radio') { if (q.options.includes(value)) result[q.id] = value; }
      else if (q.type === 'multi') { const kept = Array.isArray(value) ? value.filter(item => q.options.includes(item)) : []; if (kept.length) result[q.id] = kept; }
      else result[q.id] = value;
    }
    const extra = extraFields[q.id];
    if (extra && typeof answers?.[extra.id] === 'string') result[extra.id] = answers[extra.id];
  }
  return result;
}

export const fileLimits = { maxBytes: 5 * 1024 * 1024, maxFiles: 5, perSlot: 3, types: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'] };
export const fileAccept = 'image/jpeg,image/png,image/webp,application/pdf,text/plain,.docx,.xlsx,.pptx';
const extensionTypes = { docx: fileLimits.types[5], xlsx: fileLimits.types[6], pptx: fileLimits.types[7], txt: 'text/plain', pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
export const fileType = file => fileLimits.types.includes(file.type) ? file.type : extensionTypes[String(file.name).split('.').pop().toLowerCase()] ?? '';
export const formatSize = bytes => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
export function base64ToBlob(data, type) {
  const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  return new Blob([bytes], { type });
}

// Comparamos lo que muestra el formulario, independientemente del orden de claves de jsonb.
export function workFingerprint(payload) {
  const form = forms.find(form => form.id === payload?.form_id);
  const answers = payload?.answers ?? {};
  return JSON.stringify([
    payload?.id, payload?.form_id, payload?.version,
    ['name', 'email', 'phone', 'business', 'municipality'].map(key => payload?.participant?.[key] ?? ''),
    (form ? getQuestions(form) : []).map(q => [q.id, q.type === 'multi' ? [...(answers[q.id] ?? [])].sort() : answers[q.id] ?? (q.type === 'check' ? false : ''), extraFields[q.id] ? answers[extraFields[q.id].id] ?? '' : null]),
    payload?.questions ?? '', payload?.consent === true,
  ]);
}

export function createCourseData(auth) {
  const completing = new Map();
  async function recoverWork(payload, revision) {
    const result = await auth.rpc('course_load');
    return result?.work?.find(work => work.form_id === payload.form_id && work.payload?.id === payload.id
      && workFingerprint(work.payload) === workFingerprint(payload)
      && Number.isInteger(work.revision) && work.revision >= revision);
  }
  const uncertain = error => !error.status || error.status >= 500;
  return {
    async load() {
      const result = await auth.rpc('course_load');
      if (!result?.profile || !['student', 'instructor'].includes(result.role) || !Array.isArray(result.activities) || !Array.isArray(result.work)) throw new Error('No pudimos cargar tu curso. Inténtalo otra vez.');
      return { context: { role: result.role, profile: result.profile }, activities: result.activities, work: result.work, files: Array.isArray(result.files) ? result.files : [] };
    },
    async save(payload, step, revision) {
      try {
        const work = await auth.rpc('course_save', { p_payload: payload, p_step: step, p_revision: revision });
        if (work?.form_id !== payload.form_id || work?.payload?.id !== payload.id || !Number.isInteger(work.revision)) throw new Error('No recibimos la confirmación de guardado. Inténtalo otra vez.');
        return work;
      } catch (error) {
        if (uncertain(error)) {
          try { const work = await recoverWork(payload, revision); if (work) return work; } catch { /* Conservamos el error original y las respuestas. */ }
        }
        throw error;
      }
    },
    async complete(payload, revision) {
      const snapshot = structuredClone(payload);
      // El folio se conserva en aula_work por usuario/actividad y en cada reintento.
      const key = `${auth.user?.id}:${snapshot.form_id}:${snapshot.id}`;
      const fingerprint = workFingerprint(snapshot);
      if (completing.has(key)) {
        const pending = completing.get(key);
        if (pending.fingerprint !== fingerprint) throw new Error('Espera a que termine la entrega en curso.');
        return pending.promise;
      }
      const confirm = async () => {
        const result = await auth.rpc('course_complete', { p_payload: snapshot, p_revision: revision });
        if (result?.id !== snapshot.id || result.saved !== true || result.work?.status !== 'submitted') throw new Error('No recibimos la confirmación de tu entrega. Inténtalo otra vez.');
        return result;
      };
      const promise = (async () => {
        try {
          return await confirm();
        } catch (error) {
          if (uncertain(error)) {
            try {
              const result = await auth.rpc('course_load');
              const work = result?.work?.find(work => work.form_id === snapshot.form_id && work.response_id === snapshot.id && work.status === 'submitted');
              // aula_work puede contener un borrador posterior. Solo course_complete compara
              // la entrega oficial y devuelve su recibo idempotente antes de revisar PT409.
              // Conservamos la revisión ORIGINAL: nunca sobreescribimos el trabajo de otra pestaña.
              if (work) return await confirm();
            } catch (confirmationError) {
              if (['PT401', 'PT403', 'PT409'].includes(confirmationError.code)) throw confirmationError;
              // Una consulta fallida nunca confirma una entrega; conservamos el error inicial.
            }
          }
          throw error;
        }
      })();
      completing.set(key, { fingerprint, promise });
      try { return await promise; } finally { completing.delete(key); }
    },
    async instructor(offset = 0) {
      const result = await auth.rpc('course_instructor', { p_offset: offset });
      if (![result?.profiles, result?.work, result?.responses].every(Array.isArray)) throw new Error('No pudimos cargar el panel docente.');
      return result;
    },
    async response(id) {
      const rows = await this.exportResponses([id]);
      if (!rows[0]) throw new Error('No encontramos esta entrega o no tienes acceso.');
      return rows[0];
    },
    setActivity(id, published, dueAt, lockAfterDue = false) { return auth.rpc('course_set_activity', { p_form_id: id, p_published: published, p_due_at: dueAt || null, p_lock_after_due: Boolean(lockAfterDue) }); },
    async tracking() {
      const result = await auth.rpc('course_tracking');
      if (![result?.students, result?.activities, result?.cells].every(Array.isArray)) throw new Error('No pudimos cargar el seguimiento.');
      return result;
    },
    async studentWork(userId, formId) {
      const result = await auth.rpc('course_student_work', { p_user_id: userId, p_form_id: formId });
      if (!result?.user?.user_id || !result.state) throw new Error('No pudimos abrir el trabajo de este alumno.');
      return result;
    },
    async uploadFile(formId, name, type, base64, slot = null) {
      const file = await auth.rpc('course_upload_file', { p_form_id: formId, p_name: name, p_mime: type, p_data: base64, ...(slot ? { p_slot: slot } : {}) });
      if (!file?.id || file.form_id !== formId) throw new Error('No recibimos la confirmación del archivo. Inténtalo otra vez.');
      return file;
    },
    deleteFile(id) { return auth.rpc('course_delete_file', { p_file_id: id }); },
    async downloadFile(id) {
      const file = await auth.rpc('course_download_file', { p_file_id: id });
      if (typeof file?.data !== 'string') throw new Error('No pudimos descargar el archivo.');
      return file;
    },
    resetPin(userId, pin) { return auth.rpc('course_reset_pin', { p_user_id: userId, p_pin: pin }); },
    async exportResponses(ids) {
      // Export exactly the visible list, preserving current filters and pagination.
      const allowed = ids.filter(id => /^[0-9a-f-]{36}$/i.test(id));
      if (!allowed.length) return [];
      const rows = await auth.rpc('course_responses', { p_ids: allowed });
      if (!Array.isArray(rows)) throw new Error('No pudimos descargar las entregas.');
      return rows;
    },
  };
}
