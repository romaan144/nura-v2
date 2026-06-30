// ── Carta de Presentación Viva ──────────────────────────────────────────
// Nüra redacta el primer mensaje en nombre del usuario, dirigido al
// profesional, usando el contexto real de la conversación previa.
// No es una plantilla genérica: se construye combinando lo que el motor
// de matching ya sabe sobre la necesidad del usuario.

function getFirstName(fullName) {
  if (!fullName) return ''
  return fullName.replace(/^(Dr\.|Dra\.|DJ)\s+/i, '').split(' ')[0]
}

// Frases que describen la situación, basadas en categoría y señales complejas
function describeSituation(analysis, userQuery) {
  const cat = analysis?.categoria
  const signals = analysis?.complexSignals || {}

  if (signals.alzheimer) {
    return 'tiene una persona cercana con Alzheimer y necesita cuidado de confianza'
  }
  if (signals.infantil && cat === 'logopedia') {
    return 'tiene un niño o niña que necesita apoyo con el habla'
  }
  if (signals.infantil) {
    return 'necesita ayuda relacionada con sus hijos'
  }
  if (signals.sola) {
    return 'tiene una persona mayor que vive sola y necesita compañía y cuidado'
  }
  if (cat === 'cuidado') {
    return 'busca cuidado de confianza para alguien cercano'
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
  if (helper?.specialty) reasons.push(`tu experiencia en ${helper.specialty.toLowerCase()}`)
  if (helper?.reviews >= 50) reasons.push(`las ${helper.reviews} valoraciones que tienes`)
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
    ? `Te escribo en nombre de ${userFirstName} —`
    : 'Te escribo en nombre de una persona que me ha contado lo siguiente —'

  const body = `${intro} ${situation}.${timing}`

  const subjectName = user?.name ? userFirstName : 'Esta persona'
  const closing = `Vi ${whyThis} y creo que encajáis bien. ${subjectName} está disponible para hablar cuando te vaya bien.`

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

  return `Hola${helperFirstName ? ' ' + helperFirstName : ''}, soy Nüra — la IA que conecta a ${userFirstName} con profesionales de confianza. ${userFirstName} ${situation}.${timing} Pensé en ti por ${whyThis}. ¿Podrías ayudar?`
}
