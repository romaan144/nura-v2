// ── npm run recorrido ────────────────────────────────────────────────────
//
// Las cuatro puertas comprueban piezas: que el build pasa, que no hay
// variables sueltas, que el emparejador acierta, que ninguna pantalla se
// queda en blanco.
//
// Esto comprueba otra cosa: que las piezas **siguen funcionando juntas**.
// Tras una sesión larga de cambios, cada una puede estar bien y el camino
// completo roto igualmente.
//
// Dos recorridos, los dos lados del producto:
//   · la persona que busca ayuda — onboarding, buscar, recomendación, chat
//   · el profesional            — alta de siete preguntas, y la vuelta
//
// Piedras aprendidas y aplicadas aquí:
//   · Para escribir en un campo: CLIC REAL en sus coordenadas. Ni
//     `page.type('input')` cuando hay varios en el DOM (Home vive montado
//     en una pestaña oculta y tiene el suyo), ni `focus()` por código.
//   · Los textos de la app cambian con el contexto: no se buscan frases
//     exactas, se buscan señales.
//
// Uso:  npm run recorrido

import puppeteer from 'puppeteer-core'

const CHROME = process.env.NURA_CHROME || '/tmp/chr/chromium'
const BASE = process.env.NURA_BASE || 'http://127.0.0.1:4173'

let fallos = 0
const paso = (n, ok, extra = '') => {
  if (!ok) fallos++
  console.log(`${ok ? '✓' : '✗'} ${n}${extra ? ' · ' + extra : ''}`)
}

/** Clic real en el centro de un campo visible. La única forma fiable. */
async function escribirEn(p, texto, filtro = () => true) {
  const c = await p.evaluate(f => {
    const i = [...document.querySelectorAll('input,textarea')]
      .filter(x => x.checkVisibility?.() && x.getBoundingClientRect().width > 80)
      .find(new Function('return ' + f)())
    if (!i) return null
    const r = i.getBoundingClientRect()
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
  }, filtro.toString())
  if (!c) return false
  await p.mouse.click(c.x, c.y)
  await p.keyboard.type(texto, { delay: 6 })
  return true
}

const texto = p => p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' '))
const tocar = (p, re) => p.evaluate(r => {
  const x = [...document.querySelectorAll('button')]
    .filter(b => b.checkVisibility?.())
    .find(b => new RegExp(r).test(b.textContent || ''))
  if (x) { x.click(); return true }
  return false
}, re.source || re)

const espera = ms => new Promise(r => setTimeout(r, ms))

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process', '--disable-gpu'],
  headless: true,
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
})

const errores = []

// ── quien busca ayuda ──────────────────────────────────────────────────
console.log('\n── La persona que busca ayuda ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('usuario: ' + String(e.message).split('\n')[0].slice(0, 60)))

  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await espera(2400)
  // Se busca una SEÑAL, no el texto exacto: la promesa cambio de "La IA que
  // conecta personas reales" a "¿A quien llamarias para esto?" y la prueba
  // fallo sin que el producto tuviera nada roto.
  paso('el onboarding recibe', /llamarías|Cuéntamelo|HOLA/.test(await texto(p)))

  await tocar(p, /Saltar/)
  await espera(1600)
  await escribirEn(p, 'Sergio')
  await tocar(p, /Empezar/)
  await espera(3600)
  paso('entra y saluda por su nombre', /Sergio/.test(await texto(p)))
  paso('guarda la fecha de alta', await p.evaluate(() => {
    try { return !!JSON.parse(localStorage.getItem('nura_user') || '{}').joined } catch { return false }
  }))

  await escribirEn(p, 'Mi hijo de 5 años no pronuncia la R', 'x => x.getBoundingClientRect().width > 100')
  await p.keyboard.press('Enter')
  await espera(5400)
  const t = await texto(p)
  paso('recomienda a alguien', /Mi recomendación es/.test(t))
  paso('explica el porqué', /peques|cerca de ti|años/.test(t))

  await tocar(p, /Escribir a/)
  await espera(3000)
  paso('abre el chat', (await p.evaluate(() => location.pathname)).startsWith('/chat/'))

  await escribirEn(p, 'Hola, ¿tienes hueco?', 'x => /mensaje/i.test(x.placeholder || "")')
  await p.keyboard.press('Enter')
  await espera(3200)
  paso('el mensaje se envía', /tienes hueco/.test(await texto(p)))
  await p.close()
}

// ── el profesional ─────────────────────────────────────────────────────
console.log('\n── El profesional ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('profesional: ' + String(e.message).split('\n')[0].slice(0, 60)))

  await p.goto(BASE + '/register-helper', { waitUntil: 'networkidle0' })
  await espera(2600)
  paso('el alta recibe', /Perfil profesional|llamas/.test(await texto(p)))

  const respuestas = ['Marta Ferrer', 'Logopeda infantil', 'Grado en Logopedia UB',
    'Gracia', '45 euros la sesión', 'Trabajo con juego', 'marta@ejemplo.com']
  await escribirEn(p, respuestas[0], 'x => x.getBoundingClientRect().width > 100')
  await p.keyboard.press('Enter')
  await espera(2400)
  for (const r of respuestas.slice(1)) {
    await p.keyboard.type(r, { delay: 4 })
    await p.keyboard.press('Enter')
    await espera(2400)
  }
  paso('completa las siete preguntas', /Marta|formas parte|Buen/.test(await texto(p)))
  await p.close()

  const q = await navegador.newPage()
  q.on('pageerror', e => errores.push('vuelta: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await q.goto(BASE + '/r/tokeninventado', { waitUntil: 'networkidle0' })
  await espera(2600)
  paso('la vuelta responde a un enlace inválido', /ya no sirve/.test(await texto(q)))
  await q.close()
}

await navegador.close()

console.log('')
if (errores.length) {
  fallos += errores.length
  console.log('✗ errores JS:', [...new Set(errores)].join(' || '))
} else {
  console.log('✓ sin errores JS en ningún recorrido')
}

console.log('')
console.log(fallos ? `❌ ${fallos} fallo(s) en el recorrido` : '✅ LOS DOS RECORRIDOS, COMPLETOS')
process.exit(fallos ? 1 : 0)
