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

export function horarioDe(helper) {
  return helper?.horario || HORARIO_POR_CATEGORIA[helper?.category] || POR_DEFECTO
}

/**
 * Las horas de un profesional en un dia, con su estado real.
 * @returns {{hora:string, estado:'libre'|'pendiente'|'ocupada'}[]}
 */
export function slotsDe(helper, fechaISO, citas = []) {
  const h = horarioDe(helper)
  const dia = new Date(fechaISO + 'T12:00:00').getDay()
  if (!h.dias.includes(dia)) return []

  const suyas = (citas || []).filter(c => String(c.helperId) === String(helper?.id) && c.fecha === fechaISO)
  const ahora = new Date()
  const esHoy = fechaISO === ahora.toISOString().split('T')[0]

  return h.horas
    .filter(hora => !esHoy || parseInt(hora, 10) > ahora.getHours())
    .map(hora => {
      const c = suyas.find(x => x.hora === hora)
      return { hora, estado: !c ? 'libre' : (c.estado === 'confirmada' ? 'ocupada' : 'pendiente') }
    })
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
  const ahora = new Date()
  if (fechaISO === ahora.toISOString().split('T')[0]) return 'tarde'
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
  const a = (citas || []).map(c => ({
    helperId: c.helperId, fecha: c.fecha, hora: c.hora,
    estado: c.estado === 'confirmada' ? 'confirmada' : 'pendiente',
  }))
  const b = (services || []).map(s => ({
    helperId: s.helperId, fecha: s.date, hora: s.time,
    estado: s.status === 'confirmed' ? 'confirmada' : 'pendiente',
  }))
  return [...a, ...b].filter(x => x.fecha && x.hora)
}

export function tieneHuecos(helper, fechaISO, citas = []) {
  return slotsDe(helper, fechaISO, citas).some(s => s.estado === 'libre')
}
