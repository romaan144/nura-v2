import { DEMO_MODE } from '../config'

// ═══════════════════════════════════════════════════════════════
// LA AGENDA — disponibilidad real, por horas.
// Antes: ocho horas fijas escritas a mano, iguales para los 123
// profesionales y para los siete dias. La app prometia precision y
// no la tenia. Aqui el horario nace de la categoria (un cerrajero de
// urgencias no trabaja como una logopeda) y la ocupacion se deriva
// de las citas reales.
// ═══════════════════════════════════════════════════════════════

// dias: 0=domingo … 6=sabado
const L_V = [1, 2, 3, 4, 5]
const L_S = [1, 2, 3, 4, 5, 6]
const TODOS = [0, 1, 2, 3, 4, 5, 6]

const franja = (desde, hasta) =>
  Array.from({ length: hasta - desde }, (_, i) => `${desde + i}:00`)

export const HORARIO_POR_CATEGORIA = {
  tecnico:    { dias: L_S,   horas: franja(8, 20) },   // urgencias: franja amplia
  hogar:      { dias: L_S,   horas: franja(8, 19) },
  logopedia:  { dias: L_V,   horas: franja(16, 20) },  // tras el colegio
  clases:     { dias: L_V,   horas: franja(16, 21) },
  salud:      { dias: L_V,   horas: franja(9, 14) },   // consulta de mañana
  legal:      { dias: L_V,   horas: franja(9, 14) },
  cuidado:    { dias: TODOS, horas: franja(8, 21) },   // la vida no descansa
  mascotas:   { dias: TODOS, horas: franja(8, 20) },
  entrenador: { dias: L_S,   horas: [...franja(7, 11), ...franja(17, 21)] },
}

const POR_DEFECTO = { dias: L_V, horas: franja(9, 19) }

// Todas las horas que se pueden marcar al elegir el horario propio.
export const HORAS_POSIBLES = franja(7, 23)
export const DIAS_SEMANA = [
  { n: 1, corto: 'L', largo: 'lunes' }, { n: 2, corto: 'M', largo: 'martes' },
  { n: 3, corto: 'X', largo: 'miércoles' }, { n: 4, corto: 'J', largo: 'jueves' },
  { n: 5, corto: 'V', largo: 'viernes' }, { n: 6, corto: 'S', largo: 'sábado' },
  { n: 0, corto: 'D', largo: 'domingo' },
]

/** Un horario marcado por el profesional, limpio; o null si no vale. */
export function horarioValido(h) {
  if (!h || !Array.isArray(h.dias) || !Array.isArray(h.horas)) return null
  const dias = [...new Set(h.dias.map(Number).filter(d => d >= 0 && d <= 6))].sort()
  const horas = HORAS_POSIBLES.filter(x => h.horas.includes(x))
  return dias.length && horas.length ? { dias, horas } : null
}

/** El del propio profesional si lo marcó; si no, el típico de su oficio. */
export function horarioDe(helper) {
  return horarioValido(helper?.horario) || HORARIO_POR_CATEGORIA[helper?.category] || POR_DEFECTO
}

/** El horario que Nüra supone para su oficio (punto de partida al editarlo). */
export const horarioDelOficio = categoria => HORARIO_POR_CATEGORIA[categoria] || POR_DEFECTO

/**
 * Las horas de un profesional en un dia, con su estado real.
 * @returns {{hora:string, estado:'libre'|'pendiente'|'ocupada'}[]}
 */
export function slotsDe(helper, fechaISO, citas = []) {
  if (!fechaISO) return []
  const h = horarioDe(helper)
  const dia = new Date(fechaISO + 'T12:00:00').getDay()
  if (!h.dias.includes(dia)) return []

  const suyas = (citas || []).filter(c => String(c.helperId) === String(helper?.id) && c.fecha === fechaISO)
  const ahora = new Date()
  const esHoy = fechaISO === isoLocal(ahora)
  const deOtros = ocupadasDeEjemplo(helper, fechaISO)

  return h.horas
    .filter(hora => !esHoy || parseInt(hora, 10) > ahora.getHours())
    .map(hora => {
      const c = suyas.find(x => x.hora === hora)
      // 'tuya': la ha pedido esta persona (pendiente o ya confirmada).
      // 'ocupada': la tiene aceptada con otra persona.
      if (c) return { hora, estado: c.deOtro ? 'ocupada' : 'tuya' }
      return { hora, estado: deOtros.has(hora) ? 'ocupada' : 'libre' }
    })
}

/** La fecha de HOY (o de `d`) en la hora de aquí, «2026-09-25». Con
 *  toISOString, entre las 0:00 y las 2:00 «hoy» salía como ayer (UTC). */
