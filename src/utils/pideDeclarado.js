// ── Lo declarado, en la busqueda (docs/perfil-vivo.md §4, fase 3) ────────
//
// El profesional confirma datos concretos de si mismo («tiene coche»,
// «habla catalán», «trabaja por las tardes»). Aqui se usan para ORDENAR:
// si la persona pide «que hable catalán y tenga coche», sube quien lo ha
// declarado. No saca a nadie de su oficio (pesa menos que la categoria) y
// no se inventa nada: solo cuenta lo que el propio profesional confirmo.
//
// Solo se lee lo que la persona escribe en ESTA busqueda. No se guarda.

import { SUPABASE_URL, SUPABASE_KEY } from './supabase'

const sinTildes = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// idioma declarado (en español, minúscula) ↔ como puede aparecer al buscar
const IDIOMAS = {
  'catalán': ['catalan', 'catala'], 'inglés': ['ingles', 'english'], 'francés': ['frances'],
  'alemán': ['aleman'], 'italiano': ['italiano'], 'portugués': ['portugues'], 'árabe': ['arabe'],
  'chino': ['chino', 'mandarin'], 'ruso': ['ruso'], 'rumano': ['rumano'], 'ucraniano': ['ucraniano'],
  'urdu': ['urdu'], 'lengua de signos': ['lengua de signos', 'lenguaje de signos', 'signos'],
}
const PERSONAS = {
  'niños': /\b(hij[oa]s?|nin[oa]s?|peques?|bebes?|infantil)\b/,
  'adolescentes': /\b(adolescentes?|chaval(es)?)\b/,
  'personas mayores': /\b(mayor(es)?|ancian[oa]s?|abuel[oa]s?|tercera edad|alzheimer|demencia)\b/,
  'personas con discapacidad': /\b(discapacidad|autismo|tea|sindrome de down|paralisis)\b/,
}
const DISPONIBILIDAD = {
  'mañanas': /\b(por|las|cada) mananas?\b/,
  'tardes': /\b(por|las|cada) tardes?\b/,
  'noches': /\b(noches?|nocturn[oa]|madrugada)\b/,
  'fines de semana': /\b(fin(es)? de semana|sabados?|domingos?)\b/,
  'urgencias': /\b(urgente|urgencia|ya mismo|hoy mismo)\b/,
}
const VEHICULO = /\b(coche|carnet|conduzca|conducir|conduce|vehiculo|moto)\b|\bllev\w* (al|a la|a) (medico|hospital|cole|colegio|centro de dia)\b/

/** Lo que la persona pide que se puede comprobar contra lo declarado. */
export function pideDeclarado(texto, propias = []) {
  const t = ' ' + sinTildes(texto).replace(/[^a-z0-9 ]/g, ' ') + ' '
  const idiomas = Object.entries(IDIOMAS).filter(([, v]) => v.some(p => t.includes(' ' + p + ' '))).map(([k]) => k)
  return {
    idiomas,
    vehiculo: VEHICULO.test(t),
    disponibilidad: Object.keys(DISPONIBILIDAD).filter(k => DISPONIBILIDAD[k].test(t)),
    personas: Object.keys(PERSONAS).filter(k => PERSONAS[k].test(t)),
    experiencia: /\bexperiencia\b|\bexperimentad[oa]\b/.test(t),
    palabras: (propias || []).map(sinTildes).filter(w => w.length > 4),
  }
}

/** Puntos y motivos de un profesional segun lo que declaro. */
export function puntosDeclarados(atributos, pide) {
  if (!atributos?.length || !pide) return { score: 0, motivos: [] }
  const tiene = new Map(atributos.map(a => [sinTildes(a.clave), a.valor]))
  const si = clave => tiene.get(sinTildes(clave)) === true
  let score = 0
  const motivos = []
  for (const i of pide.idiomas) if (si(`idioma:${i}`)) { score += 25; motivos.push(`habla ${i}`) }
  if (pide.vehiculo && si('vehiculo')) { score += 20; motivos.push('tiene coche') }
  if (pide.vehiculo && tiene.get('vehiculo') === false) score -= 10
  let d = 0
  for (const k of pide.disponibilidad) if (si(`disponibilidad:${k}`) && d++ < 2) { score += 12; motivos.push(k === 'urgencias' ? 'atiende urgencias' : `trabaja ${k === 'fines de semana' ? 'los fines de semana' : 'por las ' + k}`) }
  for (const p of pide.personas) if (si(`personas:${p}`)) { score += 20; motivos.push(`trabaja con ${p}`); break }
  const especialidades = [...tiene.keys()].filter(k => k.startsWith('especialidad:')).map(k => k.slice(13))
  const esp = especialidades.find(e => pide.palabras.some(w => e.includes(w) || (e.length > 4 && w.includes(e))))
  if (esp) { score += 20; motivos.push(`su especialidad es ${esp}`) }
  const anos = Number(tiene.get('anos_experiencia'))
  if (pide.experiencia && anos >= 5) { score += 8; motivos.push(`lleva ${anos} años`) }
  return { score, motivos }
}

/** Los datos declarados de varios profesionales, en una sola peticion. */
export async function declaradosDe(ids, ms = 1500) {
  const lista = [...new Set(ids.map(String).filter(id => /^\d+$/.test(id)))].slice(0, 40)
  if (!lista.length) return new Map()
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/perfil_atributos?helper_id=in.(${lista.join(',')})&fuente=eq.declarado&select=helper_id,clave,valor`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, signal: AbortSignal.timeout(ms) },
    )
    if (!res.ok) return new Map()
    const out = new Map()
    for (const a of await res.json()) {
      const k = String(a.helper_id)
      if (!out.has(k)) out.set(k, [])
      out.get(k).push(a)
    }
    return out
  } catch { return new Map() }
}

/** Solo merece la pena preguntar si la persona pidio algo comprobable. */
export const pideAlgo = p => Boolean(p && (p.idiomas.length || p.vehiculo || p.disponibilidad.length || p.personas.length || p.experiencia || p.palabras.length))
