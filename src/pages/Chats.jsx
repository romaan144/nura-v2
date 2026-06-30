import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useNavigate } from 'react-router-dom'
import { Search, MessageCircle } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { HELPERS } from '../data/helpers'
import styles from './Chats.module.css'

// ── REALISTIC DEMO CONVERSATIONS ─────────────────────────────────────────
// These simulate what the app looks like with active users.
// Each conversation is plausible and specific — not generic.
const DEMO_CHATS = [
  {
    helperId: 5,
    helperName: "Elena Fernández Ros",
    avatarUrl: "https://api.dicebear.com/9.x/personas/svg?seed=ElenaFernandez",
    helperColor: "var(--green)",
    helperAvatar: "EF",
    lastMsg: "Mañana a las 9:30 en su domicilio entonces. Le mando la ubicación por aquí.",
    lastTime: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    unread: 1,
  },
  {
    helperId: 1,
    helperName: "Carlos Martínez Vidal",
    avatarUrl: "https://api.dicebear.com/9.x/personas/svg?seed=CarlosMartinez",
    helperColor: "#1A56DB",
    helperAvatar: "CM",
    lastMsg: "Perfecto, el jueves a las 17h para la primera sesión. La niña no necesita traer nada.",
    lastTime: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
    unread: 0,
  },
  {
    helperId: 3,
    helperName: "Roberto Sánchez Ferrer",
    avatarUrl: "https://api.dicebear.com/9.x/personas/svg?seed=RobertoSanchez",
    helperColor: "#1E40AF",
    helperAvatar: "RS",
    lastMsg: "Ya está revisada. Era la válvula de expansión. Le dejo factura en el buzón.",
    lastTime: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    unread: 0,
  },
  {
    helperId: 7,
    helperName: "Lucía Vidal Torres",
    avatarUrl: "https://api.dicebear.com/9.x/personas/svg?seed=LuciaVidal",
    helperColor: "#DB2777",
    helperAvatar: "LV",
    lastMsg: "Esta semana repasamos álgebra, que es donde más le cuesta. Avanzando bien.",
    lastTime: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    unread: 0,
  },
  {
    helperId: 9,
    helperName: "Dra. Carme Solà Puig",
    avatarUrl: "https://api.dicebear.com/9.x/personas/svg?seed=CarmeSola",
    helperColor: "#7C3AED",
    helperAvatar: "CS",
    lastMsg: "Para la próxima sesión intente el ejercicio de diario que comentamos. Hasta el viernes.",
    lastTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    unread: 0,
  },
]

