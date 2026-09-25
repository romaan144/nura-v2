import { avatarDe } from '../utils/avatar'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CAT_HUMANA } from '../data/categorias'
import { Compass, Send, Mic, MicOff, RotateCcw, UserRound } from 'lucide-react'
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
import { scheduleLocalNotification, notifySearchAbandoned } from '../utils/notifications'
import { registrar } from '../utils/analitica'
import AlertaSheet from '../components/AlertaSheet'
import { useSinContestar } from '../utils/sinContestar'
import { useRespuestasNuevas } from '../utils/respuestasNuevas'
import RatingModal from '../components/RatingModal'
import { tieneAlerta, misAlertas, alertasGuardadas } from '../utils/alertas'
import styles from './Home.module.css'
import { PULSO_THRESHOLD, PULSO_DELAY, CONFIRMACION_THRESHOLD, CONFIRMACION_DELAY } from '../config'
import { extractPersona } from '../utils/personas'
import { proSignals } from '../utils/proSignals'
import { HELPERS as LOCAL_FALLBACK_HELPERS } from '../data/helpers'
import { fmtNota, fmtKm } from '../utils/formato'

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
  if (clave) parts.push(`su especialidad es justo eso: ${clave}`)
  else if (s.alzheimer) parts.push('lleva años acompañando casos de Alzheimer')
  else if (s.infantil) parts.push('se dedica a niños, no es algo que haga de vez en cuando')
  else if (paraLabel) parts.push(`atiende casos como el ${paraLabel.replace('para ', 'de ')}`)

  // 2. Los años, si la bio los dice — es el dato que mas tranquiliza
  const años = (helper?.bio || '').match(/(\d+)\s*años de experiencia/)
  if (años) parts.push(`lleva ${años[1]} años en esto`)

  // 3. Cuantas personas le han valorado: una cifra pesa mas que un adjetivo
  if ((helper?.reviews || 0) >= 20 && (helper?.rating || 0) >= 4.7) {
    parts.push(`${helper.reviews} personas le han valorado con un ${fmtNota(helper.rating)}`)
  }

  // 4. La distancia exacta, no "a unos minutos"
  // Solo si la persona dijo su barrio: si no, no hay distancia que contar.
  if (typeof helper?.distance === 'number' && helper.distanciaDesde && helper.distance <= 3) {
    parts.push(helper.distance < 0.5 ? `trabaja en ${helper.distanciaDesde}` : `está a ${fmtKm(helper.distance)} de ${helper.distanciaDesde}`)
  }

  if (helper?.__obra && parts.length < 2) parts.push('ha contado un caso muy parecido al tuyo')
  // «según su ficha, habla catalán y tiene coche y está a…» → con coma
  if (helper?.__declarado?.length === 2 && parts.length > 1) parts[0] = parts[0].replace(' y ', ', ')
  return parts.slice(0, 2).join(' y ') || 'encaja con lo que necesitas'
}

