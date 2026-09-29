import glass from './ui/glass'

// Al darse de alta, si su profesión todavía no existe en Nüra y nadie la ha
// buscado: oficios que SÍ existen y encajan, o quedarse con la suya. Mismo
// panel y botones que ConfirmarDeclarado; la decisión es siempre suya.

export default function ElegirOficio({ opciones, original, onElegir }) {
  const boton = {
    minHeight: 44,
    padding: '8px 14px',
    fontFamily: 'inherit',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
  }
  return (
    <div style={{ background: 'var(--glass-panel)', border: '1px solid var(--glass-edge)', borderRadius: 'var(--radius-glass)',
      padding: 'var(--space-16)', boxShadow: 'var(--glass-panel-shadow)' }}>
      {opciones.length > 0 && (
        <div role="group" aria-label="Profesiones que ya están en Nüra" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {opciones.map(o => (
            <button className="nura-glass-action" key={o} type="button" onClick={() => onElegir(o)}
              style={{ ...boton, ...(glass.selected) }}>
              {o}
            </button>
          ))}
        </div>
      )}
      <button className="nura-glass-action" type="button" onClick={() => onElegir(original)}
        style={{ ...boton, width: '100%', marginTop: opciones.length ? 'var(--space-12)' : 0, color: 'var(--ink-secondary)', ...(glass.control) }}>
        Mantener «{original}»
      </button>
    </div>
  )
}
