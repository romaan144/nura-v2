// ── Entender la búsqueda con Claude ──────────────────────────────────────
//
// La función `entender-busqueda` (Claude, en el servidor) lee la frase y
// elige, de las especialidades que existen en las fichas, las que resuelven
// la necesidad. Así la búsqueda crece sola cuando llegan oficios nuevos.
//
// Si no está encendida (sin ANTHROPIC_API_KEY responde 503), tarda o falla,
// devuelve null y la búsqueda usa el mapa de oficios (data/oficios.js) como
// hasta ahora: la persona no nota nada.
//
// La frase se envía en el momento y no se guarda en ningún sitio: ni aquí
// ni en el servidor (docs/perfil-vivo.md §1).

import { EDGE_URL } from '../config'
import { porLaFuncion } from './escrituras'

const URL_IA = EDGE_URL ? EDGE_URL.replace(/helpers-write\/?$/, 'entender-busqueda') : ''
// Más que esto y la persona espera demasiado: mejor el mapa.
const ESPERA_MS = 7000

// Si el servidor dice que no está encendida, no se vuelve a preguntar en
// esta visita: cada búsqueda iría varios segundos más lenta para nada.
let apagada = false
// La última respuesta, solo en memoria: «buscar más cerca» o volver a la
// misma búsqueda no paga otra llamada. Se pierde al cerrar la página.
let ultima = { frase: null, resultado: null }

/**
 * { especialidades: [{especialidad, categoria}], exacto, nombre, quien }
 * con al menos una especialidad, o null (sin IA, sin respuesta o sin nada
 * que encaje: entonces decide el mapa de oficios).
 */
export async function entenderBusqueda(texto) {
  if (apagada || !porLaFuncion() || !URL_IA) return null
  const frase = String(texto || '').trim()
  if (frase.length < 3) return null
  if (ultima.frase === frase) return ultima.resultado
  try {
    const res = await fetch(URL_IA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: frase.slice(0, 500) }),
      signal: AbortSignal.timeout(ESPERA_MS),
    })
    if (res.status === 503) { apagada = true; return null }
    if (!res.ok) return null
    const r = await res.json()
    const especialidades = (r?.ok && Array.isArray(r.especialidades) ? r.especialidades : [])
      .filter(e => e && typeof e.especialidad === 'string' && e.especialidad)
    const resultado = especialidades.length ? {
      especialidades,
      exacto: r.exacto !== false,
      nombre: String(r.nombre || ''),
      // «Todavía no tengo a nadie ${quien}»: nunca vacío.
      quien: String(r.quien || '').trim() || 'así',
    } : null
    ultima = { frase, resultado }
    return resultado
  } catch { return null }
}
