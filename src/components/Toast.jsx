import { useState, useEffect } from 'react'
import styles from './Toast.module.css'

let showToastFn = null
export function showToast(msg) { showToastFn?.(msg) }

export default function Toast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    showToastFn = (msg) => {
      const id = Date.now()
      setToasts(t => [...t, { id, msg }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
    }
    return () => { showToastFn = null }
  }, [])

  return (
    <div className={styles.container}>
      {toasts.map(t => (
        <div key={t.id} className={styles.toast}>
          <img src="/logo-iso.png" alt="" className={styles.icon} />
          <span className={styles.msg}>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
