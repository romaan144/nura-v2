// ── MENSAJES DE EJEMPLO PARA LA PROFESIONAL (solo en la demo) ────────────
// En la demo, la profesional abría Chats y veía las conversaciones de
// ejemplo de una clienta, como si hubiera escrito ella a otros profesionales.
// Ahora ve lo mismo que verá de verdad: su agenda y «Te han escrito», con tres
// mensajes de clientes inventados. Se contestan como los reales (pantalla
// /r/:token), pero todo se guarda en este móvil: no sale nada hacia nadie.
// Fuera de la demo este archivo no se usa.

const GUARDADO = 'nura_demo_avisos'
export const esAvisoDemo = token => /^demo-\d+$/.test(String(token || ''))

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// El próximo día laborable (mañana, o el lunes si mañana es fin de semana).
function proximoLaborable() {
  const d = new Date(); d.setDate(d.getDate() + 1)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return iso(d)
}

const mensaje = (nombre, quien, texto) => [
  `Hola${nombre ? `, ${nombre}` : ''}. Soy Nüra.`,
  `${quien} te ha escrito buscando ayuda:`,
  '',
  `«${texto}»`,
  '',
  'Puedes responderle desde Nüra. Si no te viene bien, puedes decirlo y buscamos a otra persona.',
].join('\n')

function base(nombre) {
  const hace = min => new Date(Date.now() - min * 60000).toISOString()
  return [
    { id: 9101, token: 'demo-1', fecha: hace(25),
      mensaje: mensaje(nombre, 'Marta', 'Hola, te he encontrado en Nüra. Es para mi hijo de 6 años. ¿Tendrías un hueco esta semana? Por la tarde me iría mejor.'),
      cita: { fecha: proximoLaborable(), hora: '17:00', estado: 'propuesta' } },
    { id: 9102, token: 'demo-2', fecha: hace(140),
      mensaje: mensaje(nombre, 'Jordi', 'Buenas. ¿Cuánto cobras y vienes a domicilio? Vivo cerca de ti.'), cita: null },
    { id: 9103, token: 'demo-3', fecha: hace(60 * 26),
      mensaje: mensaje(nombre, 'Ana', 'Muchas gracias por contestar tan rápido. Nos vemos el jueves.'), cita: null,
      respuesta: '¡Gracias a ti, Ana! Nos vemos el jueves.', respondido_en: hace(60 * 25) },
  ]
}

function leer() { try { return JSON.parse(localStorage.getItem(GUARDADO) || '{}') || {} } catch { return {} } }
function nombreDeLaPro() { try { return (JSON.parse(localStorage.getItem('nura_user') || 'null')?.name || '').trim().split(/\s+/)[0] } catch { return '' } }

/** Los mensajes con lo contestado en este móvil, con la forma de `mis-avisos`. */
export function avisosDemo() {
  const hechos = leer()
  return base(nombreDeLaPro()).map(a => {
    const h = hechos[a.token] || {}
    const cita = a.cita ? { ...a.cita, estado: h.cita || a.cita.estado } : null
    return {
      id: a.id, token: a.token, mensaje: a.mensaje, fecha: a.fecha,
      respuesta: h.respuesta ?? a.respuesta ?? null, respondido_en: h.respondido_en ?? a.respondido_en ?? null,
      cita_fecha: cita?.fecha ?? null, cita_hora: cita?.hora ?? null, cita_estado: cita?.estado ?? null,
      cita_cancela: null, cita_cambia_de: null,
    }
  })
}

/** Como `abrir-aviso`. */
export function abrirAvisoDemo(token) {
  const a = avisosDemo().find(x => x.token === token)
  if (!a) return { ok: false, estado: 404 }
  return { ok: true, aviso: { id: a.id, nombre: nombreDeLaPro(), mensaje: a.mensaje, respuesta: a.respuesta, fecha: a.fecha,
    cita: a.cita_fecha ? { fecha: a.cita_fecha, hora: a.cita_hora, estado: a.cita_estado, cancela: null } : null } }
}

/** Como `responder-aviso`: una vez, y la cita solo si estaba propuesta. */
export function responderAvisoDemo(token, respuesta, cita) {
  const a = avisosDemo().find(x => x.token === token)
  if (!a) return { ok: false, estado: 404 }
  if (a.respuesta) return { ok: false, estado: 409 }
  const hechos = leer()
  hechos[token] = { respuesta, respondido_en: new Date().toISOString(),
    ...(a.cita_estado === 'propuesta' && (cita === 'aceptada' || cita === 'rechazada') ? { cita } : {}) }
  try { localStorage.setItem(GUARDADO, JSON.stringify(hechos)) } catch { /* sin almacenamiento */ }
  return { ok: true }
}
