// Web Push Notifications — no server needed for local notifications
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

export function scheduleRetentionNotifications(userName = 'tú') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  // 24h reminder if no activity
  scheduleLocalNotification(
    '¿Encontraste lo que buscabas?',
    'Nüra tiene más de 1.200 profesionales verificados esperando.',
    24 * 60 * 60 * 1000
  )
}

export function notifyServiceConfirmed(helperName) {
  scheduleLocalNotification(
    'Solicitud enviada',
    `${helperName} recibirá tu solicitud y te confirmará en breve.`
  )
}

export function notifySearchComplete(count, specialty) {
  scheduleLocalNotification(
    `${count} profesionales encontrados`,
    `Nüra encontró ${count} ${specialty || 'profesionales'} cerca de ti.`
  )
}

// ── RETENTION TRIGGERS ────────────────────────────────────────────────────

export function notifyHelperViewed(helperName, specialty) {
  // Fires 2h after viewing a profile without contacting
  scheduleLocalNotification(
    `¿Contactaste con ${helperName}?`,
    `${helperName} está disponible. Solo tarda un mensaje.`,
    2 * 60 * 60 * 1000
  )
}

export function notifySearchAbandoned(specialty) {
  // Fires 4h after searching without contacting
  scheduleLocalNotification(
    'Tu búsqueda en Nüra',
    specialty
      ? `Encontramos ${specialty || 'profesionales'} disponibles. ¿Quieres continuar?`
      : 'Hay nuevos profesionales disponibles cerca de ti.',
    4 * 60 * 60 * 1000
  )
}

export function notifyMorningReminder(name, pendingCount) {
  // Morning nudge for pending services
  const now = new Date()
  const tomorrow9am = new Date(now)
  tomorrow9am.setDate(tomorrow9am.getDate() + 1)
  tomorrow9am.setHours(9, 0, 0, 0)
  const delay = tomorrow9am.getTime() - now.getTime()

  scheduleLocalNotification(
    `Buenos días${name ? `, ${name}` : ''}`,
    pendingCount > 0
      ? `Tienes ${pendingCount} servicio${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''} en Nüra.`
      : 'Nüra te ayuda a encontrar quien necesitas hoy.',
    delay
  )
}

export function notifyWeeklyDigest(newHelpers = 0) {
  // Weekly digest — 7 days after last notification
  scheduleLocalNotification(
    'Esta semana en Nüra',
    newHelpers > 0
      ? `${newHelpers} nuevos profesionales se han unido cerca de ti.`
      : 'Nuevos profesionales disponibles. ¿Qué necesitas esta semana?',
    7 * 24 * 60 * 60 * 1000
  )
}
