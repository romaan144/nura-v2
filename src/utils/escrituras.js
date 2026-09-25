// ── Las dos escrituras sobre `helpers`, en un solo sitio ─────────────────
//
// Antes iban con la clave publica `anon` desde dos ficheros distintos. Al
// cerrar el RLS dejan de funcionar, y su sitio es una Edge Function con
// `service_role` (supabase/functions/helpers-write).
//
// El interruptor esta APAGADO por defecto: hasta que la funcion este
// desplegada se sigue por el camino directo, que es el comportamiento
// actual. Asi desplegar el frontend no rompe nada, y el cambio ocurre
// cuando el fundador enciende VITE_EDGE_WRITES.

import { EDGE_WRITES, EDGE_URL } from '../config'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase'

const directas = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

export function porLaFuncion() {
  return EDGE_WRITES && Boolean(EDGE_URL)
}

export async function llamarFuncion(cuerpo) {
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return { ok: false, estado: res.status }
  return await res.json()
}

/** Alta profesional. Devuelve la fila creada, o null si no se publico. */
export async function altaProfesional(payload, declarado = []) {
  try {
    if (porLaFuncion()) {
      // `declarado`: lo que confirmo de la propuesta de la IA (utils/declarado.js).
      const r = await llamarFuncion({ op: 'alta', payload,
        declarado: declarado.map(({ clave, valor }) => ({ clave, valor })) })
      if (!r?.ok) { console.warn('[Nüra] alta rechazada por la funcion:', r?.estado ?? '?'); return null }
      return r.helper ?? null
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/helpers`, {
      method: 'POST',
      headers: { ...directas, Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) { console.warn('[Nüra] alta profesional rechazada:', res.status); return null }
    const data = await res.json()
    return data?.[0] || null
  } catch (e) {
    console.warn('[Nüra] alta profesional no guardada:', e?.message || e)
    return null
  }
}

// Llaves de lectura: una por conversacion, guardadas en ESTE movil. Cada
// una abre solo la respuesta a lo que se escribio desde aqui. No sirven para
// responder: esa llave es otra y solo la tiene el profesional.
const LLAVES = 'nura_llaves_aviso'

function llavesGuardadas() {
  try { return JSON.parse(localStorage.getItem(LLAVES) || '{}') || {} }
  catch { return {} }
}

function guardarLlave(helperId, llave) {
  try {
    const todas = llavesGuardadas()
    const k = String(helperId)
    todas[k] = [...new Set([...(todas[k] || []), llave])].slice(-20)
    localStorage.setItem(LLAVES, JSON.stringify(todas))
  } catch { /* sin almacenamiento no hay vuelta; el mensaje sigue enviado */ }
}

/** La llave de la conversacion mas reciente con ese profesional, o null. */
export function ultimaLlave(helperId) {
  return (llavesGuardadas()[String(helperId)] || []).at(-1) || null
}

/**
 * LA VUELTA, ultimo tramo: ¿me han respondido?
 * Se pregunta con las llaves de lectura de este movil para ese profesional,
 * nunca por el profesional a secas: el servidor solo devuelve la respuesta
 * de cada conversacion a quien tiene su llave.
 */
// Cada vez que llegan respuestas se avisa a la app: si traen una cita
// aceptada o rechazada, UserContext la marca en «Mis servicios».
function anunciarRespuestas(lista) {
  if (typeof window !== 'undefined' && lista.some(r => r.cita)) {
    window.dispatchEvent(new CustomEvent('nura:respuestas', { detail: lista }))
  }
  return lista
}

export async function respuestasDe(helperId) {
  const llaves = llavesGuardadas()[String(helperId)] || []
  if (!porLaFuncion() || !llaves.length) return []
  try {
    const r = await llamarFuncion({ op: 'respuestas', llaves })
    return anunciarRespuestas((r?.respuestas || []).map(x => ({ ...x, helperId: String(helperId) })))
  } catch { return [] }
}

/**
 * Todas las respuestas de todas las conversaciones de este movil, en una
 * sola pregunta: [{ llave, helperId, respuesta, respondido_en }].
 */
export async function respuestasTodas() {
  const todas = llavesGuardadas()
  const deLlave = new Map(Object.entries(todas).flatMap(([h, ls]) => ls.map(l => [l, h])))
  if (!porLaFuncion() || !deLlave.size) return []
  try {
    const r = await llamarFuncion({ op: 'respuestas', llaves: [...deLlave.keys()].slice(-50) })
    return anunciarRespuestas((r?.respuestas || []).map(x => ({ ...x, helperId: deLlave.get(x.llave) })))
  } catch { return [] }
}

// Llaves ya usadas para valorar: cada conversacion se valora una vez.
const VALORADAS = 'nura_llaves_valoradas'

function llavesValoradas() {
  try { return new Set(JSON.parse(localStorage.getItem(VALORADAS) || '[]')) }
  catch { return new Set() }
}

function marcarValorada(llave) {
  try { localStorage.setItem(VALORADAS, JSON.stringify([...llavesValoradas(), llave].slice(-100))) }
  catch { /* sin almacenamiento: el servidor ya impide repetir */ }
}

/**
 * PERFIL VIVO: lo que dice el cliente al terminar. Solo cuenta si viene de
 * una conversacion real con ese profesional (la llave de lectura lo prueba);
 * el servidor saca el profesional de la conversacion, no de lo que mande el
 * movil. Sin llave (o sin la funcion) se queda solo en este movil.
 * Devuelve 'publicada' | 'ya-valorada' | 'local'.
 */
export async function valorar(helperId, { estrellas, volveria, cualidades, comentario, publico }) {
  const usadas = llavesValoradas()
  const pendientes = (llavesGuardadas()[String(helperId)] || []).filter(l => !usadas.has(l)).reverse()
  if (!porLaFuncion() || !pendientes.length) return 'local'
  const cuerpo = {
    op: 'valorar',
    estrellas: estrellas || undefined,
    volveria: typeof volveria === 'boolean' ? volveria : undefined,
    cualidades: cualidades || [],
    comentario: publico ? comentario : undefined,
    publico: Boolean(publico && comentario?.trim()),
  }
  try {
    for (const llave of pendientes) {
      const r = await llamarFuncion({ ...cuerpo, llave })
      if (r?.ok) { marcarValorada(llave); return 'publicada' }
      if (r?.estado === 409) { marcarValorada(llave); continue }
      return 'local'
    }
    return 'ya-valorada'
  } catch { return 'local' }
}

/** Lo que se sabe de un profesional, cada dato con su prueba. Lectura publica. */
export async function atributosDe(helperId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/perfil_atributos?helper_id=eq.${encodeURIComponent(String(helperId))}&select=clave,fuente,valor,prueba`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, signal: AbortSignal.timeout(6000) },
    )
    return res.ok ? await res.json() : []
  } catch { return [] }
}

