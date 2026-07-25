import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TYPE_META, COMMENT_STARTERS } from '../data/obraPosts'
import { useUser } from '../context/UserContext'

// ObraCard — la pieza canon de la Obra (Nüra Obra · F1)
export default function ObraCard({ post }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { isFollowing, user, addComment, commentsFor } = useUser()
  const [openThread, setOpenThread] = useState(false)
  const [draft, setDraft] = useState('')
  const comments = commentsFor?.(post?.id) || []

  const publicar = txt => {
    const t = String(txt || '').trim()
    if (!t) return
    if (!user) {
      try { sessionStorage.setItem('nura_return_to', window.location.pathname) } catch { /* noop */ }
      navigate('/login')
      return
    }
    addComment(post.id, t)
    setDraft('')
  }
  if (!post) return null
  const meta = TYPE_META[post.type] || { label: 'Obra', icon: '✦' }
  const long = (post.body || '').length > 180

  return (
    <article style={{ background: 'white', border: '1px solid var(--ink-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '14px 15px' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px',
        background: 'var(--purple-10)', color: 'var(--purple)', borderRadius: 'var(--radius-full)',
        padding: '3px 10px', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.4px',
        textTransform: 'uppercase', marginBottom: '9px' }}>
        {meta.icon} {meta.label}
      </div>
      <h3 style={{ fontFamily: 'var(--font-voice)', fontWeight: 500, fontSize: 'var(--text-md)',
        letterSpacing: '-0.3px', color: 'var(--ink)', margin: '0 0 7px', lineHeight: 1.3 }}>
        {post.title}
      </h3>
      <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.55, color: 'var(--ink-secondary)', margin: 0,
        ...(!open && long ? { display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}) }}>
        {post.body}
      </p>
      {long && !open && (
        <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none',
          color: 'var(--purple)', fontSize: 'var(--text-sm)', fontWeight: 600, padding: '4px 0 0', cursor: 'pointer' }}>
          ver más
        </button>
      )}
      {post.result && (
        <p style={{ fontSize: 'var(--text-sm)', margin: '9px 0 0', color: 'var(--ink)' }}>
          <strong>Resultado:</strong> {post.result}
        </p>
      )}
      <button onClick={() => navigate(`/helper/${post.helperId}`)}
        aria-label={`Ver perfil de ${post.who?.name}`}
        style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%',
          background: 'none', border: 'none', borderTop: '1px solid var(--ink-border)',
          margin: '12px 0 0', padding: '10px 0 0', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--purple-20)',
          color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11.5, fontWeight: 700 }}>
          {post.who?.name?.[0]}
        </span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink)', fontWeight: 600 }}>
          {post.who?.name?.split(' ').slice(0, 2).join(' ')}
          <span style={{ color: 'var(--ink-tertiary)', fontWeight: 400 }}> · {post.who?.specialty}</span>
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)' }}>
          {isFollowing?.(post.helperId) && <span style={{ color: 'var(--purple)', fontWeight: 700 }}>Siguiendo ✓ · </span>}
          {post.verified && <span style={{ color: 'var(--purple)', fontWeight: 700 }}>✓ contrastado · </span>}
          {post.dateLabel}
        </span>
      <button onClick={() => setOpenThread(v => !v)}
        aria-label={`${comments.length} comentarios`}
        style={{ background: 'none', border: 'none', padding: '8px 0 0', cursor: 'pointer',
          fontSize: 'var(--text-xs)', color: openThread ? 'var(--purple)' : 'var(--ink-tertiary)', fontWeight: 600 }}>
        💬 {comments.length > 0 ? comments.length : 'Comentar'}
      </button>
      </button>
    {openThread && (
        <div style={{ borderTop: '1px solid var(--ink-border)', marginTop: '10px', paddingTop: '10px' }}>
          {comments.map(c => (
            <div key={c.id} style={{ marginBottom: '10px', animation: 'popIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink)' }}>{c.author}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)' }}> · {c.ago}</span>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5, color: 'var(--ink-secondary)', margin: '2px 0 0' }}>{c.text}</p>
            </div>
          ))}
          {user ? (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '10px 0 8px' }}>
                {COMMENT_STARTERS.map(s => (
                  <button key={s} onClick={() => publicar(s)}
                    style={{ background: 'var(--purple-10)', color: 'var(--purple)', border: 'none',
                      borderRadius: 'var(--radius-full)', padding: '5px 11px', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') publicar(draft) }}
                  placeholder="Escribe un comentario…"
                  style={{ flex: 1, border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-full)',
                    padding: '9px 14px', fontSize: 'var(--text-sm)', outline: 'none', background: 'var(--paper)' }} />
                <button onClick={() => publicar(draft)} aria-label="Publicar comentario"
                  style={{ background: 'var(--purple)', color: 'white', border: 'none', borderRadius: '50%',
                    width: '36px', height: '36px', fontSize: 'var(--text-base)', cursor: 'pointer', flexShrink: 0 }}>→</button>
              </div>
            </>
          ) : (
            <button onClick={() => publicar('x')}
              style={{ background: 'none', border: '1px dashed var(--ink-border)', borderRadius: 'var(--radius-full)',
                padding: '9px 14px', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', width: '100%', cursor: 'pointer' }}>
              Crea tu cuenta para comentar
            </button>
          )}
        </div>
      )}
    </article>
  )
}
