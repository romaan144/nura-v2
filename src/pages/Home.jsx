import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CAT_HUMANA } from '../data/categorias'
import { Send, Mic, MicOff, Plus, Clock, RotateCcw, UserRound } from 'lucide-react'
import { analyzeNeed, matchHelpers, getPriceContext } from '../utils/matching'
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
import styles from './Home.module.css'
import { PULSO_THRESHOLD, PULSO_DELAY, CONFIRMACION_THRESHOLD, CONFIRMACION_DELAY } from '../config'
import { extractPersona } from '../utils/personas'
import { proSignals } from '../utils/proSignals'
import { HELPERS as LOCAL_FALLBACK_HELPERS } from '../data/helpers'

// ── La Comprensión Visible — lo que Nüra ha entendido, en chips ──
const PERSONA_CHIP = {
  madre:'Para tu madre', padre:'Para tu padre', hijo:'Para tu hijo', hija:'Para tu hija',
  abuela:'Para tu abuela', abuelo:'Para tu abuelo', marido:'Para tu marido',
  mujer:'Para tu mujer', pareja:'Para tu pareja', hermana:'Para tu hermana',
  hermano:'Para tu hermano', bebe:'Para tu bebé',
}
function buildComprehension(analysis) {
  const chips = []
  if (analysis?.matchedTerm) chips.push(analysis.matchedTerm.charAt(0).toUpperCase() + analysis.matchedTerm.slice(1))
  const s = analysis?.complexSignals || {}
  if (analysis?.persona && PERSONA_CHIP[analysis.persona]) chips.push(PERSONA_CHIP[analysis.persona])
  else if (analysis?.paraQuien === 'familia') chips.push('Para tu familia')
  else if (analysis?.paraQuien === 'hogar') chips.push('Para tu hogar')
  if (CAT_HUMANA[analysis?.categoria]) chips.push(CAT_HUMANA[analysis.categoria])
  if (s.alzheimer) chips.push('Experiencia en Alzheimer')
  if (s.infantil) chips.push('Con niños')
  if (s.sola) chips.push('Vive sola')
  if (s.nocturno) chips.push('Horario nocturno')
  if (analysis?.urgente) chips.push('Urgente')
  chips.push('Cerca de ti')
  return chips.slice(0, 5)
}

