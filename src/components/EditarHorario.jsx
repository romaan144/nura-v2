// ── TU HORARIO ───────────────────────────────────────────────────────────
// El profesional marca qué días y a qué horas trabaja. Es lo que ve quien
// pide cita en su ficha (las horas ya cogidas se restan aparte). Si no lo
// marca, Nüra usa el típico de su oficio.
import { DIAS_SEMANA, HORAS_POSIBLES } from '../data/horarios'

const franja = (desde, hasta) => HORAS_POSIBLES.filter(h => { const n = parseInt(h, 10); return n >= desde && n < hasta })
const ATAJOS = [
  ['Mañanas', franja(9, 14)],
  ['Tardes', franja(16, 20)],
  ['Mañana y tarde', [...franja(9, 14), ...franja(16, 20)]],
  ['Todo el día', franja(8, 21)],
]
const igual = (a, b) => a.length === b.length && a.every(x => b.includes(x))

export default function EditarHorario({ valor, onCambio }) {
  const { dias, horas } = valor
  const dia = n => onCambio({ ...valor, dias: dias.includes(n) ? dias.filter(d => d !== n) : [...dias, n] })
  const hora = h => onCambio({ ...valor, horas: horas.includes(h) ? horas.filter(x => x !== h) : [...horas, h] })
  const chip = (on, extra) => ({
    minHeight: 40, borderRadius: 'var(--radius-full)', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 'var(--text-sm)', fontWeight: 600,
    border: on ? '1px solid transparent' : '1px solid var(--ink-border)',
    background: on ? 'var(--purple)' : 'white', color: on ? 'white' : 'var(--ink-secondary)', ...extra,
  })

  return (
    <div role="group" aria-labelledby="f-horario" style={{ marginBottom: 'var(--space-16)' }}>
      <p id="f-horario" style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink-primary)' }}>
        Tu horario
      </p>
      <p style={{ margin: '0 0 var(--space-10)', fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)', lineHeight: 1.45 }}>
        Es lo que verá quien quiera pedirte cita.
      </p>

      <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-secondary)' }}>Días</p>
      <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-12)' }}>
        {DIAS_SEMANA.map(d => {
          const on = dias.includes(d.n)
          return (
            <button key={d.n} type="button" onClick={() => dia(d.n)} aria-pressed={on} aria-label={d.largo}
              style={chip(on, { flex: 1, minWidth: 0, padding: 0 })}>{d.corto}</button>
          )
        })}
      </div>

      <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-secondary)' }}>Horas</p>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-8)' }}>
        {ATAJOS.map(([nombre, hs]) => (
          <button key={nombre} type="button" onClick={() => onCambio({ ...valor, horas: hs })} aria-pressed={igual(horas, hs)}
            style={chip(igual(horas, hs), { padding: '0 var(--space-12)', fontSize: 'var(--text-xs)', minHeight: 36 })}>{nombre}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)' }}>
        {HORAS_POSIBLES.map(h => {
          const on = horas.includes(h)
          return (
            <button key={h} type="button" onClick={() => hora(h)} aria-pressed={on}
              style={chip(on, { padding: 0 })}>{h}</button>
          )
        })}
      </div>
      {(!dias.length || !horas.length) && (
        <p role="alert" style={{ margin: 'var(--space-8) 0 0', fontSize: 'var(--text-xs)', color: 'var(--red-ink)' }}>
          Marca al menos un día y una hora.
        </p>
      )}
    </div>
  )
}
