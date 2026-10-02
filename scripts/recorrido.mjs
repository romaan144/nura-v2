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

  // El contacto: primero un móvil (2026-10-01: el alta pide un correo).
  const respuestas = ['Marta Ferrer', 'Logopeda infantil', 'Grado en Logopedia UB',
    'Gracia', '45 euros la sesión', 'Trabajo con juego', '612 345 678', 'marta@ejemplo.com']
  await escribirEn(p, respuestas[0], 'x => x.getBoundingClientRect().width > 100')
  await p.keyboard.press('Enter')
  await espera(2400)
  for (const r of respuestas.slice(1)) {
    await p.keyboard.type(r, { delay: 4 })
    await p.keyboard.press('Enter')
    await espera(2400)
  }
  const tAlta = await texto(p)
  paso('con un móvil, pide el correo y explica por qué', /Mejor tu correo que el móvil/.test(tAlta))
  paso('completa las siete preguntas', /Marta|formas parte|Buen/.test(tAlta))
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

console.log('\n── Respuestas rápidas según la conversación ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('rápidas: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })) })
  await p.goto(BASE + '/chat/2020', { waitUntil: 'networkidle0' })
  await espera(1500)
  const botones = () => p.evaluate(() => [...document.querySelectorAll('button[class*="quickReply"]')].map(b => b.textContent))
  const pulsar = async t => { await p.evaluate(t => [...document.querySelectorAll('button[class*="quickReply"]')].find(b => b.textContent === t)?.click(), t); await espera(3500) }
  const ultima = () => p.evaluate(() => ((JSON.parse(localStorage.getItem('nura_chat_histories') || '{}')['2020'] || []).filter(x => x.from === 'helper').pop() || {}).text || '')
  await pulsar('¿Cuál es tu precio?')
  const tras = await botones()
  paso('tras preguntar el precio no vuelve a sugerirlo', tras.length > 0 && !tras.some(b => /precio|cobras/i.test(b)), tras.join(' | '))
  await pulsar('¿Qué día podrías?')
  const dias = await botones()
  const dia = dias.find(b => /^(Mañana|El )/.test(b))
  paso('si pregunta qué día, los botones proponen días', Boolean(dia), dias.join(' | '))
  if (dia) await pulsar(dia)
  const r = await ultima()
  paso('al tocar un día, el profesional lo acepta', /me va bien/i.test(r), r)
  await p.close()
}

console.log('\n── Nüra ofrece otras opciones solo si se atasca ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('opciones: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })) })
  const decir = async m => {
    await escribirEn(p, '', 'x => /mensaje/i.test(x.placeholder || "")')
    await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace')
    await p.keyboard.type(m, { delay: 4 }); await p.keyboard.press('Enter')
    await espera(3500)
  }
  const deNura = id => p.evaluate(id => (JSON.parse(localStorage.getItem('nura_chat_histories') || '{}')[id] || []).filter(x => x.from === 'nura').map(x => x.text), id)
  await p.goto(BASE + '/chat/2001', { waitUntil: 'networkidle0' })
  await espera(1500)
  await decir('Últimamente tengo mucha ansiedad y me cuesta dormir')
  await decir('Hace unos meses')
  const pronto = await deNura('2001')
  paso('mientras cuentas el problema, Nüra no ofrece alternativas', !pronto.some(t => /alternativas|otras opciones/.test(t)), pronto.join(' | ') || 'sin avisos')
  await p.evaluate(() => localStorage.setItem('nura_chat_histories', '{}'))
  await p.goto(BASE + '/chat/2001', { waitUntil: 'networkidle0' })
  await espera(1500)
  await decir('Necesito que me atiendas hoy, es urgente')
  const urg = await deNura('2001')
  paso('si no puede cuando lo necesitas, Nüra ofrece otras opciones', urg.some(t => /otras opciones/.test(t)), urg.join(' | '))
  await tocar(p, /^Buscar otras opciones$/)
  await espera(5000)
  const inicio = await texto(p)
  paso('el botón repite la búsqueda sin poner primero a quien ya era', /Primera opción/.test(inicio) && !/Primera opción Sara/.test(inicio), inicio.match(/Primera opción \S+ \S+/)?.[0] || inicio.slice(0, 80))
  await p.close()
}

console.log('\n── Contratar con el día y la hora acordados ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('contratar: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })) })
  await p.goto(BASE + '/chat/2020', { waitUntil: 'networkidle0' })
  await espera(1500)
  await escribirEn(p, '', 'x => /mensaje/i.test(x.placeholder || "")')
  await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace')
  // Un número que NO es una hora: el lector anterior lo tomaba por las 5:00.
  await p.keyboard.type('Hace 5 años que tengo la caldera y ahora gotea', { delay: 4 }); await p.keyboard.press('Enter')
  await espera(3500)
  const pulsar = async re => { await p.evaluate(r => [...document.querySelectorAll('button[class*="quickReply"]')].find(b => new RegExp(r).test(b.textContent))?.click(), re.source); await espera(3500) }
  await pulsar(/^¿Qué día podrías\?$/)
  const dia = await p.evaluate(() => [...document.querySelectorAll('button[class*="quickReply"]')].map(b => b.textContent).find(t => /^(Mañana|El )/.test(t)) || '')
  await pulsar(new RegExp('^' + dia + '$'))
  // Tras acordar, Nüra propone «Confirmar reserva» (o queda el botón Contratar).
  await tocar(p, /^(Confirmar reserva|Contratar)$/)
  await espera(1200)
  const hoja = await p.evaluate(() => ({
    dia: document.querySelector('[aria-label="Elige un día"] button[aria-pressed="true"]')?.getAttribute('aria-label') || '',
    hora: [...document.querySelectorAll('button[data-state][aria-pressed="true"]')].map(b => b.textContent)[0] || '',
  }))
  const tarde = /tarde/.test(dia), h = parseInt(hoja.hora, 10)
  paso('la hoja de Contratar sale con el día y la hora acordados', Boolean(hoja.dia) && Boolean(hoja.hora) && h !== 5 && (tarde ? h >= 14 && h < 20 : h < 14), `«${dia}» → ${hoja.dia.split(':')[0]} · ${hoja.hora}`)
  await p.close()
}

console.log('\n── La pregunta por el último contacto, una vez y sin saltos ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('confirmación: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() }))
    localStorage.setItem('nura_contacted', JSON.stringify([{ id: 2020, name: 'Antoni Pérez Mas', category: 'tecnico', contactedAt: Date.now() - 3600e3 }]))
  })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await espera(1500)
  const antes = await texto(p)
  await espera(5000)
  const despues = await texto(p)
  const veces = (despues.match(/Pudiste resolver/g) || []).length
  paso('la pregunta sale una vez, con sus botones desde el principio', veces === 1 && /Sí, genial/.test(antes), `${veces} vez/veces`)
  paso('a los segundos la pantalla no cambia', antes === despues, antes === despues ? '' : despues.slice(0, 120))
  paso('sin espacio antes del signo tras una negrita', !/\S \.|Antoni \?/.test(despues), despues.match(/.{0,12}Sergio.{0,3}/)?.[0] || '')
  await p.close()
}

