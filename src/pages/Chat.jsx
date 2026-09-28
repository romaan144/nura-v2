import glass from '../components/ui/glass'
import ErrorPanel from '../components/ErrorPanel'
import errorStyles from '../components/ErrorPanel.module.css'
import PageHeader from '../components/PageHeader'
import { getFirstName } from '../utils/name'
import { useTitulo } from '../utils/titulo'
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Send, Mic, MicOff } from 'lucide-react'
import { HELPERS_DEMO as HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import CitaModal from '../components/CitaModal'
import { getHelperById } from '../utils/supabase'
import { registrarConversacion, respuestasDe, enviarPropuestaCita, enviarAlProfesional, idsPendientes } from '../utils/escrituras'
import { avisarCuandoConteste, movilPuedeAvisar, esIphoneSinInstalar } from '../utils/alertas'
import { marcarVistas } from '../utils/respuestasNuevas'
import { notifyServiceConfirmed } from '../utils/notifications'
import { haptic } from '../utils/haptic'
import RatingModal from '../components/RatingModal'
import styles from './Chat.module.css'
import PageLoading from '../components/PageLoading'
import { generateFirstMessage, getHelperReply, getNuraIntervention, buildLivingConversation } from '../utils/chatReplies'
import { buildChatOpener } from '../utils/introLetter'
import { DEMO_MODE } from '../config'
import { SectionLabel } from '../components/ui'
import RegisterGate from '../components/RegisterGate'
import { registrar } from '../utils/analitica'
import { construirAviso } from '../utils/aviso'

// ── Context-aware first message ───────────────────────────────────────────

// ── Smart replies based on conversation stage ─────────────────────────────

// ── Nüra intervention — context-aware, detects booking moments ────────────

function formatTime(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}
function formatDateLabel(dateStr) {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(date.getTime())) return ''
  if (date.toDateString() === new Date().toDateString()) return 'Hoy'
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1)
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer'
  return date.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })
}


// ── Extract date/time from conversation ──────────────────────────────────
function extractDateFromMessages(messages) {
  const text = (messages || [])
    .map(m => (m.text || m.lines?.join(' ') || '').toLowerCase())
    .join(' ')

  let extractedDate = ''
  let extractedTime = ''

  // Extract time: "a las 10", "10h", "10:00", "las 9"
  const timeMatch = text.match(/(?:a las |las )?(\d{1,2})(?::00)?(?:h|:00)?\ ?(?:de la (?:mañana|tarde))?/)
  if (timeMatch) {
    const h = parseInt(timeMatch[1])
    if (h >= 7 && h <= 22) {
      extractedTime = `${h}:00`
    }
  }

  // Extract day of week → map to next occurrence
  const today = new Date()
  const days = { lunes:1, martes:2, miércoles:3, jueves:4, viernes:5, sábado:6, domingo:0 }
  for (const [dayName, dayNum] of Object.entries(days)) {
    if (text.includes(dayName)) {
      const d = new Date()
      const diff = (dayNum - d.getDay() + 7) % 7 || 7
      d.setDate(d.getDate() + diff)
      extractedDate = d.toISOString().split('T')[0]
      break
    }
  }

  // "mañana"
  if (!extractedDate && text.includes('mañana')) {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    extractedDate = d.toISOString().split('T')[0]
  }

  // "hoy"
  if (!extractedDate && text.includes('hoy')) {
    extractedDate = new Date().toISOString().split('T')[0]
  }

  // "esta semana" or "próxima" → default to next available weekday
  if (!extractedDate && (text.includes('esta semana') || text.includes('próxima semana'))) {
    const d = new Date()
    d.setDate(d.getDate() + (d.getDay() === 5 ? 3 : d.getDay() === 6 ? 2 : 1))
    extractedDate = d.toISOString().split('T')[0]
  }

  return { extractedDate, extractedTime }
}

