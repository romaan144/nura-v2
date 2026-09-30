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
//   · la persona que busca ayuda — entrar, buscar, recomendación, chat
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
  const x = [...document.querySelectorAll('button,a')]
    .filter(b => b.checkVisibility?.())
    // El nombre accesible cuenta: «Escribir a Carlos» es hoy un icono con
    // aria-label, sin texto visible.
    .find(b => new RegExp(r).test(b.getAttribute('aria-label') || b.textContent || ''))
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
  // Sin bienvenida (2026-09-25): un dispositivo nuevo entra directo a la
  // principal, con el campo para buscar y sin preguntarle nada.
  paso('entra directo, sin bienvenida', await p.evaluate(() =>
    location.pathname === '/' && !!document.querySelector('textarea, input') && !/Saltar/.test(document.body.innerText)))

  await escribirEn(p, 'Mi hijo de 5 años no pronuncia la R', 'x => x.getBoundingClientRect().width > 100')
  await p.keyboard.press('Enter')
  await espera(5400)
  const t = await texto(p)
  // Señal, no frase: el texto paso de "Mi recomendacion es Carlos" a
  // "Carlos es quien mejor encaja", y la prueba fallo sin que el producto
  // tuviera nada roto. Segunda vez en esta sesion.
  paso('recomienda a alguien', /quien mejor encaja|Mi recomendación|Escribir a/.test(t))
  paso('explica el porqué', /peques|cerca de ti|años/.test(t))

  // Sin bienvenida no hay cuenta: para escribir se pide identificarse, y al
  // terminar se vuelve al chat de quien eligió.
  await tocar(p, /Escribir a/)
  await espera(2000)
  paso('para escribir, pide identificarse', (await p.evaluate(() => location.pathname)) === '/login')
  await p.type('#login-phone', '612345678', { delay: 6 })
  await tocar(p, /Continuar/)
  await espera(1600)
  await p.focus('#login-code')
  await p.keyboard.type('1234', { delay: 6 })
  await tocar(p, /^Entrar$/)
  await espera(1400)
  await escribirEn(p, 'Sergio', 'x => /nombre/i.test(x.placeholder || "")')
  await tocar(p, /Entrar en Nüra/)
  await espera(3000)
  paso('abre el chat', (await p.evaluate(() => location.pathname)).startsWith('/chat/'))
  paso('guarda la fecha de alta', await p.evaluate(() => {
    try { return !!JSON.parse(localStorage.getItem('nura_user') || '{}').joined } catch { return false }
  }))

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
  paso('la vuelta responde a un enlace inválido', /ya no sirve|ya no está disponible|antiguo/.test(await texto(q)))
  await q.close()
}

