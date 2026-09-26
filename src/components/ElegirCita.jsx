// ── ELEGIR DÍA Y HORA ────────────────────────────────────────────────────
// Una sola pieza para pedir cita, desde la ficha y desde el chat. Antes
// había dos hojas con reglas distintas (en la de la ficha se podía enviar
// sin hora) y solo se veían 7 días sin saber cuáles tenían huecos.
//
// Cada día dice lo que hay: «No trabaja», «Completo» o cuántos huecos
// quedan. Las horas, por mañana / tarde / noche; las cogidas, tachadas; la
// que ya pediste, marcada como tuya.
import { useEffect, useState } from 'react'
import { useUser } from '../context/UserContext'
import { ocupadasDe } from '../utils/escrituras'
import { SectionLabel } from './ui'
import { slotsDe, ocupacionesDe, huecosLibres, horarioDe, isoLocal, motivoSinHuecos, FRASE_SIN_HUECOS } from '../data/horarios'

const DIAS = 14

function tramoDe(hora) {
  const h = parseInt(hora, 10)
  return h < 14 ? 'Mañana' : h < 20 ? 'Tarde' : 'Noche'
}

export default function ElegirCita({ helper, date, time, onDate, onTime }) {
  const { citas, services } = useUser()
  // Las que ya ha aceptado con otras personas (servidor): solo día y hora.
  const [deOtros, setDeOtros] = useState([])
  useEffect(() => {
    let vivo = true
    ocupadasDe(helper?.id).then(l => { if (vivo) setDeOtros(l) })
    return () => { vivo = false }
  }, [helper?.id])
  const mias = ocupacionesDe(citas, services)
  const ocupadas = [
    ...mias,
    ...deOtros
      .filter(o => !mias.some(m => String(m.helperId) === String(helper?.id) && m.fecha === o.fecha && m.hora === o.hora))
      .map(o => ({ helperId: helper?.id, fecha: o.fecha, hora: o.hora, estado: 'confirmada', deOtro: true })),
  ]
  const trabaja = horarioDe(helper).dias

  const dias = Array.from({ length: DIAS }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    const iso = isoLocal(d)
    const libres = trabaja.includes(d.getDay()) ? huecosLibres(helper, iso, ocupadas) : -1
    return {
      iso, libres,
      arriba: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', ''),
      numero: d.getDate(),
      abajo: libres < 0 ? 'No trabaja' : libres === 0 ? ({ tarde: i === 0 ? 'Terminado' : 'Completo', bloqueado: 'No disponible' }[motivoSinHuecos(helper, iso)] || 'Completo') : `${libres} ${libres === 1 ? 'hueco' : 'huecos'}`,
    }
  })

  const slots = date ? slotsDe(helper, date, ocupadas) : []
  const tramos = ['Mañana', 'Tarde', 'Noche']
    .map(t => ({ t, horas: slots.filter(s => tramoDe(s.hora) === t) }))
    .filter(x => x.horas.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-14)' }}>
      <div>
        <SectionLabel tone="muted" style={{ margin: '0 0 var(--space-8)', color: 'var(--ink-tertiary)' }}>Día</SectionLabel>
        <div role="listbox" aria-label="Elige un día"
          style={{ display: 'flex', gap: 'var(--space-6)', overflowX: 'auto', paddingBottom: 'var(--space-4)', scrollSnapType: 'x proximity' }}>
          {dias.map(d => {
            const sel = date === d.iso
            const puede = d.libres > 0
            return (
              <button key={d.iso} type="button" role="option" aria-selected={sel} disabled={!puede}
                aria-label={`${d.arriba} ${d.numero}: ${d.abajo}`}
                onClick={() => { onDate(d.iso); onTime('') }}
                style={{
                  flexShrink: 0, minWidth: 66, padding: 'var(--space-8) var(--space-6)', scrollSnapAlign: 'start',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  background: sel ? 'var(--purple)' : puede ? 'var(--surface-subtle)' : 'transparent',
                  color: sel ? 'white' : puede ? 'var(--ink-primary)' : 'var(--ink-tertiary)',
                  border: puede || sel ? '1px solid transparent' : '1px dashed var(--ink-border, rgba(33,29,51,0.16))',
                  borderRadius: 'var(--radius-card)', cursor: puede ? 'pointer' : 'default', fontFamily: 'inherit',
                }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'capitalize' }}>{d.arriba}</span>
                <span style={{ fontSize: 'var(--text-md)', fontWeight: 800, lineHeight: 1.1 }}>{d.numero}</span>
                <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                  color: sel ? 'rgba(255,255,255,0.9)' : puede ? 'var(--green-ink, #067647)' : 'var(--ink-tertiary)' }}>{d.abajo}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <SectionLabel tone="muted" style={{ margin: '0 0 var(--space-8)', color: 'var(--ink-tertiary)' }}>Hora</SectionLabel>
        {!date ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', margin: 0 }}>Elige antes un día.</p>
        ) : !slots.length ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', margin: 0 }}>{FRASE_SIN_HUECOS[motivoSinHuecos(helper, date)]}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
            {tramos.map(({ t, horas }) => (
              <div key={t}>
                <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-secondary)' }}>{t}</p>
                <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                  {horas.map(({ hora, estado }) => {
                    const libre = estado === 'libre'
                    const sel = time === hora
                    const que = estado === 'ocupada' ? 'ocupada' : estado === 'tuya' ? 'es tuya' : 'libre'
                    return (
                      <button key={hora} type="button" disabled={!libre} aria-pressed={sel}
                        aria-label={`${hora}: ${que}`} title={libre ? '' : que}
                        onClick={() => onTime(hora)}
                        style={{
                          minWidth: 62, minHeight: 36, padding: '0 var(--space-10)',
                          background: sel ? 'var(--purple)' : libre ? 'var(--surface-subtle)' : estado === 'tuya' ? 'var(--purple-10)' : 'transparent',
                          color: sel ? 'white' : libre ? 'var(--ink-primary)' : estado === 'tuya' ? 'var(--purple-ink)' : 'var(--ink-tertiary)',
                          border: libre || sel ? '1px solid transparent' : estado === 'tuya' ? '1px solid var(--purple-30, rgba(123,47,255,0.3))' : '1px dashed var(--ink-border, rgba(33,29,51,0.16))',
                          textDecoration: estado === 'ocupada' ? 'line-through' : 'none',
                          borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)', fontWeight: 600,
                          cursor: libre ? 'pointer' : 'default', fontFamily: 'inherit',
                        }}>{hora}</button>
                    )
                  })}
                </div>
              </div>
            ))}
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)' }}>
              Tachadas: ya las tiene cogidas.{slots.some(s => s.estado === 'tuya') ? ' En morado: la tuya.' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
