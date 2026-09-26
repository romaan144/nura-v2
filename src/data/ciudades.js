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

/** La ciudad de un profesional: la guardada, o la que se lee en su zona. */
export const ciudadDe = h => h?.city || ciudadEnTexto(h?.zone) || null