console.log('\n── Tras «Sí, genial», Nüra entiende lo que le cuentas ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('tras sí: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  // El caso de Sergio: ya la había valorado, así que la ventana no se abre.
  await p.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() }))
    localStorage.setItem('nura_contacted', JSON.stringify([{ id: 2020, name: 'Júlia Pérez', category: 'tecnico', contactedAt: Date.now() - 3600e3 }]))
    localStorage.setItem('nura_ratings', JSON.stringify([{ helperId: 2020, rating: 5 }]))
  })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await espera(1500)
  await tocar(p, /Sí, genial/)
  await espera(2000)
  const tras = await texto(p)
  paso('sin género inventado ni pedir lo que no se puede hacer', /Anoto que con Júlia funcionó/.test(tras) && !/queda anotado/.test(tras) && !/Si me cuentas cómo fue/.test(tras), tras.match(/Me alegra.{0,120}/)?.[0] || '')
  await escribirEn(p, 'Muy bien!')
  await p.keyboard.press('Enter')
  await espera(2000)
  const r = await texto(p)
  paso('«Muy bien!» se agradece, no se toma por una búsqueda', /Gracias por contármelo/.test(r) && !/No estoy segura/.test(r), r.match(/Muy bien!.{0,90}/)?.[0] || '')
  await p.close()
}

console.log('\n── Búsqueda: lo que se dice después de buscar ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('seguimiento: ' + String(e.message).split('\n')[0].slice(0, 60)))
  const respuesta = () => p.evaluate(() => (document.querySelector('section[aria-label="Respuesta de Nüra"]')?.innerText || '').replace(/\s+/g, ' '))
  const nueva = async () => {
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })); sessionStorage.setItem('nura_for_whom', 'mi') })
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await espera(1200)
  }
  const decir = async q => { await escribirEn(p, q); await p.keyboard.press('Enter'); await espera(3500); return respuesta() }
  await nueva()
  let r = await decir('hola')
  paso('«hola» recibe un saludo, no «no te he entendido»', /¡Hola/.test(r) && !/No estoy segura/.test(r), r.slice(12, 80))
  r = await decir('xyzzy blabla')
  paso('si no entiende, no empieza por «Entendido.»', /No estoy segura/.test(r) && !/Entendido\./.test(r), r.slice(12, 70))
  await nueva()
  await decir('electricista')
  r = await decir('no, era fontanero')
  paso('«no, era fontanero» busca fontanero', /Primera opción \S+ \S+ Fontanero/.test(r), r.match(/Primera opción \S+ \S+ \S+/)?.[0] || r.slice(0, 80))
  await nueva()
  const a = await decir('cuidadora para mi padre con alzheimer')
  r = await decir('¿cuánto cobra?')
  paso('«¿cuánto cobra?» dice los precios', /cobra \d/.test(r), r.match(/\S+ cobra [^.]+/)?.[0] || r.slice(0, 80))
  r = await decir('otra persona')
  const primera = x => x.match(/Primera opción (\S+ \S+)/)?.[1]
  paso('«otra persona» enseña a otra persona', primera(r) && primera(r) !== primera(a), `${primera(a)} → ${primera(r)}`)
  r = await decir('por la noche')
  paso('«por la noche» pone primero a quien trabaja de noche', /noctur/i.test(r.match(/Primera opción .{0,60}/)?.[0] || ''), r.match(/Primera opción .{0,40}/)?.[0] || '')
  await p.close()
}

console.log('\n── Búsqueda: la primera respuesta encaja con lo que pides ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('primera: ' + String(e.message).split('\n')[0].slice(0, 60)))
  const buscar = async q => {
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })); sessionStorage.setItem('nura_for_whom', 'mi') })
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await espera(1200)
    await escribirEn(p, q); await p.keyboard.press('Enter'); await espera(3500)
    return p.evaluate(() => (document.querySelector('section[aria-label="Respuesta de Nüra"]')?.innerText || '').replace(/\s+/g, ' '))
  }
  const primera = r => r.match(/Primera opción .{0,50}/)?.[0] || ''
  let r = await buscar('busco alguien que cuide a mi madre por las tardes')
  paso('«por las tardes» no da primero una cuidadora nocturna ni una canguro', /Primera opción/.test(r) && !/noctur|canguro/i.test(primera(r)), primera(r))
  r = await buscar('¿cuánto cuesta un electricista?')
  paso('si preguntas el precio, lo dice', /Cobra \d/.test(r), r.match(/Cobra [^.]+/)?.[0] || '')
  r = await buscar('abogado para un despido')
  paso('el porqué nombra lo que es, no «su especialidad es justo eso»', /Es abogado laboralista, justo lo que buscas/.test(r) && !/justo eso:/.test(r), r.match(/Es [^.]+/)?.[0] || '')
  await p.close()
}

console.log('\n── Búsqueda: dos cosas a la vez ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('dos cosas: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })); sessionStorage.setItem('nura_for_whom', 'mi') })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await espera(1200)
  await escribirEn(p, 'fontanero y electricista'); await p.keyboard.press('Enter'); await espera(3500)
  const resp = () => p.evaluate(() => (document.querySelector('section[aria-label="Respuesta de Nüra"]')?.innerText || '').replace(/\s+/g, ' '))
  let r = await resp()
  paso('dice que también pide la otra cosa, en la primera página', /También me pides electricista/.test(r) && /Buscar electricista/.test(r), r.match(/También[^.]+/)?.[0] || '')
  await tocar(p, /^Buscar electricista$/)
  await espera(3500)
  r = await resp()
  paso('el botón busca la otra cosa', /Primera opción \S+ \S+ Electricista/.test(r), r.match(/Primera opción .{0,30}/)?.[0] || '')
  await p.close()
}

console.log('\n── Toda la app: el dedo no arrastra la página entera ──')
{
  // Sergio, iPhone, 2026-09-30: en Inicio, en el chat y en «Ver todos» →
  // «Viajar» (sin profesionales) el dedo movía la web entera. Donde hay algo
  // que desplazar (la lista de categorías, Perfil) se desplaza igual.
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('arrastre: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })); sessionStorage.setItem('nura_for_whom', 'mi') })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await espera(1500)
  const cdp = await p.target().createCDPSession()
  const alto = await p.evaluate(() => window.innerHeight)
  const deslizar = async (y1, y2) => {
    await p.evaluate(() => { window.__anulado = null; window.addEventListener('touchmove', e => { window.__anulado = e.defaultPrevented }, { once: true }) })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: y1 }] })
    for (let k = 1; k <= 8; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: y1 + (y2 - y1) * k / 8 }] }); await espera(16) }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await espera(400)
    return p.evaluate(() => window.__anulado)
  }
  const inicio = [await deslizar(alto * 0.4, alto * 0.7), await deslizar(alto - 40, alto - 140)]
  await escribirEn(p, 'fontanero y electricista'); await p.keyboard.press('Enter'); await espera(3500)
  inicio.push(await deslizar(alto * 0.5, alto * 0.8), await deslizar(alto * 0.8, alto * 0.5))
  paso('Inicio: el dedo no arrastra la web (bienvenida, barra de abajo y resultados)', inicio.every(x => x === true), JSON.stringify(inicio))
  await p.goto(BASE + '/explore', { waitUntil: 'networkidle0' })
  await espera(1500)
  paso('Ver todos: la lista de categorías se desplaza con el dedo', (await deslizar(alto * 0.7, alto * 0.3)) === false)
  await tocar(p, /Viajar o hablar otro idioma/)
  await espera(2000)
  const viajar = [await deslizar(alto * 0.4, alto * 0.7), await deslizar(alto * 0.7, alto * 0.4)]
  paso('Ver todos → Viajar (casi vacío): el dedo no arrastra la web', viajar.every(x => x === true), JSON.stringify(viajar))
  await p.goto(BASE + '/profile', { waitUntil: 'networkidle0' })
  await espera(1200)
  paso('Perfil: el dedo sigue desplazando', (await deslizar(alto * 0.7, alto * 0.3)) === false)
  await p.close()
}