export function isoLocal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── LA AGENDA DE LOS PERFILES DE EJEMPLO ─────────────────────────────────
// Una agenda con todas las horas libres no parece de nadie. En la demo,
// cada profesional tiene horas ya cogidas por otros clientes: unas pocas
// sueltas, bastantes algunos días, y algún día completo. Sale siempre igual
// para el mismo profesional y el mismo día (no cambia al recargar).
// Fuera de la demo no se inventa nada: solo cuentan las citas reales.
function numeroDe(texto) {
  let n = 2166136261
  for (let i = 0; i < texto.length; i++) { n ^= texto.charCodeAt(i); n = Math.imul(n, 16777619) }
  return n >>> 0
}
function azar(semilla) {
  let a = semilla
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function ocupadasDeEjemplo(helper, fechaISO) {
  if (!DEMO_MODE || helper?.id == null || !fechaISO) return new Set()
  const horas = horarioDe(helper).horas
  const r = azar(numeroDe(`${helper.id}|${fechaISO}`))
  if (r() < 0.12) return new Set(horas)                 // día completo
  const carga = 0.15 + r() * 0.45                        // entre 15 % y 60 %
  return new Set(horas.filter(() => r() < carga))
}

/** Cuántas horas libres le quedan ese día (0 si no trabaja o está lleno). */
export function huecosLibres(helper, fechaISO, citas = []) {
  return slotsDe(helper, fechaISO, citas).filter(s => s.estado === 'libre').length
}

/** El primer hueco libre en los próximos `dias` días: { fecha, hora } o null. */
export function proximoHueco(helper, citas = [], dias = 14) {
  for (let i = 0; i < dias; i++) {
    const d = new Date(); d.setDate(d.getDate() + i)
    const f = isoLocal(d)
    const s = slotsDe(helper, f, citas).find(x => x.estado === 'libre')
    if (s) return { fecha: f, hora: s.hora, dentro: i }
  }
  return null
}

/**
 * `slotsDe` devuelve [] por TRES motivos distintos y la interfaz los contaba
 * todos como "lo tiene completo". Decirle a alguien que una logopeda esta
 * llena cuando simplemente no trabaja los domingos la hace parecer mas
 * ocupada de lo que esta, y le esconde al usuario el dato que necesita para
 * elegir otro dia. Tres motivos, tres frases.
 */
export function motivoSinHuecos(helper, fechaISO) {
  const h = horarioDe(helper)
  const dia = new Date(fechaISO + 'T12:00:00').getDay()
  if (!h.dias.includes(dia)) return 'cerrado'
  if (fechaISO === isoLocal()) return 'tarde'
  return 'completo'
}

export const FRASE_SIN_HUECOS = {
  cerrado:  'Ese día no trabaja. Prueba con otro.',
  tarde:    'Por hoy ya ha terminado. Prueba con mañana.',
  completo: 'Ese día lo tiene completo.',
}

/**
 * La ocupacion real vive en DOS almacenes: `services` (reservas hechas
 * desde el perfil) y `citas` (acuerdos nacidos en el chat). Mirar solo uno
 * dejaria huecos falsamente libres. Aqui se normalizan a una sola forma.
 */
export function ocupacionesDe(citas = [], services = []) {
  // Las rechazadas y las canceladas ya no ocupan nada.
  const a = (citas || []).filter(c => c.estado !== 'rechazada' && c.estado !== 'cancelada').map(c => ({
    helperId: c.helperId, fecha: c.fecha, hora: c.hora,
    estado: c.estado === 'confirmada' ? 'confirmada' : 'pendiente',
  }))
  const b = (services || []).filter(s => s.status !== 'rejected' && s.status !== 'cancelled').map(s => ({
    helperId: s.helperId, fecha: s.date, hora: s.time,
    estado: s.status === 'confirmed' ? 'confirmada' : 'pendiente',
  }))
  return [...a, ...b].filter(x => x.fecha && x.hora)
}

export function tieneHuecos(helper, fechaISO, citas = []) {
  return slotsDe(helper, fechaISO, citas).some(s => s.estado === 'libre')
}

/**
 * EL RECORDATORIO: la cita CONFIRMADA más cercana que empieza en las
 * próximas 24 horas (y aún no ha empezado), o null. Mira las dos listas
 * donde vive una cita (servicios y citas del chat) sin repetirla.
 */
export function citaEn24h(services = [], citas = [], ahora = new Date()) {
  const todas = [
    ...(services || []).filter(s => s.status === 'confirmed').map(s => ({
      helperId: s.helperId, helperName: s.helperName, specialty: s.specialty, avatarUrl: s.avatarUrl, fecha: s.date, hora: s.time,
    })),
    ...(citas || []).filter(c => c.estado === 'confirmada').map(c => ({
      helperId: c.helperId, helperName: c.helperName, fecha: c.fecha, hora: c.hora,
    })),
  ].filter(c => c.helperId != null && /^\d{4}-\d{2}-\d{2}$/.test(String(c.fecha || '')) && /^\d{1,2}:\d{2}$/.test(String(c.hora || '')))
  const t0 = ahora.getTime()
  const cerca = todas
    .map(c => ({ ...c, cuando: new Date(`${c.fecha}T${c.hora.padStart(5, '0')}:00`).getTime() }))
    .filter(c => c.cuando > t0 && c.cuando - t0 <= 24 * 3600e3)
    .sort((a, b) => a.cuando - b.cuando)
  if (!cerca.length) return null
  // La misma cita puede estar en las dos listas: se juntan sus datos.
  const [p] = cerca
  const gemela = cerca.find(c => c !== p && String(c.helperId) === String(p.helperId) && c.fecha === p.fecha && c.hora === p.hora)
  return gemela ? { ...gemela, ...Object.fromEntries(Object.entries(p).filter(([, v]) => v != null)) } : p
}
