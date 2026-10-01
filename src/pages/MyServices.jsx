import { avatarDe, avatarVigente } from '../utils/avatar'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CheckCircle, ChevronRight, Star, ClipboardList, MessageCircle, RotateCcw, Clock, XCircle } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { DEMO_MODE } from '../config'
import PageHeader from '../components/PageHeader'
import EmptyPanel from '../components/EmptyPanel'
import styles from './MyServices.module.css'
import RatingModal from '../components/RatingModal'
import { showToast } from '../components/Toast'
import { yaPaso } from '../utils/citaAviso'

// Demo services for realistic preview
const DEMO_SERVICES = [
  {
    id: 'demo1',
    helperId: 5,
    helperName: 'Elena Fernández Ros',
    specialty: 'Auxiliar de geriatría',
    avatarUrl: avatarDe('ElenaFernandez'),
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
    avatarUrl: avatarDe('CarlosMartinez'),
    avatarColor: '#1A56DB',
    avatar: 'CM',
    date: (() => { const d = new Date(); d.setDate(d.getDate()+3); return d.toISOString().split('T')[0] })(),
    time: '17:00',
    note: 'Primera sesión de evaluación de Sofía',
    price: '50€/sesión',
    status: 'pending',
    isDemo: true,
  },
  {
    id: 'demo3',
    helperId: 3,
    helperName: 'Roberto Sánchez Ferrer',
    specialty: 'Técnico de calderas',
    avatarUrl: avatarDe('RobertoSanchez'),
    avatarColor: '#1E40AF',
    avatar: 'RS',
    date: (() => { const d = new Date(); d.setDate(d.getDate()-2); return d.toISOString().split('T')[0] })(),
    time: '11:00',
    note: 'Revisión de caldera y reparación de la válvula de expansión',
    price: '65€',
    status: 'completed',
    isDemo: true,
    rated: true,
  },
]

const STATUS = {
  pending:   { label: 'Por confirmar', icon: Clock, color: '#915509', bg: '#FFFBEB' },
  confirmed: { label: 'Confirmada', icon: CheckCircle, color: '#216653', bg: '#EAF5EF' },
  completed: { label: 'Completada', icon: CheckCircle, color: '#595367', bg: '#F0EEF4' },
  cancelled: { label: 'Cancelada', icon: XCircle, color: '#A33B46', bg: '#FFF0F1' },
  // El profesional contestó que esa hora no le va (su mensaje está en el chat).
  rejected:  { label: 'Propón otra hora', icon: RotateCcw, color: '#B45309', bg: '#FFFBEB' },
  // Pedida o confirmada, y su hora ya pasó: falta decir si se hizo.
  pasada:    { label: '¿Ya se hizo?', icon: Clock, color: '#595367', bg: '#F0EEF4' },
}

const TABS = ['Todos', 'Próximos', 'Completados']

