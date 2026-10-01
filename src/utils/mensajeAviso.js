// ── El mensaje que recibe el profesional, para leerlo en pantalla ────────
// El aviso es un texto (va también por correo y WhatsApp): «Hola, Laura. Soy
// Nüra.», quién escribe, lo que dice entre «», y «Puedes responderle desde
// Nüra». En la pantalla de responder sobran el saludo (ya hay uno arriba) y
// la última frase (ya está aquí); lo que importa es lo que dice la persona.

const SALUDO = /^hola\b.*\bsoy nüra\.?$/i
const CIERRE = /^puedes responderle desde nüra/i

/**
 * Las partes del mensaje, en orden: { tipo: 'suyo' | 'nura' | 'corte', texto }.
 * 'suyo' es lo que escribió la persona (entre «»); 'corte', donde empieza lo
 * que añadió después.
 */
export function partesDelAviso(mensaje) {
  const lineas = String(mensaje || '').split('\n').map(l => l.trim())
  const partes = []
  for (const l of lineas) {
    if (!l || SALUDO.test(l) || CIERRE.test(l)) continue
    if (l === '—') { if (partes.length) partes.push({ tipo: 'corte', texto: '' }); continue }
    partes.push({ tipo: /^«[\s\S]*»$/.test(l) ? 'suyo' : 'nura', texto: l })
  }
  return partes
}

/** Lo que pide, en una línea: la primera frase entre «» o el primer texto. */
export function extractoDelAviso(mensaje) {
  const t = String(mensaje || '')
  const cita = /«([^»]{3,})»/.exec(t)
  const base = cita ? cita[1] : t.split('\n').filter(l => l.trim() && !SALUDO.test(l.trim()))[0] || t
  return base.replace(/\s+/g, ' ').trim().slice(0, 140)
}
