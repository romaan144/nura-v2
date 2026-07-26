// ═══════════════════════════════════════════════════════════════
// El Muro de Conexiones — historias de conexiones reales
//
// La prueba social de Nüra no son posts: son conexiones que
// funcionaron, contadas como historias verificadas. Las semilla
// se construyen desde la especialidad real de cada profesional
// para que texto y tarjeta nunca se contradigan.
// ═══════════════════════════════════════════════════════════════
import { HELPERS } from './helpers'
import { DEMO_ENRICHMENTS } from './demoEnrichments'

const NEED_BY_CAT = {
  cuidado:    'buscaba cuidado de confianza para su madre',
  salud:      'llevaba semanas posponiendo pedir ayuda y por fin dio el paso',
  logopedia:  'buscaba apoyo para el habla de su hijo',
  tecnico:    'tenía una urgencia en casa y no sabía a quién llamar',
  legal:      'necesitaba orientación legal urgente tras una mala noticia',
  clases:     'buscaba apoyo escolar para su hija antes de los exámenes',
  mascotas:   'necesitaba a alguien de confianza para cuidar de su perro',
  hogar:      'necesitaba poner su casa a punto y no llegaba a todo',
  entrenador: 'quería volver a cuidarse después de mucho tiempo',
}

const SEED = [
  { helperId: 2003, person: 'Marta',  zone: 'Gràcia',     seconds: 38, hoursAgo: 3 },
  { helperId: 2001, person: 'David',  zone: 'Eixample',   seconds: 47, hoursAgo: 7 },
  { helperId: 2020, person: 'Laura',  zone: 'Sants',      seconds: 29, hoursAgo: 11 },
  { helperId: 2044, person: 'Jordi',  zone: 'Poblenou',   seconds: 52, hoursAgo: 26 },
  { helperId: 2128, person: 'Carmen', zone: 'Les Corts',  seconds: 41, hoursAgo: 31 },
  { helperId: 2100, person: 'Àlex',   zone: 'Sant Martí', seconds: 35, hoursAgo: 49 },
  { helperId: 2150, person: 'Nuria',  zone: 'Sarrià',     seconds: 44, hoursAgo: 55 },
  { helperId: 2060, person: 'Pau',    zone: 'El Born',    seconds: 33, hoursAgo: 70 },
]

export function getConnectionStories() {
  return SEED.map(s => {
    const base = HELPERS.find(h => h?.id === s.helperId)
    if (!base) return null
    const enriched = DEMO_ENRICHMENTS[s.helperId]
    const helper = enriched ? { ...enriched, ...base, id: s.helperId } : { ...base, id: s.helperId }
    const need = NEED_BY_CAT[helper.category]
      || `necesitaba ${helper.specialty?.toLowerCase() || 'ayuda'} y no sabía a quién acudir`
    const timeAgo = s.hoursAgo < 24
      ? `hace ${s.hoursAgo} h`
      : `hace ${Math.round(s.hoursAgo / 24)} días`
    return {
      id: 'seed_' + s.helperId,
      helper,
      seconds: s.seconds,
      timeAgo,
      text: `${s.person}, de ${s.zone}, ${need}.`,
    }
  }).filter(Boolean)
}


// Personas destacadas del barrio (deterministas por día, diversas por categoría)
export function getDestacados(n = 3) {
  const day = new Date().getDate()
  const pool = (HELPERS || []).filter(h => h && h.rating >= 4.7)
  const cats = new Set()
  const out = []
  for (let i = 0; i < pool.length && out.length < n; i++) {
    const h = pool[(i + day) % pool.length]
    if (h && !cats.has(h.category)) { cats.add(h.category); out.push(h) }
  }
  return out
}

/**
 * Las historias de una categoria concreta — para que Comunidad pueda
 * responder a lo que el vecino buscaba, en vez de hablar en general.
 */
export function historiasDeCategoria(categoria, limit = 1) {
  if (!categoria) return []
  return getConnectionStories()
    .filter(s => s.helper?.category === categoria)
    .slice(0, limit)
}
