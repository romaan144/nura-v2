// ═══════════════════════════════════════════════════════════════
// Señales deterministas del día para el profesional.
// La misma historia en el saludo, el Perfil y (futuro) el Pulso:
// nada de números que bailan entre pantallas ni renders.
// Semilla: fecha + nombre → estable durante todo el día.
// ═══════════════════════════════════════════════════════════════
export function proSignals(name = '') {
  const day = new Date().toISOString().slice(0, 10)
  const s = day + '|' + name
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const vistasHoy = 1 + (h % 5)                    // 1-5
  const busquedasSemana = 4 + ((h >> 3) % 9)       // 4-12
  const vistasSemana = vistasHoy + 2 + ((h >> 6) % 10)
  return { vistasHoy, vistasSemana, busquedasSemana }
}
