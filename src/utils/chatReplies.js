import { getFirstName } from './name'
import { labelDe } from './personas'

// ── Chat Reply Utilities ─────────────────────────────────────────────────
// Business logic for generating helper responses, separated from UI layer

function generateFirstMessage(helper) {
  const name = helper.name?.split(' ')?.[0] || 'Hola'
  const map = {
    logopeda:    `Hola ${name}, te contacto Hola, necesito ayuda con logopedia. ¿Tienes disponibilidad esta semana?`,
    tecnico:     `Hola ${name}, Tengo un problema que necesita un técnico. ¿Cuándo podrías venir?`,
    limpieza:    `Hola ${name}, Busco servicio de limpieza del hogar. ¿Estarías disponible?`,
    cuidado:     `Hola ${name}, Busco a alguien de confianza para cuidar a un familiar. ¿Podríamos hablar?`,
    mascotas:    `Hola ${name}, Necesito a alguien que cuide mi mascota. ¿Estarías disponible?`,
    matematicas: `Hola ${name}, Mi hijo necesita refuerzo escolar. ¿Darías clases?`,
    entrenador:  `Hola ${name}, Me gustaría empezar a entrenar. ¿Cuándo podría ser la primera sesión?`,
  }
  return map[helper.category] || `Hola ${name}, te contacto Hola, ¿tienes disponibilidad?`
}

