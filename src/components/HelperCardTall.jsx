import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { showToast } from './Toast'
import { haptic } from '../utils/haptic'
import { getFirstName } from '../utils/name'
import { LiveDot } from './ui'

// ═══════════════════════════════════════════════════════════════
// La Tarjeta Vertical — la recomendación como protagonista.
// Misma persona, mismos datos y mismo flujo que la Tarjeta canon;
// cambia la arquitectura: retrato arriba, esencia centrada, una
// acción ancha. `small` la reduce para las alternativas: coherencia
// por escala, no por invención.
// ═══════════════════════════════════════════════════════════════
export default function HelperCardTall({ helper, small = false }) {
  const navigate = useNavigate()
  const { user } = useUser()
  if (!helper) return null

  const firstName = getFirstName(helper.name)
  const lastInitial = helper.name?.split(' ')[1]?.[0]
  const av = small ? 62 : 96

  function handleTap() {
    const reason = window.__nuraMatchReasons?.[String(helper.id)]
    navigate(`/helper/${helper.id}`, {
      state: { helper, fromSearch: true, matchReason: reason, userQuery: window.__nuraLastQuery, analysis: window.__nuraLastAnalysis },
    })
  }

  function handleContact(e) {
    e.stopPropagation()
    haptic('medium')
    if (!user) {
      sessionStorage.setItem('nura_return_to', `/chat/${helper.id}`)
      sessionStorage.setItem('nura_pending_helper', JSON.stringify(helper))
      showToast('Crea tu cuenta para contactar con este profesional')
      setTimeout(() => navigate('/login'), 600)
      return
    }
    navigate(`/chat/${helper.id}`, { state: { helper, userQuery: window.__nuraLastQuery, analysis: window.__nuraLastAnalysis } })
  }

  return (
    <div onClick={handleTap} role="button" aria-label={`Ver perfil de ${helper.name}`}
      style={{
        background: 'white', border: '1px solid var(--ink-border)',
        borderRadius: small ? 'var(--radius-card)' : 'var(--radius-md)', boxShadow: small ? 'var(--shadow-sm)' : 'var(--shadow-md)',
        padding: small ? '14px 10px 12px' : '22px 18px 18px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', cursor: 'pointer', width: '100%',
      }}>
      <div style={{ position: 'relative', marginBottom: small ? '8px' : '12px' }}>
        {helper.avatarUrl
          ? <img src={helper.avatarUrl} alt="" decoding="async" width={av} height={av}
              style={{ width: av, height: av, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: av, height: av, borderRadius: '50%', background: helper.avatarColor || 'var(--purple)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: small ? 22 : 34, fontWeight: 700 }}>{helper.avatar || firstName?.[0]}</div>}
        {helper.online && <LiveDot style={{ position: 'absolute', bottom: 1, right: 1 }} />}
      </div>

      <div style={{ fontSize: small ? 'var(--text-sm)' : 'var(--text-heading)', fontWeight: 700, color: 'var(--ink)',
        letterSpacing: '-0.4px', lineHeight: 1.2 }}>
        {firstName}{lastInitial ? ` ${lastInitial}.` : ''}
        {helper.verified && <span style={{ color: 'var(--purple)', marginLeft: 'var(--space-4)' }}>✓</span>}
      </div>

      <div style={{ fontSize: small ? 'var(--text-xs)' : 'var(--text-sm)', color: 'var(--ink-secondary)',
        marginTop: 'var(--space-3)', lineHeight: 1.35 }}>
        {helper.specialty}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
        gap: small ? '6px' : '10px', marginTop: small ? '6px' : '10px',
        fontSize: small ? 'var(--text-xs)' : 'var(--text-sm)' }}>
        {helper.rating && (
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>
            <span style={{ color: 'var(--amber, #F59E0B)' }}>★</span> {helper.rating}
          </span>
        )}
        {!small && helper.price && helper.price !== 'Consultar' &&
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{helper.price}</span>}
        {helper.distance && <span style={{ color: 'var(--ink-tertiary)' }}>a {helper.distance} km</span>}
      </div>

      {!small && (helper.quote || helper.bio) && (
        <div style={{ marginTop: 'var(--space-14)', paddingTop: 'var(--space-14)', borderTop: '1px solid var(--ink-border)', width: '100%' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--purple)',
            letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: '7px' }}>
            En sus propias palabras
          </div>
          <p style={{ fontFamily: 'var(--font-voice)', fontSize: 'var(--text-sm)', fontWeight: 500,
            color: 'var(--ink)', lineHeight: 1.5, letterSpacing: '-0.2px', margin: 0,
            display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            “{helper.quote || helper.bio}”
          </p>
        </div>
      )}

      {!small && (helper.responseTime || helper.experience || helper.dniVerified) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--space-6)', marginTop: 'var(--space-12)' }}>
          {helper.responseTime && (
            <span style={{ background: 'var(--paper)', border: '1px solid var(--ink-border)',
              borderRadius: 'var(--radius-full)', padding: 'var(--space-4) var(--space-10)', fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)' }}>
              Responde en {helper.responseTime}
            </span>
          )}
          {helper.experience && (
            <span style={{ background: 'var(--paper)', border: '1px solid var(--ink-border)',
              borderRadius: 'var(--radius-full)', padding: 'var(--space-4) var(--space-10)', fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)' }}>
              {helper.experience}
            </span>
          )}
          {helper.dniVerified && (
            <span style={{ background: 'var(--purple-10)', borderRadius: 'var(--radius-full)', padding: 'var(--space-4) var(--space-10)',
              fontSize: 'var(--text-xs)', color: 'var(--purple)', fontWeight: 600 }}>
              Identidad verificada
            </span>
          )}
        </div>
      )}

      {!small && (
        <button onClick={handleContact}
          style={{ width: '100%', marginTop: 'var(--space-16)', background: 'var(--purple)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-full)', padding: '13px',
            fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer' }}>
          Escribir a {firstName}
        </button>
      )}
    </div>
  )
}