console.log('\n── Primer mensaje a un profesional: un borrador natural ──')
{
  // Sergio, 2026-09-30: «Hola Àngel. Cocinar. ¿Podrías ayudarme?».
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('borrador: ' + String(e.message).split('\n')[0].slice(0, 60)))
  const borradorTras = async q => {
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })); sessionStorage.setItem('nura_for_whom', 'mi') })
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await espera(1200)
    await escribirEn(p, q); await p.keyboard.press('Enter'); await espera(3500)
    await tocar(p, /Escribir a/)
    await espera(2000)
    return p.evaluate(() => document.querySelector('input[aria-label="Escribe tu mensaje"]')?.value || '')
  }
  let b = await borradorTras('cocinar')
  paso('una sola palabra se convierte en una petición', /Busco a alguien que cocine/.test(b) && !/\. Cocinar\./.test(b), b)
  b = await borradorTras('tengo una fuga de agua debajo del fregadero')
  paso('una frase suya se usa con sus palabras', /Tengo una fuga de agua debajo del fregadero\./.test(b), b)
  await p.close()
}

console.log('\n── Búsqueda: cuando no hay nadie, decirlo bien ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('sin nadie: ' + String(e.message).split('\n')[0].slice(0, 60)))
  const buscar = async q => {
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })); sessionStorage.setItem('nura_for_whom', 'mi') })
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await espera(1200)
    await escribirEn(p, q); await p.keyboard.press('Enter'); await espera(3500)
    return p.evaluate(() => (document.querySelector('section[aria-label="Respuesta de Nüra"]')?.innerText || '').replace(/\s+/g, ' '))
  }
  let r = await buscar('fontanero en Madrid')
  paso('otra ciudad: nombra el oficio y solo ofrece el aviso', /En Madrid todavía no tengo a nadie que sea fontanero/.test(r) && !/técnico de guardia|Ampliar la zona/.test(r), r.match(/En Madrid[^.]+/)?.[0] || r.slice(0, 80))
  r = await buscar('busco un tatuador')
  paso('un oficio que no hay no es «no te he entendido»', /Todavía no tengo a nadie de «tatuador»/.test(r) && !/No estoy segura/.test(r), r.slice(12, 90))
  // 2026-10-01 (Sergio): lo que no hay se dice, y se manda a mirar a todos.
  paso('…y recomienda mirar a todos los profesionales', /Te recomiendo entrar en «Ver todos los profesionales»/.test(r))
  r = await buscar('necesito un astronauta para la luna')
  paso('«astronauta para la luna»: no recomienda a nadie al azar («luna» no es «lunar»)', /Todavía no tengo a nadie para eso/.test(r) && !/Primera opción/.test(r), r.slice(12, 120))
  const fueAExplorar = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Ver todos los profesionales'); b?.click(); return Boolean(b) })
  await espera(1200)
  paso('el botón «Ver todos los profesionales» lleva a la lista', fueAExplorar && new URL(p.url()).pathname === '/explore', new URL(p.url()).pathname)
  r = await buscar('necesito ayuda')
  paso('sin nada concreto («necesito ayuda») pregunta, no dice que no hay nadie', !/Todavía no tengo a nadie/.test(r), r.slice(12, 90))
  r = await buscar('fontanero en Gràcia')
  paso('una ficha sin ciudad cuenta como Barcelona («en Gràcia» encuentra al fontanero)', /Primera opción \S+ \S+ Fontanero/.test(r), r.match(/Primera opción .{0,30}/)?.[0] || r.slice(0, 80))
  r = await buscar('clases de chino en Bilbao')
  paso('si la primera opción es online y de otra ciudad, se dice', /En Bilbao todavía no tengo a nadie en persona, pero \S+ trabaja online/.test(r), r.match(/En Bilbao[^.]+/)?.[0] || '')
  await p.close()
}

console.log('\n── Alta de profesional: una conversación natural ──')
{
  // Sin enviar nada: cualquier escritura al servidor se contesta aquí mismo.
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('alta natural: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.setRequestInterception(true)
  p.on('request', r => (/supabase\.co|functions\/v1/.test(r.url()) && r.method() !== 'GET') ? r.respond({ status: 503, body: '{}' }) : r.continue())
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await p.goto(BASE + '/register-helper', { waitUntil: 'networkidle0' })
  await espera(1500)
  const decir = async t => { await escribirEn(p, t); await p.keyboard.press('Enter'); await espera(3200) }
  for (const t of ['Marta Ruiz', 'limpieza de casas', 'no tengo']) await decir(t)
  let r = await texto(p)
  paso('usa el nombre de pila', /Encantada, Marta\./.test(r) && !/Encantada, Marta Ruiz/.test(r))
  paso('sin formación, una frase breve antes de seguir', /la experiencia también cuenta/.test(r))
  for (const t of ['Valencia, Ruzafa', 'a convenir']) await decir(t)
  r = await texto(p)
  paso('sin tarifa, sugiere una orientativa', /tarifa orientativa/.test(r))
  await p.close()
}

console.log('\n── Tras el alta, sin recargar: Inicio la saluda como profesional ──')
{
  // 2026-10-01: Inicio no se desmonta y preparaba el saludo una vez; tras
  // darse de alta seguía con «¿Para quién necesitas ayuda?» de invitada.
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('alta sin recargar: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' }); await espera(1500)
  const antes = await texto(p)
  await p.evaluate(() => window.history.pushState({}, '', '/register-helper')); await p.evaluate(() => window.dispatchEvent(new PopStateEvent('popstate')))
  await espera(1500)
  const decir = async t => { await escribirEn(p, t); await p.keyboard.press('Enter'); await espera(3000) }
  for (const t of ['Nuria Camps Ferrer', 'logopeda infantil', 'Grado en Logopedia por la UB', 'Barcelona, Sant Andreu', '45€ la sesión', 'Trabajo con juego y doy pautas a las familias', 'nuria.camps@ejemplo.com']) await decir(t)
  await espera(4500)
  const r = await texto(p)
  paso('tras darse de alta, Inicio dice «tu ficha ya está publicada» (sin recargar)', /Para quién necesitas ayuda/.test(antes) && new URL(p.url()).pathname === '/' && /Nuria, tu ficha ya está publicada/.test(r) && !/Para quién necesitas ayuda/.test(r), new URL(p.url()).pathname + ' · ' + r.slice(0, 80))
  await p.close()
}

