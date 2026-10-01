// ── Nüra · pruebas del trabajador de notificaciones (public/sw.js) ───────
//
//   npm run test:sw
//
// Ejecuta el sw.js REAL en Node con un móvil de mentira: notificaciones,
// ventanas abiertas, IndexedDB en memoria y la función de servidor simulada.
// Comprueba qué aviso enseña cada vez y adónde lleva al tocarlo. No envía
// nada a nadie.

import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const codigo = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sw.js'), 'utf8')
let fallos = 0, pasadas = 0
const ok = (c, t) => { c ? pasadas++ : fallos++; console.log((c ? '✓ ' : '✗ ') + t) }

// IndexedDB mínima: una base con almacenes en memoria.
function idbFalsa(datos) {
  const req = valor => { const r = {}; queueMicrotask(() => { r.result = valor; r.onsuccess?.() }); return r }
  const db = {
    objectStoreNames: { contains: n => n in datos },
    createObjectStore: n => { datos[n] = new Map() },
    transaction: () => ({ objectStore: n => ({
      getAll: () => req([...datos[n].values()]),
      get: k => req(datos[n].get(k)),
      delete: k => { datos[n].delete(k); return req(undefined) },
    }) }),
    close() {},
  }
  return { open: () => { const r = {}; queueMicrotask(() => { r.result = db; r.onsuccess?.() }); return r } }
}

/** Un móvil: carga sw.js y devuelve sus manejadores y lo que va pasando. */
function movil({ ambito = 'https://nura.test/', esperando = [], funcion = 'https://funcion.test', responde, ventanas = [] } = {}) {
  const manejadores = {}, avisos = [], abiertas = []
  const datos = { esperando: new Map(esperando.map(e => [e.llave, e])), ajustes: new Map(funcion ? [['funcion', funcion]] : []) }
  const self = {
    addEventListener: (t, f) => { manejadores[t] = f },
    skipWaiting() {},
    registration: { scope: ambito, showNotification: (titulo, op) => { avisos.push({ titulo, ...op }); return Promise.resolve() } },
    clients: { claim: async () => {}, matchAll: async () => ventanas, openWindow: async url => { abiertas.push(url) } },
  }
  vm.runInNewContext(codigo, { self, indexedDB: idbFalsa(datos), fetch: responde || (async () => { throw new Error('sin red') }),
    queueMicrotask, console, URL, JSON, Promise, Set, Map })
  const lanzar = async (tipo, ev) => { let p; manejadores[tipo]({ ...ev, waitUntil: x => { p = x } }); await p }
  return { lanzar, avisos, abiertas, datos }
}

console.log('\n── Qué aviso enseña ──')
{
  const m = movil({ ambito: 'https://nura.test/pro/' })
  await m.lanzar('push', {})
  ok(m.avisos[0]?.titulo === 'Te han escrito en Nüra' && m.avisos[0].data.url === '/chats', 'canal de la profesional: «Te han escrito», lleva a sus mensajes')
}
{
  const m = movil()
  await m.lanzar('push', {})
  ok(/Ha llegado alguien/.test(m.avisos[0]?.titulo) && m.avisos[0].data.url === '/profile?alertas=1', 'sin esperar a nadie: «Ha llegado alguien», lleva a sus avisos')
}
{
  const m = movil({ esperando: [{ llave: 'a'.repeat(32), helperId: '7', nombre: 'Carlos' }],
    responde: async () => ({ ok: true, json: async () => ({ respuestas: [{ llave: 'a'.repeat(32) }] }) }) })
  await m.lanzar('push', {})
  ok(m.avisos[0]?.titulo === 'Carlos te ha contestado' && m.avisos[0].data.url === '/chat/7', '«Carlos te ha contestado», lleva a su chat')
  ok(!m.datos.esperando.size, 'y deja de esperarle')
}
{
  const m = movil({ esperando: [{ llave: 'a'.repeat(32), helperId: '7', nombre: 'Carlos' }] })
  await m.lanzar('push', {})
  ok(m.avisos[0]?.titulo === 'Tienes una novedad en Nüra' && m.avisos[0].data.url === '/chats',
    `sin poder preguntar quién contestó: «novedad», no «ha llegado alguien» (${m.avisos[0]?.titulo})`)
  ok(m.datos.esperando.size === 1, 'y sigue esperándole')
}
{
  const m = movil({ esperando: [{ llave: 'a'.repeat(32), helperId: '7', nombre: 'Carlos' }],
    responde: async () => ({ ok: true, json: async () => ({ respuestas: [] }) }) })
  await m.lanzar('push', {})
  ok(/Ha llegado alguien/.test(m.avisos[0]?.titulo), 'esperando a alguien que aún no ha contestado: era «ha llegado alguien»')
}

console.log('\n── Al tocarlo ──')
const notificacion = url => ({ close() {}, data: { url } })
{
  const enviados = []
  const ventana = { focus: async () => {}, navigate: async () => { throw new TypeError('no controla esta página') }, postMessage: m => enviados.push(m) }
  const m = movil({ ambito: 'https://nura.test/pro/', ventanas: [ventana] })
  await m.lanzar('notificationclick', { notification: notificacion('/chats') })
  ok(enviados[0]?.tipo === 'nura-ir' && enviados[0].url === '/chats' && !m.abiertas.length,
    'Nüra abierta y el canal no puede cambiarla: se lo pide a la app (antes se quedaba donde estaba)')
}
{
  const enviados = [], idas = []
  const ventana = { focus: async () => {}, navigate: async u => { idas.push(u); return {} }, postMessage: m => enviados.push(m) }
  const m = movil({ ventanas: [ventana] })
  await m.lanzar('notificationclick', { notification: notificacion('/chat/7') })
  ok(idas[0] === '/chat/7' && !enviados.length, 'Nüra abierta y la controla: la lleva directamente')
}
{
  const m = movil()
  await m.lanzar('notificationclick', { notification: notificacion('/profile?alertas=1') })
  ok(m.abiertas[0] === '/profile?alertas=1', 'Nüra cerrada: la abre en esa pantalla')
}

console.log(`\n${pasadas} pasadas · ${fallos} fallidas`)
process.exit(fallos ? 1 : 0)
