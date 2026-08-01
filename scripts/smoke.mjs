// ═══════════════════════════════════════════════════════════════
// LA CUARTA PUERTA — verificación de superficie
// Build, lint y suite no ven si una pantalla RENDERIZA. Esto sí.
// Límite honesto: SSR no ejecuta useEffect — caza render, no efectos.
// ═══════════════════════════════════════════════════════════════
import { build } from 'vite'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'

const SCREENS = [
  ['Home', '../src/pages/Home.jsx', '/'],
  ['Explore', '../src/pages/Explore.jsx', '/explore'],
  ['Feed', '../src/pages/Feed.jsx', '/feed'],
  ['Profile', '../src/pages/Profile.jsx', '/profile'],
  ['HelperProfile', '../src/pages/HelperProfile.jsx', '/helper/1'],
  ['Chat', '../src/pages/Chat.jsx', '/chat/1'],
  ['Login', '../src/pages/Login.jsx', '/login'],
  ['ObraComposer', '../src/components/ObraComposer.jsx', '/profile'],
]

const ESCENARIOS = {
  invitado: {},
  profesional: {
    nura_user: JSON.stringify({ id: 1, name: 'Sergio Roman', isHelper: true, helperId: 1,
      helperProfile: { specialty: 'Logopeda infantil', quote: 'Ayudo con la R' } }),
    nura_following: JSON.stringify([1, 5]),
    nura_obra_mias: JSON.stringify([{ id: 'my1', helperId: 1, mine: true,
      who: { name: 'Sergio Roman', specialty: 'Logopeda infantil' }, type: 'caso',
      title: 'Mi primer caso', body: 'Cuerpo de prueba suficientemente largo para el clamp.',
      result: 'Funcionó', dateLabel: 'hoy' }]),
    nura_contacted: JSON.stringify([{ id: 5, confirmed: true }]),
    nura_my_stories: JSON.stringify([]),
  },
}

const dir = join(process.cwd(), '.smoke')
rmSync(dir, { recursive: true, force: true })
mkdirSync(dir, { recursive: true })
let failed = 0

for (const [name, path, route] of SCREENS) {
  const entry = join(dir, `${name}.jsx`)
  writeFileSync(entry, `
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { UserProvider } from '../src/context/UserContext.jsx'
import Screen from '${path}'
globalThis.__render = (route) => renderToString(
  React.createElement(MemoryRouter, { initialEntries: [route] },
    React.createElement(UserProvider, null, React.createElement(Screen)))
)
`)
  const out = join(dir, `${name}.mjs`)
  try {
    await build({
      logLevel: 'error',
      build: {
        ssr: entry, outDir: dir, emptyOutDir: false, write: true,
        rollupOptions: { output: { entryFileNames: `${name}.mjs`, format: 'es' } },
        minify: false, target: 'node18',
      },
      resolve: { alias: { '/logo-iso.png': entry } },
    })
  } catch (e) {
    console.log(`✗ ${name.padEnd(14)} — no compila: ${String(e.message).slice(0, 400)}`)
    failed++
    continue
  }
  for (const [esc, store] of Object.entries(ESCENARIOS)) {
    const mem = { ...store }
    const ls = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v) },
      removeItem: k => { delete mem[k] }, clear: () => { for (const k in mem) delete mem[k] } }
    globalThis.localStorage = ls
    globalThis.sessionStorage = { ...ls, getItem: () => null }
    globalThis.window = { localStorage: ls, sessionStorage: globalThis.sessionStorage,
      location: { pathname: route, href: 'http://localhost' + route }, addEventListener() {}, removeEventListener() {},
      matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
      scrollTo() {}, innerWidth: 390, innerHeight: 844, navigator: { userAgent: 'smoke' } }
    globalThis.document = { documentElement: { style: { setProperty() {} } }, addEventListener() {},
      removeEventListener() {}, querySelector: () => null, body: { style: {} }, createElement: () => ({ style: {} }) }
    globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
    globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
    try {
      const mod = await import('file://' + out + '?t=' + Date.now())
      void mod
      globalThis.__render(route)
      console.log(`✓ ${name.padEnd(14)} [${esc}]`)
    } catch (e) {
      console.log(`✗ ${name.padEnd(14)} [${esc}] → ${String(e.message).split('\n')[0].slice(0, 90)}`)
      failed++
    }
  }
}
// ── EL CENSO DE LAS PIEZAS ─────────────────────────────────────
// Las pantallas de arriba se montan VACIAS: Home sin resultados nunca le
// pasa un profesional a la tarjeta. Por ese hueco se colo un crash que
// tumbaba la pantalla entera en toda la categoria de logopedia (React #31:
// `experience` llegaba como array en dos perfiles y como texto en el resto)
// con las cuatro puertas verdes. Aqui pasa el dataset ENTERO por la pieza,
// en sus dos tamaños. Un dato con dos formas ya no vuelve a pasar.
const censo = join(dir, 'Censo.jsx')
writeFileSync(censo, `
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { UserProvider } from '../src/context/UserContext.jsx'
import Card from '../src/components/HelperCardTall.jsx'
import { HELPERS } from '../src/data/helpers.js'
globalThis.__helpers = HELPERS
globalThis.__card = (helper, small) => renderToString(
  React.createElement(MemoryRouter, { initialEntries: ['/'] },
    React.createElement(UserProvider, null,
      React.createElement(Card, { helper, small })))
)
`)
try {
  await build({
    logLevel: 'error',
    build: { ssr: censo, outDir: dir, emptyOutDir: false, write: true,
      rollupOptions: { output: { entryFileNames: 'Censo.mjs', format: 'es' } },
      minify: false, target: 'node18' },
    resolve: { alias: { '/logo-iso.png': censo } },
  })
  await import('file://' + join(dir, 'Censo.mjs') + '?t=' + Date.now())
  const helpers = globalThis.__helpers || []
  const rotos = []
  for (const h of helpers) {
    for (const small of [false, true]) {
      try { globalThis.__card(h, small) }
      catch (e) { rotos.push(`id=${h.id} ${small ? 'small' : 'grande'} → ${String(e.message).split('\n')[0].slice(0, 70)}`) }
    }
  }
  if (rotos.length) {
    console.log(`✗ ${'Censo tarjeta'.padEnd(14)} — ${rotos.length} de ${helpers.length * 2} renders rotos`)
    rotos.slice(0, 6).forEach(r => console.log(`    ${r}`))
    failed += rotos.length
  } else {
    console.log(`✓ ${'Censo tarjeta'.padEnd(14)} [${helpers.length} profesionales × 2 tamaños]`)
  }
} catch (e) {
  console.log(`✗ ${'Censo tarjeta'.padEnd(14)} — no compila: ${String(e.message).slice(0, 200)}`)
  failed++
}

console.log(failed === 0 ? `\n✅ CUARTA PUERTA VERDE — ${SCREENS.length} pantallas × 2 escenarios + censo de tarjeta` : `\n❌ ${failed} fallos de render`)
process.exit(failed === 0 ? 0 : 1)
