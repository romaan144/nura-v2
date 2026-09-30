// ── Carta de Presentación Viva ──────────────────────────────────────────
// Nüra redacta el primer mensaje en nombre del usuario, dirigido al
// profesional, usando el contexto real de la conversación previa.
// No es una plantilla genérica: se construye combinando lo que el motor
// de matching ya sabe sobre la necesidad del usuario.

import { suyoDe, labelDe } from './personas'
import { oficiosDe, oficio, esDelOficio } from '../data/oficios'
import { preferenciasDe, NOMBRE_FRANJA } from './seguimiento'
import { getFirstName } from './name'   // una sola: la copia de aqui discrepaba en 'DJ Marc Mas'

// Frases que describen la situación, basadas en categoría y señales complejas
function describeSituation(analysis, userQuery) {
  const cat = analysis?.categoria
  const signals = analysis?.complexSignals || {}
  const paraQuien = analysis?.paraQuien
  // El Espejo — si sabemos quién es, la carta lo dice con nombre propio
  const quien = suyoDe(analysis?.persona)

  if (signals.alzheimer) {
    return quien
      ? `${quien} tiene Alzheimer y necesita cuidado de confianza`
      : 'tiene una persona cercana con Alzheimer y necesita cuidado de confianza'
  }
  if (signals.infantil && cat === 'logopedia') {
    return quien
      ? `${quien} necesita apoyo con el habla`
      : 'tiene un niño o niña que necesita apoyo con el habla'
  }
  if (signals.infantil) {
    return quien
      ? `necesita ayuda para ${quien.replace('su ', 'su ')}`
      : 'necesita ayuda relacionada con sus hijos'
  }
  if (signals.sola) {
    return quien
      ? `${quien} vive sola y necesita compañía y cuidado`
      : 'tiene una persona mayor que vive sola y necesita compañía y cuidado'
  }
  if (quien && cat === 'cuidado') {
    return `busca cuidado de confianza para ${quien}`
  }
  if (cat === 'cuidado') {
    return paraQuien === 'familia'
      ? 'busca cuidado de confianza para alguien de su familia'
      : 'busca cuidado de confianza para alguien cercano'
  }
  if (cat === 'salud' || cat === 'logopedia') {
    return 'está buscando apoyo profesional para una situación de salud'
  }
  if (cat === 'tecnico') {
    return 'tiene un problema técnico que necesita resolver'
  }
  if (cat === 'legal') {
    return 'necesita asesoramiento legal'
  }
  if (cat === 'clases') {
    return 'busca apoyo educativo'
  }
  if (cat === 'mascotas') {
    return 'necesita ayuda con el cuidado de su mascota'
  }
  if (cat === 'hogar') {
    return 'necesita ayuda con su hogar'
  }
  if (cat === 'entrenador') {
    return 'quiere empezar a cuidar su condición física'
  }
  if (paraQuien === 'familia') return 'necesita ayuda para alguien de su familia'
  if (paraQuien === 'hogar') return 'necesita ayuda para su hogar o negocio'
  return 'tiene una necesidad para la que cree que puedes ayudar'
}

function describeTiming(analysis) {
  const signals = analysis?.complexSignals || {}
  if (analysis?.urgente) return ' Es algo urgente.'
  if (signals.nocturno) return ' Necesita ayuda en horario nocturno.'
  return ''
}

function describeWhyThisProfessional(helper) {
  const reasons = []
  if (helper?.specialty) reasons.push('tu experiencia profesional')
  if (helper?.reviews >= 50) reasons.push(`tus ${helper.reviews} valoraciones`)
  if (helper?.zone) reasons.push(`que estás cerca de su zona`)
  if (reasons.length === 0) return 'tu perfil'
  return reasons.slice(0, 2).join(' y ')
}

/**
 * Construye el texto de la Carta de Presentación Viva.
 * @param {object} params
 * @param {object} params.helper - el profesional al que se escribe
 * @param {object} params.analysis - resultado de analyzeNeed(userQuery)
 * @param {string} params.userQuery - texto original que escribió el usuario a Nüra
 * @param {object} params.user - usuario actual (puede ser null si no ha hecho login)
 * @returns {string} texto del mensaje, editable por el usuario
 */
// ── El borrador del primer mensaje ───────────────────────────────────────
// Antes pegaba la búsqueda tal cual entre un saludo y una pregunta: «Hola
// Àngel. Cocinar. ¿Podrías ayudarme?» (Sergio, 2026-09-30). Ahora:
//   · si lo que escribió ya es una frase suya («Tengo una fuga debajo del
//     fregadero»), se usan SUS palabras;
//   · si no (una palabra, una pregunta, un texto muy largo), se redacta la
//     necesidad con el oficio entendido («Busco a alguien que cocine a
//     domicilio») y lo que se sabe: para quién, si urge, a qué hora;
//   · una búsqueda anterior que no es de este profesional no se usa.
// Nada inventado: ni motivos, ni valoraciones, ni disponibilidad. Se edita y
// solo sale al pulsar Enviar.
const planoOp = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const FRASE_SUYA = /^(necesito|necesitamos|necesitaria|busco|buscamos|buscaba|quiero|queremos|quisiera|tengo|tenemos|me |mi |mis |se me|se nos|se ha|se han|estoy|estamos|hay |no me|no nos|no puedo|nuestr|llevo|mi hijo|mi hija|mi madre|mi padre)/
const URGE = /\b(urgente|urgencia|cuanto antes|lo antes posible|ahora mismo|hoy mismo)\b/

