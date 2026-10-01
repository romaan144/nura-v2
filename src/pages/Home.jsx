import UserAvatar from '../components/UserAvatar'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CAT_HUMANA } from '../data/categorias'
import { hayEnLaCiudad, ciudadDe } from '../data/ciudades'
import { Compass, Send, Mic, MicOff, RotateCcw, UserRound, ArrowUpRight, Heart, Home as House, Sparkles, MapPin, Wallet, Star, Monitor, Users, SlidersHorizontal } from 'lucide-react'
import { analyzeNeed, matchHelpers, getPriceContext } from '../utils/matching'
import { barrioEnTexto } from '../data/barrios'
import { getFirstName } from '../utils/name'
import { useUser } from '../context/UserContext'
import { showToast } from '../components/Toast'
import HelperCard from '../components/HelperCard'
import HelperCardTall from '../components/HelperCardTall'
import { getObra, TYPE_META } from '../data/obraPosts'
import HelperCarousel from '../components/HelperCarousel'
import RegisterGate from '../components/RegisterGate'
import { haptic } from '../utils/haptic'
import { recordarTrasBuscar } from '../utils/notifications'
import { fechaDeCita, yaPaso } from '../utils/citaAviso'
import { registrar, demandaDe } from '../utils/analitica'
import { lineasSinEncontrar } from '../utils/pulso'
import AlertaSheet from '../components/AlertaSheet'
import { useSinContestar } from '../utils/sinContestar'
import { useRespuestasNuevas } from '../utils/respuestasNuevas'
import RatingModal from '../components/RatingModal'
import { oficiosDe, esDelOficio } from '../data/oficios'
import { entenderSeguimiento, puntosFranja, preferenciasDe, necesidadesDe, NOMBRE_FRANJA } from '../utils/seguimiento'
import { tieneAlerta, misAlertas, alertasGuardadas } from '../utils/alertas'
import styles from './Home.module.css'
import { PULSO_THRESHOLD, PULSO_DELAY, CONFIRMACION_THRESHOLD } from '../config'
import { extractPersona } from '../utils/personas'
import { proSignals } from '../utils/proSignals'
import { fmtNota, fmtKm } from '../utils/formato'
import RecordatorioCita from '../components/RecordatorioCita'
import ResponseScreen from '../components/ResponseScreen'
import { splitResponseText } from '../utils/responseLayout'
import { pedirUbicacion, ordenarDesdeUbicacion, mensajeErrorUbicacion } from '../utils/ubicacion'

// ── La Comprensión Visible — lo que Nüra ha entendido, en chips ──
const PERSONA_CHIP = {
  madre:'Para tu madre', padre:'Para tu padre', hijo:'Para tu hijo', hija:'Para tu hija',
  abuela:'Para tu abuela', abuelo:'Para tu abuelo', marido:'Para tu marido',
  mujer:'Para tu mujer', pareja:'Para tu pareja', hermana:'Para tu hermana',
  hermano:'Para tu hermano', bebe:'Para tu bebé',
}

// ── La Recomendación — una persona primero, con convicción ──
// ── La Gramática: el porqué humano, ÚNICA fuente (chat + perfil) ──
function buildWhy(helper, analysis) {
  const paraLabel = analysis?.persona && PERSONA_CHIP[analysis.persona]
    ? PERSONA_CHIP[analysis.persona].charAt(0).toLowerCase() + PERSONA_CHIP[analysis.persona].slice(1)
    : ''
  const s = analysis?.complexSignals || {}
  const parts = []

  // ── LO CONCRETO PRIMERO ──────────────────────────────────────────────
  // Nüra tenia los datos y los convertia en frases genericas: decia
  // "trabaja muchisimo con peques" de alguien con 127 valoraciones, 8 años
  // de experiencia y un 94% de exito en dislalia infantil.
  // "Mucha experiencia" lo dice cualquiera. "127 familias le han valorado"
  // solo lo puede decir quien tiene el dato.
  const txt = `${helper?.specialty || ''} ${helper?.bio || ''} ${(helper?.tags || []).join(' ')}`.toLowerCase()

  // 0. Lo que pidio y el profesional confirmo de si mismo («habla catalán»,
  // «tiene coche»). Se dice de donde sale: lo ha declarado el, no Nüra.
  if (helper?.__declarado?.length) {
    const d = helper.__declarado.slice(0, 2)
    parts.push(`según su ficha, ${d.join(' y ')}`)
  }

  // 1. El anclaje al problema, con la palabra que uso la persona
  // La palabra tiene que ser un SUSTANTIVO que nombre el problema, no un
  // verbo suelto: "no pronuncia la R" daba "trabaja exactamente eso:
  // pronuncia", que no es nada. Se comprueba contra las etiquetas del
  // profesional, que si son oficios y especialidades.
  const etiquetas = (helper?.tags || []).map(t => String(t).toLowerCase())
  const clave = (analysis?.palabrasPropias || []).find(w =>
    w.length > 4 && !/^(pronunc|necesit|busc|quier|tengo|hacer)/.test(w) &&
    etiquetas.some(e => e.includes(w)))
  // «Su especialidad es justo eso: abogado» sonaba a plantilla: se nombra
  // lo que ES («es abogado laboralista, justo lo que buscas»).
  const esp = String(helper?.specialty || '').trim()
  // Quien da clases tiene de especialidad la materia («guitarra clásica»).
  const materia = ['clases', 'educacion', 'matematicas', 'idiomas'].includes(helper?.category)
    && !/^(profesor|profesora|maestr|tutor|monitor|entrenador|instructor)/i.test(esp)
  const espMin = `${esp.charAt(0).toLowerCase()}${esp.slice(1)}`
  if (clave && esp) parts.push(`${materia ? 'da clases de ' : 'es '}${espMin}, justo lo que buscas`)
  else if (clave) parts.push(`trabaja justo esto: ${clave}`)
  else if (s.alzheimer) parts.push('lleva años acompañando casos de Alzheimer')
  else if (s.infantil) parts.push('se dedica a niños, no es algo que haga de vez en cuando')
  else if (paraLabel) parts.push(`atiende casos como el ${paraLabel.replace('para ', 'de ')}`)

  // 2. Los años, si la bio los dice — es el dato que mas tranquiliza
  const años = (helper?.bio || '').match(/(\d+)\s*años de experiencia/)
  if (años) parts.push(`cuenta con ${años[1]} años de experiencia`)

  // 3. Cuantas personas le han valorado: una cifra pesa mas que un adjetivo
  if ((helper?.reviews || 0) >= 20 && (helper?.rating || 0) >= 4.7) {
    parts.push(`su valoración es de ${fmtNota(helper.rating)} sobre 5, con ${helper.reviews} opiniones`)
  }

  // 4. La distancia exacta, no "a unos minutos"
  // Solo si la persona dijo su barrio: si no, no hay distancia que contar.
  if (typeof helper?.distance === 'number' && helper.distanciaDesde && helper.distance <= 3) {
    parts.push(helper.distance < 0.5 ? `trabaja en ${helper.distanciaDesde}` : `está a ${fmtKm(helper.distance)} de ${helper.distanciaDesde}`)
  }

  if (helper?.__obra && parts.length < 2) parts.push('ha contado un caso muy parecido al tuyo')
  // «según su ficha, habla catalán y tiene coche y está a…» → con coma
  if (helper?.__declarado?.length === 2 && parts.length > 1) parts[0] = parts[0].replace(' y ', ', ')
  return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('. ') || 'Encaja con lo que necesitas'
}

const REFINE_ICONS = {
  'Más cerca': MapPin, 'Más barato': Wallet, 'Mejor valorado': Star,
  'Online': Monitor, 'Ver todos': Users, 'Crear cuenta': UserRound,
  'No es lo que buscaba': RotateCcw, 'Era otra cosa': RotateCcw,
}
function RefinementIcon({ label }) {
  const Icon = REFINE_ICONS[label] || SlidersHorizontal
  return <Icon size={17} aria-hidden="true" />
}



function getWelcome(user, searchHistory, following, helpersCache, contactedHelpers, personas, citas) {
  const hour = new Date().getHours()
  const greeting = hour < 14 ? 'Buenos días' : hour < 21 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.name?.split(' ')?.[0] || user?.name || ''
  /* NADIE SE LLAMA "USUARIO", y tampoco se saluda con una coma colgando.
     El onboarding inventaba el nombre "Usuario" cuando alguien saltaba ese
     paso — el primer saludo de un producto que va de calidez. Retirado.
     Pero entonces las siete plantillas `${greeting}, **${firstName}**.`
     producian "Buenas tardes, .". Se resuelve aqui, una vez, para todas. */
  const saludo = firstName ? `${greeting}, **${firstName}**.` : `${greeting}.`

  if (!user) return [
    `Hola. Soy **Nüra**.`,
    `Encuentra a quien puede ayudarte.`,
  ]

  // ── La Memoria Viva ─────────────────────────────────────────────────
  // If there's a confirmed successful connection, Nüra asks about that person
  // ── La Cita — el futuro recordado: la visita próxima saluda primero ──
  const citaProxima = (citas || []).slice().reverse().find(ci => {
    const c = (contactedHelpers || []).find(x => (x.id || x) === ci.helperId)
    return c && c.confirmed === undefined
  })
  if (citaProxima) {
    const hf = citaProxima.helperName?.split(' ')?.[0] || citaProxima.helperName
    return [
      saludo,
      citaProxima.personaLabel
        ? `El ${citaProxima.label}, **${hf}** está con ${citaProxima.personaLabel}. Todo listo.`
        : `El ${citaProxima.label} tienes tu primera cita con **${hf}**. Todo listo.`
    ]
  }

  const confirmedContacts = (contactedHelpers || []).filter(c => c?.confirmed === true)
  if (confirmedContacts.length > 0) {
    const last = confirmedContacts[confirmedContacts.length - 1]
    const helperFirst = getFirstName(last.name) || last.name
    // El Espejo — si este contacto está vinculado a una persona, preguntar por ella
    const linkedPersona = (personas || []).find(p => (p.contactedHelperIds || []).includes(last.id))
    if (linkedPersona) {
      return [
        saludo,
        `¿Cómo está ${linkedPersona.label}? Me alegra que **${helperFirst}** esté con vosotros. Si necesitas algo más, aquí estoy.`
      ]
    }
    return [
      saludo,
      `¿Cómo está yendo todo con **${helperFirst}**? Cuéntame si puedo ayudarte con algo más.`
    ]
  }

  // If there are contacts pending confirmation (no answer yet)
  // Antes aquí ya se preguntaba «¿Pudiste resolver…?» y, 4 segundos después,
  // llegaba OTRO mensaje con la misma pregunta y sus botones: la pantalla
  // dejaba de ser la de bienvenida y parecía recargarse. Ahora la pregunta
  // sale una vez, en el saludo y con sus botones (ver «La Confirmación
  // Humana» en Home). Aquí, solo un saludo que no la adelanta.

  // ── El Espejo — persona conocida, aún sin conexión cerrada ──────────
  if ((personas || []).length > 0) {
    const p = personas[personas.length - 1]
    if (!(p.contactedHelperIds || []).length) {
      return [
        saludo,
        `La última vez me hablaste de ${p.label}. ¿Cómo está? ¿Buscamos a alguien que pueda ayudar?`
      ]
    }
  }

  // Default greeting
  if (user.isHelper) {
    const sig = proSignals(user.name)
    // Sin cifras reales, solo lo que es verdad: su perfil esta publicado y
    // le avisaremos cuando alguien le escriba — cosa que SI hace Nüra.
    return [
      saludo,
      sig
        ? `Mientras no mirabas, **${sig.vistasHoy} ${sig.vistasHoy === 1 ? 'persona vio' : 'personas vieron'}** tu perfil hoy y hubo **${sig.busquedasSemana} búsquedas** en tu zona esta semana. Tu escaparate está activo ✨ Y si tú necesitas ayuda, aquí estoy.`
        : `Tu perfil está publicado. Cuando alguien te escriba, te llegará un aviso con su mensaje. Y si tú necesitas ayuda, aquí estoy.`
    ]
  }
  // EL SUSURRO, RETIRADO (2026-08-16). Decia "Carlos, al que sigues, publico
  // hace 8 dias — caso: El caso de la R" y se colaba ENTRE el saludo y la
  // pregunta, cortando justo la frase que explica el producto.
  //
  // La intencion era buena —recordar que hay gente viva ahi dentro— pero
  // estaba en el peor sitio posible. Home no es un muro de novedades: es
  // alguien preguntandote que te pasa. Esa informacion vive en Comunidad,
  // que es su sitio.
  const susurro = null

  // LA PROMESA no puede depender de la hora. "Cuentame que necesitas y te
  // encuentro a la persona" es la unica frase que explica el producto a
  // quien no lo conoce, y solo aparecia por la tarde: por la mañana leia
  // "¿en que puedo ayudarte?", que no dice a que viene Nura.
  // A quien ya conoce la casa no hace falta explicarsela.
  // Ya no por búsquedas guardadas (no se guardan): por haber escrito a alguien
  // o por las personas que pidió recordar.
  const yaTeConoce = (contactedHelpers || []).length > 0 || (personas || []).length > 0
  return [
    saludo,
    yaTeConoce
      ? (hour < 12 ? '¿En qué puedo ayudarte esta mañana?' : hour < 18 ? '¿Qué necesitas hoy?' : '¿Qué necesitas esta noche?')
      : 'Cuéntame qué necesitas y te encuentro a la persona.',
  ].concat(susurro ? [susurro] : [])
}

