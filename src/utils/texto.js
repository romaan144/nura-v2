// ── Textos limpios a la vista ────────────────────────────────────────────
//
// Sergio (2026-09-29): «por la app aparecen muchos mensajes con asteriscos
// y guiones». Dos cosas distintas:
//   · **negrita**: las plantillas de Nüra marcan así un nombre. Inicio lo
//     pinta en negrita; el chat lo enseñaba tal cual, con los asteriscos.
//   · « — »: la raya larga como separador en títulos y textos de ejemplo
//     («Colegiado — Col·legi…»). Nüra escribe sin rayas (regla de
//     redacción): se muestra « · », el separador del resto de la app.
// La negrita se pinta con components/ConNegritas.jsx.

/** Quita las marcas de negrita (para vistas previas en una línea). */
export const sinMarcas = t => String(t ?? '').replace(/\*\*(.+?)\*\*/g, '$1')

/** « — » → « · » en un texto. */
export const sinRaya = t => typeof t === 'string' ? t.replace(/\s+—\s+/g, ' · ') : t

/** Lo mismo en todo lo que cuelga de una ficha (títulos, experiencia…). */
export function sinRayas(v) {
  if (typeof v === 'string') return sinRaya(v)
  if (Array.isArray(v)) return v.map(sinRayas)
  if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
    const out = {}
    for (const k in v) out[k] = sinRayas(v[k])
    return out
  }
  return v
}
