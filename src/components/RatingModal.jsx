import { createPortal } from 'react-dom'
import { getFirstName } from '../utils/name'
import { useId, useState } from 'react'
import useModalSheet from './useModalSheet'
import { Star, X, CheckCircle, ThumbsUp, ThumbsDown, Check, MessageSquare } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './RatingModal.module.css'
import { registrar } from '../utils/analitica'
import { valorar } from '../utils/escrituras'
import { ETIQUETA_CUALIDAD, cualidadesPara, MAX_CUALIDADES } from '../utils/cualidades'

// PERFIL VIVO, pieza 1 (docs/perfil-vivo.md §3). Tres preguntas de un toque,
// todas opcionales: basta con responder una. La mas honesta va primero.
// Lo que se envia construye la ficha publica del profesional, con su prueba
// («Paciente · lo dicen 12 clientes»). El comentario solo sale del movil si
// la persona marca que puede publicarse.
//
// `helper` admite una ficha ({id, name, category, avatar…}) o un servicio de
// «Mis servicios» ({helperId, helperName, category…}).
export default function RatingModal({ helper, onClose, onEnviado }) {
  const id = helper.helperId ?? helper.id
  const nombre = getFirstName(helper.helperName ?? helper.name ?? '') || 'este profesional'
  const opciones = cualidadesPara(helper.category)

  const [volveria, setVolveria] = useState(null)
  const [elegidas, setElegidas] = useState([])
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [publico, setPublico] = useState(false)
  const [done, setDone] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const { addRating } = useUser()

  const { dialog, body } = useModalSheet(onClose, done)
  const titleId = useId()
  const commentId = useId()
  const qualitiesId = useId()

  const algo = volveria !== null || elegidas.length > 0 || rating > 0

  function alternar(c) {
    setElegidas(prev => prev.includes(c)
      ? prev.filter(x => x !== c)
      : prev.length >= MAX_CUALIDADES ? prev : [...prev, c])
  }

  async function submit() {
    if (!algo || enviando) return
    setEnviando(true)
    // La CONEXION COMPLETADA: cita con resultado. Es el criterio de
    // graduacion del MVP y no se puede contar sin registrarlo.
    registrar('resultado_registrado', {
      helperId: String(id), valoracion: rating || null, volveria,
      cualidades: elegidas.length, conComentario: Boolean(comment?.trim()),
    })
    if (rating) addRating(id, rating, comment)
    const r = await valorar(id, { estrellas: rating, volveria, cualidades: elegidas, comentario: comment.trim(), publico })
    onEnviado?.(r)
    setDone(r)
    setTimeout(onClose, 2200)
  }

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <section className={styles.card} ref={dialog} tabIndex={-1}
        onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Tu experiencia cuenta</p>
            <h2 id={titleId} className={styles.title}>{done ? '¡Gracias!' : `¿Cómo fue con ${nombre}?`}</h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar valoración"><X size={20} /></button>
        </header>
        <div className={styles.body} ref={body}>
          {!done ? (
            <>
              <div className={styles.person}>
                {helper.avatarUrl ? <img className={styles.avatar} src={helper.avatarUrl} alt="" />
                  : <span className={styles.avatarFallback}>{(helper.helperName ?? helper.name ?? nombre)[0]?.toUpperCase()}</span>}
                <div><strong>{helper.helperName ?? helper.name ?? nombre}</strong><p>Responde solo a lo que quieras.</p></div>
              </div>
              <fieldset className={styles.section}>
                <legend className={styles.pregunta}>¿Volverías a llamarle?</legend>
                <div className={styles.siNo}>
                  <button type="button" aria-pressed={volveria === true}
                    className={`${styles.opcion} ${volveria === true ? styles.opcionOn : ''}`}
                    onClick={() => setVolveria(volveria === true ? null : true)}>
                    <ThumbsUp size={17} aria-hidden="true" /> Sí
                  </button>
                  <button type="button" aria-pressed={volveria === false}
                    className={`${styles.opcion} ${volveria === false ? styles.opcionOn : ''}`}
                    onClick={() => setVolveria(volveria === false ? null : false)}>
                    <ThumbsDown size={17} aria-hidden="true" /> No
                  </button>
                </div>
              </fieldset>
              <fieldset className={styles.section} aria-describedby={qualitiesId}>
                <legend className={styles.pregunta}>¿Qué destacarías?</legend>
                <p id={qualitiesId} className={styles.nota} aria-live="polite">
                  Elige hasta {MAX_CUALIDADES}<span>{elegidas.length} de {MAX_CUALIDADES}</span>
                </p>
                <div className={styles.chips}>
                  {opciones.map(c => {
                    const on = elegidas.includes(c)
                    const lleno = !on && elegidas.length >= MAX_CUALIDADES
                    return (
                      <button key={c} type="button" aria-pressed={on} disabled={lleno}
                        className={`${styles.chip} ${on ? styles.chipOn : ''}`}
                        onClick={() => alternar(c)}>
                        {on && <Check size={14} aria-hidden="true" />}{ETIQUETA_CUALIDAD[c]}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
              <fieldset className={styles.section}>
                <legend className={styles.pregunta}>¿Qué nota le das?</legend>
                <div className={styles.stars} role="group" aria-label="Estrellas">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" className={styles.star} aria-pressed={rating === n}
                      aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                      onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(rating === n ? 0 : n)}>
                      <Star size={26} aria-hidden="true" fill={(hover || rating) >= n ? '#F2C05D' : 'none'}
                        color={(hover || rating) >= n ? '#946312' : '#71637D'} strokeWidth={1.6} />
                      <span>{n}</span>
                    </button>
                  ))}
                </div>
                <p className={styles.ratingLabel} aria-live="polite">
                  {rating > 0 ? `${rating} de 5 · ${['', 'Muy malo', 'Mejorable', 'Correcto', 'Muy bueno', 'Excelente'][rating]}` : 'La nota también es opcional.'}
                </p>
              </fieldset>
              <div className={styles.commentSection}>
                <label className={styles.commentLabel} htmlFor={commentId}><MessageSquare size={17} aria-hidden="true" />Tu comentario<span>Opcional</span></label>
                <textarea id={commentId} className={styles.textarea} aria-label="Comentario (opcional)"
                  placeholder="Cuéntalo con tus palabras…" value={comment} onChange={e => setComment(e.target.value)}
                  maxLength={500} rows={3} />
                <p className={styles.charCount}>{comment.length}/500</p>
                {comment.trim() && (
                  <label className={styles.publicar}>
                    <input type="checkbox" checked={publico} onChange={e => setPublico(e.target.checked)} />
                    <span>Permitir que este comentario se publique en su perfil</span>
                  </label>
                )}
              </div>
            </>
          ) : (
            <div className={styles.doneState} role="status">
              <div className={styles.doneIcon}><CheckCircle size={44} aria-hidden="true" /></div>
              <p className={styles.desc}>
                {done === 'publicada'
                  ? `Lo que has dicho ya cuenta en el perfil de ${nombre}.`
                  : done === 'ya-valorada'
                    ? `Ya habías valorado esta conversación con ${nombre}. Lo guardamos en tu móvil.`
                    : 'Lo guardamos en tu móvil. Contará en su perfil cuando hayáis hablado por Nüra.'}
              </p>
            </div>
          )}
        </div>
        {!done && (
          <footer className={styles.footer}>
            {!algo && <p className={styles.help}>Marca una respuesta, cualidad o estrella para enviar.</p>}
            <button type="button" className={styles.btn} onClick={submit} disabled={!algo || enviando}>
              {enviando ? 'Enviando…' : 'Enviar valoración'}
            </button>
            <p className={styles.privacidad}>Nunca analizamos tus conversaciones ni lo que buscas.</p>
          </footer>
        )}
      </section>
    </div>, document.body
  )
}
