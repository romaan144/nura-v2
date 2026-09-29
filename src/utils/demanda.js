// ── Al darse de alta: ¿alguien busca lo que haces? ───────────────────────
//
// Cuando el profesional escribe su especialidad, Nüra mira dos cosas:
//   · si ya hay fichas de ese oficio en Nüra;
//   · cuánta gente lo buscó en el último mes sin encontrar a nadie
//     (op `demanda-oficio`: solo cifras, nunca frases ni personas).
// Con eso le dice «te estaban esperando» o, si el oficio no existe todavía
// y nadie lo ha buscado, le recomienda uno que ya exista (decisión del
// fundador). Si algo falla, no se dice nada: nunca un consejo inventado.

import { oficiosDe, oficio, esDelOficio, OFICIOS, normalizar } from '../data/oficios'
import { especialidadesExistentes } from './supabase'
import { EDGE_URL } from '../config'
import { porLaFuncion } from './escrituras'

/** Cuántas veces lo buscaron en 30 días: { busquedas, sinNadie } o null. */
async function demandaDelOficio(id) {
  if (!id || !porLaFuncion() || !EDGE_URL) return null
  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'demanda-oficio', oficio: id }),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const r = await res.json()
    return r?.ok ? { busquedas: Number(r.busquedas) || 0, sinNadie: Number(r.sinNadie) || 0 } : null
  } catch { return null }
}

/** La especialidad más repetida de una lista de fichas. */
function laMasComun(fichas) {
  const n = new Map()
  for (const f of fichas) n.set(f.specialty, (n.get(f.specialty) || 0) + 1)
  return [...n].sort((a, b) => b[1] - a[1])[0]?.[0] || null
}

/**
 * {
 *   oficio: { id, nombre } | null,  lo que Nüra entiende que hace
 *   existe: true | false | null,     si ya hay fichas de eso (null: no se sabe)
 *   busquedas, sinNadie: número | null  (último mes)
 *   sugerencias: [especialidad]      solo si no existe y nadie lo busca
 * }
 */
export async function valorarOficio(texto, { categoriaDe } = {}) {
  const [primero] = oficiosDe(texto)
  const id = primero?.id || null
  const [fichas, demanda] = await Promise.all([especialidadesExistentes(), demandaDelOficio(id)])
  const salida = { oficio: id ? { id, nombre: oficio(id).nombre } : null, existe: null, busquedas: demanda?.busquedas ?? null, sinNadie: demanda?.sinNadie ?? null, sugerencias: [] }
  if (!fichas) return salida

  const t = normalizar(texto)
  salida.existe = id
    ? fichas.some(f => esDelOficio(f.specialty, id))
    : fichas.some(f => { const e = normalizar(f.specialty); return t.length >= 4 && (e.includes(t) || t.includes(e)) })
  const buscado = (salida.busquedas || 0) > 0 || (salida.sinNadie || 0) > 0
  if (salida.existe || buscado) return salida

  // No existe y nadie lo ha buscado: lo más cercano que SÍ existe. Primero
  // los parecidos del mapa; después, oficios de su misma categoría.
  const candidatos = id
    ? [...(oficio(id).parecidos || []), ...OFICIOS.filter(o => o.cat === oficio(id).cat && o.id !== id).map(o => o.id)]
    : []
  const vistas = new Set()
  for (const c of candidatos) {
    const e = laMasComun(fichas.filter(f => esDelOficio(f.specialty, c)))
    if (e && !vistas.has(e)) { vistas.add(e); salida.sugerencias.push(e) }
    if (salida.sugerencias.length === 3) break
  }
  // Sin oficio reconocido: las especialidades más comunes de su categoría,
  // si se entiende cuál es («otro» no da para recomendar nada).
  if (!id && categoriaDe) {
    const cats = await categoriaDe(texto)
    if (cats?.length) {
      const n = new Map()
      for (const f of fichas) if (cats.includes(f.category)) n.set(f.specialty, (n.get(f.specialty) || 0) + 1)
      salida.sugerencias = [...n].sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0])
    }
  }
  return salida
}
