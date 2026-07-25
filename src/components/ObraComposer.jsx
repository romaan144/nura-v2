import { useState } from 'react'
import { useUser } from '../context/UserContext'
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'var(--paper)',
      overflowY: 'auto', padding: '54px 20px 40px' }}>
      <button onClick={onClose} aria-label="Cerrar"
        style={{ position: 'absolute', top: '16px', right: '18px', background: 'none',
          border: 'none', fontSize: 'var(--text-lg)', color: 'var(--ink-tertiary)', cursor: 'pointer' }}>×</button>

      <h1 style={{ fontFamily: 'var(--font-voice)', fontWeight: 700, fontSize: '24px',
        letterSpacing: '-0.8px', color: 'var(--ink)', margin: '0 0 6px' }}>
        Publica tu obra
      </h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', margin: '0 0 18px', lineHeight: 1.5 }}>
        Lo que demuestras aquí mejora cómo Nüra te recomienda.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '18px' }}>
        {Object.entries(TYPE_META).map(([k, meta]) => (
          <button key={k} onClick={() => setType(k)}
            style={{ background: type === k ? 'var(--purple)' : 'white',
              color: type === k ? 'white' : 'var(--ink)',
              border: '1px solid ' + (type === k ? 'var(--purple)' : 'var(--ink-border)'),
              borderRadius: '99px', padding: '7px 13px', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}>
            {meta.icon} {meta.label}
          </button>
        ))}
      </div>

      <input value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Título — ej. El caso de la R"
        style={{ width: '100%', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)',
          padding: '13px 15px', fontSize: 'var(--text-base)', marginBottom: '10px', outline: 'none', background: 'white' }} />

      <textarea value={body} onChange={e => setBody(e.target.value)} rows={6}
        placeholder="Qué necesitaba la persona, qué hiciste y cómo lo abordaste."
        style={{ width: '100%', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)',
          padding: '13px 15px', fontSize: 'var(--text-base)', marginBottom: '10px', outline: 'none',
          background: 'white', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />

      {needsResult && (
        <input value={result} onChange={e => setResult(e.target.value)}
          placeholder="Resultado — qué cambió al final"
          style={{ width: '100%', border: '1px solid var(--purple-20)', borderRadius: 'var(--radius-md)',
            padding: '13px 15px', fontSize: 'var(--text-base)', marginBottom: '10px', outline: 'none', background: 'white' }} />
      )}

      <button onClick={() => { addObra({ type, title, body, result }); onClose?.() }} disabled={!listo}
        style={{ width: '100%', background: listo ? 'var(--purple)' : 'var(--ink-border)',
          color: 'white', border: 'none', borderRadius: 'var(--radius-full)', padding: '14px',
          fontSize: 'var(--text-sm)', fontWeight: 700, cursor: listo ? 'pointer' : 'default', marginTop: '6px' }}>
        Publicar
      </button>
    </div>
  )
}
