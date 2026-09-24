// ── Lo declarado, ordenado por IA (docs/perfil-vivo.md §4) ───────────────
//
// 1. `ordenarPerfil(texto)`: la funcion `perfil-ia` (Claude) PROPONE datos
//    concretos a partir de lo que el profesional escribe de si mismo.
// 2. La app se los enseña y el profesional quita lo que no sea correcto.
// 3. Solo lo confirmado se guarda (en el alta, o con `confirmarDeclarado`).
//
// Si la IA no esta configurada o falla, no pasa nada: el alta y la edicion
// siguen igual, sin este paso.

import { EDGE_URL } from '../config'
import { porLaFuncion, llamarFuncion } from './escrituras'

const URL_IA = EDGE_URL ? EDGE_URL.replace(/helpers-write\/?$/, 'perfil-ia') : ''

/** Lista de datos propuestos [{clave, valor, etiqueta}], o [] si no hay IA. */
export async function ordenarPerfil(texto) {
  if (!porLaFuncion() || !URL_IA || !texto || texto.trim().length < 10) return []
  try {
    const res = await fetch(URL_IA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: texto.slice(0, 2000) }),
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) return []
    const r = await res.json()
    return r?.ok && r.propuesta ? aLista(r.propuesta) : []
  } catch { return [] }
}

/** De la propuesta de la IA a la lista que se enseña y se guarda. */
export function aLista(p) {
  const out = []
  if (typeof p.vehiculo === 'boolean') out.push({ clave: 'vehiculo', valor: p.vehiculo })
  if (Number.isInteger(p.anos_experiencia) && p.anos_experiencia > 0 && p.anos_experiencia <= 70) out.push({ clave: 'anos_experiencia', valor: p.anos_experiencia })
  const de = (lista, prefijo) => [...new Set((lista || []).map(x => String(x).trim()).filter(Boolean))].slice(0, 8)
    .forEach(x => out.push({ clave: `${prefijo}:${x}`, valor: true }))
  de(p.idiomas, 'idioma'); de(p.especialidades, 'especialidad'); de(p.personas, 'personas')
  de(p.titulos, 'titulo'); de(p.disponibilidad, 'disponibilidad')
  return out.map(a => ({ ...a, etiqueta: etiquetaDe(a.clave, a.valor) }))
}

/** Como se lee un dato declarado, para confirmarlo o en la ficha. */
export function etiquetaDe(clave, valor) {
  if (clave === 'vehiculo') return valor ? 'Tiene coche' : 'No tiene coche'
  if (clave === 'anos_experiencia') return `${valor} ${valor === 1 ? 'año' : 'años'} de experiencia`
  const [tipo, texto] = [clave.slice(0, clave.indexOf(':')), clave.slice(clave.indexOf(':') + 1)]
  const may = texto.charAt(0).toUpperCase() + texto.slice(1)
  return {
    idioma: `Habla ${texto}`,
    especialidad: may,
    personas: `Trabaja con ${texto}`,
    titulo: may,
    disponibilidad: `Disponible: ${texto}`,
  }[tipo] || may
}

/** Desde «Editar mi ficha», con la sesion de la profesional. */
export async function confirmarDeclarado(atributos, sesion) {
  if (!porLaFuncion() || !sesion) return false
  try {
    const r = await llamarFuncion({ op: 'confirmar-declarado', sesion, atributos: atributos.map(({ clave, valor }) => ({ clave, valor })) })
    return Boolean(r?.ok)
  } catch { return false }
}
