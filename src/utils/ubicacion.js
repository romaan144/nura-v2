import { barrioDeZona, kmEntre } from '../data/barrios.js'
import { ciudadDe } from '../data/ciudades.js'

// Solo se llama por una acción explícita. Las coordenadas no salen del dispositivo.
export function pedirUbicacion({ geolocation = globalThis.navigator?.geolocation, signal, timeout = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    let timer
    let settled = false
    const finish = (error, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
      if (error) reject(error)
      else resolve(value)
    }
    const cancel = () => finish({ code: 'cancelled' })
    if (signal?.aborted) { cancel(); return }
    if (!geolocation) { finish({ code: 'unsupported' }); return }
    signal?.addEventListener('abort', cancel, { once: true })
    // También acota la espera del diálogo de permiso, que no cuenta en el timeout nativo.
    timer = setTimeout(() => finish({ code: 3 }), timeout + 5000)
    try {
      geolocation.getCurrentPosition(position => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords || {}
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
          finish({ code: 2 }); return
        }
        if (!Number.isFinite(accuracy) || accuracy > 5000) { finish({ code: 'imprecise' }); return }
        finish(null, { lat, lng })
      }, error => finish(error), { enableHighAccuracy: false, maximumAge: 60000, timeout })
    } catch { finish({ code: 2 }) }
  })
}

const CIUDADES_CON_ZONAS = new Set(['Barcelona', "L'Hospitalet", 'Badalona', 'Esplugues', 'Santa Coloma'])

export function ordenarDesdeUbicacion(helpers, origin) {
  return helpers.map(helper => {
    const city = ciudadDe(helper)
    const zone = (!city || CIUDADES_CON_ZONAS.has(city)) ? barrioDeZona(helper.zone) : null
    const distance = zone ? kmEntre(origin, zone) : null
    return { ...helper, distance, distanciaDesde: distance != null ? 'tu ubicación' : null,
      distanciaAproximada: distance != null }
  }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
}

export function mensajeErrorUbicacion(error) {
  if (error?.code === 1) return 'No tengo permiso para acceder a tu ubicación. Puedes activarlo en los permisos del navegador y volver a pulsar «Más cerca», o escribirme tu zona.'
  if (error?.code === 'unsupported') return 'Este navegador no permite obtener tu ubicación. Puedes probar con otro navegador o escribirme tu zona.'
  if (error?.code === 'imprecise') return 'El dispositivo ha dado una ubicación demasiado imprecisa. Puedes volver a intentarlo o escribirme tu zona.'
  if (error?.code === 3) return 'Está tardando demasiado en llegar tu ubicación. Puedes volver a pulsar «Más cerca» o escribirme tu zona.'
  return 'No he podido obtener tu ubicación. Comprueba que la localización esté activada y vuelve a pulsar «Más cerca», o escríbeme tu zona.'
}
