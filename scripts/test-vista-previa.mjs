// Vista previa de una ficha al compartirla (middleware.js). Sin red: se
// simula Supabase y la página. Uso: npm run test:vista
import { readFileSync } from 'fs'
import middleware, { conFicha, config } from '../middleware.js'

let fallos = 0
const ok = (n, c) => { console.log(`${c ? '✓' : '✗'} ${n}`); if (!c) fallos++ }
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const meta = (h, clave) => h.match(new RegExp(`<meta (?:name|property)="${clave}" content="([^"]*)"`))?.[1]

const marta = { name: 'Marta Ferrer', specialty: 'Logopeda infantil', zone: 'Gràcia', bio: 'Trabajo con juego. '.repeat(20), avatarUrl: 'https://x.supabase.co/storage/v1/object/public/fotos/1.jpg' }
const h1 = conFicha(html, marta, 'https://nura.test/helper/7')
ok('título con nombre y oficio', /<title>Marta Ferrer · Logopeda infantil — Nüra<\/title>/.test(h1))
ok('og:title', meta(h1, 'og:title') === 'Marta Ferrer · Logopeda infantil — Nüra')
ok('descripción recortada (≤150)', meta(h1, 'og:description').length <= 150 && meta(h1, 'og:description').endsWith('…'))
ok('su foto real', meta(h1, 'og:image') === marta.avatarUrl)
ok('og:url de la ficha', meta(h1, 'og:url') === 'https://nura.test/helper/7')
ok('twitter también', meta(h1, 'twitter:title') === meta(h1, 'og:title'))
ok('el resto de la página, intacto', h1.replace(/<head>[\s\S]*<\/head>/, '') === html.replace(/<head>[\s\S]*<\/head>/, ''))

const malo = { name: '"><script>alert(1)</script>', specialty: '<b>x</b>', avatarUrl: 'javascript:alert(1)' }
const h2 = conFicha(html, malo, 'https://nura.test/helper/8')
ok('nombre con código: escapado', !h2.includes('<script>alert') && h2.includes('&lt;script&gt;'))
ok('foto rara → imagen de Nüra', meta(h2, 'og:image') === 'https://nura.test/og-compartir.jpg' && meta(h2, 'twitter:image') === 'https://nura.test/og-compartir.jpg')
ok('imagen de Nüra: con sus medidas', meta(h2, 'og:image:width') === '1200')
ok('su foto: sin las medidas de la de Nüra', !meta(h1, 'og:image:width') && meta(h1, 'og:image:secure_url') === marta.avatarUrl && meta(h1, 'twitter:image') === marta.avatarUrl)
ok('sin bio: frase con oficio y barrio', meta(conFicha(html, { name: 'A', specialty: 'Fontanero', zone: 'Sants' }, 'https://n.t/helper/1'), 'og:description') === 'Fontanero en Sants. Escríbele por Nüra.')
ok('solo en /helper/', config.matcher === '/helper/:path*')

// El middleware entero, con la red simulada
const real = globalThis.fetch
const simular = (supa) => { globalThis.fetch = async (u) => String(u).includes('/rest/v1/helpers') ? supa() : new Response(html) }
simular(() => new Response(JSON.stringify([marta])))
const r = await middleware(new Request('https://nura.test/helper/7'))
ok('responde la página con la ficha', r && (await r.text()).includes('Marta Ferrer · Logopeda'))
ok('sin caché', r.headers.get('cache-control').includes('no-store'))
simular(() => new Response('[]'))
ok('ficha que no existe → página normal', (await middleware(new Request('https://nura.test/helper/9'))) === undefined)
simular(() => { throw new Error('red caída') })
ok('Supabase caído → página normal', (await middleware(new Request('https://nura.test/helper/7'))) === undefined)
let llamo = false
globalThis.fetch = async () => { llamo = true; return new Response('') }
ok('id raro → ni pregunta', (await middleware(new Request('https://nura.test/helper/abc'))) === undefined && !llamo)
globalThis.fetch = real

console.log(fallos ? `\n✗ ${fallos} fallo(s)` : '\n✅ VISTA PREVIA VERDE')
process.exit(fallos ? 1 : 0)
