import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CheckCircle, ChevronRight, Star, ClipboardList, MessageCircle, RotateCcw } from 'lucide-react'
import { useUser } from '../context/UserContext'
import PageHeader from '../components/PageHeader'
import styles from './MyServices.module.css'

// Demo services for realistic preview
const DEMO_SERVICES = [
  {
    id: 'demo1',
    helperId: 5,
    helperName: 'Elena Fernández Ros',
    specialty: 'Auxiliar de geriatría',
    avatarUrl: 'https://api.dicebear.com/9.x/personas/svg?seed=ElenaFernandez',
    avatarColor: 'var(--green)',
    avatar: 'EF',
    date: (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0] })(),
    time: '09:30',
    note: 'Cuidado matutino, acompañamiento y medicación',
    price: '14€/h',
    status: 'confirmed',
    isDemo: true,
  },
  {
    id: 'demo2',
    helperId: 1,
    helperName: 'Carlos Martínez Vidal',
    specialty: 'Logopeda',
    avatarUrl: 'https://api.dicebear.com/9.x/personas/svg?seed=CarlosMartinez',
    avatarColor: '#1A56DB',
    avatar: 'CM',
    date: (() => { const d = new Date(); d.setDate(d.getDate()+3); return d.toISOString().split('T')[0] })(),
    time: '17:00',
    note: 'Primera sesión de evaluación — Sofía',
    price: '50€/sesión',
    status: 'pending',
    isDemo: true,
  },
  {
    id: 'demo3',
    helperId: 3,
    helperName: 'Roberto Sánchez Ferrer',
    specialty: 'Técnico de calderas',
    avatarUrl: 'https://api.dicebear.com/9.x/personas/svg?seed=RobertoSanchez',
    avatarColor: '#1E40AF',
    avatar: 'RS',
    date: (() => { const d = new Date(); d.setDate(d.getDate()-2); return d.toISOString().split('T')[0] })(),
    time: '11:00',
    note: 'Revisión caldera — reparación válvula expansión',
    price: '65€',
    status: 'completed',
    isDemo: true,
    rated: true,
  },
]

const STATUS = {
  pending:   { label: 'Pendiente',   color: '#D97706', bg: '#FFFBEB' },
  confirmed: { label: 'Confirmado',  color: 'var(--green)', bg: 'var(--green-light)' },
  completed: { label: 'Completado',  color: '#6B7280', bg: '#F9FAFB' },
  cancelled: { label: 'Cancelado',   color: 'var(--red)', bg: 'var(--red-light)' },
}

const TABS = ['Todos', 'Próximos', 'Completados']