function getHelperReply(helper, count, userMsg = '', isIntroLetter = false) {
  const name = getFirstName(helper.name) || ''
  const t = userMsg.toLowerCase()

  // Response to a Nüra-written intro letter — acknowledge the context, don't re-ask basics
  if (isIntroLetter && count === 1) {
    const cat = helper.category || 'otro'
    const acknowledgments = {
      logopeda:    `Hola, gracias por escribir. He leído el contexto que me ha pasado Nüra — me encajan bien estos casos. ¿Te viene bien que hablemos esta semana para concretar horarios?`,
      cuidado:     `Hola, gracias por confiar en mí. Ya tengo una idea clara de la situación gracias al mensaje de Nüra. ¿Podemos hablar para conocer mejor los horarios y empezar pronto?`,
      tecnico:     `Hola, perfecto, ya veo de qué se trata. Puedo pasar a verlo. ¿Qué días te van mejor?`,
      salud:       `Hola, gracias por contarme tu situación a través de Nüra. Me gustaría agendar una primera sesión para conocernos mejor. ¿Tienes disponibilidad esta semana?`,
      legal:       `Hola, he leído el resumen de tu caso. Creo que puedo orientarte bien. ¿Te viene bien una primera llamada para hablar con más detalle?`,
      entrenador:  `Hola, genial que me escribas. Con el contexto que me ha dado Nüra ya tengo una idea de por dónde empezar. ¿Reservamos la primera sesión de valoración?`,
      mascotas:    `Hola, gracias por el mensaje. Encantada de ayudar — ¿cuándo te vendría bien empezar?`,
      clases:      `Hola, gracias por escribir. Con lo que me cuenta Nüra ya sé por dónde enfocar las clases. ¿Empezamos esta semana?`,
    }
    return acknowledgments[cat] || `Hola, gracias por escribirme con tanto detalle. Ya tengo claro el contexto — ¿cuándo te vendría bien que habláramos?`
  }

  // Initial greeting (count=0) — warm professional hello
  if (count === 0) {
    const cat = helper.category || 'otro'
    const greetings = {
      logopedia:  `¡Hola! Soy ${name}. ¿En qué puedo ayudarte?`,
      cuidado:    `¡Hola! Soy ${name}. ¿En qué puedo ayudarte?`,
      tecnico:    `¡Hola! Soy ${name}. ¿En qué puedo ayudarte?`,
      limpieza:   `¡Hola! Soy ${name}. ¿En qué puedo ayudarte?`,
      entrenador: `¡Hola! Soy ${name}. ¿En qué puedo ayudarte?`,
      salud:      `¡Hola! Soy ${name}. ¿En qué puedo ayudarte?`,
      legal:      `¡Hola! Soy ${name}. ¿En qué puedo ayudarte?`,
    }
    return greetings[cat] || `¡Hola! Soy ${name}. ¿En qué puedo ayudarte?`
  }

  // First user message — respond with category-specific question
  if (count === 1) {
    const cat = helper.category || 'otro'
    const specific = {
      logopeda:    `Hola, gracias por escribirme. ¿Me cuentas la edad y qué dificultades concretas observas?`,
      cuidado:     `Hola, con mucho gusto. ¿Puedes contarme un poco sobre tu familiar — movilidad, horarios, lo que necesite?`,
      tecnico:     `Hola, dime en qué consiste el problema exactamente. Así vengo preparado con lo necesario.`,
      limpieza:    `Hola, disponibilidad tengo. ¿Cuántos metros es la vivienda y con qué frecuencia lo necesitarías?`,
      entrenador:  `Hola, la primera sesión es de valoración gratuita. ¿Esta semana te viene bien?`,
      salud:       `Hola, cuéntame qué te ocurre. Así valoro si puedo ayudarte y cómo.`,
      legal:       `Hola, para orientarte bien necesito saber más sobre el caso. ¿Qué tipo de situación es?`,
      nutricion:   `Hola, para ayudarte bien necesito saber: ¿tienes algún objetivo concreto — perder peso, ganar músculo, mejorar energía?`,
      psicologia:  `Hola, gracias por escribirme. ¿Llevas mucho tiempo con esto o es algo más reciente?`,
      fisio:       `Hola, cuéntame qué zona te molesta y cuándo empezó. Así valoro si puedo ayudarte.`,
      abogado:     `Hola, para orientarte necesito entender la situación. ¿Es un tema laboral, familiar o civil?`,
      contable:    `Hola, ¿de qué tipo de gestión se trata — declaración de renta, autónomo, empresa?`,
      mascotas:    `Hola, ¿qué raza y edad tiene? Y ¿qué servicio necesitas exactamente — cuidado, adiestramiento, paseos?`,
      educacion:   `Hola, ¿para qué curso y asignatura necesitas el apoyo? ¿Hay alguna fecha de examen próxima?`,
      idiomas:     `Hola, ¿cuál es tu nivel actual y para qué necesitas el idioma — trabajo, viaje, examen?`,
    }
    return specific[cat] || `Hola, gracias por contactarme. Cuéntame qué necesitas exactamente y te digo cómo puedo ayudarte.`
  }

  // Universal keyword responses (override category)
  if (t.includes('precio') || t.includes('cuánto') || t.includes('coste') || t.includes('tarifa'))
    return `Mi tarifa es ${helper.price || 'a consultar según el servicio'}. ¿Te parece bien?`
  if (t.includes('disponib') || t.includes('cuándo') || t.includes('horario') || t.includes('esta semana'))
    return `Sí, tengo disponibilidad. ¿Qué día y hora te vendría mejor?`
  if (t.includes('dónde') || t.includes('zona') || t.includes('domicilio') || t.includes('online'))
    return helper.online && helper.presential
      ? `Trabajo tanto presencial en ${helper.zone || 'tu zona'} como online. ¿Cuál prefieres?`
      : `Trabajo en ${helper.zone || 'Barcelona'}. ¿Te queda bien?`
  if (t.includes('urgente') || t.includes('hoy') || t.includes('ahora') || t.includes('rápido'))
    return helper.urgent
      ? `Sí, atiendo urgencias. ¿Me cuentas más?`
      : `No hago urgencias normalmente, pero dime qué necesitas y lo vemos.`
  if (t.includes('gracias') || t.includes('perfecto') || t.includes('genial') || t.includes('de acuerdo')) {
    const firstName = helper.name?.split(' ')?.[0] || ''
    const options = [
      `¡Perfecto! Cuando quieras cerramos los detalles, ${firstName}.`,
      `Genial. Avísame cuando quieras concretar y lo organizamos.`,
      `Cuando quieras seguir, aquí estaremos.`,
    ]
    return options[Math.floor(Math.random() * options.length)]
  }
  if (t.includes('referencia') || t.includes('opinión') || t.includes('reseña') || t.includes('valoración'))
    return `Tengo ${helper.reviews || 0} valoraciones con una media de ${helper.rating || 4.5} estrellas. Puedes verlas en mi perfil.`
  if (t.includes('contrat') || t.includes('reservar') || t.includes('apuntar'))
    return `Con mucho gusto. Dime cuándo y te confirmo disponibilidad.`
  // Only generic greeting if ONLY a greeting (no other content)
  if ((t.includes('hola') || t.includes('buenas') || t.includes('buenos')) && t.length < 15)
    return `¡Hola! Soy ${name}. ¿En qué puedo ayudarte?`

  const replies = {
    logopeda: [
      `¡Hola! Claro, tengo disponibilidad esta semana. ¿Me cuentas más sobre el caso para ver si es mi especialidad?`,
      `Perfecto. ¿Cuántos años tiene y qué dificultades concretas has observado?`,
      `Podemos empezar con una sesión de evaluación para conocer el punto de partida. ¿Te viene bien esta semana?`,
    ],
    tecnico: [
      `Hola, puedo pasarme hoy o mañana. ¿De qué se trata exactamente? Así vengo preparado.`,
      `Entendido. ¿Cuándo empezó el problema? Eso me ayuda a saber qué materiales traer.`,
      `Perfecto, te confirmo la hora. El desplazamiento dentro de tu zona no tiene coste adicional.`,
    ],
    limpieza: [
      `¡Hola! Sí, tengo huecos disponibles. ¿Cuántos metros tiene la casa aproximadamente?`,
      `Trabajo con productos ecológicos sin coste adicional. ¿Qué días te vendrían mejor?`,
      `Puedo empezar esta misma semana. ¿El jueves a las 10h te iría bien?`,
    ],
    cuidado: [
      `Buenas, con mucho gusto. ¿Me puedes contar un poco sobre tu familiar? ¿Movilidad, medicación, horarios?`,
      `Tengo experiencia con personas mayores y situaciones de dependencia. ¿Cuántas horas al día necesitarías?`,
      `Podríamos quedar primero para conocernos sin compromiso. ¿Te parece bien esta semana?`,
    ],
    mascotas: [
      `¡Hola! ¿Qué raza y tamaño tiene tu mascota? ¿Necesita paseos diarios o cuidado en casa?`,
      `Mando fotos y actualizaciones cada pocas horas para que estés tranquilo.`,
      `¿Qué fechas necesitarías? Cuanto antes lo reservemos mejor, ya que tengo agenda limitada.`,
    ],
    matematicas: [
      `¡Hola! ¿En qué curso está y qué temas le cuestan más? Así preparo el material adecuado.`,
      `Puedo dar clases presenciales o por videollamada, el precio es el mismo. ¿Cuál prefieres?`,
      `Empezamos con una sesión de diagnóstico para ver el nivel exacto y diseñar el plan.`,
    ],
    entrenador: [
      `¡Hola! La primera sesión es gratuita para evaluar objetivos y estado físico. ¿Te viene bien esta semana?`,
      `Trabajo a domicilio, en parque o en tu gimnasio. ¿Cuál prefieres y cuántos días a la semana?`,
      `¿Tienes alguna lesión o condición física que deba tener en cuenta?`,
    ],
  }
  const extraReplies = {
    salud: [
      `Hola, con mucho gusto. ¿Me comentas qué síntomas o dudas tienes? Así puedo orientarte mejor antes de la consulta.`,
      `Puedo hacer la primera valoración de forma presencial u online, como prefieras.`,
      `Cuéntame con más detalle y te digo si es algo que trato directamente o si te derivo a un especialista.`,
    ],
    legal: [
      `Buenos días. ¿Me explicas brevemente la situación? Con eso puedo decirte si es de mi especialidad y el enfoque que daría.`,
      `La primera consulta es orientativa, sin compromiso. ¿Tienes alguna documentación relacionada?`,
      `Trabajo principalmente en Barcelona pero puedo hacer consultas por videollamada también.`,
    ],
    hogar: [
      `Hola, cuéntame el proyecto. ¿Es una reforma completa, una habitación o algo más puntual?`,
      `¿Tienes ya alguna idea de lo que quieres o empezamos desde cero? En ambos casos podemos trabajar.`,
      `Puedo visitarte sin compromiso para ver el espacio y darte una valoración más concreta.`,
    ],
  }
  const allReplies = { ...replies, ...extraReplies }
  const r = allReplies[helper.category] || [
    `Hola, gracias por escribirme. ¿Me cuentas un poco más sobre lo que necesitas?`,
    `Cuéntame con más detalle para poder orientarte mejor.`,
    `Podemos hacer una primera consulta sin compromiso esta semana si te parece bien.`,
  ]
  return r[Math.min(count, r.length - 1)]
}