export default function MyServices() {
  const navigate = useNavigate()
  const { services, hasRated, updateService, user, cancelarCita } = useUser()
  const [tab, setTab] = useState('Todos')
  const [ratingModal, setRatingModal] = useState(null)
  // La cita que se está a punto de cancelar (pide un segundo toque).
  const [aCancelar, setACancelar] = useState(null)
  const [cancelando, setCancelando] = useState(false)

  // Solo se puede cancelar lo que aún no ha pasado.
  const [ahora] = useState(() => Date.now())
  const porVenir = s => {
    if (!s.date || !s.time) return false
    const t = new Date(`${s.date}T${String(s.time).padStart(5, '0')}:00`).getTime()
    return Number.isFinite(t) && t > ahora
  }
  async function cancelar(s) {
    setCancelando(true)
    const r = await cancelarCita({ helperId: s.helperId, fecha: s.date, hora: s.time })
    setCancelando(false)
    if (r === 'fallo') { showToast('Sin conexión: la cita sigue en pie. Prueba otra vez.'); return }
    setACancelar(null)
    showToast('Cita cancelada.')
  }

  // Pedida o confirmada y con la hora ya pasada: ni «próxima» ni cancelable;
  // es el momento de decir si se hizo y valorar. Sin fecha, no se sabe.
  const enCurso = s => s.status === 'pending' || s.status === 'confirmed'
  const pasada = s => enCurso(s) && yaPaso(s.date, s.time, ahora) === true
  const proxima = s => enCurso(s) && !pasada(s)

  // Merge real + demo (real take priority by helperId)
  const realIds = new Set((services||[]).map(s => String(s.helperId)))
  // Show demo services only to guests — authenticated users see only real data
  // Al invitado se le enseñaba un escaparate con citas "Confirmado" que nunca
  // habia pedido. Como escaparate se entiende; como "Mis servicios", es una
  // invencion. En demo se conserva; en produccion el invitado ve la verdad.
  const demosToShow = (DEMO_MODE && !user) ? DEMO_SERVICES.filter(d => !realIds.has(String(d.helperId))) : []
  const allServices = [...(services||[]), ...demosToShow]

  const filtered = allServices.filter(s => {
    if (tab === 'Próximos')   return proxima(s)
    if (tab === 'Completados') return s.status === 'completed'
    return true
  })

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
        <header className={styles.heading}>
          <h1 className={styles.title}>Mis servicios</h1>
          <p className={styles.subtitle}>Tus citas, de la primera propuesta al servicio terminado.</p>
        </header>

        <div className={styles.tabs} role="group" aria-label="Filtrar servicios">
          {TABS.map(t => {
            const count = allServices.filter(s => t === 'Próximos'
              ? proxima(s)
              : t === 'Completados' ? s.status === 'completed' : true).length
            return (
              <button key={t} type="button" aria-pressed={tab === t}
                className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                onClick={() => setTab(t)}>
                <span>{t}</span><span className={styles.tabBadge}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <EmptyPanel
            icon={tab === 'Completados' ? CheckCircle : tab === 'Próximos' ? Calendar : ClipboardList}
            title={tab === 'Todos' ? 'Tus citas aparecerán aquí'
              : tab === 'Próximos' ? 'No tienes servicios próximos'
              : 'Sin servicios completados'}
            hint={tab === 'Todos'
              ? (user?.isHelper
                  ? 'Cuando alguien te contacte y concretéis una cita, aparecerá aquí.'
                  : 'Cuando contrates a un profesional y concretéis una cita, aparecerá aquí.')
              : tab === 'Próximos'
              ? 'Aquí verás los detalles de tus próximas citas cuando estén acordadas.'
              : (user?.isHelper
                  ? 'Cuando termines un servicio, aparecerá aquí con su resultado.'
                  : 'Cuando finalices un servicio podrás valorar al profesional.')}
            actionLabel="Buscar profesionales"
            onAction={() => navigate('/')}
          />
        )}

        {/* Service list */}
        <div className={styles.list}>
          {filtered.map(s => {
            const st = pasada(s) ? STATUS.pasada : (STATUS[s.status] || STATUS.pending)
            const StatusIcon = st.icon
            // Valorada ESTA cita. Antes bastaba con haber valorado alguna vez
            // a la persona: una cita nueva con ella salía «Valorado · Repetir»
            // y sin poder cancelarla ni marcarla como hecha.
            const rated = s.rated || (s.status === 'completed' && hasRated(s.helperId))
            const yaValorada = hasRated(s.helperId)
            return (
              <article key={s.id} className={styles.card} aria-label={`Cita con ${s.helperName}: ${st.label}`}
                style={{ '--service-status': st.color, '--service-status-bg': st.bg }}>
                <div className={styles.statusRow}>
                  <span className={styles.statusBadge}>
                    <StatusIcon size={14} aria-hidden="true" />{st.label}
                  </span>
                  {s.price && <span className={styles.price}>{s.price}</span>}
                </div>
                <button type="button" className={styles.cardMain} aria-label={`Ver perfil de ${s.helperName}`}
                  onClick={() => navigate(`/helper/${s.helperId}`)}>
                  {/* Avatar */}
                  {/* Sin foto, su avatar ilustrado (como en Chats), no una letra. */}
                  {avatarVigente(s.avatarUrl, s.helperName)
                    ? <img src={avatarVigente(s.avatarUrl, s.helperName)} alt="" className={styles.avatar} />
                    : <span className={styles.avatarFallback} style={{background: s.avatarColor || 'var(--purple)'}}>
                        {s.avatar || s.helperName?.[0] || '?'}
                      </span>
                  }

                  {/* Info */}
                  <span className={styles.info}>
                    <span className={styles.helperName}>{s.helperName}</span>
                    <span className={styles.specialty}>{s.specialty}</span>
                    <span className={styles.profileLink}>Ver perfil</span>
                  </span>

                  <ChevronRight className={styles.profileArrow} size={18} aria-hidden="true" />
                </button>

                <div className={styles.appointment}>
                  <Calendar size={19} aria-hidden="true" />
                  <div className={styles.date}>
                    <span className={styles.detailLabel}>Fecha de la cita</span>
                    <span>{formatDate(s.date) || 'Fecha sin indicar'}</span>
                  </div>
                  {s.time && <span className={styles.time}><Clock size={14} aria-hidden="true" />{s.time}</span>}
                </div>
                {s.note && <p className={styles.note}>{s.note}</p>}
                {s.status === 'cancelled' && s.canceladaPor === 'profesional' && (
                  <p className={styles.notice} role="status">
                    {s.helperName?.split(' ')?.[0] || 'El profesional'} ha cancelado la cita. Esa hora ya no está reservada.
                    {s.notaCancelacion && <> «{s.notaCancelacion}»</>}
                  </p>
                )}
                {s.reprogramada && (
                  <p className={styles.notice} role="status">
                    Ya has pedido otra hora: {formatDate(s.reprogramada.date)}{s.reprogramada.time ? ` · ${s.reprogramada.time}` : ''}.
                  </p>
                )}

                {/* Rate CTA */}
                {/* Ya pasó → marcar como hecha (y valorar, si aún no). Antes
                    salía también en citas futuras: se podía dar por hecha
                    una cita de mañana. Sin fecha, se deja como estaba. */}
                {enCurso(s) && !rated && (pasada(s) || !s.date) && (
                  <div className={styles.postActions}>
                    <button className={styles.rateBtn}
                      onClick={e => {
                        e.stopPropagation()
                        if (yaValorada) { updateService(s.id, { status: 'completed', rated: true }); showToast('Anotado como hecho.'); return }
                        updateService(s.id, { status: 'completed' }); setRatingModal({...s, status:'completed'})
                      }}
                      style={{flex:1}}>
                      <CheckCircle size={13} /> {yaValorada ? 'Marcar como hecho' : 'Marcar como hecho y valorar'}
                    </button>
                  </div>
                )}

                {/* Pendiente o confirmada y aún por venir → cancelar (dos toques) */}
                {enCurso(s) && !String(s.id).startsWith('demo') && porVenir(s) && (
                  aCancelar === s.id ? (
                    <div className={`${styles.postActions} ${styles.cancelConfirmation}`} role="group" aria-label="Confirmar cancelación"
                      onClick={e => e.stopPropagation()}>
                      <span className={styles.cancelQuestion}>
                        ¿Cancelar la cita? {s.helperName?.split(' ')?.[0]} lo verá y esa hora quedará libre.
                      </span>
                      <button className={styles.actionBtn} disabled={cancelando}
                        style={{ background: 'var(--red-ink, #B42318)', color: 'white' }}
                        onClick={() => cancelar(s)}>
                        {cancelando ? 'Cancelando…' : 'Sí, cancelar'}
                      </button>
                      <button className={styles.actionBtnSecondary} disabled={cancelando}
                        onClick={() => setACancelar(null)}>
                        No, la mantengo
                      </button>
                    </div>
                  ) : (
                    <div className={styles.postActions}>
                      <button className={styles.actionBtnSecondary}
                        onClick={e => { e.stopPropagation(); navigate(`/helper/${s.helperId}`, { state: { otraHora: s.id, cambiar: true } }) }}>
                        <Calendar size={11} /> Cambiar la hora
                      </button>
                      <button className={styles.actionBtnSecondary}
                        onClick={e => { e.stopPropagation(); setACancelar(s.id) }}>
                        Cancelar la cita
                      </button>
                    </div>
                  )
                )}

                {/* Cancelada por el profesional o «esa hora no le va»: elegir
                    otra hora sin volver a buscarle. Si ya la pidió, se dice. */}
                {((s.status === 'cancelled' && s.canceladaPor === 'profesional') || s.status === 'rejected') && !s.reprogramada && (
                  <div className={styles.postActions}>
                    <button className={styles.actionBtn}
                      onClick={e => { e.stopPropagation(); navigate(`/helper/${s.helperId}`, { state: { otraHora: s.id } }) }}>
                      <Calendar size={12} /> Elegir otra hora
                    </button>
                  </div>
                )}

                {/* Completed + not yet rated → rate CTA */}
                {s.status === 'completed' && !rated && !yaValorada && (
                  <div className={styles.postActions}>
                    <button className={styles.actionBtn}
                      onClick={e => { e.stopPropagation(); setRatingModal(s) }}>
                      <Star size={12} /> Valorar a {s.helperName?.split(' ')?.[0]}
                    </button>
                    <button className={styles.actionBtnSecondary}
                      onClick={e => { e.stopPropagation(); navigate(`/chat/${s.helperId}`, { state: { helper: { id: s.helperId, name: s.helperName, specialty: s.specialty, avatarUrl: s.avatarUrl } } }) }}>
                      <MessageCircle size={12} /> Escribir
                    </button>
                  </div>
                )}

                {/* Completed + rated → rebooking CTA */}
                {s.status === 'completed' && (rated || yaValorada) && (
                  <div className={styles.postActions}>
                    <div className={styles.ratedRow}>
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
              </article>
            )
          })}
        </div>
      </div>

      {/* La misma ventana de valorar que en el chat y la ficha: antes habia
          dos, y esta (la principal) no registraba la conexion ni el perfil vivo. */}
      {ratingModal && (
        <RatingModal helper={ratingModal}
          onClose={() => setRatingModal(null)}
          onEnviado={() => updateService(ratingModal.id, { status: 'completed', rated: true })} />
      )}
    </div>
  )
}
