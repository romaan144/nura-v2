// ── Lo que pasa con la cita, dicho claro a quien la pidió ─────────────────
//
// Cuando el profesional contesta y además acepta, rechaza o cancela la cita,
// en el chat solo se veía su texto: nadie decía «cita confirmada» ni dónde
// encontrarla. Esta frase va debajo, dicha por Nüra.

/** «jueves, 2 de octubre a las 10:00» */
export function fechaDeCita(c) {
  if (!c?.fecha) return ''
  try {
    const dia = new Date(c.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    return c.hora ? `${dia} a las ${c.hora}` : dia
  } catch { return `${c.fecha}${c.hora ? ` a las ${c.hora}` : ''}` }
}

/**
 * La nota de Nüra para una respuesta con cita, o null si no hay nada que
 * decir (sin cita, o aún propuesta). `cita`: { fecha, hora, estado, cancela, nota }.
 */
export function notaDeCita(cita, nombre = 'El profesional') {
  if (!cita?.estado) return null
  const cuando = fechaDeCita(cita)
  if (cita.estado === 'aceptada') {
    return { clave: 'aceptada', texto: `${nombre} ha confirmado la cita: ${cuando}. La tienes en «Mis servicios».` }
  }
  if (cita.estado === 'rechazada') {
    return { clave: 'rechazada', texto: `A ${nombre} no le va bien ese momento. Si quieres, pídele otro día desde «Contratar».` }
  }
  if (cita.estado === 'cancelada' && cita.cancela === 'profesional') {
    const nota = String(cita.nota || '').trim()
    return { clave: 'cancelada', texto: `${nombre} ha cancelado la cita del ${cuando}.${nota ? ` Te deja esta nota: «${nota}».` : ''} Esa hora ya no está reservada.` }
  }
  return null
}
