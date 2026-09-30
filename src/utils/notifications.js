// Web Push Notifications — no server needed for local notifications
import { getFirstName } from './name'
// Safari iOS 16.4+, Chrome, Firefox

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function scheduleLocalNotification(title, body, delayMs = 0, icon = '/logo-iso.png') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (delayMs === 0) {
    new Notification(title, { body, icon })
  } else {
    setTimeout(() => new Notification(title, { body, icon }), delayMs)
  }
}

// Sin cifras ni promesas inventadas. Antes había aquí avisos que decían
// «X está disponible», «nuevos profesionales se han unido cerca de ti» o
// «más de 1.200 profesionales verificados» sin saberlo; nadie los usaba y se
// han retirado para que nadie los use.

export function notifyServiceConfirmed(helperName) {
  scheduleLocalNotification(
    'Solicitud enviada',
    `${helperName} recibirá tu propuesta y te contestará en el chat.`
  )
}

// Un recordatorio tras buscar, si no ha escrito a nadie: uno solo (la
// siguiente búsqueda lo sustituye) y nada si mientras tanto escribió a alguien.
// Antes: uno por cada búsqueda, llegaba aunque ya hubiera escrito, y hablaba
// de «profesionales disponibles» sin saberlo.
let recordatorio = null
export function recordarTrasBuscar(helper, espera = 2 * 60 * 60 * 1000) {
  clearTimeout(recordatorio)
  if (!('Notification' in window) || Notification.permission !== 'granted' || !helper) return
  const desde = Date.now()
  const nombre = getFirstName(helper.name) || helper.name
  recordatorio = setTimeout(() => {
    try {
      const contactos = JSON.parse(localStorage.getItem('nura_contacted') || '[]')
      if (contactos.some(c => Number(c?.contactedAt) >= desde)) return
    } catch { /* sin memoria: se avisa igual */ }
    scheduleLocalNotification('¿Encontraste a quien buscabas?', `Si te encaja ${nombre}, puedes escribirle desde Nüra.`)
  }, espera)
}
