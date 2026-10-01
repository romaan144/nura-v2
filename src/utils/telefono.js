// Teléfonos de las cuentas: siempre en formato internacional, como los
// guarda Supabase. Sin dependencias, para que el perfil no cargue la
// librería de cuentas solo para enseñar un número.

// «612 34 56 78», «+34 612…» o «0034…» → «+34612345678». Un número de fuera
// tiene que venir con su prefijo («+44…»). Un fijo no recibe SMS: en España,
// solo móviles (6 y 7). Si no es un móvil válido, null.
export function telefonoInternacional(texto) {
  const t = String(texto || '').trim()
  const d = t.replace(/\D/g, '')
  if (t.startsWith('+') || t.startsWith('00')) {
    const i = t.startsWith('00') ? d.slice(2) : d
    if (i.startsWith('34')) return /^34[67]\d{8}$/.test(i) ? '+' + i : null
    return i.length >= 8 && i.length <= 15 ? '+' + i : null
  }
  const nac = d.length === 11 && d.startsWith('34') ? d.slice(2) : d
  return /^[67]\d{8}$/.test(nac) ? '+34' + nac : null
}

// ¿Lo escrito en «Correo o teléfono» es un teléfono?
export const pareceTelefono = texto => !String(texto || '').includes('@') && telefonoInternacional(texto) !== null

// Para enseñarlo: «+34612345678» o «34612345678» → «+34 612 34 56 78».
export function telefonoLegible(tel) {
  const d = String(tel || '').replace(/\D/g, '')
  if (/^34\d{9}$/.test(d)) return `+34 ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)} ${d.slice(9)}`
  return d ? '+' + d : ''
}
