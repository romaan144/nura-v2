import assert from 'node:assert/strict'
import { telefonoInternacional, pareceTelefono, telefonoLegible } from '../src/utils/telefono.js'

// Los móviles de las cuentas, en formato internacional (como los guarda Supabase).
const casos = [
  ['612 34 56 78', '+34612345678'], ['+34 612345678', '+34612345678'], ['0034612345678', '+34612345678'],
  ['34612345678', '+34612345678'], ['712345678', '+34712345678'], ['+447700900123', '+447700900123'],
  // Un fijo no recibe SMS; lo demás no es un móvil.
  ['912345678', null], ['+34 512345678', null], ['123', null], ['', null], ['ana@correo.es', null],
]
for (const [t, esperado] of casos) assert.equal(telefonoInternacional(t), esperado, t)
assert.equal(pareceTelefono('612 34 56 78'), true)
assert.equal(pareceTelefono('ana@correo.es'), false)
assert.equal(telefonoLegible('34612345678'), '+34 612 34 56 78')
assert.equal(telefonoLegible('+34612345678'), '+34 612 34 56 78')
console.log(`Teléfonos: ${casos.length + 4} comprobaciones verdes.`)
