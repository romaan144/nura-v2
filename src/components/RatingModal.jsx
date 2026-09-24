import { useState } from 'react'
import { Star, X, CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react'
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
  const nombre = (helper.helperName ?? helper.name ?? '').split(' ')[0] || 'este profesional'
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="valorar-titulo">
        {!done ? (
          <>
            <button className={styles.close} onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
            {helper.avatarUrl
              ? <img className={styles.avatar} src={helper.avatarUrl} alt="" />
              : <div className={styles.avatar} style={{background: helper.avatarColor || 'var(--purple)'}}>{helper.avatar}</div>}
            <h3 id="valorar-titulo" className={styles.title}>¿Cómo fue con {nombre}?</h3>
            <p className={styles.desc}>Un toque basta. Ayudas a otros a elegir bien.</p>

            <p className={styles.pregunta}>¿Volverías a llamarle?</p>
            <div className={styles.siNo}>
              <button type="button" aria-pressed={volveria === true}
                className={`${styles.opcion} ${volveria === true ? styles.opcionSi : ''}`}
                onClick={() => setVolveria(volveria === true ? null : true)}>
                <ThumbsUp size={16} /> Sí
              </button>
              <button type="button" aria-pressed={volveria === false}
                className={`${styles.opcion} ${volveria === false ? styles.opcionNo : ''}`}
                onClick={() => setVolveria(volveria === false ? null : false)}>
                <ThumbsDown size={16} /> No
              </button>
            </div>

            <p className={styles.pregunta}>
              ¿Qué destacarías? <span className={styles.nota}>hasta {MAX_CUALIDADES}</span>
            </p>
            <div className={styles.chips}>
              {opciones.map(c => {
                const on = elegidas.includes(c)
                const lleno = !on && elegidas.length >= MAX_CUALIDADES
                return (
                  <button key={c} type="button" aria-pressed={on} disabled={lleno}
                    className={`${styles.chip} ${on ? styles.chipOn : ''}`}
                    onClick={() => alternar(c)}>
                    {ETIQUETA_CUALIDAD[c]}
                  </button>
                )
              })}
            </div>

            <p className={styles.pregunta}>¿Qué nota le das?</p>
            <div className={styles.stars} role="radiogroup" aria-label="Estrellas">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" className={styles.star} role="radio" aria-checked={rating === n}
                  aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(rating === n ? 0 : n)}>
                  <Star size={32}
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
              aria-label="Comentario (opcional)"
              placeholder="Cuéntalo con tus palabras (opcional)"
              value={comment} onChange={e => setComment(e.target.value)}
              maxLength={500} rows={3} />
            {comment.trim() && (
              <label className={styles.publicar}>
                <input type="checkbox" checked={publico} onChange={e => setPublico(e.target.checked)} />
                <span>Se puede publicar en su perfil</span>
              </label>
            )}

            <button className={styles.btn} onClick={submit} disabled={!algo || enviando}>
              {enviando ? 'Enviando…' : 'Enviar'}
            </button>
            <p className={styles.privacidad}>Nunca leemos tus chats ni guardamos lo que buscas.</p>
          </>
        ) : (
          <div className={styles.doneState} role="status">
            <div className={styles.doneIcon}><CheckCircle size={48} color='var(--green)' strokeWidth={1.4} /></div>
            <h3 className={styles.title}>¡Gracias!</h3>
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
    </div>
  )
}
