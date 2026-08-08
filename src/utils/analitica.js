// ── Nüra · los seis eventos ──────────────────────────────────────────────
//
// POR QUE EXISTE
// Nüra registraba mucho —busquedas, demanda no cubierta, contactos,
// servicios, valoraciones— y **no llegaba nada**: todo vivia en el
// `localStorage` del movil de cada persona y moria ahi. De las siete
// preguntas que deciden si esto funciona se podian responder CERO.
// Ver `docs/que-puede-medir-nura.md`.
//
// QUE SE MIDE, Y QUE NO
// Seis eventos. Ni uno mas: cada evento que no se vaya a mirar es ruido y
// una obligacion de privacidad.
//
//   busqueda              · alguien pide algo
//   sin_cobertura         · no hay nadie compatible   ← dice a quien reclutar
//   recomendacion_vista   · se le enseña a alguien
//   contacto              · abre chat con un profesional
//   servicio_confirmado   · hay cita
//   resultado_registrado  · se cierra con resultado    ← la conexion completada
//
// **NUNCA el texto de la consulta.** Basta la categoria para decidir a quien
// reclutar. Guardar las frases de la gente en una tabla de analitica es otra
// cosa —consentimiento, retencion, responsabilidad— y no hace falta para
// responder ninguna de las siete preguntas.
//
// COMO VIAJA
// Por la Edge Function, igual que las demas escrituras: la clave `anon` no
// puede escribir una vez cerrado el RLS. Mientras `VITE_EDGE_WRITES` este
// apagado, los eventos se acumulan en local y no se pierden — se pueden
// inspeccionar desde la consola con `__nuraEventos()`.

import { EDGE_WRITES, EDGE_URL } from '../config'

const CLAVE = 'nura_eventos'
const TOPE = 500          // el buffer local no crece sin fin
const ANONIMO = 'nura_anon_id'

/** Un identificador por dispositivo, sin relacion con la persona. */
function dispositivo() {
  try {
    let id = localStorage.getItem(ANONIMO)
    if (!id) {
      id = 'd_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
      localStorage.setItem(ANONIMO, id)
    }
    return id
  } catch { return 'd_sin_almacen' }
}

function guardarLocal(evento) {
  try {
    const previos = JSON.parse(localStorage.getItem(CLAVE) || '[]')
    previos.push(evento)
    localStorage.setItem(CLAVE, JSON.stringify(previos.slice(-TOPE)))
  } catch { /* sin almacenamiento: el evento se pierde, y no pasa nada */ }
}

async function enviar(evento) {
  if (!EDGE_WRITES || !EDGE_URL) return false
  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'evento', payload: evento }),
      signal: AbortSignal.timeout(4000),
    })
    return res.ok
  } catch { return false }
}

/**
 * Registrar un evento. **Nunca bloquea ni rompe nada**: si algo falla, la
 * persona no se entera. Medir no puede degradar el producto que mide.
 */
export function registrar(tipo, datos = {}) {
  const evento = {
    tipo,
    dispositivo: dispositivo(),
    fecha: new Date().toISOString(),
    ...datos,
  }
  guardarLocal(evento)
  enviar(evento).catch(() => {})
}

/** Para mirar lo acumulado desde la consola del navegador. */
if (typeof window !== 'undefined') {
  window.__nuraEventos = () => {
    try {
      const e = JSON.parse(localStorage.getItem(CLAVE) || '[]')
      const porTipo = e.reduce((a, x) => ({ ...a, [x.tipo]: (a[x.tipo] || 0) + 1 }), {})
      console.table(porTipo)
      return e
    } catch { return [] }
  }
}
