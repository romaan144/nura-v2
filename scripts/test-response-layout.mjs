import assert from 'node:assert/strict'
import { paginateResponse, splitResponseText } from '../src/utils/responseLayout.js'

// Cada contenido debe poder alcanzarse una vez, sin perder texto ni acciones.
for (const capacity of [120, 180, 240, 400, 600]) {
  for (let count = 1; count <= 40; count++) {
    const sizes = Array.from({ length: count }, (_, i) => i % 7 === 0 ? 0 : [44, 72, 100][i % 3])
    const sections = sizes.map((_, i) => i > count / 2 ? 'ajustes' : '')
    const pages = paginateResponse(sizes, sections, capacity)
    assert.deepEqual(pages.flatMap(p => p.items.map(x => x.index)), sizes.flatMap((h, i) => h > 0 ? [i] : []))
    for (const page of pages) {
      assert.ok(page.height <= capacity)
      assert.ok(page.items.every(item => item.top + sizes[item.index] <= capacity))
      assert.equal(new Set(page.items.map(item => sections[item.index])).size, 1)
    }
  }
}
const long = 'Esta respuesta explica **lo que Nüra ha encontrado** y todas las alternativas disponibles. '.repeat(25).trim()
const parts = splitResponseText(long)
assert.equal(parts.join(' '), long)
assert.ok(parts.every(part => part.length <= 160))
assert.ok(parts.every(part => (part.match(/\*\*/g) || []).length % 2 === 0))
assert.deepEqual(paginateResponse([], [], 400), [])
console.log('Paginación: 200 escenarios, texto completo y negritas conservadas.')
