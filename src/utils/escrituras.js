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

function porLaFuncion() {
  return EDGE_WRITES && Boolean(EDGE_URL)
}

async function llamarFuncion(cuerpo) {
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
export async function altaProfesional(payload) {
  try {
    if (porLaFuncion()) {
      const r = await llamarFuncion({ op: 'alta', payload })
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

/**
 * LA VUELTA, ultimo tramo: ¿me han respondido?
 * Se pregunta con las llaves de lectura de este movil para ese profesional,
 * nunca por el profesional a secas: el servidor solo devuelve la respuesta
 * de cada conversacion a quien tiene su llave.
 */
export async function respuestasDe(helperId) {
  const llaves = llavesGuardadas()[String(helperId)] || []
  if (!porLaFuncion() || !llaves.length) return []
  try {
    const r = await llamarFuncion({ op: 'respuestas', llaves })
    return r?.respuestas || []
  } catch { return [] }
}

/** LA VUELTA: abrir el aviso con el token del enlace. Sin cuenta. */
export async function abrirAviso(token) {
  if (!porLaFuncion()) return { ok: false }
  try { return await llamarFuncion({ op: 'abrir-aviso', token }) }
  catch { return { ok: false } }
}

/** LA VUELTA: el profesional responde. Si falla, se dice — no se finge. */
export async function responderAviso(token, respuesta) {
  if (!porLaFuncion()) return { ok: false }
  try { return await llamarFuncion({ op: 'responder-aviso', token, respuesta }) }
  catch { return { ok: false } }
}

/**
 * Encolar el aviso a un profesional. **No bloquea ni avisa de fallos**: si
 * no sale, la persona no debe enterarse — su mensaje ya esta enviado.
 *
 * Se encola en el PRIMER mensaje de una conversacion, no al abrir el chat:
 * avisar por cada ojeada a una ficha seria ruido para el profesional.
 */
export async function encolarAviso(helperId, mensaje) {
  if (!porLaFuncion()) return
  try {
    const r = await llamarFuncion({ op: 'encolar-aviso', helperId, mensaje })
    if (r?.ok && r.lectura) guardarLlave(helperId, r.lectura)
  }
  catch { /* el aviso se pierde; el mensaje del usuario no */ }
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
