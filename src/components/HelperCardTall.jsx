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
        borderRadius: small ? '16px' : '20px', boxShadow: small ? 'var(--shadow-sm)' : 'var(--shadow-md)',
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
        {helper.online && <LiveDot />}
      </div>

      <div style={{ fontSize: small ? '14px' : '19px', fontWeight: 700, color: 'var(--ink)',
        letterSpacing: '-0.4px', lineHeight: 1.2 }}>
        {firstName}{lastInitial ? ` ${lastInitial}.` : ''}
        {helper.verified && <span style={{ color: 'var(--purple)', marginLeft: '4px' }}>✓</span>}
      </div>

      <div style={{ fontSize: small ? '11px' : '13px', color: 'var(--ink-secondary)',
        marginTop: '3px', lineHeight: 1.35 }}>
        {helper.specialty}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
        gap: small ? '6px' : '10px', marginTop: small ? '6px' : '10px',
        fontSize: small ? '11px' : '12.5px' }}>
        {helper.rating && (
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>
            <span style={{ color: 'var(--amber, #F59E0B)' }}>★</span> {helper.rating}
          </span>
        )}
        {!small && helper.price && helper.price !== 'Consultar' &&
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{helper.price}</span>}
        {helper.distance && <span style={{ color: 'var(--ink-tertiary)' }}>a {helper.distance} km</span>}
      </div>

      {!small && (
        <button onClick={handleContact}
          style={{ width: '100%', marginTop: '16px', background: 'var(--purple)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-full)', padding: '13px',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
          Escribir a {firstName}
        </button>
      )}
    </div>
  )
}