function detectIntent(text, user) {
  const t = text.toLowerCase()
  if (user?.isHelper && /aprendido|certificad|certificaci|estudi[eé]|he estudiado|trabaj[eé]\b|he trabajado|curso de|me he formado|titulo de|título de/.test(t))
    return 'update_profile'
  if (t.includes('empresa') || t.includes('contratar') || t.includes('empleado') || t.includes('trabajó'))
    return 'b2b'
  if (user?.isHelper && (t.includes('cliente') || t.includes('ofrecer') || t.includes('disponible')))
    return 'helper_visibility'
  return 'search'
}

function getDynamicSuggestions(user, searchHistory) {
  const hour = new Date().getHours()
  const day  = new Date().getDay()
  const isWeekend = day === 0 || day === 6
  const isMorning = hour >= 7 && hour < 13
  const isAfternoon = hour >= 13 && hour < 20

  // ── 1. HISTORY-BASED SUGGESTIONS (highest priority) ───────────────────
  // Map past searches to follow-up suggestions for the same category
  const FOLLOWUP_MAP = {
    logopeda:    ['Logopeda infantil en mi zona', 'Sesión de seguimiento de logopedia', 'Evaluación logopédica para mi hijo'],
    tecnico:     ['Técnico urgente hoy', 'Revisión de instalación eléctrica', 'Fontanero en mi zona'],
    limpieza:    ['Limpieza semanal del hogar', 'Limpieza profunda este fin de semana', 'Persona de limpieza de confianza'],
    cuidado:     ['Cuidadora de mayores en casa', 'Auxiliar a domicilio', 'Acompañante para persona mayor'],
    mascotas:    ['Cuidado de mascotas en vacaciones', 'Paseos para mi perro', 'Veterinario a domicilio'],
    matematicas: ['Repaso de matemáticas para el examen', 'Clases de física y química', 'Profesor particular de primaria'],
    entrenador:  ['Sesión de entrenamiento personal', 'Rutina de ejercicio personalizada', 'Clases de yoga a domicilio'],
    salud:       ['Fisioterapeuta a domicilio', 'Nutricionista personalizado', 'Psicólogo online'],
    legal:       ['Consulta legal urgente', 'Asesoría laboral', 'Abogado de familia'],
    hogar:       ['Pintor para el salón', 'Reformas del hogar', 'Instalación de muebles'],
    psicologia:  ['Sesión de psicología online', 'Terapia de pareja', 'Psicólogo para adolescentes'],
    fisioterapia:['Fisioterapia a domicilio', 'Rehabilitación deportiva', 'Masaje terapéutico'],
  }

  const recentSearches = (searchHistory || []).slice(0, 3)
  const personalSuggestions = []

  for (const entry of recentSearches) {
    const cat = entry.category
    const followups = FOLLOWUP_MAP[cat] || []
    // Add a direct "continue" chip first
    if (entry.query && personalSuggestions.length < 2) {
      // Don't repeat the exact same query — suggest a variation
      const variation = followups[0]
      if (variation && !personalSuggestions.includes(variation)) {
        personalSuggestions.push(variation)
      }
    }
    // Add a second related suggestion
    if (followups[1] && !personalSuggestions.includes(followups[1]) && personalSuggestions.length < 3) {
      personalSuggestions.push(followups[1])
    }
  }

  // ── 2. TIME-BASED POOL (fills remaining slots) ────────────────────────
  let pool = []
  if (isWeekend) {
    pool = [
      'Limpieza profunda este fin de semana',
      'Paseos para mi perro',
      'Entrenador personal',
      'Clases de yoga a domicilio',
      'Técnico urgente hoy',
      'Cuidado de mascotas',
    ]
  } else if (isMorning) {
    pool = [
      'Cuidadora de mayores en casa',
      'Logopeda infantil',
      'Clases de matemáticas',
      'Profesor de inglés',
      'Limpieza del hogar',
      'Fontanero para una gotera',
    ]
  } else if (isAfternoon) {
    pool = [
      'Refuerzo escolar para el cole',
      'Fisioterapeuta a domicilio',
      'Niñera para mis hijos',
      'Técnico urgente hoy',
      'Paseos para mi perro',
      'Entrenador personal',
    ]
  } else {
    pool = [
      'Cuidado de mayores mañana',
      'Fontanero urgente',
      'Cuidado de mascotas',
      'Logopeda para mi hijo',
      'Clases de yoga a domicilio',
      'Fisioterapeuta a domicilio',
    ]
  }

  // ── 3. MERGE: personal first, then time-based (no duplicates) ─────────
  const searched = recentSearches.map(s => s.query?.toLowerCase() || '')
  const usedTexts = new Set(personalSuggestions.map(s => s.toLowerCase()))

  const timeFiltered = pool.filter(s =>
    !usedTexts.has(s.toLowerCase()) &&
    !searched.some(q => q.length > 4 && s.toLowerCase().includes(q.slice(0, 8).toLowerCase()))
  )

  // Daily shuffle for the time-based ones
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  const shuffled = [...timeFiltered].sort((a, b) => {
    const ha = (a.charCodeAt(0) + seed) % 7
    const hb = (b.charCodeAt(0) + seed) % 7
    return ha - hb
  })

  const needed = 3
  const combined = [
    ...personalSuggestions.slice(0, 2),
    ...shuffled.slice(0, needed - Math.min(personalSuggestions.length, 2))
  ]

  return combined.slice(0, 3).map(text => ({ text }))
}

// Lo que un profesional hace desde Inicio. Antes eran cuatro frases
// («Cambiar mis tarifas»…) que se mandaban al buscador como una búsqueda.
// Ahora llevan a donde se hace de verdad.
const EDITAR_FICHA = 'Editar mi ficha'
const DARSE_DE_ALTA = 'Darme de alta como profesional'
const BUSCAR_OTRA_VEZ = 'Buscar otra vez'
const HELPER_SUGGESTIONS = [
  { text: EDITAR_FICHA, ir: '/profile', estado: { editar: 'ficha' } },
  { text: 'Ver mis mensajes', ir: '/chats' },
]


const CONTESTAR = 'Contestar ahora'
const LEER_RESPUESTA = 'Leer la respuesta'

// Cuando Nüra no tiene a nadie para lo que se pide: lo dice y manda a mirar
// la lista entera (Sergio, 2026-10-01).
const VER_TODOS_PROFESIONALES = 'Ver todos los profesionales'
const SIN_NADIE_VER_TODOS = 'Te recomiendo entrar en «Ver todos los profesionales», por si encuentras a alguien que te convenza.'

