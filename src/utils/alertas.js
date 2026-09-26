// ── «Te aviso si aparece alguien» (docs/perfil-vivo.md §10) ─────────────
//
// Solo con el SI de la persona. Se guarda el oficio, nunca la frase; caduca
// a los 3 meses y se borra desde el perfil. Avisa por las dos vias que
// decidio el fundador: notificacion en el movil y correo (el de SU cuenta).
//
// Este movil guarda, por cada alerta, la llave con la que se consulta y se
// borra (`nura_alertas`). Empieza por `nura_`: «Borrar mis datos» la borra.

import { porLaFuncion, llamarFuncion, ultimaLlave } from './escrituras'
import { apuntarEspera, borrarEsperas } from './esperando'
import { EDGE_URL } from '../config'
import { categoriasEnBD } from './matching'

const CLAVE = 'nura_alertas'

export function alertasGuardadas() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || '[]') || [] }
  catch { return [] }
}

function guardar(lista) {
  try { localStorage.setItem(CLAVE, JSON.stringify(lista.slice(-20))) }
  catch { /* sin almacenamiento no se puede consultar despues; la alerta sigue en el servidor */ }
}

/** ¿Puede este navegador recibir notificaciones? En iPhone, solo desde la pantalla de inicio. */
export function movilPuedeAvisar() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function esIphoneSinInstalar() {
  if (typeof navigator === 'undefined') return false
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const instalada = window.matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone
  return ios && !instalada
}

const aBytes = b64 => {
  const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - b64.length % 4) % 4))
  return Uint8Array.from(s, c => c.charCodeAt(0))
}

/**
 * Pide permiso y suscribe este movil. Devuelve la suscripcion, o
 * { motivo } si no se puede: 'no-disponible' | 'denegado' | 'error'.
 */
export async function suscribirMovil(ambito = '/') {
  if (!movilPuedeAvisar() || !porLaFuncion()) return { motivo: 'no-disponible' }
  // Con tiempo maximo: si el movil no contesta, se guarda la alerta igual
  // (se vera en el perfil) en vez de dejar «Guardando…» para siempre.
  const conTope = (promesa, ms) => Promise.race([promesa, new Promise((_, no) => setTimeout(() => no(new Error('tiempo')), ms))])
  try {
    const permiso = await conTope(Notification.requestPermission(), 60000)
    if (permiso !== 'granted') return { motivo: 'denegado' }
    return await conTope((async () => {
      // `ambito` separa los canales: '/pro/' es el de «te han escrito» de la
      // profesional (el trabajador sabe por su ambito que aviso enseñar).
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: ambito })
      if (ambito === '/') await navigator.serviceWorker.ready
      else if (!reg.active) await new Promise(ok => { const w = reg.installing || reg.waiting; if (!w) return ok(); w.addEventListener('statechange', () => w.state === 'activated' && ok()) })
      const ya = await reg.pushManager.getSubscription()
      if (ya) return { suscripcion: ya.toJSON() }
      const r = await llamarFuncion({ op: 'clave-push' })
      if (!r?.ok || !r.clave) return { motivo: 'error' }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(r.clave) })
      return { suscripcion: sub.toJSON() }
    })(), 15000)
  } catch { return { motivo: 'error' } }
}

/**
 * Guarda la alerta. `movil`: la suscripcion (o null). `sesion`: el token de
 * la cuenta si quiere correo; el servidor saca el correo de ahi.
 */
export async function crearAlerta({ categoria, que, movil, sesion, zona, ciudad }) {
  if (!porLaFuncion()) return { ok: false, motivo: 'sin-servidor' }
  try {
    const r = await llamarFuncion({
      op: 'crear-alerta', categorias: categoriasEnBD(categoria), que,
      push: movil || undefined, sesion: sesion || undefined,
      // Solo el nombre del barrio: el servidor pone el centro del barrio.
      zona: zona?.nombre ? { nombre: zona.nombre } : undefined,
      // Sin barrio, la ciudad (el servidor solo acepta las de la lista).
      ciudad: !zona?.nombre && ciudad ? ciudad : undefined,
    })
    if (!r?.ok) return { ok: false, motivo: r?.estado === 429 ? 'demasiadas' : 'error' }
    guardar([...alertasGuardadas(), { llave: r.llave, que, categoria, zona: zona?.nombre || null, ciudad: !zona?.nombre && ciudad ? ciudad : null, creada: new Date().toISOString(),
      caduca_en: r.caduca_en, canales: r.canales, visto: 0 }])
    return { ok: true, canales: r.canales, correoActivo: r.correoActivo }
  } catch { return { ok: false, motivo: 'error' } }
}

/**
 * ¿Ya hay una alerta de este oficio en este movil que cubra esa ciudad? Una
 * sin ciudad ni barrio cubre todas; una de Barcelona no cubre Madrid.
 */
export function tieneAlerta(categoria, ciudad = null) {
  return alertasGuardadas().some(a => a.categoria === categoria && (!a.caduca_en || new Date(a.caduca_en) > new Date())
    && (!ciudad || (a.ciudad || null) === ciudad || (!a.ciudad && !a.zona)))
}

/**
 * Las alertas de este movil, con quien ha llegado. Si el servidor no
 * responde se devuelven las guardadas: no se borra nada por falta de red.
 */