// Per-chat realistic message histories
export const DEMO_HISTORIES = {
  5: [
    { id: 1, from: 'user', text: 'Hola Elena, me pusieron en contacto contigo como auxiliar de geriatría. Mi madre tiene 78 años y vive sola en el Eixample, necesitaría ayuda las mañanas de lunes a viernes.', time: new Date(Date.now() - 1000*60*60*3).toISOString() },
    { id: 2, from: 'profesional', text: '¡Hola! Sí, claro. ¿Qué tipo de ayuda necesita principalmente? ¿Más asistencia con la higiene personal, compañía, o gestión de medicación?', time: new Date(Date.now() - 1000*60*60*2.8).toISOString() },
    { id: 3, from: 'user', text: 'Sobre todo compañía y que le ayude a preparar el desayuno y la medicación. Tiene Alzheimer en fase inicial.', time: new Date(Date.now() - 1000*60*60*2.5).toISOString() },
    { id: 4, from: 'profesional', text: 'Entiendo perfectamente. Tengo experiencia específica con Alzheimer en fase inicial y en esa zona además. ¿Podría ser de 9 a 13h? Mi tarifa para ese horario sería de 14€/h.', time: new Date(Date.now() - 1000*60*60*2).toISOString() },
    { id: 5, from: 'user', text: 'Perfecto, nos encajaría bien. ¿Podría empezar esta semana para que mi madre la conozca?', time: new Date(Date.now() - 1000*60*35).toISOString() },
    { id: 6, from: 'profesional', text: 'Mañana a las 9:30 en su domicilio entonces. Le mando la ubicación por aquí.', time: new Date(Date.now() - 1000*60*12).toISOString() },
  ],
  1: [
    { id: 1, from: 'user', text: 'Hola Carlos, busco logopeda para mi hija de 6 años. Tiene dificultad con la R y algunos fonemas.', time: new Date(Date.now() - 1000*60*60*5).toISOString() },
    { id: 2, from: 'profesional', text: '¡Hola! La dislalia de la R es muy común a esa edad y tiene muy buen pronóstico con tratamiento. ¿Ha tenido evaluación previa o sería la primera vez?', time: new Date(Date.now() - 1000*60*60*4.5).toISOString() },
    { id: 3, from: 'user', text: 'Primera vez. El colegio nos lo recomendó pero no hemos ido a nadie todavía.', time: new Date(Date.now() - 1000*60*60*4).toISOString() },
    { id: 4, from: 'profesional', text: 'Perfecto, haríamos primero una sesión de evaluación (45 min, 50€) y de ahí establecemos el plan. Suelo trabajar en Gràcia, ¿les queda bien la zona?', time: new Date(Date.now() - 1000*60*60*3.5).toISOString() },
    { id: 5, from: 'user', text: 'Sí, vivimos en Gràcia. ¿Tiene hueco esta semana?', time: new Date(Date.now() - 1000*60*90).toISOString() },
    { id: 6, from: 'profesional', text: 'Perfecto, el jueves a las 17h para la primera sesión. La niña no necesita traer nada.', time: new Date(Date.now() - 1000*60*58).toISOString() },
  ],
  3: [
    { id: 1, from: 'user', text: 'Urgente, la caldera no da calefacción. Tenemos 3 niños en casa.', time: new Date(Date.now() - 1000*60*60*8).toISOString() },
    { id: 2, from: 'profesional', text: '¡Entendido, salgo en 40 minutos! Dígame la dirección y el modelo de caldera si lo sabe.', time: new Date(Date.now() - 1000*60*60*7.8).toISOString() },
    { id: 3, from: 'user', text: 'Carrer de Còrsega 287, 3º 2ª. La caldera es una Roca Victoria 20.', time: new Date(Date.now() - 1000*60*60*7.5).toISOString() },
    { id: 4, from: 'profesional', text: 'Perfecto. Conozco bien ese modelo. Llevo recambios habituales por si hace falta.', time: new Date(Date.now() - 1000*60*60*7).toISOString() },
    { id: 5, from: 'user', text: '¿Cuánto puede costar aproximadamente?', time: new Date(Date.now() - 1000*60*60*6.5).toISOString() },
    { id: 6, from: 'profesional', text: 'Visita + mano de obra 65€, más recambios si hacen falta. Cuando vea lo que es le confirmo.', time: new Date(Date.now() - 1000*60*60*6).toISOString() },
    { id: 7, from: 'profesional', text: 'Ya está revisada. Era la válvula de expansión. Le dejo factura en el buzón.', time: new Date(Date.now() - 1000*60*60*4).toISOString() },
  ],
  7: [
    { id: 1, from: 'user', text: 'Hola Lucía, busco profesora particular para mi hijo de 3º ESO. Suspende mates y física.', time: new Date(Date.now() - 1000*60*60*50).toISOString() },
    { id: 2, from: 'profesional', text: '¡Hola! ¿Sabes si tiene más dificultad con álgebra o con geometría? ¿Y en física más con problemas o con la teoría?', time: new Date(Date.now() - 1000*60*60*49).toISOString() },
    { id: 3, from: 'user', text: 'Álgebra sobre todo. La física no la entiende en general.', time: new Date(Date.now() - 1000*60*60*48).toISOString() },
    { id: 4, from: 'profesional', text: 'Perfecto, son cosas muy trabajables. Hago clases los martes y jueves de 17 a 19h, 30€/hora. ¿Le viene bien?', time: new Date(Date.now() - 1000*60*60*47).toISOString() },
    { id: 5, from: 'user', text: 'Sí, los martes perfecto. ¿Puede ser en casa?', time: new Date(Date.now() - 1000*60*60*30).toISOString() },
    { id: 6, from: 'profesional', text: 'Esta semana repasamos álgebra, que es donde más le cuesta. Avanzando bien.', time: new Date(Date.now() - 1000*60*60*26).toISOString() },
  ],
  9: [
    { id: 1, from: 'user', text: 'Hola, busco psicóloga. Llevo meses con ansiedad generalizada y no duermo bien.', time: new Date(Date.now() - 1000*60*60*72).toISOString() },
    { id: 2, from: 'profesional', text: 'Hola. Gracias por dar el paso, sé que no es fácil. ¿Cuánto tiempo llevas así? ¿Ha habido algún acontecimiento específico o ha ido apareciendo gradualmente?', time: new Date(Date.now() - 1000*60*60*71).toISOString() },
    { id: 3, from: 'user', text: 'Gradualmente, desde hace unos 8 meses. Mucho estrés en el trabajo y no desconecto nunca.', time: new Date(Date.now() - 1000*60*60*70).toISOString() },
    { id: 4, from: 'profesional', text: 'Es muy frecuente ese patrón. Trabajo principalmente con TCC y mindfulness para estos casos. La primera sesión es de evaluación, 60€. ¿Prefiere presencial u online?', time: new Date(Date.now() - 1000*60*60*69).toISOString() },
    { id: 5, from: 'user', text: 'Presencial si puede ser, creo que me va mejor. ¿Cuándo tiene hueco?', time: new Date(Date.now() - 1000*60*60*52).toISOString() },
    { id: 6, from: 'profesional', text: 'Para la próxima sesión intente el ejercicio de diario que comentamos. Hasta el viernes.', time: new Date(Date.now() - 1000*60*60*48).toISOString() },
  ],
}

