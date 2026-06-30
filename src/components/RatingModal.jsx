import { useState } from 'react'
import { Star, X, CheckCircle } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './RatingModal.module.css'

export default function RatingModal({ helper, onClose }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [done, setDone] = useState(false)
  const { addRating } = useUser()

  function submit() {
    if (!rating) return
    addRating(helper.id, rating, comment)
    setDone(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        {!done ? (
          <>
            <button className={styles.close} onClick={onClose}><X size={16} /></button>
            <div className={styles.avatar} style={{background: helper.avatarColor}}>{helper.avatar}</div>
            <h3 className={styles.title}>¿Cómo fue con {helper.name.split(' ')[0]}?</h3>
            <p className={styles.desc}>Tu valoración mejora el perfil de Nüra para todos.</p>

            <div className={styles.stars}>
              {[1,2,3,4,5].map(n => (
                <button key={n} className={styles.star}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}>
                  <Star size={36}
                    fill={(hover || rating) >= n ? 'var(--amber)' : 'none'}
                    color={(hover || rating) >= n ? 'var(--amber)' : 'var(--rule)'}
                    strokeWidth={1.5} />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className={styles.ratingLabel}>
                {['', 'Muy malo', 'Mejorable', 'Correcto', 'Muy bueno', 'Excelente'][rating]}
              </p>
            )}

            <textarea className={styles.textarea}
              placeholder={`¿Qué destacarías de ${helper.name.split(' ')[0]}?`}
              value={comment} onChange={e => setComment(e.target.value)}
              rows={3} />

            <button className={styles.btn} onClick={submit} disabled={!rating}>
              Enviar valoración
            </button>
          </>
        ) : (
          <div className={styles.doneState}>
            <div className={styles.doneIcon}><CheckCircle size={48} color='var(--green)' strokeWidth={1.4} /></div>
            <h3 className={styles.title}>¡Gracias!</h3>
            <p className={styles.desc}>Tu valoración ya forma parte del perfil de {helper.name.split(' ')[0]} en Nüra.</p>
          </div>
        )}
      </div>
    </div>
  )
}
