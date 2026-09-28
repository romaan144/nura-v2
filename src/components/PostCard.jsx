import { Hand, MessageCircle, BadgeCheck, ArrowUpRight, ArrowRight, Check } from 'lucide-react'
import ObraTypeIcon from './ObraTypeIcon'
import { useId, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { TYPE_META, COMMENT_STARTERS } from '../data/obraPosts'
import styles from './PostCard.module.css'

// ═══════════════════════════════════════════════════════════════
// PostCard — LA UNIDAD UNICA del Muro.
// Antes convivian dos idiomas visuales en el mismo rio: la obra como
// tarjeta y la conexion como parrafo suelto. Dos componentes
// alternandose nunca se leen como una comunidad. Aqui obra y conexion
// son EL MISMO post con distinto contenido: cambia lo que se dice, no
// la forma de decirlo.
// ═══════════════════════════════════════════════════════════════
export default function PostCard({ post }) {
  const navigate = useNavigate()
  const location = useLocation()
  const commentAnchor = `comentarios-${encodeURIComponent(post?.id ?? '')}`
  const { user, toggleUtil, utilesDe, meSirve, addComment, commentsFor } = useUser()
  const [threadView, setThreadView] = useState(null)
  const openThread = threadView?.hash === location.hash
    ? threadView.open : location.hash === `#${commentAnchor}`
  const [draft, setDraft] = useState('')
  const threadId = useId()
  if (!post) return null

  const meta = post.type ? TYPE_META[post.type] : null
  const comments = commentsFor?.(post.id) || []
  const utiles = utilesDe?.(post.id) ?? 0
  const marcado = meSirve?.(post.id)

  const irAlPerfil = () => post.helperId && navigate(`/helper/${post.helperId}`)

  const pedirCuenta = (paraComentar = false) => {
    const hash = paraComentar ? `#${commentAnchor}` : location.hash
    const destino = location.pathname + location.search + hash
    try { sessionStorage.setItem('nura_return_to', destino) } catch { /* noop */ }
    navigate('/login')
  }

  const publicar = txt => {
    const t = String(txt || '').trim()
    if (!t) return
    if (!user) return pedirCuenta(true)
    addComment(post.id, t)
    setDraft('')
  }

  const Author = post.helperId ? 'button' : 'div'
  return (
    <article className={styles.card}>
      <Author className={styles.author} {...(post.helperId ? { type: 'button', onClick: irAlPerfil, 'aria-label': `Ver perfil de ${post.autor}` } : {})}>
        {post.avatarUrl
          ? <img src={post.avatarUrl} alt="" decoding="async" loading="lazy" width={44} height={48} className={styles.avatar} />
          : <span className={styles.initial}>{(post.autor || '?')[0]}</span>}
        <span className={styles.authorInfo}>
          <span className={styles.authorName}>{post.autor}{post.verified && <BadgeCheck size={15} aria-label="Identidad verificada" />}</span>
          {post.rol && <span className={styles.authorRole}>{post.rol}</span>}
          {(post.dateLabel || post.lugar) && <span className={styles.date}>{[post.dateLabel, post.lugar].filter(Boolean).join(' · ')}</span>}
        </span>
        {post.helperId && <ArrowUpRight size={17} className={styles.authorArrow} aria-hidden="true" />}
      </Author>

      <div className={styles.content}>
        {meta && <span className={styles.type}><ObraTypeIcon type={post.type} />{meta.label}</span>}
        {post.title && <h3 className={styles.title}>{post.title}</h3>}
        <p className={styles.body}>{post.body}</p>
        {post.result && <div className={styles.result}>
          <span className={styles.resultLabel}>Resultado</span>
          <p>{post.result}</p>
        </div>}
        {post.confirmado && <p className={styles.confirmed}><Check size={16} aria-hidden="true" />Confirmado por quien lo vivió</p>}
        {post.mention && <button type="button" onClick={irAlPerfil} className={styles.mention}>
          <span>Encontró a <strong>{post.mention}</strong></span><ArrowUpRight size={16} aria-hidden="true" />
        </button>}
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={() => user ? toggleUtil(post.id) : pedirCuenta()} aria-pressed={!!marcado}
          className={`${styles.action} ${marcado ? styles.selected : ''}`}>
          <Hand size={16} aria-hidden="true" /><span>Me sirve{utiles > 0 ? ` · ${utiles}` : ''}</span>
        </button>
        <button type="button" onClick={() => setThreadView({ hash: location.hash, open: !openThread })} aria-expanded={openThread} aria-controls={threadId}
          className={`${styles.action} ${openThread ? styles.selected : ''}`}>
          <MessageCircle size={16} aria-hidden="true" /><span>{comments.length > 0 ? `Comentarios · ${comments.length}` : 'Comentar'}</span>
        </button>
      </div>
      {openThread && <div id={threadId} className={styles.thread}>
        <h4 data-comment-anchor={commentAnchor} className={styles.threadTitle}>Comentarios</h4>
        {comments.length === 0 && <p className={styles.emptyThread}>Todavía no hay comentarios.</p>}
        <div className={styles.comments}>
          {comments.map(c => <div key={c.id} className={styles.comment}>
            <div className={styles.commentHead}><strong>{c.author}</strong><span>{c.ago}</span></div>
            <p>{c.text}</p>
          </div>)}
        </div>
        {user ? <>
          <p className={styles.quickLabel}>Publicar una respuesta rápida</p>
          <div className={styles.quickReplies}>
            {COMMENT_STARTERS.map(s => <button type="button" key={s} onClick={() => publicar(s)}>{s}</button>)}
          </div>
          <label htmlFor={`${threadId}-draft`} className={styles.draftLabel}>Tu comentario</label>
          <div className={styles.composer}>
            <input id={`${threadId}-draft`} value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') publicar(draft) }} placeholder="Escribe aquí…" />
            <button type="button" onClick={() => publicar(draft)} aria-label="Publicar comentario" disabled={!draft.trim()}><ArrowRight size={20} aria-hidden="true" /></button>
          </div>
        </> : <button type="button" onClick={() => pedirCuenta(true)} className={styles.signIn}>Entra para comentar</button>}
      </div>}
    </article>
  )
}
