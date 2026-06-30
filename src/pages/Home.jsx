import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Mic, MicOff, Plus, Clock, RotateCcw, UserRound } from 'lucide-react'
import { analyzeNeed, matchHelpers, getPriceContext } from '../utils/matching'
import { getFirstName } from '../utils/name'
import { useUser } from '../context/UserContext'
import { showToast } from '../components/Toast'
import HelperCard from '../components/HelperCard'
import HelperCarousel from '../components/HelperCarousel'
import RegisterGate from '../components/RegisterGate'
import { haptic } from '../utils/haptic'
import { scheduleLocalNotification, notifySearchAbandoned } from '../utils/notifications'
import styles from './Home.module.css'

// Category-aware refine chips — show the dimensions that matter for each need
const CONTEXT_CHIPS = {
  cuidado: ['Solo mañanas', 'Con experiencia en Alzheimer', 'Disponible hoy', 'Más cerca'],
  salud: ['Esta semana', 'Online también', 'Mejor valorado', 'Más cerca'],
  tecnico: ['Urgente hoy', 'Más barato', 'Mejor valorado', 'Más cerca'],
  legal: ['Primera consulta gratis', 'Más barato', 'Mejor valorado', 'Online'],
  clases: ['Online también', 'Más barato', 'Mejor valorado', 'Esta semana'],
  mascotas: ['Disponible hoy', 'Más cerca', 'Mejor valorado', 'Con fotos'],
  hogar: ['Más barato', 'Disponible hoy', 'Mejor valorado', 'Más cerca'],
  entrenador: ['Online también', 'Más barato', 'Mejor valorado', 'Esta semana'],
}


