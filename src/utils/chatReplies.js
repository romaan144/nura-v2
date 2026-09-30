import { getFirstName } from './name'
import { labelDe } from './personas'

// ── Chat Reply Utilities ─────────────────────────────────────────────────
// Business logic for generating helper responses, separated from UI layer

function generateFirstMessage(helper) {
  const name = getFirstName(helper.name) || ''
  const map = {
    logopeda:    `Hola${name ? ` ${name}` : ''}, necesito ayuda con logopedia. ¿Tienes disponibilidad esta semana?`,
    tecnico:     `Hola${name ? ` ${name}` : ''}, tengo un problema que necesita un técnico. ¿Cuándo podrías venir?`,
    limpieza:    `Hola${name ? ` ${name}` : ''}, busco servicio de limpieza del hogar. ¿Estarías disponible?`,
    cuidado:     `Hola${name ? ` ${name}` : ''}, busco a alguien de confianza para cuidar a un familiar. ¿Podríamos hablar?`,
    mascotas:    `Hola${name ? ` ${name}` : ''}, necesito a alguien que cuide mi mascota. ¿Estarías disponible?`,
    matematicas: `Hola${name ? ` ${name}` : ''}, mi hijo necesita refuerzo escolar. ¿Darías clases?`,
    entrenador:  `Hola${name ? ` ${name}` : ''}, me gustaría empezar a entrenar. ¿Cuándo podría ser la primera sesión?`,
  }
  return map[helper.category] || `Hola${name ? ` ${name}` : ''}, ¿tienes disponibilidad?`
}

// ── Respuestas del profesional de ejemplo (solo modo demo) ───────────────
// Contesta a LO QUE SE PREGUNTA (precio, día, zona, urgencia…) y, si le
// cuentan el problema, pide lo que falta sin repetir preguntas ya hechas.
// Antes volvía a saludar tras leer el problema, contestaba al precio con
// otra pregunta y se despedía con su propio nombre.

const plano = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Categorías de la base con otro nombre en la app.
const ALIAS_CATEGORIA = { limpieza: 'hogar', matematicas: 'clases', educacion: 'clases', logopeda: 'logopedia' }

// Por categoría: cómo encaja lo que le cuentan, qué le falta saber (en orden)
// y cuál es el siguiente paso natural.
const OFICIOS = {
  tecnico: { encaja: 'Es el tipo de avería que arreglo a menudo.', preguntas: ['¿Desde cuándo pasa?', '¿Me puedes mandar una foto por aquí? Así llevo lo necesario.'], paso: 'pase a verlo' },
  hogar: { encaja: 'Es justo el tipo de trabajo que hago.', preguntas: ['¿Cuántos metros tiene la vivienda, más o menos?', '¿Con qué frecuencia lo necesitarías?'], paso: 'pase a verlo' },
  clases: { encaja: 'Doy clases justo de eso.', preguntas: ['¿En qué curso está y qué le cuesta más?', '¿Hay algún examen cerca?'], paso: 'hagamos la primera clase' },
  logopedia: { encaja: 'Son casos que trabajo a diario.', preguntas: ['¿Qué edad tiene?', '¿Qué dificultades concretas notáis?'], paso: 'hagamos una primera valoración' },
  salud: { encaja: 'Es algo que trato a menudo.', preguntas: ['¿Desde cuándo te pasa?', '¿Te lo ha visto ya algún otro profesional?'], paso: 'hagamos una primera sesión' },
  cuidado: { encaja: 'Tengo experiencia en situaciones así.', preguntas: ['¿Qué necesita exactamente y en qué horario?', '¿Cómo está de movilidad?'], paso: 'nos conozcamos sin compromiso' },
  mascotas: { encaja: 'Me encargo de eso a menudo.', preguntas: ['¿Qué animal es y qué edad tiene?', '¿Qué días lo necesitarías?'], paso: 'nos conozcamos con tu mascota' },
  legal: { encaja: 'Es un tipo de caso que llevo.', preguntas: ['¿Tienes algún documento relacionado?', '¿Hay algún plazo que corra prisa?'], paso: 'tengamos una primera consulta' },
  tecnologia: { encaja: 'Es algo que resuelvo a menudo.', preguntas: ['¿Qué aparato o programa es?', '¿Qué pasa exactamente cuando falla?'], paso: 'lo miremos juntos' },
  diseno: { encaja: 'Es el tipo de proyecto que hago.', preguntas: ['¿Para cuándo lo necesitas?', '¿Tienes algún ejemplo de lo que te gusta?'], paso: 'hablemos del proyecto' },
  eventos: { encaja: 'Organizo cosas así a menudo.', preguntas: ['¿Qué fecha tenéis pensada?', '¿Para cuántas personas es?'], paso: 'lo hablemos con calma' },
  automocion: { encaja: 'Es una avería que veo a menudo.', preguntas: ['¿Qué coche es y de qué año?', '¿Desde cuándo lo notas?'], paso: 'le eche un vistazo' },
  entrenador: { encaja: 'Es justo con lo que trabajo.', preguntas: ['¿Qué objetivo tienes?', '¿Tienes alguna lesión que deba tener en cuenta?'], paso: 'hagamos la primera sesión' },
}
const GENERICO = { encaja: 'Creo que puedo ayudarte.', preguntas: ['¿Me cuentas un poco más?'], paso: 'lo hablemos' }

