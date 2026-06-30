import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import styles from './PageHeader.module.css'

export default function PageHeader({ showBack, onBack, title, rightEl }) {
  const navigate = useNavigate()
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        {showBack && (
          <button className={styles.circleBtn} onClick={() => onBack ? onBack() : navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
        )}
      </div>
      <div className={styles.center}>
        <div className={styles.logoPill}><img src="/logo-text.png" alt="Nüra" className={styles.logo} /></div>
      </div>
      <div className={styles.right}>
        {rightEl || <div className={styles.placeholder} />}
      </div>
    </div>
  )
}