/** LA VUELTA: abrir el aviso con el token del enlace. Sin cuenta. */
export async function abrirAviso(token) {
  if (!porLaFuncion()) return { ok: false }
  // `sinRed`: no se pudo preguntar (no es que el enlace no valga).
  try {
    const r = await llamarFuncion({ op: 'abrir-aviso', token })
    return r?.ok || (r?.estado >= 400 && r?.estado < 500) ? r : { ...r, sinRed: true }
  }
  catch { return { ok: false, sinRed: true } }
}

/** LA VUELTA: el profesional responde. Si falla, se dice — no se finge. */
/** `cita`: 'aceptada' | 'rechazada' si el aviso traía una propuesta de cita. */
export async function responderAviso(token, respuesta, cita) {
  if (!porLaFuncion()) return { ok: false }
  try { return await llamarFuncion({ op: 'responder-aviso', token, respuesta, ...(cita ? { cita } : {}) }) }
  catch { return { ok: false } }
}

// Las horas que un profesional ya tiene aceptadas (de cualquiera): solo día
// y hora. Un minuto en memoria para no preguntar en cada toque.
const ocupadasCache = new Map()
export async function ocupadasDe(helperId) {
  if (!porLaFuncion() || !/^\d+$/.test(String(helperId ?? ''))) return []
  const ya = ocupadasCache.get(String(helperId))
  if (ya && Date.now() - ya.t < 60000) return ya.lista
  try {
    const r = await llamarFuncion({ op: 'ocupadas', helperId: String(helperId) })
    const lista = Array.isArray(r?.ocupadas) ? r.ocupadas : []
    ocupadasCache.set(String(helperId), { t: Date.now(), lista })
    return lista
  } catch { return [] }
}

/**
 * CANCELAR LA CITA. Con las llaves de lectura de este móvil para ese
 * profesional (solo quien la pidió puede). La hora vuelve a quedar libre
 * para todos. Devuelve 'ok' | 'fallo' | 'rechazado' | 'nada' (demo).
 */
export async function cancelarCitaServidor(helperId, fecha, hora) {
  if (!porLaFuncion()) return 'nada'
  const llaves = llavesGuardadas()[String(helperId)] || []
  if (!llaves.length) return 'nada'
  try {
    const r = await llamarFuncion({ op: 'cancelar-cita', llaves, fecha, hora })
    ocupadasCache.delete(String(helperId))
    // 404: ya no había nada que cancelar (nunca llegó, o ya se canceló).
    return r?.estado === 404 ? 'nada' : resultado(r)
  } catch { return 'fallo' }
}

