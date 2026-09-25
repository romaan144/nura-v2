// ── MI AGENDA: las citas de la profesional, de un vistazo ────────────────
// Antes solo veía cada cita abriendo su aviso, uno a uno. Aquí están las de
// los próximos 14 días, por día y por hora: confirmadas, por contestar y
// canceladas. Al tocar una, se abre su aviso (/r/:token) para contestarla.
// Sale de los mismos avisos que la bandeja: no pide nada más al servidor.
import { useNavigate } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { agendaDe, isoLocal } from '../data/horarios'

const DIAS = 14

const ESTADO = {
  'confirmada':    { texto: 'Confirmada',    color: 'var(--green-ink, #067647)' },
  'por-contestar': { texto: 'Por contestar', color: 'var(--purple-ink, #5B21B6)' },
  'sin-decidir':   { texto: 'Sin confirmar', color: '#B45309' },
  'cancelada':     { texto: 'Cancelada',     color: 'var(--ink-secondary)' },
}

function tituloDia(fecha, ahora) {
  const manana = new Date(ahora); manana.setDate(manana.getDate() + 1)
  if (fecha === isoLocal(ahora)) return 'Hoy'
  if (fecha === isoLocal(manana)) return 'Mañana'
  try {
    const t = new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    return t.charAt(0).toUpperCase() + t.slice(1)
  } catch { return fecha }
}

export default function AgendaProfesional({ avisos }) {
  const navigate = useNavigate()
  const ahora = new Date()
  const dias = agendaDe(avisos, ahora, DIAS)
  const porContestar = dias.flatMap(d => d.citas).filter(c => c.estado === 'por-contestar').length

  return (
    <section aria-labelledby="agenda-titulo" style={{ margin: '0 0 var(--space-20)' }}>
      <h2 id="agenda-titulo" style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink)', margin: '0 0 var(--space-8)', display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
        <CalendarDays size={16} aria-hidden="true" /> Mi agenda
        {porContestar > 0 && (
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'white', background: 'var(--purple)', borderRadius: 'var(--radius-full)', padding: '1px 8px' }}>
            {porContestar} por contestar
          </span>
        )}
      </h2>
      {!dias.length ? (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', margin: 0 }}>
          No tienes citas en los próximos {DIAS} días. Cuando alguien te proponga una, la verás aquí.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
          {dias.map(d => (
            <div key={d.fecha}>
              <h3 style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ink-secondary)' }}>
                {tituloDia(d.fecha, ahora)}
              </h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {d.citas.map(c => {
                  const e = ESTADO[c.estado]
                  const cancelada = c.estado === 'cancelada'
                  return (
                    <li key={c.id}>
                      <button type="button" onClick={() => navigate(`/r/${c.token}`)}
                        aria-label={`${tituloDia(d.fecha, ahora)} a las ${c.hora}: ${e.texto}`}
                        style={{
                          width: '100%', minHeight: 48, display: 'flex', alignItems: 'center', gap: 'var(--space-12)',
                          padding: 'var(--space-8) var(--space-12)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                          background: cancelada ? 'transparent' : 'var(--surface-subtle)',
                          border: cancelada ? '1px dashed var(--ink-border, rgba(33,29,51,0.16))' : '1px solid transparent',
                          borderRadius: 'var(--radius-card)',
                        }}>
                        <span style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: cancelada ? 'var(--ink-secondary)' : 'var(--ink)',
                          textDecoration: cancelada ? 'line-through' : 'none', minWidth: 52 }}>{c.hora}</span>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: e.color }}>{e.texto}</span>
                        {c.estado === 'cancelada' && (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)', marginLeft: 'auto' }}>Hora libre</span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
