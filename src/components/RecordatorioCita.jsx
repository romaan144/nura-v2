// ── EL RECORDATORIO DE LA CITA ────────────────────────────────────────────
// Cuando falta un día o menos para una cita confirmada, sale arriba en
// Inicio: cuándo y con quién, un atajo para escribirle y la opción de
// cancelarla. Cancelar pide confirmación: el profesional lo verá y la hora
// quedará libre para otras personas. Se puede cerrar (para esa cita).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, X, MessageCircle } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { citaEn24h, isoLocal } from '../data/horarios'
import { getFirstName } from '../utils/name'
import { showToast } from './Toast'

const CERRADOS = 'nura_recordatorios_cerrados'
const leerCerrados = () => { try { return JSON.parse(localStorage.getItem(CERRADOS) || '[]') } catch { return [] } }
const claveDe = c => `${c.helperId}|${c.fecha}|${c.hora}`

function cuandoEs(c, ahora = new Date()) {
  const manana = new Date(ahora); manana.setDate(manana.getDate() + 1)
  const dia = c.fecha === isoLocal(ahora) ? 'Hoy' : c.fecha === isoLocal(manana) ? 'Mañana' : c.fecha
  return `${dia} a las ${c.hora}`
}

export default function RecordatorioCita() {
  const navigate = useNavigate()
  const { services, citas, cancelarCita } = useUser()
  const [ahora, setAhora] = useState(() => new Date())
  const [cerrados, setCerrados] = useState(leerCerrados)
  const [preguntando, setPreguntando] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  // Cada minuto: aparece al entrar en las 24 horas y se va al empezar.
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const cita = citaEn24h(services, citas, ahora)
  if (!cita || cerrados.includes(claveDe(cita))) return null
  const nombre = getFirstName(cita.helperName) || cita.helperName || 'tu profesional'

  const cerrar = () => {
    const nuevos = [...cerrados, claveDe(cita)].slice(-50)
    setCerrados(nuevos)
    try { localStorage.setItem(CERRADOS, JSON.stringify(nuevos)) } catch { /* solo en esta sesión */ }
  }

  const cancelar = async () => {
    setCancelando(true)
    const r = await cancelarCita(cita)
    setCancelando(false)
    if (r === 'fallo') { showToast('Sin conexión: la cita sigue en pie. Prueba otra vez.'); return }
    setPreguntando(false)
    showToast(`Cita cancelada. ${nombre} lo verá.`)
  }

  const boton = {
    minHeight: 36, padding: '0 var(--space-12)', borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 'var(--space-6)',
  }

  return (
    <section aria-label="Recordatorio de tu cita"
      style={{
        position: 'relative', margin: '0 0 var(--space-12)', padding: 'var(--space-14)',
        background: 'var(--purple-10, #F3EDFF)', border: '1px solid var(--purple-30, rgba(123,47,255,0.3))',
        borderRadius: 'var(--radius-card)',
      }}>
      <button type="button" onClick={cerrar} aria-label="Cerrar recordatorio"
        style={{ position: 'absolute', top: 4, right: 4, width: 36, height: 36, display: 'grid', placeItems: 'center',
          background: 'transparent', border: 'none', color: 'var(--ink-secondary)', cursor: 'pointer', borderRadius: 'var(--radius-full)' }}>
        <X size={16} />
      </button>
      <div style={{ display: 'flex', gap: 'var(--space-10)', alignItems: 'flex-start', paddingRight: 28 }}>
        <CalendarClock size={20} color="var(--purple-ink)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <div>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--purple-ink)' }}>Tu cita</p>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--ink-primary)' }}>{cuandoEs(cita, ahora)}</p>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)' }}>
            Con {nombre}{cita.specialty ? ` · ${cita.specialty}` : ''}
          </p>
        </div>
      </div>

      {!preguntando ? (
        <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-12)', flexWrap: 'wrap' }}>
          <button type="button"
            onClick={() => navigate(`/chat/${cita.helperId}`, { state: { helper: { id: cita.helperId, name: cita.helperName, specialty: cita.specialty, avatarUrl: cita.avatarUrl } } })}
            style={{ ...boton, background: 'var(--purple)', color: 'white', border: 'none' }}>
            <MessageCircle size={14} /> Escribir a {nombre}
          </button>
          <button type="button" onClick={() => setPreguntando(true)}
            style={{ ...boton, background: 'transparent', color: 'var(--ink-primary)', border: '1px solid var(--ink-border, rgba(33,29,51,0.16))' }}>
            Cancelar la cita
          </button>
        </div>
      ) : (
        <div role="group" aria-label="Confirmar cancelación" style={{ marginTop: 'var(--space-12)' }}>
          <p style={{ margin: '0 0 var(--space-8)', fontSize: 'var(--text-sm)', color: 'var(--ink-primary)' }}>
            ¿Cancelar la cita? {nombre} lo verá y esa hora quedará libre.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
            <button type="button" onClick={cancelar} disabled={cancelando}
              style={{ ...boton, background: 'var(--red-ink, #B42318)', color: 'white', border: 'none' }}>
              {cancelando ? 'Cancelando…' : 'Sí, cancelar'}
            </button>
            <button type="button" onClick={() => setPreguntando(false)} disabled={cancelando}
              style={{ ...boton, background: 'transparent', color: 'var(--ink-primary)', border: '1px solid var(--ink-border, rgba(33,29,51,0.16))' }}>
              No, la mantengo
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
