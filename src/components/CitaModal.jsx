import { useId } from 'react'
import useModalSheet from './useModalSheet'
import { createPortal } from 'react-dom'
import { Calendar, Clock, CheckCircle, X, ArrowRight } from 'lucide-react'
import ElegirCita from './ElegirCita'
import styles from './CitaModal.module.css'

// Presentación compartida. Los dos padres conservan sus propios envíos y estados.
export default function CitaModal({ helper, date, time, note, onDate, onTime, onNote,
  onClose, onConfirm, done, submitting = false, error = '', title, notice,
  confirmLabel = 'Enviar solicitud', successTitle = '¡Solicitud enviada!',
  successText, onServices, backLabel }) {
  const titleId = useId()
  const noteId = useId()
  const { dialog, body } = useModalSheet(onClose, done)

  const day = date ? new Date(date + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  }) : ''

  return createPortal(
    <div className={styles.overlay}>
      <section className={styles.sheet} ref={dialog} role="dialog" aria-modal="true"
        aria-labelledby={titleId} tabIndex={-1}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{done ? 'Tu solicitud' : 'Tu próxima cita'}</p>
            <h2 id={titleId}>{done ? successTitle : title}</h2>
          </div>
          <button className={styles.close} type="button" onClick={onClose} aria-label="Cerrar solicitud"><X size={20} /></button>
        </header>
        <div className={styles.body} ref={body}>
          <div className={styles.person}>
            {helper?.avatarUrl ? <img src={helper.avatarUrl} alt="" className={styles.avatar} />
              : <span className={styles.avatarFallback}>{helper?.name?.[0] || '?'}</span>}
            <div><strong>{helper?.name}</strong><span>{helper?.price || 'Precio a consultar'}</span></div>
            {done && <CheckCircle className={styles.successIcon} size={28} aria-hidden="true" />}
          </div>
          {done ? (
            <div className={styles.success}>
              <p role="status">{successText}</p>
              <div className={styles.summary}>
                {day && <span><Calendar size={18} aria-hidden="true" />{day}</span>}
                {time && <strong><Clock size={17} aria-hidden="true" />{time}</strong>}
              </div>
              <p className={styles.hint}>Pendiente de la confirmación del profesional.</p>
            </div>
          ) : (
            <>
              {notice && <p className={styles.notice}>{notice}</p>}
              <ElegirCita helper={helper} date={date} time={time} onDate={onDate} onTime={onTime} />
              <label className={styles.noteLabel} htmlFor={noteId}>Añade un detalle <span>Opcional</span></label>
              <textarea id={noteId} className={styles.note} value={note} onChange={e => onNote(e.target.value)}
                placeholder="Algo que quieras que sepa antes de la cita…" rows={3} />
            </>
          )}
        </div>
        <footer className={styles.footer}>
          {done ? (
            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={onClose}>{backLabel}</button>
              <button type="button" className={styles.primary} onClick={onServices}>Ver mis servicios <ArrowRight size={16} aria-hidden="true" /></button>
            </div>
          ) : (
            <>
              <div className={styles.selection} aria-live="polite">
                <Calendar size={17} aria-hidden="true" />
                <span>{day || 'Elige un día para tu cita'}{day && <strong>{time ? `A las ${time}` : 'Ahora elige una hora'}</strong>}</span>
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <div className={styles.actions}>
                <button type="button" className={styles.secondary} onClick={onClose}>Cancelar</button>
                <button type="button" className={styles.primary} onClick={onConfirm} disabled={!date || !time || submitting}>
                  {submitting ? 'Enviando…' : confirmLabel}<ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </footer>
      </section>
    </div>, document.body,
  )
}
