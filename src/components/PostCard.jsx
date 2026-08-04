import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { TYPE_META, COMMENT_STARTERS } from '../data/obraPosts'

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
  const { user, toggleUtil, utilesDe, meSirve, addComment, commentsFor } = useUser()
  const [openThread, setOpenThread] = useState(false)
  const [draft, setDraft] = useState('')
  if (!post) return null

  const meta = post.type ? TYPE_META[post.type] : null
  const comments = commentsFor?.(post.id) || []
  const utiles = utilesDe?.(post.id) ?? 0
  const marcado = meSirve?.(post.id)

  const irAlPerfil = () => post.helperId && navigate(`/helper/${post.helperId}`)

  const pedirCuenta = () => {
    try { sessionStorage.setItem('nura_return_to', '/feed') } catch { /* noop */ }
    navigate('/login')
  }

  const publicar = txt => {
    const t = String(txt || '').trim()
    if (!t) return
    if (!user) return pedirCuenta()
    addComment(post.id, t)
    setDraft('')
  }

  return (
    <article style={{
      background: 'white', border: '1px solid var(--ink-border)',
      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
      padding: 'var(--space-14) var(--space-16)',
    }}>
      {/* ── El autor: siempre primero, siempre igual ── */}
      <button onClick={post.helperId ? irAlPerfil : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-10)', width: '100%',
          background: 'none', border: 'none', padding: 0, textAlign: 'left',
          cursor: post.helperId ? 'pointer' : 'default',
        }}>
        {post.avatarUrl
          ? <img src={post.avatarUrl} alt="" decoding="async" width={36} height={36}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          : <span style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: post.autorColor || 'var(--purple-20)', color: 'var(--purple)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--text-sm)', fontWeight: 700,
            }}>{(post.autor || '?')[0]}</span>}
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink)' }}>
            {post.autor}
            {post.verified && <span style={{ color: 'var(--purple)' }}> ✓</span>}
          </span>
          <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)' }}>
            {post.rol}{post.rol && post.dateLabel ? ' · ' : ''}{post.dateLabel}
            {post.lugar && <> · {post.lugar}</>}
          </span>
        </span>
      </button>

      {/* El sello del manifiesto: "resultados confirmados por quien los
          vivio". Si no hay confirmacion real, NO se finge: la pieza sale
          sin sello. La confianza se demuestra, no se declara. */}
      {post.confirmado && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--space-6)',
          background: 'rgba(16,185,129,0.10)', color: 'var(--green-dot, #10B981)',
          borderRadius: 'var(--radius-full)', padding: '4px var(--space-10)',
          fontSize: 'var(--text-xs)', fontWeight: 700, marginTop: 'var(--space-10)',
        }}>
          ✓ Confirmado por quien lo vivió
        </div>
      )}

      {/* ── El contenido ── */}
      {meta && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--space-4)',
          background: 'var(--purple-10)', color: 'var(--purple)', borderRadius: 'var(--radius-full)',
          padding: '3px var(--space-10)', fontSize: 'var(--text-xs)', fontWeight: 700,
          letterSpacing: '0.4px', textTransform: 'uppercase',
          margin: 'var(--space-12) 0 var(--space-6)',
        }}>{meta.icon} {meta.label}</div>
      )}

      {post.title && (
        <h3 style={{
          fontFamily: 'var(--font-voice)', fontWeight: 600, fontSize: 'var(--text-md)',
          letterSpacing: '-0.3px', color: 'var(--ink)',
          margin: meta ? '0 0 var(--space-6)' : 'var(--space-12) 0 var(--space-6)', lineHeight: 1.3,
        }}>{post.title}</h3>
      )}

      <p style={{
        fontSize: 'var(--text-sm)', lineHeight: 1.55, color: 'var(--ink-secondary)',
        margin: post.title ? 0 : 'var(--space-12) 0 0',
      }}>{post.body}</p>

      {post.result && (
        <p style={{ fontSize: 'var(--text-sm)', margin: 'var(--space-8) 0 0', color: 'var(--ink)' }}>
          <strong>Resultado:</strong> {post.result}
        </p>
      )}

      {post.mention && (
        <button onClick={irAlPerfil}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-8)', marginTop: 'var(--space-10)',
            background: 'var(--surface-subtle)', border: 'none', borderRadius: 'var(--radius-card)',
            padding: 'var(--space-8) var(--space-10)', width: '100%', cursor: 'pointer', textAlign: 'left',
          }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)' }}>
            Encontró a <strong style={{ color: 'var(--ink)' }}>{post.mention}</strong> →
          </span>
        </button>
      )}

      {/* ── La barra social: siempre presente, siempre igual ──
          Medido: estos dos botones median 22px de alto y eran ELLOS SOLOS
          52 de los 53 incumplimientos del minimo tactil de WCAG 2.2 AA
          (24x24) en toda la app — se repiten en cada publicacion de
          Comunidad y de la ficha. El padding vertical pasa de 4 a 8 y se
          fija minHeight 24. La pildora no tiene fondo ni borde, asi que
          crece la zona tocable sin que cambie NADA de lo que se ve. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-16)',
        borderTop: '1px solid var(--ink-border)', marginTop: 'var(--space-12)', paddingTop: 'var(--space-8)',
      }}>
        <button onClick={() => user ? toggleUtil(post.id) : pedirCuenta()}
          aria-pressed={!!marcado}
          style={{
            background: 'none', border: 'none', padding: 'var(--space-8) 0', cursor: 'pointer', minHeight: 24,
            fontSize: 'var(--text-xs)', fontWeight: 700,
            color: marcado ? 'var(--purple)' : 'var(--ink-tertiary)',
          }}>
          ✋ Me sirve{utiles > 0 ? ` · ${utiles}` : ''}
        </button>
        <button onClick={() => setOpenThread(v => !v)}
          style={{
            background: 'none', border: 'none', padding: 'var(--space-8) 0', cursor: 'pointer', minHeight: 24,
            fontSize: 'var(--text-xs)', fontWeight: 600, minWidth: 24,
            color: openThread ? 'var(--purple)' : 'var(--ink-tertiary)',
          }}>
          💬 {comments.length > 0 ? comments.length : 'Comentar'}
        </button>
      </div>

      {openThread && (
        <div style={{ marginTop: 'var(--space-10)' }}>
          {comments.map(c => (
            <div key={c.id} style={{ marginBottom: 'var(--space-10)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ink)' }}>{c.author}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)' }}> · {c.ago}</span>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5, color: 'var(--ink-secondary)', margin: '2px 0 0' }}>
                {c.text}
              </p>
            </div>
          ))}
          {user ? (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', margin: 'var(--space-10) 0 var(--space-8)' }}>
                {COMMENT_STARTERS.map(s => (
                  <button key={s} onClick={() => publicar(s)}
                    style={{
                      background: 'var(--purple-10)', color: 'var(--purple)', border: 'none',
                      borderRadius: 'var(--radius-full)', padding: '5px var(--space-10)',
                      fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
                    }}>{s}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
                <input value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') publicar(draft) }}
                  placeholder="Escribe un comentario…"
                  style={{
                    flex: 1, border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-full)',
                    padding: 'var(--space-8) var(--space-14)', fontSize: 'var(--text-sm)',
                    outline: 'none', background: 'var(--paper)', fontFamily: 'inherit',
                  }} />
                <button onClick={() => publicar(draft)} aria-label="Publicar comentario"
                  style={{
                    background: 'var(--purple)', color: 'white', border: 'none', borderRadius: '50%',
                    width: 36, height: 36, fontSize: 'var(--text-md)', cursor: 'pointer', flexShrink: 0,
                  }}>→</button>
              </div>
            </>
          ) : (
            <button onClick={pedirCuenta}
              style={{
                background: 'none', border: '1px dashed var(--ink-border)', borderRadius: 'var(--radius-full)',
                padding: 'var(--space-8) var(--space-14)', fontSize: 'var(--text-xs)',
                color: 'var(--ink-secondary)', width: '100%', cursor: 'pointer',
              }}>
              Entra para comentar
            </button>
          )}
        </div>
      )}
    </article>
  )
}
