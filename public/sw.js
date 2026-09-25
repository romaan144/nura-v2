// ── Nüra · trabajador de notificaciones ─────────────────────────────────
// Solo hace una cosa: enseñar los avisos y abrir la app al tocarlos. No
// guarda paginas ni intercepta peticiones: la app funciona exactamente igual
// con o sin el.
//
// El aviso llega VACIO a proposito (ver helpers-write): el servicio de
// notificaciones del navegador no sabe que buscaba nadie ni que le han
// escrito. Hay dos avisos posibles:
//   · «X te ha contestado» — si este movil pidio «Avísame cuando conteste».
//     Se sabe preguntando a Nüra con las llaves de lectura que la app dejo en
//     IndexedDB (src/utils/esperando.js). Solo este movil tiene esas llaves.
//   · «Ha llegado alguien» — «Te aviso si aparece».
//   · «Te han escrito» — la profesional que pidio «Avísame cuando me
//     escriban». Llega por OTRO canal (este mismo fichero registrado con
//     ambito /pro/), asi que se sabe cual es sin que el aviso diga nada.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

function abrir() {
  return new Promise((ok, mal) => {
    const r = indexedDB.open('nura', 1)
    r.onupgradeneeded = () => {
      const db = r.result
      if (!db.objectStoreNames.contains('esperando')) db.createObjectStore('esperando', { keyPath: 'llave' })
      if (!db.objectStoreNames.contains('ajustes')) db.createObjectStore('ajustes')
    }
    r.onsuccess = () => ok(r.result)
    r.onerror = () => mal(r.error)
  })
}
const pedir = (req) => new Promise((ok, mal) => { req.onsuccess = () => ok(req.result); req.onerror = () => mal(req.error) })

/** Quien ha contestado de los que este movil esperaba (y deja de esperarlos). */
async function contestados() {
  let db
  try {
    db = await abrir()
    const t = db.transaction(['esperando', 'ajustes'], 'readonly')
    const [esperando, funcion] = await Promise.all([pedir(t.objectStore('esperando').getAll()), pedir(t.objectStore('ajustes').get('funcion'))])
    if (!esperando.length || !funcion) return []
    const r = await fetch(funcion, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'respuestas', llaves: esperando.map(e => e.llave) }) })
    if (!r.ok) return []
    const con = new Set(((await r.json()).respuestas || []).map(x => x.llave))
    const listos = esperando.filter(e => con.has(e.llave))
    if (listos.length) {
      const b = db.transaction('esperando', 'readwrite')
      for (const e of listos) b.objectStore('esperando').delete(e.llave)
    }
    return listos
  } catch { return [] } finally { try { db?.close() } catch { /* nada */ } }
}

self.addEventListener('push', e => {
  e.waitUntil((async () => {
    // El canal de la profesional (ambito /pro/): alguien le ha escrito.
    if (self.registration.scope.endsWith('/pro/')) {
      return self.registration.showNotification('Te han escrito en Nüra', {
        body: 'Tócalo para leerlo y contestar.',
        icon: '/logo-iso.png', badge: '/logo-iso.png', tag: 'nura-te-han-escrito',
        data: { url: '/chats' },
      })
    }
    const listos = await contestados()
    if (listos.length) {
      const [p] = listos
      return self.registration.showNotification(`${p.nombre || 'Un profesional'} te ha contestado`, {
        body: 'Tócalo para leer la respuesta en Nüra.',
        icon: '/logo-iso.png', badge: '/logo-iso.png', tag: 'nura-respuesta-' + p.helperId,
        data: { url: '/chat/' + encodeURIComponent(p.helperId) },
      })
    }
    return self.registration.showNotification('Ha llegado alguien a Nüra', {
      body: 'Encaja con lo que buscabas. Tócalo para verlo.',
      icon: '/logo-iso.png', badge: '/logo-iso.png', tag: 'nura-alerta',
      data: { url: '/profile?alertas=1' },
    })
  })())
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
