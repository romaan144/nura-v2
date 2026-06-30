import { useNavigate } from 'react-router-dom'
import { Star, Shield, MessageCircle, UserPlus, UserCheck, MapPin, Sparkles } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { showToast } from './Toast'
import styles from './HelperCarousel.module.css'
import { haptic } from '../utils/haptic'

/**
 * HelperCarousel — horizontal scroll of compact helper cards.
 * Used in the Home chat after search results.
 * Tapping a card goes to chat directly (not profile).
 * Compact format: avatar, name, specialty, rating, price, one CTA.
 */
function CarouselCard({ helper, isTopPick, matchReason }) {
  const navigate = useNavigate()
  const { user, follow, unfollow, isFollowing } = useUser()
  const following = isFollowing(helper.id)

  function handleContact(e) {
    e.stopPropagation()
    haptic('medium')
    if (!user) {
      sessionStorage.setItem('nura_return_to', `/chat/${helper.id}`)
      sessionStorage.setItem('nura_pending_helper', JSON.stringify(helper))
      showToast('Crea tu cuenta para contactar')
      setTimeout(() => navigate('/login'), 600)
      return
    }
    navigate(`/chat/${helper.id}`, { state: { helper, userQuery: window.__nuraLastQuery, analysis: window.__nuraLastAnalysis } })
  }

  function handleFollow(e) {
    e.stopPropagation()
    if (!user) { showToast('Inicia sesión para seguir profesionales'); return }
    isFollowing(helper.id) ? unfollow(helper.id) : follow(helper.id)
    showToast(following ? 'Has dejado de seguir' : 'Siguiendo')
  }

  return (
    <div
      className={styles.card}
      onClick={() => {
        const reason = window.__nuraMatchReasons?.[String(helper.id)]
        navigate(`/helper/${helper.id}`, { state: { helper, fromSearch: true, matchReason: reason, userQuery: window.__nuraLastQuery, analysis: window.__nuraLastAnalysis } })
      }}>


      {/* Avatar */}
      <div className={styles.avatarWrap}>
        {helper.avatarUrl
          ? <img src={helper.avatarUrl} alt={helper.name} className={styles.avatar} style={{opacity:0}} onLoad={e => e.target.style.animation="fadeInUp 0.3s ease-out forwards"} />
          : <div className={styles.avatarFallback} style={{ background: helper.avatarColor || 'var(--purple)' }}>
              {helper.avatar || helper.name?.[0]}
            </div>
        }
        {helper.available && <span className={styles.availDot} />}
        <button className={`${styles.favBtn} ${following ? styles.favBtnActive : ''}`} onClick={handleFollow}>
          {following ? <UserCheck size={12} color='var(--purple)' strokeWidth={2} /> : <UserPlus size={12} color='rgba(0,0,0,0.3)' strokeWidth={1.8} />}
        </button>
      </div>

      {/* Name + verified */}
      <div className={styles.name}>
        {helper.name?.split(' ')?.[0]}
        {helper.dniVerified && (
          <Shield size={9} color="var(--green)" style={{ marginLeft: 3, verticalAlign: 'middle' }} />
        )}
      </div>

      {/* Specialty */}
      <div className={styles.specialty}>{helper.specialty}</div>

      {/* Rating + reviews + distance */}
      <div className={styles.meta}>
        <Star size={9} fill="var(--amber)" color="var(--amber)" />
        <span className={styles.metaStrong}>{helper.rating}</span>
        {helper.reviews > 0 && (
          <span className={styles.metaDot}>({helper.reviews})</span>
        )}
        <span className={styles.metaDot}>·</span>
        <MapPin size={8} color="rgba(0,0,0,0.3)" />
        <span>{helper.distance || 1.2}km</span>
      </div>

      {/* Match reason — why Nüra chose this person */}
      {matchReason && (
        <div className={styles.matchReasonLine}>
          <Sparkles size={8} color="var(--purple)" style={{flexShrink:0}} />
          <span>{matchReason
            .replace(/^\*\*[^*]+\*\*[^:]*:\s*/, '')
            .replace(/\*\*/g, '')
            .split('·')[0]
            .trim()
            .slice(0, 45)
          }</span>
        </div>
      )}

      {/* Spacer — pushes price+CTA to bottom */}
      <div className={styles.spacer} />

      {/* Price + CTA — always anchored to bottom */}
      {helper.price && helper.price !== 'Consultar' && (
        <div className={styles.price}>{helper.price}</div>
      )}
      <button className={styles.contactBtn} onClick={handleContact}>
        <MessageCircle size={12} /> Escribir
      </button>
    </div>
  )
}

export default function HelperCarousel({ helpers }) {
  if (!helpers?.length) return null
  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        {helpers.map((h, i) => { const reason = window.__nuraMatchReasons?.[String(h.id)]; return h && <CarouselCard key={h.id} helper={h} isTopPick={i === 0} matchReason={reason} /> })}
      </div>
    </div>
  )
}