console.log('\n── Demo: la profesional ve quién le ha escrito, no los chats de una clienta ──')
{
  // 2026-10-01: en la demo veía las conversaciones de ejemplo de una
  // clienta (Elena, Carlos…). Ahora, su bandeja con mensajes de ejemplo.
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('bandeja demo: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Nuria Camps', isHelper: true, helperProfile: { specialty: 'Logopeda infantil' }, joined: new Date().toISOString() })) })
  await p.goto(BASE + '/chats', { waitUntil: 'networkidle0' }); await espera(1500)
  const marca = () => p.evaluate(() => [...document.querySelectorAll('nav a, nav button')].find(x => /Chats/.test(x.textContent))?.textContent.replace(/\D/g, '') || '0')
  let t = await texto(p)
  paso('ve «Tu trabajo» y «Te han escrito» con 2 sin contestar, sin Elena ni Carlos', /Tu trabajo/.test(t) && /2 sin contestar/.test(t) && !/Elena Fernández|Carlos Martínez/.test(t), t.slice(0, 90))
  paso('la pestaña Chats marca sus 2 mensajes sin contestar', (await marca()) === '2', await marca())
  await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /^Sin contestar: Hola, te he encontrado/.test(b.getAttribute('aria-label') || ''))?.click()); await espera(1500)
  await tocar(p, /Aceptar la cita/); await espera(1500)
  paso('al aceptar la cita de ejemplo, queda confirmada', /Cita confirmada/.test(await texto(p)))
  await p.goto(BASE + '/chats', { waitUntil: 'networkidle0' }); await espera(1500)
  t = await texto(p)
  paso('y en su agenda sale Confirmada, con 1 sin contestar', /Confirmada/.test(t) && /1 sin contestar/.test(t) && (await marca()) === '1', await marca())
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' }); await espera(2500)
  paso('Inicio le dice que tiene 1 mensaje sin contestar, con «Contestar»', /Tienes 1 mensaje sin contestar/.test(await texto(p)))
  await p.close()
}

console.log('\n── Inicio del profesional: frases y botones que sirven ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('inicio pro: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => {
    localStorage.clear(); sessionStorage.clear()
    localStorage.setItem('nura_user', JSON.stringify({ name: 'Marta Ruiz', isHelper: true, helperProfile: { specialty: 'limpieza de casas' }, joined: new Date().toISOString() }))
    sessionStorage.setItem('nura_helper_registered', '1')
    // Los mensajes de ejemplo de la demo, ya contestados: aquí se miran el
    // saludo y sus botones (el aviso de «sin contestar» se prueba aparte).
    localStorage.setItem('nura_demo_avisos', JSON.stringify({ 'demo-1': { respuesta: 'Sí', respondido_en: new Date().toISOString() }, 'demo-2': { respuesta: 'Sí', respondido_en: new Date().toISOString() } }))
  })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await espera(1500)
  const resp = () => p.evaluate(() => (document.querySelector('section[aria-label="Respuesta de Nüra"]')?.innerText || '').replace(/\s+/g, ' '))
  let r = await resp()
  paso('tras el alta: «tu ficha ya está publicada», no «ya puedes encontrar a quien necesitas»', /tu ficha ya está publicada/.test(r) && !/encontrar a quien necesitas/.test(r))
  await tocar(p, /^Editar mi ficha$/)
  await espera(1800)
  paso('«Editar mi ficha» abre la hoja de editar', /\/profile$/.test(p.url()) && await p.evaluate(() => !!document.querySelector('[role="dialog"]')))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await espera(1500)
  r = await resp()
  paso('en su inicio, sus botones y sin «¿para quién necesitas ayuda?»', /Editar mi ficha/.test(r) && /Ver mis mensajes/.test(r) && !/Para quién necesitas ayuda/.test(r))
  await escribirEn(p, 'he trabajado dos años en una residencia'); await p.keyboard.press('Enter'); await espera(2500)
  r = await resp()
  paso('no dice «he actualizado tu perfil» sin hacerlo', !/He actualizado tu perfil/.test(r) && /Editar mi ficha/.test(r))
  await p.close()
}

