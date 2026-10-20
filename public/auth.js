import { isConfigured } from './submission.js';

export class CourseError extends Error {
  constructor(message, status = 0, code = '') { super(message); this.status = status; this.code = code; }
}

export const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,29}$/;
export const pinPattern = /^[0-9]{4,6}$/;
export const normalizeUsername = value => String(value ?? '').trim().toLowerCase();
const STORAGE_KEY = 'aula-sierra-session';

const accessErrors = {
  invalid_credentials: 'Usuario o PIN incorrectos.',
  invalid_username: 'El usuario debe tener de 3 a 30 letras sin acentos, números, punto, guion o guion bajo.',
  invalid_name: 'Escribe tu nombre completo (de 2 a 120 caracteres).',
  invalid_pin: 'El PIN debe tener de 4 a 6 números.',
  username_taken: 'Ese usuario ya existe. Elige otro o entra con tu PIN.',
};

// Solo el token de sesión se guarda en sessionStorage: sobrevive a recargas de la pestaña y se borra al cerrarla.
function storage() { try { return globalThis.sessionStorage ?? null; } catch { return null; } }
function readStored() {
  try { const value = JSON.parse(storage()?.getItem(STORAGE_KEY) ?? 'null'); return /^[0-9a-f]{64}$/.test(value?.token ?? '') && value.user?.id ? value : null; } catch { return null; }
}
function writeStored(session) {
  try { if (session) storage()?.setItem(STORAGE_KEY, JSON.stringify(session)); else storage()?.removeItem(STORAGE_KEY); } catch { /* La sesión sigue en memoria. */ }
}

export function createAuth(config, fetcher = fetch) {
  let session = readStored();
  let generation = 0;
  const base = config?.supabaseUrl?.replace(/\/$/, '');

  async function request(name, body) {
    if (!isConfigured(config)) throw new CourseError('El acceso al curso todavía no está habilitado. Contacta al instructor.');
    if (!/^course_[a-z_]+$/.test(name)) throw new CourseError('Ruta no permitida.');
    const headers = { apikey: config.supabaseKey, 'Content-Type': 'application/json' };
    if (!config.supabaseKey.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${config.supabaseKey}`;
    let response;
    try { response = await fetcher(`${base}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(18000) }); }
    catch { throw new CourseError('No pudimos conectar. Revisa tu conexión e inténtalo otra vez.'); }
    let result = null;
    try { result = await response.json(); } catch { /* Algunas respuestas no traen cuerpo. */ }
    if (!response.ok) {
      const code = result?.code ?? '';
      const messages = {
        PT401: 'Tu sesión terminó. Vuelve a entrar con tu usuario y PIN.',
        PT409: 'Hay una versión más reciente de esta actividad. Descarga tu copia y vuelve a abrirla antes de continuar.',
        PT403: 'Esta actividad está cerrada. El instructor la ocultó o ya terminó el plazo para editar.',
        PT404: 'No encontramos este archivo.',
        PT413: 'El archivo supera 5 MB. Elige uno más pequeño.',
        PT415: 'Tipo de archivo no permitido. Usa foto (JPG, PNG, WebP), PDF, Word, Excel, PowerPoint o texto.',
        PT429: 'Ya adjuntaste 5 archivos en esta actividad. Quita uno para agregar otro.',
        PGRST202: 'El curso necesita terminar su configuración. Avisa al instructor.',
        '42P01': 'El curso necesita terminar su configuración. Avisa al instructor.',
      };
      throw new CourseError(messages[code] ?? (response.status === 429 ? 'Demasiados intentos. Espera unos minutos antes de volver a intentar.' : response.status === 403 ? 'No tienes permiso para realizar esta acción.' : 'No pudimos completar la operación. Inténtalo otra vez.'), response.status, code);
    }
    return result;
  }

  function install(result, ticket) {
    if (generation !== ticket) throw new CourseError('Vuelve a iniciar sesión.', 401);
    if (result?.ok !== true) {
      if (result?.error === 'locked') throw new CourseError(`Demasiados intentos. Espera ${Math.max(1, Math.ceil(Number(result.retry_after ?? 900) / 60))} minutos o pide al instructor que restablezca tu PIN.`, 429, 'locked');
      throw new CourseError(accessErrors[result?.error] ?? 'No pudimos confirmar tu acceso. Inténtalo otra vez.', 400, result?.error ?? '');
    }
    if (!/^[0-9a-f]{64}$/.test(result.token ?? '') || !result.user?.id) throw new CourseError('No pudimos confirmar tu acceso. Inténtalo otra vez.');
    session = { token: result.token, user: { id: result.user.id, username: result.user.username } };
    writeStored(session);
    return session.user;
  }

  function clear() { generation++; session = null; writeStored(null); }

  return {
    get user() { return session?.user ?? null; },
    async signIn(username, pin) {
      const ticket = ++generation;
      session = null; writeStored(null);
      return install(await request('course_login', { p_username: normalizeUsername(username), p_pin: String(pin) }), ticket);
    },
    async signUp(name, username, pin) {
      const ticket = ++generation;
      session = null; writeStored(null);
      return install(await request('course_register', { p_username: normalizeUsername(username), p_full_name: name.trim(), p_pin: String(pin) }), ticket);
    },
    async rpc(name, body = {}) {
      if (!session) throw new CourseError('Debes iniciar sesión para continuar.', 401);
      const current = session;
      try { return await request(name, { p_token: current.token, ...body }); }
      catch (error) { if (error.code === 'PT401' && session === current) clear(); throw error; }
    },
    async signOut() {
      const old = session;
      clear();
      if (old) { try { await request('course_logout', { p_token: old.token }); } catch { /* La sesión local ya se borró. */ } }
    },
  };
}