function ResultsBlock({ results }) {
  const navigate = useNavigate()
  if (!results?.length) return null
  const top = results[0]
  const alts = results.slice(1, 4)
  return (
    <div>
      <HelperCardTall helper={top} />
      <div className="hilo" style={{margin:'var(--space-12) var(--space-6) var(--space-2)'}} />
      {alts.length > 0 && (
        <>
          <div style={{fontSize:'var(--text-xs)', color:'var(--ink-secondary)', margin:'var(--space-14) 0 var(--space-8)', lineHeight:1.5}}>
            {alts.length === 1 ? 'También encajaría:' : 'Si prefieres comparar, también encajarían:'}
          </div>
          {/* SISTEMA, NO PANTALLA: la rejilla es SIEMPRE de tres. Una tarjeta
              pequeña mide lo mismo tenga tres hermanas o ninguna. Con
              `repeat(alts.length)` la unica alternativa se estiraba a 358px
              — un avatar de 62px flotando en una tarjeta del triple de
              ancho — y le pasaba a TODA la categoria de logopedia, que solo
              tiene dos profesionales. */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'var(--space-8)', alignItems:'start'}}>
            {alts.map((a, i) => <HelperCardTall key={a.id || i} helper={a} small />)}
          </div>
        </>
      )}
    </div>
  )
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
    `Describe lo que necesitas. Encontraremos a la persona adecuada.`,
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
        ? `El ${citaProxima.label}, **${hf}** está con ${citaProxima.personaLabel}. Todo listo 💜`
        : `El ${citaProxima.label} tienes tu primera cita con **${hf}**. Todo listo 💜`
    ]
  }

  const confirmedContacts = (contactedHelpers || []).filter(c => c?.confirmed === true)
  if (confirmedContacts.length > 0) {
    const last = confirmedContacts[confirmedContacts.length - 1]
    const helperFirst = last.name?.split(' ')?.[0] || last.name
    // El Espejo — si este contacto está vinculado a una persona, preguntar por ella
    const linkedPersona = (personas || []).find(p => (p.contactedHelperIds || []).includes(last.id))
    if (linkedPersona) {
      return [
        saludo,
        `¿Cómo está ${linkedPersona.label}? Me alegra que **${helperFirst}** esté con vosotros. Si necesitas algo más, aquí estoy.`
      ]
    }
    // Find what the user originally searched for when they contacted this helper
    const relatedSearch = (searchHistory || []).find(s =>
      s.category === last.category ||
      (s.query && last.name && s.query.toLowerCase().includes(helperFirst.toLowerCase()))
    )
    if (relatedSearch) {
      return [
        saludo,
        `¿Cómo va todo con **${helperFirst}**? ¿Necesitas algo más para lo que buscabas, o hay algo nuevo en lo que pueda ayudarte?`
      ]
    }
    return [
      saludo,
      `¿Cómo está yendo todo con **${helperFirst}**? Cuéntame si puedo ayudarte con algo más.`
    ]
  }

  // If there are contacts pending confirmation (no answer yet)
  const pendingContacts = (contactedHelpers || []).filter(c => c?.id && c?.confirmed === undefined)
  if (pendingContacts.length > 0) {
    const last = pendingContacts[pendingContacts.length - 1]
    const helperFirst = last.name?.split(' ')?.[0] || last.name
    return [
      saludo,
      `¿Pudiste resolver lo que necesitabas con **${helperFirst}**? ¿O buscamos otra persona?`
    ]
  }

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
  const yaTeConoce = (searchHistory || []).length > 0
  return [
    saludo,
    yaTeConoce
      ? (hour < 12 ? '¿En qué puedo ayudarte esta mañana?' : hour < 18 ? '¿Qué necesitas hoy?' : '¿Qué necesitas esta noche?')
      : 'Cuéntame qué necesitas y te encuentro a la persona.',
  ].concat(susurro ? [susurro] : [])
}