export async function misAlertas() {
  const locales = alertasGuardadas()
  if (!locales.length || !porLaFuncion()) return locales.map(a => ({ ...a, encontrados: [] }))
  try {
    const r = await llamarFuncion({ op: 'alertas', llaves: locales.map(a => a.llave) })
    if (!r?.ok) return locales.map(a => ({ ...a, encontrados: [] }))
    const delServidor = new Map((r.alertas || []).map(a => [a.llave, a]))
    // Las que el servidor ya no tiene (caducadas o quitadas por correo) se
    // olvidan tambien aqui.
    const vivas = locales.filter(a => delServidor.has(a.llave))
    guardar(vivas)
    return vivas.map(a => ({ ...a, ...delServidor.get(a.llave) }))
  } catch { return locales.map(a => ({ ...a, encontrados: [] })) }
}

/** Marca como vistos los que han llegado, para no volver a destacarlos. */
export function marcarVistas(lista) {
  const vistos = new Map(lista.map(a => [a.llave, (a.encontrados || []).length]))
  guardar(alertasGuardadas().map(a => vistos.has(a.llave) ? { ...a, visto: vistos.get(a.llave) } : a))
}

export async function quitarAlerta(llave) {
  guardar(alertasGuardadas().filter(a => a.llave !== llave))
  if (!porLaFuncion()) return true
  try { const r = await llamarFuncion({ op: 'quitar-alerta', llave }); return Boolean(r?.ok) || r?.estado === 404 }
  catch { return false }
}

/** ¿Le quedan 14 dias o menos? Entonces se ofrece renovarla. */
export const caducaPronto = a => Boolean(a?.caduca_en) && new Date(a.caduca_en) - Date.now() < 14 * 864e5

/** Tres meses mas desde hoy. Devuelve la nueva fecha, o null si no se pudo. */
export async function renovarAlerta(llave) {
  if (!porLaFuncion()) return null
  try {
    const r = await llamarFuncion({ op: 'renovar-alerta', llave })
    if (!r?.ok) return null
    guardar(alertasGuardadas().map(a => a.llave === llave ? { ...a, caduca_en: r.caduca_en } : a))
    return r.caduca_en
  } catch { return null }
}

/** Desde el enlace «dejar de avisarme» del correo. */
export async function quitarPorBaja(baja) {
  if (!porLaFuncion()) return { ok: false }
  try {
    const r = await llamarFuncion({ op: 'quitar-alerta', baja })
    return r?.ok ? { ok: true } : { ok: false, yaNoExiste: r?.estado === 404 }
  } catch { return { ok: false } }
}

/** Antes de «Borrar mis datos»: quita tambien del servidor. */
export async function quitarTodas() {
  await Promise.all(alertasGuardadas().map(a => quitarAlerta(a.llave)))
  borrarEsperas()   // y a quien esperaba respuesta («Avísame cuando conteste»)
}

/**
 * «Avísame cuando conteste»: una notificación en ESTE móvil cuando el
 * profesional responda a la última conversación. Devuelve
 * { ok } o { ok: false, motivo: 'no-disponible' | 'denegado' | 'sin-llave' | 'error' }.
 */
export async function avisarCuandoConteste(helperId, nombre) {
  if (!porLaFuncion()) return { ok: false, motivo: 'no-disponible' }
  const llave = ultimaLlave(helperId)
  if (!llave) return { ok: false, motivo: 'sin-llave' }
  const r = await suscribirMovil()
  if (!r.suscripcion) return { ok: false, motivo: r.motivo || 'error' }
  try {
    const s = await llamarFuncion({ op: 'avisar-respuesta', llave, push: r.suscripcion })
    if (!s?.ok) return { ok: false, motivo: s?.estado === 404 ? 'ya-contesto' : 'error' }
  } catch { return { ok: false, motivo: 'error' } }
  await apuntarEspera({ llave, helperId, nombre }, EDGE_URL)
  return { ok: true }
}

// ── «Avísame cuando me escriban» (la profesional) ─────────────────────────
// Un canal aparte (ámbito '/pro/') para que el trabajador sepa que el aviso
// es «te han escrito» sin que viaje nada en él.
const AVISOS_PRO = 'nura_avisos_pro'
export const avisosProActivos = () => { try { return localStorage.getItem(AVISOS_PRO) === '1' } catch { return false } }

export async function activarAvisosPro(sesion) {
  if (!porLaFuncion() || !sesion) return { ok: false, motivo: 'no-disponible' }
  const r = await suscribirMovil('/pro/')
  if (!r.suscripcion) return { ok: false, motivo: r.motivo || 'error' }
  try {
    const s = await llamarFuncion({ op: 'avisos-pro', sesion, push: r.suscripcion })
    if (!s?.ok) return { ok: false, motivo: 'error' }
  } catch { return { ok: false, motivo: 'error' } }
  try { localStorage.setItem(AVISOS_PRO, '1') } catch { /* sin memoria: el servidor ya lo tiene */ }
  return { ok: true }
}

export async function desactivarAvisosPro(sesion) {
  try { localStorage.removeItem(AVISOS_PRO) } catch { /* nada */ }
  try {
    const reg = await navigator.serviceWorker?.getRegistration('/pro/')
    await (await reg?.pushManager.getSubscription())?.unsubscribe()
    await reg?.unregister()
  } catch { /* si no se puede, el servidor lo borra igual */ }
  if (!porLaFuncion() || !sesion) return false
  try { return Boolean((await llamarFuncion({ op: 'avisos-pro', sesion, quitar: true }))?.ok) } catch { return false }
}
