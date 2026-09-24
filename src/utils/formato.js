// ── CÓMO SE ESCRIBEN LOS NÚMEROS EN NÜRA ─────────────────────────────────
//
// La valoración y la distancia se pintaban en QUINCE sitios de siete
// ficheros, cada uno a su manera: "4.9 · 0.8km" en Siguiendo, "a 0.8 km" en
// las tarjetas, "0,8 km" en la respuesta de Inicio.
//
// En español el decimal va con COMA y entre el número y la unidad hay un
// ESPACIO. Una app que habla con calidez no puede escribir como una hoja de
// cálculo en inglés — y menos de tres maneras distintas.
//
// Toda valoración y toda distancia que se muestre pasa por aquí.

/** 4.9 → "4,9" · 5 → "5,0". Siempre un decimal: las notas se comparan. */
export function fmtNota(valor) {
  if (valor === null || valor === undefined || valor === '') return ''
  const n = Number(valor)
  if (Number.isNaN(n)) return String(valor)
  return n.toFixed(1).replace('.', ',')
}

/** 0.8 → "0,8 km" · 12 → "12 km". Con espacio, como se escribe. */
export function fmtKm(valor) {
  if (valor === null || valor === undefined || valor === '') return ''
  const n = Number(valor)
  if (Number.isNaN(n)) return `${valor} km`
  return `${String(n).replace('.', ',')} km`
}

/** "600123456" → "600 123 456" · "+34600123456" → "+34 600 123 456".
 *  El perfil enseñaba el telefono como un bloque de nueve cifras seguidas. */
export function fmtTel(valor) {
  if (!valor) return ''
  const s = String(valor).replace(/\s+/g, '')
  const m = s.match(/^(\+\d{2})?(\d{3})(\d{3})(\d{3})$/)
  return m ? [m[1], m[2], m[3], m[4]].filter(Boolean).join(' ') : String(valor)
}

/**
 * Donde esta un profesional, dicho con verdad: «a 1,2 km de Gràcia» si quien
 * busca nombro su barrio (distancia real entre barrios), o solo su zona.
 * Antes se enseñaba «a 0,8 km» sin saber donde estaba nadie.
 */
export function dondeEsta(helper) {
  if (typeof helper?.distance === 'number' && helper?.distanciaDesde) {
    return helper.distance < 0.5 ? `en ${helper.distanciaDesde}` : `a ${fmtKm(helper.distance)} de ${helper.distanciaDesde}`
  }
  return helper?.zone || ''
}