function detectIntent(text, user) {
  const t = text.toLowerCase()
  if (user?.isHelper && (t.includes('aprendido') || t.includes('certificado') || t.includes('estudié') || t.includes('trabajé')))
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

const HELPER_SUGGESTIONS = [
  { text: 'Añadir nueva certificación' },
  { text: 'Actualizar disponibilidad' },
  { text: 'Añadir experiencia reciente' },
  { text: 'Cambiar mis tarifas' },
]


const CONTESTAR = 'Contestar ahora'
const LEER_RESPUESTA = 'Leer la respuesta'

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const { chats: chatsUsuario, user, addSearch, searchHistory, favorites, helpersCache, nuraChatMessages, setNuraChatMessages, nuraLastMatches, setNuraLastMatches, cacheHelpers, contactedHelpers, confirmContact, following, personas, upsertPersona, citas, addStory , registrarDemanda, hasRated } = useUser()
  // messages persisted in context so they survive navigation
  const messages = nuraChatMessages
  const setMessages = setNuraChatMessages
  const [input, setInput] = useState('')
  const [forWhom, setForWhom] = useState(() => {
    try { return sessionStorage.getItem('nura_for_whom') || '' } catch { return '' }
  })
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
        ? `**${nombres[0]}** te ha contestado. Tienes su respuesta en el chat.`
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
  const bottomRef  = useRef(null)
  const resultRef = useRef(null)   // el MENSAJE de la respuesta (no solo el bloque)
  const scrollerRef = useRef(null) // el contenedor con scroll
  const inputRef   = useRef(null)
  const topRef     = useRef(null)
  const [topH, setTopH] = useState(80)
  const [floatH, setFloatH] = useState(84) /* header height fallback */

  // Cero scroll automático: la vista NO se mueve sola. La respuesta entra
  // debajo y el usuario baja cuando quiere. Ninguna mecánica puede fallar
  // si no hay mecánica. (Ley del fundador, 3 intentos de auto-scroll.)

  useEffect(() => {
    let lines = getWelcome(user, searchHistory, following, helpersCache, contactedHelpers, personas, citas)
    // If helper just registered
    let helperRegistered; try { helperRegistered = sessionStorage.getItem('nura_helper_registered') } catch {}
    if (helperRegistered) {
      sessionStorage.removeItem('nura_helper_registered')
      const firstName = user?.name?.split(' ')?.[0] || user?.name || ''
      lines = [
        `${firstName}, ya puedes encontrar a quien necesitas.`,
        `Tu perfil ya está visible. Los primeros usuarios pueden encontrarte desde ahora. Tu perfil se irá enriqueciendo automáticamente con cada interacción.`
      ]
      setTimeout(() => setMessages([{ id: 1, from: 'nura', lines }]), 300)
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

    // ── La Pregunta — contexto antes del texto ──
    // Solo cuando no hay memoria que continuar ni búsqueda previa que retomar
    let forWhomAnswered; try { forWhomAnswered = sessionStorage.getItem('nura_for_whom') } catch {}
    const lastQPre = searchHistory?.[0]?.query
    if (!forWhomAnswered && !lastQPre && !(contactedHelpers?.length)) {
      msgs[0] = {
        ...msgs[0],
        lines: [...msgs[0].lines, '¿Para quién necesitas ayuda?'],
        isPregunta: true,
        chips: ['Para mí', 'Para alguien de mi familia', 'Para mi hogar o negocio']
      }
    }


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
          } else {
            lineas.push('Crea tu acceso con correo y cada semana te diré cuántas personas buscan lo que haces y cuántas veces sale tu ficha.')
          }
          lineas.push(`💡 ${consejos[Math.floor(Math.random() * consejos.length)]}`)
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

    // ── La Confirmación Humana ──────────────────────────────────────────
    // 3 días reales tras el contacto (30s en demo) Nüra pregunta si funcionó

    const pending = (contactedHelpers || []).find(c => {
      if (!c?.contactedAt) return false
      const elapsed = Date.now() - c.contactedAt
      const alreadyAnswered = c.confirmed !== undefined
      return elapsed >= CONFIRMACION_THRESHOLD && !alreadyAnswered
    })

    if (pending && user && nuraChatMessages.length === 0) {
      timers.push(setTimeout(() => {
        setMessages(prev => {
          if (prev.some(m => m.isConfirmacion)) return prev
          return [...prev, {
            id: Date.now() + 88,
            from: 'nura',
            isConfirmacion: true,
            confirmacionHelperId: pending.id,
            confirmacionHelperName: pending.name,
            lines: [(() => {
              const lp = (personas || []).find(p => (p.contactedHelperIds || []).includes(pending.id))
              const ci = (citas || []).slice().reverse().find(x => x.helperId === pending.id)
              const hn = pending.name?.split(' ')?.[0] || pending.name
              if (ci) return `¿Qué tal fue la visita del ${ci.label} con **${hn}**${lp ? ` para ${lp.label}` : ''}? ¿Pudisteis resolverlo?`
              return lp
                ? `¿Pudiste resolver lo que necesitabas para ${lp.label} con **${hn}**?`
                : `¿Pudiste resolver lo que necesitabas con **${hn}**?`
            })()],
            chips: ['Sí, genial', 'No del todo'],
          }]
        })
      }, CONFIRMACION_DELAY))
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
      lines: ['Vale — dime qué he entendido mal y ajusto la búsqueda.'],
      chips: ['Era otra cosa'] }])
    setTimeout(() => inputRef.current?.focus?.(), 200)
  }

  function cancelCorrection() {
    correctionRef.current = null
    setCorrigiendo(false)
  }

  // ── Una sola autoridad del estado "pensando" ──
  function stopThinking() {
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
  useEffect(() => {
    const q = location.state?.q
    if (!q || entranteRef.current === q) return
    entranteRef.current = q
    window.history.replaceState({}, '')
    const t = setTimeout(() => handleSend(q), 260)
    return () => clearTimeout(t)
  }, [location.state?.q])   // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(text) {
    blurSinSalto()
    let msg = text || input
    if (!msg.trim()) return
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
      try { sessionStorage.setItem('nura_for_whom', val) } catch {}
      setForWhom(val)
      setTimeout(() => {
        const replies = {
          mi: 'Perfecto. Cuéntame qué necesitas — estoy aquí para ayudarte.',
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
            const ci = (citas || []).slice().reverse().find(c => c.helperId === hid)
            const fn = user?.name?.split(' ')?.[0] || 'Alguien'
            addStory({
              id: 'me_' + hid, helperId: hid,
              helper: { id: hf.id, name: hf.name, specialty: hf.specialty, category: hf.category, zone: hf.zone, avatarUrl: hf.avatarUrl, avatar: hf.avatar, avatarColor: hf.avatarColor, rating: hf.rating, verified: hf.verified },
              seconds: null, timeAgo: 'hoy',
              text: `${fn} encontró ${lp ? `ayuda de confianza para ${lp.label}` : 'la ayuda que necesitaba'}${ci ? ` — primera visita, el ${ci.label}` : ''}. ✓ Funcionó.`,
            })
            // Y el momento de preguntarle como fue: es lo que construye la
            // ficha del profesional (perfil vivo) y ayuda a otros a elegir.
            if (!hasRated?.(hid)) setValorar({ ...hf, id: hf.id ?? hid, name: hf.name || confirmMsg.confirmacionHelperName || '' })
          } catch (e) { console.error('[Nüra] historia:', e) }
        }
      }

      setTimeout(() => {
        if (isPositive) {
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: [
              `Me alegra mucho. **${helperName}** queda anotado como una conexión que funcionó. 🤍`,
              `Si me cuentas cómo fue, ayudarás a otros a elegir bien.`
            ]
          }])
        } else {
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: [
              `Lo siento. ¿Quieres que busque otra persona para lo que necesitabas?`
            ],
            chips: ['Sí, busca otra persona', 'Ya lo resolví de otra forma']
          }])
        }
        setLoading(false)
      }, 800)
      return
    }

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

    if (lastMatches?.length > 0) {
      // User confirms — guide to profile
      if (esBreve && (palabra('sí','si','vale','ok','ese','esa','bien','genial','perfecto') || t.includes('me convence'))) {
        const topMatch = lastMatches?.[0]
        const firstName = topMatch?.name?.split(' ')?.[0] || ''
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
          // Sin su barrio no hay cercania que medir: se pregunta (antes se
          // decia «está a 1,2 km» con una distancia inventada).
          if (refined.every(h => typeof h.distance !== 'number')) {
            setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
              lines: ['¿En qué barrio estás? Dímelo —por ejemplo, «en Gràcia»— y los ordeno por cercanía.'] }])
            setLoading(false)
            return
          }
          refined = refined.sort((a,b) => (a.distance ?? 99) - (b.distance ?? 99))
          refineLine = `Ordenados por cercanía. **${refined[0]?.name?.split(' ')?.[0]}** está ${refined[0]?.distance < 0.5 ? `en ${refined[0]?.distanciaDesde}` : `a ${fmtKm(refined[0]?.distance)} de ${refined[0]?.distanciaDesde}`}.`
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
    if (lastMatches?.length > 0 && intent === 'search') {
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
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['He actualizado tu perfil con esta información. Se analizará y añadirán las habilidades relevantes automáticamente.'] }])
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
      const empathyLine = `Entendido${analysis?.persona && PERSONA_CHIP[analysis.persona] ? ' — ' + PERSONA_CHIP[analysis.persona].charAt(0).toLowerCase() + PERSONA_CHIP[analysis.persona].slice(1) : ''}.`
      setMessages(prev => [...prev, { id: Date.now() + 0.3, from: 'nura', lines: [empathyLine] }])

      // El pensando sereno — con dueño y cancelación (El Contrato)
      const thinkingTimer = setTimeout(() => {
        if (!alive()) return
        setMessages(prev => [...prev, { id: Date.now() + 0.5, from: 'nura', lines: ['Dame un segundo. Estoy pensando en quién encaja de verdad.'], loading: true }])
      }, 450)
      let matches = await matchHelpers(analysis, 4)
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
          const alternativas = {
          logopeda:    { alt: 'logopeda online', chip1: 'Buscar online', chip2: 'Ampliar zona' },
          tecnico:     { alt: 'técnico de guardia', chip1: 'Urgencias 24h', chip2: 'Ampliar zona' },
          limpieza:    { alt: 'servicio de limpieza online', chip1: 'Ampliar zona', chip2: 'Ver todos' },
          cuidado:     { alt: 'cuidadora a domicilio', chip1: 'Ver cuidadoras', chip2: 'Ampliar zona' },
          mascotas:    { alt: 'cuidador de mascotas', chip1: 'Ver cuidadores', chip2: 'Ampliar zona' },
          matematicas: { alt: 'profesor online', chip1: 'Buscar online', chip2: 'Ampliar zona' },
          entrenador:  { alt: 'entrenador online', chip1: 'Buscar online', chip2: 'Ampliar zona' },
          otro:        { alt: 'profesional similar', chip1: 'Ampliar zona', chip2: 'Ver todos' },
        }
          const alt = alternativas[analysis.categoria] || alternativas.otro
          const queEs = (CAT_HUMANA[analysis.categoria] || 'eso').toLowerCase()
          sinCoberturaRef.current = { categoria: analysis.categoria, que: CAT_HUMANA[analysis.categoria] || queEs, zona: analysis.zona || null }
          registrarDemanda?.({ categoria: analysis.categoria, fecha: Date.now() })
          registrar('sin_cobertura', { categoria: analysis.categoria })
          setMessages(prev => [...prev, { id: Date.now() + 2, from: 'nura',
            lines: [analysis.ciudad && analysis.ciudad !== 'Barcelona'
              ? `Te he entendido: buscas ${queEs} en ${analysis.ciudad}. Nüra acaba de empezar y todavía no tengo a nadie allí.`
              : `Te he entendido: buscas ${queEs}. Ahora mismo no tengo a nadie así cerca de ti.`],
            chips: [`Buscar ${alt.alt}`, 'Ampliar la zona', 'Avísame cuando tengas a alguien'] }])
          // Aqui NO se pregunta si recordar: solo se ven las opciones del
          // ultimo mensaje, y taparia estas.
          return
        }
        // Cuando no se entiende, se pide otra vez — pero NO igual para todos.
        // Alguien escribia "es una emergencia" y Nura le respondia con un
        // ejemplo sobre entrenador personal: detectaba la urgencia y no la
        // reconocia. Sonaba sorda justo cuando mas importa no sonarlo.
        {
          const urge = /\b(urgent\w*|emergenc\w*|ahora mismo|cuanto antes|ya mismo|se me ha roto|no puedo esperar)\b/i.test(msg)
          setMessages(prev => [...prev, { id: Date.now() + 2, from: 'nura',
            lines: urge
              ? ['Entiendo que corre prisa. Para encontrarte a alguien ya, dime qué ha pasado: ¿es algo de casa, de salud, o cuidar a alguien?']
              : ['No estoy segura de haberte entendido del todo — ¿me lo cuentas con otras palabras? Por ejemplo: "entrenador personal cerca de casa" o "alguien que cuide a mi madre".'],
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
      registrar('busqueda', { categoria: analysis?.categoria || 'otro', resultados: matches.length })
      // Una por profesional recomendado: es lo que cuenta su Pulso («tu ficha
      // salio X veces»). Solo quien salio y la categoria, nunca la frase.
      matches.slice(0, 6).forEach(h => registrar('recomendacion_vista', {
        categoria: analysis?.categoria, resultados: matches.length, helperId: h?.id != null ? String(h.id) : undefined }))
      setLastMatches(matches)
      // Schedule reminder if user doesn't contact
      scheduleLocalNotification(
        '¿Te convencieron los resultados?',
        `Tienes ${matches.length} profesionales disponibles. ¿Ya les has escrito?`,
        2 * 60 * 60 * 1000
      )
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
      const topName = top?.name?.split(' ')?.[0] || ''
      const topFirstName = top?.name?.split(' ')?.[0] || ''
      // La Gramática de la Recomendación — humana, breve, segura
      const why = buildWhy(top, analysis)
      const urgentTail = analysis?.urgente ? ' — y puede estar allí hoy mismo' : ''
      // EL PORQUE SE SEPARA. Iba dentro de la misma frase que el anuncio,
      // asi que se leia en 15px como un dato mas. Pero "trabaja muchisimo
      // con peques y trabaja muy cerca de ti" es lo UNICO que ninguna otra
      // app puede decirte: es la razon de existir de Nüra.
      // En dos lineas puede tener peso propio sin inventar nada.
      // "Creo que ya tengo a la persona" no aportaba nada: el resultado ya
      // esta ahi. Era relleno antes de lo que importa.
      const resultLine = `**${topFirstName}** es quien mejor encaja.`
      const whyLine = `${why.charAt(0).toUpperCase()}${why.slice(1)}${urgentTail}.`


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
      setMessages(prev => [...prev, resultMsg])
      preguntarSiRecordar()
      setLoading(false)
    } catch (err) {
      searchSeqRef.current++  // invalida temporizadores huérfanos de esta búsqueda
      stopThinking()
      console.error('[Nüra] búsqueda:', err)
      setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
        // Ni tecnicismos ni callejon sin salida: se distingue la falta de
        // conexion de un fallo nuestro, y el reintento se ofrece como chip
        // con la consulta original — el usuario no la reescribe.
        lines: (!navigator.onLine || /fetch|network|load failed/i.test(String(err?.message || err)))
          ? ['Parece que te has quedado sin conexión. Cuando vuelvas, lo intento otra vez.']
          : ['Se me ha atascado la búsqueda. No es culpa tuya — inténtalo otra vez.'],
        chips: [msg] }])
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

  function handleChip(chip) {
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
      // Honestidad: el vacio no es de zona, es de oferta. Prometer que
      // ampliando aparecera alguien seria mentir dos veces.
      haptic('light')
      responde(
        [`He mirado en toda ${window.__nuraLastAnalysis?.ciudad || 'la ciudad'}, no solo en tu barrio — todavía no tengo a nadie así.`],
        ['Avisame cuando tengas a alguien']
      )
      return
    }

    if (chip === 'Avisame cuando tengas a alguien' || chip === 'Avísame cuando tengas a alguien') {
      // Antes respondia «Anotado, te aviso» y NO avisaba. Ahora pide permiso
      // (la hoja dice que guarda) y avisa de verdad: movil y/o correo.
      haptic('light')
      const pend = sinCoberturaRef.current
      if (!pend) { responde(['Cuéntame otra vez qué necesitas y te digo si puedo avisarte.']); return }
      if (tieneAlerta(pend.categoria)) {
        responde([`Ya te aviso si llega alguien de ${pend.que.toLowerCase()}. Lo tienes en tu perfil.`])
        return
      }
      setAlerta(pend)
      return
    }

    if (chip === 'Si, busca otra persona' || chip === 'Sí, busca otra persona') {
      let q = window.__nuraLastQuery
      if (!q) { try { q = sessionStorage.getItem('nura_last_query') } catch { /* sin memoria */ } }
      if (q) { handleSend(q); return }
      haptic('light')
      responde(['Cuentame otra vez que necesitas y te busco a alguien distinto.'])
      return
    }

    if (chip === 'Ya lo resolvi de otra forma' || chip === 'Ya lo resolví de otra forma') {
      haptic('light')
      responde(['Me alegro de que se resolviera. Aqui estare cuando vuelvas a necesitarme.'])
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

  // Measure floatTop height for messages top padding
  useEffect(() => {
    const top = topRef.current
    if (!top) return
    const measure = () => {
      const tRect = top.getBoundingClientRect()
      setTopH(Math.ceil(tRect.bottom) + 8)
    }
    const ro = new ResizeObserver(measure)
    ro.observe(top)
    measure()
    return () => ro.disconnect()
  }, [])


  return (
    <div className={styles.page}>
      {/* New search button — appears when chat has content */}


      {/* Floating top — three independent bubbles */}
      <div className={styles.floatTop} ref={topRef}>
        {/* ── BUSCAR PROFESIONALES, SIEMPRE A MANO ─────────────────────
            El enlace de abajo desaparece al buscar — y es justo entonces
            cuando puede hacer falta: si Nüra no acierta, quieres mirar tu.
            Aqui arriba esta siempre, en el hueco que el logo dejaba vacio a
            la izquierda. Mismo circulo de 42px que el boton de reiniciar,
            asi que no añade un lenguaje nuevo a la barra. */}
        <div style={{display:'flex', alignItems:'center', pointerEvents:'all'}}>
          <button onClick={() => navigate('/explore')}
            aria-label="Buscar profesionales"
            style={{
              /* UN CIRCULO GRIS CON UNA BRUJULA NO DICE NADA: nadie sabe
                 que hace hasta tocarlo. Con el morado de Nüra y la palabra
                 escrita, se lee de un vistazo. Es la unica accion de marca
                 de la barra, asi que no compite con nada. */
              /* Medido: con "Profesionales" el boton ocupaba 138px y
                 comprimia el logo de la barra. Y "Buscar" a secas confunde:
                 la capsula de abajo tambien busca. "Ver todos" es corto y
                 dice lo que hace — abre la lista entera. */
              display:'flex', alignItems:'center', gap:'var(--space-6)',
              height:42, padding:'0 var(--space-12)',
              background:'var(--purple)', color:'white', border:'none',
              borderRadius:'var(--radius-full)',
              boxShadow:'0 1px 2px rgba(33,29,51,0.05), 0 6px 16px -8px rgba(123,47,255,0.45)',
              fontSize:'var(--text-sm)', fontWeight:700, fontFamily:'inherit',
              cursor:'pointer', whiteSpace:'nowrap',
              WebkitTapHighlightColor:'transparent',
            }}>
            <Compass size={16} />
            Ver todos
          </button>
        </div>

        <div className={styles.logoBubble}>
          <img src="/logo-text.png" alt="Nüra" className={styles.headerLogo} />
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
                setMessages([])
                setLastMatches([])
                setTimeout(() => setMessages([{ id: 1, from: 'nura', lines: getWelcome(user, searchHistory, following, helpersCache, contactedHelpers, personas, citas) }]), 100)
              }} aria-label="Empezar conversación de nuevo">
              <RotateCcw size={15} color="rgba(33,29,51,0.6)" />
            </button>
          )}
          {/* Su contenido es una imagen decorativa (alt="") o un icono: sin
              aria-label, un lector de pantalla solo dice "boton". Y es el
              unico camino al perfil desde Inicio. */}
          <button
            className={styles.logoBubble}
            aria-label="Tu perfil"
            style={{position:'static',transform:'none',padding:'0',width:'42px',height:'42px',borderRadius:'50%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'all'}}
            onClick={() => navigate('/profile')}>
            {user?.name
              ? <img src={avatarDe(encodeURIComponent(user.name))} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
              : <UserRound size={20} color="rgba(33,29,51,0.4)" strokeWidth={1.5} />
            }
          </button>
        </div>
      </div>

      <div className={styles.messages} ref={scrollerRef}
        style={{paddingTop: topH + 'px'}}>
        {messages.map((msg, msgIdx) => {
          const prevMsg = messages[msgIdx - 1]
          const prevHadResults = prevMsg?.results?.length > 0
          const firstOfNuraRun = msg.from === 'nura' && prevMsg?.from !== 'nura'
          // Spacing: 16px between messages, 24px after carousel, 20px for user replies
          const spacingClass = prevHadResults ? styles.afterCarousel : ''
          return (
          /* El `auto` del primer mensaje mantiene la conversacion pegada
             abajo, que es correcto CUANDO HAY conversacion. En la pantalla
             de bienvenida dejaba 368px muertos arriba — mas de un tercio de
             pantalla en blanco antes de que empezara nada. Ahi el saludo
             sube y respira. */
          <div key={msg.id} style={{marginTop: msgIdx === 0 ? (nuraChatMessages.length <= 1 ? 'var(--space-32)' : 'auto') : msg.from === 'user' ? 'var(--chat-gap-md)' : 'var(--chat-gap)'}} ref={msg.results?.length ? resultRef : undefined}>
            <div className={`${styles.msgRow} ${msg.from === 'user' ? styles.msgRowUser : ''} ${spacingClass}`}>
              {msg.from === 'nura' && (
                firstOfNuraRun ? (
                  <div className={styles.nuraAvatar}>
                    <img src="/logo-iso.png" alt="Nüra" className={styles.nuraAvatarImg} />
                  </div>
                ) : (
                  <div className={styles.nuraAvatarSpacer} />
                )
              )}
              <div className={`${styles.bubble} ${msg.from === 'user' ? styles.bubbleUser : styles.bubbleNura} ${msgIdx === 0 && msg.from !== 'user' ? styles.greeting : ''} ${msgIdx === 0 && msg.from !== 'user' && nuraChatMessages.length > 1 ? styles.greetingRetirado : ''}`}>
                {msg.text && <p>{msg.text}</p>}
                {msg.lines?.map((line, i) => <p key={i}>{formatLine(line)}</p>)}
                {msg.loading && <div className={styles.typingDots}><span /><span /><span /></div>}

              {msg.quickOptions && (
                <div style={{display:'flex',gap:'var(--space-8)',flexWrap:'wrap',marginTop:'var(--space-8)'}}>
                  {(msg.quickOptions||[]).map((opt,i) => (
                    <button key={i}
                      style={{padding:'7px var(--space-14)',background:'var(--paper)',border:'1.5px solid var(--rule)',borderRadius:'var(--radius-card)',fontSize:'var(--text-xs)',color:'var(--mid)',cursor:'pointer',transition:'all 0.15s'}}
                      onClick={() => {
                        setShowSuggestions(false)
                        if (opt.includes('busca')) handleSend(searchHistory[0]?.query)
                        else setMessages(prev => [...prev, {id:Date.now(),from:'nura',lines:['Me alegra saberlo. Cuando lo necesites, vuelve a buscar.']}])
                      }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              </div>
            </div>

            {msg.results && (
              <div className={styles.carouselBlock}>
                <ResultsBlock results={msg.results} />
              </div>
            )}

        {(() => {
          const lastMsg = msg
          // Los chips de conversacion: la respuesta a lo que Nura acaba de
          // preguntar. Se producian en NUEVE sitios y no se pintaban en
          // ninguno — la pregunta llegaba sin forma de contestarla. Van
          // antes que las sugerencias: quien tiene una pregunta delante no
          // necesita ademas tres ejemplos genericos.
          // Los chips de RESPUESTA no son los de ajustar. Estos contestan a
          // una pregunta —"¿para quien necesitas ayuda?"— y son una decision;
          // los de ajustar son un retoque. Compartian estilo de pildora
          // pequeña apretada, y eso hacia que responder pareciera rellenar un
          // formulario.
          if (lastMsg?.chips?.length) return (
            <div className={styles.answerRow}>
              {lastMsg.chips.map((chip, i) => (
                <button key={i} className={styles.answerChip}
                  onClick={() => handleChip(chip)}>{chip}</button>
              ))}
            </div>
          )
          const activeChips = lastMsg?.refineChips
          if (activeChips) return (
            <div className={styles.refineRow}>
              <div className={styles.refineLabel}>Ajustar esta búsqueda</div>
              {activeChips.map((chip, i) => (
                <button key={i} className={styles.refineChip}
                  onClick={() => {
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
                        lines: [`${sorted[0]?.name?.split(' ')?.[0]} es el más económico — cobra ${sorted[0]?.price}.`],
                        results: sorted, refineChips: ['Más cerca','Mejor valorado','Online'] }])
                      setLastMatches(sorted); return
                    }
                    if (chip === 'Más cerca' && lastMatches?.length > 0) {
                      if (lastMatches.every(h => typeof h.distance !== 'number')) {
                        setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
                          lines: ['¿En qué barrio estás? Dímelo —por ejemplo, «en Gràcia»— y los ordeno por cercanía.'] }])
                        return
                      }
                      const sorted = [...lastMatches].sort((a,b) => (a.distance ?? 99) - (b.distance ?? 99))
                      setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
                        lines: [`${sorted[0]?.name?.split(' ')?.[0]} es quien está más cerca: ${sorted[0]?.distance < 0.5 ? `en ${sorted[0]?.distanciaDesde}` : `a ${fmtKm(sorted[0]?.distance)} de ${sorted[0]?.distanciaDesde}`}.`],
                        results: sorted, refineChips: ['Más barato','Mejor valorado','Online'] }])
                      setLastMatches(sorted); return
                    }
                    if (chip === 'Mejor valorado' && lastMatches?.length > 0) {
                      const sorted = [...lastMatches].sort((a,b) => (b.rating||0)-(a.rating||0))
                      setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
                        lines: [`${sorted[0]?.name?.split(' ')?.[0]} tiene la mejor valoración — ${fmtNota(sorted[0]?.rating)}★.`],
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
                  }}>
                  {chip === 'Más cerca' ? '📍' : chip === 'Más barato' ? '💰' : chip === 'Mejor valorado' ? '★' : chip === 'Online' ? '💻' : chip === 'No es lo que buscaba' ? '↺' : chip === 'Ver todos' ? '👥' : '✦'} {chip}
                </button>
              ))}
            </div>
          )
          if (showSuggestions) return (
            <div className={styles.suggestions}>
              {(suggestions||[]).map((s, i) => (
                <button key={i} className={styles.suggestion} onClick={() => handleSend(s.text)}>
                  <span className={styles.suggestionText}>{s.text}</span>
                </button>
              ))}
            </div>
          )
          return null
        })()}

          </div>
          )
        })}
        {/* Espaciadores retirados: la reserva vive en el padding del
            scroller (CONTRATO regla 3: ningun hijo reserva nada). */}
        <div ref={bottomRef} />
      </div>

      {/* Floating bottom — suggestions + input capsule only */}
      <div className={styles.floatBottom}>


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

        {/* ── PARA QUIEN NO SABE QUE ESCRIBIR ────────────────────────────
            Profesionales deja de ser una pestaña (ver docs/revision-profunda.md):
            era una segunda puerta a la misma cosa — su buscador ya mandaba
            aqui—. Pero SI aportaba algo real: ver que hay sin saber que
            pedir, con 13 categorias y sus especialidades.
            Eso no se pierde. Vive aqui, bajo la capsula, donde alguien lo
            busca cuando se queda en blanco. Sin ocupar pantalla. */}
        {nuraChatMessages.length <= 1 && (
          <button onClick={() => navigate('/explore')} style={{
            /* NO ES UNA TERCERA BURBUJA. Al convertirlo en tarjeta quedaron
               TRES bloques blancos de ~60px apilados en los ultimos 220px de
               pantalla —capsula, este y la barra—, con el mismo fondo y casi
               la misma altura. Parecian hermanos haciendo cosas distintas.
               Aqui no hay fondo ni sombra: es una frase con su brujula,
               subordinada a la capsula. El peso lo da el texto, no la caja. */
            display:'flex', alignItems:'center', justifyContent:'center',
            gap:'var(--space-8)', alignSelf:'center',
            marginTop:'var(--space-12)', padding:'var(--space-8) var(--space-12)',
            background:'none', border:'none', cursor:'pointer',
            fontFamily:'inherit', pointerEvents:'all',
          }}>
            <Compass size={15} color="var(--purple)" style={{flexShrink:0}} />
            {/* Decision del fundador. Paso por "Ver a quien puedes
                encontrar" —con la tilde de "quién" perdida— y por "Ver con
                qué te puedo ayudar". Se queda en el nombre llano: quien
                llega aqui sabe lo que va a ver. */}
            <span style={{fontSize:'var(--text-sm)', fontWeight:600, color:'var(--purple-ink)'}}>
              Buscar profesionales
            </span>
          </button>
        )}
      </div>

      {showGate && <RegisterGate reason={gateReason} onClose={() => setShowGate(false)} />}
      {valorar && <RatingModal helper={valorar} onClose={() => setValorar(null)} />}
      {alerta && (
        <AlertaSheet categoria={alerta.categoria} que={alerta.que} zona={alerta.zona}
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
              const que = alerta.que.toLowerCase() + (r.cerca ? ` cerca de ${r.cerca}` : '')
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
