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
