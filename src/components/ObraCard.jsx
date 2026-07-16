import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TYPE_META } from '../data/obraPosts'

// ObraCard — la pieza canon de la Obra (Nüra Obra · F1)
export default function ObraCard({ post }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  if (!post) return null
  const meta = TYPE_META[post.type] || { label: 'Obra', icon: '✦' }
  const long = (post.body || '').length > 180

  return (
    <article style={{ background: 'white', border: '1px solid var(--ink-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', padding: '14px 15px' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px',
        background: 'var(--purple-10)', color: 'var(--purple)', borderRadius: '99px',
        padding: '3px 10px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.4px',
        textTransform: 'uppercase', marginBottom: '9px' }}>
        {meta.icon} {meta.label}
      </div>
      <h3 style={{ fontFamily: 'var(--font-voice)', fontWeight: 500, fontSize: '16.5px',
        letterSpacing: '-0.3px', color: 'var(--ink)', margin: '0 0 7px', lineHeight: 1.3 }}>
        {post.title}
      </h3>
      <p style={{ fontSize: '13.5px', lineHeight: 1.55, color: 'var(--ink-secondary)', margin: 0,
        ...(!open && long ? { display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}) }}>
        {post.body}
      </p>
      {long && !open && (
        <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none',
          color: 'var(--purple)', fontSize: '12.5px', fontWeight: 600, padding: '4px 0 0', cursor: 'pointer' }}>
          ver más
        </button>
      )}
      {post.result && (
        <p style={{ fontSize: '13px', margin: '9px 0 0', color: 'var(--ink)' }}>
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
        <span style={{ fontSize: '12.5px', color: 'var(--ink)', fontWeight: 600 }}>
          {post.who?.name?.split(' ').slice(0, 2).join(' ')}
          <span style={{ color: 'var(--ink-tertiary)', fontWeight: 400 }}> · {post.who?.specialty}</span>
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ink-tertiary)' }}>
          {post.verified && <span style={{ color: 'var(--purple)', fontWeight: 700 }}>✓ contrastado · </span>}
          {post.dateLabel}
        </span>
      </button>
    </article>
  )
}
