import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Send, Mic, MicOff } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { DEMO_MODE } from '../config'
import { altaProfesional } from '../utils/escrituras'
import BottomNav from '../components/BottomNav'
import styles from './Home.module.css'


async function saveHelperToSupabase(answers) {
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
      zone: answers.zone || 'Barcelona', city: 'Barcelona',
      price: answers.price || null, category: inferredCategory,
      presential: true, online: (answers.modality || '').toLowerCase().includes('online'),
      available: true, verified: false, dni_verified: false, founder: false,
      rating: 0, reviews: 0, services: 0, response_time: '< 2 horas',
      completion_rate: 100, qualification_level: 'experienced',
      // Dato personal: NO viaja en las lecturas publicas (ver COLUMNAS_OCULTAS
      // en utils/supabase.js). Solo lo ve quien tiene la clave de servicio.
      contacto: (answers.contacto || '').trim() || null,
      tags: [answers.specialty || ''].filter(Boolean),
      ai_data: { formation: answers.formation, self_registered: true, registered_at: new Date().toISOString() }
    }
    // La escritura vive en utils/escrituras.js: un solo sitio decide si va
    // por la Edge Function (service_role) o por el camino directo.
    return await altaProfesional(payload)
  } catch (e) { console.warn('[Nüra] alta profesional no guardada:', e?.message || e); return null }
}

const QUESTIONS = [
  { id: 'name',           text: 'Hola, vamos a crear tu perfil profesional. ¿Cómo te llamas?',        placeholder: 'Tu nombre completo' },
  { id: 'specialty',      text: 'Encantada, {name}. ¿Cuál es tu especialidad principal?',             placeholder: 'Ej: logopeda, cuidadora, técnico de calderas...' },
  { id: 'formation',      text: '¿Qué formación o certificaciones tienes?',                           placeholder: 'Ej: Grado en Logopedia, FP Atención Sociosanitaria...' },
  { id: 'zone',           text: '¿En qué zona de Barcelona trabajas? ¿Te desplazas?',                 placeholder: 'Ej: Gràcia y alrededores, toda Barcelona' },
  { id: 'price',          text: '¿Cuál es tu tarifa? Cuanto más claro, más confianza genera.',        placeholder: 'Ej: 50€/sesión de 45 min, 15€/hora' },
  { id: 'differentiator', text: '¿Qué te diferencia de otros profesionales?',                        placeholder: 'Lo que te hace único — en una o dos frases' },
  // SIN ESTO NO HAY NEGOCIO. El alta no pedia ningun dato de contacto y
  // ningun perfil del dataset lo tiene: un profesional podia completar las
  // seis preguntas, aparecer en las busquedas, y ser INALCANZABLE para
  // siempre. Nadie —ni Nura ni el fundador— podia avisarle de que alguien
  // le necesitaba. Es la ultima pregunta a proposito: se pide cuando la
  // persona ya ha invertido en el perfil, no en la puerta.
  { id: 'contacto',       text: 'Y lo más importante: ¿cómo te avisamos cuando alguien te necesite?', placeholder: 'Tu móvil o tu email' },
]

