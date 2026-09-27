// ── ELEGIR DÍA Y HORA ────────────────────────────────────────────────────
// Una sola pieza para pedir cita, desde la ficha y desde el chat. Antes
// había dos hojas con reglas distintas (en la de la ficha se podía enviar
// sin hora) y solo se veían 7 días sin saber cuáles tenían huecos.
//
// Cada día dice lo que hay: «No trabaja», «Completo» o cuántos huecos
// quedan. Las horas, por mañana / tarde / noche; las cogidas, tachadas; la
// que ya pediste, marcada como tuya.
import { useEffect, useState } from 'react'
import styles from './ElegirCita.module.css'
import { useUser } from '../context/UserContext'
import { ocupadasDe } from '../utils/escrituras'
import { Calendar, Clock, Check } from 'lucide-react'
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
      mes: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
      fechaLarga: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
      abajo: libres < 0 ? 'No trabaja' : libres === 0 ? ({ tarde: i === 0 ? 'Terminado' : 'Completo', bloqueado: 'No disponible' }[motivoSinHuecos(helper, iso)] || 'Completo') : `${libres} ${libres === 1 ? 'hueco' : 'huecos'}`,
    }
  })

  const slots = date ? slotsDe(helper, date, ocupadas) : []
  const tramos = ['Mañana', 'Tarde', 'Noche']
    .map(t => ({ t, horas: slots.filter(s => tramoDe(s.hora) === t) }))
    .filter(x => x.horas.length)

  return (
    <div className={styles.picker}>
      <div>
        <h3 className={styles.label}><Calendar size={17} aria-hidden="true" />1. Elige un día</h3>
        <p className={styles.range}>Próximos {DIAS} días · desliza para ver más</p>
        <div className={styles.days} role="group" aria-label="Elige un día">
          {dias.map(d => {
            const sel = date === d.iso
            const puede = d.libres > 0
            return (
              <button className={styles.day} key={d.iso} type="button" aria-pressed={sel} disabled={!puede}
                aria-label={`${d.fechaLarga}: ${d.abajo}`}
                onClick={() => { onDate(d.iso); onTime('') }}>
                <span className={styles.weekday}>{d.arriba}</span>
                <span className={styles.number}>{d.numero}<span className={styles.month}>{d.mes}</span></span>
                <span className={styles.availability}>{d.abajo}</span>
                {sel && <Check size={13} className={styles.dayCheck} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <h3 className={styles.label}><Clock size={17} aria-hidden="true" />2. Elige una hora</h3>
        {date && <p className={styles.selectedDate}>{new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>}
        {!date ? <p className={styles.empty}>Selecciona un día para ver sus horarios.</p>
          : !slots.length ? <p className={styles.empty}>{FRASE_SIN_HUECOS[motivoSinHuecos(helper, date)]}</p>
          : <div className={styles.periods}>
            {tramos.map(({ t, horas }) => (
              <div key={t}>
                <p className={styles.periodLabel}>{t}</p>
                <div className={styles.times}>
                  {horas.map(({ hora, estado }) => {
                    const libre = estado === 'libre'
                    const sel = time === hora
                    const que = estado === 'ocupada' ? 'ocupada' : estado === 'tuya' ? 'es tuya' : 'libre'
                    return (
                      <button className={styles.time} key={hora} type="button" disabled={!libre} aria-pressed={sel}
                        data-state={estado} aria-label={`${hora}: ${que}`} title={libre ? '' : que}
                        onClick={() => onTime(hora)}>{hora}{sel && <Check size={13} aria-hidden="true" />}</button>
                    )
                  })}
                </div>
              </div>
            ))}
            <p className={styles.legend}>Hora local. Tachadas: ocupadas.{slots.some(s => s.estado === 'tuya') ? ' En lila claro: la tuya.' : ''}</p>
          </div>}
      </div>
    </div>
  )
}