// ── el chat abierto desde una ficha ────────────────────────────────────
// Es la misma pantalla que desde Chats, pero aparece al instante: la vuelta
// arriba de cada cambio de ruta la devolvía al primer mensaje (2026-09-29).
console.log('\n── El chat, desde una ficha ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('chat desde ficha: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() }))
    const msgs = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, from: i % 2 ? 'helper' : 'user', text: 'Mensaje ' + (i + 1) + ' con texto para ocupar sitio.', time: new Date().toISOString() }))
    localStorage.setItem('nura_chat_histories', JSON.stringify({ 2001: msgs }))
  })
  // Como en la vida real, con el chat ya abierto antes en esta visita: así
  // aparece al instante, que es cuando fallaba.
  await p.goto(BASE + '/helper/2001', { waitUntil: 'networkidle0' })
  await espera(1500)
  await tocar(p, /Escribir a/)
  await espera(1500)
  await p.goBack()
  await espera(1500)
  await tocar(p, /Escribir a/)
  await espera(1500)
  const fin = await p.evaluate(() => {
    const m = document.querySelector('[data-scroll-propio]') || document.querySelector('[class*="_messages_"]')
    return m ? m.scrollHeight - m.clientHeight - m.scrollTop : null
  })
  paso('abre en el último mensaje, no arriba del todo', fin !== null && fin < 50, fin === null ? 'sin historial' : `a ${Math.round(fin)} px del final`)

  // EL DEDO NO ARRASTRA LA WEB. En un chat nuevo no hay nada que desplazar y
  // Safari movía la página entera (Sergio, iPhone, 2026-09-29). Con el dedo
  // simulado: en el chat nuevo se anula; con historial, el historial se mueve.
  const cdp = await p.target().createCDPSession()
  const deslizar = async (y1, y2) => {
    await p.evaluate(() => { window.__anulado = null; window.addEventListener('touchmove', e => { window.__anulado = e.defaultPrevented }, { once: true }) })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: y1 }] })
    for (let k = 1; k <= 8; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: y1 + (y2 - y1) * k / 8 }] }); await espera(16) }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await espera(500)
    return p.evaluate(() => window.__anulado)
  }
  const antes = await p.evaluate(() => document.querySelector('[data-scroll-propio]')?.scrollTop)
  const anuladoConHistorial = await deslizar(300, 560)
  const despues = await p.evaluate(() => document.querySelector('[data-scroll-propio]')?.scrollTop)
  paso('con historial, el dedo desplaza los mensajes', anuladoConHistorial === false && despues < antes, `${Math.round(antes)} → ${Math.round(despues)}`)
  // El mismo profesional, ahora sin mensajes: un chat nuevo.
  await p.evaluate(() => { localStorage.removeItem('nura_chat_histories'); localStorage.removeItem('nura_chats') })
  await p.goto(BASE + '/chat/2001', { waitUntil: 'networkidle0' })
  // EL CHAT NUEVO SE ABRE YA EN SU FORMA FINAL: nada aparece y desaparece
  // (antes: «chat vacío» con tres preguntas y, a los 0,8 s, otras distintas).
  const historial = () => p.evaluate(() => (document.querySelector('[data-scroll-propio]')?.innerText || '').replace(/\s+/g, ' ').replace(/\d\d:\d\d/g, ''))
  const alEntrar = await historial()
  await espera(2000)
  const luego = await historial()
  paso('un chat nuevo se abre ya con el saludo, y no cambia después', /Vi que me encontraste|Escríbele a/.test(alEntrar) && alEntrar === luego)
  paso('sin «Mensaje sugerido» ni «Nüra sugiere» repetidos', !/Mensaje sugerido|Nüra sugiere|Empieza la conversación/i.test(luego))
  paso('en un chat nuevo, el dedo no arrastra la web entera', await deslizar(500, 300) === true && await deslizar(60, 20) === true)
  await tocar(p, /disponibilidad esta semana/)
  await espera(2500)
  paso('y los toques siguen funcionando (pregunta rápida enviada)', /disponibilidad esta semana/.test(await texto(p)))
  await p.close()
}

// ── Sin asteriscos ni rayas a la vista (Sergio, 2026-09-29) ─────────────
// Los mensajes de Nüra en el chat marcan nombres con **…**: se ven en
// negrita, nunca los asteriscos. Y nada de rayas largas «—» en fichas e
// historias. Además, un chat nuevo sale en Chats con su foto, no su inicial.
console.log('\n── Textos limpios y fotos en Chats ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('textos: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })) })
  await p.goto(BASE + '/helper/2001', { waitUntil: 'networkidle0' })
  await espera(1500)
  await tocar(p, /Escribir a/)
  await espera(1500)
  for (const m of ['hola', '¿cuánto cobras?', 'el sábado a las 10', 'vale, perfecto', 'voy a reservar ahora', 'gracias']) {
    await escribirEn(p, m, 'x => /mensaje/i.test(x.placeholder || "")')
    await p.keyboard.press('Enter')
    await espera(2600)
  }
  const chat = await texto(p)
  paso('en el chat no se ven asteriscos', !chat.includes('**'))
  paso('y lo que Nüra marca sale en negrita', await p.evaluate(() => document.querySelectorAll('[data-scroll-propio] strong').length > 0))
  await p.goto(BASE + '/chats', { waitUntil: 'networkidle0' })
  await espera(1500)
  paso('el chat nuevo sale en Chats con su foto', await p.evaluate(() =>
    [...document.querySelectorAll('button')].filter(b => /Sara/.test(b.textContent)).some(b => b.querySelector('img'))))
  let rayas = ''
  for (const r of ['/helper/2001', '/helper/2004', '/feed']) {
    await p.goto(BASE + r, { waitUntil: 'networkidle0' })
    await espera(1500)
    if ((await texto(p)).includes('—')) rayas += ' ' + r
  }
  paso('sin rayas largas en fichas ni historias', !rayas, rayas.trim())
  await p.close()
}

