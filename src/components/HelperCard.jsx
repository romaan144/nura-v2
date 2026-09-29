import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { showToast } from './Toast'
import { haptic } from '../utils/haptic'
import { getFirstName } from '../utils/name'
import { ArrowUpRight, BadgeCheck, MapPin, MessageCircle, Star, Zap } from 'lucide-react'
import styles from './HelperCard.module.css'
import { recordarDestino, contextoDeChat } from '../utils/contacto'
import { fmtNota, dondeEsta } from '../utils/formato'

// ═══════════════════════════════════════════════════════════════
// La Tarjeta Persona — representación canónica del profesional
// en toda la app (resultados, Explorar, espejo del Primer Día,
// tiras). Aire: la persona protagonista, una línea de esencia,
// una señal de confianza, una sola acción.
// ═══════════════════════════════════════════════════════════════
export default function HelperCard({ helper, onContact, showContact = true, showPrice = false }) {
  // Navegacion diferida cancelable: si el componente se va antes de los
  // 600ms, el usuario NO acaba en Login sin haberlo pedido.
  const irLuego = useRef(null)
  useEffect(() => () => clearTimeout(irLuego.current), [])

  const navigate = useNavigate()
  const { user } = useUser()
  if (!helper) return null

  const firstName = getFirstName(helper.name)

  function handleTap() {
    const reason = window.__nuraMatchReasons?.[String(helper.id)]
    navigate(`/helper/${helper.id}`, {
      state: { helper, fromSearch: true, matchReason: reason, userQuery: window.__nuraLastQuery, analysis: window.__nuraLastAnalysis },
    })
  }

  function handleContact(e) {
    e.stopPropagation()
    haptic('medium')
    if (onContact) { onContact(helper); return }
    if (!user) {
      recordarDestino(helper.id)
      showToast('Para escribirle necesito saber quién eres. Es un minuto.')
      irLuego.current = setTimeout(() => navigate('/login'), 600)
      return
    }
    navigate(`/chat/${helper.id}`, { state: contextoDeChat(helper) })
  }

  const place = dondeEsta(helper)
  const price = showPrice && helper.price && helper.price !== 'Consultar' ? helper.price : null

  return (
    <article className={styles.card}>
      <button type="button" className={styles.profile} onClick={handleTap} aria-label={`Ver perfil de ${helper.name}`}>
        <span className={styles.avatarWrap}>
          {helper.avatarUrl
            ? <img decoding="async" loading="lazy" width="80" height="104" src={helper.avatarUrl} alt="" className={styles.avatar} />
            : <span className={styles.avatarFallback}>{firstName?.[0]?.toUpperCase() || '?'}</span>}
          {helper.available && <span className={styles.availDot} role="img" aria-label="Disponible ahora" />}
        </span>
        <span className={styles.info}>
          <span className={styles.nameRow}>
            <span className={styles.name} title={helper.name}>{helper.name}</span>
            {helper.verified && <BadgeCheck size={16} className={styles.verified} aria-label="Identidad verificada" />}
            <ArrowUpRight size={15} className={styles.profileArrow} aria-hidden="true" />
          </span>
          <span className={styles.specialty} title={helper.specialty}>{helper.specialty}</span>
          <span className={styles.meta}>
            {helper.rating > 0 && <span className={styles.rating}><Star size={13} aria-hidden="true" />{fmtNota(helper.rating)}{helper.reviews > 0 && <span className={styles.reviews}>({helper.reviews})</span>}</span>}
            {helper.urgent && <span className={styles.urgent}><Zap size={13} aria-hidden="true" /><span>Urgencias</span></span>}
          </span>
          <span className={styles.location}>{place && <><MapPin size={12} aria-hidden="true" /><span>{place}</span></>}</span>
        </span>
      </button>
      {(price || showContact) && <div className={styles.footer}>
        <span className={styles.price} title={price || undefined}>{price}</span>
        {showContact && <button type="button" className={styles.contactBtn} onClick={handleContact} aria-label={`Escribir a ${firstName}`}>
          <MessageCircle size={16} aria-hidden="true" />Escribir
        </button>}
      </div>}
    </article>
  )
}