export default function RegisterHelper() {
  const navigate   = useNavigate()
  const location   = useLocation()   // el de react-router, NO el global del navegador
  const { login }  = useUser()
  // Si venimos del onboarding con el nombre escrito, no se vuelve a pedir:
  // se saluda y se empieza por la pregunta siguiente.
  const nombrePrevio = (location.state?.name || '').trim()
  const [messages, setMessages]   = useState(() => nombrePrevio
    ? [{ id: 1, from: 'nura', text: QUESTIONS[1].text.replace('{name}', nombrePrevio) }]
    : [{ id: 1, from: 'nura', text: QUESTIONS[0].text }])
  const [input, setInput]         = useState('')
  const [qIdx, setQIdx]           = useState(nombrePrevio ? 1 : 0)
  const [answers, setAnswers]     = useState(nombrePrevio ? { name: nombrePrevio } : {})
  const [typing, setTyping]       = useState(false)
  const [listening, setListening] = useState(false)
  const [done, setDone]           = useState(false)
  const [topH, setTopH]           = useState(80)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const topRef    = useRef(null)

  // Mirror Home's ResizeObserver for header height → messages paddingTop
  useEffect(() => {
    const top = topRef.current
    if (!top) return
    const measure = () => setTopH(Math.ceil(top.getBoundingClientRect().bottom) + 8)
    const ro = new ResizeObserver(measure)
    ro.observe(top)
    measure()
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (!done) inputRef.current?.focus()
  }, [messages, typing])

  function sendMessage() {
    const val = input.trim()
    if (!val || typing) return
    setInput('')
    const q = QUESTIONS[qIdx]
    const newAnswers = { ...answers, [q.id]: val }
    setAnswers(newAnswers)
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: val }])
    const next = qIdx + 1
    if (next < QUESTIONS.length) {
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        const text = QUESTIONS[next].text.replace('{name}', newAnswers.name || val)
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura', text }])
        setQIdx(next)
      }, 800)
    } else {
      setTyping(true)
      setTimeout(async () => {
        // En demo NO se escribe en produccion. Cada recorrido del alta creaba
        // un profesional real y permanente en la base de datos viva; desde que
        // el alta guarda bien la categoria, ademas, esos perfiles de prueba
        // SALEN en las busquedas de gente real.
        const publicado = DEMO_MODE ? true : !!(await saveHelperToSupabase(newAnswers))
        setTyping(false); setDone(true)
        setMessages(prev => [...prev, { id: Date.now(), from: 'nura',
          text: publicado
            ? `Perfecto, ${newAnswers.name || val}. Tu perfil está listo. ¡Ya formas parte de la red!`
            : `Perfecto, ${newAnswers.name || val}. Tu perfil está guardado aquí, pero todavía no he podido publicarlo para que te encuentren. Lo reintento; si mañana no apareces en las búsquedas, vuelve a entrar y avísame.` }])
        if (publicado) setTimeout(() => setMessages(prev => [...prev, { id: Date.now()+1, from: 'nura',
          text: 'Cada valoración que recibas fortalecerá tu reputación. ¡Mucha suerte!' }]), 1800)
        login({ ...(JSON.parse(localStorage.getItem('nura_user') || 'null') || {}), name: newAnswers.name || val, isHelper: true, helperProfile: newAnswers, joined: new Date().toISOString() })
        sessionStorage.setItem('nura_helper_registered', '1')
        sessionStorage.setItem('nura_show_profile_preview', '1')
        setTimeout(() => navigate('/'), 3000)
      }, 1000)
    }
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
        <button className={styles.menuBubble} onClick={() => navigate(-1)}>
          <ArrowLeft size={17} />
        </button>

        <div className={styles.logoBubble}>
          <img src="/logo-text.png" alt="Nüra" className={styles.headerLogo} />
          <span style={{
            width: 1, height: 14, background: 'rgba(33,29,51,0.12)',
            display: 'inline-block', margin: '0 var(--space-8)', flexShrink: 0
          }} />
          <span style={{
            fontSize: 'var(--text-xs)', fontWeight: 600,
            color: 'var(--purple)', whiteSpace: 'nowrap'
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
            background:'var(--purple-05)', borderRadius:'var(--radius-card)',
            border:'1px solid var(--purple-10)'
          }}>
            <div style={{fontSize:'var(--text-xs)',fontWeight:700,color:'var(--purple)',marginBottom:'var(--space-6)',letterSpacing:'0.3px',textTransform:'uppercase'}}>
              ¿Sabías que?
            </div>
            <div style={{fontSize:'var(--text-sm)',color:'var(--ink)',lineHeight:1.5,letterSpacing:'-0.1px'}}>
              Los profesionales de Nüra en Barcelona reciben una media de <strong>8 contactos al mes</strong> desde el primer día.
            </div>
            <div style={{fontSize:'var(--text-xs)',color:'rgba(33,29,51,0.38)',marginTop:'var(--space-6)'}}>
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

        <div style={{ height: '96px' }} />
        <div ref={bottomRef} />
      </div>

      {/* ── FLOAT BOTTOM — idéntico a Home ── */}
      {!done && (
        <div className={styles.floatBottom}>
          <div className={styles.inputCapsule}>
            <input
              ref={inputRef}
              className={styles.input}
              placeholder={currentQ?.placeholder || 'Escribe tu respuesta...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={typing}
            />
            {input.trim()
              ? <button className={styles.sendBtn} onClick={sendMessage} disabled={!input.trim() || typing}>
                  <Send size={16} />
                </button>
              : <button className={`${styles.sendBtn} ${listening ? styles.micActive : styles.micBtn}`} onClick={toggleMic}>
                  {listening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
            }
          </div>
        </div>
      )}

      <BottomNav />

    </div>
  )
}
