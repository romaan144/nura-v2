// ── Lo que se dice DESPUÉS de una búsqueda ────────────────────────────────
//
// Con unos resultados en pantalla, la gente sigue hablando: «otra persona»,
// «¿cuánto cobra?», «que sea online», «mejor por la tarde», «no, era
// fontanero». Antes casi todo eso acababa en «No estoy segura de haberte
// entendido», o en un «He ajustado los resultados» que enseñaba lo mismo.
// Aquí se decide QUÉ quiere decir; Home decide cómo contestar.

import { oficiosDe, oficio } from '../data/oficios'
import { horarioDe } from '../data/horarios'

const plano = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[¿?¡!.,;:]/g, ' ').replace(/\s+/g, ' ').trim()

/**
 * 'saludo' | 'gracias' | 'nueva' | 'precio' | 'barato' | 'online' | 'presencial'
 * | 'otra' | { franja: 'manana'|'tarde'|'noche'|'finde' } | null (lo de siempre).
 * Y lo que pregunta quien aún no conoce Nüra (2026-10-01): 'ofrecer' (quiere
 * trabajar o darse de alta), 'que_es', 'coste' y 'no_se'. Las tres últimas solo
 * con la frase entera: «cuánto cuesta un fontanero» es una búsqueda.
 * `oficiosAntes`: los oficios de la búsqueda anterior (analysis.oficios).
 */
export function entenderSeguimiento(msg, { hayResultados = false, oficiosAntes = [] } = {}) {
  const t = plano(msg)
  if (!t) return null
  if (/^(hola|holi|hey|buenas|buenos dias|buenas tardes|buenas noches|que tal|hola nura|hola que tal)( nura)?$/.test(t)) return 'saludo'
  if (/^(gracias|muchas gracias|mil gracias|gracias nura|genial gracias|perfecto gracias|ok gracias)$/.test(t)) return 'gracias'

  // Quiere ofrecer sus servicios, no contratar: aunque nombre su oficio
  // («soy fontanero y quiero ofrecer mis servicios»). Antes le buscaba uno.
  if (/\b(ofrecer|ofrezco|anunciar|anunciarme|publicar) (mis|tus|los) servicios\b|\b(busco|buscando|quiero|necesito) (trabajo|empleo|curro)\b|\b(quiero|como puedo) (trabajar|darme de alta|apuntarme|registrarme) (en|con|como)\b|\bdarme de alta como\b|\btrabajar (en|con|para) nura\b|\bquiero ser (profesional|de los profesionales)\b/.test(t)) return 'ofrecer'

  // Frases enteras: «cuánto cuesta un fontanero» no encaja y sigue siendo una
  // búsqueda. (No se mira el oficio: «quién eres» parecía pedir un ERE.)
  {
    if (/^(que|q) es (nura|esto|esta app|esta aplicacion)$|^(quien|que) eres( tu)?$|^como funciona( nura| esto| esta app| la app)?$|^para que sirve( nura| esto| esta app)?$|^que (haces|puedes hacer|hace nura)$|^como va esto$/.test(t)) return 'que_es'
    // Sin resultados en pantalla, «cuánto cuesta» es por Nüra; con ellos, por esas personas.
    if (/^(es gratis|es gratuito|hay que pagar|cuanto cobras|cuanto cobra nura|cuanto cuesta (usar )?(nura|la app|esto))$/.test(t) || (!hayResultados && /^cuanto (cuesta|vale|cobran)$/.test(t))) return 'coste'
    if (/^(ayuda|ayudame|socorro|necesito ayuda|necesito algo|no se|no lo se|ni idea|no se que (necesito|buscar|quiero|pedir)|no se por donde empezar|que puedo (buscar|pedir)|que me recomiendas|que hay)$/.test(t)) return 'no_se'
  }
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

/**
 * Las cosas distintas que pide un mismo mensaje, unidas con «y», «también»
 * o «además»: «fontanero y electricista», «limpiar mi casa y también que me
 * planche la ropa». [{ id, nombre, texto }] (texto: el trozo que lo pide).
 * Una sola necesidad (o ninguna clara) → [] o un elemento.
 */
export function necesidadesDe(msg) {
  const salida = []
  for (const trozo of String(msg || '').split(/\b(?:y|e|tambi[eé]n|adem[aá]s)\b/i)) {
    const texto = trozo.trim().replace(/^[,.;:\s]+|[,.;:\s]+$/g, '')
    const o = texto && oficiosDe(texto)[0]
    if (o && o.puntos >= 5 && !salida.some(x => x.id === o.id)) salida.push({ id: o.id, nombre: oficio(o.id)?.nombre || o.id, texto })
  }
  return salida
}