function getNuraIntervention(helper, count, messages) {
  const name = helper.name?.split(' ')?.[0] || helper.name
  if (count < 2) return null

  // Read all message text to detect booking signals
  const allText = (messages || [])
    .map(m => (m.text || m.lines?.join(' ') || '').toLowerCase())
    .join(' ')

  const hasDia = /lunes|martes|miércoles|jueves|viernes|sábado|domingo|mañana|semana|esta semana|próxima|pasado|día [0-9]/i.test(allText)
  const hasHora = /[0-9]+h|[0-9]+:[0-9]+|por la mañana|por la tarde|por la noche|a las/i.test(allText)
  const hasPrecio = /€|precio|cobro|cuesta|tarifa/i.test(allText)
  const hasPositivo = /perfecto|genial|ok|bien|de acuerdo|confirmado|confirmamos|me viene|me parece|trato|vale|sí|claro/i.test(allText)
  const hasBookingSignal = hasDia && hasPositivo

  // BOOKING MOMENT: date mentioned + positive response → push CTA now
  if (hasBookingSignal && count >= 3) {
    return `Todo apunta a que habéis llegado a un acuerdo. ¿Confirmo la reserva con **${name}**?`
  }

  // Price discussed → reassure
  if (hasPrecio && count === 3) {
    return `El precio está claro. Si todo te parece bien, puedes confirmar desde el botón **Contratar**.`
  }

  // Count-based fallbacks for when no signals detected
  const fallbacks = {
    2: `¿Necesitas algo más antes de decidir? Puedo buscar alternativas si quieres comparar.`,
    5: `**${name}** tiene ${helper.rating || 4.8}★ de media con ${helper.reviews || 0} valoraciones reales.`,
    7: `Cuando estés listo, confirma la reserva. Quedará en **Mis Servicios** con todos los detalles.`,
  }
  return fallbacks[count] || null
}

