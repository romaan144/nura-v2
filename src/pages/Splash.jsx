import { useEffect, useState } from 'react'
import styles from './Splash.module.css'

export default function Splash({ onFinish }) {
  const [phase, setPhase] = useState('logo')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 600)
    const t2 = setTimeout(() => setPhase('done'), 1800)
    const t3 = setTimeout(() => onFinish?.(), 2400)
    return () => [t1,t2,t3].forEach(clearTimeout)
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={`${styles.isoWrap} ${phase !== 'logo' ? styles.isoSmall : ''}`}>
          <img src="/logo-iso.png" alt="Nüra" className={styles.iso} />
        </div>
        <div className={`${styles.wordmarkWrap} ${phase === 'tagline' || phase === 'done' ? styles.show : ''}`}>
          <img src="/logo-text.png" alt="Nüra" className={styles.wordmark} />
        </div>
      </div>
      <div className={`${styles.footer} ${phase === 'tagline' || phase === 'done' ? styles.show : ''}`}>
        <div className={styles.loadBar}>
          <div className={styles.loadFill} />
        </div>
        <p className={styles.tagline}>La IA que conecta personas reales</p>
      </div>
    </div>
  )
}