// ── Confirm Service Modal ─────────────────────────────────────────────────
function ConfirmModal({ helper, onClose, onConfirm, prefillDate, prefillTime }) {
  const navigate = useNavigate()
  // El día y la hora se eligen con ElegirCita, la misma pieza que en la
  // ficha: antes había dos hojas de reserva con dos lógicas distintas.
  const [date, setDate] = useState(prefillDate || '')
  const [time, setTime] = useState(prefillTime || '')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const name = getFirstName(helper.name) || helper.name

  return (
    <CitaModal helper={helper} date={date} time={time} note={note}
      onDate={setDate} onTime={setTime} onNote={setNote} onClose={onClose}
      done={done} title="Solicitar servicio"
      notice={prefillDate ? 'Fecha detectada en la conversación' : ''}
      onConfirm={() => { onConfirm?.(date, time, note); setDone(true); notifyServiceConfirmed(getFirstName(helper.name) || helper.name); haptic('success') }}
      successText={DEMO_MODE ? `${name} confirmará disponibilidad en breve.` : `Se la hago llegar a ${name}. Su respuesta te llegará en este chat.`}
      onServices={() => { onClose(); navigate('/my-services') }}
      backLabel="Volver al chat" />
  )
}

// ── Main Chat ─────────────────────────────────────────────────────────────
const AVISAME = 'Avísame cuando conteste'

