import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { showToast } from './Toast'
import { haptic } from '../utils/haptic'
import { getFirstName } from '../utils/name'
import { Badge, LiveDot } from './ui'

// ═══════════════════════════════════════════════════════════════
// La Tarjeta Persona — representación canónica del profesional
// en toda la app (resultados, Explorar, espejo del Primer Día,
// tiras). Aire: la persona protagonista, una línea de esencia,
// una señal de confianza, una sola acción.
// ═══════════════════════════════════════════════════════════════
export default function HelperCard({ helper, onContact, showContact = true, showPrice = false }) {
  // Navegacion diferida cancelable: si el componente se va antes de los
  // 600ms, el usuario NO acaba en Login sin haberlo pedido.
  const irLuego = useRef(null)
  useEffect(() => () => clearTimeout(irLuego.current), [])

  const navigate = useNavigate()
  const { user } = useUser()
  if (!helper) return null

  const firstName = getFirstName(helper.name)
  const lastInitial = helper.name?.split(' ')[1]?.[0]

  function handleTap() {
    const reason = window.__nuraMatchReasons?.[String(helper.id)]
    navigate(`/helper/${helper.id}`, {
      state: { helper, fromSearch: true, matchReason: reason, userQuery: window.__nuraLastQuery, analysis: window.__nuraLastAnalysis },
    })
  }

  function handleContact(e) {
    e.stopPropagation()
    haptic('medium')
    if (onContact) { onContact(helper); return }
    if (!user) {
      sessionStorage.setItem('nura_return_to', `/chat/${helper.id}`)
      sessionStorage.setItem('nura_pending_helper', JSON.stringify(helper))
      showToast('Para escribirle necesito saber quién eres. Es un minuto.')
      irLuego.current = setTimeout(() => navigate('/login'), 600)
      return
    }
    navigate(`/chat/${helper.id}`, { state: { helper, userQuery: window.__nuraLastQuery, analysis: window.__nuraLastAnalysis } })
  }

  const metaParts = []
  if (helper.rating) metaParts.push(
    <span key="r" style={{ color: 'var(--ink)', fontWeight: 700 }}>
      <span style={{ color: 'var(--amber, #F59E0B)' }}>★</span> {helper.rating}
      {helper.reviews > 0 && <span style={{ color: 'var(--ink-tertiary)', fontWeight: 500 }}> ({helper.reviews})</span>}
    </span>
  )
  if (showPrice && helper.price && helper.price !== 'Consultar')
    metaParts.push(<span key="p" style={{ color: 'var(--ink)', fontWeight: 600 }}>{helper.price}</span>)
  if (helper.distance)
    metaParts.push(<span key="d" style={{ color: 'var(--ink-tertiary)' }}>a {helper.distance} km</span>)
  if (helper.urgent)
    metaParts.push(<span key="u" style={{ color: 'var(--ink-tertiary)' }}>⚡ urgencias</span>)

  return (
    <div onClick={handleTap} role="button" aria-label={`Ver perfil de ${helper.name}`}
      style={{
        background: 'white', border: '1px solid var(--ink-border)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
        padding: 'var(--space-14)', cursor: 'pointer', width: '100%',
        display: 'flex', alignItems: 'center', gap: 'var(--space-12)',
      }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {helper.avatarUrl
          ? <img decoding="async" loading="eager" width="54" height="54" src={helper.avatarUrl} alt="" style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          : <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: helper.avatarColor || 'var(--purple)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: 'white',
            }}>{helper.avatar || helper.name?.[0] || '?'}</div>
        }
        {helper.available && <LiveDot size={13} style={{ position: 'absolute', bottom: 1, right: 1 }} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
          <span style={{
            fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.2px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{firstName}{lastInitial ? ` ${lastInitial}.` : ''}</span>
          {helper.verified && <Badge variant="success" size="xs">✓</Badge>}
        </div>
        <div style={{
          fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)', marginTop: 'var(--space-2)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {helper.specialty}{helper.zone ? ` · ${helper.zone}` : ''}
        </div>
        {metaParts.length > 0 && (
          <div style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            {metaParts.map((part, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                {i > 0 && <span style={{ color: 'var(--ink-disabled, rgba(33,29,51,0.2))' }}>·</span>}
                {part}
              </span>
            ))}
          </div>
        )}
      </div>

      {showContact && (
        <button onClick={handleContact} aria-label={`Escribir a ${firstName}`}
          style={{
            flexShrink: 0, background: 'var(--purple-10)', color: 'var(--purple)',
            border: '1px solid var(--purple-20)', borderRadius: 'var(--radius-full)',
            padding: 'var(--space-8) var(--space-14)', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer',
          }}>
          Escribir
        </button>
      )}
    </div>
  )
}
