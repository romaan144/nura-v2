// ═══════════════════════════════════════════════════════════════
// LA CUARTA PUERTA — verificación de superficie
// Build, lint y suite no ven si una pantalla RENDERIZA. Esto sí.
// Límite honesto: SSR no ejecuta useEffect — caza render, no efectos.
// ═══════════════════════════════════════════════════════════════
import { build } from 'vite'
import { writeFileSync, mkdirSync, rmSync, readdirSync, readFileSync } from 'fs'
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
  // ── La misma persona dos veces ──
  // Habia dos profesionales duplicados: Carlos Martinez Vidal (ids 1 y 2003)
  // y Elena Fernandez Ros (5 y 2120), cada uno con su especialidad escrita
  // distinta. Salian LOS DOS en la misma lista de resultados, y un usuario
  // que ve dos veces el mismo nombre no sabe cual elegir.
  {
    const datos = readFileSync('src/data/helpers.js', 'utf8')
    // Solo los PROFESIONALES: `name:` aparece tambien en las opiniones de
    // jefes y companeros dentro de cada perfil. Contarlas daba tres falsos
    // positivos —la misma Dra. Pilar Mas recomienda a dos personas—.
    const nombres = [...datos.matchAll(/\n    (?:id: \d+,\s*)?name:\s*"([^"]+)"/g)].map(m => m[1])
    const cuenta = {}
    nombres.forEach(n => { cuenta[n] = (cuenta[n] || 0) + 1 })
    const repes = Object.entries(cuenta).filter(([, n]) => n > 1)
    if (repes.length) {
      console.log(`✗ ${'Persona doble'.padEnd(14)} — ${repes.length} nombre(s) repetido(s) en el dataset`)
      repes.slice(0, 5).forEach(([n, v]) => console.log(`    ${n} ×${v}`))
      failed += repes.length
    } else console.log(`✓ ${'Persona doble'.padEnd(14)} [${nombres.length} profesionales, ningun nombre repetido]`)
  }

  // ── El papel escrito a mano ──
  // Al cambiar `--paper` de sepia a gris, TRES superficies se quedaron con
  // el color viejo porque lo llevaban escrito a mano: la barra inferior, la
  // barra de accion de la ficha y la reja de registro. Se vio en produccion:
  // una barra de otro color. Las barras necesitan alfa y por eso no podian
  // usar `--paper`; ahora derivan de `--paper-rgb`.
  {
    const sueltos = []
    for (const f of [...readdirSync('src', { recursive: true })]
      .map(x => join('src', String(x))).filter(x => /\.(css|jsx?)$/.test(x))) {
      let t; try { t = readFileSync(f, 'utf8') } catch { continue }
      t.split('\n').forEach((linea, i) => {
        const limpia = linea.trim()
        if (limpia.startsWith('//') || limpia.startsWith('*') || limpia.startsWith('/*')) return
        // fondos casi-blancos escritos a mano: son papel disfrazado
        for (const m of limpia.matchAll(/rgba?\(\s*(2[3-5]\d)\s*,\s*(2[3-5]\d)\s*,\s*(2[3-5]\d)/g)) {
          const [r, g, bl] = [+m[1], +m[2], +m[3]]
          if (r === 255 && g === 255 && bl === 255) continue   // blanco puro: legitimo
          sueltos.push(`${f}:${i + 1}  rgb(${r},${g},${bl})`)
        }
      })
    }
    if (sueltos.length) {
      console.log(`✗ ${'Papel a mano'.padEnd(14)} — ${sueltos.length} fondo(s) casi-papel sin token`)
      sueltos.slice(0, 5).forEach(x => console.log(`    ${x}`))
      console.log('    Usa var(--paper) o var(--paper-rgb) para los translucidos.')
      failed += sueltos.length
    } else console.log(`✓ ${'Papel a mano'.padEnd(14)} [todo fondo de papel usa token]`)
  }

  // ── El token que no existe ──
  // `var(--text-2xl)` sin declarar y sin respaldo NO da error: la propiedad
  // queda invalida y cae al valor heredado, en silencio. Los tres estados
  // vacios de "esta persona ya no esta" pedian un tamaño que no existe y
  // el corazon salia del tamaño del texto normal. Lo escribi yo y no se
  // vio hasta censar los tokens.
  {
    const todos = [...readdirSync('src', { recursive: true })]
      .map(f => join('src', String(f)))
      .filter(f => /\.(css|jsx?)$/.test(f))
    // Declarado = en cualquier sitio del arbol. Un token puede fijarse desde
    // el JSX (`style={{'--cat-bg': x}}`) y usarse desde el .module.css: son
    // ficheros distintos y NO es un fantasma.
    const declarados = new Set()
    for (const f of todos) {
      let t; try { t = readFileSync(f, 'utf8') } catch { continue }
      // La comilla de cierre va ENTRE el nombre y los dos puntos:
      //   style={{ '--cat-bg': x }}   →   '--cat-bg':
      for (const m of t.matchAll(/(--[\w-]+)\s*['"`]?\s*:/g)) declarados.add(m[1])
    }
    const fantasmas = new Map()
    for (const f of todos) {
      let txt; try { txt = readFileSync(f, 'utf8') } catch { continue }
      // sin respaldo: `var(--x)` y no `var(--x, algo)`
      for (const m of txt.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
        const tok = m[1]
        if (declarados.has(tok)) continue
        fantasmas.set(tok, (fantasmas.get(tok) || new Set()).add(f))
      }
    }
    if (fantasmas.size) {
      console.log(`✗ ${'Token fantasma'.padEnd(14)} — ${fantasmas.size} var() sin declarar y sin respaldo`)
      ;[...fantasmas].slice(0, 5).forEach(([t, fs]) => console.log(`    ${t} → ${[...fs].slice(0, 2).join(', ')}`))
      failed += fantasmas.size
    } else console.log(`✓ ${'Token fantasma'.padEnd(14)} [todo var() resuelve o lleva respaldo]`)
  }

  // ── La promesa usada como objeto ──
  // `analyzeNeed` es async. Llamarla sin await devuelve una Promise cuyo
  // `.categoria` es undefined — y `JSON.stringify` BORRA las claves
  // undefined. El alta profesional viajaba sin categoria y el emparejador
  // filtra por categoria exacta: cada profesional dado de alta desde la app
  // quedaba invisible en todas las busquedas. Un solo `await` de diferencia,
  // sin error en consola y con las cuatro puertas verdes.
  {
    const sospechosas = []
    for (const f of readdirSync('src', { recursive: true })) {
      const ruta = join('src', String(f))
      if (!/\.(jsx?|mjs)$/.test(ruta)) continue
      let txt; try { txt = readFileSync(ruta, 'utf8') } catch { continue }
      txt.split('\n').forEach((linea, i) => {
        if (!/\banalyzeNeed\s*\(/.test(linea)) return
        const limpia = linea.trim()
        if (limpia.startsWith('*') || limpia.startsWith('//') || limpia.startsWith('/*')) return
        if (/\bawait\b|\.then\s*\(|function analyzeNeed|import|export/.test(linea)) return
        sospechosas.push(`${ruta}:${i + 1}  ${linea.trim().slice(0, 62)}`)
      })
    }
    if (sospechosas.length) {
      console.log(`✗ ${'Promesa cruda'.padEnd(14)} — ${sospechosas.length} llamada(s) a analyzeNeed sin await`)
      sospechosas.slice(0, 5).forEach(x => console.log(`    ${x}`))
      failed += sospechosas.length
    } else console.log(`✓ ${'Promesa cruda'.padEnd(14)} [analyzeNeed siempre esperada]`)
  }

  const helpers = globalThis.__helpers || []
  // Un array DISPERSO es invisible: `filter`, `map` y `forEach` saltan los
  // agujeros; `find` los pisa y devuelve undefined. Una coma suelta en el
  // dataset dejo un agujero en el indice 12 y `HELPERS.find(x => x.id...)`
  // reventaba para los 110 perfiles que hay DESPUES — la ficha entera caida
  // por enlace directo, con las cuatro puertas verdes.
  const huecos = []
  for (let i = 0; i < helpers.length; i++) if (!(i in helpers)) huecos.push(i)
  if (huecos.length) {
    console.log(`✗ ${'Dataset denso'.padEnd(14)} — ${huecos.length} agujero(s) en el array: indices ${huecos.slice(0, 8).join(', ')}`)
    failed += huecos.length
  } else {
    console.log(`✓ ${'Dataset denso'.padEnd(14)} [${helpers.length} perfiles, sin agujeros]`)
  }
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
