// ═══════════════════════════════════════════════════════════════
// El Espejo — las personas de la vida del usuario
//
// Nüra detecta silenciosamente a las personas que el usuario
// menciona ("mi madre", "mi hijo de 5 años") y las modela como
// entidades reales. La Memoria Viva deja de ser una frase
// plantilla y pasa a tener estructura donde vivir.
// ═══════════════════════════════════════════════════════════════

const RELACIONES = {
  madre:   { label: 'tu madre',   suyo: 'su madre',   genero: 'f' },
  padre:   { label: 'tu padre',   suyo: 'su padre',   genero: 'm' },
  abuela:  { label: 'tu abuela',  suyo: 'su abuela',  genero: 'f' },
  abuelo:  { label: 'tu abuelo',  suyo: 'su abuelo',  genero: 'm' },
  hija:    { label: 'tu hija',    suyo: 'su hija',    genero: 'f' },
  hijo:    { label: 'tu hijo',    suyo: 'su hijo',    genero: 'm' },
  mujer:   { label: 'tu mujer',   suyo: 'su mujer',   genero: 'f' },
  esposa:  { label: 'tu mujer',   suyo: 'su mujer',   genero: 'f' },
  marido:  { label: 'tu marido',  suyo: 'su marido',  genero: 'm' },
  esposo:  { label: 'tu marido',  suyo: 'su marido',  genero: 'm' },
  pareja:  { label: 'tu pareja',  suyo: 'su pareja',  genero: 'x' },
  hermana: { label: 'tu hermana', suyo: 'su hermana', genero: 'f' },
  hermano: { label: 'tu hermano', suyo: 'su hermano', genero: 'm' },
  tia:     { label: 'tu tía',     suyo: 'su tía',     genero: 'f' },
  tio:     { label: 'tu tío',     suyo: 'su tío',     genero: 'm' },
  suegra:  { label: 'tu suegra',  suyo: 'su suegra',  genero: 'f' },
  suegro:  { label: 'tu suegro',  suyo: 'su suegro',  genero: 'm' },
  bebe:    { label: 'tu bebé',    suyo: 'su bebé',    genero: 'x' },
}

// Atributos relevantes que Nüra recuerda sobre cada persona
const ATRIBUTOS = [
  { re: /alzh[eé]?imer/i,                      tag: 'Alzheimer' },
  { re: /demencia/i,                           tag: 'demencia' },
  { re: /vive\s+sol[oa]/i,                     tag: 'vive sola/o' },
  { re: /ansiedad/i,                           tag: 'ansiedad' },
  { re: /depresi[oó]n/i,                       tag: 'depresión' },
  { re: /autis(mo|ta)/i,                       tag: 'autismo' },
  { re: /tdah/i,                               tag: 'TDAH' },
  { re: /movilidad\s+reducida/i,               tag: 'movilidad reducida' },
  { re: /operad[oa]/i,                         tag: 'operación reciente' },
  { re: /no\s+pronuncia|dislalia|habla/i,      tag: 'apoyo con el habla' },
  { re: /(\d{1,2})\s+años/i,                   tag: null, capture: 'edad' },
]

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Detecta una persona mencionada en el texto del usuario.
 * "mi madre tiene Alzheimer y vive sola" →
 *   { relacion: 'madre', label: 'tu madre', suyo: 'su madre', atributos: ['Alzheimer', 'vive sola/o'] }
 * Devuelve null si no hay mención clara.
 */
export function extractPersona(text) {
  if (!text) return null
  const norm = normalize(text)

  const relKeys = Object.keys(RELACIONES).join('|')
  const m = norm.match(new RegExp(`\\bmi\\s+(${relKeys})\\b`))
  if (!m) return null

  const relacion = m[1]
  const meta = RELACIONES[relacion]

  const atributos = []
  for (const a of ATRIBUTOS) {
    const hit = text.match(a.re)
    if (hit) {
      if (a.capture === 'edad' && hit[1]) atributos.push(`${hit[1]} años`)
      else if (a.tag) atributos.push(a.tag)
    }
  }

  return { relacion, label: meta.label, suyo: meta.suyo, genero: meta.genero, atributos }
}

// Etiqueta posesiva de tercera persona para la Carta de Presentación
export function suyoDe(relacion) {
  return RELACIONES[relacion]?.suyo || null
}