export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { addChat, markRead, hasRated, helpersCache, addService,
    services, getChatHistory, saveChatHistory, user
 , personas, addCita } = useUser()
  const [showRegGate, setShowRegGate] = useState(false)

  const [helper, setHelper] = useState(
    helpersCache?.[parseInt(id)] || helpersCache?.[id] || helpersCache?.[String(id)] ||
    HELPERS.filter(Boolean).find(h => String(h.id) === String(id)) || null
  )
  // (Aqui se limpiaba `nura_pending_chat`, que nadie escribia ni leia ya.
  //  Ademas corria en el CUERPO del componente: efecto durante el render.)

  // Sin esto el logo latia PARA SIEMPRE: si la busqueda remota no devolvia
  // a nadie (o fallaba), nada apagaba la espera. `/chat/9999` era una
  // pantalla de 0 caracteres, sin cabecera ni salida, prometiendo algo que
  // no iba a llegar. Un callejon sin puerta es peor que un error.
  const [buscando, setBuscando] = useState(!helper)
  const [sinRed, setSinRed]     = useState(false)
  // Los mensajes que aún no han salido (sin conexión): se marcan en el chat.
  const [pendientes, setPendientes] = useState(idsPendientes)
  useEffect(() => {
    const ver = () => setPendientes(idsPendientes())
    window.addEventListener('nura:pendientes', ver)
    return () => window.removeEventListener('nura:pendientes', ver)
  }, [])
  const [intento, setIntento]   = useState(0)
  useTitulo(helper?.name ? `Chat con ${getFirstName(helper.name)}` : null)
  useEffect(() => {
    if (helper) return
    let vivo = true
    getHelperById(id)
      .then(h => { if (!vivo) return; if (h) setHelper(h); setSinRed(false); setBuscando(false) })
      .catch(() => { if (vivo) { setSinRed(true); setBuscando(false) } })
    return () => { vivo = false }
  }, [id, intento])   // eslint-disable-line react-hooks/exhaustive-deps

  const [messages, setMessages] = useState(() => {
    const real = getChatHistory(id)
    if (real?.length > 0) return real
    const demo = location.state?.demoHistory
    if (demo?.length > 0) return demo
    // Demo mode: helper sends a welcome message to feel real
    return []
  })

  // Add welcome message from helper if chat is empty (only when there's no intro letter pending)
  // LA VUELTA, ultimo tramo. Al abrir el chat se pregunta si el profesional
  // ya ha respondido desde su enlace. Si lo hizo, su mensaje entra aqui como
  // uno mas: para la persona que espera, es simplemente que le contestaron.
  //
  // Se marca con `__deAviso` para no duplicarlo al volver a entrar.
  // Y MIENTRAS el chat esta abierto: antes solo se preguntaba al entrar, y
  // quien esperaba con la pantalla abierta no veia llegar la respuesta hasta
  // salir y volver. Cada 30 s con la pantalla visible, y al volver a ella.
  useEffect(() => {
    if (!helper?.id) return
    let vivo = true
    const mirar = () => respuestasDe(helper.id).then(rs => {
      if (!vivo || !rs.length) return
      marcarVistas(rs.map(r => r.llave))   // las esta viendo: ya no son «nuevas»
      setMessages(prev => {
        const yaEstan = new Set(prev.filter(m => m.__deAviso).map(m => m.text))
        const nuevas = rs
          .filter(r => r.respuesta && !yaEstan.has(r.respuesta))
          .map(r => ({ id: 'av-' + r.respondido_en, from: 'helper', text: r.respuesta,
            time: r.respondido_en, __deAviso: true }))
        return nuevas.length ? [...prev, ...nuevas] : prev
      })
    })
    mirar()
    const cada = setInterval(() => { if (document.visibilityState === 'visible') mirar() }, 30000)
    const alVolver = () => { if (document.visibilityState === 'visible') mirar() }
    document.addEventListener('visibilitychange', alVolver)
    return () => { vivo = false; clearInterval(cada); document.removeEventListener('visibilitychange', alVolver) }
  }, [helper?.id])

  // El saludo automatico del profesional, SOLO en la demo. Fuera de ella era
  // poner en su boca un mensaje que nunca escribio («Hola, soy Carlos…»)
  // a alguien que aun no sabe que le han escrito.
  useEffect(() => {
    if (DEMO_MODE && messages.length === 0 && helper && !location.state?.introLetterText) {
      const firstName = getFirstName(helper.name) || helper.name
      const welcomeMsg = {
        id: 'welcome',
        from: 'helper',
        text: `Hola, soy ${firstName}. Vi que me encontraste a través de Nüra. ¿En qué puedo ayudarte?`,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      }
      setTimeout(() => setMessages(prev => prev.length ? prev : [welcomeMsg]), 800)
    }
  }, [helper])
  const hasHistory = (getChatHistory(id)?.length > 0) || (location.state?.demoHistory?.length > 0)
  const userQuery = location.state?.userQuery || window.__nuraLastQuery
  const fromSearch = !!userQuery && !hasHistory

  // Pre-fill input with contextual message when coming from search
  const [input, setInput] = useState(() =>
    (!!location.state?.userQuery || !!window.__nuraLastQuery) && !hasHistory && !location.state?.introLetterText
      ? buildChatOpener({
          helper: helpersCache?.[parseInt(id)] || helpersCache?.[id] ||
            HELPERS.filter(Boolean).find(h => String(h.id) === String(id)),
          analysis: location.state?.analysis || window.__nuraLastAnalysis,
          userQuery: location.state?.userQuery || window.__nuraLastQuery,
        })
      : ''
  )
  const [suggested, setSuggested] = useState('')
  const [typing, setTyping] = useState(false)

  // ── La Conversación Viva: aceptar o mover la propuesta del profesional ──
  function answerProposal(msgId, accepted, label) {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, proposalAnswered: true } : m))
    const userText = accepted ? `Sí, ${label} me va bien` : '¿Podemos buscar otro momento?'
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: userText, time: new Date().toISOString() }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      const replyText = accepted
        ? `¡Perfecto! ${label.charAt(0).toUpperCase() + label.slice(1)} entonces. Te escribo el día antes para confirmar los detalles. Cualquier cosa mientras tanto, aquí estoy.`
        : '¡Claro, sin problema! Dime qué día y franja te encajan mejor y me adapto.'
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'helper', text: replyText, time: new Date().toISOString() }])
      if (accepted) {
        // La Cita — el acuerdo se convierte en un objeto vivo
        try {
          const lp = (personas || []).find(p => (p.contactedHelperIds || []).includes(helper?.id))
          registrar('servicio_confirmado', { helperId: String(helper?.id), categoria: helper?.category })
          addCita({ helperId: helper?.id, helperName: helper?.name, personaId: lp?.id, personaLabel: lp?.label, label })
        } catch (e) { console.error('[Nüra] cita:', e) }
        setTimeout(() => setMessages(prev => [...prev, { id: Date.now() + 2, from: 'nura', text: `✓ Acordado: ${label}`, time: new Date().toISOString() }]), 900)
      }
    }, 1100)
  }
  const [showRating, setShowRating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [msgCount, setMsgCount] = useState(() => Math.floor((getChatHistory(id)?.filter(m => m.from === 'helper')?.length || 0)))
  const [listening, setListening] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!helper) return
    setSuggested(generateFirstMessage(helper))
    markRead?.(helper.id)

    // If coming from the Intro Letter screen, send it as the first user message
    if (location.state?.introLetterText && !hasHistory) {
      const letterMsg = {
        id: Date.now(),
        from: 'user',
        isLetter: true,
        text: location.state.introLetterText,
        time: new Date().toISOString()
      }
      setMessages([letterMsg])
      const chatAnalysis = (() => { try { return window.__nuraLastAnalysis || JSON.parse(sessionStorage.getItem('nura_last_analysis') || 'null') } catch { return null } })()
      if (DEMO_MODE && chatAnalysis) {
        // La Conversación Viva — solo en demo; en producción responden humanos reales
        const conv = buildLivingConversation({ helper, analysis: chatAnalysis, userQuery: location.state?.userQuery || window.__nuraLastQuery || '' })
        setTyping(true)
        setTimeout(() => {
          setMessages(prev => [...prev, { id: Date.now() + 1, from: 'helper', text: conv.messages[0], time: new Date().toISOString() }])
          setTimeout(() => {
            setTyping(false)
            setMessages(prev => [...prev, { id: Date.now() + 2, from: 'helper', text: conv.messages[1], time: new Date().toISOString(), proposal: conv.proposal }])
          }, Math.min(2800, 800 + conv.messages[1].length * 14))
        }, Math.min(2600, 700 + conv.messages[0].length * 14))
      } else {
        setTyping(true)
        const delay = 1200 + Math.random() * 600
        setTimeout(() => {
          setTyping(false)
          const reply = getHelperReply(helper, 1, location.state.introLetterText, true)
          const replyMsg = {
            id: Date.now() + 1,
            from: 'helper',
            text: reply,
            time: new Date().toISOString()
          }
          setMessages(prev => [...prev, replyMsg])
        }, delay)
      }
      return
    }

    // Send initial greeting if no history
    if (!hasHistory) {
      // Fuera de la demo nadie esta escribiendo: sin «escribiendo…».
      if (DEMO_MODE) setTyping(true)
      const delay = DEMO_MODE ? 800 + Math.random() * 400 : 300
      setTimeout(() => {
        setTyping(false)
        // Mismo motivo: sin demo, el saludo lo da Nüra en su nombre, no el
        // profesional fingiendo estar al otro lado.
        const greeting = DEMO_MODE
          ? getHelperReply(helper, 0, '')
          : `Escríbele a ${getFirstName(helper.name) || 'esta persona'}. Le aviso de que le has escrito y te traigo su respuesta aquí.`
        const greetMsg = {
          id: Date.now(),
          // Lo dice Nüra, y se ve como de Nüra: con la foto del profesional
          // al lado parecia que lo habia escrito el.
          from: DEMO_MODE ? 'helper' : 'nura',
          text: greeting,
          time: new Date().toISOString()
        }
        // Sin pisar lo que ya haya llegado (una respuesta del profesional
        // que entro antes que el saludo): el saludo nunca borra nada.
        setMessages(prev => prev.length ? prev : [greetMsg])
      }, delay)
    }
  }, [helper?.id])

  useEffect(() => {
    const scroller = bottomRef.current?.parentElement
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  // Persist chat history per helper
  useEffect(() => {
    if (messages.length > 0 && helper) {
      saveChatHistory(id, messages)
    }
  }, [messages])

  if (!helper && buscando) return <PageLoading kind="chat" />
  if (!helper) return (
    <div className={`${errorStyles.frame} ${errorStyles.withHeader} ${errorStyles.chat}`}>
      <PageHeader showBack />
      <ErrorPanel
        title={sinRed ? 'No he podido abrir esta conversación' : 'Esta conversación ya no está disponible'}
        hint={sinRed ? 'No he podido conectar. Puedes intentarlo de nuevo.' : 'Puede que el enlace sea antiguo. Puedes buscar a otro profesional.'}
        actionLabel={sinRed ? 'Reintentar' : 'Buscar a alguien'}
        onAction={sinRed ? () => { setBuscando(true); setIntento(n => n + 1) } : () => navigate('/')}
        secondaryLabel={sinRed ? 'Buscar a alguien' : undefined}
        onSecondary={() => navigate('/')}
      />
    </div>
  )

  function sendMessage(text) {
    haptic('light')
    const msg = text || input
    if (!msg.trim() || typing) return
    // Gate: after 4th user message, require registration (demo-friendly)
    if (!user && msgCount >= 4) { setShowRegGate(true); return }
    const newMsg = { id: Date.now(), text: msg, from: 'user', time: new Date().toISOString() }
    setMessages(prev => [...prev, newMsg])
    setInput(''); setSuggested('')
    // 'user': lo escribo yo, no cuenta como no leido.
    addChat?.(helper.id, helper.name, helper.avatarColor, helper.avatar, msg, 'user')
    // EL AVISO SALE SOLO. La app promete "le aviso de que le has escrito" y
    // hasta ahora eso dependia de que alguien ejecutase un comando a mano.
    // Se encola en el PRIMER mensaje de la conversacion: uno por persona que
    // escribe, no uno por mensaje.
    // `msgCount` cuenta mensajes DEL PROFESIONAL, y en produccion no hay
    // ninguno: siempre vale 0, asi que se encolaba un aviso por cada mensaje
    // que escribiera la persona. El criterio correcto es si YA habia escrito
    // antes en esta conversacion.
    const yaEscribi = messages.some(m => m.from === 'user')
    let envio = Promise.resolve('nada')
    if (!yaEscribi && helper?.id != null) {
      const aviso = construirAviso({
        helper,
        analysis: location.state?.analysis || window.__nuraLastAnalysis,
        userQuery: location.state?.userQuery || window.__nuraLastQuery || msg,
        user,
      })
      // Se encola AUNQUE no haya contacto. `construirAviso` devuelve null
      // cuando el profesional no dejo movil ni correo —los 1008 del dataset
      // original estan asi— y entonces el aviso se perdia en silencio.
      // Encolarlo igual es lo unico que hace VISIBLE el problema: la cola
      // marca `alcanzable: false` y `npm run avisar --pendientes` lo dice
      // con su nombre. Alguien escribio a esa persona y nadie puede avisarla.
      // Sin la coletilla «no tenemos forma de avisarte»: este texto lo lee
      // EL PROFESIONAL al abrir su enlace, y si lo esta leyendo es que si le
      // llego. Que no tiene contacto ya lo marca `alcanzable: false`.
      const cuerpo = aviso?.cuerpo || `Alguien te ha escrito en Nüra: «${msg}»`
      envio = enviarAlProfesional({ msgId: newMsg.id, helperId: helper.id, primero: true, cuerpo })
    } else if (helper?.id != null) {
      // Lo que escribe DESPUES tambien le llega (antes se perdia).
      const nombre = user?.name?.split(' ')?.[0] || 'La persona que te escribió'
      const suRespuesta = [...messages].reverse().find(m => m.__deAviso)?.text
      envio = enviarAlProfesional({ msgId: newMsg.id, helperId: helper.id, primero: false, mensaje: msg,
        cuerpoNuevo: suRespuesta
          ? `${nombre} te contesta en Nüra.\n\nTú le dijiste: «${suRespuesta.slice(0, 400)}»\n\nAhora te escribe: «${msg}»`
          : `${nombre} te escribe en Nüra: «${msg}»` })
    }

    // ── EN PRODUCCION NADIE CONTESTA, Y HAY QUE DECIRLO ──
    // El profesional respondia al instante con un guion: "¡Hola! Soy Carlos.
    // ¿En que puedo ayudarte?". Con DEMO_MODE es una demostracion legitima;
    // sin el seria mentirle a una persona sobre OTRA PERSONA REAL que no ha
    // visto nada y no va a contestar. En un producto cuya tesis es la
    // confianza, esa es la mentira mas cara posible.
    // Mientras no exista el lado del profesional (ver docs/lado-profesional.md),
    // lo honesto es decir que el mensaje esta enviado y que avisaremos.
    const isFirstContact = msgCount === 0
    if (!DEMO_MODE) {
      const quien = getFirstName(helper.name) || 'la persona'
      // Solo se dice «enviado» cuando de verdad ha salido.
      envio.then(r => {
        if (r === 'fallo') {
          setMessages(prev => [...prev, { id: Date.now() + 1, from: 'nura', time: new Date().toISOString(),
            text: `Ahora mismo no hay conexión. Tu mensaje está guardado y se lo envío a ${quien} en cuanto vuelva.` }])
          return
        }
        if (!isFirstContact) return
        setTimeout(() => setMessages(prev => [...prev, {
          id: Date.now() + 1, from: 'nura', time: new Date().toISOString(),
          text: `Mensaje enviado. Aviso a ${quien} de que le has escrito; en cuanto responda te llega aquí.`,
          // Solo si este movil puede recibir notificaciones (en iPhone, desde
          // la pantalla de inicio). Nada se pide hasta que lo toque.
          chips: movilPuedeAvisar() && !esIphoneSinInstalar() ? [AVISAME] : undefined,
        }]), 400)
      })
      return
    }
    setTyping(true)
    const delay = 1000 + Math.random() * 600
    setTimeout(() => {
      setTyping(false)
      const replyText = getHelperReply(helper, msgCount, msg)
      const reply = { id: Date.now() + 1, text: replyText, from: 'helper', time: new Date().toISOString() }
      // Log for future Claude analysis (silently)
      if (helper.isFromSupabase) {
        registrarConversacion(helper.id, msg, replyText)
      }
      setMessages(prev => [...prev, reply])
      const newCount = msgCount + 1
      setMsgCount(newCount)
      addChat?.(helper.id, helper.name, helper.avatarColor, helper.avatar, replyText)

      // Nüra intervention at key moments
      const nura = getNuraIntervention(helper, newCount, messages)
      if (nura) {
        setTimeout(() => {
          const isBookingMoment = nura.includes('Confirmo la reserva') || nura.includes('confirmar')
          setMessages(prev => [...prev, {
            id: Date.now() + 2,
            text: nura,
            from: 'nura',
            time: new Date().toISOString(),
            chips: isBookingMoment ? ['Confirmar reserva', 'Todavía no'] : undefined,
          }])
        }, 800)
      }
    }, delay)
  }

  // «Avísame cuando conteste»: pide permiso (solo ahora, porque lo ha
  // tocado) y deja la suscripcion en SU conversacion. Se dice lo que pasa.
  async function pedirAvisoRespuesta(msgId) {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, chips: undefined } : m))
    const nombre = getFirstName(helper?.name) || 'la persona'
    const r = await avisarCuandoConteste(helper?.id, nombre)
    const texto = r.ok ? `Hecho: cuando ${nombre} conteste, te llegará una notificación a este móvil.`
      : r.motivo === 'denegado' ? 'El móvil no ha dado permiso para notificaciones. Puedes activarlo en los ajustes del navegador; mientras, la respuesta te llega aquí.'
      : r.motivo === 'ya-contesto' ? `${nombre} ya te ha contestado: lo tienes aquí.`
      : 'No he podido activarlo ahora. La respuesta te llegará aquí igualmente.'
    setMessages(prev => [...prev, { id: Date.now(), from: 'nura', time: new Date().toISOString(), text: texto }])
  }

  function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }

  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1]
    if (!prev || formatDateLabel(msg.time) !== formatDateLabel(prev.time)) {
      acc.push({ type: 'date', label: formatDateLabel(msg.time) })
    }
    acc.push({ type: 'msg', msg })
    return acc
  }, [])

  // Quick replies after helper responds
  const lastMsg = messages[messages.length - 1]
  const showQuickReplies = lastMsg?.from === 'helper' && !typing

  // Context-aware quick replies based on conversation stage
  // Context-aware next steps — push toward booking
  const lastMsgText = messages[messages.length - 1]?.text?.toLowerCase() || ''
  const mentionedPrice = messages.some(m => m.text?.includes('€') || m.text?.toLowerCase()?.includes('precio'))
  const mentionedDate  = messages.some(m => m.text?.toLowerCase().includes('lunes') || m.text?.toLowerCase().includes('martes') || m.text?.toLowerCase().includes('semana') || m.text?.toLowerCase().includes('mañana'))

  const QUICK_REPLIES = msgCount === 0 ? [
    '¿Tienes disponibilidad esta semana?',
    '¿Cuál es tu precio?',
    '¿Trabajas en mi zona?',
  ] : mentionedDate && mentionedPrice ? [
    'Perfecto, lo confirmo',
    'Quiero reservar',
  ] : mentionedDate ? [
    '¿Cuánto cobras?',
    'Me interesa, ¿cómo lo reservamos?',
  ] : mentionedPrice ? [
    '¿Tienes hueco esta semana?',
    'Me parece bien el precio',
  ] : msgCount <= 3 ? [
    '¿Cuándo puedes empezar?',
    '¿Tienes experiencia con casos como el mío?',
  ] : [
    'Quiero contratarte',
    'Voy a reservar ahora',
  ]

  // ── Mic ────────────────────────────────────────────────────────────────
  function toggleMic() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'es-ES'
    rec.onresult = e => { setInput(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
    setListening(true)
  }

  // ── Display helpers ─────────────────────────────────────────
  // FIX 1: First name + first surname only
  const chatDisplayName = (() => {
    const parts = (helper.name || '').trim().split(' ')
    const TITLES = new Set(['Dra.','Dr.','Prof.','Lic.','Sr.','Sra.','D.','Dña.'])
    const filtered = parts.filter(p => !TITLES.has(p))
    return filtered.slice(0, 2).join(' ')
  })()

  // FIX 2: Shorten specialty (max 3 words, strip long suffixes)
  const chatSpecialty = (() => {
    const s = helper.specialty || ''
    const words = s.split(' ')
    if (words.length <= 3) return s
    return words.slice(0, 3).join(' ')
  })()

  // FIX 7: Contract button label based on service state
  const serviceState = (() => {
    const svc = services?.find(s => s.helperId === helper.id || s.helperId === String(helper.id))
    if (!svc) return 'Contratar'
    if (svc.status === 'pending')    return 'Pendiente'
    if (svc.status === 'confirmed')  return 'Próxima visita'
    if (svc.status === 'in_progress') return 'En curso'
    if (svc.status === 'completed' && !hasRated(helper.id)) return 'Valorar'
    if (svc.status === 'completed')  return 'Finalizado'
    return 'Contratar'
  })()

  return (
    <div className={styles.page}>

      {/* La cabecera reserva su altura real, también con nombres largos. */}
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={17} />
        </button>

        <button type="button" className={styles.helperInfo}
          aria-label={`Ver perfil de ${helper.name}`}
          onClick={() => navigate(`/helper/${helper.id}`, { state: { helper } })}>
          {helper.avatarUrl
            ? <img src={helper.avatarUrl} alt="" className={styles.avatarImg} />
            : <span className={styles.avatar} style={{ background: helper.avatarColor }} aria-hidden="true">{helper.avatar}</span>
          }
          <span className={styles.helperMeta}>
            <span className={styles.helperName}>
              <span className={styles.nameText}>{chatDisplayName}</span>
            </span>
            <span className={styles.helperSpecialty} title={helper.specialty}>{chatSpecialty}</span>
          </span>
        </button>

        <button className={styles.contractBtn} onClick={() => serviceState === 'Valorar' ? setShowRating(true) : setShowConfirm(true)}>
          {serviceState}
        </button>
      </header>

      {/* Messages — full screen */}
      <div className={styles.messages}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            {fromSearch && userQuery ? (
              <div style={{
                background:'linear-gradient(135deg,var(--purple-05),rgba(0,212,200,0.04))',
                border:'1px solid var(--purple-10)',
                borderRadius:'var(--radius-card)',padding:'var(--space-10) var(--space-14)',
                marginBottom:'var(--space-4)',maxWidth:'260px',textAlign:'left',
              }}>
                <SectionLabel tone="brand" style={{margin:'0 0 var(--space-4)'}}>Mensaje sugerido</SectionLabel>
                <p style={{fontSize:'var(--text-xs)',color:'var(--ink-tertiary)',margin:0,lineHeight:1.6}}>
                  Revisa el mensaje antes de enviarlo.
                </p>
              </div>
            ) : null}
            {/* Conversation starters */}
            <div style={{display:'flex',flexDirection:'column',gap:'var(--space-8)',marginTop:'var(--space-20)',width:'100%',maxWidth:'280px'}}>
              <p style={{fontSize:'var(--text-xs)',color:'var(--ink-tertiary)',textAlign:'center',margin:0}}>Empieza la conversación</p>
              {[
                `¿Tienes disponibilidad esta semana?`,
                `¿Cuánto cobras por sesión?`,
                `¿Puedes contarme más sobre tu experiencia?`,
              ].map((q,i) => (
                <button key={i}
                  onClick={() => sendMessage(q)}
                  className={styles.quickReply}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {grouped.map((item, i) => {
          if (item.type === 'date') return <div key={`d${i}`} className={styles.dateLabel}>{item.label}</div>
          const { msg } = item
          const isNura = msg.from === 'nura'
          return (
            <div key={msg.id} className={`${styles.msg} ${msg.from === 'user' ? styles.msgUser : styles.msgHelper} ${msg.from === 'nura' ? styles.msgSystem : ''}`} style={{animation:`fadeInUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards`}}>
              {msg.from === 'helper' && (
                helper.avatarUrl
                  ? <img src={helper.avatarUrl} alt="" className={styles.msgAvatarImg} />
                  : <div className={styles.msgAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
              )}
              {isNura && (
                <div className={styles.nuraAvatarSmall}>
                  <img src="/logo-iso.png" alt="Nüra" style={{width:'18px',height:'18px',objectFit:'contain'}} />
                </div>
              )}
              <div className={`${styles.msgBubble} ${isNura ? styles.msgBubbleNura : ''} ${msg.isLetter ? styles.msgLetter : ''}`}>
                <p>{msg.text}</p>
                {msg.from === 'helper' && msg.proposal && !msg.proposalAnswered && (
                  <div style={{display:'flex', gap:'var(--space-6)', marginTop:'var(--space-8)', flexWrap:'wrap'}}>
                    <button className="nura-glass-action" onClick={() => answerProposal(msg.id, true, msg.proposal.label)}
                      style={{ padding:'7px var(--space-14)',
              fontSize:'var(--text-xs)',
              fontWeight:600,
              ...(glass.primary) }}>
                      ✓ Me va bien
                    </button>
                    <button className="nura-glass-action" onClick={() => answerProposal(msg.id, false, msg.proposal.label)}
                      style={{ color:'var(--ink)',
              padding:'7px var(--space-14)',
              fontSize:'var(--text-xs)',
              fontWeight:600,
              ...(glass.control) }}>
                      Otro momento
                    </button>
                  </div>
                )}
                {isNura && msg.chips && (
                  <div style={{display:'flex',gap:'var(--space-6)',marginTop:'var(--space-8)',flexWrap:'wrap'}}>
                    {msg.chips.map((chip, ci) => (
                      <button className="nura-glass-action" key={ci}
                        onClick={() => {
                          if (chip === 'Confirmar reserva') { setShowConfirm(true); return }
                          if (chip === 'Todavía no') return
                          if (chip === AVISAME) { pedirAvisoRespuesta(msg.id); return }
                          sendMessage(chip)
                        }}
                        style={{ padding:'5px var(--space-12)',
              fontSize:'var(--text-xs)',
              fontWeight:600,
              cursor:'pointer',
              color: chip === 'Confirmar reserva' ? 'white' : 'var(--ink-secondary)',
              fontFamily:'inherit',
              ...(chip === 'Confirmar reserva' ? glass.primary : glass.control) }}>
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
                <span className={msg.from === 'user' ? styles.msgTime : styles.msgTimeHelper}>
                  {formatTime(msg.time)}{msg.from === 'user' && pendientes.has(msg.id) ? ' · Pendiente de enviar' : ''}
                </span>
              </div>
            </div>
          )
        })}

        {/* Typing */}
        {typing && (
          <div className={`${styles.msg} ${styles.msgHelper}`}>
            {helper.avatarUrl
              ? <img src={helper.avatarUrl} alt="" className={styles.msgAvatarImg} />
              : <div className={styles.msgAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
            }
            <div className={styles.typingBubble}>
              <span className={styles.typingDot}/><span className={styles.typingDot}/><span className={styles.typingDot}/>
            </div>
          </div>
        )}

        {/* Las sugerencias pertenecen a la conversación, no al pie fijo. */}
        {suggested && messages.length === 0 && (
          <div className={styles.suggestionBar}>
            <span className={styles.suggestionLabel}>Nüra sugiere</span>
            <button className={styles.suggestionText} onClick={() => sendMessage(suggested)}>{suggested}</button>
          </div>
        )}
        {showQuickReplies && (
          <div className={styles.quickReplies}>
            {QUICK_REPLIES.map((r, i) => (
              <button key={i} className={styles.quickReply} onClick={() => sendMessage(r)}>{r}</button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputWrap}>
        <div className={styles.inputBar}>
          <input className={styles.input} aria-label="Escribe tu mensaje"
            placeholder="Escribe un mensaje..."
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
          {input.trim()
            ? <button className={styles.sendBtn} onClick={() => sendMessage()} aria-label="Enviar mensaje"><Send size={16} /></button>
            : <button className={`${styles.sendBtn} ${listening ? styles.micActive : styles.micBtn}`} onClick={toggleMic} aria-label={listening ? 'Detener dictado' : 'Dictar por voz'}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
          }
        </div>
      </div>

      {showRegGate && <RegisterGate reason="chat" onClose={() => setShowRegGate(false)} />}
      {showRating && <RatingModal helper={helper} onClose={() => setShowRating(false)} />}
      {showConfirm && (() => {
        const { extractedDate, extractedTime } = extractDateFromMessages(messages)
        return <ConfirmModal
          helper={helper}
          onClose={() => setShowConfirm(false)}
          onNavigate={navigate}
          prefillDate={extractedDate}
          prefillTime={extractedTime}
          onConfirm={(date, time, note) => {
            addService(helper, date, time, note)
            // Y la propuesta le llega a el (antes se quedaba en este movil).
            if (!DEMO_MODE) enviarPropuestaCita(helper, date, time, note, user?.name?.split(' ')?.[0])
          }}
        />
      })()}
    </div>
  )
}