const DIAS_RE = /\b(hoy|manana|pasado manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo|esta semana|la semana que viene|el finde|fin de semana)\b/
const FRANJA_RE = /\b(por la manana|por la tarde|por la noche|a mediodia|a las \d{1,2}(:\d{2})?|\d{1,2} ?h\b|\d{1,2}:\d{2})/

const PRECIO_RE = /\b(precio|cuanto (cobras|cuesta|costaria|sale|saldria|seria|pides)|coste|tarifa|presupuesto|cobras)\b|€/
const PIDE_DIA_RE = /\b(disponib\w*|cuando|hueco|horario|agenda|puedes venir|podrias venir|te va bien|que dia)\b/
const ZONA_RE = /\b(donde|zona|domicilio|a casa|online|videollamada|desplaz\w*|vienes)\b/

function diaYFranja(t) {
  const dia = t.match(DIAS_RE)?.[0]
  const franja = t.match(FRANJA_RE)?.[0]
  if (!dia && !franja) return null
  const bonito = s => s.replace('manana', 'mañana').replace('miercoles', 'miércoles').replace('sabado', 'sábado').replace('mediodia', 'mediodía')
  const conArticulo = dia && /^(lunes|martes|miercoles|jueves|viernes|sabado|domingo)$/.test(dia) ? `el ${dia}` : dia
  return [conArticulo, franja].filter(Boolean).map(bonito).join(' ')
}

/**
 * La respuesta del profesional de ejemplo a `userMsg`.
 * `historial`: los mensajes anteriores del chat ({ from, text }).
 */
