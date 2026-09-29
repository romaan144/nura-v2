import { avatarDe } from '../utils/avatar'
import { useNavigate } from 'react-router-dom'
import { UserCheck, UserPlus, Star, MapPin, ArrowUpRight } from 'lucide-react'
import { HELPERS_DEMO as HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import PageHeader from '../components/PageHeader'
import EmptyPanel from '../components/EmptyPanel'
import styles from './Siguiendo.module.css'
import { fmtNota } from '../utils/formato'

export default function Siguiendo() {
  const navigate = useNavigate()
  const { follow, unfollow, isFollowing, helpersCache } = useUser()
  const allHelpers = [...HELPERS.filter(Boolean), ...Object.values(helpersCache || {}).filter(h => h?.id && !HELPERS.filter(Boolean).find(l => l && String(l.id) === String(h.id)))]

  const saved = allHelpers.filter(h => h && isFollowing(h.id))

  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.content}>
        <h1 className={styles.title} style={{animation:"fadeInUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards"}}>Siguiendo</h1>
        <p className={styles.sub}>{saved.length} {saved.length === 1 ? 'profesional guardado' : 'profesionales guardados'}</p>

        {saved.length === 0 ? (
          <EmptyPanel
            icon={UserPlus}
            title="Tus profesionales, a mano"
            hint="Pulsa Seguir en el perfil de quien te interese. Lo encontrarás aquí cuando lo necesites."
            actionLabel="Explorar profesionales"
            onAction={() => navigate('/explore')}
            secondaryLabel="Buscar con Nüra"
            onSecondary={() => navigate('/')}
          />
        ) : (
          <div className={styles.list}>
            {(saved||[]).map((h, i) => (
              <article key={h.id} className={styles.card}
                style={{animation:`cardCascade 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${i*80}ms both`}}>
                <button type="button" className={styles.profileButton}
                  aria-label={`Ver perfil de ${h.name}`}
                  onClick={() => navigate(`/helper/${h.id}`, { state: { helper: h } })}>
                  <img src={h.avatarUrl || avatarDe(h.name)} alt="" className={styles.avatar} />
                  <span className={styles.details}>
                    <span className={styles.name}>{h.name}</span>
                    <span className={styles.spec}>{h.specialty}</span>
                    <span className={styles.meta}>
                      <span className={styles.rating}><Star size={13} aria-hidden="true" /> {fmtNota(h.rating)}</span>
                      <span className={styles.zone}><MapPin size={13} aria-hidden="true" /> {h.zone || h.city || 'Barcelona'}</span>
                    </span>
                    <span className={styles.profileLink}>Ver perfil <ArrowUpRight size={13} aria-hidden="true" /></span>
                  </span>
                </button>
                <div className={styles.cardFooter}>
                  <span className={styles.price}>{h.price && h.price !== 'Consultar' ? h.price : 'Consultar'}</span>
                  <button type="button" className={styles.followBtn}
                    aria-pressed={isFollowing(h.id)}
                    aria-label={`${isFollowing(h.id) ? 'Dejar de seguir' : 'Seguir'} a ${h.name}`}
                    onClick={() => { isFollowing(h.id) ? unfollow(h.id) : follow(h.id) }}>
                    {isFollowing(h.id) ? <UserCheck size={16} aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
                    {isFollowing(h.id) ? 'Siguiendo' : 'Seguir'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
