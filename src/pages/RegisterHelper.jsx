import { revisarContacto } from '../utils/contactoProfesional'
import { ciudadDeZona, faltaCiudad, ciudadDeRespuesta } from '../data/ciudades'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Send, Mic, MicOff } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { DEMO_MODE } from '../config'
import { altaProfesional } from '../utils/escrituras'
import ConfirmarDeclarado from '../components/ConfirmarDeclarado'
import { ordenarPerfil } from '../utils/declarado'
import { valorarOficio } from '../utils/demanda'
import ElegirOficio from '../components/ElegirOficio'
import styles from './Home.module.css'


async function saveHelperToSupabase(answers, declarado = []) {
  try {
    const { analyzeNeed } = await import('../utils/matching')
    // `analyzeNeed` devuelve una PROMESA. Sin await, `.categoria` era
    // undefined, `inferredCategory` quedaba undefined y JSON.stringify
    // BORRA las claves undefined: el alta viajaba SIN categoria. Y el
    // emparejador filtra por categoria exacta, asi que todo profesional
    // dado de alta desde la app quedaba invisible en cada busqueda, para
    // siempre. Respondia seis preguntas y no recibia un solo contacto.
    const specialtyAnalysis = await analyzeNeed(answers.specialty || '')
    const inferredCategory = specialtyAnalysis?.categoria || 'otro'
    const payload = {
      name: answers.name || 'Profesional',
      specialty: answers.specialty || '',
      // La formacion se preguntaba y solo viajaba a `ai_data`: invisible.
      // Es la credencial que gana la confianza — va en la bio publica.
      bio: [answers.formation, answers.differentiator].map(x => (x || '').trim()).filter(Boolean).join('. '),
      // La ciudad, de lo que escribe: antes TODOS quedaban en Barcelona.
      zone: (answers.zone || '').trim() || null,
      // Si la zona no la dice («Chamberí»), la que contestó al preguntársela.
      city: ciudadDeZona(answers.zone) || answers.ciudad || null,
      price: answers.price || null, category: inferredCategory,
      presential: true, online: (answers.modality || '').toLowerCase().includes('online'),
      // COLUMNAS EN camelCase: la tabla real de Supabase usa `dniVerified`,
      // `responseTime`, `completionRate`, `qualificationLevel` — no
      // snake_case. Comprobado contra information_schema el 2026-08-08: el
      // insert habria fallado entero al primer campo desconocido.
      available: true, verified: false, dniVerified: false, founder: false,
      rating: 0, reviews: 0, services: 0, responseTime: '< 2 horas',
      completionRate: 100, qualificationLevel: 'experienced',
      // Dato personal: NO viaja en las lecturas publicas (ver COLUMNAS_OCULTAS
      // en utils/supabase.js). Solo lo ve quien tiene la clave de servicio.
      contacto: (answers.contacto || '').trim() || null,
      tags: [answers.specialty || ''].filter(Boolean),
      // `ai_data` NO existe en la tabla. La formacion ya va en la bio, que
      // es donde se lee; lo demas era metadato que no se consultaba.
      criminalRecordClear: false,
    }
    // La escritura vive en utils/escrituras.js: un solo sitio decide si va
    // por la Edge Function (service_role) o por el camino directo.
    return await altaProfesional(payload, declarado)
  } catch (e) { console.warn('[Nüra] alta profesional no guardada:', e?.message || e); return null }
}

// El nombre de pila: «Encantada, Marta», no «Encantada, Marta Ruiz».
const pila = n => String(n || '').trim().split(/\s+/)[0] || ''

/**
 * Una frase breve cuando la respuesta la pide. Solo en dos casos, y útil:
 * sin formación (la experiencia también cuenta) y sin tarifa (una
 * orientativa hace que te escriban más). En el resto, nada: no se
 * comenta cada respuesta.
 */