console.log('\n── Ver todos: volver de un profesional deja en su categoría ──')
{
  // Sergio, 2026-09-30: categoría → profesional → atrás llevaba a la
  // rejilla de categorías, dos pasos atrás.
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('ver todos: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })) })
  await p.goto(BASE + '/explore', { waitUntil: 'networkidle0' })
  await espera(1200)
  await tocar(p, /Arreglar algo en casa/)
  await espera(2000)
  const enCategoria = p.url()
  // Sergio, 2026-09-30: y al volver, la lista sigue donde estaba (ni se
  // recarga ni sube al principio). Se baja, se abre a alguien de más abajo.
  const cuerpo = 'div[data-scroll-propio]'
  const antes = await p.evaluate(sel => {
    const el = [...document.querySelectorAll(sel)].find(x => x.getClientRects().length)
    el.scrollTop = 900
    const b = [...el.querySelectorAll('button[aria-label^="Ver perfil de"]')].find(x => { const r = x.getBoundingClientRect(); return r.top > 150 && r.bottom < innerHeight - 120 })
    return { y: el.scrollTop, quien: b?.getAttribute('aria-label') }
  }, cuerpo)
  await espera(400)
  const abierto = await p.evaluate(q => { const a = document.querySelector(`button[aria-label="${q}"]`); a?.click(); return !!a }, antes.quien)
  await espera(2000)
  const enFicha = /\/helper\//.test(p.url())
  await p.goBack()
  // Justo al volver: sin esqueletos de carga, ya en su sitio.
  await espera(350)
  const vuelta = await p.evaluate(sel => {
    const el = [...document.querySelectorAll(sel)].find(x => x.getClientRects().length)
    return { y: el?.scrollTop, cargando: !!document.querySelector('[class*="keleton"]') }
  }, cuerpo)
  await espera(2000)
  const despues = await p.evaluate(sel => [...document.querySelectorAll(sel)].find(x => x.getClientRects().length)?.scrollTop, cuerpo)
  const t = await texto(p)
  paso('al volver de un profesional, sigue en la lista de su categoría', abierto && enFicha && p.url() === enCategoria && /Fontaner|electricist/i.test(t) && !/Cuidar mi salud/.test(t), `${enCategoria.replace(BASE, '')} → ficha → ${p.url().replace(BASE, '')}`)
  paso('y en el mismo sitio de la lista, sin recargarla', antes.y > 500 && Math.abs(vuelta.y - antes.y) < 5 && Math.abs(despues - antes.y) < 5 && !vuelta.cargando, `bajado ${antes.y} · al volver ${vuelta.y} · luego ${despues}${vuelta.cargando ? ' · recargando' : ''}`)
  await p.goBack()
  await espera(1500)
  paso('y otro «atrás» vuelve a las categorías', /Cuidar mi salud/.test(await texto(p)))
  await p.close()
}

console.log('\n── Después de la cita: preguntar a tiempo y «Mis servicios» coherente ──')
{
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('tras la cita: ' + String(e.message).split('\n')[0].slice(0, 60)))
  const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })) })
  // A quién recomienda Nüra para esto (el que luego «no funcionó»).
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await espera(1500)
  await escribirEn(p, 'Mi hijo de 5 años no pronuncia la R', 'x => x.getBoundingClientRect().width > 100')
  await p.keyboard.press('Enter')
  await espera(5400)
  const primero = await p.evaluate(() => [...document.querySelectorAll('button[aria-label^="Ver perfil de"]')].find(b => b.checkVisibility())?.getAttribute('aria-label')?.replace('Ver perfil de ', ''))
  await tocar(p, /^Ver perfil de/)
  await espera(1500)
  const hid = Number((p.url().match(/\/helper\/(\d+)/) || [])[1])
  const q = await p.evaluate(() => sessionStorage.getItem('nura_last_query'))
  await p.close()

  // Contactado hace 4 días, con la visita MAÑANA: aún no se pregunta.
  const sembrar = async (pg, fecha) => {
    await pg.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await pg.evaluate((hid, nombre, fecha, q) => {
      localStorage.setItem('nura_contacted', JSON.stringify([{ id: hid, name: nombre, contactedAt: Date.now() - 4 * 864e5 }]))
      localStorage.setItem('nura_citas', JSON.stringify([{ id: 'c1', helperId: hid, helperName: nombre, fecha, hora: '10:00', estado: 'confirmada', label: 'jueves a las 10:00', createdAt: Date.now() - 4 * 864e5 }]))
      localStorage.setItem('nura_services', JSON.stringify([{ id: 's1', helperId: hid, helperName: nombre, specialty: 'Logopeda', date: fecha, time: '10:00', status: 'confirmed' }]))
      localStorage.removeItem('nura_ratings')
      sessionStorage.setItem('nura_last_query', q)
    }, hid, primero, fecha, q)
    await pg.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await espera(2200)
  }
  let pg = await navegador.newPage()
  await sembrar(pg, dia(1))
  paso('con la visita aún por venir, no pregunta «¿qué tal fue?»', hid > 0 && !/Qué tal fue|Pudiste resolver/.test(await texto(pg)), `${primero} (${hid})`)
  await pg.close()

  // Pedida con «Contratar»: la cita solo está en Mis servicios (2026-10-01:
  // preguntaba «¿pudiste resolverlo?» minutos después de pedirla).
  const soloServicio = async (pg, fecha) => {
    await pg.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await pg.evaluate((hid, nombre, fecha) => {
      localStorage.setItem('nura_contacted', JSON.stringify([{ id: hid, name: nombre, contactedAt: Date.now() - 4 * 864e5 }]))
      localStorage.removeItem('nura_citas'); localStorage.removeItem('nura_ratings')
      localStorage.setItem('nura_services', JSON.stringify([{ id: 's2', helperId: hid, helperName: nombre, specialty: 'Logopeda', date: fecha, time: '10:00', status: 'pending' }]))
    }, hid, primero, fecha)
    await pg.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await espera(2200)
  }
  pg = await navegador.newPage()
  await soloServicio(pg, dia(3))
  paso('cita pedida con «Contratar» para dentro de 3 días: no pregunta todavía', !/Qué tal fue|Pudiste resolver/.test(await texto(pg)))
  await soloServicio(pg, dia(-1))
  paso('y pasada esa cita, pregunta por la visita con su fecha', /Qué tal fue la visita del \S+, \d+ de \S+/.test(await texto(pg)), (await texto(pg)).match(/Qué tal fue[^?]*/)?.[0] || '')
  await pg.close()

  // La visita fue AYER: ahora sí.
  pg = await navegador.newPage()
  pg.on('pageerror', e => errores.push('tras la cita: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await sembrar(pg, dia(-1))
  paso('pasada la visita, pregunta cómo fue', /Qué tal fue la visita/.test(await texto(pg)))
  await tocar(pg, /^No del todo$/)
  await espera(1500)
  await tocar(pg, /Sí, busca otra persona/)
  await espera(6000)
  const otro = await pg.evaluate(() => [...document.querySelectorAll('button[aria-label^="Ver perfil de"]')].filter(b => b.checkVisibility()).map(b => b.getAttribute('aria-label').replace('Ver perfil de ', '')))
  const t2 = await texto(pg)
  paso('«busca otra persona» no vuelve a proponer a la misma', otro.length > 0 && !otro.includes(primero) && !/Cuentame|Aqui estare/.test(t2), otro.join(', '))
  await pg.close()

  // «Sí, genial» deja su cita pasada como hecha en «Mis servicios».
  pg = await navegador.newPage()
  await sembrar(pg, dia(-1))
  await tocar(pg, /^Sí, genial$/)
  await espera(2000)
  const estado = await pg.evaluate(() => JSON.parse(localStorage.getItem('nura_services') || '[]')[0]?.status)
  paso('«Sí, genial» marca su cita pasada como hecha', estado === 'completed', estado)
  await pg.close()

  // «Mis servicios»: una cita pasada sin marcar y otra futura con alguien ya valorado.
  pg = await navegador.newPage()
  await pg.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await pg.evaluate((a, b) => {
    localStorage.setItem('nura_contacted', '[]'); localStorage.setItem('nura_citas', '[]')
    localStorage.setItem('nura_ratings', JSON.stringify([{ helperId: 2, rating: 5 }]))
    localStorage.setItem('nura_services', JSON.stringify([
      { id: 'f1', helperId: 2, helperName: 'Ana Futura', specialty: 'Fisioterapeuta', date: b, time: '10:00', status: 'confirmed' },
      { id: 'p1', helperId: 3, helperName: 'Pau Pasada', specialty: 'Fontanero', date: a, time: '10:00', status: 'confirmed' },
    ]))
  }, dia(-1), dia(2))
  await pg.goto(BASE + '/my-services', { waitUntil: 'networkidle0' })
  await espera(1500)
  const tarjetas = await pg.evaluate(() => Object.fromEntries([...document.querySelectorAll('article')].map(a => [a.getAttribute('aria-label'), a.innerText.replace(/\s+/g, ' ')])))
  const futura = Object.entries(tarjetas).find(([k]) => /Ana Futura/.test(k))?.[1] || ''
  const pasada = Object.entries(tarjetas).find(([k]) => /Pau Pasada/.test(k))?.[1] || ''
  const proximos = await pg.evaluate(() => [...document.querySelectorAll('button[aria-pressed]')].find(b => /Próximos/.test(b.textContent))?.textContent.replace(/\D/g, ''))
  paso('cita futura con alguien ya valorado: se puede cancelar, sin «Valorado» ni «marcar como hecho»', /Cancelar la cita/.test(futura) && !/Valorado|Repetir|como hecho/.test(futura), futura.slice(0, 90))
  paso('cita ya pasada: «¿Ya se hizo?» y «Marcar como hecho y valorar», sin cancelar', /Ya se hizo/.test(pasada) && /Marcar como hecho y valorar/.test(pasada) && !/Cancelar la cita/.test(pasada), pasada.slice(0, 90))
  paso('en «Próximos» solo cuenta la que está por venir', proximos === '1', `Próximos ${proximos}`)
  await pg.close()
}

console.log('\n── Al tocar una notificación con Nüra abierta ──')
{
  // 2026-10-01: el canal de la profesional no puede cambiar la pantalla; se
  // lo pide a la app con un mensaje y la app navega.
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('notificación: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/explore', { waitUntil: 'networkidle0' })
  await espera(800)
  const manda = url => p.evaluate(u => navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { tipo: 'nura-ir', url: u } })), url)
  await manda('//otra-web.test/robo'); await espera(400)
  const sigue = new URL(p.url()).pathname
  await manda('/chats'); await espera(800)
  paso('la app va a la pantalla que pide la notificación', new URL(p.url()).pathname === '/chats', p.url().replace(BASE, ''))
  paso('y no sale de Nüra por un mensaje con otra dirección', sigue === '/explore')
  await p.close()
}