// ── Un chat leído deja de salir como no leído (Sergio, 2026-09-29) ──────
console.log('\n── Chats leídos ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('leídos: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })) })
  const sinLeer = () => p.evaluate(() => ({
    filas: [...document.querySelectorAll('[aria-label*="sin leer"]')].map(e => e.closest('button')?.textContent.slice(0, 20)),
    barra: document.querySelector('nav[aria-label="Navegación principal"]')?.innerText.match(/\d+/)?.[0] || '0',
  }))
  // 1) El chat de ejemplo resaltado: se abre, se vuelve, y ya no.
  await p.goto(BASE + '/chats', { waitUntil: 'networkidle0' })
  await espera(1500)
  const antes = await sinLeer()
  await tocar(p, /Elena/)
  await espera(2000)
  await p.goBack()
  await espera(1500)
  const despues = await sinLeer()
  paso('el chat de ejemplo sin leer deja de estarlo al abrirlo', antes.filas.some(f => /Elena/.test(f)) && !despues.filas.some(f => /Elena/.test(f)) && despues.barra === '0', `antes ${antes.filas.length} (barra ${antes.barra}) · después ${despues.filas.length} (barra ${despues.barra})`)
  // 2) Un chat propio: lo que contesta mientras estás dentro ya está leído.
  await p.goto(BASE + '/helper/2001', { waitUntil: 'networkidle0' })
  await espera(1500)
  await tocar(p, /Escribir a/)
  await espera(1500)
  await p.keyboard.press('Enter')
  await escribirEn(p, 'Hola, ¿tienes hueco?', 'x => /mensaje/i.test(x.placeholder || "")')
  await p.keyboard.press('Enter')
  await espera(3500)
  await p.goto(BASE + '/chats', { waitUntil: 'networkidle0' })
  await espera(1500)
  const propio = await sinLeer()
  paso('lo que contesta mientras estás en el chat no queda sin leer', !propio.filas.some(f => /Sara/.test(f)), propio.filas.join(' | '))
  await p.close()
}

console.log('\n── Respuestas de ejemplo coherentes ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('respuestas: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })) })
  await p.goto(BASE + '/chat/2020', { waitUntil: 'networkidle0' })
  await espera(1500)
  // Borra el borrador que propone el chat y escribe lo nuestro.
  const decir = async m => {
    await escribirEn(p, '', 'x => /mensaje/i.test(x.placeholder || "")')
    await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace')
    await p.keyboard.type(m, { delay: 4 }); await p.keyboard.press('Enter')
    await espera(3200)
    return p.evaluate(() => ((JSON.parse(localStorage.getItem('nura_chat_histories') || '{}')['2020'] || []).filter(x => x.from === 'helper').pop() || {}).text || '')
  }
  const r1 = await decir('Tengo una fuga de agua debajo del fregadero')
  paso('tras contar el problema no vuelve a saludar', !/soy antoni|en qué puedo ayudarte/i.test(r1) && /\?/.test(r1), r1)
  const r2 = await decir('¿Cuánto cobras?')
  paso('a «¿cuánto cobras?» contesta con su tarifa', /60€/.test(r2), r2)
  const r3 = await decir('¿Podrías venir mañana por la tarde?')
  paso('al proponer día y hora, lo recoge', /mañana por la tarde/i.test(r3), r3)
  const r4 = await decir('Vale, perfecto')
  paso('al despedirse no te llama por su propio nombre', !/antoni/i.test(r4), r4)
  await p.close()
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
