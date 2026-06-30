import { useNavigate } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.logo} />
        <h1 className={styles.title}>Esta página no existe</h1>
        <p className={styles.desc}>
          Puede que el enlace haya cambiado o que ya no esté disponible.
        </p>
        <button className={styles.btn} onClick={() => navigate('/')}>
          Volver a Nüra
        </button>
        <button
          className={styles.btnSecondary}
          onClick={() => navigate('/explore')}>
          Explorar profesionales
        </button>
      </div>
    </div>
  )
}
