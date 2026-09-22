// ═══════════════════════════════════════════════════════════════
// Señales deterministas del día para el profesional.
// La misma historia en el saludo, el Perfil y (futuro) el Pulso:
// nada de números que bailan entre pantallas ni renders.
// Semilla: fecha + nombre → estable durante todo el día.
// ═══════════════════════════════════════════════════════════════
import { DEMO_MODE } from '../config'

// ── CIFRAS INVENTADAS: SOLO EN LA DEMO ─────────────────────────────────
// Estas cifras NO miden nada: salen de un hash de la fecha y el nombre.
// Y se mostraban tambien en produccion. A una profesional real, Inicio le
// decia "mientras no mirabas, 3 personas vieron tu perfil hoy y hubo 9
// busquedas en tu zona" — sin que nadie la hubiera visto ni buscado.
//
// En la demo es aceptable: enseña como se vera. En produccion es mentirle a
// alguien sobre su negocio, y el dia que lo descubre Nüra pierde a esa
// persona y a todas a las que se lo cuente.
//
// Fuera de la demo devuelve null. Quien la use tiene que decidir que
// mostrar SIN cifras — y la respuesta correcta casi siempre es nada.
// Cuando existan metricas reales (la tabla `eventos` ya las recoge),
// saldran de ahi, no de aqui.
export function proSignals(name = '') {
  if (!DEMO_MODE) return null
  const day = new Date().toISOString().slice(0, 10)
  const s = day + '|' + name
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const vistasHoy = 1 + (h % 5)                    // 1-5
  // `>>>`, no `>>`: el hash es SIN signo y `>>` lo trataba como con signo.
  // Cuando h pasaba de 2^31 el resto salia negativo y la demo decia
  // "hubo -1 busquedas en tu zona".
  const busquedasSemana = 4 + ((h >>> 3) % 9)      // 4-12
  const vistasSemana = vistasHoy + 2 + ((h >>> 6) % 10)
  return { vistasHoy, vistasSemana, busquedasSemana }
}