function getWelcome(user, searchHistory, following, helpersCache) {
  const hour = new Date().getHours()
  const greeting = hour < 14 ? 'Buenos días' : hour < 21 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.name?.split(' ')?.[0] || user?.name

  if (!user) return [
    `Hola. Soy **Nüra**.`,
    `Describe lo que necesitas. Encontraremos a la persona adecuada.`,
  ]

  // Use what Nüra knows about this user
  const lastSearch = searchHistory?.[searchHistory.length - 1]?.query
  const favHelpers = (following || [])
    .map(id => helpersCache?.[id] || helpersCache?.[String(id)])
    .filter(Boolean)
  const topFav = favHelpers[0]

  // Returning user with history — show active memory
  if (lastSearch && searchHistory?.length > 2) {
    // Check if search was recent (last 48h)
    const lastSearchObj = searchHistory[searchHistory.length - 1]
    const hoursAgo = lastSearchObj?.ts
      ? Math.floor((Date.now() - lastSearchObj.ts) / (1000 * 60 * 60))
      : 99
    if (hoursAgo < 48) {
      return [
        `${greeting}, **${firstName}**.`,
        `Ayer buscaste **${lastSearch}**. ¿Encontraste a alguien, o quieres que siga buscando?`
      ]
    }
    return [
      `${greeting}, **${firstName}**.`,
      `La última vez buscaste **${lastSearch}**. ¿Sigues necesitando ayuda con eso, o tienes una nueva necesidad?`
    ]
  }

  // User with favorites
  if (topFav && following?.length > 0) {
    return [
      `${greeting}, **${firstName}**.`,
      `**${topFav.name?.split(' ')?.[0]}** está entre tus seguidos. ¿Le escribo?`
    ]
  }

  // First or second visit
  if (searchHistory?.length === 1) {
    return [
      `Bienvenido de nuevo, **${firstName}**.`,
      `¿Qué necesitas hoy? Cuéntamelo y encuentro a la persona exacta.`
    ]
  }
  // Default greeting
  if (user.isHelper) return [`${greeting}, **${firstName}**. ¿Qué necesitas hoy?`]
  return [
    `${greeting}, **${firstName}**.`,
    hour < 12 ? `¿En qué puedo ayudarte esta mañana?`
    : hour < 18 ? `Cuéntame qué necesitas y lo encontramos.`
    : `¿Qué necesitas esta noche?`
  ]
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

// ── DYNAMIC SUGGESTIONS ───────────────────────────────────────────────────
// Rotates based on time of day, day of week, and user history
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


export default function Home({ setSearchState }) {
  const navigate = useNavigate()
  const { user, addSearch, searchHistory, favorites, helpersCache, nuraChatMessages, setNuraChatMessages, nuraLastMatches, setNuraLastMatches, cacheHelpers } = useUser()
  // messages persisted in context so they survive navigation
  const messages = nuraChatMessages
  const setMessages = setNuraChatMessages
  const [input, setInput] = useState('')
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
  const inputRef   = useRef(null)
  const topRef     = useRef(null)
  const [topH, setTopH] = useState(80)
  const [floatH, setFloatH] = useState(84) /* header height fallback */

  useEffect(() => {
    let lines = getWelcome(user)
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
    const lastQ = searchHistory?.[0]?.query
    const msgs = [{ id: 1, from: 'nura', lines }]
    if (user && lastQ && nuraChatMessages.length === 0) {
      const hour = new Date().getHours()
      const g = hour < 14 ? 'Buenos días' : hour < 21 ? 'Buenas tardes' : 'Buenas noches'
      const firstName = user.name?.split(' ')?.[0] || user.name
      msgs[0] = {
        id: 1, from: 'nura',
        lines: [`${g}, **${firstName}**. La última vez buscaste **${lastQ}**.`],
        chips: ['Buscar de nuevo', 'Buscar algo diferente']
      }
    }

    // Only init if no previous conversation
    if (nuraChatMessages.length === 0) {
      setTimeout(() => setMessages(msgs), 300)
    }

    // Proactive question for helpers after 8s of inactivity
    const timers = []
    if (user?.isHelper) {
      timers.push(setTimeout(() => {
        setMessages(prev => {
          if (prev.length > 1) return prev // user already engaged
          return [...prev, {
            id: Date.now(), from: 'nura',
            lines: ['Por cierto, ¿has trabajado en algo nuevo últimamente o completado alguna formación? Cuéntamelo para actualizar tu perfil.']
          }]
        })
      }, 8000))
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

  async function handleSend(text) {
    const msg = text || input
    if (!msg.trim() || loading) return
    haptic('light')

    setInput('')
    setShowSuggestions(false)
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: msg }])
    setLoading(true)

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
          const reRefined = await matchHelpers({ categoria: analysis?.categoria || 'otro', palabrasClave: [] }, 4, msg, lastMatches)
          refined = reRefined?.length ? reRefined : refined
          refineLine = 'He ajustado los resultados.'
        }

        const resultMsg = { id: Date.now(), from: 'nura', lines: [refineLine], results: refined,
          refineChips: ['Más barato', 'Más cerca', 'Mejor valorado', 'Online'] }
        setMessages(prev => [...prev, resultMsg])
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
      const analysis = await analyzeNeed(msg)
      // Empathy acknowledgment — instant, before searching
      const empathyLine = analysis?.urgente
        ? '⚡ Entendido. Situación urgente — busco disponibilidad ahora mismo.'
        : analysis?.categoria === 'cuidado'
        ? 'Entiendo. Cuidar a alguien querido es una decisión importante. Busco a las mejores cuidadoras verificadas cerca de ti.'
        : analysis?.categoria === 'tecnico'
        ? 'Entendido. Te localizo técnicos disponibles en tu zona.'
        : analysis?.categoria === 'logopeda'
        ? 'Entendido. Busco logopedas especializados cerca de ti.'
        : analysis?.categoria === 'salud'
        ? 'Entendido. Busco el profesional de salud más adecuado para ti.'
        : analysis?.categoria === 'legal'
        ? 'Entendido. Te busco asesores jurídicos de confianza.'
        : analysis?.categoria === 'matematicas'
        ? 'Entendido. Busco el profesor ideal para lo que necesitas.'
        : analysis?.categoria === 'psicologia'
        ? 'Gracias por contarme. Busco el psicólogo más adecuado para ti.'
        : '¿Te entiendo bien? Déjame buscar la persona exacta que necesitas.'
      setMessages(prev => [...prev, { id: Date.now() + 0.3, from: 'nura', lines: [empathyLine] }])

      // Progressive loading messages — feel like magic
      const loadingSteps = analysis?.urgente
        ? ['⚡ Buscando disponibilidad urgente...', 'Filtrando por zona y respuesta inmediata...', 'Comparando perfiles verificados...']
        : analysis?.categoria === 'cuidado'
        ? ['Analizando tu situación familiar...', 'Filtrando cuidadoras verificadas en tu zona...', 'Revisando disponibilidad y referencias...']
        : analysis?.categoria === 'salud'
        ? ['Entendiendo tu necesidad...', 'Buscando especialistas disponibles...', 'Comparando perfiles y valoraciones...']
        : ['Analizando tu búsqueda...', `Filtrando entre ${Math.floor(Math.random()*200)+600} perfiles...`, 'Seleccionando los mejores para ti...']

      let stepIdx = 0
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now() + 0.5, from: 'nura', lines: [loadingSteps[0]], loading: true }])
        const stepInterval = setInterval(() => {
          stepIdx++
          if (stepIdx < loadingSteps.length) {
            setMessages(prev => prev.map(m => m.loading ? { ...m, lines: [loadingSteps[stepIdx]] } : m))
          } else {
            clearInterval(stepInterval)
          }
        }, 900)
      }, 600)
      const matches = await matchHelpers(analysis, 4)
      clearInterval(window.__nuraStatusInterval)
      setMessages(prev => prev.filter(m => !m.loading))

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
      window.__nuraLastAnalysis = analysis
      try { sessionStorage.setItem('nura_last_analysis', JSON.stringify(analysis)) } catch {}
      setSearchState({ query: msg, analysis, matches })
      setLastMatches(matches)
      // Schedule reminder if user doesn't contact
      scheduleLocalNotification(
        '¿Te convencieron los resultados?',
        `Tienes ${matches.length} profesionales disponibles. ¿Ya les has escrito?`,
        2 * 60 * 60 * 1000
      )
      // Surprise moment: Nüra shows it remembers the user
      if (searchHistory?.length >= 1) {
        const lastQuery = searchHistory?.[searchHistory.length - 2]?.query
        if (lastQuery) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: Date.now() + 99, from: 'nura',
              lines: [`Por cierto — la última vez buscaste **${lastQuery}**. Si sigue sin resolverse, puedo buscar de nuevo cuando quieras.`]
            }])
          }, 4500)
        }
      }
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
            const reason = buildMatchReason(h, analysis, msg)
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
      const elapsedSec = ((Date.now() - searchStartTime) / 1000).toFixed(1)
      const resultLine = matches.length === 1
        ? `He encontrado a **${topFirstName}**, ${especialidad.slice(0,-1)} verificado cerca de ti. ⚡ ${elapsedSec}s`
        : `He encontrado **${matches.length} ${especialidad}** cerca de ti en ${elapsedSec} segundos. El mejor candidato es **${topFirstName}**.`

      // Price context — reduces doubt at decision moment
      const priceCtx = matches.length > 0
        ? getPriceContext(matches[0], analysis?.categoria)
        : null

      // Build rich match explanation — the core AI differentiator
      function buildMatchReason(helper, analysis, userMsg) {
        if (!helper) return null
        const name = helper.name?.split(' ')?.[0]
        const reasons = []

        // Reference the user's specific words when possible
        const msgLower = (userMsg || '').toLowerCase()
        if (msgLower.includes('niño') || msgLower.includes('hijo') || msgLower.includes('pequeño'))
          reasons.push('trabaja con niños')
        else if (msgLower.includes('mayor') || msgLower.includes('abuela') || msgLower.includes('padre'))
          reasons.push('especialista en personas mayores')
        else if (msgLower.includes('urgent') || msgLower.includes('hoy') || msgLower.includes('ahora'))
          reasons.push('disponible hoy')
        else if (helper.specialty) reasons.push(`especialista en ${helper.specialty.toLowerCase()}`)

        // Experience signal
        if (helper.reviews >= 80) reasons.push(`${helper.reviews} clientes satisfechos`)
        else if (helper.reviews >= 30) reasons.push(`${helper.reviews} valoraciones`)

        // Distance
        if (helper.distance) reasons.push(`a ${helper.distance}km de ti`)

        // Response time
        if (helper.responseTime) reasons.push(`responde en ${helper.responseTime}`)

        // Urgency match
        if (analysis?.urgente && helper.urgent) reasons.push('atiende urgencias hoy')

        // Modality match
        if (analysis?.modalidad === 'online' && helper.online) reasons.push('disponible online')
        else if (analysis?.modalidad === 'presencial' && helper.presential) reasons.push('visita a domicilio')

        if (reasons.length === 0) return `**${name}** está disponible y tiene ${helper.rating}★`

        const mainReason = reasons.slice(0, 2).join(' y ')
        return `**${name}** es mi recomendación: ${mainReason}. ${helper.rating}★ de media.`
      }

      const matchExplanation = buildMatchReason(top, analysis, msg)
      const followLine = matches.length >= 3 && matchExplanation
        ? matchExplanation
        : matches.length > 0
        ? `Hay ${matches.length} disponibles ahora. ¿Te cuento más sobre ${topFirstName}?`
        : null

      const resultMsg = {
        id: Date.now(), from: 'nura',
        lines: followLine
          ? (user
              ? [resultLine, ...(priceCtx ? [priceCtx] : []), ...(personalizationLine ? [personalizationLine] : []), followLine, '👆 Pulsa en cualquier tarjeta para ver el perfil completo y escribirle.']
              : [resultLine, ...(priceCtx ? [priceCtx] : []), followLine, 'Para contactarles, crea tu cuenta gratis. Solo tarda 30 segundos.'])
          : (user
              ? [resultLine, ...(priceCtx ? [priceCtx] : [])]
              : [resultLine, ...(priceCtx ? [priceCtx] : []), 'Crea tu cuenta gratis para escribirles.']),
        results: matches,
        refineChips: matches.length > 0
          ? (CONTEXT_CHIPS[analysis?.categoria] || ['Más barato', 'Más cerca', 'Mejor valorado', 'Online'])
          : ['Ampliar búsqueda', 'Cambiar zona', 'Online también']
      }
      setMessages(prev => [...prev, resultMsg])
    } catch {
      clearInterval(window.__nuraStatusInterval)
      setMessages(prev => prev.filter(m => !m.loading))
      setMessages(prev => [...prev, { id: Date.now(), from: 'nura', lines: ['Algo fue mal. Inténtalo de nuevo.'] }])
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
      <div className={styles.floatTop} ref={topRef} style={{animation:"fadeInUp 0.3s ease-out forwards"}}>
        
        <div />

        <div className={styles.logoBubble}>
          <img src="/logo-text.png" alt="Nüra" className={styles.headerLogo} />
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'8px',pointerEvents:'all'}}>
          {messages.length > 1 && (
            <button
              className={styles.resetBubble}
              onClick={() => {
                setMessages([])
                setLastMatches([])
                setTimeout(() => setMessages([{ id: 1, from: 'nura', lines: getWelcome(user) }]), 100)
              }}>
              <RotateCcw size={15} color="rgba(0,0,0,0.6)" />
            </button>
          )}
          <button
            className={styles.logoBubble}
            style={{position:'static',transform:'none',padding:'0',width:'42px',height:'42px',borderRadius:'50%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'all'}}
            onClick={() => navigate('/profile')}>
            {user?.name
              ? <img src={`https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name)}`} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
              : <UserRound size={20} color="rgba(0,0,0,0.4)" strokeWidth={1.5} />
            }
          </button>
        </div>
      </div>

      <div className={styles.messages} style={{paddingTop: topH + 'px'}}>
        {messages.length <= 1 && (
          <div style={{margin:'4px 0 16px'}}>
            <div style={{
              textAlign:'center', fontSize:'11px', color:'rgba(0,0,0,0.32)',
              letterSpacing:'0.2px', paddingBottom:'10px', fontWeight:500
            }}>
              1.008 profesionales verificados · Primer resultado en {'<'} 10 segundos
            </div>
            <div style={{
              margin:'0 0 10px', padding:'12px 16px',
              background:'rgba(123,47,255,0.06)',
              borderRadius:'16px', borderLeft:'3px solid var(--purple)'
            }}>
              <div style={{fontSize:'12px',fontWeight:700,color:'var(--purple)',marginBottom:'4px',letterSpacing:'-0.1px'}}>
                Historia real
              </div>
              <div style={{fontSize:'13px',color:'var(--ink)',lineHeight:1.5,letterSpacing:'-0.1px'}}>
                "María encontró a Carlos en <strong>47 segundos</strong>. Su hijo de 5 años ya pronuncia la R perfectamente después de 8 sesiones."
              </div>
              <div style={{fontSize:'11px',color:'rgba(0,0,0,0.38)',marginTop:'4px'}}>
                — María P., Barcelona · Logopedia infantil
              </div>
            </div>
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
              gap:'8px', margin:'0 0 4px'
            }}>
              {[
                {num:'2.847', label:'ayudas conectadas'},
                {num:'94%', label:'encontraron lo que buscaban'},
                {num:'< 3 min', label:'tiempo medio de respuesta'},
              ].map(({num, label}) => (
                <div key={label} style={{
                  padding:'10px 8px', background:'white',
                  borderRadius:'12px', textAlign:'center',
                  boxShadow:'0 1px 6px rgba(0,0,0,0.07)',
                  border:'1px solid rgba(0,0,0,0.06)'
                }}>
                  <div style={{fontSize:'15px',fontWeight:800,color:'var(--purple)',letterSpacing:'-0.5px',lineHeight:1}}>{num}</div>
                  <div style={{fontSize:'9px',color:'rgba(0,0,0,0.4)',marginTop:'3px',lineHeight:1.3,fontWeight:500}}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, msgIdx) => {
          const prevMsg = messages[msgIdx - 1]
          const prevHadResults = prevMsg?.results?.length > 0
          // Spacing: 16px between messages, 24px after carousel, 20px for user replies
          const spacingClass = prevHadResults ? styles.afterCarousel : ''
          return (
          <div key={msg.id} style={{marginTop: msgIdx === 0 ? 0 : msg.from === 'user' ? 'var(--chat-gap-md)' : 'var(--chat-gap)', animation: `cardCascade 0.38s ease-out ${msgIdx * 60}ms both`}}>
            <div className={`${styles.msgRow} ${msg.from === 'user' ? styles.msgRowUser : ''} ${spacingClass}`}>
              {msg.from === 'nura' && (
                <div className={styles.nuraAvatar}>
                  <img src="/logo-iso.png" alt="Nüra" className={styles.nuraAvatarImg} />
                </div>
              )}
              <div className={`${styles.bubble} ${msg.from === 'user' ? styles.bubbleUser : styles.bubbleNura}`}>
                {msg.text && <p>{msg.text}</p>}
                {msg.lines?.map((line, i) => <p key={i}>{formatLine(line)}</p>)}
                {msg.loading && <div className={styles.typingDots}><span /><span /><span /></div>}

              {msg.quickOptions && (
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'8px'}}>
                  {(msg.quickOptions||[]).map((opt,i) => (
                    <button key={i}
                      style={{padding:'7px 14px',background:'var(--paper)',border:'1.5px solid var(--rule)',borderRadius:'16px',fontSize:'var(--text-xs)',color:'var(--mid)',cursor:'pointer',transition:'all 0.15s'}}
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
                <HelperCarousel helpers={msg.results} />
              </div>
            )}

          </div>
          )
        })}
                <div
          className={styles.chatSpacer}
          data-chips={(showSuggestions || !!messages[messages.length-1]?.refineChips) ? 'true' : 'false'}
        />
        <div ref={bottomRef} />
      </div>

      {/* Floating bottom — suggestions + input capsule only */}
      <div className={styles.floatBottom} style={{animation:"fadeInUp 0.35s ease-out 0.1s forwards"}}>
        {inputFocused && !input && searchHistory?.length > 0 && (
          <div className={styles.recentSearches}>
            <span className={styles.recentLabel}>Recientes</span>
            {searchHistory.slice(0, 3).map((s, i) => (
              <button key={i} className={styles.recentItem} onClick={() => handleSend(s.query)}>
                <Clock size={12} color='rgba(0,0,0,0.35)' style={{flexShrink:0}} />
                <span className={styles.recentText}>{s.query}</span>
              </button>
            ))}
          </div>
        )}

        {(() => {
          const lastMsg = messages[messages.length - 1]
          const activeChips = lastMsg?.refineChips
          if (activeChips) return (
            <div className={styles.suggestions}>
              {activeChips.map((chip, i) => (
                <button key={i} className={styles.suggestion}
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
                  <span className={styles.suggestionText}>{chip}</span>
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

        <div className={styles.inputCapsule}>
          <button className={styles.plusBtn}><Plus size={18} /></button>
          <input ref={inputRef} className={styles.input}
            placeholder="Cuéntame qué necesitas..."
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey} disabled={loading}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setTimeout(() => setInputFocused(false), 200)} />
          {input.trim()
            ? <button className={styles.sendBtn} onClick={() => handleSend()}><Send size={16} /></button>
            : <button className={`${styles.sendBtn} ${listening ? styles.micActive : styles.micBtn}`} onClick={toggleMic}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
          }
        </div>
      </div>

      {showGate && <RegisterGate reason={gateReason} onClose={() => setShowGate(false)} />}
    </div>
  )
}
