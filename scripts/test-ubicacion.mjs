import assert from 'node:assert/strict'
import { createServer } from 'vite'
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const { pedirUbicacion, ordenarDesdeUbicacion, mensajeErrorUbicacion } = await server.ssrLoadModule('/src/utils/ubicacion.js')
  const { dondeEsta } = await server.ssrLoadModule('/src/utils/formato.js')
  let calls = 0
  const geo = { getCurrentPosition(ok, fail, options) {
    calls++
    assert.equal(options.maximumAge, 60000)
    assert.equal(options.timeout, 15000)
    ok({ coords: { latitude: 41.4036, longitude: 2.156, accuracy: 40 } })
  } }
  const origin = await pedirUbicacion({ geolocation: geo })
  assert.equal(calls, 1)
  assert.deepEqual(origin, { lat: 41.4036, lng: 2.156 })
  const helpers = [
    { id: 'far', zone: 'Sants', distance: 0.1 },
    { id: 'unknown', zone: 'Sin zona', distance: 0 },
    { id: 'near', zone: 'Gràcia', distance: 9 },
    { id: 'other-city', zone: 'Gràcia', city: 'Madrid', distance: 0.1 },
    { id: 'other-zone', zone: 'Gràcia, Madrid', distance: 0.1 },
  ]
  const original = structuredClone(helpers)
  const sorted = ordenarDesdeUbicacion(helpers, origin)
  assert.deepEqual(sorted.map(h => h.id), ['near', 'far', 'unknown', 'other-city', 'other-zone'])
  assert.deepEqual(helpers, original)
  assert.equal(sorted[0].distance, 0)
  assert.ok(sorted[1].distance > 3)
  assert.equal(sorted[2].distance, null)
  assert.equal(sorted[2].distanciaDesde, null)
  assert.match(dondeEsta(sorted[0]), /menos de 100 m.*aprox/)
  assert.match(dondeEsta(sorted[1]), /Zona a .* de ti, aprox/)
  assert.equal(dondeEsta(sorted[2]), 'Sin zona')
  assert.equal(dondeEsta({ distance: 1.2, distanciaDesde: 'Gràcia' }), 'a 1,2 km de Gràcia')
  for (const code of [1, 2, 3]) {
    await assert.rejects(pedirUbicacion({ geolocation: { getCurrentPosition: (_, fail) => fail({ code }) } }), e => e.code === code)
    assert.ok(mensajeErrorUbicacion({ code }).length > 40)
  }
  await assert.rejects(pedirUbicacion({ geolocation: null }), e => e.code === 'unsupported')
  for (const coords of [{ latitude: NaN }, { latitude: 100, longitude: 0, accuracy: 20 }, { latitude: 41, longitude: 2, accuracy: 6000 }]) {
    await assert.rejects(pedirUbicacion({ geolocation: { getCurrentPosition: ok => ok({ coords }) } }))
  }
  let late
  const controller = new AbortController()
  const pending = pedirUbicacion({ signal: controller.signal, geolocation: { getCurrentPosition: ok => { late = ok } } })
  controller.abort()
  late({ coords: { latitude: 41, longitude: 2, accuracy: 30 } })
  await assert.rejects(pending, e => e.code === 'cancelled')
  await assert.rejects(pedirUbicacion({ signal: controller.signal, geolocation: geo }), e => e.code === 'cancelled')
  assert.equal(calls, 1)
  await assert.rejects(pedirUbicacion({ timeout: 0, geolocation: { getCurrentPosition() {} } }), e => e.code === 3)
  console.log('Ubicación: permiso, errores, precisión, cancelación, timeout, ordenación, zonas desconocidas y formato verificados.')
} finally { await server.close() }
