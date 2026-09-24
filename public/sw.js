// ── Nüra · trabajador de notificaciones ─────────────────────────────────
// Solo hace una cosa: enseñar el aviso «ha llegado alguien» y abrir la app
// al tocarlo. No guarda paginas ni intercepta peticiones: la app funciona
// exactamente igual con o sin el.
//
// El aviso llega VACIO a proposito (ver helpers-write, «TE AVISO SI APARECE
// ALGUIEN»): el servicio de notificaciones del navegador no sabe que
// buscaba nadie. El detalle lo pide la app al abrirse, con su llave.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('push', e => {
  e.waitUntil(self.registration.showNotification('Ha llegado alguien a Nüra', {
    body: 'Encaja con lo que buscabas. Tócalo para verlo.',
    icon: '/logo-iso.png',
    badge: '/logo-iso.png',
    tag: 'nura-alerta',
    data: { url: '/profile?alertas=1' },
  }))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const c of abiertas) {
      if ('focus' in c) { await c.focus(); if ('navigate' in c) await c.navigate(url); return }
    }
    await self.clients.openWindow(url)
  })())
})