export default function MyServices() {
  const navigate = useNavigate()
  const { services, addRating, hasRated, updateService, user } = useUser()
  const [tab, setTab] = useState('Todos')
  const [ratingModal, setRatingModal] = useState(null)
  const [ratingVal, setRatingVal] = useState(5)
  const [ratingText, setRatingText] = useState('')
  const [ratingSent, setRatingSent] = useState(false)

  // Merge real + demo (real take priority by helperId)
  const realIds = new Set((services||[]).map(s => String(s.helperId)))
  // Show demo services only to guests — authenticated users see only real data
  const demosToShow = !user ? DEMO_SERVICES.filter(d => !realIds.has(String(d.helperId))) : []
  const allServices = [...(services||[]), ...demosToShow]

  const filtered = allServices.filter(s => {
    if (tab === 'Próximos')   return s.status === 'pending' || s.status === 'confirmed'
    if (tab === 'Completados') return s.status === 'completed'
    return true
  })

  function submitRating() {
    if (!ratingModal) return
    addRating(ratingModal.helperId, ratingVal, ratingText)
    updateService(ratingModal.id, { status: 'completed', rated: true })
    setRatingSent(true)
    setTimeout(() => { setRatingModal(null); setRatingSent(false); setRatingText('') }, 1800)
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      const today = new Date(); today.setHours(0,0,0,0)
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1)
      const dayAfter = new Date(today); dayAfter.setDate(dayAfter.getDate()+2)
      d.setHours(0,0,0,0)
      if (d.getTime() === today.getTime()) return 'Hoy'
      if (d.getTime() === tomorrow.getTime()) return 'Mañana'
      if (d.getTime() === dayAfter.getTime()) return 'Pasado mañana'
      return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    } catch { return dateStr }
  }

  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.content}>
        <h2 className={styles.title}>Mis servicios</h2>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}>
              {t}
              {t === 'Próximos' && tab !== 'Próximos' && (services||[]).filter(s => s.status === 'pending' || s.status === 'confirmed').length > 0 && (
                <span className={styles.tabBadge}>
                  {(services||[]).filter(s => s.status === 'pending' || s.status === 'confirmed').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <span style={{display:'block',marginBottom:'12px',opacity:0.25}}>
              {tab === 'Completados' ? <CheckCircle size={44} /> : tab === 'Próximos' ? <Calendar size={44} /> : <ClipboardList size={44} />}
            </span>
            <strong style={{fontSize:'16px',color:'var(--ink-primary)',letterSpacing:'-0.2px'}}>
              {tab === 'Todos' ? 'Aún no has contratado nada'
               : tab === 'Próximos' ? 'No tienes servicios próximos'
               : 'Sin servicios completados'}
            </strong>
            <p style={{fontSize:'var(--text-sm)',color:'var(--ink-tertiary)',margin:'4px 0 16px',lineHeight:1.6,textAlign:'center',maxWidth:'220px'}}>
              {tab === 'Todos'
                ? 'Cuando contrates a un profesional y concretéis una cita, aparecerá aquí.'
                : tab === 'Próximos'
                ? 'Cuando reserves una cita, aparecerá aquí con todos los detalles.'
                : 'Cuando finalices un servicio podrás valorar al profesional.'}
            </p>
            <button className={styles.emptyBtn} onClick={() => navigate('/')}>
              Buscar profesionales
            </button>
          </div>
        )}

        {/* Service list */}
        <div className={styles.list}>
          {filtered.map(s => {
            const st = STATUS[s.status] || STATUS.pending
            const rated = hasRated(s.helperId) || s.rated
            return (
              <div key={s.id} className={styles.card}
                onClick={() => navigate(`/helper/${s.helperId}`)}>
                <div className={styles.cardMain}>
                  {/* Avatar */}
                  {s.avatarUrl
                    ? <img src={s.avatarUrl} alt="" className={styles.avatar} />
                    : <div className={styles.avatarFallback} style={{background: s.avatarColor || '#7B2FFF'}}>
                        {s.avatar || s.helperName?.[0] || '?'}
                      </div>
                  }

                  {/* Info */}
                  <div className={styles.info}>
                    <div className={styles.helperName}>{s.helperName}</div>
                    <div className={styles.specialty}>{s.specialty}</div>
                    <div className={styles.meta}>
                      <Calendar size={11} />
                      <span>{formatDate(s.date)}{s.time ? ` · ${s.time}` : ''}</span>
                    </div>
                    {s.note && <div className={styles.note}>"{s.note}"</div>}
                  </div>

                  {/* Right */}
                  <div className={styles.right}>
                    {s.price && <span className={styles.price}>{s.price}</span>}
                    <span className={styles.statusBadge}
                      style={{color: st.color, background: st.bg}}>
                      {st.label}
                    </span>
                    <ChevronRight size={14} color="rgba(0,0,0,0.25)" />
                  </div>
                </div>

                {/* Rate CTA */}
                {/* Pending/confirmed → mark complete */}
                {(s.status === 'pending' || s.status === 'confirmed') && !rated && (
                  <div className={styles.postActions}>
                    <button className={styles.rateBtn}
                      onClick={e => { e.stopPropagation(); updateService(s.id, { status: 'completed' }); setRatingModal({...s, status:'completed'}); setRatingVal(5) }}
                      style={{flex:1}}>
                      <CheckCircle size={13} /> Marcar completado y valorar
                    </button>
                  </div>
                )}

                {/* Completed + not yet rated → rate CTA */}
                {s.status === 'completed' && !rated && (
                  <div className={styles.postActions}>
                    <button className={styles.actionBtn}
                      onClick={e => { e.stopPropagation(); setRatingModal(s); setRatingVal(5) }}>
                      <Star size={12} /> Valorar a {s.helperName?.split(' ')?.[0]}
                    </button>
                    <button className={styles.actionBtnSecondary}
                      onClick={e => { e.stopPropagation(); navigate(`/chat/${s.helperId}`, { state: { helper: { id: s.helperId, name: s.helperName, specialty: s.specialty, avatarUrl: s.avatarUrl } } }) }}>
                      <MessageCircle size={12} /> Escribir
                    </button>
                  </div>
                )}

                {/* Completed + rated → rebooking CTA */}
                {rated && (
                  <div className={styles.postActions}>
                    <div className={styles.ratedRow} style={{flex:1}}>
                      <CheckCircle size={12} color="var(--green)" />
                      <span>Valorado</span>
                    </div>
                    <button className={styles.actionBtnSecondary}
                      onClick={e => { e.stopPropagation(); navigate('/') }}>
                      <RotateCcw size={11} /> Buscar de nuevo
                    </button>
                    <button className={styles.actionBtnSecondary}
                      onClick={e => { e.stopPropagation(); navigate(`/chat/${s.helperId}`, { state: { helper: { id: s.helperId, name: s.helperName, specialty: s.specialty, avatarUrl: s.avatarUrl } } }) }}>
                      <MessageCircle size={11} /> Repetir
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Rating modal */}
      {ratingModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',WebkitBackdropFilter: 'blur(8px)', backdropFilter:'blur(8px)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:'rgba(255,255,255,0.96)',WebkitBackdropFilter: 'blur(32px)', backdropFilter:'blur(32px)',borderRadius:'24px 24px 0 0',padding:'24px 20px 36px',width:'100%',maxWidth:'500px'}}>
            <div style={{width:'36px',height:'4px',background:'rgba(0,0,0,0.1)',borderRadius:'2px',margin:'0 auto 20px'}} />
            {ratingSent ? (
              <div style={{textAlign:'center',padding:'20px 0',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px'}}>
                <Star size={44} color='var(--amber)' fill='var(--amber)' strokeWidth={1.5} />
                <h3 style={{fontSize:'var(--text-md)',fontWeight:800,color:'rgba(0,0,0,0.85)',margin:0,letterSpacing:'-0.3px'}}>¡Gracias por valorar!</h3>
                <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.45)',margin:0}}>Tu valoración ayuda a toda la comunidad.</p>
              </div>
            ) : (
              <>
                <h3 style={{fontSize:'var(--text-md)',fontWeight:800,margin:'0 0 4px',color:'rgba(0,0,0,0.85)',letterSpacing:'-0.3px'}}>
                  Valorar a {ratingModal.helperName?.split(' ')?.[0]}
                </h3>
                <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.4)',margin:'0 0 20px'}}>{ratingModal.specialty}</p>
                <div style={{display:'flex',gap:'6px',justifyContent:'center',marginBottom:'16px'}}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRatingVal(n)}
                      style={{fontSize:'34px',background:'none',border:'none',cursor:'pointer',opacity:n<=ratingVal?1:0.25,transition:'opacity 0.15s'}}>
                      <Star size={18} fill={ratingVal >= n ? 'var(--amber)' : 'none'} color='var(--amber)' />
                    </button>
                  ))}
                </div>
                <textarea value={ratingText} onChange={e=>setRatingText(e.target.value)}
                  placeholder="¿Qué destacarías? (opcional)" rows={3}
                  style={{width:'100%',padding:'12px 16px',border:'1px solid rgba(0,0,0,0.1)',borderRadius:'14px',fontSize:'var(--text-base)',outline:'none',resize:'none',fontFamily:'inherit',background:'rgba(0,0,0,0.03)',boxSizing:'border-box',marginBottom:'12px'}} />
                <div style={{display:'flex',gap:'8px'}}>
                  <button onClick={() => setRatingModal(null)}
                    style={{flex:1,padding:'13px',background:'rgba(0,0,0,0.05)',color:'rgba(0,0,0,0.55)',border:'none',borderRadius:'100px',fontSize:'var(--text-sm)',fontWeight:600,cursor:'pointer'}}>
                    Cancelar
                  </button>
                  <button onClick={submitRating}
                    style={{flex:2,padding:'13px',background:'var(--purple)',color:'white',border:'none',borderRadius:'var(--radius-full)',fontSize:'var(--text-sm)',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                    Enviar valoración
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
