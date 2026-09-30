// ── Lo que se dice DESPUÉS de una búsqueda ────────────────────────────────
//
// Con unos resultados en pantalla, la gente sigue hablando: «otra persona»,
// «¿cuánto cobra?», «que sea online», «mejor por la tarde», «no, era
// fontanero». Antes casi todo eso acababa en «No estoy segura de haberte
// entendido», o en un «He ajustado los resultados» que enseñaba lo mismo.
// Aquí se decide QUÉ quiere decir; Home decide cómo contestar.

import { oficiosDe } from '../data/oficios'
import { horarioDe } from '../data/horarios'

const plano = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[¿?¡!.,;:]/g, ' ').replace(/\s+/g, ' ').trim()

/**
 * 'saludo' | 'gracias' | 'nueva' | 'precio' | 'barato' | 'online' | 'presencial'
 * | 'otra' | { franja: 'manana'|'tarde'|'noche'|'finde' } | null (lo de siempre).
 * `oficiosAntes`: los oficios de la búsqueda anterior (analysis.oficios).
 */
export function entenderSeguimiento(msg, { hayResultados = false, oficiosAntes = [] } = {}) {
  const t = plano(msg)
  if (!t) return null
  if (/^(hola|holi|hey|buenas|buenos dias|buenas tardes|buenas noches|que tal|hola nura|hola que tal)( nura)?$/.test(t)) return 'saludo'
  if (/^(gracias|muchas gracias|mil gracias|gracias nura|genial gracias|perfecto gracias|ok gracias)$/.test(t)) return 'gracias'
  if (!hayResultados) return null

  // Nombra un oficio distinto: es otra búsqueda («no, era fontanero»).
  const oficios = oficiosDe(msg).map(o => o.id)
  if (oficios.length && !oficios.some(o => oficiosAntes.includes(o))) return 'nueva'

  if (/\b(mas barat\w*|economic\w*|barat\w*)\b/.test(t)) return 'barato'
  if (/\b(cuanto (cobra|cobran|cuesta|cuestan|vale|valen|sale|salen|pide|piden)|precio\w*|tarifa\w*|cuanto es)\b/.test(t)) return 'precio'
  if (/\b(online|on line|en linea|videollamada|por video|a distancia)\b/.test(t)) return 'online'
  if (/\b(presencial\w*|a domicilio|que venga|en persona)\b/.test(t)) return 'presencial'
  if (/\b(fin(es)? de semana|finde|sabados?|domingos?)\b/.test(t)) return { franja: 'finde' }
  if (/\b(tardes?)\b/.test(t)) return { franja: 'tarde' }
  if (/\b(noches?)\b/.test(t)) return { franja: 'noche' }
  if (/\b(por la manana|las mananas|de manana|por las mananas|mananas)\b/.test(t)) return { franja: 'manana' }
  if (/\b(otra persona|otra opcion|otro|otra|alguien mas|alguien distinto|siguiente|no me convence|no me gusta)\b/.test(t)) return 'otra'
  return null
}

/** ¿Trabaja en esa franja? Según su horario (el suyo o el de su oficio). */
export function trabajaEn(helper, franja) {
  // «Cuidadora nocturna» lo dice su oficio, aunque su horario sea el general.
  if (/noctur/.test(plano(helper?.specialty))) return franja === 'noche'
  const h = horarioDe(helper)
  if (franja === 'finde') return h.dias.some(d => d === 0 || d === 6)
  const horas = h.horas.map(x => parseInt(x, 10))
  if (franja === 'manana') return horas.some(x => x < 14)
  if (franja === 'tarde') return horas.some(x => x >= 14 && x < 20)
  if (franja === 'noche') return horas.some(x => x >= 20)
  return true
}

export const NOMBRE_FRANJA = { manana: 'por la mañana', tarde: 'por la tarde', noche: 'por la noche', finde: 'el fin de semana' }

/** 2: su oficio lo dice («cuidadora nocturna»); 1: su horario lo cubre; 0: no. */
export function puntosFranja(helper, franja) {
  if (franja === 'noche' && /noctur/.test(plano(helper?.specialty))) return 2
  return trabajaEn(helper, franja) ? 1 : 0
}

/**
 * Lo que pide la PRIMERA búsqueda además del oficio: { franja, online, precio }.
 * «alguien que cuide a mi madre por las tardes» → { franja: 'tarde' }.
 * «esta noche» también es noche; «mañana» a secas es un día, no una franja.
 */
export function preferenciasDe(msg) {
  const t = plano(msg)
  const franja = /\b(fin(es)? de semana|finde|sabados?|domingos?)\b/.test(t) ? 'finde'
    : /\btardes?\b/.test(t) ? 'tarde'
    : /\bnoches?\b/.test(t) ? 'noche'
    : /\b(por la manana|las mananas|por las mananas|mananas)\b/.test(t) ? 'manana' : null
  return {
    franja,
    online: /\b(online|on line|en linea|videollamada|a distancia)\b/.test(t),
    precio: /\b(cuanto (cobra|cobran|cuesta|cuestan|vale|valen|sale|salen)|precio\w*|tarifa\w*)\b/.test(t),
  }
}