// ── La Pregunta — contexto antes del texto ──
// SIEMPRE a quien busca ayuda (decisión de Sergio, 2026-10-01): antes
// desaparecía si ya la había contestado en esa pestaña o había escrito a
// alguien, y la portada parecía cambiar sola. Salvo al profesional (tiene
// sus botones: «Editar mi ficha», «Ver mis mensajes») y cuando Nüra
// pregunta «¿Pudiste resolver…?» tras un contacto: esos botones van antes.
// La usan la portada al entrar y el botón de volver a empezar.
function conPregunta(msg, user) {
  if (user?.isHelper || msg.isConfirmacion) return msg
  return {
    ...msg,
    lines: [...msg.lines, '¿Para quién necesitas ayuda?'],
    isPregunta: true,
    chips: ['Para mí', 'Para alguien de mi familia', 'Para mi hogar o negocio']
  }
}

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const { chats: chatsUsuario, user, addSearch, searchHistory, favorites, helpersCache, nuraChatMessages, setNuraChatMessages, nuraLastMatches, setNuraLastMatches, cacheHelpers, contactedHelpers, confirmContact, following, personas, upsertPersona, citas, addStory , registrarDemanda, hasRated, services, updateService } = useUser()
  // messages persisted in context so they survive navigation
  const messages = nuraChatMessages
  const setMessages = setNuraChatMessages
  const [input, setInput] = useState('')
  // Solo cambia la presentación: el historial sigue disponible para la comprensión.
  const [viewStart, setViewStart] = useState(() => Math.max(0,
    messages.findLastIndex(m => m.from === 'user'), messages.findLastIndex(m => m.results?.length)))
  const pageRef = useRef(null)
  const ubicacionRef = useRef(null)
  function beginResponse() {
    if (ubicacionRef.current) stopThinking()
    setViewStart(messages.filter(m => !m.loading).length)
  }
  useEffect(() => () => {
    if (!ubicacionRef.current) return
    ubicacionRef.current.abort()
    ubicacionRef.current = null
    setMessages(prev => prev.filter(m => !m.loading))
    setLoading(false)
  }, [location.pathname, setMessages])

  // Para quién busca: solo cuenta en la conversación en curso. Antes se
  // recordaba en la pestaña y la portada cambiaba sin motivo aparente.
  const [forWhom, setForWhom] = useState('')
  const correctionRef = useRef(null)
  // La correccion era un modo INVISIBLE: el usuario escribia en un campo de
  // aspecto normal con una consulta anterior pegada por delante sin saberlo.
  // Reproducido: pidio "necesito un fontanero urgente" y Nura le ofrecio a
  // James, profesor de ingles. Un modo oculto es un camino de ida.
  const [corrigiendo, setCorrigiendo] = useState(false)
  const searchSeqRef = useRef(0)  // El Contrato: solo la búsqueda activa toca la interfaz
  // El filtro Online pisaba `lastMatches` con el subconjunto: no habia
  // vuelta atras. Un filtro de un solo sentido es la misma trampa que
  // retiramos en La Comprension Visible.
  const todosRef = useRef([])
  // «Te aviso si aparece alguien»: el oficio de la ultima busqueda sin nadie
  // (nunca la frase) y la hoja que pide permiso.
  const sinCoberturaRef = useRef(null)
  const [alerta, setAlerta] = useState(null)

  // LA PROFESIONAL, AL ENTRAR: si alguien le ha escrito y no ha contestado,
  // es lo primero que tiene que saber. Una vez por visita, con el numero real.
  const sinContestar = useSinContestar(user)
  const avisadoSinContestar = useRef(false)
  useEffect(() => {
    // Despues del saludo: el saludo reemplaza la conversacion al abrir.
    if (!sinContestar || avisadoSinContestar.current || !messages?.length) return
    avisadoSinContestar.current = true
    setMessages(prev => [...(prev || []), { id: Date.now() + 91, from: 'nura',
      lines: [sinContestar === 1
        ? 'Tienes **1 mensaje sin contestar**. Quien te escribió está esperando tu respuesta.'
        : `Tienes **${sinContestar} mensajes sin contestar**. Quienes te escribieron están esperando tu respuesta.`],
      chips: [CONTESTAR] }])
  }, [sinContestar, messages?.length, setMessages])

  // QUIEN BUSCA, AL ENTRAR: si un profesional le ha contestado y aun no lo
  // ha leido, se lo digo con su nombre. Una vez por visita.
  const { lista: respuestasSinVer } = useRespuestasNuevas()
  const avisadoRespuestas = useRef(false)
  const respuestaAbrir = useRef(null)
  useEffect(() => {
    if (user?.isHelper || !respuestasSinVer.length || avisadoRespuestas.current || !messages?.length) return
    avisadoRespuestas.current = true
    const ids = [...new Set(respuestasSinVer.map(r => String(r.helperId)))]
    respuestaAbrir.current = ids[0]
    const nombre = id => (chatsUsuario || []).find(c => String(c.helperId) === id)?.helperName?.split(' ')?.[0] || 'Un profesional'
    const nombres = ids.map(nombre)
    setMessages(prev => [...(prev || []), { id: Date.now() + 92, from: 'nura',
      lines: [ids.length === 1
        // Si además confirmó la cita, se dice: es lo que más importa.
        ? (confirmada => confirmada
            ? `**${nombres[0]}** ha confirmado tu cita: ${fechaDeCita(confirmada.cita)}. Tienes su respuesta en el chat.`
            : `**${nombres[0]}** te ha contestado. Tienes su respuesta en el chat.`)(respuestasSinVer.find(r => r.cita?.estado === 'aceptada'))
        : `Te han contestado **${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}**. Tienes sus respuestas en Chats.`],
      chips: [LEER_RESPUESTA] }])
  }, [respuestasSinVer, messages?.length, setMessages, user?.isHelper, chatsUsuario])
  // Tras «Sí, genial»: la ventana de valorar a ese profesional.
  const [valorar, setValorar] = useState(null)
  // Si ha llegado alguien que esta persona esperaba, se le dice al abrir
  // (una vez por sesion). El detalle esta en su perfil.
  useEffect(() => {
    if (!alertasGuardadas().length) return
    try { if (sessionStorage.getItem('nura_alertas_dicho')) return } catch { /* sin memoria */ }
    let vivo = true
    misAlertas().then(l => {
      if (!vivo) return
      const nuevos = l.reduce((n, a) => n + Math.max(0, (a.encontrados || []).length - (a.visto || 0)), 0)
      if (!nuevos || window.location.pathname.startsWith('/profile')) return
      try { sessionStorage.setItem('nura_alertas_dicho', '1') } catch { /* sin memoria */ }
      showToast(nuevos === 1 ? 'Ha llegado alguien que buscabas. Míralo en tu perfil.' : `Han llegado ${nuevos} personas que buscabas. Míralas en tu perfil.`)
    })
    return () => { vivo = false }
  }, [])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [showGate, setShowGate] = useState(false)
  const [gateReason, setGateReason] = useState('contact')
  // showSuggestions: hide once user has chatted
  const showSuggestions = nuraChatMessages.length <= 1
  const setShowSuggestions = () => {} // no-op, derived from messages
  const lastMatches = nuraLastMatches
  const setLastMatches = setNuraLastMatches
  const inputRef = useRef(null)

  useEffect(() => {
    let lines = getWelcome(user, searchHistory, following, helpersCache, contactedHelpers, personas, citas)
    // If helper just registered
    let helperRegistered; try { helperRegistered = sessionStorage.getItem('nura_helper_registered') } catch {}
    if (helperRegistered) {
      sessionStorage.removeItem('nura_helper_registered')
      const firstName = user?.name?.split(' ')?.[0] || user?.name || ''
      lines = [
        // Antes: «ya puedes encontrar a quien necesitas», la frase de quien
        // busca ayuda, a quien acaba de ofrecerla.
        `${firstName}, tu ficha ya está publicada.`,
        `Cuando alguien te escriba, te llegará un aviso con su mensaje. Mientras, una foto y tu tarifa ayudan a que te escriban.`
      ]
      setTimeout(() => setMessages([{ id: 1, from: 'nura', lines, chips: [EDITAR_FICHA] }]), 300)
      return
    }

    // If just registered (user)
    let justRegistered; try { justRegistered = sessionStorage.getItem('nura_just_registered') } catch {}
    if (justRegistered) {
      sessionStorage.removeItem('nura_just_registered')
      lines = [`**${user?.name?.split(' ')?.[0] || 'Hola'}**, ya puedes contactar con cualquier profesional. ¿Qué necesitas?`]
      setTimeout(() => setMessages([{ id: 1, from: 'nura', lines }]), 300)
      return
    }
    // Returning user — single message + immediate action chips
    const msgs = [{ id: 1, from: 'nura', lines }]

    // ── La Confirmación Humana ──────────────────────────────────────────
    // 3 días reales tras el contacto (30s en demo) Nüra pregunta si funcionó.
    // En el MISMO saludo y con sus botones desde el principio: antes llegaba
    // como un segundo mensaje a los 4 s, repetía la pregunta y la pantalla
    // saltaba del modo bienvenida al de respuesta.
    // Con una cita aún por delante, todavía no: antes preguntaba «¿qué tal
    // fue la visita del jueves?» el lunes. Se pregunta cuando haya pasado.
    // Una cita cancelada o rechazada no es «la visita»: pregunta general.
    const citaCon = hid => {
      const c = (citas || []).slice().reverse().find(x => String(x.helperId) === String(hid))
      return c && c.estado !== 'cancelada' && c.estado !== 'rechazada' ? c : null
    }
    // La cita pedida con «Contratar» se guarda en Mis servicios, no en
    // `citas`: también cuenta (2026-10-01: preguntaba «¿pudiste resolverlo?»
    // minutos después de pedir cita para el lunes).
    const servicioCon = hid => (services || []).slice().reverse()
      .find(x => String(x.helperId) === String(hid) && !['cancelled', 'rejected'].includes(x.status)) || null
    const pending = (contactedHelpers || []).find(c => {
      if (!c?.contactedAt) return false
      const elapsed = Date.now() - c.contactedAt
      const alreadyAnswered = c.confirmed !== undefined
      const ci = citaCon(c.id)
      if (ci && yaPaso(ci.fecha, ci.hora) === false) return false
      const sv = servicioCon(c.id)
      if (sv && sv.status !== 'completed' && yaPaso(sv.date, sv.time) === false) return false
      return elapsed >= CONFIRMACION_THRESHOLD && !alreadyAnswered
    })
    if (pending && user && !user.isHelper) {
      const lp = (personas || []).find(p => (p.contactedHelperIds || []).includes(pending.id))
      const ci = citaCon(pending.id)
      const sv = servicioCon(pending.id)
      const hn = getFirstName(pending.name) || pending.name
      const pregunta = ci
        ? `¿Qué tal fue la visita del ${ci.label} con **${hn}**${lp ? ` para ${lp.label}` : ''}? ¿Pudisteis resolverlo?`
        : sv?.date
          ? `¿Qué tal fue la visita del ${fechaDeCita({ fecha: sv.date })} con **${hn}**${lp ? ` para ${lp.label}` : ''}? ¿Pudisteis resolverlo?`
        : lp
          ? `¿Pudiste resolver lo que necesitabas para ${lp.label} con **${hn}**?`
          : `¿Pudiste resolver lo que necesitabas con **${hn}**?`
      msgs[0] = {
        id: 1, from: 'nura', lines: [lines[0], pregunta],
        isConfirmacion: true, confirmacionHelperId: pending.id, confirmacionHelperName: pending.name,
        chips: ['Sí, genial', 'No del todo'],
      }
    }

    // ── La Pregunta (ver conPregunta) ──
    msgs[0] = conPregunta(msgs[0], user)


    // Only init if no previous conversation
    if (nuraChatMessages.length === 0) {
      setTimeout(() => setMessages(msgs), 300)
    }

    // ── El Pulso — mensaje semanal al profesional ───────────────────────
    const timers = []

    if (user?.isHelper) {
      let lastPulso = 0
      try { lastPulso = parseInt(localStorage.getItem('nura_last_pulso') || '0') } catch {}
      const shouldShowPulso = Date.now() - lastPulso >= PULSO_THRESHOLD

      if (shouldShowPulso) {
        // ANTES las cifras salian de Math.random(): «9 personas buscaron…,
        // 2 te escribieron», a profesionales reales. Ahora son las de verdad
        // (op `mi-pulso`, con su sesion) o no hay cifras.
        timers.push(setTimeout(async () => {
          const firstName = user?.name?.split(' ')?.[0] || user?.name
          const helperSpec = user?.helperProfile?.specialty || 'tu especialidad'
          let pulso = null
          if (user?.helperId != null) {
            try {
              const { sesionActual } = await import('../utils/cuenta')
              const { miPulso } = await import('../utils/escrituras')
              pulso = await miPulso((await sesionActual())?.access_token)
            } catch { pulso = null }
          }
          // Consejos sin estadisticas inventadas: solo lo que es cierto.
          const hp = user?.helperProfile || {}
          const consejos = [
            !user?.avatar && 'Una foto tuya real da confianza a quien te busca.',
            !hp.price && 'Si pones tu tarifa, quien te busca sabe desde el principio si encaja.',
            'Contestar pronto se nota: tu ficha enseña cuánto sueles tardar en responder.',
          ].filter(Boolean)
          const lineas = [`**El Pulso de esta semana, ${firstName}.**`]
          if (pulso) {
            const n = (x, uno, varios) => `**${x}** ${x === 1 ? uno : varios}`
            if (pulso.busquedas != null) lineas.push(`${n(pulso.busquedas, 'persona buscó', 'personas buscaron')} ${helperSpec.toLowerCase()} en Nüra.`)
            if (pulso.apariciones != null) lineas.push(`Tu ficha salió recomendada ${n(pulso.apariciones, 'vez', 'veces')}.`)
            if (pulso.recibidos != null) lineas.push(pulso.recibidos
              ? `Te escribieron ${n(pulso.recibidos, 'persona', 'personas')} y contestaste a ${pulso.respondidos ?? 0}.`
              : 'Esta semana nadie te ha escrito todavía.')
            // Lo que dijeron de ti: cuántas valoraciones y la media (sin comentarios).
            if (pulso.valoraciones?.n) lineas.push(`Te ${pulso.valoraciones.n === 1 ? 'ha' : 'han'} valorado ${n(pulso.valoraciones.n, 'persona', 'personas')}${pulso.valoraciones.media != null ? `, con **${String(pulso.valoraciones.media).replace('.', ',')}** estrellas de media` : ''}.`)
            lineas.push(...lineasSinEncontrar(pulso.sinEncontrar, user?.helperProfile?.specialty))
          } else {
            lineas.push('Crea tu acceso con correo y cada semana te diré cuántas personas buscan lo que haces y cuántas veces sale tu ficha.')
          }
          lineas.push(`${consejos[Math.floor(Math.random() * consejos.length)]}`)
          try { localStorage.setItem('nura_last_pulso', String(Date.now())) } catch { /* sin memoria */ }
          setMessages(prev => prev.length > 1 ? prev : [...prev, {
            id: Date.now() + 77, from: 'nura', isPulso: true, lines: lineas,
            chips: pulso?.recibidos ? ['Ver mis contactos', 'Mejorar mi perfil'] : ['Mejorar mi perfil'],
          }])
        }, PULSO_DELAY))
      } else {
        // Fallback: generic helper proactive after 8s
        timers.push(setTimeout(() => {
          setMessages(prev => {
            if (prev.length > 1) return prev
            return [...prev, {
              id: Date.now(), from: 'nura',
              lines: ['¿Has trabajado en algo nuevo últimamente o completado alguna formación? Cuéntamelo para actualizar tu perfil.']
            }]
          })
        }, 8000))
      }
    }

    return () => timers.forEach(clearTimeout)
  }, [user?.id])

  // No scroll JS needed — justify-content:flex-end handles positioning
  // New messages naturally appear at bottom via flex layout

  function formatLine(line) {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (parts||[]).map((part, i) => {
      if (i % 2 === 1) {
        if (part.startsWith('grad:')) return <span key={i} className={styles.gradText}>{part.slice(5)}</span>
        return <strong key={i}>{part}</strong>
      }
      return part
    })
  }

  function startCorrection(originalQuery) {
    correctionRef.current = originalQuery || window.__nuraLastQuery || ''
    setCorrigiendo(true)
    setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
      lines: ['Dime qué he entendido mal y ajusto la búsqueda.'],
      chips: ['Era otra cosa'] }])
    setTimeout(() => inputRef.current?.focus?.(), 200)
  }

  function cancelCorrection() {
    correctionRef.current = null
    setCorrigiendo(false)
  }

  // ── Una sola autoridad del estado "pensando" ──
  function stopThinking() {
    ubicacionRef.current?.abort()
    ubicacionRef.current = null
    try { clearInterval(window.__nuraStatusInterval) } catch {}
    setMessages(prev => prev.filter(m => !m.loading))
    setLoading(false)
  }

  // ── Chips de comprensión: parámetros del análisis, nunca consultas ──

  // iOS: al enviar, evitar que el cierre del teclado reajuste el viewport
  function blurSinSalto() {
    try {
      const el = document.activeElement
      if (el && el.blur) { el.blur() }
    } catch { /* noop */ }
  }

  // ── EL UMBRAL ──
  // Explorar ya no busca por su cuenta: manda aqui la frase y Nura la
  // contesta con SU motor (comprension, el porque, el silencio honesto,
  // la carta). Antes habia dos motores y el segundo era el pobre.
  const entranteRef = useRef(null)
  // «Buscar otras opciones» desde un chat: esa búsqueda no vuelve a poner
  // primero al profesional con el que ya se hablaba.
  const excluirRef = useRef(null)
  // La otra cosa que pidió en el mismo mensaje (ver «DOS COSAS A LA VEZ»).
  const otraNecesidadRef = useRef(null)
  useEffect(() => {
    const q = location.state?.q
    if (!q || entranteRef.current === q) return
    entranteRef.current = q
    excluirRef.current = location.state?.excluir ?? null
    window.history.replaceState({}, '')
    const t = setTimeout(() => handleSend(q), 260)
    return () => clearTimeout(t)
  }, [location.state?.q])   // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(text, opciones = {}) {
    blurSinSalto()
    let msg = text || input
    if (!msg.trim()) return
    beginResponse()
    // Nura es una conversacion, no un formulario. Si hablas otra vez
    // mientras busca, te escucha a ti y suelta lo anterior: el guardia de
    // secuencia (sid/alive) ya estaba construido para esto. Antes el
    // mensaje se tragaba en silencio, con un boton que ni parecia apagado.
    if (loading) stopThinking()
    haptic('light')

    setInput('')
    setShowSuggestions(false)
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: msg }])
    // Autocuración: el pensamiento anterior muere al empezar uno nuevo;
    // los chips de resultados viejos se retiran (una conversación, no capas)
    stopThinking()
    setMessages(prev => prev.map(m => (m.refineChips || m.chips) ? { ...m, refineChips: undefined, chips: undefined } : m))
    setLoading(true)
    const sid = ++searchSeqRef.current
    const alive = () => searchSeqRef.current === sid

    // ── Comprensión Visible: si hay corrección pendiente, combinar con la consulta original ──
    if (correctionRef.current) {
      const previo = correctionRef.current
      correctionRef.current = null
      setCorrigiendo(false)
      // Una enmienda AFINA lo anterior ("mejor por la tarde"); una categoria
      // distinta es una pregunta nueva y pegarle la anterior la secuestra.
      const [aNuevo, aPrevio] = await Promise.all([analyzeNeed(msg), analyzeNeed(previo)])
      const cambiaDeOficio = aNuevo?.categoria && aNuevo.categoria !== 'otro'
        && aPrevio?.categoria && aNuevo.categoria !== aPrevio.categoria
      if (!cambiaDeOficio) msg = `${previo}. ${msg}`
    }

    // ── La Pregunta — interceptar selección ─────────────────────────
    const FOR_WHOM = { 'Para mí': 'mi', 'Para alguien de mi familia': 'familia', 'Para mi hogar o negocio': 'hogar' }
    if (FOR_WHOM[msg]) {
      const val = FOR_WHOM[msg]
      setForWhom(val)
      setTimeout(() => {
        const replies = {
          mi: 'Cuéntame qué necesitas. Estoy aquí para ayudarte.',
          familia: 'Entendido. Cuéntame qué le pasa y encontraré a la persona adecuada para cuidar de los tuyos.',
          hogar: 'Perfecto. Cuéntame qué necesita tu hogar o negocio y busco a la persona indicada.'
        }
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: [replies[val]] }])
        setLoading(false)
      }, 600)
      return
    }

    // ── El Pulso — interceptar respuesta a chips ────────────────────
    const PULSO_CHIPS = ['Ver mis contactos', 'Mejorar mi perfil', 'Actualizar perfil', 'Ahora no']
    const pulsoMsg = messages.find(m => m.isPulso)
    if (pulsoMsg && PULSO_CHIPS.includes(msg)) {
      const t = msg.toLowerCase()
      setTimeout(() => {
        if (t.includes('contacto') || t.includes('escrib')) {
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: [`Tus contactos recientes están en la pestaña **Chats**. Contestar pronto se nota: tu ficha enseña cuánto sueles tardar.`]
          }])
        } else if (t.includes('perfil') || t.includes('mejorar')) {
          navigate('/register-helper')
        } else {
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: [`Entendido. Cuéntame qué necesitas y te ayudo.`]
          }])
        }
        setLoading(false)
      }, 700)
      return
    }

    // ── La Confirmación Humana — interceptar respuesta ──────────────
    const confirmMsg = messages.find(m => m.isConfirmacion)
    if (confirmMsg && (msg === 'Sí, genial' || msg === 'No del todo')) {
      const helperName = confirmMsg.confirmacionHelperName?.split(' ')?.[0] || 'el profesional'
      const isPositive = msg.toLowerCase().includes('sí') || msg.toLowerCase().includes('genial')

      // A quién valorar y si ya lo hizo: si ya valoró, la ventana no se abre y
      // no tiene sentido pedirle «cuéntame cómo fue».
      let paraValorar = null
      const yaValorado = Boolean(confirmMsg.confirmacionHelperId && hasRated?.(confirmMsg.confirmacionHelperId))
      // Persist the confirmation in context
      if (confirmMsg.confirmacionHelperId) {
        confirmContact(confirmMsg.confirmacionHelperId, isPositive)
        if (isPositive) {
          // Su historia, en SU muro (se guarda en este movil). Antes se le
          // decia «lo he compartido con la comunidad, ya esta ayudando a
          // otros»: no se compartia con nadie.
          try {
            const hid = confirmMsg.confirmacionHelperId
            const hf = (helpersCache && (helpersCache[hid] || helpersCache[String(hid)])) || { id: hid, name: confirmMsg.confirmacionHelperName }
            const lp = (personas || []).find(p => (p.contactedHelperIds || []).includes(hid))
            const ci = (citas || []).slice().reverse().find(c => String(c.helperId) === String(hid) && c.estado !== 'cancelada' && c.estado !== 'rechazada' && yaPaso(c.fecha, c.hora) !== false)
            const fn = user?.name?.split(' ')?.[0] || 'Alguien'
            addStory({
              id: 'me_' + hid, helperId: hid,
              helper: { id: hf.id, name: hf.name, specialty: hf.specialty, category: hf.category, zone: hf.zone, avatarUrl: hf.avatarUrl, avatar: hf.avatar, avatarColor: hf.avatarColor, rating: hf.rating, verified: hf.verified },
              seconds: null, timeAgo: 'hoy',
              text: `${fn} encontró ${lp ? `ayuda de confianza para ${lp.label}` : 'la ayuda que necesitaba'}${ci ? `. La primera visita fue el ${ci.label}` : ''}. La ayuda funcionó.`,
            })
            // Y el momento de preguntarle como fue: es lo que construye la
            // ficha del profesional (perfil vivo) y ayuda a otros a elegir.
            paraValorar = { ...hf, id: hf.id ?? hid, name: hf.name || confirmMsg.confirmacionHelperName || '' }
            if (!yaValorado) setValorar(paraValorar)
            // Y en «Mis servicios», su cita ya pasada queda como hecha (antes
            // seguía «Confirmada», como si estuviera por venir).
            for (const sv of services || []) {
              if (String(sv.helperId) === String(hid) && (sv.status === 'confirmed' || sv.status === 'pending') && yaPaso(sv.date, sv.time)) {
                updateService(sv.id, yaValorado ? { status: 'completed', rated: true } : { status: 'completed' })
              }
            }
          } catch (e) { console.error('[Nüra] historia:', e) }
        }
      }

      setTimeout(() => {
        if (isPositive) {
          // «Júlia queda anotado»: sin género, que no lo sabemos. Y si ya lo
          // valoró, no se le pide otra vez; si no, un botón por si cierra la
          // ventana. Lo que escriba después lo recoge «Tras la confirmación».
          const puedeValorar = !yaValorado && paraValorar
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: [
              `Me alegra mucho. Anoto que con **${helperName}** funcionó.`,
              puedeValorar
                ? `Si me cuentas cómo fue, ayudarás a otros a elegir bien.`
                : `Ya me contaste cómo fue. Gracias: eso ayuda a otros a elegir bien.`,
            ],
            chips: puedeValorar ? [`Valorar a ${helperName}`] : undefined,
            trasConfirmacion: { helperName, valorar: puedeValorar ? paraValorar : null },
          }])
        } else {
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: [
              `Lo siento. ¿Quieres que busque otra persona para lo que necesitabas?`
            ],
            chips: ['Sí, busca otra persona', 'Ya lo resolví de otra forma'],
            // Para no volver a proponer a la misma persona.
            otraQueNo: confirmMsg.confirmacionHelperId ?? null
          }])
        }
        setLoading(false)
      }, 800)
      return
    }

    // ── Tras la confirmación ────────────────────────────────────────
    // Después de «Sí, genial», lo que escribe suele ser CÓMO le fue («Muy
    // bien!»), no una búsqueda: antes Nüra contestaba «No estoy segura de
    // haberte entendido». Si no nombra ningún oficio, se agradece y ya (el
    // texto no se guarda). Si nombra uno, sigue como búsqueda.
    const tras = messages[messages.length - 1]?.trasConfirmacion
    if (tras) {
      const quien = tras.helperName
      if (msg === `Valorar a ${quien}` && tras.valorar) {
        setValorar(tras.valorar)
        setLoading(false)
        return
      }
      if (msg.trim().length <= 80 && !oficiosDe(msg).length) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: tras.valorar
              ? [`¡Gracias por contármelo! Para que cuente en la ficha de **${quien}** y ayude a otros, puedes valorarle aquí.`]
              : [`¡Gracias por contármelo! Me alegra que fuera bien con **${quien}**. Si necesitas algo más, dime qué buscas.`],
            chips: tras.valorar ? [`Valorar a ${quien}`] : undefined,
            trasConfirmacion: tras.valorar ? tras : undefined,
          }])
          setLoading(false)
        }, 600)
        return
      }
    }

    // ── Lo que se dice después de buscar (ver utils/seguimiento) ──────
    // `opciones.nueva`: la manda un botón («Buscar electricista»): siempre es
    // una búsqueda nueva, aunque el oficio saliera en la anterior.
    const seg = opciones.nueva ? 'nueva' : entenderSeguimiento(msg, { hayResultados: lastMatches?.length > 0, oficiosAntes: window.__nuraLastAnalysis?.oficios || [] })
    const responder = (lines, extra = {}) => setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines, ...extra }])
      setLoading(false)
    }, 600)
    const nombreDe = h => getFirstName(h?.name) || h?.name || ''
    if (seg === 'saludo') {
      const fn = user?.name?.split(' ')?.[0]
      responder([`¡Hola${fn ? `, **${fn}**` : ''}! Cuéntame qué necesitas y busco a la persona adecuada.`],
        { chips: ['Una reparación en casa', 'Cuidar a un familiar', 'Clases particulares'] })
      return
    }
    // ── Lo que pregunta quien aún no conoce Nüra ──
    // Sin inventar condiciones: ni «es gratis» ni comisiones que no sabemos.
    if (seg === 'ofrecer') {
      responder(user?.isHelper
        ? ['Ya tienes tu ficha publicada: quien busca lo que haces ya puede encontrarte. Si quieres, la mejoramos.']
        : ['¡Qué bien! Para ofrecer tus servicios en Nüra, crea tu ficha de profesional: son siete preguntas y al terminar ya pueden encontrarte.'],
        { chips: [user?.isHelper ? EDITAR_FICHA : DARSE_DE_ALTA] })
      return
    }
    if (seg === 'que_es') {
      responder([
        'Soy **Nüra**: te ayudo a encontrar a la persona adecuada para lo que necesitas, desde un fontanero hasta alguien que cuide de tu madre o clases para tu hijo.',
        'Me cuentas qué pasa con tus palabras, te digo quién encaja mejor y por qué, y le escribes desde aquí.',
      ], { chips: ['Una reparación en casa', 'Cuidar a un familiar', 'Clases particulares'] })
      return
    }
    if (seg === 'coste') {
      responder([
        'Cada profesional pone su precio y lo ves en su ficha antes de escribirle.',
        'Dime qué necesitas y te enseño quién encaja y cuánto cobra.',
      ], { chips: ['Una reparación en casa', 'Cuidar a un familiar', 'Clases particulares'] })
      return
    }
    if (seg === 'no_se') {
      responder(['Te ayudo a aclararlo. Cuéntame qué pasa, aunque sea a medias, o empieza por aquí:'],
        { chips: ['Una reparación en casa', 'Cuidar a un familiar', 'Clases particulares', 'Ver todas las categorías'] })
      return
    }
    if (seg === 'gracias') {
      const top = lastMatches?.[0]
      responder(top
        ? [`¡De nada! Si te encaja **${nombreDe(top)}**, escríbele desde su tarjeta.`]
        : ['¡De nada! Aquí estoy para lo que necesites.'],
        top ? { chips: [`Escribir a ${nombreDe(top)}`] } : {})
      return
    }
    // Con resultados: se contesta sobre ESOS resultados.
    const mostrar = (lines, results) => {
      setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines, results,
        refineChips: ['Más cerca', 'Mejor valorado', 'Más barato'] }])
      setLastMatches(results)
      setLoading(false)
    }
    if (seg === 'precio') {
      const con = lastMatches.filter(h => h.price).slice(0, 3)
      const frase = con.length === 1 ? `**${nombreDe(con[0])}** cobra ${con[0].price}.`
        : con.length ? `**${nombreDe(con[0])}** cobra ${con[0].price}, ${con.slice(1).map(h => `**${nombreDe(h)}** ${h.price}`).join(' y ')}.`
        : 'No tengo sus tarifas. Puedes preguntárselo en el chat.'
      mostrar([frase], lastMatches)
      return
    }
    if (seg === 'online' || seg === 'presencial' || seg?.franja) {
      const puntos = seg === 'online' ? h => (h.online === true ? 1 : 0)
        : seg === 'presencial' ? h => (h.presential !== false ? 1 : 0)
        : h => puntosFranja(h, seg.franja)
      const que = seg === 'online' ? 'online' : seg === 'presencial' ? 'en persona' : NOMBRE_FRANJA[seg.franja]
      // Orden estable: primero quien más encaja; si todos igual, lo mismo.
      const ordenados = lastMatches.map((h, i) => ({ h, i, p: puntos(h) }))
        .sort((a, b) => b.p - a.p || a.i - b.i).map(x => x.h)
      const si = ordenados.filter(h => puntos(h) > 0)
      if (si.length) {
        const igual = ordenados.every((h, i) => h === lastMatches[i]) && si.length === lastMatches.length
        mostrar([igual ? `Todas estas opciones trabajan ${que}.` : `Primero, quien trabaja ${que}: **${nombreDe(si[0])}**.`], ordenados)
      } else {
        mostrar([`Ninguna de estas opciones trabaja ${que}. Te dejo las mismas; puedes preguntárselo en el chat.`], lastMatches)
      }
      return
    }
    if (seg === 'otra') {
      if (lastMatches.length > 1) {
        const rotados = [...lastMatches.slice(1), lastMatches[0]]
        mostrar([`Otra opción: **${nombreDe(rotados[0])}**.`], rotados)
      } else {
        mostrar([`Por ahora **${nombreDe(lastMatches[0])}** es la única opción que tengo para esto.`], lastMatches)
      }
      return
    }
    // Otra búsqueda («no, era fontanero»): no se «ajusta» la anterior.
    const nueva = seg === 'nueva'

    const intent = detectIntent(msg, user)

    // Context-aware responses
    const t = msg.toLowerCase()
    // PALABRA COMPLETA, no subcadena. `t.includes('si')` se disparaba con
    // "nece-si-to", "p-si-cologa", "fi-si-oterapeuta", "se-si-on"; 'ese' con
    // "m-ese-s"; 'bien' con "tam-bien". MEDIDO sobre las consultas doradas:
    // el interceptor se tragaba el 21% — incluidas "Necesito un cerrajero
    // urgente" y "mi madre tiene alzheimer y vive sola". Nura respondia
    // "es una muy buena eleccion" a quien acababa de pedir otra cosa.
    const palabra = (...ps) => ps.some(pp =>
      new RegExp(`(^|[^\\p{L}])${pp}($|[^\\p{L}])`, 'iu').test(t))
    // Y un asentimiento es CORTO. Una peticion de doce palabras no es un "si".
    const esBreve = msg.trim().split(/\s+/).length <= 6

    if (!nueva && lastMatches?.length > 0) {
      // User confirms — guide to profile
      if (esBreve && (palabra('sí','si','vale','ok','ese','esa','bien','genial','perfecto') || t.includes('me convence'))) {
        const topMatch = lastMatches?.[0]
        const firstName = getFirstName(topMatch?.name) || ''
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: [
              topMatch
                ? `Perfecto. **${firstName}** tiene ${fmtNota(topMatch.rating)}★ y suele responder en ${topMatch.responseTime || 'menos de 1 hora'}. Es una muy buena elección.`
                : `Perfecto.`,
              `Pulsa en su tarjeta para ver el perfil completo y escribirle directamente.`
            ],
            chips: topMatch ? [`Escribir a ${firstName}`] : []
          }])
          setLoading(false)
        }, 800)
        return
      }
      // Smart refinement based on chip
      const isRefinement = /\bno\b/.test(t) || palabra('otro','otra','otros','diferente') ||
        t.includes('más barato') || t.includes('más cerca') || t.includes('mejor valorado') ||
        palabra('ajusta','filtra','urgencias')

      if (isRefinement && lastMatches?.length > 0) {
        let refined = [...lastMatches]
        let refineLine = 'Aquí tienes los resultados ajustados.'

        if (t.includes('más barato') || t.includes('precio') || t.includes('económico')) {
          refined = refined.sort((a,b) => {
            const pa = parseFloat((a.price||'999').replace(/[^0-9.]/g,'')) || 999
            const pb = parseFloat((b.price||'999').replace(/[^0-9.]/g,'')) || 999
            return pa - pb
          })
          refineLine = `Ordenados por precio. El más económico es **${refined[0]?.name?.split(' ')?.[0]}** a ${refined[0]?.price}.`
        } else if (t.includes('más cerca') || t.includes('cerca') || t.includes('zona')) {
          await buscarMasCerca()
          return
        } else if (t.includes('mejor valorado') || t.includes('rating') || t.includes('valoración')) {
          refined = refined.sort((a,b) => (b.rating||0) - (a.rating||0))
          refineLine = `Ordenados por valoración. **${refined[0]?.name?.split(' ')?.[0]}** tiene ${fmtNota(refined[0]?.rating)}★.`
        } else if (t.includes('urgencias') || t.includes('urgente') || t.includes('hoy')) {
          refined = refined.filter(h => h.urgent).concat(refined.filter(h => !h.urgent))
          refineLine = refined.filter(h=>h.urgent).length > 0
            ? `Primero los que atienden urgencias.`
            : `Ninguno de estos atiende urgencias. Prueba buscar "urgente" directamente.`
        } else {
          // Generic: re-run with same analysis
          const reRefined = await matchHelpers({ categoria: window.__nuraLastAnalysis?.categoria || 'otro', palabrasClave: [] }, 4, msg, lastMatches)
          refined = reRefined?.length ? reRefined : refined
          refineLine = 'He ajustado los resultados.'
        }

        const resultMsg = { id: Date.now(), from: 'nura', lines: [refineLine], results: refined,
          refineChips: ['Más cerca', 'Mejor valorado', 'Más barato'] }
        setMessages(prev => [...prev, resultMsg])
      setLoading(false)
        setLastMatches(refined)
        setLoading(false)
        return
      }
    }

    // Refinement — if user is refining previous results
    if (!nueva && lastMatches?.length > 0 && intent === 'search') {
      const refined = await matchHelpers({ categoria: 'otro', palabrasClave: msg.toLowerCase().split(' ') }, 4, msg, lastMatches)
      if (refined?.length) {
        const resultMsg = { id: Date.now(), from: 'nura', lines: [`He ajustado los resultados.`], results: refined }
        setMessages(prev => [...prev, resultMsg])
      setLoading(false)
        setTimeout(() => setMessages(prev => [...prev, { id: Date.now()+1, from: 'nura', lines: ['¿Te convence alguno?'] }]), 1200)
        setLastMatches(refined)
        setLoading(false)
        return
      }
    }

    if (intent === 'update_profile') {
      setTimeout(() => {
        // Antes decía «He actualizado tu perfil» sin cambiar nada.
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['¡Qué bien! Para que conste en tu ficha y lo vea quien te busca, añádelo en «Editar mi ficha».'], chips: [EDITAR_FICHA] }])
        setLoading(false)
      }, 1200)
      return
    }
    if (intent === 'b2b') {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['El acceso empresarial está disponible en Fase 3. Si quieres verificar que alguien ha trabajado contigo, cuéntame su nombre y qué quieres que conste.'] }])
        setLoading(false)
      }, 1000)
      return
    }
    if (intent === 'helper_visibility') {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['Tu perfil está activo. ¿Quieres actualizar tu disponibilidad, zona o añadir algo nuevo?'] }])
        setLoading(false)
      }, 1000)
      return
    }

    // «¿Y en Sants?» / «en Gràcia»: si solo nombra un barrio, es la MISMA
    // busqueda en ese sitio (tambien es la respuesta a «¿en que barrio estas?»).
    let zonaForzada = null
    {
      const b = barrioEnTexto(msg)
      let previa = window.__nuraLastQuery
      try { previa = previa || sessionStorage.getItem('nura_last_query') } catch { /* sin memoria */ }
      if (b && previa && msg.trim().split(/\s+/).length <= 5 && (await analyzeNeed(msg))?.categoria === 'otro') {
        zonaForzada = b
        msg = previa
      }
    }

    try {
      // Analyse first so we can use it for contextual loading message
      const analysis = (await analyzeNeed(msg))
        || { categoria: 'otro', palabrasClave: msg.toLowerCase().split(' '), complexSignals: {} }
      if (zonaForzada) analysis.zona = zonaForzada
      if (opciones.sinZona) analysis.zona = null
      try {
        if (forWhom) analysis.paraQuien = forWhom
        // El Espejo — detectar y recordar a la persona de esta búsqueda
        // SOLO CON PERMISO (decision del fundador, 2026-09-24). Antes se
        // guardaba sola: «mi madre tiene Alzheimer» dejaba «Madre ·
        // Alzheimer» en el movil sin preguntar. Ahora, si ya estaba guardada
        // (permiso dado), se actualiza; si no, se pregunta al final.
        const personaDetected = extractPersona(msg)
        window.__nuraPersonaPendiente = null
        if (personaDetected) {
          analysis.persona = personaDetected.relacion
          const yaGuardada = (personas || []).some(p => p.relacion === personaDetected.relacion)
          if (yaGuardada) {
            window.__nuraActivePersona = upsertPersona(personaDetected)
          } else {
            window.__nuraActivePersona = null
            window.__nuraPersonaPendiente = personaDetected
          }
        } else {
          window.__nuraActivePersona = null
        }
      } catch (e) { console.error('[Nüra] contexto persona:', e) }
      window.__nuraLastAnalysis = analysis
      try { sessionStorage.setItem('nura_last_analysis', JSON.stringify(analysis)) } catch {}
      // Empathy acknowledgment — instant, before searching
      const empathyLine = `Entendido${analysis?.persona && PERSONA_CHIP[analysis.persona] ? '. Buscas ayuda ' + PERSONA_CHIP[analysis.persona].charAt(0).toLowerCase() + PERSONA_CHIP[analysis.persona].slice(1) : ''}.`
      const empatiaId = Date.now() + 0.3
      // `empatia`: no se destaca como titular (en un instante llegan los resultados).
      setMessages(prev => [...prev, { id: empatiaId, from: 'nura', lines: [empathyLine], empatia: true }])

      // El pensando sereno — con dueño y cancelación (El Contrato)
      const thinkingTimer = setTimeout(() => {
        if (!alive()) return
        setMessages(prev => [...prev, { id: Date.now() + 0.5, from: 'nura', lines: ['Dame un segundo. Estoy pensando en quién encaja de verdad.'], loading: true }])
      }, 450)
      let matches = await matchHelpers(analysis, 4)
      // Si no hay nadie más, se enseña igual, pero se dice (resultLine).
      let unicoOpcion = false
      if (excluirRef.current != null && matches?.length) {
        const otros = matches.filter(h => String(h.id) !== String(excluirRef.current))
        if (otros.length) matches = otros
        else unicoOpcion = true
      }
      excluirRef.current = null
      // Lo que pidió además del oficio: primero quien encaja con la franja
      // («por las tardes» ya no da primero una cuidadora nocturna) o con
      // «online». Orden estable: dentro de cada grupo manda el buscador.
      const prefs = preferenciasDe(msg)
      if (matches?.length > 1 && (prefs.franja || prefs.online)) {
        const p = h => (prefs.franja ? puntosFranja(h, prefs.franja) : 1) + (prefs.online && h.online === true ? 1 : 0)
        matches = matches.map((h, i) => ({ h, i, p: p(h) })).sort((a, b) => b.p - a.p || a.i - b.i).map(x => x.h)
      }
      clearTimeout(thinkingTimer)
      if (!alive()) return
      // Honestidad antes que confianza falsa: sin comprensión no hay tarjetas
      if (!matches?.length) {
        stopThinking()
        // ── LOS DOS SILENCIOS ──
        // No es lo mismo no entender que entender y no tener a nadie. El
        // segundo caso NO puede pedir que reformule: la persona se explico
        // bien y el vacio es de oferta, no suyo.
        const comprendida = analysis?.categoria && analysis.categoria !== 'otro'
        if (comprendida) {
          const queEs = (CAT_HUMANA[analysis.categoria] || 'eso').toLowerCase()
          // La ciudad donde busca: la que nombra o la de su perfil.
          const ciudadBusca = analysis.ciudad || analysis.ciudadElegida || null
          sinCoberturaRef.current = { categoria: analysis.categoria, que: CAT_HUMANA[analysis.categoria] || queEs, zona: analysis.zona || null, ciudad: ciudadBusca, consulta: msg }
          registrarDemanda?.({ categoria: analysis.categoria, fecha: Date.now() })
          // Cada búsqueda deja UN evento `busqueda` (con 0 resultados aquí): así
          // se cuentan todas, también las que no encuentran a nadie.
          registrar('busqueda', { categoria: analysis.categoria, resultados: 0, ...demandaDe(analysis) })
          registrar('sin_cobertura', { categoria: analysis.categoria, resultados: 0, ...demandaDe(analysis) })
          // El oficio entendido, no la categoría («arreglo técnico» no decía
          // nada). Y solo botones que sirven: «Buscar técnico de guardia» o
          // «Ampliar la zona» en otra ciudad buscaban en Barcelona.
          const quienEs = analysis.oficioQuien || `de ${queEs}`
          setMessages(prev => [...prev, { id: Date.now() + 2, from: 'nura',
            lines: [ciudadBusca && ciudadBusca !== 'Barcelona'
              // Sin «Te he entendido»: justo antes ya se dice «Entendido».
              ? `En ${ciudadBusca} todavía no tengo a nadie ${quienEs}: Nüra acaba de empezar allí. Si quieres, te aviso en cuanto llegue alguien.`
              : `Todavía no tengo a nadie ${quienEs} ${analysis.zona?.nombre ? `cerca de ${analysis.zona.nombre}` : 'en Nüra'}. Si quieres, te aviso en cuanto llegue alguien.`],
            chips: ['Avísame cuando tengas a alguien', ...(analysis.zona ? ['Ampliar la zona'] : [])] }])
          // Aqui NO se pregunta si recordar: solo se ven las opciones del
          // ultimo mensaje, y taparia estas.
          return
        }
        // Cuando no se entiende, se pide otra vez — pero NO igual para todos.
        // Alguien escribia "es una emergencia" y Nura le respondia con un
        // ejemplo sobre entrenador personal: detectaba la urgencia y no la
        // reconocia. Sonaba sorda justo cuando mas importa no sonarlo.
        {
          // No entendida: se cuenta como búsqueda de categoría «otro», con su
          // ciudad y sin la frase (vista `salud_busqueda` en Supabase).
          registrar('busqueda', { categoria: 'otro', resultados: 0, ...demandaDe(analysis) })
          // «Entendido.» seguido de «No estoy segura de haberte entendido» se
          // contradecía: si no se ha entendido, sin «Entendido».
          setMessages(prev => prev.filter(m => m.id !== empatiaId))
          const urge = /\b(urgent\w*|emergenc\w*|ahora mismo|cuanto antes|ya mismo|se me ha roto|no puedo esperar)\b/i.test(msg)
          // «busco un tatuador», «herrero»: SÍ se entiende; es un oficio que
          // Nüra aún no tiene. Decir «no te he entendido» sonaba sorda.
          const oficioSuelto = msg.trim().match(/^(?:hola[,.!]?\s+)?(?:(?:busco|necesito|quiero|me hace falta|hay)\s+)?(?:a\s+)?(?:un|una|algun|algún|alguna)?\s*([a-záéíóúñü]{4,}(?:\s+[a-záéíóúñü]{3,})?)\s*[.!?]?$/i)?.[1]
          // Solo si suena a oficio: lo pide («busco un…») o termina como uno
          // (-ero, -ista, -dor, -logo…). «xyzzy blabla» no es un oficio.
          const pideAlguien = /^(hola[,.!]?\s+)?(busco|necesito|quiero|me hace falta|hay)\b/i.test(msg.trim())
          const sufijoOficio = /(er[oa]|ista|dor[a]?|log[oa]|ari[oa]|ter[oa]|ic[oa]|ist[oa]|nt[ae])$/i.test(oficioSuelto || '')
          // Pide a alguien para algo concreto que Nüra no tiene («un
          // astronauta para la luna»): se dice claro y se ofrece mirar a
          // todos (Sergio, 2026-10-01). Antes: «no te he entendido» o, peor,
          // alguien al azar. Sin nada concreto («necesito ayuda») se pregunta.
          const GENERICAS = /^(ayuda|ayude|ayudar|ayudarme|alguien|algo|persona|profesional|servicio|cosa|hola|urgente|favor)$/i
          const concretas = (analysis.palabrasPropias || []).filter(w => !GENERICAS.test(w))
          const pideAlgo = pideAlguien || /\balguien que\b/i.test(msg)
          if (!urge && oficioSuelto && oficioSuelto.split(/\s+/).length <= 2 && (pideAlguien || sufijoOficio)) {
            setMessages(prev => [...prev, { id: Date.now() + 2, from: 'nura',
              lines: [`Todavía no tengo a nadie de «${oficioSuelto.toLowerCase()}» en Nüra.`, SIN_NADIE_VER_TODOS],
              chips: [VER_TODOS_PROFESIONALES] }])
            return
          }
          if (!urge && pideAlgo && concretas.length) {
            setMessages(prev => [...prev, { id: Date.now() + 2, from: 'nura',
              lines: ['Todavía no tengo a nadie para eso en Nüra.', SIN_NADIE_VER_TODOS],
              chips: [VER_TODOS_PROFESIONALES] }])
            return
          }
          setMessages(prev => [...prev, { id: Date.now() + 2, from: 'nura',
            lines: urge
              ? ['Entiendo que corre prisa. Para encontrarte a alguien ya, dime qué ha pasado: ¿es algo de casa, de salud, o cuidar a alguien?']
              : ['No estoy segura de haberte entendido del todo. ¿Me lo cuentas con otras palabras? Por ejemplo: "entrenador personal cerca de casa" o "alguien que cuide a mi madre".'],
            chips: urge
              ? ['Algo se ha roto en casa', 'Necesito ayuda médica', 'Cuidar a un familiar']
              : ['Entrenador personal', 'Cuidar a un familiar', 'Una reparación en casa'] }])
        }
        return
      }
      stopThinking()


      addSearch?.(msg, analysis?.categoria)
      window.__nuraLastQuery = msg
      try { sessionStorage.setItem('nura_last_query', msg) } catch {}
      todosRef.current = matches
      registrar('busqueda', { categoria: analysis?.categoria || 'otro', resultados: matches.length, ...demandaDe(analysis) })
      // Solo algo parecido («Todavía no tengo a nadie que…»): también es
      // demanda sin cubrir, con cuántos parecidos se le ofrecieron.
      if (matches[0]?.__aproximado) registrar('sin_cobertura', { categoria: analysis.categoria, resultados: matches.length, ...demandaDe(analysis) })
      // Una por profesional recomendado: es lo que cuenta su Pulso («tu ficha
      // salio X veces»). Solo quien salio y la categoria, nunca la frase.
      matches.slice(0, 6).forEach(h => registrar('recomendacion_vista', {
        categoria: analysis?.categoria, resultados: matches.length, helperId: h?.id != null ? String(h.id) : undefined }))
      setLastMatches(matches)
      // Un recordatorio si no escribe a nadie (ver utils/notifications).
      recordarTrasBuscar(matches[0])
      // Cache helpers for instant profile + chat loading
      if (matches?.length) {
        const cacheMap = {}
        matches.forEach(h => {
          if (h?.id) {
            cacheMap[h.id] = h
            cacheMap[String(h.id)] = h
            cacheMap[parseInt(h.id)] = h
          }
        })
        window.__nuraHelperCache = { ...(window.__nuraHelperCache || {}), ...cacheMap }
        // Store match reason for profile view
        // Store match reasons for ALL results
        if (matches?.length > 0) {
          const reasons = {}
          matches.forEach((h, i) => {
            if (!h?.id) return
            const reason = buildWhy(h, analysis)
            if (reason) reasons[String(h.id)] = reason
          })
          window.__nuraMatchReasons = { ...(window.__nuraMatchReasons||{}), ...reasons }
      try { sessionStorage.setItem('nura_match_reasons', JSON.stringify(window.__nuraMatchReasons)) } catch {}
        }
        // Also cache in UserContext via cacheHelpers
        cacheHelpers?.(matches)
      }

      // Build smart result message with context
      const cat = analysis?.categoria || 'otro'
      const especialidad = cat === 'logopeda' ? 'logopedas'
        : cat === 'tecnico' ? 'técnicos'
        : cat === 'limpieza' ? 'profesionales de limpieza'
        : cat === 'cuidado' ? 'cuidadoras'
        : cat === 'mascotas' ? 'cuidadores de mascotas'
        : cat === 'matematicas' ? 'profesores'
        : cat === 'entrenador' ? 'entrenadores'
        : cat === 'salud' ? 'profesionales de salud'
        : cat === 'legal' ? 'asesores legales'
        : cat === 'hogar' ? 'profesionales del hogar'
        : 'profesionales'
      const top = matches?.[0]
      const zona = top?.zone || top?.city || 'Barcelona'
      const topName = getFirstName(top?.name) || ''
      const topFirstName = getFirstName(top?.name) || ''
      // La Gramática de la Recomendación — humana, breve, segura
      const why = buildWhy(top, analysis)
      const urgentTail = analysis?.urgente ? '. Puedes preguntarle si puede venir hoy' : ''
      // EL PORQUE SE SEPARA. Iba dentro de la misma frase que el anuncio,
      // asi que se leia en 15px como un dato mas. Pero "trabaja muchisimo
      // con peques y trabaja muy cerca de ti" es lo UNICO que ninguna otra
      // app puede decirte: es la razon de existir de Nüra.
      // En dos lineas puede tener peso propio sin inventar nada.
      // "Creo que ya tengo a la persona" no aportaba nada: el resultado ya
      // esta ahi. Era relleno antes de lo que importa.
      // NADIE DEL OFICIO: se dice, y se ofrece lo más parecido sin llamarlo
      // «quien mejor encaja» («reparar altavoces» → técnico de electrodomésticos).
      const aproximado = top?.__aproximado
      const resultLine = unicoOpcion
        ? `Por ahora **${topFirstName}** es la única opción que tengo para esto.`
        : aproximado
        ? `Todavía no tengo a nadie ${aproximado.quien}. Lo más parecido es **${topFirstName}**.`
        : `**${topFirstName}** es quien mejor encaja.`
      // «¿Cuánto cuesta un electricista?»: se contesta, no solo se recomienda.
      const precioTail = prefs.precio && top?.price ? `. Cobra ${top.price}` : ''
      // Nombró una ciudad y la primera opción no está allí: trabaja online.
      // Se dice («clases de chino en Bilbao» enseñaba a alguien de Barcelona).
      const onlineTail = analysis?.ciudad && top?.online && ciudadDe(top) !== analysis.ciudad
        ? `. En ${analysis.ciudad} todavía no tengo a nadie en persona, pero ${topFirstName} trabaja online` : ''
      const whyLine = `${why.charAt(0).toUpperCase()}${why.slice(1)}${urgentTail}${precioTail}${onlineTail}.`


      // Build rich match explanation — the core AI differentiator



      // [Certificación 2026-07-04] declaración perdida en refactor — restaurada como no-op
      // [PENDIENTE] reactivar personalización con searchHistory
      const personalizationLine = null

      const resultMsg = {
        id: Date.now(), from: 'nura',
        lines: [resultLine, whyLine],
        results: matches,
        refineChips: matches.length > 0
          ? ['Más cerca', 'Mejor valorado', 'Más barato', 'No es lo que buscaba']
          : ['Ampliar búsqueda', 'Cambiar zona', 'Online también']
      }
      // DOS COSAS A LA VEZ («fontanero y electricista»): se enseña la primera
      // y se ofrece la otra con un botón, arriba, junto al texto (al final de
      // la respuesta, en otra página, no lo veía nadie). Antes solo se
      // buscaba una y no se decía nada de la otra.
      const necesidades = necesidadesDe(msg)
      const otra = necesidades.length > 1 && necesidades.find(n => !esDelOficio(matches[0]?.specialty || '', n.id))
      otraNecesidadRef.current = otra ? { etiqueta: `Buscar ${otra.nombre}`, texto: otra.texto } : null
      if (otra) {
        resultMsg.lines = [...resultMsg.lines, `También me pides **${otra.nombre}**: lo busco aparte para que no se mezcle.`]
        resultMsg.chips = [`Buscar ${otra.nombre}`]
        resultMsg.chipsPrimero = true
      }
      setMessages(prev => [...prev, resultMsg])
      // SU CIUDAD SIN NADIE: eligió Madrid en su perfil y todos los que
      // encajan trabajan en otra ciudad. Se le dice claro y se le ofrece el
      // aviso para su ciudad (en vez de preguntar si recordar: taparía esto).
      const ciudadSuya = !analysis?.ciudad && analysis?.ciudadElegida
      if (ciudadSuya && analysis?.categoria && analysis.categoria !== 'otro' && !hayEnLaCiudad(matches, ciudadSuya)) {
        const queEs = CAT_HUMANA[analysis.categoria] || 'eso'
        sinCoberturaRef.current = { categoria: analysis.categoria, que: queEs, zona: null, ciudad: ciudadSuya }
        // Una búsqueda cuenta una vez: si ya se contó como «solo parecido», no se repite.
        if (!matches[0]?.__aproximado) registrar('sin_cobertura', { categoria: analysis.categoria, ...demandaDe(analysis) })
        setMessages(prev => [...prev, { id: Date.now() + 3, from: 'nura',
          lines: [`En ${ciudadSuya} todavía no tengo a nadie de ${queEs.toLowerCase()}: los que te enseño trabajan en otra ciudad. Nüra acaba de empezar allí.`],
          chips: ['Avísame cuando tengas a alguien'] }])
      } else preguntarSiRecordar()
      setLoading(false)
    } catch (err) {
      searchSeqRef.current++  // invalida temporizadores huérfanos de esta búsqueda
      stopThinking()
      console.error('[Nüra] búsqueda:', err)
      // Ni tecnicismos ni callejón sin salida. Sin red de verdad (el móvil lo
      // sabe): se repite sola al volver. Con red, si tarda o falla, es cosa
      // nuestra: se dice así, no «te has quedado sin conexión». El botón
      // repite la misma frase: no hay que reescribirla.
      const sinRed = typeof navigator !== 'undefined' && navigator.onLine === false
      const tarda = /timeout|timed out|abort/i.test(`${err?.name || ''} ${err?.message || err}`)
      setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
        lines: sinRed ? ['Parece que te has quedado sin conexión. En cuanto vuelva, lo busco otra vez yo sola.']
          : tarda ? ['La búsqueda está tardando más de lo normal. Prueba otra vez en un momento.']
          : ['No he podido completar la búsqueda. Puedes intentarlo otra vez.'],
        chips: [BUSCAR_OTRA_VEZ], reintentar: msg, esperaRed: sinRed }])
    }
    setLoading(false)
  }

  // ── Los chips tienen destino ────────────────────────────────────────
  // Todo chip caia en handleSend, que lo trata como una BUSQUEDA. Para los
  // que son accion ("Escribir a Marta", "Avisame cuando tengas a alguien")
  // eso era un callejon: Nura ofrecia algo y al tocarlo buscaba otra cosa.
  // Los que son respuesta a una pregunta suya siguen yendo a handleSend,
  // que ya los intercepta por cadena exacta.
  // «¿Quieres que me acuerde de tu madre?» — se pregunta al final de la
  // busqueda, nunca se guarda sin un si.
  function preguntarSiRecordar() {
    const p = window.__nuraPersonaPendiente
    if (!p?.label) return
    setTimeout(() => setMessages(prev => [...prev, { id: Date.now() + 5, from: 'nura',
      lines: [`¿Quieres que me acuerde de ${p.label} para ayudarte mejor la próxima vez? Solo lo guardo en tu móvil y puedes borrarlo cuando quieras.`],
      chips: ['Sí, acuérdate', 'No, gracias'] }]), 900)
  }

  // SIN CONEXIÓN: al volver la red se repite sola la búsqueda que falló.
  // Antes Nüra lo prometía («cuando vuelvas, lo intento otra vez») pero solo
  // dejaba un botón. Solo si ese aviso sigue siendo lo último: si después
  // ha hecho otra cosa, no se le busca nada por sorpresa.
  const ultimo = messages[messages.length - 1]
  const pendienteDeRed = ultimo?.esperaRed ? ultimo.reintentar : null
  useEffect(() => {
    if (!pendienteDeRed) return
    const alVolver = () => handleSend(pendienteDeRed, { nueva: true })
    window.addEventListener('online', alVolver, { once: true })
    return () => window.removeEventListener('online', alVolver)
  }, [pendienteDeRed])   // eslint-disable-line react-hooks/exhaustive-deps

  function handleChip(chip) {
    beginResponse()
    if (chip === EDITAR_FICHA) { navigate('/profile', { state: { editar: 'ficha' } }); return }
    if (chip === 'Ver todas las categorías' || chip === VER_TODOS_PROFESIONALES) { navigate('/explore'); return }
    if (chip === DARSE_DE_ALTA) { navigate('/register-helper'); return }
    if (chip === BUSCAR_OTRA_VEZ) {
      const q = [...messages].reverse().find(m => m.reintentar)?.reintentar
      if (q) handleSend(q, { nueva: true })
      return
    }
    if (otraNecesidadRef.current && chip === otraNecesidadRef.current.etiqueta) {
      const { texto } = otraNecesidadRef.current
      otraNecesidadRef.current = null
      handleSend(texto, { nueva: true })
      return
    }
    if (chip === CONTESTAR) { navigate('/chats'); return }
    if (chip === LEER_RESPUESTA) { navigate(respuestaAbrir.current ? `/chat/${respuestaAbrir.current}` : '/chats'); return }
    const responde = (lines, chips) =>
      setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines, chips }])

    if (chip === 'Sí, acuérdate' || chip === 'No, gracias') {
      const p = window.__nuraPersonaPendiente
      window.__nuraPersonaPendiente = null
      haptic('light')
      if (!p) return
      if (chip === 'Sí, acuérdate') {
        window.__nuraActivePersona = upsertPersona(p)
        responde([`Hecho, me acordaré de ${p.label}. Lo tienes en tu perfil, por si quieres borrarlo.`])
      } else {
        responde(['Vale, no lo guardo.'])
      }
      return
    }

    if (chip.startsWith('Escribir a')) {
      const h = lastMatches?.[0]
      if (!h) return
      haptic('medium')
      if (!user) {
        try {
          sessionStorage.setItem('nura_return_to', `/chat/${h.id}`)
        } catch { /* almacenamiento bloqueado: se sigue igual */ }
        navigate('/login')
        return
      }
      navigate(`/chat/${h.id}`, { state: { helper: h, userQuery: window.__nuraLastQuery, analysis: window.__nuraLastAnalysis } })
      return
    }

    if (chip === 'Ampliar la zona') {
      // Antes contestaba «he mirado en toda la ciudad, no tengo a nadie» SIN
      // mirar: con «fontanero en Gràcia» había un fontanero en otra zona.
      // Ahora repite la búsqueda sin el barrio; si tampoco hay nadie, lo dice
      // la propia búsqueda.
      haptic('light')
      const consulta = sinCoberturaRef.current?.consulta
      if (consulta) { handleSend(consulta, { nueva: true, sinZona: true }); return }
      responde(['Cuéntame otra vez qué necesitas y lo busco en toda la ciudad.'])
      return
    }

    if (chip === 'Avisame cuando tengas a alguien' || chip === 'Avísame cuando tengas a alguien') {
      // Antes respondia «Anotado, te aviso» y NO avisaba. Ahora pide permiso
      // (la hoja dice que guarda) y avisa de verdad: movil y/o correo.
      haptic('light')
      const pend = sinCoberturaRef.current
      if (!pend) { responde(['Cuéntame otra vez qué necesitas y te digo si puedo avisarte.']); return }
      if (tieneAlerta(pend.categoria, pend.zona ? null : pend.ciudad)) {
        responde([`Ya te aviso si llega alguien de ${pend.que.toLowerCase()}${!pend.zona && pend.ciudad ? ` en ${pend.ciudad}` : ''}. Lo tienes en tu perfil.`])
        return
      }
      setAlerta(pend)
      return
    }

    if (chip === 'Si, busca otra persona' || chip === 'Sí, busca otra persona') {
      let q = window.__nuraLastQuery
      if (!q) { try { q = sessionStorage.getItem('nura_last_query') } catch { /* sin memoria */ } }
      // Sin la persona con la que no funcionó (si es la única, se dice).
      const noEsta = [...messages].reverse().find(m => m.otraQueNo != null)?.otraQueNo
      if (q) { excluirRef.current = noEsta ?? null; handleSend(q, { nueva: true }); return }
      haptic('light')
      responde(['Cuéntame otra vez qué necesitas y te busco a alguien distinto.'])
      return
    }

    if (chip === 'Ya lo resolvi de otra forma' || chip === 'Ya lo resolví de otra forma') {
      haptic('light')
      responde(['Me alegro de que se resolviera. Aquí estaré cuando vuelvas a necesitarme.'])
      return
    }

    handleSend(chip)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function toggleMic() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'es-ES'
    rec.onresult = e => { handleSend(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
    setListening(true)
  }

  const suggestions = user?.isHelper ? HELPER_SUGGESTIONS : getDynamicSuggestions(user, searchHistory)

  async function buscarMasCerca() {
    stopThinking()
    const sid = ++searchSeqRef.current
    const controller = new AbortController()
    ubicacionRef.current = controller
    const alive = () => !controller.signal.aborted && searchSeqRef.current === sid
    const id = `ubicacion-${sid}`
    setShowSuggestions(false)
    setLoading(true)
    setMessages(prev => [...prev, { id, from: 'nura', loading: true,
      lines: ['Buscando tu ubicación. Si el dispositivo te pide permiso, pulsa «Permitir».'] }])
    const answer = (lines, results) => setMessages(prev => prev.map(m => m.id === id
      ? { id, from: 'nura', lines, results, refineChips: ['Más cerca', 'Más barato', 'Mejor valorado', 'Online'] } : m))
    try {
      const origin = await pedirUbicacion({ signal: controller.signal })
      if (!alive()) return
      const sorted = ordenarDesdeUbicacion(lastMatches, origin)
      const located = sorted.filter(h => h.distance != null)
      if (!located.length) {
        answer(['Ya tengo tu ubicación, pero estos profesionales no tienen una zona que pueda localizar. Mantengo los resultados sin inventar distancias.'], sorted)
      } else {
        answer([`Ordenados por cercanía a tu ubicación, según la zona aproximada de cada profesional.${located.length < sorted.length ? ' Sin zona localizable, al final.' : ''}`], sorted)
      }
      setLastMatches(sorted)
    } catch (error) {
      if (alive()) answer([mensajeErrorUbicacion(error)])
    } finally {
      if (alive()) {
        ubicacionRef.current = null
        setLoading(false)
      }
    }
  }

  function handleRefine(chip) {
    beginResponse()
    if (chip === 'Crear cuenta') { navigate('/login'); return }
    // La Correccion: el unico camino para "me entendiste
    // mal". Los otros chips reordenan lo mismo; este admite
    // que lo mismo no sirve.
    if (chip === 'No es lo que buscaba') { haptic('light'); startCorrection(window.__nuraLastQuery); return }
    // Ordenar una lista de UNO es teatro: la respuesta seria
    // "X es el mas economico" sobre el unico que hay. Los
    // chips de orden solo aparecen si hay algo que comparar.
    const ordenar = (n, propios) => n >= 2 ? propios : []
    if (chip === 'Era otra cosa') { haptic('light'); cancelCorrection()
      setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
        lines: ['Sin problema. Cuéntame qué necesitas.'] }])
      setTimeout(() => inputRef.current?.focus?.(), 200); return }
    if (chip === 'Ver todos') {
      const todos = todosRef.current || []
      if (!todos.length) return
      haptic('light')
      setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
        lines: ['Aquí los tienes todos otra vez.'],
        results: todos, refineChips: [...ordenar(todos.length, ['Más barato','Más cerca','Mejor valorado']), 'No es lo que buscaba'] }])
      setLastMatches(todos); return
    }
    if (chip === 'Más barato' && lastMatches?.length > 0) {
      const sorted = [...lastMatches].sort((a,b) => {
        const pa = parseFloat((a.price||'').replace(/[^0-9.]/g,'')) || 9999
        const pb = parseFloat((b.price||'').replace(/[^0-9.]/g,'')) || 9999
        return pa - pb
      })
      setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
        lines: [`${sorted[0]?.name?.split(' ')?.[0]} es el más económico. Su tarifa es ${sorted[0]?.price}.`],
        results: sorted, refineChips: ['Más cerca','Mejor valorado','Online'] }])
      setLastMatches(sorted); return
    }
    if (chip === 'Más cerca' && lastMatches?.length > 0) {
      void buscarMasCerca()
      return
    }
    if (chip === 'Mejor valorado' && lastMatches?.length > 0) {
      const sorted = [...lastMatches].sort((a,b) => (b.rating||0)-(a.rating||0))
      setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
        lines: [`${sorted[0]?.name?.split(' ')?.[0]} tiene la mejor valoración: ${fmtNota(sorted[0]?.rating)} sobre 5.`],
        results: sorted, refineChips: ['Más barato','Más cerca','Online'] }])
      setLastMatches(sorted); return
    }
    if (chip === 'Online' && lastMatches?.length > 0) {
      const online = lastMatches.filter(h => h.online)
      if (online.length > 0) {
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
          lines: [online.length === 1
            ? 'Solo uno de ellos ofrece sesiones online.'
            : `${online.length} de ellos ofrecen sesiones online.`],
          results: online,
          refineChips: [...ordenar(online.length, ['Más barato','Más cerca','Mejor valorado']), 'Ver todos'] }])
        setLastMatches(online)
      } else {
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
          lines: ['Ninguno de estos profesionales ofrece sesiones online.'],
          refineChips: ['No es lo que buscaba'] }])
      }
      return
    }
    handleSend(chip)
  }

  // La burbuja conserva el tamaño del lienzo; el contenedor compartido
  // desplaza la página al abrir el teclado sin repaginar la respuesta.
  useEffect(() => {
    if (location.pathname !== '/') return
    document.body.dataset.nuraFocus = 'true'
    const page = pageRef.current
    const resize = () => {
      const height = page?.getBoundingClientRect().height || window.innerHeight
      if (page) page.dataset.focusSize = height <= 420 ? 'tiny' : height <= 600 ? 'short' : 'full'
    }
    resize()
    const observer = new ResizeObserver(resize)
    if (page) observer.observe(page)
    return () => {
      observer.disconnect()
      delete document.body.dataset.nuraFocus
    }
  }, [location.pathname])


  const isWelcome = nuraChatMessages.length <= 1
  const composer = (<>
        <div className={styles.inputCapsule}>
          <input ref={inputRef} className={styles.input} aria-label="Cuéntale a Nüra qué necesitas"
            placeholder={corrigiendo ? 'Dime qué he entendido mal…' : forWhom === 'familia' ? 'Cuéntame qué le pasa...' : forWhom === 'hogar' ? 'Cuéntame qué necesita tu hogar...' : (searchHistory?.length ? 'Cuéntame qué necesitas...' : 'Cuéntale a Nüra qué necesitas…')}
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey} readOnly={false} />
          {input.trim()
            ? <button className={styles.sendBtn} onClick={() => handleSend()} aria-label="Enviar mensaje"><Send size={16} /></button>
            : <button className={`${styles.sendBtn} ${listening ? styles.micActive : styles.micBtn}`} onClick={toggleMic} aria-label={listening ? 'Detener dictado' : 'Dictar por voz'}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
          }
        </div>


  </>)

  const turn = messages.slice(Math.min(viewStart, messages.length)).filter(m => m.from === 'nura')
  const response = turn.filter(m => !m.loading || loading)
  const responseKey = response[0]?.id || `waiting-${viewStart}`
  const latestQuery = messages.slice().reverse().find(m => m.from === 'user')?.text
  const blocks = []
  // La cita de las próximas 24 horas, mientras no haya buscado nada. No
  // depende de isWelcome: un aviso («Laura te ha contestado») la escondía.
  if (!messages.some(m => m.from === 'user')) blocks.push({ id: 'reminder', content: <RecordatorioCita compact /> })
  // LA FRASE PRINCIPAL, COMO TITULAR, EN TODAS LAS RESPUESTAS (Sergio,
  // 2026-10-01): al tocar «Para mí» la contestación salía en texto pequeño
  // bajo un panel vacío, cuando la portada habla en grande. Con resultados es
  // su frase («Antoni es quien mejor encaja»); sin ellos, la primera de Nüra.
  // Mientras busca, nada: no salta de tamaño antes de llegar los resultados.
  const buscandoAun = response.some(m => m.loading)
  const destacada = isWelcome || buscandoAun ? null
    : (response.find(m => m.results?.length) || response.find(m => !m.empatia))
  response.forEach((msg, msgIndex) => {
    const lines = msg.lines || (msg.text ? [msg.text] : [])
    lines.forEach((line, i) => splitResponseText(line).forEach((part, j) => {
      const hero = isWelcome && i === 1 && j === 0
      const principal = msg === destacada && i === 0 && j === 0
      // Si es larga, un punto menor: que no ocupe media pantalla.
      const larga = String(part).length > 140
      blocks.push({ id: `${msg.id}-line-${i}-${j}`, content: hero
        ? <h1 className={styles.screenTitle}>{formatLine(part)}</h1>
        : principal ? <p className={`${styles.screenPrompt} ${larga ? styles.screenPromptLarga : ''}`}>{formatLine(part)}</p>
        : <p className={styles.screenText}>{formatLine(part)}</p> })
    }))
    if (msg.loading) blocks.push({ id: `${msg.id}-loading`, content: <div className={styles.typingDots} role="status" aria-label="Buscando"><span /><span /><span /></div> })
    // Un botón que va con el texto («Buscar electricista»), antes de las tarjetas.
    const chipBlock = (chip, i) => ({ id: `${msg.id}-chip-${i}`, content:
      <button className={styles.screenChoice} onClick={() => handleChip(chip)}>
        <span className={styles.choiceIcon} aria-hidden="true">{chip === 'Para mí' ? <UserRound size={18} /> : chip === 'Para alguien de mi familia' ? <Heart size={18} /> : chip === 'Para mi hogar o negocio' ? <House size={18} /> : <ArrowUpRight size={18} />}</span>
        <span>{chip}</span><ArrowUpRight size={16} aria-hidden="true" />
      </button> })
    if (msg.chipsPrimero) msg.chips?.forEach((chip, i) => blocks.push(chipBlock(chip, i)))
    if (msg.results?.length) {
      blocks.push({ id: `${msg.id}-primary`, content:
        <div className={styles.screenResult}>
          <div className={styles.screenResultLabel}>Primera opción</div>
          <HelperCardTall helper={msg.results[0]} compact featured />
        </div> })
      const alternatives = msg.results.slice(1, 4)
      if (alternatives.length) blocks.push({ id: `${msg.id}-alternatives`, section: 'Otras opciones', content:
        <div className={styles.alternativeGroup} style={{ '--alternatives-count': alternatives.length }}>
          <div className={styles.alternativeGrid}>
            {alternatives.map(helper => <HelperCardTall key={helper.id} helper={helper} compact comparison />)}
          </div>
        </div> })
    }
    msg.quickOptions?.forEach((opt, i) => blocks.push({ id: `${msg.id}-quick-${i}`, content:
      <button className={styles.screenChoice} onClick={() => {
        beginResponse()
        setShowSuggestions(false)
        if (opt.includes('busca')) handleSend(searchHistory[0]?.query)
        else setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['Me alegra saberlo. Cuando lo necesites, vuelve a buscar.'] }])
      }}>{opt}<ArrowUpRight size={16} aria-hidden="true" /></button> }))
    if (!msg.chipsPrimero) msg.chips?.forEach((chip, i) => blocks.push(chipBlock(chip, i)))
    if (msg.refineChips?.length) {
      // Cada ajuste es una unidad: incluso en pantallas pequeñas se llega a todos.
      msg.refineChips.forEach((chip, i) => blocks.push({ id: `${msg.id}-refine-${i}`, content:
        <button className={styles.screenChoice} onClick={() => handleRefine(chip)}>
          <span className={styles.choiceIcon}><RefinementIcon label={chip} /></span><span>{chip}</span><ArrowUpRight size={16} aria-hidden="true" />
        </button>, section: 'Ajustar esta búsqueda' }))
    }
    if (showSuggestions && !msg.chips?.length && !msg.refineChips?.length && msgIndex === response.length - 1) {
      suggestions.forEach((suggestion, i) => blocks.push({ id: `suggestion-${i}`, content:
        <button className={styles.screenChoice} onClick={() => suggestion.ir ? navigate(suggestion.ir, suggestion.estado ? { state: suggestion.estado } : undefined) : handleSend(suggestion.text)}><span className={styles.choiceIcon}><Sparkles size={18} aria-hidden="true" /></span><span>{suggestion.text}</span><ArrowUpRight size={16} aria-hidden="true" /></button> }))
    }
  })
  if (!blocks.length) blocks.push({ id: 'waiting', content: <p className={styles.screenText} role="status">{loading ? 'Estoy buscando a quien puede ayudarte…' : 'Cuéntame qué necesitas.'}</p> })

  return (
    <div ref={pageRef} className={`${styles.page} ${styles.focusPage} ${isWelcome ? styles.pageWelcome : ''} ${user ? styles.pageReturning : ''}`}>
      {/* New search button — appears when chat has content */}


      {/* Floating top — three independent bubbles */}
      <div className={styles.floatTop}>
        {/* ── BUSCAR PROFESIONALES, SIEMPRE A MANO ─────────────────────
            El enlace de abajo desaparece al buscar — y es justo entonces
            cuando puede hacer falta: si Nüra no acierta, quieres mirar tu.
            Aqui arriba esta siempre, en el hueco que el logo dejaba vacio a
            la izquierda. Mismo circulo de 42px que el boton de reiniciar,
            asi que no añade un lenguaje nuevo a la barra. */}
        <div style={{display:'flex', alignItems:'center', pointerEvents:'all'}}>
          <button onClick={() => navigate('/explore')}
            aria-label="Buscar profesionales" className={styles.browseTop}>
            <Compass size={16} />
            Ver todos
          </button>
        </div>

        <div className={styles.logoBubble}>
          <span className={styles.wordmark}>Nüra</span>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'var(--space-8)',pointerEvents:'all'}}>
          {messages.length > 1 && (
            <button
              className={styles.resetBubble}
              onClick={() => {
                // Reiniciar es cancelar. Sin esto, la busqueda viva seguia
                // su curso y volcaba sus resultados bajo el saludo nuevo:
                // el usuario borraba la conversacion y dos segundos despues
                // le aparecia una recomendacion que ya no habia pedido.
                searchSeqRef.current++
                stopThinking()
                correctionRef.current = null
                setCorrigiendo(false)
                setViewStart(0)
                setMessages([])
                setLastMatches([])
                // La misma portada que al entrar: antes volvía sin «¿Para
                // quién necesitas ayuda?» y con la respuesta anterior viva.
                setForWhom('')
                setTimeout(() => setMessages([conPregunta({ id: 1, from: 'nura', lines: getWelcome(user, searchHistory, following, helpersCache, contactedHelpers, personas, citas) }, user)]), 100)
              }} aria-label="Empezar conversación de nuevo">
              <RotateCcw size={15} color="rgba(33,29,51,0.6)" />
            </button>
          )}
          {/* Su contenido es una imagen decorativa (alt="") o un icono: sin
              aria-label, un lector de pantalla solo dice "boton". Y es el
              unico camino al perfil desde Inicio. */}
          <button
            className={styles.profileBubble}
            aria-label="Tu perfil"
            style={{position:'static',transform:'none',padding:'0',width:'44px',height:'44px',borderRadius:'50%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'all'}}
            onClick={() => navigate('/profile')}>
            {user?.name
              ? <UserAvatar user={user} decorative className={styles.userAvatar} />
              : <UserRound size={20} color="rgba(33,29,51,0.4)" strokeWidth={1.5} />
            }
          </button>
        </div>
      </div>

      <div className={styles.screenArea}>
        <ResponseScreen key={responseKey} blocks={blocks} welcome={isWelcome} query={isWelcome ? '' : latestQuery} />
      </div>
      <div className={styles.focusComposer}>{composer}</div>

      {showGate && <RegisterGate reason={gateReason} onClose={() => setShowGate(false)} />}
      {valorar && <RatingModal helper={valorar} onClose={() => setValorar(null)} />}
      {alerta && (
        <AlertaSheet categoria={alerta.categoria} que={alerta.que} zona={alerta.zona} ciudad={alerta.ciudad}
          onClose={() => setAlerta(null)}
          onHecho={r => {
            setAlerta(null)
            // Se dice lo que ha pasado de verdad, canal por canal.
            const lineas = []
            if (!r.ok) lineas.push(r.motivo === 'demasiadas'
              ? 'Ya tienes muchos avisos con ese correo. Quita alguno desde tu perfil y vuelve a pedírmelo.'
              : 'No he podido guardarlo ahora. Vuelve a probar en un momento.')
            else {
              const vias = [r.canales?.movil && 'con una notificación', r.canales?.correo && 'por correo'].filter(Boolean)
              const que = alerta.que.toLowerCase() + (r.cerca ? ` cerca de ${r.cerca}` : r.ciudad ? ` en ${r.ciudad}` : '')
              lineas.push(vias.length
                ? `Hecho. Si llega alguien de ${que}, te aviso ${vias.join(' y ')}.`
                : `Hecho. Si llega alguien de ${que}, lo verás en tu perfil al abrir Nüra.`)
              if (r.motivoMovil === 'denegado') lineas.push('El móvil no ha dado permiso para notificaciones: puedes activarlo en los ajustes del navegador.')
              else if (r.motivoMovil === 'error') lineas.push('No he podido activar las notificaciones en este móvil ahora.')
              if (r.canales?.correo && !r.correoActivo) lineas.push('Los correos aún se están poniendo en marcha: mientras tanto lo verás en tu perfil.')
              lineas.push('Se borra solo a los 3 meses. Lo tienes en tu perfil por si quieres quitarlo antes.')
            }
            setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: lineas }])
          }} />
      )}
    </div>
  )
}
