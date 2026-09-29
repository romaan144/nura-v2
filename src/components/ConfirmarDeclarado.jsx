import glass from './ui/glass'
import { useState } from 'react'
import { Check } from 'lucide-react'

// «¿Es correcto?» (docs/perfil-vivo.md §4). La IA propone; la persona
// decide. Todo empieza marcado y se quita con un toque: solo se guarda lo
// que sigue marcado al confirmar. Así la IA no puede publicar nada sobre
// nadie que esa persona no haya visto y aceptado.

export default function ConfirmarDeclarado({ items, onConfirmar, onSaltar, guardando = false, textoBoton = 'Es correcto' }) {
  const [fuera, setFuera] = useState(() => new Set())
  const alternar = clave => setFuera(prev => {
    const n = new Set(prev)
    if (n.has(clave)) n.delete(clave); else n.add(clave)
    return n
  })
  const elegidos = items.filter(i => !fuera.has(i.clave))

  return (
    <div style={{ background: 'var(--glass-panel)', border: '1px solid var(--glass-edge)', borderRadius: 'var(--radius-glass)',
      padding: 'var(--space-16)', boxShadow: 'var(--glass-panel-shadow)' }}>
      <div role="group" aria-label="Datos de tu perfil" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
        {items.map(i => {
          const on = !fuera.has(i.clave)
          return (
            <button className="nura-glass-action" key={i.clave} type="button" aria-pressed={on} onClick={() => alternar(i.clave)}
              style={{ display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              minHeight: 40,
              padding: '8px 14px',
              fontFamily: 'inherit',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              color: on ? 'var(--ink-primary)' : 'var(--ink-tertiary)',
              textDecoration: on ? 'none' : 'line-through',
              ...(on ? glass.selected : glass.control) }}>
              {on && <Check size={14} color="var(--purple)" aria-hidden="true" />}
              {i.etiqueta}
            </button>
          )
        })}
      </div>
      <p style={{ margin: 'var(--space-12) 0 0', fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)', lineHeight: 1.5 }}>
        Toca lo que no sea correcto para quitarlo. En tu ficha pondrá que lo dices tú.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-14)' }}>
        <button className="nura-glass-action" type="button" onClick={onSaltar} disabled={guardando}
          style={{ flex: 1,
              minHeight: 46,
              color: 'var(--ink-secondary)',
              fontFamily: 'inherit',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              ...(glass.control) }}>
          Sin esto
        </button>
        <button className="nura-glass-action" type="button" onClick={() => onConfirmar(elegidos)} disabled={guardando}
          style={{ flex: 2,
              minHeight: 46,
              fontFamily: 'inherit',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              cursor: 'pointer',
              opacity: guardando ? 0.6 : 1,
              ...(glass.primary) }}>
          {guardando ? 'Guardando…' : textoBoton}
        </button>
      </div>
    </div>
  )
}
