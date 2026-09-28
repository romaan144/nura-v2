import glass from './ui/glass'
import ObraTypeIcon from './ObraTypeIcon'
import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { showToast } from './Toast'
import { TYPE_META } from '../data/obraPosts'

const NEEDS_RESULT = ['caso', 'trabajo', 'evolucion']

// ObraComposer — publicar con estructura: el formulario es el filtro anti-humo
export default function ObraComposer({ onClose }) {
  const { addObra } = useUser()
  const [type, setType] = useState('caso')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [result, setResult] = useState('')
  const needsResult = NEEDS_RESULT.includes(type)
  const listo = title.trim().length > 3 && body.trim().length > 20 && (!needsResult || result.trim().length > 3)

  return (
    <div className="nura-work-composer" style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'var(--paper)',
      overflowY: 'auto', overflowX: 'hidden', overscrollBehaviorY: 'contain', padding: '54px var(--space-20) 40px' }}>
      <button className="nura-glass-action" onClick={onClose} aria-label="Cerrar"
        style={{ position: 'absolute',
              top: '16px',
              right: '18px',
              fontSize: 'var(--text-lg)',
              color: 'var(--ink-tertiary)',
              cursor: 'pointer',
              ...(glass.circle) }}>×</button>

      <h1 style={{ fontFamily: 'var(--font-voice)', fontWeight: 700, fontSize: '24px',
        letterSpacing: '-0.8px', color: 'var(--ink)', margin: '0 0 var(--space-6)' }}>
        Publica tu obra
      </h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', margin: '0 0 18px', lineHeight: 1.5 }}>
        Lo que demuestras aquí mejora cómo Nüra te recomienda.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '18px' }}>
        {Object.entries(TYPE_META).map(([k, meta]) => (
          <button className="nura-glass-action" key={k} onClick={() => setType(k)}
            style={{ color: type === k ? 'white' : 'var(--ink)',
              padding: '7px 13px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              ...(type === k ? glass.selected : glass.control) }}>
            <ObraTypeIcon type={k} /> {meta.label}
          </button>
        ))}
      </div>

      <input className="nura-glass-field" value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Título — ej. El caso de la R"
        style={{ width: '100%',
              padding: '13px 15px',
              fontSize: 'var(--text-base)',
              marginBottom: 'var(--space-10)',
              outline: 'none',
              ...(glass.field) }} />

      <textarea className="nura-glass-field" value={body} onChange={e => setBody(e.target.value)} rows={6}
        placeholder="Qué necesitaba la persona, qué hiciste y cómo lo abordaste."
        style={{ width: '100%',
              padding: '13px 15px',
              fontSize: 'var(--text-base)',
              marginBottom: 'var(--space-10)',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              ...(glass.field) }} />

      {needsResult && (
        <input className="nura-glass-field" value={result} onChange={e => setResult(e.target.value)}
          placeholder="Resultado — qué cambió al final"
          style={{ width: '100%',
              padding: '13px 15px',
              fontSize: 'var(--text-base)',
              marginBottom: 'var(--space-10)',
              outline: 'none',
              ...(glass.field) }} />
      )}

      <button className="nura-glass-action" onClick={() => { addObra({ type, title, body, result }); showToast('Ya está publicado. Cuando alguien busque algo así, tu caso hablará por ti.'); onClose?.() }} disabled={!listo}
        style={{ width: '100%',
              color: 'white',
              padding: 'var(--space-14)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              cursor: listo ? 'pointer' : 'default',
              marginTop: 'var(--space-6)',
              ...(listo ? glass.primary : glass.disabled) }}>
        Publicar
      </button>
    </div>
  )
}
