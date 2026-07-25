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
  neutral: { color: 'var(--ink-secondary)', background: 'var(--surface-subtle)', border: '1px solid var(--ink-border)' },
}

export function Badge({ variant = 'neutral', size = 'sm', children, style }) {
  const v = BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral
  const sizes = {
    xs: { fontSize: '9px',  padding: '1px 5px' },
    sm: { fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-8)' },
    md: { fontSize: 'var(--text-xs)', padding: 'var(--space-3) var(--space-10)' },
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)',
      fontWeight: 600, borderRadius: 'var(--radius-full)',
      whiteSpace: 'nowrap', letterSpacing: '0.1px',
      ...(sizes[size] || sizes.sm), ...v, ...style,
    }}>{children}</span>
  )
}

// Punto verde de "activo / disponible" — un solo verde en toda la app
export function LiveDot({ size = 10, ring = true, style }) {
  return (
    <span aria-hidden="true" style={{
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
    <div style={{ display: 'flex', gap: 'var(--space-10)', alignItems: 'flex-start', ...style }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: BUBBLE_COLORS[index % BUBBLE_COLORS.length], flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--text-xs)', fontWeight: 700, color: 'white',
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          background: 'var(--surface-subtle)', borderRadius: '0 12px 12px 12px',
          padding: 'var(--space-10) var(--space-12)', marginBottom: 'var(--space-4)',
        }}>
          <p style={{
            fontSize: 'var(--text-sm)', color: 'var(--ink)', lineHeight: 1.5,
            margin: 0, letterSpacing: '-0.1px',
            fontFamily: 'var(--font-voice)', 
          }}>"{text}"</p>
        </div>
        {author && (
          <span style={{
            fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)',
            fontWeight: 500, paddingLeft: 'var(--space-4)',
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
      background: 'var(--surface-subtle)', borderRadius: 'var(--radius-card)',
      overflow: 'hidden', border: '1px solid var(--ink-border)',
      width: '100%', maxWidth: '320px', ...style,
    }}>
      {items.map((s, i) => (
        <div key={i} style={{
          flex: 1, padding: 'var(--space-10) var(--space-8)', textAlign: 'center',
          borderRight: i < items.length - 1 ? '1px solid var(--ink-border)' : 'none',
        }}>
          <div style={{
            fontSize: 'var(--text-base)', fontWeight: 800,
            color: s.color || 'var(--ink)', letterSpacing: '-0.4px',
          }}>{s.value}</div>
          <div style={{
            fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)',
            marginTop: '1px', fontWeight: 500,
          }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Button — la primitiva que faltaba. 138 botones vivian dibujados a
// mano; el area tactil de 44px se garantiza aqui una vez, no 138.
// ═══════════════════════════════════════════════════════════════
export function Button({
  variant = 'primary', full = false, disabled = false,
  onClick, children, style, ...rest
}) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 'var(--space-6)',
    minHeight: '44px',                       // area tactil: ley, no opcion
    padding: '0 var(--space-20)',
    width: full ? '100%' : undefined,
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)', fontWeight: 700,
    fontFamily: 'inherit', lineHeight: 1,
    cursor: disabled ? 'default' : 'pointer',
    transition: 'opacity 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
    opacity: disabled ? 0.45 : 1,
  }
  const skins = {
    primary:   { background: 'var(--purple)', color: 'white', border: 'none' },
    secondary: { background: 'white', color: 'var(--ink)', border: '1px solid var(--ink-border)' },
    ghost:     { background: 'none', color: 'var(--purple)', border: 'none' },
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...(skins[variant] || skins.primary), ...style }}
      {...rest}
    >
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// SectionLabel — el rotulo de seccion. Convivian SIETE trackings
// distintos (0.3 a 1px); en versalitas de 11px lo sano es 0,05-0,08em,
// asi que 0.6px es calibrado, no promedio. No se queda con el margen:
// cada sitio conserva el suyo via style, para no mover layout.
// ═══════════════════════════════════════════════════════════════
export function SectionLabel({ tone = 'muted', children, style, ...rest }) {
  return (
    <div
      style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 700,
        letterSpacing: '0.6px',
        textTransform: 'uppercase',
        color: tone === 'brand' ? 'var(--purple)' : 'var(--ink-tertiary)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// EmptyState — un vacio no es un error: es la mejor ocasion de
// explicar que hace el producto. Voz de Nura, apoyo, y SIEMPRE una
// salida (dos de los cuatro anteriores eran callejones sin salida).
// Sin icono: la identidad de Nura es su voz, y un pictograma de "no
// hay nada" refuerza la ausencia en vez de la promesa.
// ═══════════════════════════════════════════════════════════════
export function EmptyState({ title, hint, actionLabel, onAction, style }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px var(--space-24) var(--space-24)', ...style }}>
      <p style={{
        fontFamily: 'var(--font-voice)', fontSize: 'var(--text-heading)', fontWeight: 500,
        color: 'var(--ink)', lineHeight: 1.45, letterSpacing: '-0.3px',
        margin: '0 0 var(--space-8)',
      }}>
        {title}
      </p>
      {hint && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', lineHeight: 1.5, margin: 0 }}>
          {hint}
        </p>
      )}
      {actionLabel && onAction && (
        <div style={{ marginTop: 'var(--space-20)', display: 'flex', justifyContent: 'center' }}>
          <Button variant="secondary" onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Skeleton — la espera dibuja la FORMA de lo que viene, no un
// simbolo abstracto de que algo pasa: el ojo ya sabe donde aterrizara
// el contenido y la espera se siente mas corta.
// ═══════════════════════════════════════════════════════════════
export function Skeleton({ variant = 'card', count = 1, style }) {
  const uno = i => variant === 'block' ? (
    <div key={i} style={{ padding: 'var(--space-12) 0' }}>
      <div className="skeleton skeleton-line-lg" />
      <div className="skeleton skeleton-line-sm" style={{ marginTop: 'var(--space-8)' }} />
    </div>
  ) : (
    <div key={i} className="skeleton-card">
      <div className="skeleton skeleton-avatar" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line-lg" />
        <div className="skeleton skeleton-line-md" />
        <div className="skeleton skeleton-line-sm" />
      </div>
    </div>
  )
  return <div style={style}>{Array.from({ length: count }, (_, i) => uno(i))}</div>
}
