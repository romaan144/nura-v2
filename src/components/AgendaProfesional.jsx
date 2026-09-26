// ── MI AGENDA: las citas de la profesional, de un vistazo ────────────────
// Antes solo veía cada cita abriendo su aviso, uno a uno. Aquí están las de
// los próximos 14 días, por día y por hora: confirmadas, por contestar y
// canceladas. Al tocar una, se abre su aviso (/r/:token) para contestarla.
// Sale de los mismos avisos que la bandeja: no pide nada más al servidor.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CalendarOff, CalendarX, CalendarClock } from 'lucide-react'
import { agendaDe, isoLocal, cancelacionesNuevas, cambiosNuevos } from '../data/horarios'
import { cancelacionesVistas, marcarCancelacionesVistas } from '../utils/sinContestar'

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
  // Las que le han cancelado y aún no ha visto: arriba, hasta «Entendido».
  const [vistas, setVistas] = useState(cancelacionesVistas)
  const nuevas = cancelacionesNuevas(avisos, vistas, ahora)
  const entendido = () => {
    marcarCancelacionesVistas(nuevas.map(c => c.id))
    setVistas(cancelacionesVistas())
  }
  // Cambios de hora: UN aviso por cambio (no cancelación + propuesta sueltas).
  const cambios = cambiosNuevos(avisos, vistas, ahora)
  const cambiosVistos = () => {
    marcarCancelacionesVistas(cambios.map(c => c.id))
    setVistas(cancelacionesVistas())
  }

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
      {nuevas.length > 0 && (
        <div role="status" style={{ margin: '0 0 var(--space-12)', padding: 'var(--space-12)', borderRadius: 'var(--radius-card)',
          background: 'var(--surface-subtle)', border: '1px solid var(--ink-border, rgba(33,29,51,0.16))' }}>
          <p style={{ margin: '0 0 var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-6)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink-primary)' }}>
            <CalendarX size={16} aria-hidden="true" />
            {nuevas.length === 1 ? 'Te han cancelado una cita' : `Te han cancelado ${nuevas.length} citas`}
          </p>
          <ul style={{ listStyle: 'none', margin: '0 0 var(--space-10)', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {nuevas.map(c => (
              <li key={c.id} style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
                {tituloDia(c.fecha, ahora)} a las {c.hora}. Esa hora vuelve a estar libre.
              </li>
            ))}
          </ul>
          <button type="button" onClick={entendido}
            style={{ minHeight: 36, padding: '0 var(--space-14)', borderRadius: 'var(--radius-full)', border: 'none',
              background: 'var(--purple)', color: 'white', fontFamily: 'inherit', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer' }}>
            Entendido
          </button>
        </div>
      )}
      {cambios.length > 0 && (
        <div role="status" style={{ margin: '0 0 var(--space-12)', padding: 'var(--space-12)', borderRadius: 'var(--radius-card)',
          background: 'var(--surface-subtle)', border: '1px solid var(--ink-border, rgba(33,29,51,0.16))' }}>
          <p style={{ margin: '0 0 var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-6)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink-primary)' }}>
            <CalendarClock size={16} aria-hidden="true" />
            {cambios.length === 1 ? 'Te han cambiado una cita' : `Te han cambiado ${cambios.length} citas`}
          </p>
          <ul style={{ listStyle: 'none', margin: '0 0 var(--space-10)', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {cambios.map(c => (
              <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', flexWrap: 'wrap', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
                <span style={{ flex: '1 1 12rem' }}>
                  Pasa de {tituloDia(c.antes.fecha, ahora).toLowerCase()} a las {c.antes.hora} a {tituloDia(c.fecha, ahora).toLowerCase()} a las {c.hora}.
                </span>
                <button type="button" onClick={() => navigate(`/r/${c.token}`)}
                  style={{ minHeight: 36, padding: '0 var(--space-12)', borderRadius: 'var(--radius-full)', border: '1px solid var(--purple)',
                    background: 'white', color: 'var(--purple)', fontFamily: 'inherit', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer' }}>
                  Contestar
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={cambiosVistos}
            style={{ minHeight: 36, padding: '0 var(--space-14)', borderRadius: 'var(--radius-full)', border: 'none',
              background: 'var(--purple)', color: 'white', fontFamily: 'inherit', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer' }}>
            Entendido
          </button>
        </div>
      )}
      <button type="button" onClick={() => navigate('/profile', { state: { editar: 'bloqueos' } })}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-6)', minHeight: 36, padding: '0 var(--space-12)',
          margin: '0 0 var(--space-10)', borderRadius: 'var(--radius-full)', border: '1px solid var(--ink-border, rgba(33,29,51,0.16))',
          background: 'white', color: 'var(--ink-primary)', fontFamily: 'inherit', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}>
        <CalendarOff size={14} aria-hidden="true" /> Bloquear días u horas
      </button>
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
                  const e = c.estado === 'cancelada' && c.cancela === 'profesional' ? { ...ESTADO.cancelada, texto: 'La cancelaste' }
                    : c.estado === 'cancelada' && c.cancela === 'cambio' ? { ...ESTADO.cancelada, texto: 'Cambiada' }
                    : ESTADO[c.estado]
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
