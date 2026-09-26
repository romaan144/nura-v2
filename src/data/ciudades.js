// ── Las ciudades ─────────────────────────────────────────────────────────
// Nüra nace en Barcelona pero se usará en más ciudades (decisión del
// fundador, 2026-09-25). Aquí se entiende la ciudad que alguien nombra
// («fontanero en Madrid») o en la que trabaja un profesional («Chamberí,
// Madrid»). Los barrios con distancias (data/barrios.js) siguen siendo
// solo de Barcelona: un barrio de Barcelona también dice la ciudad.

import { barrioEnTexto } from './barrios'

const sinTildes = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// [nombre, alias…]. Las que son también palabras o nombres corrientes
// (León, Granada, Santander…) solo cuentan tras «en», «de», «por»…
export const CIUDADES = [
  ['Barcelona', 'barcelona', 'bcn'], ['Madrid', 'madrid'], ['Valencia', 'valencia'],
  ['Sevilla', 'sevilla'], ['Zaragoza', 'zaragoza'], ['Málaga', 'malaga'],
  ['Murcia', 'murcia'], ['Palma', 'palma de mallorca', 'palma'], ['Las Palmas', 'las palmas', 'las palmas de gran canaria'],
  ['Bilbao', 'bilbao'], ['Alicante', 'alicante', 'alacant'], ['Córdoba', 'cordoba'],
  ['Valladolid', 'valladolid'], ['Vigo', 'vigo'], ['Gijón', 'gijon'],
  ["L'Hospitalet", "l'hospitalet", 'hospitalet', "l'hospitalet de llobregat"], ['Vitoria', 'vitoria', 'vitoria-gasteiz', 'gasteiz'],
  ['A Coruña', 'a coruna', 'la coruna', 'coruna'], ['Granada', 'granada'], ['Elche', 'elche', 'elx'],
  ['Oviedo', 'oviedo'], ['Badalona', 'badalona'], ['Terrassa', 'terrassa', 'tarrasa'],
  ['Sabadell', 'sabadell'], ['Cartagena', 'cartagena'], ['Jerez', 'jerez', 'jerez de la frontera'],
  ['Móstoles', 'mostoles'], ['Santa Cruz de Tenerife', 'santa cruz de tenerife', 'tenerife'], ['Pamplona', 'pamplona', 'iruna'],
  ['Almería', 'almeria'], ['Alcalá de Henares', 'alcala de henares'], ['Fuenlabrada', 'fuenlabrada'],
  ['San Sebastián', 'san sebastian', 'donostia'], ['Leganés', 'leganes'], ['Santander', 'santander'],
  ['Getafe', 'getafe'], ['Burgos', 'burgos'], ['Albacete', 'albacete'], ['Castellón', 'castellon', 'castello'],
  ['Alcorcón', 'alcorcon'], ['Logroño', 'logrono'], ['Badajoz', 'badajoz'], ['Salamanca', 'salamanca'],
  ['Huelva', 'huelva'], ['Marbella', 'marbella'], ['Lleida', 'lleida', 'lerida'], ['Tarragona', 'tarragona'],
  ['León', 'leon'], ['Cádiz', 'cadiz'], ['Jaén', 'jaen'], ['Ourense', 'ourense', 'orense'],
  ['Girona', 'girona', 'gerona'], ['Mataró', 'mataro'], ['Santiago de Compostela', 'santiago de compostela'],
  ['Sant Cugat', 'sant cugat', 'sant cugat del valles'], ['Castelldefels', 'castelldefels'],
]
const AMBIGUAS = new Set(['granada', 'santander', 'leon', 'palma', 'valencia', 'jerez', 'santiago de compostela', 'elche', 'cartagena', 'salamanca'])

const escapar = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Los alias largos primero: «palma de mallorca» antes que «palma».
const TODAS = CIUDADES.flatMap(([nombre, ...alias]) => alias.map(a => ({ a, nombre })))
  .sort((x, y) => y.a.length - x.a.length)

