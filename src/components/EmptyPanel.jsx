import styles from './EmptyPanel.module.css'

// Solo presentación: cada pantalla conserva sus condiciones y destinos.
export default function EmptyPanel({ icon: Icon, title, hint, actionLabel, onAction, secondaryLabel, onSecondary }) {
  return (
    <section className={styles.panel}>
      {Icon && <span className={styles.icon} aria-hidden="true"><Icon size={28} strokeWidth={1.6} /></span>}
      <h2 className={styles.title}>{title}</h2>
      {hint && <p className={styles.hint}>{hint}</p>}
      {actionLabel && onAction && <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onAction}>{actionLabel}</button>
        {secondaryLabel && onSecondary && <button type="button" className={styles.secondary} onClick={onSecondary}>{secondaryLabel}</button>}
      </div>}
    </section>
  )
}
