import { avatarDe } from '../utils/avatar'
import { useNavigate } from 'react-router-dom'
import { UserCheck, UserPlus, Star, MapPin } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import { DEMO_MODE } from '../config'
import PageHeader from '../components/PageHeader'
import styles from './Siguiendo.module.css'

export default function Siguiendo() {
  const navigate = useNavigate()
  const { favorites, follow, unfollow, isFollowing, helpersCache } = useUser()
  const allHelpers = [...HELPERS.filter(Boolean), ...Object.values(helpersCache || {}).filter(h => h?.id && !HELPERS.filter(Boolean).find(l => l && String(l.id) === String(h.id)))]

  // Demo favorites when user has none — shows what a real account looks like
  const DEMO_FOLLOWING_IDS = [1, 5] // Carlos (logopeda) + Elena (cuidadora)
  // Igual que en Chats: sin puerta, quien no sigue a nadie veia que ya seguia
  // a dos personas. Y el estado vacio real ("Aún no sigues a nadie") no se
  // llegaba a ver NUNCA, con su texto roto incluido.
  const effectiveFavorites = favorites.length > 0 ? favorites : (DEMO_MODE ? DEMO_FOLLOWING_IDS : [])

  const saved = allHelpers.filter(h => h && effectiveFavorites.some(fid => String(fid) === String(h.id)))

  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.content}>
        <h2 className={styles.title} style={{animation:"fadeInUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards"}}>Siguiendo</h2>
        <p className={styles.sub}>{saved.length} {saved.length === 1 ? 'profesional guardado' : 'profesionales guardados'}</p>

        {saved.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><UserPlus size={48} color='var(--purple-20)' strokeWidth={1.3} fill='var(--purple-05)' /></div>
            <h3 className={styles.emptyTitle}>Aún no sigues a nadie</h3>
            <p className={styles.emptyDesc}>Cuando encuentres un profesional que te interese, pulsa Seguir para guardarlo aquí.</p>
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
              <div key={h.id} style={{animation:`cardCascade 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${i*80}ms both`}}>
              {/* Era un <div onClick>: se podia tocar con el dedo pero NO se
                  alcanzaba con teclado ni lo anunciaba un lector de pantalla.
                  role + tabIndex + Enter/Espacio lo hacen operable sin
                  cambiar una sola linea de lo que se ve. */}
              <div className={styles.card} role="button" tabIndex={0}
                aria-label={`Ver perfil de ${h.name}`}
                onClick={() => navigate(`/helper/${h.id}`, { state: { helper: h } })}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/helper/${h.id}`, { state: { helper: h } })
                  }
                }}>
                <div className={styles.cardLeft}>
                  <img src={h.avatarUrl || avatarDe(h.name)}
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