/**
 * Encolar el aviso a un profesional. **No bloquea ni avisa de fallos**: si
 * no sale, la persona no debe enterarse — su mensaje ya esta enviado.
 *
 * Se encola en el PRIMER mensaje de una conversacion, no al abrir el chat:
 * avisar por cada ojeada a una ficha seria ruido para el profesional.
 */
// Resultado de mandar algo al profesional:
//   'ok'        — llegó al servidor
//   'fallo'     — sin conexión o el servidor no respondió: se puede reintentar
//   'rechazado' — el servidor lo rechazó (4xx): reintentar no lo arregla
//   'nada'      — demo, no hay servidor
const resultado = r => r?.ok ? 'ok' : (r?.estado >= 400 && r?.estado < 500 && r?.estado !== 408 && r?.estado !== 429 ? 'rechazado' : 'fallo')

export async function encolarAviso(helperId, mensaje, cita) {
  if (!porLaFuncion()) return 'nada'
  try {
    const r = await llamarFuncion({ op: 'encolar-aviso', helperId, mensaje, ...(cita ? { cita } : {}) })
    if (r?.ok && r.lectura) guardarLlave(helperId, r.lectura)
    return resultado(r)
  }
  catch { return 'fallo' }
}

/**
 * Registro de conversacion. No bloquea la interfaz si falla.
 *
 * APAGADO por defecto: la tabla real de Supabase **no tiene la columna
 * `chat_log`** (comprobado contra information_schema el 2026-08-08), asi que
 * cada mensaje lanzaba una peticion que el servidor rechazaba. Fallaba en
 * silencio —esta envuelta en try/catch— pero era ruido en cada mensaje.
 *
 * Y antes de encenderlo hay una decision de producto que tomar: guardar el
 * contenido de las conversaciones de la gente no es un detalle tecnico.
 * Para encenderlo: `alter table helpers add column chat_log text;` y poner
 * VITE_CHAT_LOG=true.
 */