function getHelperReply(helper, count, userMsg = '', { historial = [] } = {}) {
  const t = plano(userMsg).replace(/[¿?¡!.,;]/g, ' ').replace(/\s+/g, ' ').trim()
  const cat = ALIAS_CATEGORIA[helper?.category] || helper?.category
  const oficio = OFICIOS[cat] || GENERICO
  const dichoPorMi = historial.filter(m => m.from === 'helper').map(m => plano(m.text)).join(' | ')
  const yaContado = historial.some(m => m.from === 'user' && plano(m.text).length >= 25)
  const zona = helper?.zone || helper?.city || ''

  const partes = []
  const cuando = diaYFranja(t)
  const pideUrgencia = /\b(urgente|urgencia|cuanto antes|ahora mismo|ya mismo|lo antes posible)\b/.test(t) || /^hoy\b|\bhoy mismo\b/.test(t)
  const pidePrecio = PRECIO_RE.test(t)
  const pideDia = cuando || PIDE_DIA_RE.test(t)
  const pideZona = ZONA_RE.test(t)
  const pideOpiniones = /\b(opinion\w*|resena\w*|valoracion\w*|referencias)\b/.test(t)
  const pideExperiencia = /\b(experiencia|cuantos anos|titulo|titulacion|colegiad\w*)\b/.test(t)
  const cierra = /^(vale|ok|okey|perfecto|genial|de acuerdo|gracias|muchas gracias|estupendo|hecho|trato hecho|guay|me parece bien|sí|si)( .{0,30})?$/.test(t)
  const soloSaludo = /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|holi)( [a-z]+)?$/.test(t)

  if (soloSaludo) return '¡Hola! Cuéntame qué necesitas y te digo cómo puedo ayudarte.'

  // Si es la primera vez que cuenta algo con detalle, primero se reconoce.
  const cuentaAlgo = !yaContado && t.length >= 25
  if (cuentaAlgo) partes.push(`Entendido, gracias por contármelo. ${oficio.encaja}`)

  if (pideUrgencia) {
    partes.push(helper?.urgent ? 'Atiendo urgencias, así que puedo pasar hoy mismo.' : 'Hoy lo tengo complicado, pero te busco el primer hueco que tenga.')
  }
  if (pidePrecio) {
    partes.push(helper?.price ? `Mi tarifa es de ${helper.price}.` : 'El precio depende del trabajo. Cuando lo vea te doy un presupuesto cerrado.')
  }
  if (pideDia && !pideUrgencia) {
    partes.push(cuando ? `${cuando[0].toUpperCase()}${cuando.slice(1)} me va bien. Si te encaja, lo confirmas con el botón Contratar.` : '¿Qué día y a qué hora te vendría bien?')
  }
  if (pideZona) {
    const donde = zona ? `en ${zona}` : 'en persona'
    partes.push(helper?.online && helper?.presential ? `Trabajo ${donde} y también online. ¿Qué prefieres?` : helper?.online && !helper?.presential ? 'Trabajo online, por videollamada.' : `Trabajo ${donde}.`)
  }
  if (pideOpiniones) partes.push(helper?.reviews ? `Tengo ${helper.reviews} opiniones, con una media de ${helper.rating}. Están en mi perfil.` : 'Las opiniones de quienes han trabajado conmigo están en mi perfil.')
  if (pideExperiencia) partes.push('Sí, es a lo que me dedico. En mi perfil tienes mi experiencia y formación.')

  const pregunto = pideUrgencia || pidePrecio || pideDia || pideZona || pideOpiniones || pideExperiencia
  if (!pregunto && cierra) {
    const hayDia = historial.some(m => DIAS_RE.test(plano(m.text)))
    return hayDia ? '¡Perfecto! Nos vemos entonces. Si surge algo, escríbeme por aquí.' : '¡Genial! Cuando quieras concretamos el día.'
  }

  // Con el día ya acordado, no se vuelve a preguntar por él.
  const acordado = historial.some(m => m.from === 'helper' && /me va bien/.test(plano(m.text)))
  if (!pregunto && acordado) return 'Te lo confirmo por aquí antes del día. Cualquier otra duda, pregúntame.'

  // Lo siguiente que falta saber, sin repetir lo ya preguntado.
  if (!pregunto || cuentaAlgo) {
    const pendiente = oficio.preguntas.find(q => !dichoPorMi.includes(plano(q).slice(1, 25)))
    if (pendiente && !(pideDia && cuando)) partes.push(pendiente)
    else if (!pideDia) partes.push(`Con eso me hago una idea. ¿Qué día te vendría bien que ${oficio.paso}?`)
  }
  return partes.join(' ') || 'Cuéntame un poco más y te digo cómo puedo ayudarte.'
}

// ── Respuestas rápidas: los botones bajo el último mensaje ─────────────────
// Según cómo va la conversación: no sugiere lo ya preguntado, propone días
// concretos cuando el profesional pregunta cuándo y, con el día acordado,
// ofrece Contratar (Chat abre con él la hoja de contratar, no manda texto).
const CONTRATAR = 'Contratar'
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** Dos propuestas de día: mañana (si es laborable) y el siguiente laborable. */
function proximosDias(hoy = new Date()) {
  const d = new Date(hoy)
  const salida = []
  for (let dias = 1; salida.length < 2; dias++) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    salida.push(dias === 1 ? 'Mañana por la tarde' : `El ${DIAS_SEMANA[d.getDay()]} por la mañana`)
  }
  return salida
}

