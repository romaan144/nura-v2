import { useVolver } from '../utils/volver'
import { ArrowLeft } from 'lucide-react'
import styles from './PageHeader.module.css'

export default function PageHeader({ showBack, onBack, title, rightEl }) {
  const volver = useVolver()
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        {showBack && (
          <button className={styles.circleBtn} onClick={() => onBack ? onBack() : volver()} aria-label="Volver">
            <ArrowLeft size={18} />
          </button>
        )}
      </div>
      <div className={styles.center}>
        <div className={styles.logoPill}><span className={styles.wordmark}>Nüra</span></div>
      </div>
      <div className={styles.right}>
        {rightEl || <div className={styles.placeholder} />}
      </div>
    </div>
  )
}