// ── La Recomendación — una persona primero, con convicción ──
// ── La Gramática: el porqué humano, ÚNICA fuente (chat + perfil) ──
function buildWhy(helper, analysis) {
  const paraLabel = analysis?.persona && PERSONA_CHIP[analysis.persona]
    ? PERSONA_CHIP[analysis.persona].charAt(0).toLowerCase() + PERSONA_CHIP[analysis.persona].slice(1)
    : ''
  const s = analysis?.complexSignals || {}
  const parts = []
  if (s.alzheimer) parts.push('lleva años acompañando casos de Alzheimer')
  else if (s.infantil) parts.push('trabaja muchísimo con peques')
  else if (paraLabel) parts.push(`tiene mucha experiencia con casos como el ${paraLabel.replace('para ', 'de ')}`)
  if (helper?.distance && helper.distance <= 1.2) parts.push('trabaja muy cerca de ti')
  else if (helper?.distance && helper.distance <= 3) parts.push('está a unos minutos de tu casa')
  if ((helper?.rating || 0) >= 4.8) parts.push('tiene valoraciones excelentes')
  if (helper?.__obra && parts.length < 2) parts.push('ha documentado un caso muy parecido al tuyo')
  return parts.slice(0, 2).join(' y ') || 'encaja especialmente bien con lo que necesitas'
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
            Si prefieres comparar, también encajarían:
          </div>
          <div style={{display:'grid', gridTemplateColumns:`repeat(${Math.min(alts.length, 3)}, 1fr)`, gap:'var(--space-8)', alignItems:'start'}}>
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
  const firstName = user?.name?.split(' ')?.[0] || user?.name

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
      `${greeting}, **${firstName}**.`,
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
        `${greeting}, **${firstName}**.`,
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
        `${greeting}, **${firstName}**.`,
        `¿Cómo va todo con **${helperFirst}**? ¿Necesitas algo más para lo que buscabas, o hay algo nuevo en lo que pueda ayudarte?`
      ]
    }
    return [
      `${greeting}, **${firstName}**.`,
      `¿Cómo está yendo todo con **${helperFirst}**? Cuéntame si puedo ayudarte con algo más.`
    ]
  }

  // If there are contacts pending confirmation (no answer yet)
  const pendingContacts = (contactedHelpers || []).filter(c => c?.id && c?.confirmed === undefined)
  if (pendingContacts.length > 0) {
    const last = pendingContacts[pendingContacts.length - 1]
    const helperFirst = last.name?.split(' ')?.[0] || last.name
    return [
      `${greeting}, **${firstName}**.`,
      `¿Pudiste resolver lo que necesitabas con **${helperFirst}**? ¿O buscamos otra persona?`
    ]
  }

  // ── El Espejo — persona conocida, aún sin conexión cerrada ──────────
  if ((personas || []).length > 0) {
    const p = personas[personas.length - 1]
    if (!(p.contactedHelperIds || []).length) {
      return [
        `${greeting}, **${firstName}**.`,
        `La última vez me hablaste de ${p.label}. ¿Cómo está? ¿Buscamos a alguien que pueda ayudar?`
      ]
    }
  }

  // Default greeting
  if (user.isHelper) {
    const sig = proSignals(user.name)
    return [
      `${greeting}, **${firstName}**.`,
      `Mientras no mirabas, **${sig.vistasHoy} ${sig.vistasHoy === 1 ? 'persona vio' : 'personas vieron'}** tu perfil hoy y hubo **${sig.busquedasSemana} búsquedas** en tu zona esta semana. Tu escaparate está activo ✨ Y si tú necesitas ayuda, aquí estoy.`
    ]
  }
  // El susurro de Seguir: la evolución te encuentra (solo rama default)
  let susurro = null
  try {
    const seg = getObra(99).filter(p => (following || []).includes(p.helperId))
    if (seg.length) {
      const p = seg[0]
      const first = p.who?.name?.split(' ')?.[0] || ''
      susurro = `**${first}**, al que sigues, publicó ${p.dateLabel} — ${String(TYPE_META[p.type]?.label || 'obra').toLowerCase()}: “${p.title}”.`
    }
  } catch { /* silencioso */ }

  return [
    `${greeting}, **${firstName}**.`,
    hour < 12 ? `¿En qué puedo ayudarte esta mañana?`
    : hour < 18 ? `Cuéntame qué necesitas y lo encontramos.`
    : `¿Qué necesitas esta noche?`
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


export default function Home() {
  const navigate = useNavigate()
  const { user, addSearch, searchHistory, favorites, helpersCache, nuraChatMessages, setNuraChatMessages, nuraLastMatches, setNuraLastMatches, cacheHelpers, contactedHelpers, confirmContact, following, personas, upsertPersona, citas, addStory } = useUser()
  // messages persisted in context so they survive navigation
  const messages = nuraChatMessages
  const setMessages = setNuraChatMessages
  const [input, setInput] = useState('')
  const [forWhom, setForWhom] = useState(() => {
    try { return sessionStorage.getItem('nura_for_whom') || '' } catch { return '' }
  })
  const correctionRef = useRef(null)
  const searchSeqRef = useRef(0)  // El Contrato: solo la búsqueda activa toca la interfaz
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [showGate, setShowGate] = useState(false)
  const [gateReason, setGateReason] = useState('contact')
  // showSuggestions: hide once user has chatted
  const showSuggestions = nuraChatMessages.length <= 1
  const setShowSuggestions = () => {} // no-op, derived from messages
  const [inputFocused, setInputFocused] = useState(false)
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
    // If just came from onboarding with a name — magic first moment
    let justOnboarded; try { justOnboarded = sessionStorage.getItem('nura_just_onboarded') } catch {}
    if (justOnboarded) {
      sessionStorage.removeItem('nura_just_onboarded')
      const firstName = justOnboarded.split(' ')[0]
      const hour = new Date().getHours()
      const momentoDelDia = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'
      const ejemplos = hour < 12
        ? ['Mi madre tiene Alzheimer y necesita cuidado mañanas', 'Técnico urgente hoy', 'Logopeda para niño de 5 años con dislalia']
        : hour < 20
        ? ['Niñera de confianza para niños de 3 y 6 años', 'Abogado laboralista — me han despedido', 'Psicóloga para ansiedad y ataques de pánico']
        : ['Cuidadora nocturna para mi padre operado', 'Fontanero urgente — hay una fuga', 'Profesor de matemáticas para selectividad']
      const welcomeMsg = {
        id: 1, from: 'nura',
        lines: [
          `${momentoDelDia}, **${firstName}**. Soy Nüra.`,
          `Cuéntame lo que necesitas. Encuentro a la persona exacta cerca de ti.`
        ],
        chips: ejemplos
      }
      setTimeout(() => setMessages([welcomeMsg]), 150)

      // If user wrote their intent in onboarding, auto-send it
      let intentQuery; try { intentQuery = sessionStorage.getItem('nura_intent_query') } catch {}
      if (intentQuery) {
        sessionStorage.removeItem('nura_intent_query')
        // Show a teaser first — then auto-send
        const teaserMsg = {
          id: Date.now() + 0.1, from: 'nura',
          lines: [`He visto lo que me contaste. Déjame buscarte la mejor opción ahora mismo.`]
        }
        setTimeout(() => {
          setMessages(prev => [...prev, teaserMsg])
          setTimeout(() => handleSend(intentQuery), 1200)
        }, 1000)
      } else {
        // Auto-focus input after welcome so user can start immediately
        setTimeout(() => {
          const inp = document.querySelector('textarea, input[type="text"]')
          if (inp) inp.focus()
        }, 600)
      }
      return
    }

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
      lines = [`**${user?.name?.split(' ')?.[0] || 'Hola'}**, Ya puedes contactar con cualquier profesional. ¿Qué necesitas?`]
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
        timers.push(setTimeout(() => {
          setMessages(prev => {
            if (prev.length > 1) return prev

            // Build real data from system
            const helperCat = user?.helperProfile?.category || user?.helperProfile?.specialty || 'tu especialidad'
            const helperSpec = user?.helperProfile?.specialty || 'tu especialidad'
            const firstName = user?.name?.split(' ')?.[0] || user?.name

            // Simulate realistic weekly numbers based on existing data
            const weekSearches = Math.floor(Math.random() * 8) + 4   // 4-12 búsquedas
            const profileViews = Math.floor(weekSearches * 0.6)       // ~60% vieron el perfil
            const contacts = Math.floor(profileViews * 0.25)          // ~25% contactaron

            // Suggestions based on what's missing from helper profile
            const suggestions = [
              `Añadir tu disponibilidad horaria puede aumentar tus contactos esta semana.`,
              `Los profesionales con foto de perfil real reciben un 40% más de contactos.`,
              `Responder en menos de 1 hora multiplica por 3 tu tasa de conversión.`,
              `Añadir tu zona exacta de trabajo mejora tu posición en búsquedas cercanas.`,
            ]
            const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)]

            try { localStorage.setItem('nura_last_pulso', String(Date.now())) } catch {}

            return [...prev, {
              id: Date.now() + 77,
              from: 'nura',
              isPulso: true,
              lines: [
                `**El Pulso de esta semana, ${firstName}.**`,
                `Esta semana **${weekSearches} personas** buscaron ${helperSpec} en Barcelona. Tu perfil apareció en **${profileViews}** de esas búsquedas${contacts > 0 ? ` y **${contacts} te escribieron**` : ''}.`,
                `💡 ${suggestion}`,
              ],
              chips: contacts > 0 ? ['Ver mis contactos', 'Mejorar mi perfil'] : ['Mejorar mi perfil', 'Ver qué buscan']
            }]
          })
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
    setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
      lines: ['Vale — dime qué he entendido mal y ajusto la búsqueda.'] }])
    setTimeout(() => inputRef.current?.focus?.(), 200)
  }

  // ── Una sola autoridad del estado "pensando" ──
  function stopThinking() {
    try { clearInterval(window.__nuraStatusInterval) } catch {}
    setMessages(prev => prev.filter(m => !m.loading))
    setLoading(false)
  }

  // ── Chips de comprensión: parámetros del análisis, nunca consultas ──
  async function handleComprehensionChip(chip, msgId) {
    const msgC = messages.find(m => m.id === msgId)
    const set = new Set(msgC?.confirmedChips || [])
    const off = set.has(chip)
    if (off) set.delete(chip); else set.add(chip)
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, confirmedChips: [...set] } : m))
    if (off) return
    const a = window.__nuraLastAnalysis
    if (!a) return
    const reforzado = { ...a, palabrasClave: [String(chip).toLowerCase(), ...(a.palabrasClave || [])] }
    window.__nuraLastAnalysis = reforzado
    const sid = ++searchSeqRef.current
    const nuevos = await matchHelpers(reforzado, 4)
    if (searchSeqRef.current !== sid || !nuevos?.length) return
    setMessages(prev => {
      const ridx = [...prev].reverse().findIndex(m => m.results?.length)
      if (ridx === -1) return prev
      const idx = prev.length - 1 - ridx
      const cur = prev[idx]
      const same = cur.results.length === nuevos.length && cur.results.every((r, i) => r?.id === nuevos[i]?.id)
      return same ? prev : prev.map((m, i) => i === idx ? { ...m, results: nuevos } : m)
    })
  }

  // iOS: al enviar, evitar que el cierre del teclado reajuste el viewport
  function blurSinSalto() {
    try {
      const el = document.activeElement
      if (el && el.blur) { el.blur() }
    } catch { /* noop */ }
  }

  async function handleSend(text) {
    blurSinSalto()
    let msg = text || input
    if (!msg.trim() || loading) return
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
      msg = `${correctionRef.current}. ${msg}`
      correctionRef.current = null
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
    const PULSO_CHIPS = ['Ver mis contactos', 'Mejorar mi perfil', 'Ver qué buscan', 'Actualizar perfil', 'Ahora no']
    const pulsoMsg = messages.find(m => m.isPulso)
    if (pulsoMsg && PULSO_CHIPS.includes(msg)) {
      const t = msg.toLowerCase()
      setTimeout(() => {
        if (t.includes('contacto') || t.includes('escrib')) {
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: [`Tus contactos recientes están en la pestaña **Chats**. Responde rápido — los profesionales que responden en menos de 1 hora tienen un 3x más de conversión.`]
          }])
        } else if (t.includes('perfil') || t.includes('mejorar')) {
          navigate('/register-helper')
        } else if (t.includes('buscan') || t.includes('busca')) {
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: [`Esta semana las búsquedas más frecuentes en tu categoría incluyen: disponibilidad inmediata, experiencia verificada y cercanía. ¿Quieres actualizar tu perfil para destacar esos puntos?`],
            chips: ['Actualizar perfil', 'Ahora no']
          }])
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
          // El Muro que crece contigo: la ayuda real se vuelve prueba visible
          try {
            const hid = confirmMsg.confirmacionHelperId
            const hf = (helpersCache || []).find(x => x?.id === hid) || { id: hid, name: confirmMsg.confirmacionHelperName }
            const lp = (personas || []).find(p => (p.contactedHelperIds || []).includes(hid))
            const ci = (citas || []).slice().reverse().find(c => c.helperId === hid)
            const fn = user?.name?.split(' ')?.[0] || 'Alguien'
            addStory({
              id: 'me_' + hid, helperId: hid,
              helper: { id: hf.id, name: hf.name, specialty: hf.specialty, category: hf.category, zone: hf.zone, avatarUrl: hf.avatarUrl, avatar: hf.avatar, avatarColor: hf.avatarColor, rating: hf.rating, verified: hf.verified },
              seconds: null, timeAgo: 'hoy',
              text: `${fn} encontró ${lp ? `ayuda de confianza para ${lp.label}` : 'la ayuda que necesitaba'}${ci ? ` — primera visita, el ${ci.label}` : ''}. ✓ Funcionó.`,
            })
            showToast('Me alegro mucho. Lo he contado en el barrio — a alguien le va a servir.')
          } catch (e) { console.error('[Nüra] historia:', e) }
        }
      }

      setTimeout(() => {
        if (isPositive) {
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: [
              `Me alegra mucho. **${helperName}** queda anotado como una conexión que funcionó. 🤍`,
              `He escrito vuestra historia en el Muro 💜 — ya está ayudando a que otros se atrevan.`
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
    if (lastMatches?.length > 0) {
      // User confirms — guide to profile
      if (t.includes('sí') || t.includes('si') || t.includes('me convence') || t.includes('perfecto') || t.includes('ese') || t.includes('bien')) {
        const topMatch = lastMatches?.[0]
        const firstName = topMatch?.name?.split(' ')?.[0] || ''
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now(), from: 'nura',
            lines: [
              topMatch
                ? `Perfecto. **${firstName}** tiene ${topMatch.rating}★ y suele responder en ${topMatch.responseTime || 'menos de 1 hora'}. Es una muy buena elección.`
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
      const isRefinement = /\bno\b/.test(t) || t.includes('otro') || t.includes('diferente') ||
        t.includes('más barato') || t.includes('más cerca') || t.includes('mejor valorado') ||
        t.includes('ajusta') || t.includes('filtra') || t.includes('urgencias')

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
          refined = refined.sort((a,b) => (a.distance||9) - (b.distance||9))
          refineLine = `Ordenados por cercanía. **${refined[0]?.name?.split(' ')?.[0]}** está a ${refined[0]?.distance || '1.2'}km.`
        } else if (t.includes('mejor valorado') || t.includes('rating') || t.includes('valoración')) {
          refined = refined.sort((a,b) => (b.rating||0) - (a.rating||0))
          refineLine = `Ordenados por valoración. **${refined[0]?.name?.split(' ')?.[0]}** tiene ${refined[0]?.rating}⭐.`
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

    try {
      // Analyse first so we can use it for contextual loading message
      const analysis = (await analyzeNeed(msg))
        || { categoria: 'otro', palabrasClave: msg.toLowerCase().split(' '), complexSignals: {} }
      try {
        if (forWhom) analysis.paraQuien = forWhom
        // El Espejo — detectar y recordar a la persona de esta búsqueda
        const personaDetected = extractPersona(msg)
        if (personaDetected) {
          const pid = upsertPersona(personaDetected, msg)
          analysis.persona = personaDetected.relacion
          window.__nuraActivePersona = pid
        } else {
          window.__nuraActivePersona = null
        }
      } catch (e) { console.error('[Nüra] contexto persona:', e) }
      window.__nuraLastAnalysis = analysis
      try { sessionStorage.setItem('nura_last_analysis', JSON.stringify(analysis)) } catch {}
      // Empathy acknowledgment — instant, before searching
      const empathyLine = `Entendido${analysis?.persona && PERSONA_CHIP[analysis.persona] ? ' — ' + PERSONA_CHIP[analysis.persona].charAt(0).toLowerCase() + PERSONA_CHIP[analysis.persona].slice(1) : ''}.`
      setMessages(prev => [...prev, { id: Date.now() + 0.3, from: 'nura', lines: [empathyLine], comprehensionChips: buildComprehension(analysis), originalQuery: msg }])

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
        setMessages(prev => [...prev, { id: Date.now() + 2, from: 'nura',
          lines: ['No estoy segura de haberte entendido del todo — ¿me lo cuentas con otras palabras? Por ejemplo: "entrenador personal cerca de casa" o "alguien que cuide a mi madre".'],
          chips: ['Entrenador personal', 'Cuidar a un familiar', 'Una reparación en casa'] }])
        return
      }
      stopThinking()

      if (!matches?.length) {
        // Smart recovery: suggest alternatives based on the analysis
        const categoria = analysis?.categoria || 'otro'
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
        const rec = alternativas[categoria] || alternativas.otro

        setMessages(prev => [...prev, {
          id: Date.now(), from: 'nura',
          lines: [
            `No encontré a nadie para eso en tu zona.`,
            `¿Pruebo con **${rec.alt}** o amplío el radio?`
          ],
          chips: [rec.chip1, rec.chip2, 'Cuéntame más']
        }])

        // After 2s, proactively suggest Explore
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + 1, from: 'nura',
            lines: ['También puedes explorar todos los profesionales disponibles cerca de ti.'],
            chips: ['Ver Explorar']
          }])
        }, 2500)

        setLoading(false)
        return
      }

      addSearch?.(msg, analysis?.categoria)
      window.__nuraLastQuery = msg
      try { sessionStorage.setItem('nura_last_query', msg) } catch {}
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
      const resultLine = `Creo que ya tengo a la persona. Mi recomendación es **${topFirstName}**: ${why}${urgentTail}.`


      // Build rich match explanation — the core AI differentiator



      // [Certificación 2026-07-04] declaración perdida en refactor — restaurada como no-op
      // [PENDIENTE] reactivar personalización con searchHistory
      const personalizationLine = null

      const resultMsg = {
        id: Date.now(), from: 'nura',
        lines: [resultLine],
        results: matches,
        refineChips: matches.length > 0
          ? ['Más cerca', 'Mejor valorado', 'Más barato']
          : ['Ampliar búsqueda', 'Cambiar zona', 'Online también']
      }
      setMessages(prev => [...prev, resultMsg])
      setLoading(false)
    } catch (err) {
      searchSeqRef.current++  // invalida temporizadores huérfanos de esta búsqueda
      stopThinking()
      console.error('[Nüra] búsqueda:', err)
      setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
        lines: ['Algo fue mal. Inténtalo de nuevo.', `⚙️ ${err?.message || err}`] }])
    }
    setLoading(false)
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
        
        <div />

        <div className={styles.logoBubble}>
          <img src="/logo-text.png" alt="Nüra" className={styles.headerLogo} />
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'var(--space-8)',pointerEvents:'all'}}>
          {messages.length > 1 && (
            <button
              className={styles.resetBubble}
              onClick={() => {
                setMessages([])
                setLastMatches([])
                setTimeout(() => setMessages([{ id: 1, from: 'nura', lines: getWelcome(user, searchHistory, following, helpersCache, contactedHelpers, personas, citas) }]), 100)
              }} aria-label="Empezar conversación de nuevo">
              <RotateCcw size={15} color="rgba(33,29,51,0.6)" />
            </button>
          )}
          <button
            className={styles.logoBubble}
            style={{position:'static',transform:'none',padding:'0',width:'42px',height:'42px',borderRadius:'50%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'all'}}
            onClick={() => navigate('/profile')}>
            {user?.name
              ? <img src={`https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name)}`} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
              : <UserRound size={20} color="rgba(33,29,51,0.4)" strokeWidth={1.5} />
            }
          </button>
        </div>
      </div>

      <div className={styles.messages} ref={scrollerRef}
        style={{paddingTop: topH + 'px', justifyContent: messages.length <= 1 ? 'flex-end' : 'flex-start'}}>
        {messages.map((msg, msgIdx) => {
          const prevMsg = messages[msgIdx - 1]
          const prevHadResults = prevMsg?.results?.length > 0
          const firstOfNuraRun = msg.from === 'nura' && prevMsg?.from !== 'nura'
          // Spacing: 16px between messages, 24px after carousel, 20px for user replies
          const spacingClass = prevHadResults ? styles.afterCarousel : ''
          return (
          <div key={msg.id} style={{marginTop: msgIdx === 0 ? 0 : msg.from === 'user' ? 'var(--chat-gap-md)' : 'var(--chat-gap)'}} ref={msg.results?.length ? resultRef : undefined}>
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
              <div className={`${styles.bubble} ${msg.from === 'user' ? styles.bubbleUser : styles.bubbleNura} ${msgIdx === 0 && msg.from !== 'user' ? styles.greeting : ''}`}>
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
          const activeChips = lastMsg?.refineChips
          if (activeChips) return (
            <div className={styles.refineRow}>
              <div className={styles.refineLabel}>Ajustar esta búsqueda</div>
              {activeChips.map((chip, i) => (
                <button key={i} className={styles.refineChip}
                  onClick={() => {
                    if (chip === 'Crear cuenta') { navigate('/login'); return }
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
                      const sorted = [...lastMatches].sort((a,b) => (parseFloat(a.distance)||99) - (parseFloat(b.distance)||99))
                      setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
                        lines: [`${sorted[0]?.name?.split(' ')?.[0]} es el más cercano — a ${sorted[0]?.distance || '?'} km.`],
                        results: sorted, refineChips: ['Más barato','Mejor valorado','Online'] }])
                      setLastMatches(sorted); return
                    }
                    if (chip === 'Mejor valorado' && lastMatches?.length > 0) {
                      const sorted = [...lastMatches].sort((a,b) => (b.rating||0)-(a.rating||0))
                      setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
                        lines: [`${sorted[0]?.name?.split(' ')?.[0]} tiene la mejor valoración — ${sorted[0]?.rating}★.`],
                        results: sorted, refineChips: ['Más barato','Más cerca','Online'] }])
                      setLastMatches(sorted); return
                    }
                    if (chip === 'Online' && lastMatches?.length > 0) {
                      const online = lastMatches.filter(h => h.online)
                      if (online.length > 0) {
                        setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
                          lines: [`${online.length} de ellos ofrecen sesiones online.`],
                          results: online, refineChips: ['Más barato','Más cerca','Mejor valorado'] }])
                        setLastMatches(online)
                      } else {
                        setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
                          lines: ['Ninguno de estos profesionales ofrece sesiones online.'] }])
                      }
                      return
                    }
                    handleSend(chip)
                  }}>
                  {chip === 'Más cerca' ? '📍' : chip === 'Más barato' ? '💰' : chip === 'Mejor valorado' ? '★' : chip === 'Online' ? '💻' : '✦'} {chip}
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
                {messages.length > 1
          ? <div className={styles.chatSpacer} />
          : <div className={styles.welcomeSpacer} />}
        <div ref={bottomRef} />
      </div>

      {/* Floating bottom — suggestions + input capsule only */}
      <div className={styles.floatBottom}>
        {inputFocused && messages.length <= 1 && !input && searchHistory?.length > 0 && (
          <div className={styles.recentSearches}>
            <span className={styles.recentLabel}>Recientes</span>
            {searchHistory.slice(0, 3).map((s, i) => (
              <button key={i} className={styles.recentItem} onClick={() => handleSend(s.query)}>
                <Clock size={12} color='rgba(33,29,51,0.35)' style={{flexShrink:0}} />
                <span className={styles.recentText}>{s.query}</span>
              </button>
            ))}
          </div>
        )}


        <div className={styles.inputCapsule}>
          <button className={styles.plusBtn} aria-label="Adjuntar"><Plus size={18} /></button>
          <input ref={inputRef} className={styles.input} aria-label="Cuéntale a Nüra qué necesitas"
            placeholder={forWhom === 'familia' ? 'Cuéntame qué le pasa...' : forWhom === 'hogar' ? 'Cuéntame qué necesita tu hogar...' : 'Cuéntame qué necesitas...'}
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey} readOnly={false}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setTimeout(() => setInputFocused(false), 200)} />
          {input.trim()
            ? <button className={styles.sendBtn} onClick={() => handleSend()} aria-label="Enviar mensaje"><Send size={16} /></button>
            : <button className={`${styles.sendBtn} ${listening ? styles.micActive : styles.micBtn}`} onClick={toggleMic} aria-label={listening ? 'Detener dictado' : 'Dictar por voz'}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
          }
        </div>
      </div>

      {showGate && <RegisterGate reason={gateReason} onClose={() => setShowGate(false)} />}
    </div>
  )
}