function formatChatTime(isoStr) {
  if (!isoStr) return ''
  const d    = new Date(isoStr)
  const now  = new Date()
  const mins  = Math.floor((now - d) / 60000)
  const hours = Math.floor((now - d) / 3600000)
  const days  = Math.floor((now - d) / 86400000)
  if (mins  <  1) return 'ahora'
  if (mins  < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days  <  7) return `${days}d`
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function Chats() {
  const navigate  = useNavigate()
  const { chats, markRead, helpersCache, getChatHistory } = useUser()
  const [search, setSearch] = useState('')

  function getHelper(id) {
    return helpersCache?.[id]
      || helpersCache?.[parseInt(id)]
      || HELPERS.filter(Boolean).find(h => String(h.id) === String(id))
  }

  // Merge: real chats take priority, demo fills the rest
  const realIds = new Set((chats||[]).map(c => String(c.helperId)))
  const demosToShow = DEMO_CHATS.filter(d => !realIds.has(String(d.helperId)))
  const allChats = [
    ...(chats||[]).filter(Boolean),
    ...demosToShow,
  ].sort((a,b) => new Date(b.lastTime) - new Date(a.lastTime))

  const filtered = search.trim()
    ? allChats.filter(c =>
        c.helperName?.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMsg?.toLowerCase().includes(search.toLowerCase())
      )
    : allChats

  return (
    <div className={styles.page}>
      <PageHeader />

      <div className={styles.searchWrap}>
        <div className={styles.searchBox}>
          <Search size={14} color="rgba(0,0,0,0.35)" />
          <input
            className={styles.searchInput}
            placeholder="Buscar conversaciones..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.list}>
        {allChats.length === 0 && (
          <div style={{textAlign:'center',padding:'64px 24px 32px',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
            <MessageCircle size={44} strokeWidth={1.3} color='rgba(0,0,0,0.15)' style={{marginBottom:'4px'}} />
            <p style={{fontSize:'var(--text-sm)',fontWeight:600,color:'var(--ink-primary)'}}>Aquí aparecerán tus conversaciones</p>
            <p style={{fontSize:'var(--text-xs)',color:'var(--ink-tertiary)',lineHeight:1.6,maxWidth:'220px'}}>Cuando contactes con un profesional, la conversación aparecerá aquí.</p>
            <button
              onClick={() => navigate('/')}
              style={{marginTop:'8px',padding:'10px 20px',background:'var(--purple)',color:'white',border:'none',borderRadius:'100px',fontSize:'var(--text-xs)',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              Buscar ahora
            </button>
          </div>
        )}

        {filtered.length === 0 && search.trim() && (
          <div style={{textAlign:'center',padding:'48px 24px',color:'var(--ink-tertiary)'}}>
            <Search size={36} color='rgba(0,0,0,0.12)' strokeWidth={1.3} style={{marginBottom:'12px'}}/>
            <p style={{fontSize:'var(--text-sm)',fontWeight:500}}>Sin resultados para "{search}"</p>
            <p style={{fontSize:'var(--text-xs)',marginTop:'4px'}}>Prueba con el nombre del profesional</p>
          </div>
        )}
        {filtered.map((chat, i) => {
          const helper = getHelper(chat.helperId)
          const isDemo = demosToShow.some(d => d.helperId === chat.helperId)
          return (
            <button key={i}
              className={`${styles.chatRow} ${chat.unread > 0 ? styles.chatUnread : ''}`}
              onClick={() => {
                markRead?.(chat.helperId)
                // For demo chats, pass history in state so Chat page shows it
                const demoHistory = DEMO_HISTORIES[chat.helperId]
                const helperData  = helper || {
                  id: chat.helperId,
                  name: chat.helperName,
                  avatarUrl: chat.avatarUrl,
                  avatarColor: chat.helperColor,
                  avatar: chat.helperAvatar,
                  specialty: '',
                }
                navigate(`/chat/${chat.helperId}`, {
                  state: { helper: helperData, demoHistory: isDemo ? demoHistory : undefined }
                })
              }}>

              <div className={styles.avatarWrap}>
                {chat.avatarUrl
                  ? <img src={chat.avatarUrl} alt={chat.helperName} className={styles.avatarImg} />
                  : <div className={styles.avatar} style={{background: chat.helperColor}}>{chat.helperAvatar}</div>
                }
                {/* Online status — green if active recently */}
                <span className={styles.onlineDot} style={{
                  background: chat.unread > 0 ? 'var(--green-dot)' 
                    : (new Date() - new Date(chat.lastTime)) < 1000*60*60*2 ? 'var(--green-dot)'
                    : (new Date() - new Date(chat.lastTime)) < 1000*60*60*24 ? 'var(--amber)'
                    : 'rgba(0,0,0,0.2)',
                }} />
              </div>

              <div className={styles.chatInfo}>
                <div className={styles.chatTop}>
                  <span className={styles.chatName}>{chat.helperName}</span>
                  <span className={styles.chatTime}>{formatChatTime(chat.lastTime)}</span>
                </div>
                <div className={styles.chatBottom}>
                  <span className={styles.chatLastMsg}>{chat.lastMsg}</span>
                  {chat.unread > 0 && <span className={styles.unreadBadge}>{chat.unread}</span>}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