function respuestasRapidas(messages = [], hoy = new Date()) {
  const de = quien => (messages || []).filter(m => m.from === quien).map(m => plano(m.text).replace(/[¿?¡!.,;]/g, ' '))
  const yo = de('user'), el = de('helper')
  if (!yo.length) return ['¿Tienes disponibilidad esta semana?', '¿Cuál es tu precio?', '¿Trabajas en mi zona?']
  if (el.some(t => /me va bien/.test(t))) return [CONTRATAR, 'Gracias, hasta entonces']

  const precio = yo.some(t => PRECIO_RE.test(t)) || el.some(t => /tarifa|presupuesto/.test(t))
  const zona = yo.some(t => ZONA_RE.test(t)) || el.some(t => /\btrabajo (en|online)/.test(t))
  const dia = yo.some(t => DIAS_RE.test(t) || PIDE_DIA_RE.test(t))
  const ultimo = el[el.length - 1] || ''

  // Si acaba de preguntar qué día, se contesta con días.
  if (/que dia/.test(ultimo)) return [...proximosDias(hoy), ...(precio ? [] : ['¿Cuánto cobras?'])]
  const salida = []
  if (!dia) salida.push('¿Qué día podrías?')
  if (!precio) salida.push('¿Cuánto cobras?')
  if (!zona && salida.length < 2) salida.push('¿Trabajas en mi zona?')
  return salida.length ? salida : [CONTRATAR]
}

function getNuraIntervention(helper, count, messages) {
  const name = getFirstName(helper.name) || helper.name
  if (count < 2) return null

  // Read all message text to detect booking signals
  const allText = (messages || [])
    .map(m => (m.text || m.lines?.join(' ') || '').toLowerCase())
    .join(' ')

  const hasDia = /lunes|martes|miércoles|jueves|viernes|sábado|domingo|mañana|semana|esta semana|próxima|pasado|día [0-9]/i.test(allText)
  const hasHora = /[0-9]+h|[0-9]+:[0-9]+|por la mañana|por la tarde|por la noche|a las/i.test(allText)
  // «me cuesta dormir» no es hablar de precio: solo señales claras.
  const hasPrecio = /€|\bprecio\b|tarifa|cu[aá]nto cobr|presupuesto/i.test(allText)
  // Si el profesional acaba de mencionar Contratar, Nüra no lo repite.
  const ultimo = (messages || []).filter(m => m.from === 'helper').pop()?.text || ''
  const yaDijoContratar = /contratar/i.test(ultimo)
  const hasPositivo = /perfecto|genial|ok|bien|de acuerdo|confirmado|confirmamos|me viene|me parece|trato|vale|sí|claro/i.test(allText)
  const hasBookingSignal = hasDia && hasPositivo

  // BOOKING MOMENT: date mentioned + positive response → push CTA now
  // Una sola vez: si ya lo ha preguntado, no insiste.
  const yaPropuso = (messages || []).some(m => m.from === 'nura' && /Confirmo la reserva/.test(m.text || ''))
  if (hasBookingSignal && count >= 3 && !yaPropuso) {
    return `Todo apunta a que habéis llegado a un acuerdo. ¿Confirmo la reserva con **${name}**?`
  }

  // Price discussed → reassure
  if (hasPrecio && count === 3 && !yaDijoContratar) {
    return `El precio está claro. Si todo te parece bien, puedes confirmar desde el botón **Contratar**.`
  }

  // Count-based fallbacks for when no signals detected
  const fallbacks = {
    2: `¿Necesitas algo más antes de decidir? Puedo buscar alternativas si quieres comparar.`,
    5: `**${name}** tiene ${String(helper.rating || 4.8).replace('.', ',')} sobre 5 de media con ${helper.reviews || 0} valoraciones reales.`,
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
  const firstName = getFirstName(helper?.name) || ''
  const persona = labelDe(analysis?.persona)
  const s = analysis?.complexSignals || {}
  const especial =
    s.alzheimer ? 'Los casos de Alzheimer son mi día a día desde hace años, así que entiendo bien lo que necesitáis.' :
    s.infantil ? 'Trabajo con niños a través del juego y con mucha paciencia.' :
    s.sola ? 'Sé lo importante que es una compañía constante y de confianza.' :
    `Es exactamente el tipo de ayuda que doy cada semana${helper?.specialty ? ` como ${helper.specialty.toLowerCase()}` : ''}.`
  const msg1 = `Hola, soy ${firstName}. Acabo de leer tu mensaje con calma${persona ? `. Será un placer ayudar con ${persona}` : ''}. ${especial}`
  const franja = detectFranja(userQuery)
  const day = nextBusinessDay()
  const msg2 = `Si te parece, podemos empezar con una primera visita sin compromiso para conocernos. ¿Te iría bien el ${day} ${franja}?`
  return { messages: [msg1, msg2], proposal: { label: `${day} ${franja}` } }
}

export { generateFirstMessage, getHelperReply, getNuraIntervention, buildLivingConversation, respuestasRapidas, CONTRATAR }
