// ── «Avísame cuando conteste»: lo que el trabajador de notificaciones lee ──
//
// La notificacion llega VACIA (el servicio del navegador no ve nada). Al
// recibirla, public/sw.js mira aqui a quien esta esperando este movil y
// pregunta a Nüra, con esas llaves de lectura, si ya ha contestado. Asi
// puede decir «Carlos te ha contestado» sin que el texto viaje en el aviso.
//
// IndexedDB y no localStorage: el trabajador no puede leer localStorage.
// Base `nura`, almacen `esperando` (clave: la llave de lectura) y `ajustes`
// (la direccion de la funcion). Borrar mis datos la borra (ver Profile).

const BASE = 'nura', VERSION = 1

function abrir() {
  return new Promise((ok, mal) => {
    const r = indexedDB.open(BASE, VERSION)
    r.onupgradeneeded = () => {
      const db = r.result
      if (!db.objectStoreNames.contains('esperando')) db.createObjectStore('esperando', { keyPath: 'llave' })
      if (!db.objectStoreNames.contains('ajustes')) db.createObjectStore('ajustes')
    }
    r.onsuccess = () => ok(r.result)
    r.onerror = () => mal(r.error)
  })
}

/** Apunta que este movil espera la respuesta de esa conversacion. */
export async function apuntarEspera({ llave, helperId, nombre }, edgeUrl) {
  try {
    const db = await abrir()
    await new Promise((ok, mal) => {
      const t = db.transaction(['esperando', 'ajustes'], 'readwrite')
      t.objectStore('esperando').put({ llave, helperId: String(helperId), nombre: String(nombre || ''), desde: Date.now() })
      t.objectStore('ajustes').put(edgeUrl, 'funcion')
      t.oncomplete = ok; t.onerror = () => mal(t.error)
    })
    db.close()
    return true
  } catch { return false }
}

/** Para «Borrar mis datos». */
export function borrarEsperas() {
  try { indexedDB.deleteDatabase(BASE) } catch { /* sin IndexedDB no hay nada que borrar */ }
}