console.log('\n── La primera vez: preguntas de quien no conoce Nüra ──')
{
  // 2026-10-01: antes «No estoy segura de haberte entendido», o un técnico
  // informático a quien quería ofrecer sus servicios.
  const pregunta = async frase => {
    const p = await navegador.newPage()
    p.on('pageerror', e => errores.push('primera vez: ' + String(e.message).split('\n')[0].slice(0, 60)))
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await p.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await espera(1800)
    await escribirEn(p, frase, 'x => x.getBoundingClientRect().width > 100')
    await p.keyboard.press('Enter')
    await espera(2500)
    return p
  }
  const resp = p => p.evaluate(() => (document.querySelector('section[aria-label="Respuesta de Nüra"]')?.innerText || '').replace(/\s+/g, ' '))
  let p = await pregunta('qué es Nüra')
  let r = await resp(p)
  paso('«qué es Nüra»: lo explica', /Soy Nüra: te ayudo a encontrar/.test(r) && !/haberte entendido/.test(r))
  await p.close()
  p = await pregunta('no sé qué necesito')
  r = await resp(p)
  paso('«no sé qué necesito»: le guía con ejemplos', /Te ayudo a aclararlo/.test(r) && /Ver todas las categorías/.test(r))
  await p.close()
  p = await pregunta('quiero ofrecer mis servicios')
  r = await resp(p)
  const sinResultados = !/Ver perfil/.test(r)
  await tocar(p, /^Darme de alta como profesional$/)
  await espera(1500)
  paso('«quiero ofrecer mis servicios»: al alta de profesional, sin recomendar a nadie', sinResultados && /\/register-helper$/.test(p.url()), p.url().replace(BASE, ''))
  await p.close()
}