// ── La Conversación Viva — respuesta construida desde el contexto real ──
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function nextBusinessDay() {
  const d = new Date()
  do { d.setDate(d.getDate() + 1) } while (d.getDay() === 0 || d.getDay() === 6)
  return DIAS[d.getDay()]
}

function detectFranja(text) {
  const t = (text || '').toLowerCase()
  if (t.includes('tard')) return 'por la tarde'
  if (t.includes('noch')) return 'por la noche'
  return 'por la mañana'
}

function buildLivingConversation({ helper, analysis, userQuery }) {
  const firstName = helper?.name?.split(' ')?.[0] || ''
  const persona = labelDe(analysis?.persona)
  const s = analysis?.complexSignals || {}
  const especial =
    s.alzheimer ? 'Los casos de Alzheimer son mi día a día desde hace años, así que entiendo bien lo que necesitáis.' :
    s.infantil ? 'Trabajo muchísimo con peques — la paciencia y el juego son mi método.' :
    s.sola ? 'Sé lo importante que es una compañía constante y de confianza.' :
    `Es exactamente el tipo de ayuda que doy cada semana${helper?.specialty ? ` como ${helper.specialty.toLowerCase()}` : ''}.`
  const msg1 = `Hola, soy ${firstName} 😊 Acabo de leer tu mensaje con calma${persona ? ` — será un placer ayudar con ${persona}` : ''}. ${especial}`
  const franja = detectFranja(userQuery)
  const day = nextBusinessDay()
  const msg2 = `Si te parece, podemos empezar con una primera visita sin compromiso para conocernos. ¿Te iría bien el ${day} ${franja}?`
  return { messages: [msg1, msg2], proposal: { label: `${day} ${franja}` } }
}

export { generateFirstMessage, getHelperReply, getNuraIntervention, buildLivingConversation }