function acuseDe(id, val) {
  const t = String(val || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  if (id === 'formation' && /^(no|ninguna|ninguno|nada|sin|todavia no|aun no)\b/.test(t)) {
    return 'Sin problema: la experiencia también cuenta, y puedes contarla en tu perfil.'
  }
  if (id === 'price' && !/\d/.test(t)) {
    return 'Vale. Si más adelante pones una tarifa orientativa (por ejemplo, «15 €/hora»), te escribirá más gente.'
  }
  return ''
}

const QUESTIONS = [
  // `campo`: lo que el teclado del móvil puede proponer (su nombre, su correo).
  { id: 'name',           text: 'Hola, vamos a crear tu perfil profesional. ¿Cómo te llamas?',        placeholder: 'Tu nombre completo', campo: { autoComplete: 'name', name: 'name', autoCapitalize: 'words' } },
  { id: 'specialty',      text: 'Encantada, {name}. ¿Cuál es tu especialidad principal?',             placeholder: 'Ej: logopeda, cuidadora, técnico de calderas...' },
  { id: 'formation',      text: '¿Qué formación o certificaciones tienes?',                           placeholder: 'Ej: Grado en Logopedia, FP Atención Sociosanitaria...' },
  { id: 'zone',           text: '¿En qué ciudad y zona trabajas? ¿Te desplazas?',                    placeholder: 'Ej: Barcelona, Gràcia y alrededores · Madrid, Chamberí' },
  { id: 'price',          text: '¿Cuál es tu tarifa? Cuanto más claro, más confianza genera.',        placeholder: 'Ej: 50€/sesión de 45 min, 15€/hora' },
  { id: 'differentiator', text: '¿Qué te diferencia de otros profesionales?',                        placeholder: 'Cuenta qué te hace único en una o dos frases' },
  // SIN ESTO NO HAY NEGOCIO. El alta no pedia ningun dato de contacto y
  // ningun perfil del dataset lo tiene: un profesional podia completar las
  // seis preguntas, aparecer en las busquedas, y ser INALCANZABLE para
  // siempre. Nadie —ni Nura ni el fundador— podia avisarle de que alguien
  // le necesitaba. Es la ultima pregunta a proposito: se pide cuando la
  // persona ya ha invertido en el perfil, no en la puerta.
  // Un correo, no un móvil (2026-10-01): con él le llegan los avisos solos y
  // su cuenta se une a esta ficha (la prueba es ese correo).
  { id: 'contacto',       text: 'Y lo más importante: ¿a qué correo te avisamos cuando alguien te necesite?', placeholder: 'Tu correo, así: nombre@gmail.com', campo: { autoComplete: 'email', name: 'email', autoCapitalize: 'none' } },
]

export default function RegisterHelper() {
  const navigate   = useNavigate()
  const location   = useLocation()   // el de react-router, NO el global del navegador
  const { login }  = useUser()
  // Si venimos del onboarding con el nombre escrito, no se vuelve a pedir:
  // se saluda y se empieza por la pregunta siguiente.
  const nombrePrevio = (location.state?.name || '').trim()
  const [messages, setMessages]   = useState(() => nombrePrevio
    ? [{ id: 1, from: 'nura', text: QUESTIONS[1].text.replace('{name}', pila(nombrePrevio)) }]
    : [{ id: 1, from: 'nura', text: QUESTIONS[0].text }])
  const [input, setInput]         = useState('')
  const [qIdx, setQIdx]           = useState(nombrePrevio ? 1 : 0)
  const [answers, setAnswers]     = useState(nombrePrevio ? { name: nombrePrevio } : {})
  const [typing, setTyping]       = useState(false)
  const [listening, setListening] = useState(false)
  const [done, setDone]           = useState(false)
  const contactoRechazado = useRef('')
  // Tras «¿En qué ciudad y zona trabajas?», si contesta solo «Chamberí» se
  // le pregunta la ciudad: sin ella no le encuentra quien busca en Madrid.
  const pidiendoCiudad = useRef(false)
  const ciudadInsistida = useRef(false)
  // Su profesión aún no existe en Nüra y nadie la busca: oficios que sí
  // existen para elegir (o quedarse con la suya). Se ofrece una sola vez.
  const [eleccion, setEleccion] = useState(null)
  const oficioValorado = useRef(false)
  // Lo que la IA ha ordenado de sus respuestas, esperando su «es correcto».
  const [propuesta, setPropuesta] = useState(null)
  const [topH, setTopH]           = useState(80)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const topRef    = useRef(null)

  // Mirror Home's ResizeObserver for header height → messages paddingTop
  useEffect(() => {
    const top = topRef.current
    if (!top) return
    const measure = () => setTopH(Math.ceil(top.offsetTop + top.getBoundingClientRect().height) + 8)
    const ro = new ResizeObserver(measure)
    ro.observe(top)
    measure()
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const scroller = bottomRef.current?.parentElement
    // Al empezar (solo «Cómo funciona» y la primera pregunta) se queda
    // arriba: en un móvil pequeño bajar al final escondía el recuadro bajo
    // el título (2026-10-01). Con la conversación ya en marcha, al final.
    if (messages.length > 1 || typing) scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
    if (!done) inputRef.current?.focus({ preventScroll: true })
  }, [messages, typing])

  // Tras la especialidad: la pregunta siguiente, con lo que haya que decirle antes.
  function seguirTrasEspecialidad(newAnswers, avisos = []) {
    const next = QUESTIONS.findIndex(x => x.id === 'specialty') + 1
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages(prev => [...prev,
        ...avisos.map((text, i) => ({ id: Date.now() + i, from: 'nura', text })),
        { id: Date.now() + 9, from: 'nura', text: QUESTIONS[next].text.replace('{name}', pila(newAnswers.name)) }])
      setQIdx(next)
    }, 800)
  }

  // ── ¿ALGUIEN BUSCA LO QUE HACES? ──
  // Si la buscaron sin encontrar a nadie, se le dice: le estaban esperando.
  // Si no existe en Nüra y nadie la ha buscado, se le recomienda un oficio
  // que sí exista (decisión del fundador); puede quedarse con el suyo.
  // Si no se sabe (sin conexión), no se dice nada.
  function valorarEspecialidad(val, newAnswers) {
    oficioValorado.current = true
    setTyping(true)
    const categoriaDe = async texto => {
      const { analyzeNeed, categoriasEnBD } = await import('../utils/matching')
      const c = (await analyzeNeed(texto))?.categoria
      return c && c !== 'otro' ? categoriasEnBD(c) : null
    }
    const tope = new Promise(r => setTimeout(() => r(null), 6000))
    Promise.race([valorarOficio(val, { categoriaDe }).catch(() => null), tope]).then(v => {
      const nombre = v?.oficio?.nombre || null
      const personas = n => n === 1 ? 'una persona buscó' : `${n} personas buscaron`
      if (v?.sinNadie > 0) {
        return seguirTrasEspecialidad(newAnswers, [`Buena noticia: en el último mes, ${personas(v.sinNadie)} ${nombre || 'lo que haces'} en Nüra y no ${v.sinNadie === 1 ? 'encontró' : 'encontraron'} a nadie. Te estaban esperando.`])
      }
      if (v?.busquedas > 0) {
        return seguirTrasEspecialidad(newAnswers, [`En el último mes, ${personas(v.busquedas)} ${nombre || 'lo que haces'} en Nüra.`])
      }
      if (v?.existe === false) {
        setTyping(false)
        const cual = nombre || `«${val}»`
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', text: v.sugerencias.length
          ? `Todavía nadie ofrece ${cual} en Nüra y nadie lo ha buscado. Si tu trabajo encaja en una de estas, te encontrarán antes:`
          : `Todavía no conozco ${cual} en Nüra y nadie lo ha buscado. Si puedes, escríbelo como lo buscaría la gente (por ejemplo: «electricista» o «profesora de inglés»).` }])
        setEleccion({ opciones: v.sugerencias, original: val, answers: newAnswers })
        return
      }
      seguirTrasEspecialidad(newAnswers)
    })
  }

  function elegirOficio(elegido) {
    const a = { ...eleccion.answers, specialty: elegido }
    setEleccion(null)
    setAnswers(a)
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: elegido }])
    seguirTrasEspecialidad(a)
  }

  function sendMessage() {
    let val = input.trim()
    if (!val || typing) return
    setInput('')
    // Con la recomendación abierta, escribir es dar otra especialidad.
    if (eleccion) setEleccion(null)
    const q = QUESTIONS[qIdx]
    if (pidiendoCiudad.current) {
      const ciudad = ciudadDeRespuesta(val)
      setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: val }])
      setTyping(true)
      // Una sola vez se insiste; si tampoco, se sigue sin ciudad (no se atasca).
      if (!ciudad && !ciudadInsistida.current) {
        ciudadInsistida.current = true
        setTimeout(() => {
          setTyping(false)
          setMessages(prev => [...prev, { id: Date.now(), from: 'nura', text: 'Dime solo el nombre de la ciudad. Por ejemplo: Madrid.' }])
        }, 600)
        return
      }
      pidiendoCiudad.current = false
      const conCiudad = ciudad ? { ...answers, ciudad } : answers
      setAnswers(conCiudad)
      setTimeout(() => {
        setTyping(false)
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', text: QUESTIONS[qIdx + 1].text.replace('{name}', pila(conCiudad.name)) }])
        setQIdx(qIdx + 1)
      }, 800)
      return
    }
    // El contacto se comprueba: es por donde le llegarán los avisos.
    if (q.id === 'contacto') {
      const r = revisarContacto(val, { soloCorreo: true })
      // Si le sugerimos otro correo y reenvía el suyo tal cual, es el bueno.
      const insiste = r.sugerencia && contactoRechazado.current === val
      if (!r.ok && !insiste) {
        contactoRechazado.current = val
        setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: val }])
        setTyping(true)
        setTimeout(() => {
          setTyping(false)
          setMessages(prev => [...prev, { id: Date.now(), from: 'nura', text: r.motivo }])
        }, 600)
        return
      }
      val = r.ok ? r.valor : val.toLowerCase().replace(/\s+/g, '')
    }
    const newAnswers = { ...answers, [q.id]: val }
    setAnswers(newAnswers)
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: val }])
    if (q.id === 'specialty') {
      if (!oficioValorado.current) valorarEspecialidad(val, newAnswers)
      else seguirTrasEspecialidad(newAnswers)
      return
    }
    if (q.id === 'zone' && faltaCiudad(val)) {
      pidiendoCiudad.current = true
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
          text: "¿Y en qué ciudad está esa zona? Así te encuentra quien busca allí." }])
      }, 800)
      return
    }
    const next = qIdx + 1
    if (next < QUESTIONS.length) {
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        // Una frase breve si la respuesta lo pide («no tengo», «a convenir»):
        // antes pasaba a la siguiente pregunta como si no hubiera oído nada.
        const text = [acuseDe(q.id, val), QUESTIONS[next].text.replace('{name}', pila(newAnswers.name || val))].filter(Boolean).join(' ')
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', text }])
        setQIdx(next)
      }, 800)
    } else {
      // ── LO DECLARADO, ORDENADO POR IA (docs/perfil-vivo.md §4) ──
      // Antes de publicar, Nüra ordena lo que ha contado en datos concretos
      // y se los enseña. Sin IA (o si falla) se publica igual, sin este paso.
      setTyping(true)
      const texto = [newAnswers.specialty, newAnswers.formation, newAnswers.zone, newAnswers.differentiator]
        .map(x => (x || '').trim()).filter(Boolean).join('. ')
      ordenarPerfil(texto).then(items => {
        if (!items.length) { finalizar(newAnswers, []); return }
        setTyping(false)
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
          text: 'He ordenado lo que me has contado para que te encuentren mejor. ¿Es correcto?' }])
        setPropuesta({ items, answers: newAnswers })
      })
    }
  }

  function finalizar(newAnswers, declarado) {
    const val = newAnswers.name || ''
    setTyping(true)
    setTimeout(async () => {
        // En demo NO se escribe en produccion. Cada recorrido del alta creaba
        // un profesional real y permanente en la base de datos viva; desde que
        // el alta guarda bien la categoria, ademas, esos perfiles de prueba
        // SALEN en las busquedas de gente real.
        const publicado = DEMO_MODE ? true : !!(await saveHelperToSupabase(newAnswers, declarado))
        setTyping(false); setDone(true)
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
          text: publicado
            ? `Perfecto, ${pila(newAnswers.name || val)}. Tu perfil está listo: desde ahora ya pueden encontrarte en Nüra.`
            : `Perfecto, ${pila(newAnswers.name || val)}. Tu perfil está guardado aquí, pero todavía no he podido publicarlo para que te encuentren. Lo reintento; si mañana no apareces en las búsquedas, vuelve a entrar y avísame.` }])
        if (publicado) setTimeout(() => setMessages(prev => [...prev, { id: Date.now()+1, from: 'nura',
          text: 'Cada valoración que recibas fortalecerá tu reputación. ¡Mucha suerte!' }]), 1800)
        login({ ...(JSON.parse(localStorage.getItem('nura_user') || 'null') || {}), name: newAnswers.name || val, isHelper: true, helperProfile: newAnswers, joined: new Date().toISOString() })
        sessionStorage.setItem('nura_helper_registered', '1')
        sessionStorage.setItem('nura_show_profile_preview', '1')
        setTimeout(() => navigate('/'), 3000)
      }, 1000)
  }

  function toggleMic() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'es-ES'
    rec.onresult = e => { setInput(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend   = () => setListening(false)
    rec.start(); setListening(true)
  }

  const currentQ = QUESTIONS[qIdx]
  const progress  = (qIdx / QUESTIONS.length) * 100

  return (
    <div className={styles.page}>

      {/* ── HEADER — mismo floatTop que Home ── */}
      <div className={styles.floatTop} ref={topRef}>
        <button className={styles.menuBubble} aria-label="Volver" onClick={() => navigate(-1)}>
          <ArrowLeft size={17} />
        </button>

        <div className={styles.logoBubble}>
          <span className="nura-wordmark">Nüra</span>
          <span style={{
            width: 1, height: 14, background: 'rgba(33,29,51,0.12)',
            display: 'inline-block', margin: '0 var(--space-8)', flexShrink: 0
          }} />
          <span style={{
            fontSize: 'var(--text-xs)', fontWeight: 600,
            color: 'var(--purple-ink)', whiteSpace: 'nowrap'
          }}>Perfil profesional</span>
        </div>

        {/* Spacer igual al ancho del botón izquierdo */}
        <div style={{ width: 42, flexShrink: 0 }} />
      </div>

      {/* Barra de progreso */}
      <div style={{
        position: 'absolute',
        top: topH - 4 + 'px',
        left: 14, right: 14,
        height: 2, borderRadius: 2,
        background: 'transparent',
        zIndex: 29, overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'var(--grad-main)', borderRadius: 2,
          transition: 'width 0.4s ease'
        }} />
      </div>

      {/* ── MESSAGES — idéntico a Home ── */}
      <div className={styles.messages} style={{ paddingTop: topH + 'px' }}>
        {messages.length === 1 && (
          <div style={{
            margin:'0 0 var(--space-12)', padding:'var(--space-12) var(--space-16)',
            background:'var(--glass-panel)', borderRadius:'var(--radius-glass)',
            border:'1px solid var(--glass-edge)', boxShadow:'var(--glass-panel-shadow)'
          }}>
            {/* Antes: «reciben una media de 8 contactos al mes». Ese dato no
                existe: no hay profesionales reales todavia. Se promete solo
                lo que la app hace. */}
            <div style={{fontSize:'var(--text-xs)',fontWeight:700,color:'var(--purple-ink)',marginBottom:'var(--space-6)',letterSpacing:'0.3px',textTransform:'uppercase'}}>
              Cómo funciona
            </div>
            <div style={{fontSize:'var(--text-sm)',color:'var(--ink)',lineHeight:1.5,letterSpacing:'-0.1px'}}>
              Cuando alguien te necesite, te llega su mensaje a tu <strong>correo</strong> y respondes desde ahí, sin descargar nada.
            </div>
            <div style={{fontSize:'var(--text-xs)',color:'var(--ink-tertiary)',marginTop:'var(--space-6)'}}>
              Tu perfil tarda menos de 3 minutos en estar publicado.
            </div>
          </div>
        )}
        {messages.map((msg, msgIdx) => (
          <div key={msg.id} style={{ marginTop: msgIdx === 0 ? 0 : msg.from === 'user' ? 'var(--chat-gap-md)' : 'var(--chat-gap)' }}>
            <div className={`${styles.msgRow} ${msg.from === 'user' ? styles.msgRowUser : ''}`}>
              {msg.from === 'nura' && (
                <div className={styles.nuraAvatar}>
                  <img src="/logo-iso.png" alt="Nüra" className={styles.nuraAvatarImg} />
                </div>
              )}
              <div className={`${styles.bubble} ${msg.from === 'user' ? styles.bubbleUser : styles.bubbleNura}`}>
                <p>{msg.text}</p>
                {msg.loading && <div className={styles.typingDots}><span /><span /><span /></div>}
              </div>
            </div>
          </div>
        ))}

        {typing && (
          <div style={{ marginTop: 'var(--chat-gap)' }}>
            <div className={styles.msgRow}>
              <div className={styles.nuraAvatar}>
                <img src="/logo-iso.png" alt="Nüra" className={styles.nuraAvatarImg} />
              </div>
              <div className={`${styles.bubble} ${styles.bubbleNura}`}>
                <div className={styles.typingDots}><span /><span /><span /></div>
              </div>
            </div>
          </div>
        )}

        {eleccion && (
          <div style={{ marginTop: 'var(--chat-gap)' }}>
            <ElegirOficio opciones={eleccion.opciones} original={eleccion.original} onElegir={elegirOficio} />
          </div>
        )}

        {propuesta && (
          <div style={{ marginTop: 'var(--chat-gap)' }}>
            <ConfirmarDeclarado items={propuesta.items}
              textoBoton="Es correcto, publicar"
              onConfirmar={elegidos => {
                const { answers: a } = propuesta
                setPropuesta(null)
                setMessages(prev => [...prev, { id: Date.now(), from: 'user',
                  text: elegidos.length ? elegidos.map(e => e.etiqueta).join(' · ') : 'Mejor sin esto' }])
                finalizar(a, elegidos)
              }}
              onSaltar={() => {
                const { answers: a } = propuesta
                setPropuesta(null)
                setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: 'Mejor sin esto' }])
                finalizar(a, [])
              }} />
          </div>
        )}

        <div style={{ height: '96px' }} />
        <div ref={bottomRef} />
      </div>

      {/* ── FLOAT BOTTOM — idéntico a Home ── */}
      {!done && !propuesta && (
        <div className={styles.floatBottom}>
          <div className={styles.inputCapsule}>
            <input
              ref={inputRef}
              className={styles.input}
              placeholder={currentQ?.placeholder || 'Escribe tu respuesta...'}
              // Solo el nombre y el contacto: lo demás, sin propuestas del móvil.
              {...(currentQ?.campo || { autoComplete: 'off' })}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={typing}
            />
            {input.trim()
              ? <button className={styles.sendBtn} aria-label="Enviar respuesta" onClick={sendMessage} disabled={!input.trim() || typing}>
                  <Send size={16} />
                </button>
              : <button className={`${styles.sendBtn} ${listening ? styles.micActive : styles.micBtn}`} onClick={toggleMic} aria-label={listening ? 'Detener dictado' : 'Dictar por voz'}>
                  {listening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
            }
          </div>
        </div>
      )}


    </div>
  )
}