console.log('\n── Lo que Nüra recuerda del cliente: solo con permiso ──')
{
  // 2026-10-01: las personas solo se guardan con «Sí, acuérdate» y se pueden
  // olvidar; las frases de búsqueda que guardaron versiones antiguas se borran.
  const nueva = async (antes = () => {}) => {
    const p = await navegador.newPage()
    p.on('pageerror', e => errores.push('memoria: ' + String(e.message).split('\n')[0].slice(0, 60)))
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await p.evaluate(antes)
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
    await espera(1800)
    return p
  }
  const personas = p => p.evaluate(() => JSON.parse(localStorage.getItem('nura_personas') || '[]').length)
  const buscarMadre = async p => {
    await escribirEn(p, 'alguien que cuide a mi madre por las tardes', 'x => x.getBoundingClientRect().width > 100')
    await p.keyboard.press('Enter'); await espera(6500)
  }
  let p = await nueva(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Sergio', joined: new Date().toISOString() })) })
  await buscarMadre(p)
  // El botón puede estar en una parte de la respuesta aún fuera de la vista.
  const pregunta = await p.evaluate(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Sí, acuérdate'))
  const antesDelSi = await personas(p)
  await tocar(p, /^No, gracias$/); await espera(1200)
  paso('pregunta antes de recordar a su madre, y no la guarda sin el sí', pregunta && antesDelSi === 0 && await personas(p) === 0)
  await p.close()

  p = await nueva(() => { sessionStorage.clear(); localStorage.removeItem('nura_personas') })
  await buscarMadre(p)
  await tocar(p, /^Sí, acuérdate$/); await espera(1200)
  paso('con «Sí, acuérdate», la recuerda', await personas(p) === 1)
  await p.goto(BASE + '/profile', { waitUntil: 'networkidle0' }); await espera(1500)
  const enPerfil = /Las personas de tu vida/.test(await texto(p))
  await p.evaluate(() => [...document.querySelectorAll('button[aria-label^="Olvidar a"]')].find(b => b.checkVisibility())?.click())
  await espera(800)
  paso('la ve en su perfil y la puede olvidar', enPerfil && await personas(p) === 0)
  await p.close()

  p = await nueva(() => {
    localStorage.setItem('nura_history', JSON.stringify([{ query: 'frase antigua de prueba', category: 'salud' }]))
    localStorage.setItem('nura_search_history', JSON.stringify([{ query: 'otra frase antigua' }]))
  })
  const quedan = await p.evaluate(() => [localStorage.getItem('nura_history'), localStorage.getItem('nura_search_history')].filter(Boolean).length)
  paso('las frases de búsqueda de versiones antiguas se borran al abrir', quedan === 0 && !/frase antigua/.test(await texto(p)))
  await p.close()
}

console.log('\n── La portada pregunta siempre «¿Para quién necesitas ayuda?» ──')
{
  // 2026-10-01 (Sergio, opción A): antes desaparecía si ya la había
  // contestado en esa pestaña o había escrito a alguien.
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('portada: ' + String(e.message).split('\n')[0].slice(0, 60)))
  const pregunta = () => p.evaluate(() => /Para quién necesitas ayuda/.test(document.body.innerText) && [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Para mí'))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' }); await espera(1500)
  const primera = await pregunta()
  await tocar(p, /^Para mí$/); await espera(1500)
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' }); await espera(1500)
  const trasContestar = await pregunta()
  // Con alguien a quien ya escribió (sin pregunta de «¿pudiste resolver?» pendiente).
  await p.evaluate(() => localStorage.setItem('nura_contacted', JSON.stringify([{ id: 2001, name: 'Carlos Martínez Vidal', contactedAt: Date.now() - 60000 }])))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' }); await espera(1500)
  const conContacto = await pregunta()
  paso('la portada pregunta siempre: la primera vez, tras contestarla y tras escribir a alguien', primera && trasContestar && conContacto, `${primera} · ${trasContestar} · ${conContacto}`)
  await p.close()
}

console.log('\n── Los oficios, con la primera letra en mayúscula ──')
{
  // 2026-10-01: en la base hay «fisioterapeuta» y «Logopeda infantil»; se
  // enseñaba tal cual. Ahora siempre «Fisioterapeuta» (solo al mostrarlo).
  const p = await navegador.newPage()
  await p.goto(BASE + '/helper/2004', { waitUntil: 'networkidle0' }); await espera(1500)
  const t = await p.evaluate(() => document.body.innerText)
  paso('el perfil de Marc dice «Fisioterapeuta», no «fisioterapeuta»', /\bFisioterapeuta\b/.test(t.split('\n').slice(0, 12).join(' ')) && !/^fisioterapeuta$/m.test(t))
  await p.close()
}

console.log('\n── «Ver todos»: los pintores, juntos en «Poner mi casa a punto» ──')
{
  // 2026-10-02 (la madre de Sergio): «Pintor» salía en «Arreglar algo en
  // casa» y «Pintor de interiores» en «Poner mi casa a punto».
  const p = await navegador.newPage()
  const pintores = () => p.evaluate(() => [...document.querySelectorAll('button[aria-label^="Ver perfil de"]')].map(b => b.closest('article, div')?.innerText || '').filter(t => /pintor/i.test(t)).length)
  await p.goto(BASE + '/explore?c=tecnico', { waitUntil: 'networkidle0' }); await espera(1800)
  const enTecnico = await pintores()
  await p.goto(BASE + '/explore?c=hogar', { waitUntil: 'networkidle0' }); await espera(1800)
  const enHogar = await pintores()
  await p.select('#explore-specialty', 'Pintor'); await espera(800)
  const conFiltro = await p.evaluate(() => document.querySelectorAll('button[aria-label^="Ver perfil de"]').length)
  paso('ningún pintor en «Arreglar algo en casa» y los dos en «Poner mi casa a punto»', enTecnico === 0 && enHogar === 2, `técnico ${enTecnico} · hogar ${enHogar}`)
  paso('el filtro «Pintor» los reúne a los dos', conFiltro === 2, String(conFiltro))
  // Y al revés: electricista, albañil y carpintero, solo en «Arreglar algo en casa».
  const oficios = () => p.evaluate(() => { const t = [...document.querySelectorAll('button[aria-label^="Ver perfil de"]')].map(b => b.closest('article, div')?.innerText || ''); return ['electricista', 'albañil', 'carpinter'].map(o => t.filter(x => new RegExp(o, 'i').test(x)).length) })
  await p.goto(BASE + '/explore?c=hogar', { waitUntil: 'networkidle0' }); await espera(1800)
  const hogarOf = await oficios()
  await p.goto(BASE + '/explore?c=tecnico', { waitUntil: 'networkidle0' }); await espera(1800)
  const tecnicoOf = await oficios()
  paso('electricista, albañil y carpintero: los dos de cada, solo en «Arreglar algo en casa»', hogarOf.every(n => n === 0) && tecnicoOf.every(n => n === 2), `hogar ${hogarOf} · técnico ${tecnicoOf}`)
  await p.close()
}

console.log('\n── La frase principal de Nüra, grande en todas las respuestas ──')
{
  // 2026-10-01 (Sergio): tras «Para mí» la respuesta salía en texto pequeño.
  const p = await navegador.newPage()
  p.on('pageerror', e => errores.push('respuesta corta: ' + String(e.message).split('\n')[0].slice(0, 60)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' }); await espera(1500)
  await tocar(p, /^Para alguien de mi familia$/); await espera(1500)
  const tam = await p.evaluate(() => {
    const el = [...document.querySelectorAll('section[aria-label="Respuesta de Nüra"] p')].find(x => /Cuéntame qué le pasa/.test(x.textContent))
    return el ? parseFloat(getComputedStyle(el).fontSize) : 0
  })
  paso('tras «Para alguien de mi familia», la respuesta se lee en grande', tam >= 20, `${tam}px`)
  await p.close()
  // Y con resultados, su frase principal también («X es quien mejor encaja»).
  const q = await navegador.newPage()
  await q.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await q.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await q.goto(BASE + '/', { waitUntil: 'networkidle0' }); await espera(1500)
  await escribirEn(q, 'necesito un fontanero', 'x => x.getBoundingClientRect().width > 100')
  await q.keyboard.press('Enter'); await espera(5500)
  const tamRes = await q.evaluate(() => {
    const el = [...document.querySelectorAll('section[aria-label="Respuesta de Nüra"] p')].find(x => /mejor encaja/.test(x.textContent))
    return el ? parseFloat(getComputedStyle(el).fontSize) : 0
  })
  paso('con resultados, «… es quien mejor encaja» también en grande', tamRes >= 20, `${tamRes}px`)
  // Volver a empezar deja la misma portada que al entrar (Sergio,
  // 2026-10-01): antes faltaba «¿Para quién necesitas ayuda?».
  await q.click('button[aria-label="Empezar conversación de nuevo"]'); await espera(1200)
  const portada = await q.evaluate(() => ({
    pregunta: /Para quién necesitas ayuda/.test(document.body.innerText),
    botones: ['Para mí', 'Para alguien de mi familia', 'Para mi hogar o negocio'].every(t => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === t)),
    sinResultados: !/mejor encaja/.test(document.body.innerText),
  }))
  paso('volver a empezar muestra la misma portada, con «¿Para quién necesitas ayuda?»', portada.pregunta && portada.botones && portada.sinResultados, JSON.stringify(portada))
  await tocar(q, /^Para alguien de mi familia$/); await espera(1500)
  paso('y sus botones siguen funcionando', /Cuéntame qué le pasa/.test(await q.evaluate(() => document.body.innerText)))
  await q.close()
  // Una frase no se parte a mitad: «madre".» caía sola en letra pequeña.
  const r = await navegador.newPage()
  await r.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await r.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await r.goto(BASE + '/', { waitUntil: 'networkidle0' }); await espera(1500)
  await escribirEn(r, 'asdfg qwerty', 'x => x.getBoundingClientRect().width > 100')
  await r.keyboard.press('Enter'); await espera(5500)
  const trozos = await r.evaluate(() => [...document.querySelectorAll('section[aria-label="Respuesta de Nüra"] p')]
    .filter(x => !/asdfg/.test(x.textContent)).map(x => ({ t: x.textContent.trim(), px: parseFloat(getComputedStyle(x).fontSize) })))
  paso('la ayuda de Nüra se corta al final de una frase, no a mitad',
    trozos.length >= 1 && trozos[0].px >= 18 && /palabras\?$/.test(trozos[0].t) && trozos.every(x => /[.!?]["»”]?$/.test(x.t)),
    JSON.stringify(trozos.map(x => x.px + 'px ' + x.t.slice(-20))))
  await r.close()
}

// ── El móvil de la madre de Sergio (2026-10-02) ─────────────────────────
console.log('\n── móvil bajo, valorar, teclado y «Ver todos» ──')
{
  const p = await navegador.newPage()
  await p.setViewport({ width: 393, height: 660, isMobile: true, hasTouch: true })
  await p.evaluateOnNewDocument(() => {
    // Sin teclado, la altura real (al cargar, innerHeight aún no es la del móvil).
    const vv = new EventTarget(); let h = null
    Object.defineProperties(vv, { height: { get: () => h ?? window.innerHeight }, width: { get: () => window.innerWidth }, offsetTop: { get: () => 0 }, offsetLeft: { get: () => 0 }, scale: { get: () => 1 }, pageTop: { get: () => 0 } })
    Object.defineProperty(window, 'visualViewport', { get: () => vv })
    window.__teclado = alto => { h = alto ? window.innerHeight - alto : null; vv.dispatchEvent(new Event('resize')) }
  })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Babi', joined: new Date().toISOString() })) })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' }); await espera(1500)
  const visibles = () => p.evaluate(() => [...document.querySelectorAll('section[aria-label="Respuesta de Nüra"] [aria-hidden="false"]')].map(e => e.textContent).join(' | '))
  const portada = await visibles()
  paso('en un móvil bajo, «¿Para quién…?» y sus tres respuestas salen en la primera página',
    ['Para mí', 'Para alguien de mi familia', 'Para mi hogar o negocio'].every(t => portada.includes(t)), portada.slice(0, 200))
  // Teclado abierto en Inicio: la barra de abajo no sube; la cápsula, sí.
  await p.evaluate(() => { const i = [...document.querySelectorAll('input')].find(x => x.checkVisibility?.() && x.getBoundingClientRect().width > 80); i.focus() })
  await p.evaluate(() => window.__teclado(300)); await espera(700)
  const teclado = await p.evaluate(() => {
    const nav = [...document.querySelectorAll('nav[aria-label="Navegación principal"]')].find(n => n.getBoundingClientRect().height > 0)
    return { nav: Math.round(nav.getBoundingClientRect().bottom), campo: Math.round(document.activeElement.getBoundingClientRect().bottom), desplazado: document.querySelector('.desktopMain').scrollTop }
  })
  paso('con el teclado, la barra de abajo se queda abajo y el campo queda a la vista', teclado.nav > 600 && teclado.campo <= 360 && teclado.desplazado === 0, JSON.stringify(teclado))
  await p.evaluate(() => { document.activeElement.blur(); window.__teclado(0) }); await espera(500)
  await escribirEn(p, 'Pintor', 'x => x.getBoundingClientRect().width > 80')
  await p.keyboard.press('Enter')
  await p.waitForFunction(() => /Primera opción/.test(document.querySelector('section[aria-label="Respuesta de Nüra"]')?.textContent || ''), { timeout: 20000 }).catch(() => {})
  await espera(800)
  const busqueda = await visibles()
  paso('en un móvil bajo, el profesional recomendado sale en la primera página', /Primera opción/.test(busqueda), busqueda.slice(0, 160))
  await p.close()
}
{
  // Valorar: sin «Tu búsqueda: Valorar a…» y, al volver, sin preguntar
  // «¿Cómo está yendo todo con…?» por alguien ya valorado.
  const p = await navegador.newPage()
  await p.setViewport({ width: 393, height: 760, isMobile: true, hasTouch: true })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(() => {
    localStorage.clear(); sessionStorage.clear()
    localStorage.setItem('nura_user', JSON.stringify({ name: 'Babi', joined: new Date().toISOString() }))
    localStorage.setItem('nura_contacted', JSON.stringify([{ id: 2006, name: 'Miquel Font Roca', contactedAt: Date.now() - 4 * 864e5 }]))
  })
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' }); await espera(1800)
  await tocar(p, /^Sí, genial$/); await espera(1500)
  await p.click('button[aria-label="Cerrar valoración"]'); await espera(1200)
  await tocar(p, /^Valorar a Miquel$/); await espera(1000)
  const tras = await p.evaluate(() => ({ ventana: Boolean(document.querySelector('[role=dialog]')), etiqueta: /Valorar a Miquel/.test(document.querySelector('section[aria-label="Respuesta de Nüra"] p[class*=query]')?.textContent || ''), vacio: /^Cuéntame qué necesitas\.$/.test(document.querySelector('section[aria-label="Respuesta de Nüra"] p')?.textContent || '') }))
  await p.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].find(b => b.textContent.trim() === 'Sí')?.click()); await espera(300)
  await p.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].find(b => /Enviar valoración/.test(b.textContent))?.click()); await espera(3500)
  const gracias = await p.evaluate(() => document.querySelector('section[aria-label="Respuesta de Nüra"]')?.innerText || '')
  paso('«Valorar a Miquel» abre la ventana sin dejar «Tu búsqueda: Valorar a Miquel»', tras.ventana && !tras.etiqueta && !tras.vacio, JSON.stringify(tras))
  paso('al enviar la valoración, Nüra da las gracias en la misma pantalla', /Gracias por valorar a Miquel/.test(gracias) && !/Valorar a Miquel/.test(gracias), gracias.slice(0, 160))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' }); await espera(1800)
  const vuelta = await p.evaluate(() => document.querySelector('section[aria-label="Respuesta de Nüra"]')?.innerText || '')
  paso('al volver, no pregunta «¿Cómo está yendo todo con Miquel?» si ya le valoró', !/Cómo está yendo/.test(vuelta) && /Para quién necesitas ayuda/.test(vuelta), vuelta.slice(0, 160))
  await p.close()
}
{
  const p = await navegador.newPage()
  await p.setViewport({ width: 393, height: 760, isMobile: true, hasTouch: true })
  await p.goto(BASE + '/explore', { waitUntil: 'networkidle0' })
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Babi', joined: new Date().toISOString() })) })
  await p.goto(BASE + '/explore', { waitUntil: 'networkidle0' }); await espera(800)
  await p.type('input[aria-label="Buscar profesionales"]', 'pintor'); await espera(3500)
  const lista = await p.evaluate(() => {
    const s = document.querySelector('section[aria-label="Profesionales encontrados"]')
    return { titulo: s?.querySelector('[role=status]')?.textContent || '', oficios: [...(s?.querySelectorAll('[class*=resultItem]') || [])].map(x => x.innerText.split('\n')[1]), rejilla: document.querySelectorAll('[class*=catCard]').length }
  })
  paso('en «Ver todos», buscar «pintor» lista a los pintores, como dentro de las categorías',
    /profesionales? para «pintor»/.test(lista.titulo) && lista.oficios.length >= 2 && lista.oficios.every(o => /^Pintor/.test(o)) && lista.rejilla === 0, JSON.stringify(lista))
  await p.goto(BASE + '/explore?c=hogar', { waitUntil: 'networkidle0' }); await espera(1800)
  const dentro = await p.evaluate(() => ({ buscador: Boolean(document.querySelector('input[aria-label="Buscar profesionales"]')), filtros: Boolean(document.querySelector('#explore-specialty')), lista: document.querySelectorAll('[class*=resultItem]').length }))
  paso('dentro de una categoría no hay buscador: filtros y lista', !dentro.buscador && dentro.filtros && dentro.lista > 0, JSON.stringify(dentro))
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
