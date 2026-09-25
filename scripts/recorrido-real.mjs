// ── Nüra · el recorrido REAL, de punta a punta ──────────────────────────
//
//   npm run recorrido:real
//
// Compila la app SIN demo y con la funcion de servidor encendida, la sirve
// en local y hace, en un navegador, lo que haria una familia y un
// profesional de verdad:
//
//   buscar → ficha → crear cuenta → volver al chat → escribir → otro mensaje
//   → el profesional abre su enlace y contesta → la respuesta llega → ella
//   contesta → propone una cita → la marca hecha → valora.
//
// El servidor es FICTICIO (en memoria, con las mismas reglas: llaves de
// lectura, una respuesta por aviso, valorar solo con llave). No toca
// Supabase ni envia nada a nadie. Si algo del camino se rompe, sale con 1.

import puppeteer from 'puppeteer-core'
import crypto from 'node:crypto'
import { spawn, execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = process.env.NURA_CHROME || process.env.NURA_CHROMIUM || '/tmp/chr/chromium'
const PUERTO = 4179
const B = `http://localhost:${PUERTO}`
const FUNCION = 'https://funcion.ficticia.test/helpers-write'

let fallos = 0
const ok = (c, t) => { console.log((c ? '✓ ' : '✗ ') + t); if (!c) fallos++ }

// ── compilar y servir ──
const dist = mkdtempSync(join(tmpdir(), 'nura-real-'))
console.log('Compilando sin demo…')
execSync(`npx vite build --outDir ${dist}`, { cwd: raiz, stdio: 'ignore',
  env: { ...process.env, VITE_DEMO: 'false', VITE_EDGE_WRITES: 'true', VITE_EDGE_URL: FUNCION } })
const servidor = spawn('npx', ['vite', 'preview', '--outDir', dist, '--port', String(PUERTO), '--strictPort'], { cwd: raiz, stdio: 'ignore' })
await new Promise(r => setTimeout(r, 3000))

// ── el servidor ficticio, con estado ──
const avisos = [], valoraciones = []
const sha = t => crypto.createHash('sha256').update(t).digest('hex')
const azar = () => crypto.randomBytes(16).toString('hex')
function backend(c) {
  const porLlave = l => avisos.find(a => a.lectura_hash === sha(l || ''))
  const citaDe = x => x?.fecha && x?.hora ? { cita_fecha: x.fecha, cita_hora: x.hora, cita_estado: 'propuesta' } : {}
  const citaSal = a => a.cita_fecha ? { fecha: a.cita_fecha, hora: a.cita_hora, estado: a.cita_estado } : null
  switch (c.op) {
    case 'encolar-aviso': { const lectura = azar(); avisos.push({ helper_id: String(c.helperId), mensaje: c.mensaje, token: azar(), lectura_hash: sha(lectura), respuesta: null, ...citaDe(c.cita) }); return { ok: true, alcanzable: true, lectura } }
    case 'ampliar-aviso': { const a = porLlave(c.llave); if (!a) return { __estado: 404 }; if (a.respuesta) return { __estado: 409 }; a.mensaje += '\n\n—\n' + c.mensaje; Object.assign(a, citaDe(c.cita)); return { ok: true } }
    case 'abrir-aviso': { const a = avisos.find(x => x.token === c.token); return a ? { ok: true, aviso: { nombre: 'Carlos', mensaje: a.mensaje, respuesta: a.respuesta, cita: citaSal(a) } } : { __estado: 404 } }
    case 'responder-aviso': {
      const a = avisos.find(x => x.token === c.token); if (!a) return { __estado: 404 }; if (a.respuesta) return { __estado: 409 }
      if (c.cita === 'aceptada' && a.cita_estado === 'propuesta' && avisos.some(o => o !== a && o.helper_id === a.helper_id && o.cita_estado === 'aceptada' && o.cita_fecha === a.cita_fecha && o.cita_hora === a.cita_hora)) return { __estado: 409 }
      a.respuesta = c.respuesta; a.respondido_en = new Date().toISOString()
      if ((c.cita === 'aceptada' || c.cita === 'rechazada') && a.cita_estado === 'propuesta') a.cita_estado = c.cita
      return { ok: true }
    }
    case 'respuestas': { const hs = (c.llaves || []).map(sha); return { ok: true, respuestas: avisos.filter(a => hs.includes(a.lectura_hash) && a.respuesta).map(a => ({ llave: c.llaves[hs.indexOf(a.lectura_hash)], respuesta: a.respuesta, respondido_en: a.respondido_en, cita: citaSal(a) })) } }
    case 'ocupadas': return { ok: true, ocupadas: avisos.filter(a => a.helper_id === String(c.helperId) && a.cita_estado === 'aceptada').map(a => ({ fecha: a.cita_fecha, hora: a.cita_hora })) }
    case 'valorar': { const a = porLlave(c.llave); if (!a) return { __estado: 404 }; valoraciones.push({ helper_id: a.helper_id, ...c }); return { ok: true } }
    default: return { ok: true }
  }
}

const b = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const errores = []
const BD = [{ id: 7001, name: 'Laura Vidal Soler', specialty: 'Logopeda infantil', category: 'logopedia', zone: 'Gràcia',
  bio: 'Logopeda infantil: dislalias, la r y la s, con juego.', rating: 4.9, reviews: 12, services: 30,
  available: true, presential: true, online: false, verified: true, tags: ['logopedia infantil', 'dislalia'] }]
async function pagina() {
  const p = await b.newPage()
  await p.setViewport({ width: 390, height: 844 })
  await p.setRequestInterception(true)
  const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
  p.on('request', r => {
    const u = r.url()
    if (u.startsWith('https://funcion.ficticia.test')) {
      if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: H })
      const res = backend(JSON.parse(r.postData() || '{}'))
      return r.respond({ status: res.__estado || 200, headers: H, contentType: 'application/json', body: JSON.stringify(res) })
    }
    // La base de datos simulada tiene UNA logopeda real. Antes respondia
    // vacia y la busqueda tiraba de los perfiles de ejemplo de la app; fuera
    // de la demo eso ya no pasa (no se recomiendan personas inventadas).
    if (!u.startsWith(B)) {
      if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: H })
      let cuerpo = []
      if (u.includes('/rest/v1/helpers')) {
        const id = (u.match(/[?&]id=eq\.(\d+)/) || [])[1]
        const cat = decodeURIComponent((u.match(/category=(?:ilike\.|in\.\()([^&)]+)/) || [])[1] || '')
        cuerpo = (id ? BD.filter(h => String(h.id) === id) : BD.filter(h => !cat || cat.split(',').includes(h.category)))
      }
      return r.respond({ status: 200, headers: H, contentType: 'application/json', body: JSON.stringify(cuerpo) })
    }
    r.continue()
  })
  p.on('pageerror', e => errores.push(e.message))
  return p
}
const espera = ms => new Promise(r => setTimeout(r, ms))
const texto = async p => (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ')
const pulsar = async (p, t) => { await espera(300); return p.evaluate(t => { const el = [...document.querySelectorAll('button, a')].find(e => e.textContent.trim().includes(t) && e.offsetParent !== null); el?.click(); return !!el }, t).then(async r => { await espera(900); return r }) }
const CAMPO = 'input[aria-label="Escribe tu mensaje"]', ENVIAR = '[aria-label="Enviar mensaje"]'
const escribir = async (p, t) => { await p.click(CAMPO, { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type(CAMPO, t); await p.click(ENVIAR); await espera(1500) }

try {
  const c = await pagina()
  await c.goto(B + '/', { waitUntil: 'networkidle0' })
  await c.goto(B + '/', { waitUntil: 'networkidle0' }); await espera(1200)

  console.log('\n── La familia busca y escribe ──')
  await c.type('textarea, input', 'Busco logopeda para mi hijo de 5 años que no pronuncia la r'); await c.keyboard.press('Enter')
  await espera(7000)
  ok(await pulsar(c, 'Escribir a'), 'la búsqueda recomienda a alguien con «Escribir a…»')
  // Desde la tarjeta se va a su ficha o directo al registro: los dos valen.
  if (c.url().includes('/helper/')) ok(await pulsar(c, 'Escribir a'), 'desde su ficha, «Escribir a…»')
  if (!c.url().includes('/login')) ok(await pulsar(c, 'Crear cuenta gratis'), 'sin cuenta, se le pide crearla')
  ok(c.url().includes('/login'), 'llega a crear su cuenta')
  const alta = await texto(c)
  ok(!/código|te lo hemos enviado/i.test(alta), 'no se promete ningún código por SMS (no se envía ninguno)')
  await c.waitForSelector('input[placeholder="Tu nombre"]'); await c.type('input[placeholder="Tu nombre"]', 'Marta')
  await pulsar(c, 'Entrar en Nüra'); await espera(1500)
  ok(/\/chat\/\d+/.test(c.url()), `tras crear la cuenta vuelve al chat que quería abrir (${c.url().replace(B, '')})`)
  const saludo = await texto(c)
  ok(!/Vi que me encontraste|¿En qué puedo ayudarte\?/.test(saludo), 'el profesional no «saluda» solo: nadie ha escrito eso')
  await espera(800); await c.click(ENVIAR); await espera(1500)
  ok(avisos.length === 1, 'el primer mensaje genera un aviso para el profesional')
  ok(!/No tenemos forma de avisarte/.test(avisos[0]?.mensaje || ''), 'el aviso no le dice «no tenemos forma de avisarte» a quien lo está leyendo')
  await espera(800)
  ok((await texto(c)).includes('Avísame cuando conteste'), 'ofrece «Avísame cuando conteste» (nada se pide hasta tocarlo)')
  await escribir(c, 'Por cierto, vivimos en Gràcia.')
  ok(avisos.length === 1 && avisos[0].mensaje.includes('vivimos en Gràcia'), 'lo que escribe antes de que conteste se añade a su aviso')

  console.log('\n── El profesional contesta desde su enlace ──')
  const pro = await pagina()
  await pro.goto(B + '/r/' + avisos[0].token, { waitUntil: 'networkidle0' }); await espera(1000)
  ok((await texto(pro)).includes('vivimos en Gràcia'), 'al abrir su enlace ve todos los mensajes')
  await pro.type('textarea', 'Hola Marta, sí: los martes a las 18 h tengo hueco. ¿Te va bien?')
  await pulsar(pro, 'Enviar respuesta')
  ok(avisos[0].respuesta?.includes('los martes'), 'su respuesta se guarda')
  await pro.close(); await c.bringToFront()

  console.log('\n── La respuesta llega y la conversación sigue ──')
  await c.reload({ waitUntil: 'networkidle0' }); await espera(2500)
  ok((await texto(c)).includes('los martes a las 18'), 'la familia ve la respuesta en el chat')
  await escribir(c, 'Perfecto, el martes nos va genial.')
  ok(avisos.length === 2 && avisos[1].mensaje.includes('Tú le dijiste') && avisos[1].mensaje.includes('el martes nos va genial'),
    'lo que escribe después le llega en un aviso nuevo, con el contexto')

  console.log('\n── Propone una cita, la marca hecha y valora ──')
  ok(await pulsar(c, 'Contratar'), 'en el chat, «Contratar»')
  // La hoja de cita (ElegirCita): el primer día con huecos y su primera hora libre.
  const dia = await c.evaluate(() => { const d = [...document.querySelectorAll('[role=option]')].find(x => !x.disabled); d?.click(); return d?.getAttribute('aria-label') || null })
  await espera(500)
  const hora = await c.evaluate(() => { const h = [...document.querySelectorAll('button[aria-pressed]')].find(x => !x.disabled); h?.click(); return h?.textContent.trim() || null })
  await espera(300)
  ok(Boolean(dia && hora) && await pulsar(c, 'Enviar solicitud'), `elige día (${dia}) y hora (${hora}), y envía la propuesta`)
  ok(/Se la hago llegar/.test(await texto(c)), 'dice que se la hace llegar (no «te confirmará en breve»)')
  ok(/te propone una cita/.test(avisos.at(-1)?.mensaje || ''), 'la propuesta de cita le llega al profesional')
  const conCita = avisos.find(a => a.cita_estado === 'propuesta')
  ok(Boolean(conCita), 'y le llega con su día y su hora (no solo como texto)')

  console.log('\n── El profesional acepta la cita con un botón ──')
  const pro2 = await pagina()
  await pro2.goto(B + '/r/' + conCita.token, { waitUntil: 'networkidle0' }); await espera(1000)
  ok(/Te propone una cita/.test(await texto(pro2)), 'al abrir su enlace ve la cita propuesta')
  ok(await pulsar(pro2, 'Aceptar la cita'), 'pulsa «Aceptar la cita»')
  await espera(800)
  ok(conCita.cita_estado === 'aceptada' && /Cita confirmada/.test(await texto(pro2)), 'la cita queda aceptada y se lo confirma')
  await pro2.close(); await c.bringToFront()

  console.log('\n── Quien la pidió la ve confirmada; otra persona ve la hora ocupada ──')
  await c.goto(B + '/my-services', { waitUntil: 'networkidle0' }); await espera(2500)
  ok(/Confirmado/.test(await texto(c)), 'en «Mis servicios» la cita sale Confirmada')
  const otra = await (await b.createBrowserContext()).newPage()
  await otra.setViewport({ width: 390, height: 844 })
  await otra.setRequestInterception(true)
  otra.on('request', r => {
    const u = r.url()
    const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
    if (u.startsWith('https://funcion.ficticia.test')) {
      if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: H })
      const res = backend(JSON.parse(r.postData() || '{}'))
      return r.respond({ status: res.__estado || 200, headers: H, contentType: 'application/json', body: JSON.stringify(res) })
    }
    if (!u.startsWith(B)) {
      if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: H })
      const id = (u.match(/[?&]id=eq\.(\d+)/) || [])[1]
      return r.respond({ status: 200, headers: H, contentType: 'application/json', body: JSON.stringify(u.includes('/rest/v1/helpers') ? BD.filter(h => !id || String(h.id) === id) : []) })
    }
    r.continue()
  })
  await otra.evaluateOnNewDocument(() => localStorage.setItem('nura_user', JSON.stringify({ name: 'Otra', joined: new Date().toISOString() })))
  await otra.goto(B + '/helper/' + conCita.helper_id, { waitUntil: 'networkidle0' }); await espera(1200)
  await pulsar(otra, 'Disponibilidad'); await espera(800)
  const fechaCita = conCita.cita_fecha
  await otra.evaluate(f => { const d = new Date(f + 'T12:00:00'); const n = String(d.getDate()); const o = [...document.querySelectorAll('[role=option]')].find(x => (x.getAttribute('aria-label') || '').includes(' ' + n + ':')); o?.click() }, fechaCita)
  await espera(1000)
  const estadoHora = await otra.evaluate(h => [...document.querySelectorAll('button[aria-pressed]')].find(x => x.textContent.trim() === h)?.getAttribute('aria-label'), conCita.cita_hora)
  ok(/ocupada/.test(estadoHora || ''), `otra persona ve esa hora ocupada en su agenda (${estadoHora})`)
  await otra.close()

  await c.goto(B + '/my-services', { waitUntil: 'networkidle0' }); await espera(1200)
  ok(await pulsar(c, 'Marcar completado y valorar'), 'en «Mis servicios» se puede marcar hecho y valorar')
  await pulsar(c, 'Sí'); await pulsar(c, 'Paciente')
  await c.evaluate(() => document.querySelector('[aria-label="5 estrellas"]')?.click())
  await pulsar(c, 'Enviar'); await espera(1500)
  ok(valoraciones.length === 1 && valoraciones[0].helper_id === avisos[0].helper_id && valoraciones[0].volveria === true,
    'la valoración llega al servidor, de la conversación real con ese profesional')
} catch (e) {
  ok(false, 'el recorrido se ha roto: ' + e.message)
} finally {
  ok(!errores.length, 'sin errores de JavaScript' + (errores.length ? ': ' + errores[0] : ''))
  await b.close(); servidor.kill()
}

console.log(`\n${fallos ? '❌' : '✅'} RECORRIDO REAL ${fallos ? `CON ${fallos} FALLO(S)` : 'COMPLETO'}\n`)
process.exit(fallos ? 1 : 0)
