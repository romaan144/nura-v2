// ── El día y la hora acordados en un chat ────────────────────────────────
//
// Al tocar Contratar, la hoja sale con el día y la hora de los que ya se
// ha hablado. El lector anterior tomaba cualquier número como hora («hace
// 5 años» → 5:00), confundía «por la mañana» con mañana y se quedaba con
// el primer día de la semana que apareciera, no con el acordado.
//
// Aquí: el ÚLTIMO mensaje que nombra un día manda; la hora solo si se dice
// de verdad («a las 10», «5 de la tarde», «17:00», «10h») y, si solo hay
// franja («por la tarde»), el primer hueco libre de esa franja. Y todo solo
// si ese profesional trabaja ese día y esa hora está libre: nunca se
// rellena algo que la hoja no deja elegir.

import { slotsDe, isoLocal } from '../data/horarios'

const plano = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const SEMANA = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 }

/** El día que nombra un texto, como fecha local, o null. */
function diaDe(t, hoy) {
  const d = new Date(hoy)
  // «por la mañana» / «de la mañana» es una franja, no el día siguiente.
  const sinFranja = t.replace(/\b(por|de|a) la manana\b/g, ' ')
  if (/\bpasado manana\b/.test(sinFranja)) { d.setDate(d.getDate() + 2); return d }
  const dia = sinFranja.match(/\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/)
  if (dia) { d.setDate(d.getDate() + ((SEMANA[dia[1]] - d.getDay() + 7) % 7 || 7)); return d }
  if (/\bmanana\b/.test(sinFranja)) { d.setDate(d.getDate() + 1); return d }
  if (/\bhoy\b/.test(sinFranja)) return d
  return null
}

/** La hora dicha de verdad, «17:00», o null. Nunca un número suelto. */
function horaDe(t) {
  const m = t.match(/\ba las (\d{1,2})(?::(\d{2}))?(?: (?:de la|por la) (manana|tarde|noche))?/)
    || t.match(/\b(\d{1,2}):(\d{2})\b/)
    || t.match(/\b(\d{1,2}) ?h\b()/)
    || t.match(/\b(\d{1,2}) de la (manana|tarde|noche)\b/)
  if (!m) return null
  // Las horas son en punto: «10:30» no se redondea, se deja elegir.
  if (/^\d{2}$/.test(m[2] || '') && m[2] !== '00') return null
  let h = parseInt(m[1], 10)
  const tramo = m[3] || (m[2] && !/^\d+$/.test(m[2]) ? m[2] : '')
  if ((tramo === 'tarde' || tramo === 'noche') && h < 12) h += 12
  return h >= 0 && h <= 23 ? `${h}:00` : null
}

function franjaDe(t) {
  if (/\b(por|de) la tarde\b/.test(t)) return h => h >= 14 && h < 20
  if (/\b(por|de) la noche\b/.test(t)) return h => h >= 20
  if (/\b(por|de) la manana\b/.test(t)) return h => h < 14
  return null
}

/**
 * { date, time } para la hoja de Contratar ('' si no se sabe).
 * `citas`: las ocupaciones conocidas (ocupacionesDe), para no proponer una
 * hora ya ocupada.
 */
export function citaDeLaConversacion(messages, helper, citas = [], hoy = new Date()) {
  const vacio = { date: '', time: '' }
  const textos = (messages || [])
    .filter(m => m.from === 'user' || m.from === 'helper')
    .map(m => plano(m.text || m.lines?.join(' ')))
  for (let i = textos.length - 1; i >= 0; i--) {
    const t = textos[i]
    const dia = diaDe(t, hoy)
    if (!dia) continue
    const date = isoLocal(dia)
    const libres = slotsDe(helper, date, citas).filter(s => s.estado === 'libre').map(s => s.hora)
    if (!libres.length) return vacio
    const hora = horaDe(t)
    if (hora) return { date, time: libres.includes(hora) ? hora : '' }
    const franja = franjaDe(t)
    const primera = franja && libres.find(h => franja(parseInt(h, 10)))
    return { date, time: primera || '' }
  }
  return vacio
}
