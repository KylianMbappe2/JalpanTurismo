import { forms, extraFields, getQuestions } from './forms.js';

export function validateSubmission(data) {
  const errors = {};
  const form = forms.find(f => f.id === data.form_id && f.version === data.version);
  if (!form) return { form_id: 'Selecciona una actividad válida.' };
  const person = data.participant ?? {};
  if (typeof person.name !== 'string' || person.name.trim().length < 2 || person.name.trim().length > 120) errors.name = 'Escribe tu nombre completo (de 2 a 120 caracteres).';
  for (const [key, max] of Object.entries({ email: 254, phone: 30, business: 160, municipality: 120 })) {
    if (person[key] !== undefined && (typeof person[key] !== 'string' || person[key].length > max)) errors[key] = `Revisa este dato (máximo ${max} caracteres).`;
  }
  if (person.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) errors.email = 'Escribe un correo válido o deja el campo vacío.';
  if (person.phone && (!/^[+()\d\s.-]+$/.test(person.phone) || person.phone.replace(/\D/g, '').length < 7)) errors.phone = 'Escribe un teléfono válido o deja el campo vacío.';
  const answers = data.answers;
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return { ...errors, answers: 'Revisa las respuestas.' };
  const questions = getQuestions(form);
  const allowed = new Set(questions.flatMap(q => [q.id, ...(extraFields[q.id] ? [extraFields[q.id].id] : [])]));
  if (Object.keys(answers).some(key => !allowed.has(key))) errors.answers = 'La actividad contiene respuestas desconocidas.';
  for (const q of questions) {
    const value = answers[q.id];
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      if (q.required) errors[q.id] = 'Responde esta pregunta para continuar.';
      continue;
    }
    if (q.type === 'text' && (typeof value !== 'string' || value.length > 4000 || (q.required && !value.trim()))) errors[q.id] = 'Escribe una respuesta de hasta 4,000 caracteres.';
    if (q.type === 'radio' && !q.options.includes(value)) errors[q.id] = 'Selecciona una de las opciones.';
    if (q.type === 'multi' && (!Array.isArray(value) || value.some(v => !q.options.includes(v)) || new Set(value).size !== value.length)) errors[q.id] = 'Revisa las opciones seleccionadas.';
    if (q.type === 'check' && typeof value !== 'boolean') errors[q.id] = 'Revisa esta casilla.';
  }
  for (const extra of Object.values(extraFields)) {
    if (answers[extra.id] !== undefined && (typeof answers[extra.id] !== 'string' || answers[extra.id].length > 300)) errors[extra.id] = 'Usa hasta 300 caracteres.';
  }
  if (typeof data.questions !== 'string' || data.questions.length > 2000) errors.questions = 'Escribe hasta 2,000 caracteres.';
  if (data.consent !== true) errors.consent = 'Necesitamos tu autorización para guardar esta entrega.';
  if (typeof data.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.id)) errors.id = 'Vuelve a abrir la actividad.';
  return errors;
}

export function isConfigured(config) {
  try {
    const url = new URL(config?.supabaseUrl);
    const key = config?.supabaseKey;
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || !key) return false;
    if (key.startsWith('sb_publishable_') && key.length > 20) return true;
    const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role === 'anon';
  } catch { return false; }
}

export async function submitResponse(config, data, fetcher = fetch) {
  if (!isConfigured(config)) throw new Error('El formulario aún no está habilitado para recibir respuestas. Contacta a quien imparte el taller.');
  if (Object.keys(validateSubmission(data)).length) throw new Error('Revisa tus datos y respuestas antes de enviar.');
  const headers = { 'Content-Type': 'application/json', apikey: config.supabaseKey };
  if (!config.supabaseKey.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${config.supabaseKey}`;
  let response;
  try {
    response = await fetcher(`${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/submit_workshop_response`, {
      method: 'POST', headers, body: JSON.stringify({ p_payload: data }), signal: AbortSignal.timeout(20000),
    });
  } catch { throw new Error('No pudimos confirmar el envío. Revisa tu conexión e inténtalo otra vez; conservamos tus respuestas en esta pantalla.'); }
  if (response.status === 409) throw new Error('Esta entrega ya fue recibida con otras respuestas. Descarga tu copia y contacta a quien imparte el taller para corregirla.');
  if (!response.ok) throw new Error(response.status === 400 ? 'No se pudo guardar. Revisa tus respuestas o avisa a quien imparte el taller.' : 'No se pudo guardar en este momento. Inténtalo otra vez o avisa a quien imparte el taller.');
  let receipt;
  try { receipt = await response.json(); } catch { throw new Error('No recibimos la confirmación. Intenta enviar otra vez.'); }
  if (receipt?.id !== data.id || receipt?.saved !== true) throw new Error('No recibimos la confirmación. Intenta enviar otra vez.');
  return receipt;
}
