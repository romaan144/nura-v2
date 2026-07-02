// ═══════════════════════════════════════════════════════════════
// Sistema de Diseño Nüra 2 — componentes base
//
// Todos los patrones visuales repetidos viven aquí, construidos
// sobre los tokens de index.css. Regla: ninguna pantalla vuelve a
// reimplementar estos patrones con estilos inline propios.
// ═══════════════════════════════════════════════════════════════

const BADGE_VARIANTS = {
  success: { color: '#065f46', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' },
  warning: { color: '#92400e', background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)' },
  purple:  { color: 'var(--purple)', background: 'var(--purple-10)', border: '1px solid var(--purple-20)' },
  neutral: { color: 'var(--ink-secondary)', background: 'rgba(0,0,0,0.04)', border: '1px solid var(--ink-border)' },
}

export function Badge({ variant = 'neutral', size = 'sm', children, style }) {
  const v = BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral
  const sizes = {
    xs: { fontSize: '9px',  padding: '1px 5px' },
    sm: { fontSize: '10px', padding: '2px 8px' },
    md: { fontSize: '10px', padding: '3px 10px' },
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontWeight: 600, borderRadius: 'var(--radius-full)',
      whiteSpace: 'nowrap', letterSpacing: '0.1px',
      ...(sizes[size] || sizes.sm), ...v, ...style,
    }}>{children}</span>
  )
}

// Punto verde de "activo / disponible" — un solo verde en toda la app
export function LiveDot({ size = 10, ring = true, style }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      background: 'var(--green-dot)',
      border: ring ? '2px solid white' : 'none',
      boxShadow: ring
        ? '0 1px 4px rgba(16,185,129,0.4)'
        : '0 0 0 3px rgba(16,185,129,0.15)',
      flexShrink: 0, ...style,
    }} />
  )
}

// Burbuja de conversación — reseñas y testimonios como mensajes reales
const BUBBLE_COLORS = ['var(--purple)', 'var(--green)', '#D97706']

export function Bubble({ text, author, index = 0, style }) {
  const initials = author
    ? author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', ...style }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: BUBBLE_COLORS[index % BUBBLE_COLORS.length], flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 700, color: 'white',
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          background: 'rgba(0,0,0,0.04)', borderRadius: '0 12px 12px 12px',
          padding: '10px 12px', marginBottom: '4px',
        }}>
          <p style={{
            fontSize: 'var(--text-sm)', color: 'var(--ink)', lineHeight: 1.5,
            margin: 0, letterSpacing: '-0.1px',
          }}>"{text}"</p>
        </div>
        {author && (
          <span style={{
            fontSize: '10px', color: 'var(--ink-tertiary)',
            fontWeight: 500, paddingLeft: '4px',
          }}>— {author}</span>
        )}
      </div>
    </div>
  )
}

// Barra de logros — los números presentados como historia, no como stats
export function StatBar({ stats, style }) {
  const items = (stats || []).filter(s => s && s.value != null)
  if (!items.length) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: 'rgba(0,0,0,0.03)', borderRadius: '14px',
      overflow: 'hidden', border: '1px solid var(--ink-border)',
      width: '100%', maxWidth: '320px', ...style,
    }}>
      {items.map((s, i) => (
        <div key={i} style={{
          flex: 1, padding: '10px 8px', textAlign: 'center',
          borderRight: i < items.length - 1 ? '1px solid var(--ink-border)' : 'none',
        }}>
          <div style={{
            fontSize: '16px', fontWeight: 800,
            color: s.color || 'var(--ink)', letterSpacing: '-0.4px',
          }}>{s.value}</div>
          <div style={{
            fontSize: '10px', color: 'var(--ink-tertiary)',
            marginTop: '1px', fontWeight: 500,
          }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}
