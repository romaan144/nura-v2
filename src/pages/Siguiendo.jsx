import { useNavigate } from 'react-router-dom'
import { UserCheck, UserPlus, Star, MapPin } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import PageHeader from '../components/PageHeader'
import styles from './Siguiendo.module.css'

export default function Siguiendo() {
  const navigate = useNavigate()
  const { favorites, follow, unfollow, isFollowing, helpersCache } = useUser()
  const allHelpers = [...HELPERS.filter(Boolean), ...Object.values(helpersCache || {}).filter(h => h?.id && !HELPERS.filter(Boolean).find(l => l && String(l.id) === String(h.id)))]

  // Demo favorites when user has none — shows what a real account looks like
  const DEMO_FOLLOWING_IDS = [1, 5] // Carlos (logopeda) + Elena (cuidadora)
  const effectiveFavorites = favorites.length > 0 ? favorites : DEMO_FOLLOWING_IDS

  const saved = allHelpers.filter(h => h && effectiveFavorites.some(fid => String(fid) === String(h.id)))

  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.content}>
        <h2 className={styles.title} style={{animation:"fadeInUp 0.25s ease-out forwards"}}>Siguiendo</h2>
        <p className={styles.sub}>{saved.length} profesional{saved.length !== 1 ? 's' : ''} guardado{saved.length !== 1 ? 's' : ''}</p>

        {saved.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><UserPlus size={48} color='rgba(123,47,255,0.2)' strokeWidth={1.3} fill='rgba(123,47,255,0.06)' /></div>
            <h3 className={styles.emptyTitle}>Aún no sigues a nadie</h3>
            <p className={styles.emptyDesc}>Cuando encuentres un profesional que te interese, pulsa Seguir para guardarlo aquílo aquí.</p>
            <button className={styles.emptyBtn} onClick={() => navigate('/explore')}>
              Explorar profesionales
            </button>
            <button className={styles.emptyBtnSecondary} onClick={() => navigate('/')}>
              Buscar profesionales
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {(saved||[]).map((h, i) => (
              <div key={h.id} style={{animation:`cardCascade 0.45s ease-out ${i*80}ms both`}}>
              <div className={styles.card} onClick={() => navigate(`/helper/${h.id}`, { state: { helper: h } })}>
                <div className={styles.cardLeft}>
                  <img src={h.avatarUrl || `https://api.dicebear.com/9.x/personas/svg?seed=${h.name}`}
                    alt={h.name} className={styles.avatar} />
                  <div>
                    <div className={styles.name}>{h.name}</div>
                    <div className={styles.spec}>{h.specialty}</div>
                    <div className={styles.meta}>
                      <Star size={11} fill="var(--amber)" color="var(--amber)" /> {h.rating}
                      <span>·</span>
                      <MapPin size={11} /> {h.distance}km
                      <span>·</span>
                      {h.price && h.price !== 'Consultar' ? <strong>{h.price}</strong> : <span>Consultar</span>}
                    </div>
                  </div>
                </div>
                <button className={styles.heartBtn}
                  onClick={e => { e.stopPropagation(); isFollowing(h.id) ? unfollow(h.id) : follow(h.id) }}>
                  <UserCheck size={18} color="var(--purple)" />
                </button>
              </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