export async function registrarConversacion(helperId, userMsg, helperReply) {
  if (String(import.meta?.env?.VITE_CHAT_LOG ?? '') !== 'true') return
  try {
    if (porLaFuncion()) {
      const r = await llamarFuncion({ op: 'chat-log', helperId, userMsg, helperReply })
      if (!r?.ok) console.warn('[Nüra] registro del chat rechazado:', r?.estado ?? '?')
      return
    }
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/helpers?id=eq.${helperId}&select=chat_log`, { headers: directas })
    const [existing] = await res.json()
    const entry = `[${new Date().toISOString()}]\nU: ${userMsg}\nH: ${helperReply}\n---\n`
    await fetch(`${SUPABASE_URL}/rest/v1/helpers?id=eq.${helperId}`, {
      method: 'PATCH',
      headers: directas,
      body: JSON.stringify({ chat_log: (existing?.chat_log || '') + entry }),
    })
  } catch (e) {
    console.warn('[Nüra] registro del chat no guardado:', e?.message || e)
  }
}

/** Une la cuenta con su ficha publica (etapa 6b). `token` es la sesion de
 *  Supabase; el servidor comprueba que el correo este confirmado y coincida
 *  con el contacto del alta. Devuelve { ok, helper } o { ok:false, motivo }. */
export async function reclamarFicha(token) {
  // Sin direccion de la funcion (en local no existe; vive en Vercel),
  // fetch('') haria un POST a la propia pagina. Se dice claro y ya.
  if (!EDGE_URL) return { ok: false, motivo: 'sin-servidor' }
  try { return await llamarFuncion({ op: 'reclamar-ficha', token }) } catch { return { ok: false, motivo: 'sin-red' } }
}

/** Borra la cuenta, la ficha publica y sus avisos (etapa 6c, RGPD). */
export async function borrarCuenta(token) {
  if (!EDGE_URL) return { ok: false, motivo: 'sin-servidor' }
  try { return await llamarFuncion({ op: 'borrar-cuenta', token }) } catch { return { ok: false, motivo: 'sin-red' } }
}

/**
 * EL PULSO: la semana real de la profesional (busquedas de su oficio, veces
 * que salio recomendada, mensajes recibidos y contestados). Necesita su
 * sesion. Devuelve null si no se puede saber: entonces no se enseñan cifras.
 */
/** La bandeja de la profesional: lo que le han escrito (solo de SU ficha). */
export async function misAvisos(sesion) {
  if (!porLaFuncion() || !sesion) return null
  try {
    const r = await llamarFuncion({ op: 'mis-avisos', sesion })
    return r?.ok ? r.avisos || [] : null
  } catch { return null }
}

export async function miPulso(sesion) {
  if (!porLaFuncion() || !sesion) return null
  try {
    const r = await llamarFuncion({ op: 'mi-pulso', sesion })
    return r?.ok ? r.pulso : null
  } catch { return null }
}

/**
 * SEGUIR LA CONVERSACION. Si el profesional aun no ha contestado, el mensaje
 * nuevo se añade a su aviso (lo vera todo junto). Si ya contesto, se le
 * manda un aviso nuevo (`cuerpoNuevo`, con el contexto). Nunca bloquea.
 */
export async function seguirConversacion(helperId, texto, cuerpoNuevo, cita) {
  if (!porLaFuncion()) return 'nada'
  const ultima = (llavesGuardadas()[String(helperId)] || []).at(-1)
  try {
    if (ultima) {
      const r = await llamarFuncion({ op: 'ampliar-aviso', llave: ultima, mensaje: texto, ...(cita ? { cita } : {}) })
      if (r?.ok) return 'ok'
      if (r?.estado !== 409 && r?.estado !== 404 && r?.estado !== 413) return resultado(r)
    }
    return await encolarAviso(helperId, cuerpoNuevo, cita)
  } catch { return 'fallo' }
}

// ── LOS MENSAJES QUE NO SALIERON ──────────────────────────────────────────
// Sin conexión, el aviso al profesional se perdía en silencio mientras el
// chat decía «Mensaje enviado». Ahora se guarda aquí, el chat lo marca como
// pendiente y sale solo al volver la conexión, EN ORDEN (el primero abre la
// conversación; los siguientes la amplían).
const PENDIENTES = 'nura_pendientes'
const leerPendientes = () => { try { return JSON.parse(localStorage.getItem(PENDIENTES) || '[]') || [] } catch { return [] } }
const guardarPendientes = l => {
  try { localStorage.setItem(PENDIENTES, JSON.stringify(l.slice(-50))) } catch { /* sin almacenamiento */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('nura:pendientes'))
}

/** Los ids de los mensajes del chat que aún no han salido. */
export const idsPendientes = () => new Set(leerPendientes().map(p => p.msgId))

const mandar = p => p.primero
  ? encolarAviso(p.helperId, p.cuerpo)
  : seguirConversacion(p.helperId, p.mensaje, p.cuerpoNuevo)

let reenviando = null
/** Intenta mandar los pendientes, en orden. Para en el primero que falle. */
export function reenviarPendientes() {
  if (reenviando) return reenviando
  reenviando = (async () => {
    try {
      for (;;) {
        const [p] = leerPendientes()
        if (!p) return
        const r = await mandar(p)
        if (r === 'fallo') return
        guardarPendientes(leerPendientes().filter(x => x.msgId !== p.msgId))
      }
    } finally { reenviando = null }
  })()
  return reenviando
}

/**
 * Manda al profesional lo que se escribe en el chat. Si no sale, queda
 * pendiente. Devuelve el resultado ('ok' | 'fallo' | 'rechazado' | 'nada').
 * { msgId, helperId, primero, mensaje, cuerpo, cuerpoNuevo }
 */
export async function enviarAlProfesional(p) {
  // Si ya hay pendientes, este va detrás: el orden importa.
  if (leerPendientes().length) {
    guardarPendientes([...leerPendientes(), p])
    await reenviarPendientes()
    return idsPendientes().has(p.msgId) ? 'fallo' : 'ok'
  }
  const r = await mandar(p)
  if (r === 'fallo') guardarPendientes([...leerPendientes(), p])
  return r
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { reenviarPendientes() })
  setTimeout(() => { if (leerPendientes().length) reenviarPendientes() }, 3000)
}

/**
 * LA PROPUESTA DE CITA LLEGA AL PROFESIONAL. Antes «Enviar solicitud» solo
 * la guardaba en el movil de quien la pedia y le decia «te confirmara en
 * breve»: al profesional no le llegaba nada. Ahora viaja por el mismo camino
 * que los mensajes, y su respuesta vuelve al chat.
 */
export async function enviarPropuestaCita(helper, fecha, hora, nota, nombre) {
  if (!porLaFuncion() || helper?.id == null) return false
  let cuando = fecha
  try { cuando = new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) } catch { /* fecha tal cual */ }
  const quien = nombre || 'Alguien'
  const texto = `${quien} te propone una cita: ${cuando}${hora ? ` a las ${hora}` : ''}.${nota?.trim() ? ` «${nota.trim()}»` : ''} ¿Te va bien?`
  // La cita viaja con día y hora: así la acepta con un botón y la hora
  // queda ocupada en su agenda para todos.
  const cita = fecha && hora ? { fecha, hora } : undefined
  const hayConversacion = (llavesGuardadas()[String(helper.id)] || []).length > 0
  if (hayConversacion) await seguirConversacion(helper.id, texto, `${texto}\n\n(Te escribe desde Nüra.)`, cita)
  else await encolarAviso(helper.id, `${texto}\n\n(Te escribe desde Nüra.)`, cita)
  return true
}