function sinSaludo(q) {
  let t = String(q || '').trim().replace(/\s+/g, ' ')
  // «Hola buenas tardes, …»: todos los saludos del principio (si no, «buenas
  // tardes» parecía pedir «por la tarde»).
  for (let i = 0; i < 3; i++) {
    t = t.replace(/^(buenas tardes|buenas noches|buenos d[ií]as|hola|buenas|hey)( nura)?[\s,.!:;-]*/i, '').trim()
  }
  return t
}

export function buildChatOpener({ helper, userQuery, analysis } = {}) {
  const first = getFirstName(helper?.name)
  const saludo = first ? `Hola, ${first}.` : 'Hola.'
  let q = sinSaludo(userQuery)

  // ¿La búsqueda es de ESTE profesional? Si nombra otro oficio (una búsqueda
  // anterior, de otra cosa), no se usa.
  const oficios = q ? oficiosDe(q) : []
  const suyo = oficios.find(o => esDelOficio(helper?.specialty || '', o.id) || oficio(o.id)?.cat === helper?.category)
  if (oficios.length && !suyo) q = ''
  const a = q ? analysis : null
  const t = planoOp(q)

  const partes = [saludo]
  // Sus palabras, si ya son una frase suya (aunque sea larga: los detalles
  // «84 años», «la ducha» son lo que el profesional necesita saber).
  const esFraseSuya = q && FRASE_SUYA.test(t) && q.length <= 280 && !q.includes('?') && q.split(' ').length >= 3
  if (esFraseSuya) {
    const f = q.charAt(0).toUpperCase() + q.slice(1)
    partes.push(/[.!…]$/.test(f) ? f : `${f}.`)
  } else if (suyo) {
    const o = oficio(suyo.id)
    // «Busco un fontanero» antes que «a alguien que sea fontanero».
    partes.push(/^que sea /.test(o.quien)
      ? `Busco un ${o.nombre} y he visto tu perfil en Nüra.`
      : `Busco a alguien ${o.quien} y he visto tu perfil en Nüra.`)
  } else {
    partes.push('He visto tu perfil en Nüra y me gustaría contar contigo.')
  }

  // Lo que se sabe y no está ya dicho con sus palabras. «para mi hijo de 10
  // años» se conserva tal cual; si no, la persona entendida.
  if (!esFraseSuya) {
    const suPara = q.match(/\bpara (mi|mis|nuestr[oa]s?) [^,.;?¿!]+/i)?.[0]
    const para = labelDe(a?.persona)
    if (suPara) partes.push(`Es ${suPara.trim()}.`)
    else if (para) partes.push(`Es para ${para.replace(/^tu /, 'mi ')}.`)
  }
  const urge = Boolean(a?.urgente) || URGE.test(t)
  if (urge && !esFraseSuya) partes.push('Es bastante urgente.')
  const { franja, precio } = preferenciasDe(q)
  if (franja && !esFraseSuya) partes.push(`Me vendría mejor ${NOMBRE_FRANJA[franja]}.`)

  partes.push(urge ? '¿Tendrías hueco hoy o mañana?' : '¿Tienes disponibilidad en los próximos días?')
  if (precio) partes.push('¿Y qué precio tendría?')
  return partes.join(' ')
}

export function buildIntroLetter({ helper, analysis, userQuery, user }) {
  const helperFirstName = getFirstName(helper?.name)
  const userFirstName = getFirstName(user?.name) || 'un usuario de Nüra'

  const situation = describeSituation(analysis, userQuery)
  const timing = describeTiming(analysis)
  const whyThis = describeWhyThisProfessional(helper)

  const greeting = helperFirstName
    ? `Hola ${helperFirstName}, soy Nüra.`
    : 'Hola, soy Nüra.'

  const intro = user?.name
    ? `Te escribo en nombre de ${userFirstName}.`
    : 'Te escribo en nombre de una persona que busca ayuda.'

  const body = `${intro} ${situation.charAt(0).toUpperCase()}${situation.slice(1)}.${timing}`

  const subjectName = user?.name ? userFirstName : 'Esta persona'
  const closing = `Pensé en ti por ${whyThis}. ${subjectName} está disponible para hablar cuando te vaya bien.`

  return `${greeting} ${body} ${closing}`
}

/**
 * Genera una variación ligeramente distinta del mensaje (para el botón "Regenerar").
 * Cambia el orden y alguna frase, sin alterar los hechos.
 */
export function regenerateIntroLetter(params) {
  const base = buildIntroLetter(params)
  const { helper, user } = params
  const helperFirstName = getFirstName(helper?.name)
  const userFirstName = getFirstName(user?.name) || 'Una persona de Nüra'

  // Variación alternativa: más directa, menos formal
  const situation = describeSituation(params.analysis, params.userQuery)
  const timing = describeTiming(params.analysis)
  const whyThis = describeWhyThisProfessional(helper)

  return `Hola${helperFirstName ? ' ' + helperFirstName : ''}, soy Nüra. Ayudo a ${userFirstName} a encontrar profesionales de confianza. ${situation.charAt(0).toUpperCase()}${situation.slice(1)}.${timing} Pensé en ti por ${whyThis}. ¿Podrías ayudar?`
}
