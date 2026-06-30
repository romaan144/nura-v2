import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Send, Shield, Award, Calendar, Plus, Mic, MicOff } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import { getHelperById } from '../utils/supabase'
import { appendHelperChatLog } from '../utils/claudeApi'
import { notifyServiceConfirmed } from '../utils/notifications'
import { haptic } from '../utils/haptic'
import RatingModal from '../components/RatingModal'
import styles from './Chat.module.css'
import { generateFirstMessage, getHelperReply, getNuraIntervention } from '../utils/chatReplies'

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
  const [date, setDate] = useState(prefillDate || '')
  const [time, setTime] = useState(prefillTime || '')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const name = helper.name?.split(' ')?.[0] || helper.name

  if (done) return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',WebkitBackdropFilter: 'blur(8px)', backdropFilter:'blur(8px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{background:'rgba(255,255,255,0.95)',WebkitBackdropFilter: 'blur(32px)', backdropFilter:'blur(32px)',border:'1px solid rgba(255,255,255,0.5)',borderRadius:'24px',padding:'36px 28px',textAlign:'center',maxWidth:'320px',width:'100%',boxShadow:'0 8px 40px rgba(0,0,0,0.12)'}}>
        {/* Avatar with checkmark */}
        <div style={{position:'relative',display:'inline-block',marginBottom:'12px'}}>
          {helper.avatarUrl
            ? <img src={helper.avatarUrl} alt={name}
                style={{width:'64px',height:'64px',borderRadius:'50%',border:'3px solid var(--green-dot)',display:'block'}} />
            : <div style={{width:'64px',height:'64px',borderRadius:'50%',background:helper.avatarColor||'#7B2FFF',
                display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'var(--text-lg)',fontWeight:700,
                border:'3px solid var(--green-dot)'}}>
                {helper.avatar||name[0]}
              </div>
          }
          <span style={{position:'absolute',bottom:-2,right:-2,width:'20px',height:'20px',background:'var(--green-dot)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width='11' height='11' viewBox='0 0 12 12' fill='none'><path d='M2 6l3 3 5-5' stroke='white' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'/></svg></span>
        </div>
        <h3 className={styles.modalTitle}>¡Solicitud enviada!</h3>
        <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.45)',marginBottom:'12px',lineHeight:1.6}}>{name} confirmará disponibilidad en breve.</p>
        {(date || time) && (
          <div style={{background:'rgba(0,0,0,0.03)',border:'1px solid rgba(0,0,0,0.06)',borderRadius:'12px',
            padding:'10px 14px',marginBottom:'20px',textAlign:'left'}}>
            {date && <p className={styles.metaXs3}>
              {new Date(date).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}
            </p>}
            {time && <p style={{margin:0,fontSize:'var(--text-xs)',color:'rgba(0,0,0,0.55)'}}>{time}h</p>}
          </div>
        )}
        <div className={styles.colFull}>
          <button onClick={() => { onClose(); navigate('/my-services') }}
            style={{padding:'13px',background:'var(--purple)',color:'white',border:'none',borderRadius:'100px',fontSize:'var(--text-sm)',fontWeight:700,cursor:'pointer',width:'100%'}}>
            Ver mis servicios
          </button>
          <button onClick={onClose}
            style={{padding:'12px',background:'transparent',color:'rgba(0,0,0,0.4)',border:'none',fontSize:'var(--text-sm)',cursor:'pointer'}}>
            Volver al chat
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',WebkitBackdropFilter: 'blur(8px)', backdropFilter:'blur(8px)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{background:'rgba(255,255,255,0.95)',WebkitBackdropFilter: 'blur(32px)', backdropFilter:'blur(32px)',border:'1px solid rgba(255,255,255,0.5)',borderRadius:'24px 24px 0 0',padding:'24px 20px 32px',width:'100%',maxWidth:'500px',boxShadow:'0 -8px 40px rgba(0,0,0,0.1)'}}>
        <div style={{width:'36px',height:'4px',background:'rgba(0,0,0,0.1)',borderRadius:'2px',margin:'0 auto 24px'}} />
        <h3 style={{fontSize:'var(--text-md)',fontWeight:800,marginBottom:'4px',color:'rgba(0,0,0,0.85)',letterSpacing:'-0.3px'}}>Solicitar servicio</h3>
        <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.45)',marginBottom: prefillDate ? '12px' : '20px'}}>Con {name} · {helper.price || 'Precio a consultar'}</p>
        {prefillDate && (
          <div style={{display:'flex',alignItems:'center',gap:'6px',
            background:'rgba(123,47,255,0.06)',border:'1px solid rgba(123,47,255,0.1)',
            borderRadius:'10px',padding:'8px 12px',marginBottom:'16px',
          }}>
            <img src="/logo-iso.png" alt="" style={{width:'12px',height:'12px',opacity:0.7}} />
            <span className={styles.purpleLabel}>
              Fecha detectada en la conversación
            </span>
          </div>
        )}
        <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
          {/* Day pills */}
          <div>
            <p style={{fontSize:'var(--text-xs)',fontWeight:700,color:'rgba(0,0,0,0.4)',margin:'0 0 8px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Fecha</p>
            <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px'}}>
              {Array.from({length:7},(_,i)=>{
                const d=new Date(); d.setDate(d.getDate()+i)
                const iso=d.toISOString().split('T')[0]
                const lbl=i===0?'Hoy':i===1?'Mañana':d.toLocaleDateString('es-ES',{weekday:'short',day:'numeric'})
                return (
                  <button key={i} onClick={()=>setDate(iso)} style={{
                    flexShrink:0,padding:'8px 14px',
                    background:date===iso?'var(--purple)':'rgba(0,0,0,0.05)',
                    color:date===iso?'white':'rgba(0,0,0,0.6)',
                    border:'none',borderRadius:'100px',fontSize:'var(--text-xs)',fontWeight:600,
                    cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',whiteSpace:'nowrap',
                  }}>{lbl}</button>
                )
              })}
            </div>
          </div>
          {/* Time pills */}
          <div>
            <p style={{fontSize:'var(--text-xs)',fontWeight:700,color:'rgba(0,0,0,0.4)',margin:'0 0 8px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Hora</p>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
              {['9:00','10:00','11:00','12:00','16:00','17:00','18:00','19:00'].map(t=>(
                <button key={t} onClick={()=>setTime(t)} style={{
                  padding:'7px 12px',
                  background:time===t?'var(--purple)':'rgba(0,0,0,0.05)',
                  color:time===t?'white':'rgba(0,0,0,0.6)',
                  border:'none',borderRadius:'100px',fontSize:'var(--text-xs)',fontWeight:600,
                  cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
                }}>{t}</button>
              ))}
            </div>
          </div>
          <textarea value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Detalles adicionales (opcional)..." rows={3}
            style={{padding:'12px 16px',border:'1px solid rgba(0,0,0,0.1)',borderRadius:'14px',fontSize:'var(--text-base)',outline:'none',resize:'none',fontFamily:'-apple-system,Inter,sans-serif',color:'rgba(0,0,0,0.85)',background:'rgba(0,0,0,0.03)'}} />
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={onClose} style={{flex:1,padding:'14px',background:'rgba(0,0,0,0.05)',color:'rgba(0,0,0,0.55)',border:'none',borderRadius:'100px',fontSize:'var(--text-sm)',fontWeight:600,cursor:'pointer'}}>Cancelar</button>
          <button onClick={()=>{ onConfirm?.(date, time, note); setDone(true); notifyServiceConfirmed(helper.name?.split(' ')?.[0] || helper.name); haptic('success') }} disabled={!date}
            style={{flex:2,padding:'14px',background:date?'var(--purple)':'rgba(0,0,0,0.1)',color:date?'white':'rgba(0,0,0,0.3)',border:'none',borderRadius:'100px',fontSize:'var(--text-sm)',fontWeight:700,cursor:date?'pointer':'default',transition:'all 0.2s'}}>
            Enviar solicitud
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Chat ─────────────────────────────────────────────────────────────
export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { addChat, markRead, hasRated, helpersCache, addService,
    services, getChatHistory, saveChatHistory, user
  } = useUser()
  const [showRegGate, setShowRegGate] = useState(false)

  const [helper, setHelper] = useState(
    helpersCache?.[parseInt(id)] || helpersCache?.[id] || helpersCache?.[String(id)] ||
    HELPERS.filter(Boolean).find(h => String(h.id) === String(id)) || null
  )
  // Clear pending chat from sessionStorage once we're here
  try { sessionStorage.removeItem('nura_pending_chat') } catch {}

  useEffect(() => {
    if (!helper) {
      getHelperById(id).then(h => { if (h) setHelper(h) })
    }
  }, [id])

  const [messages, setMessages] = useState(() => {
    const real = getChatHistory(id)
    if (real?.length > 0) return real
    const demo = location.state?.demoHistory
    if (demo?.length > 0) return demo
    // Demo mode: helper sends a welcome message to feel real
    return []
  })

  // Add welcome message from helper if chat is empty
  useEffect(() => {
    if (messages.length === 0 && helper) {
      const firstName = helper.name?.split(' ')?.[0] || helper.name
      const welcomeMsg = {
        id: 'welcome',
        from: 'helper',
        text: `Hola, soy ${firstName}. Vi que me encontraste a través de Nüra. ¿En qué puedo ayudarte?`,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      }
      setTimeout(() => setMessages([welcomeMsg]), 800)
    }
  }, [helper])
  const hasHistory = (getChatHistory(id)?.length > 0) || (location.state?.demoHistory?.length > 0)
  const userQuery = location.state?.userQuery || window.__nuraLastQuery
  const fromSearch = !!userQuery && !hasHistory

  // Pre-fill input with contextual message when coming from search
  const buildPreFill = (helper, query) => {
    if (!helper || !query) return ''
    const name = helper.name?.split(' ')?.[0] || ''
    // Clean up the query — remove trailing punctuation, make it lowercase if it starts as such
    const q = query.trim().replace(/[.?!]+$/, '')
    return `Hola ${name}, ${q}. ¿Puedes ayudarme?`
  }

  const [input, setInput] = useState(() =>
    (!!location.state?.userQuery || !!window.__nuraLastQuery) && !hasHistory
      ? buildPreFill(
          helpersCache?.[parseInt(id)] || helpersCache?.[id] ||
          HELPERS.filter(Boolean).find(h => String(h.id) === String(id)),
          location.state?.userQuery || window.__nuraLastQuery
        )
      : ''
  )
  const [suggested, setSuggested] = useState('')
  const [typing, setTyping] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [msgCount, setMsgCount] = useState(() => Math.floor((getChatHistory(id)?.filter(m => m.from === 'helper')?.length || 0)))
  const [listening, setListening] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!helper) return
    setSuggested(generateFirstMessage(helper))
    markRead?.(helper.id)

    // Send initial greeting if no history
    if (!hasHistory) {
      setTyping(true)
      const delay = 800 + Math.random() * 400
      setTimeout(() => {
        setTyping(false)
        const greeting = getHelperReply(helper, 0, '')
        const greetMsg = {
          id: Date.now(),
          from: 'helper',
          text: greeting,
          time: new Date().toISOString()
        }
        setMessages([greetMsg])
      }, delay)
    }
  }, [helper?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  // Persist chat history per helper
  useEffect(() => {
    if (messages.length > 0 && helper) {
      saveChatHistory(id, messages)
    }
  }, [messages])

  if (!helper) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100dvh',background:'#F7F7F9'}}>
      <img src="/logo-iso.png" alt="" style={{width:'40px',opacity:0.4,animation:'pulse 1.5s infinite'}} />
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
    addChat?.(helper.id, helper.name, helper.avatarColor, helper.avatar, msg)

    // After first contact, Nüra will follow up asking for feedback (simulated, 3s after reply)
    const isFirstContact = msgCount === 0
    setTyping(true)
    const delay = 1000 + Math.random() * 600
    setTimeout(() => {
      setTyping(false)
      const replyText = getHelperReply(helper, msgCount, msg)
      const reply = { id: Date.now() + 1, text: replyText, from: 'helper', time: new Date().toISOString() }
      // Log for future Claude analysis (silently)
      if (helper.isFromSupabase) {
        appendHelperChatLog(helper.id, msg, replyText).catch(() => {})
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

      {/* Floating header */}
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={17} />
        </button>

        <div className={styles.helperInfo} onClick={() => navigate(`/helper/${helper.id}`, { state: { helper } })}>
          {helper.avatarUrl
            ? <img src={helper.avatarUrl} alt={helper.name} className={styles.avatarImg} />
            : <div className={styles.avatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
          }
          <div className={styles.helperMeta}>
            <div className={styles.helperName}>
              {chatDisplayName}
              {helper.founder && <Award size={11} color='#92400E' style={{marginLeft:'3px',verticalAlign:'middle'}} />}
              {helper.dniVerified && <Shield size={10} color='var(--green)' style={{marginLeft:'3px',verticalAlign:'middle'}} />}
            </div>
            <div className={styles.helperStatus} style={{display:'flex',alignItems:'center',gap:'4px',minWidth:0}}>
              {typing
                ? <span className={styles.typingStatus}>escribiendo...</span>
                : <>
                    <span className={styles.onlineDot} style={{flexShrink:0}} />
                    <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:0}}>{chatSpecialty}</span>
                    {helper.rating && (
                      <span style={{flexShrink:0,fontSize:'10px',color:'rgba(0,0,0,0.4)'}}>
                        ★ {helper.rating}
                      </span>
                    )}
                    {helper.verified && (
                      <span style={{
                        flexShrink:0,fontSize:'9px',fontWeight:600,
                        color:'#065f46',background:'rgba(16,185,129,0.12)',
                        borderRadius:'99px',padding:'1px 5px',whiteSpace:'nowrap'
                      }}>✓ Verif.</span>
                    )}
                  </>
              }
            </div>
          </div>
        </div>

        <button className={styles.contractBtn} onClick={() => serviceState === 'Valorar' ? setShowRating(true) : setShowConfirm(true)}>
          <Calendar size={13} /> {serviceState}
        </button>

      </header>

      {/* Messages — full screen */}
      <div className={styles.messages}>

        {/* System note */}
        <div className={styles.systemNote}>
          <Shield size={11} /> Chat seguro · Comparte datos personales solo cuando confíes
        </div>

        {/* Empty state */}
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            {helper.avatarUrl
              ? <img src={helper.avatarUrl} alt={helper.name} className={styles.emptyChatImg} />
              : <div className={styles.emptyChatAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
            }
            {fromSearch && userQuery ? (
              <div style={{
                background:'linear-gradient(135deg,rgba(123,47,255,0.06),rgba(0,212,200,0.04))',
                border:'1px solid rgba(123,47,255,0.12)',
                borderRadius:'14px',padding:'10px 14px',
                marginBottom:'4px',maxWidth:'260px',textAlign:'left',
              }}>
                <p style={{fontSize:'var(--text-xs)',fontWeight:700,color:'var(--purple)',margin:'0 0 4px',
                  letterSpacing:'0.3px',textTransform:'uppercase'}}>Mensaje sugerido</p>
                <p style={{fontSize:'var(--text-xs)',color:'rgba(0,0,0,0.5)',margin:0,lineHeight:1.6}}>
                  Revisa el mensaje antes de enviarlo.
                </p>
              </div>
            ) : null}
            <p className={styles.emptyChatName}>{helper.name}</p>
            <p className={styles.emptyChatDesc}>{helper.specialty} · {helper.zone}</p>
            {helper.price && <p className={styles.emptyChatPrice}>{helper.price}</p>}
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'center',marginTop:'4px'}}>
              {helper.dniVerified && <span style={{fontSize:'var(--text-xs)',color:'var(--green)',background:'var(--green-light)',border:'1px solid rgba(5,150,105,0.15)',borderRadius:'100px',padding:'3px 10px',fontWeight:600}}>Verificado</span>}
              {helper.available && <span style={{fontSize:'var(--text-xs)',color:'var(--green)',background:'var(--green-light)',border:'1px solid rgba(5,150,105,0.15)',borderRadius:'100px',padding:'3px 10px',fontWeight:600}}>● Disponible</span>}
              <span style={{fontSize:'var(--text-xs)',color:'rgba(0,0,0,0.4)',background:'rgba(0,0,0,0.04)',borderRadius:'100px',padding:'3px 10px'}}>⭐ {helper.rating} · {helper.reviews} reseñas</span>
            </div>
            {/* Conversation starters */}
            <div style={{display:'flex',flexDirection:'column',gap:'8px',marginTop:'20px',width:'100%',maxWidth:'280px'}}>
              <p style={{fontSize:'var(--text-xs)',color:'rgba(0,0,0,0.4)',textAlign:'center',margin:0}}>Empieza la conversación</p>
              {[
                `¿Tienes disponibilidad esta semana?`,
                `¿Cuánto cobras por sesión?`,
                `¿Puedes contarme más sobre tu experiencia?`,
              ].map((q,i) => (
                <button key={i}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding:'11px 16px',
                    background:'rgba(255,255,255,0.85)',
                    border:'1px solid rgba(0,0,0,0.08)',
                    borderRadius:'14px',
                    fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.7)',
                    cursor:'pointer',textAlign:'left',
                    fontFamily:'-apple-system,"Inter",sans-serif',
                    transition:'opacity 0.15s',
                  }}>
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
            <div key={msg.id} className={`${styles.msg} ${msg.from === 'user' ? styles.msgUser : styles.msgHelper}`} style={{animation:`fadeInUp 0.25s ease-out forwards`}}>
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
              <div className={`${styles.msgBubble} ${isNura ? styles.msgBubbleNura : ''}`}>
                <p>{msg.text}</p>
                {isNura && msg.chips && (
                  <div style={{display:'flex',gap:'6px',marginTop:'8px',flexWrap:'wrap'}}>
                    {msg.chips.map((chip, ci) => (
                      <button key={ci}
                        onClick={() => {
                          if (chip === 'Confirmar reserva') { setShowConfirm(true); return }
                          if (chip === 'Todavía no') return
                          sendMessage(chip)
                        }}
                        style={{
                          padding:'5px 12px',borderRadius:'100px',fontSize:'var(--text-xs)',fontWeight:600,
                          cursor:'pointer',border:'none',
                          background: chip === 'Confirmar reserva'
                            ? 'var(--purple)' : 'rgba(0,0,0,0.07)',
                          color: chip === 'Confirmar reserva' ? 'white' : 'rgba(0,0,0,0.6)',
                          fontFamily:'inherit',
                        }}>
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
                <span className={msg.from === 'user' ? styles.msgTime : styles.msgTimeHelper}>{formatTime(msg.time)}</span>
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

        {/* Quick replies */}
        {showQuickReplies && (
          <div className={styles.quickReplies}>
            {QUICK_REPLIES.map((r, i) => (
              <button key={i} className={styles.quickReply} onClick={() => sendMessage(r)}>{r}</button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Nüra suggestion for first message */}
      {suggested && messages.length === 0 && (
        <div className={styles.suggestionBar}>
          <span className={styles.suggestionLabel}>Nüra sugiere</span>
          <button className={styles.suggestionText} onClick={() => sendMessage(suggested)}>{suggested}</button>
        </div>
      )}

      {/* Floating input */}
      <div className={styles.inputWrap}>
        <div className={styles.inputBar}>
          <button className={styles.plusBtn}><Plus size={18} /></button>
          <input className={styles.input}
            placeholder="Escribe un mensaje..."
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
          {input.trim()
            ? <button className={styles.sendBtn} onClick={() => sendMessage()}><Send size={16} /></button>
            : <button className={`${styles.sendBtn} ${listening ? styles.micActive : styles.micBtn}`} onClick={toggleMic}>
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
          onConfirm={(date, time, note) => { addService(helper, date, time, note) }}
        />
      })()}
    </div>
  )
}
