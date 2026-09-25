// ── El contacto del profesional, comprobado ─────────────────────────────
// Es por donde le llega cada aviso («alguien te busca»). Antes se aceptaba
// cualquier cosa: un móvil con una cifra de menos o «marta@gmial.com»
// dejaban al profesional sin avisos PARA SIEMPRE, sin que nadie lo supiera.
//
// revisarContacto(texto) →
//   { ok: true, valor }                      — listo para guardar
//   { ok: false, motivo, sugerencia? }       — qué decirle y, si parece una
//                                              falta en el correo, cuál sería

// Faltas frecuentes en el dominio del correo.
const DOMINIOS = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmail.es': 'gmail.com',
  'gmaill.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmail.om': 'gmail.com',
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.con': 'hotmail.com',
  'hotmail.co': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmial.es': 'hotmail.es', 'hotmail.e': 'hotmail.es',
  'yaho.es': 'yahoo.es', 'yahoo.e': 'yahoo.es', 'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com',
  'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'outloo.com': 'outlook.com', 'outlook.es.': 'outlook.es',
  'iclod.com': 'icloud.com', 'icloud.con': 'icloud.com', 'icoud.com': 'icloud.com',
}

const CORREO = /^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i

export function revisarContacto(texto) {
  const t = String(texto || '').trim()
  if (!t) return { ok: false, motivo: 'Necesito un móvil o un correo para avisarte cuando alguien te escriba.' }

  if (t.includes('@')) {
    const correo = t.toLowerCase().replace(/\s+/g, '')
    if (!CORREO.test(correo)) {
      return { ok: false, motivo: 'Ese correo parece incompleto. Escríbelo entero, así: nombre@gmail.com' }
    }
    const [usuario, dominio] = correo.split('@')
    if (DOMINIOS[dominio]) {
      const bueno = `${usuario}@${DOMINIOS[dominio]}`
      return { ok: false, sugerencia: bueno, motivo: `¿Querías decir ${bueno}? Si es así, escríbelo de nuevo. Si tu correo era el que pusiste, vuelve a enviarlo tal cual.` }
    }
    return { ok: true, valor: correo }
  }

  // Un móvil: se quitan espacios, puntos, guiones y paréntesis.
  const n = t.replace(/[\s.\-()]/g, '').replace(/^00/, '+')
  if (/^\+?\d+$/.test(n)) {
    const nacional = n.replace(/^\+34/, '')
    if (/^[6789]\d{8}$/.test(nacional)) {
      return { ok: true, valor: nacional.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') }
    }
    if (n.startsWith('+') && /^\+\d{8,15}$/.test(n)) return { ok: true, valor: n }
    const cifras = nacional.replace(/\D/g, '').length
    return { ok: false, motivo: cifras < 9
      ? `A ese número le faltan cifras (tiene ${cifras} y un móvil tiene 9). ¿Me lo escribes otra vez?`
      : 'Ese número no me cuadra como móvil. Escríbelo así: 612 345 678 (o con +34 delante).' }
  }
  return { ok: false, motivo: 'No me parece un móvil ni un correo. Escríbelo así: 612 345 678 o nombre@gmail.com' }
}
