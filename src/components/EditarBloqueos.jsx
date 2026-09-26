// ── DÍAS U HORAS QUE NO PUEDES ───────────────────────────────────────────
// Vacaciones, un médico, un día libre. El profesional elige el día y marca
// «Todo el día» o solo algunas horas. Esas horas salen ocupadas para todos
// y nadie puede pedirlas. Solo se guarda cuándo, nunca por qué.
import { useState } from 'react'
import { X } from 'lucide-react'
import { isoLocal, bloqueosVigentes, alternarDia, alternarHora } from '../data/horarios'

const DIAS = 60

const nombreDia = fecha => {
  try {
    const t = new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    return t.charAt(0).toUpperCase() + t.slice(1)
  } catch { return fecha }
}

/**
 * `horario`: el que tiene marcado ahora (para saber qué días y horas trabaja).
 * `citas`: sus citas confirmadas ({ fecha, hora }), para avisar si bloquea
 * un día o una hora en que ya tiene una.
 */
export default function EditarBloqueos({ valor, horario, onCambio, citas = [] }) {
  const [dia, setDia] = useState('')
  const lista = bloqueosVigentes(valor)
  const dias = Array.from({ length: DIAS }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return { iso: isoLocal(d), trabaja: horario.dias.includes(d.getDay()), d }
  }).filter(x => x.trabaja)
  const delDia = dia ? lista.find(b => b.fecha === dia) : null
  const enteroDia = delDia && !delDia.horas
  const horaBloqueada = h => enteroDia || Boolean(delDia?.horas?.includes(h))
  const citasDe = fecha => citas.filter(c => c.fecha === fecha).map(c => c.hora)
  const citasDelDia = dia ? citasDe(dia) : []
  const chocan = b => citasDe(b.fecha).filter(h => !b.horas || b.horas.includes(h))

  const chip = (on, extra) => ({
    minHeight: 40, borderRadius: 'var(--radius-full)', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 'var(--text-sm)', fontWeight: 600,
    border: on ? '1px solid transparent' : '1px solid var(--ink-border)',
    background: on ? 'var(--ink-primary)' : 'white', color: on ? 'white' : 'var(--ink-secondary)', ...extra,
  })

  return (
    <div role="group" aria-labelledby="f-bloqueos" id="bloqueos" style={{ marginBottom: 'var(--space-16)' }}>
      <p id="f-bloqueos" style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink-primary)' }}>
        Días u horas que no puedes
      </p>
      <p style={{ margin: '0 0 var(--space-10)', fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)', lineHeight: 1.45 }}>
        Vacaciones, un médico, un día libre… Esas horas saldrán ocupadas y nadie podrá pedirlas. Nadie verá el motivo.
      </p>

      <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-secondary)' }}>Elige el día</p>
      <div role="listbox" aria-label="Día que quieres bloquear"
        style={{ display: 'flex', gap: 'var(--space-6)', overflowX: 'auto', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-10)' }}>
        {dias.map(({ iso, d }) => {
          const sel = dia === iso
          const b = lista.find(x => x.fecha === iso)
          return (
            <button key={iso} type="button" role="option" aria-selected={sel}
              aria-label={`${nombreDia(iso)}${b ? (b.horas ? ': algunas horas bloqueadas' : ': bloqueado') : ''}`}
              onClick={() => setDia(sel ? '' : iso)}
              style={{
                flexShrink: 0, minWidth: 58, padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                borderRadius: 'var(--radius-card)', cursor: 'pointer', fontFamily: 'inherit',
                border: sel ? '1px solid transparent' : '1px solid var(--ink-border)',
                background: sel ? 'var(--purple)' : 'white', color: sel ? 'white' : 'var(--ink-primary)',
              }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'capitalize' }}>
                {d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}
              </span>
              <span style={{ fontSize: 'var(--text-md)', fontWeight: 800, lineHeight: 1.1 }}>{d.getDate()}</span>
              <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 3,
                background: b ? (sel ? 'white' : 'var(--ink-primary)') : 'transparent' }} />
            </button>
          )
        })}
      </div>

      {dia && (
        <div style={{ padding: 'var(--space-12)', borderRadius: 'var(--radius-card)', background: 'var(--surface-subtle)', marginBottom: 'var(--space-10)' }}>
          <p style={{ margin: '0 0 var(--space-8)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink-primary)' }}>{nombreDia(dia)}</p>
          {citasDelDia.length > 0 && (
            <p role="status" style={{ margin: '0 0 var(--space-8)', fontSize: 'var(--text-xs)', color: '#B45309', lineHeight: 1.45 }}>
              Ese día tienes {citasDelDia.length === 1 ? 'una cita confirmada' : `${citasDelDia.length} citas confirmadas`} a las {citasDelDia.join(', ')}.
              Si lo bloqueas, al guardar podrás cancelarla y avisar a esa persona.
            </p>
          )}
          <button type="button" aria-pressed={Boolean(enteroDia)} onClick={() => onCambio(alternarDia(lista, dia))}
            style={chip(enteroDia, { width: '100%', marginBottom: 'var(--space-8)' })}>
            {enteroDia ? 'Todo el día bloqueado · Desbloquear' : 'No puedo en todo el día'}
          </button>
          <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)' }}>O solo algunas horas:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)' }}>
            {horario.horas.map(h => {
              const on = horaBloqueada(h)
              return (
                <button key={h} type="button" aria-pressed={on} aria-label={`${h}: ${on ? 'bloqueada' : 'libre'}${citasDelDia.includes(h) ? ', tienes una cita' : ''}`}
                  onClick={() => onCambio(alternarHora(lista, dia, h, horario.horas))}
                  style={chip(on, { padding: 0, textDecoration: on ? 'line-through' : 'none' })}>{h}</button>
              )
            })}
          </div>
        </div>
      )}

      {lista.length > 0 && (
        <ul aria-label="Lo que tienes bloqueado" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {lista.map(b => (
            <li key={b.fecha} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', padding: 'var(--space-6) var(--space-6) var(--space-6) var(--space-12)',
              border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-card)', background: 'white' }}>
              <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--ink-primary)' }}>
                <strong>{nombreDia(b.fecha)}</strong> · {b.horas ? b.horas.join(', ') : 'todo el día'}
                {chocan(b).length > 0 && (
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#B45309' }}>
                    Tienes cita a las {chocan(b).join(', ')}
                  </span>
                )}
              </span>
              <button type="button" aria-label={`Quitar el bloqueo del ${nombreDia(b.fecha)}`}
                onClick={() => onCambio(lista.filter(x => x.fecha !== b.fecha))}
                style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', border: 'none', background: 'transparent',
                  color: 'var(--ink-secondary)', cursor: 'pointer', borderRadius: 'var(--radius-full)' }}>
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