/** La ciudad que nombra una frase, o null. Un barrio de Barcelona cuenta como Barcelona. */
export function ciudadEnTexto(texto) {
  if (!texto) return null
  const t = ' ' + sinTildes(texto).replace(/[^a-z0-9' -]/g, ' ').replace(/\s+/g, ' ') + ' '
  for (const { a, nombre } of TODAS) {
    const suelta = new RegExp(`[^a-z0-9']${escapar(a)}[^a-z0-9']`)
    if (!suelta.test(t)) continue
    if (!AMBIGUAS.has(a)) return nombre
    if (new RegExp(`(^| )(en|de|por|desde|cerca de|zona|ciudad de|provincia de) ${escapar(a)}[^a-z0-9']`).test(t)) return nombre
    // «Granada» a secas en la zona de un profesional sí es la ciudad.
    if (t.trim() === a) return nombre
  }
  return barrioEnTexto(texto) ? 'Barcelona' : null
}

/**
 * La ciudad que dice la ZONA de un profesional. Como ciudadEnTexto, y
 * además un trozo entre comas que sea solo una ciudad: en «Russafa,
 * Valencia» es la ciudad, aunque «Valencia» a secas pueda ser un nombre.
 */
export function ciudadDeZona(zona) {
  const directa = ciudadEnTexto(zona)
  if (directa) return directa
  for (const trozo of String(zona || '').split(/[,·(/)]/)) {
    const t = sinTildes(trozo).replace(/[^a-z0-9' -]/g, ' ').replace(/\s+/g, ' ').trim()
    const c = t && TODAS.find(x => x.a === t)
    if (c) return c.nombre
  }
  return null
}

/** La ciudad de un profesional: la guardada, o la que se lee en su zona. */
export const ciudadDe = h => h?.city || ciudadDeZona(h?.zone) || null

/**
 * ¿Hay en esta lista alguien que trabaje en esa ciudad (o atienda online)?
 * Sirve para decir con claridad «en Madrid aún no tengo a nadie» aunque la
 * búsqueda haya encontrado profesionales en otras ciudades.
 */
export function hayEnLaCiudad(lista, ciudad) {
  if (!ciudad) return true
  return (lista || []).some(h => h?.online || ciudadDe(h) === ciudad)
}

/**
 * Al darse de alta: ¿hay que preguntarle la ciudad? Sí si su zona no dice
 * ninguna que conozcamos («Chamberí», «el centro»). No si solo trabaja
 * online: entonces la ciudad da igual.
 */
export function faltaCiudad(zona) {
  const t = String(zona || '').trim()
  if (!t || ciudadDeZona(t)) return false
  return !/\b(online|on-line|a distancia|en remoto|remoto|videollamada)\b/i.test(sinTildes(t))
}

/**
 * La ciudad que contesta a «¿en qué ciudad está?». Una de la lista si la
 * reconoce («madrid», «en Valencia»); si no, su propio texto limpio y con
 * mayúscula («Toledo»). null si no parece un nombre.
 */
export function ciudadDeRespuesta(texto) {
  const t = String(texto || '').trim()
  const conocida = ciudadEnTexto(t) || ciudadEnTexto('en ' + t)
  if (conocida) return conocida
  const limpio = t.replace(/^(en|de|la ciudad de)\s+/i, '').replace(/[.!]+$/, '').trim()
  if (!/^[\p{L}][\p{L} '’-]{1,39}$/u.test(limpio)) return null
  if (/^(no se|ni idea|no lo se|ninguna|nada|varias|toda espana|espana)$/.test(sinTildes(limpio))) return null
  return limpio.charAt(0).toUpperCase() + limpio.slice(1)
}

/**
 * La ciudad que se guarda al editar la ficha. Manda lo que escriba en «Tu
 * ciudad»; si lo deja vacío, la que diga su zona (o ninguna).
 * Devuelve { ciudad } o { error } si lo escrito no parece una ciudad.
 */
export function ciudadAlGuardar(campo, zona) {
  const t = String(campo || '').trim()
  if (!t) return { ciudad: ciudadDeZona(zona) || null }
  const ciudad = ciudadDeRespuesta(t)
  return ciudad ? { ciudad } : { error: 'Escribe solo el nombre de tu ciudad. Por ejemplo: Madrid.' }
}
