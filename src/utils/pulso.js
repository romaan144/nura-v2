// ── El Pulso: lo que buscaron en tu ciudad y no encontró a nadie ─────────
//
// La op `mi-pulso` devuelve, para la ciudad del profesional y su categoría,
// qué oficios se buscaron esta semana sin encontrar a nadie (o solo algo
// parecido) y cuántas veces. Solo identificadores y cifras: nunca frases ni
// personas. Aquí se convierte en consejo para mejorar la ficha:
//   · si es SU oficio, algo en la ficha no casa (especialidad o zona);
//   · si es otro, puede que también lo haga y no lo diga.

import { oficio, esDelOficio } from '../data/oficios'

const veces = n => `**${n}** ${n === 1 ? 'vez' : 'veces'}`
const enLista = xs => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`

/** Las líneas del Pulso para `sinEncontrar` ({ ciudad, oficios }), o []. */
export function lineasSinEncontrar(sinEncontrar, especialidad) {
  const ciudad = sinEncontrar?.ciudad
  const lista = (sinEncontrar?.oficios || [])
    .filter(x => oficio(x?.oficio) && Number(x?.veces) > 0)
    .map(x => ({ id: x.oficio, nombre: oficio(x.oficio).nombre, veces: Number(x.veces) }))
  if (!ciudad || !lista.length) return []

  const lineas = []
  const propio = lista.find(x => esDelOficio(especialidad || '', x.id))
  if (propio) {
    lineas.push(`En ${ciudad} buscaron ${propio.nombre} ${veces(propio.veces)} y no encontraron a nadie. Revisa que tu ficha diga bien lo que haces y en qué zona trabajas.`)
  }
  const otros = lista.filter(x => x !== propio)
  if (otros.length) {
    const cuales = enLista(otros.map(x => `${x.nombre} (${veces(x.veces)})`))
    lineas.push(`En ${ciudad} ${propio ? 'también ' : ''}buscaron ${cuales} sin encontrar a nadie. Si lo haces, añádelo a tu ficha.`)
  }
  return lineas
}
