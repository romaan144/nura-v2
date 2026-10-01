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
// En su propio grupo de procesos: `npx` lanza vite como nieto, y matar solo
// a npx dejaba vivo el servidor. La siguiente ejecución, con --strictPort,
// no podía arrancar el suyo y probaba EN SILENCIO la compilación anterior.
const servidor = spawn('npx', ['vite', 'preview', '--outDir', dist, '--port', String(PUERTO), '--strictPort'], { cwd: raiz, stdio: 'ignore', detached: true })
const apagar = () => { try { process.kill(-servidor.pid) } catch { /* ya estaba apagado */ } }
process.on('exit', apagar)
await new Promise(r => setTimeout(r, 3000))

// ── el servidor ficticio, con estado ──
const avisos = [], valoraciones = [], eventos = []
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
    case 'cancelar-cita': {
      const hs = (c.llaves || []).map(sha)
      const a = avisos.find(x => hs.includes(x.lectura_hash) && x.cita_fecha === c.fecha && x.cita_hora === c.hora && ['propuesta', 'aceptada'].includes(x.cita_estado))
      if (!a) return { __estado: 404 }
      a.cita_estado = 'cancelada'; return { ok: true }
    }
    case 'valorar': { const a = porLlave(c.llave); if (!a) return { __estado: 404 }; valoraciones.push({ helper_id: a.helper_id, ...c }); return { ok: true } }
    case 'evento': eventos.push(c.payload); return { ok: true }
    // La cuenta de Laura (correo confirmado) encuentra su ficha; otra, ninguna.
    case 'reclamar-ficha': return c.token === 'sesion-pro'
      ? { ok: true, helper: { id: 7001, name: 'Laura Vidal Soler', specialty: 'Logopeda infantil', zone: 'Gràcia', contacto: 'laura@ficticia.test' } }
      : { ok: false, motivo: 'sin-ficha' }
    case 'demanda-oficio': {
      const mes = e => e.oficio === c.oficio && Date.parse(e.fecha) > Date.now() - 30 * 864e5
      return { ok: true, busquedas: eventos.filter(e => e.tipo === 'busqueda' && mes(e)).length, sinNadie: eventos.filter(e => e.tipo === 'sin_cobertura' && mes(e)).length }
    }
    default: return { ok: true }
  }
}

const b = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const errores = []
const BD = [{ id: 7001, name: 'Laura Vidal Soler', specialty: 'Logopeda infantil', category: 'logopedia', zone: 'Gràcia',
  bio: 'Logopeda infantil: dislalias, la r y la s, con juego.', rating: 4.9, reviews: 12, services: 30,
  available: true, presential: true, online: false, verified: true, tags: ['logopedia infantil', 'dislalia'] }]
async function pagina(ctx = b) {
  const p = await ctx.newPage()
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
      // La vuelta del correo de confirmación: la librería pregunta quién es.
      // Entrar con correo y contraseña: una profesional que dio un teléfono.
      if (u.includes('/auth/v1/token')) {
        return r.respond({ status: 200, headers: H, contentType: 'application/json', body: JSON.stringify({
          access_token: 'sesion-telefono', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r3',
          user: { id: 'u-tel', aud: 'authenticated', role: 'authenticated', email: 'otra@ficticia.test', email_confirmed_at: '2026-09-01T00:00:00Z' } }) })
      }
      if (u.includes('/auth/v1/user')) {
        const tk = (r.headers().authorization || '').replace(/^Bearer /, '')
        return r.respond({ status: 200, headers: H, contentType: 'application/json',
          body: JSON.stringify({ id: 'u-' + tk, aud: 'authenticated', role: 'authenticated', email: tk === 'sesion-pro' ? 'laura@ficticia.test' : 'cliente@ficticia.test', email_confirmed_at: '2026-09-01T00:00:00Z' }) })
      }
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
const pulsar = async (p, t) => { await espera(300); return p.evaluate(t => { const el = [...document.querySelectorAll('button, a')].find(e => (e.textContent.trim() || e.getAttribute('aria-label') || '').includes(t) && e.offsetParent !== null); el?.click(); return !!el }, t).then(async r => { await espera(900); return r }) }
const CAMPO = 'input[aria-label="Escribe tu mensaje"]', ENVIAR = '[aria-label="Enviar mensaje"]'
const escribir = async (p, t) => { await p.click(CAMPO, { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type(CAMPO, t); await p.click(ENVIAR); await espera(1500) }

try {
  const c = await pagina()
  await c.goto(B + '/', { waitUntil: 'networkidle0' })
  await c.goto(B + '/', { waitUntil: 'networkidle0' }); await espera(1200)

  console.log('\n── La familia busca y escribe ──')
  await c.type('textarea, input', 'Busco logopeda para mi hijo de 5 años que no pronuncia la r'); await c.keyboard.press('Enter')
  await espera(7000)
  {
    const busqueda = eventos.find(e => e.tipo === 'busqueda')
    ok(busqueda?.oficio === 'logopeda', `la búsqueda se cuenta con su oficio (${busqueda?.oficio}), para saber a quién fichar`)
    ok(!JSON.stringify(eventos).includes('pronuncia'), 'y ningún evento lleva la frase buscada')
  }
  ok(await pulsar(c, 'Escribir a'), 'la búsqueda recomienda a alguien con «Escribir a…»')
  // Desde la tarjeta se va a su ficha o directo al registro: los dos valen.
  if (c.url().includes('/helper/')) ok(await pulsar(c, 'Escribir a'), 'desde su ficha, «Escribir a…»')
  if (!c.url().includes('/login')) ok(await pulsar(c, 'Crear cuenta gratis'), 'sin cuenta, se le pide crearla')
  ok(c.url().includes('/login'), 'llega a crear su cuenta')
  const alta = await texto(c)
  ok(!/código|te lo hemos enviado/i.test(alta), 'no se promete ningún código por SMS (no se envía ninguno)')
  await c.waitForSelector('#login-name'); await c.type('#login-name', 'Marta')
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
  // La hoja de cita (ElegirCita): el primer día con huecos y su primera hora
  // libre. Días y horas son botones (aria-pressed); las horas llevan data-state.
  const dia = await c.evaluate(() => { const d = [...document.querySelectorAll('[aria-label="Elige un día"] button')].find(x => !x.disabled); d?.click(); return d?.getAttribute('aria-label') || null })
  await espera(500)
  const hora = await c.evaluate(() => { const h = [...document.querySelectorAll('button[data-state]')].find(x => !x.disabled); h?.click(); return h?.textContent.trim() || null })
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
  // «Me va bien» solo escribía el texto: la cita quedaba sin aceptar.
  ok(!(await pro2.evaluate(() => [...document.querySelectorAll('[aria-label="Respuestas rápidas"] button')].some(b => /Me va bien/.test(b.textContent)))), 'con la cita pendiente no hay una rápida «Me va bien» que no la acepte')
  ok(!/ De [A-ZÁÉÍÓÚ][a-z]+ ·/.test(await texto(pro2)), 'la fecha con una sola mayúscula («2 de octubre»)')
  ok(await pulsar(pro2, 'Aceptar la cita'), 'pulsa «Aceptar la cita»')
  await espera(800)
  ok(conCita.cita_estado === 'aceptada' && /Cita confirmada/.test(await texto(pro2)), 'la cita queda aceptada y se lo confirma')
  await pro2.close(); await c.bringToFront()
  // En su chat, Nüra dice claro que la cita está confirmada y dónde verla.
  await c.reload({ waitUntil: 'networkidle0' }); await espera(2500)
  ok(/ha confirmado la cita: .+ a las \d/.test(await texto(c)) && /Ver mis servicios/.test(await texto(c)), 'en su chat, Nüra dice que la cita está confirmada, con el día')

  console.log('\n── Quien la pidió la ve confirmada; otra persona ve la hora ocupada ──')
  await c.goto(B + '/my-services', { waitUntil: 'networkidle0' }); await espera(2500)
  ok(/Confirmad[ao]/.test(await texto(c)), 'en «Mis servicios» la cita sale Confirmada')
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
  await otra.evaluate(f => { const d = new Date(f + 'T12:00:00'); const o = [...document.querySelectorAll('[aria-label="Elige un día"] button')].find(x => (x.getAttribute('aria-label') || '').startsWith(d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) + ':')); o?.click() }, fechaCita)
  await espera(1000)
  const estadoHora = await otra.evaluate(h => [...document.querySelectorAll('button[data-state]')].find(x => x.textContent.trim() === h)?.getAttribute('aria-label'), conCita.cita_hora)
  ok(/ocupada/.test(estadoHora || ''), `otra persona ve esa hora ocupada en su agenda (${estadoHora})`)
  await otra.close()

  // Una cita futura ya no se puede dar por hecha (2026-09-30): se da por
  // pasada moviéndola a ayer en este móvil; la valoración sigue su camino real.
  await c.goto(B + '/my-services', { waitUntil: 'networkidle0' }); await espera(1200)
  ok(!(await c.evaluate(() => /Marcar como hecho/.test(document.body.innerText))), 'una cita por venir no se puede marcar como hecha')
  await c.evaluate(() => { const ayer = new Date(Date.now() - 864e5).toISOString().slice(0, 10); const s = JSON.parse(localStorage.getItem('nura_services') || '[]'); localStorage.setItem('nura_services', JSON.stringify(s.map(x => ({ ...x, date: ayer })))) })
  await c.goto(B + '/my-services', { waitUntil: 'networkidle0' }); await espera(1200)
  ok(await pulsar(c, 'Marcar como hecho y valorar'), 'pasada la cita, en «Mis servicios» se puede marcar hecha y valorar')
  await pulsar(c, 'Sí'); await pulsar(c, 'Paciente')
  await c.evaluate(() => document.querySelector('[aria-label="5 estrellas"]')?.click())
  await pulsar(c, 'Enviar'); await espera(1500)
  ok(valoraciones.length === 1 && valoraciones[0].helper_id === avisos[0].helper_id && valoraciones[0].volveria === true,
    'la valoración llega al servidor, de la conversación real con ese profesional')

  console.log('\n── Otra cita: el recordatorio del día antes y cancelarla ──')
  await c.goto(B + '/helper/' + conCita.helper_id, { waitUntil: 'networkidle0' }); await espera(1500)
  ok(await pulsar(c, 'Disponibilidad'), 'desde la ficha, «Disponibilidad»')
  await c.evaluate(() => { const d = [...document.querySelectorAll('[aria-label="Elige un día"] button')].find(x => !x.disabled); d?.click() }); await espera(500)
  await c.evaluate(() => { const h = [...document.querySelectorAll('button[data-state]')].find(x => !x.disabled); h?.click() }); await espera(300)
  const antes = avisos.length
  ok(await pulsar(c, 'Enviar solicitud'), 'pide otra cita')
  await espera(1200)
  const segunda = avisos.slice(antes).find(a => a.cita_estado === 'propuesta')
  ok(Boolean(segunda), 'la segunda propuesta llega con su día y su hora')
  const pro3 = await pagina()
  await pro3.goto(B + '/r/' + segunda.token, { waitUntil: 'networkidle0' }); await espera(1000)
  await pulsar(pro3, 'Aceptar la cita'); await espera(800)
  ok(segunda.cita_estado === 'aceptada', 'el profesional la acepta')
  const fN = segunda.cita_fecha, hN = segunda.cita_hora
  await c.bringToFront()
  await c.goto(B + '/my-services', { waitUntil: 'networkidle0' }); await espera(2500)
  // El reloj de este navegador se adelanta a 2 horas antes de la cita: así
  // se ve el recordatorio sin esperar al día de antes (los datos, intactos).
  const adelanto = new Date(`${fN}T${hN}:00`).getTime() - 2 * 3600e3 - Date.now()
  await c.evaluateOnNewDocument(ms => {
    const D = Date
    class Reloj extends D { constructor(...a) { if (a.length) super(...a); else super(D.now() + ms) } static now() { return D.now() + ms } }
    window.Date = Reloj
  }, adelanto)
  await c.goto(B + '/', { waitUntil: 'networkidle0' }); await espera(2000)
  const aviso = await texto(c)
  ok(/Tu cita/.test(aviso) && new RegExp(`(Hoy|Mañana) a las ${hN}`).test(aviso) && /con Laura/.test(aviso), `en Inicio sale el recordatorio: «${(aviso.match(/(Hoy|Mañana) a las \d\d:\d\d/) || [''])[0]}», con Laura`)
  // El recordatorio de Inicio es un atajo: se cancela en «Mis servicios».
  ok(await pulsar(c, 'Tu cita con Laura') && c.url().includes('/my-services'), 'el recordatorio lleva a «Mis servicios»')
  await espera(1200)
  ok(await pulsar(c, 'Cancelar la cita'), 'pulsa «Cancelar la cita»')
  ok(/¿Cancelar la cita\?/.test(await texto(c)) && segunda.cita_estado === 'aceptada', 'pide confirmación antes de cancelar nada')
  ok(await pulsar(c, 'Sí, cancelar'), 'confirma')
  await espera(800)
  ok(segunda.cita_estado === 'cancelada', 'la cita queda cancelada en el servidor')
  await c.goto(B + '/', { waitUntil: 'networkidle0' }); await espera(1500)
  ok(!/Tu cita/.test(await texto(c)), 'y el recordatorio desaparece de Inicio')
  await c.goto(B + '/my-services', { waitUntil: 'networkidle0' }); await espera(1500)
  ok(/Cancelad[ao]/.test(await texto(c)), 'en «Mis servicios» sale Cancelado')
  const pro4 = await pagina()
  await pro4.goto(B + '/r/' + segunda.token, { waitUntil: 'networkidle0' }); await espera(1000)
  ok(/Cita cancelada/.test(await texto(pro4)) && /vuelve a estar libre/.test(await texto(pro4)), 'el profesional ve en su enlace que se ha cancelado')
  await pro4.close(); await pro3.close()
  ok(!backend({ op: 'ocupadas', helperId: segunda.helper_id }).ocupadas.some(o => o.fecha === fN && o.hora === hN), 'y esa hora ya no sale ocupada para nadie')

  console.log('\n── Una búsqueda que no se entiende ──')
  const nueva = await pagina(await b.createBrowserContext())
  await nueva.goto(B + '/', { waitUntil: 'networkidle0' }); await espera(1200)
  const antesNo = eventos.length
  await nueva.type('textarea, input', 'zxcv qwerty asdf'); await nueva.keyboard.press('Enter')
  await espera(5000)
  ok(/con otras palabras|corre prisa/.test(await texto(nueva)), 'pide que lo cuente con otras palabras')
  const suyos = eventos.slice(antesNo)
  ok(suyos.filter(e => e.tipo === 'busqueda').length === 1 && suyos.find(e => e.tipo === 'busqueda')?.categoria === 'otro',
    'se cuenta como UNA búsqueda no entendida (categoría «otro»)')
  ok(!JSON.stringify(suyos).includes('qwerty'), 'sin la frase')
  // En la base simulada solo hay una logopeda: un fontanero no lo hay.
  const antesSin = eventos.length
  await nueva.type('textarea, input', 'necesito un fontanero, gotea el grifo'); await nueva.keyboard.press('Enter')
  await espera(5000)
  const sin = eventos.slice(antesSin)
  ok(sin.filter(e => e.tipo === 'busqueda').length === 1 && sin.find(e => e.tipo === 'busqueda')?.resultados === 0,
    'una búsqueda sin nadie también cuenta UNA búsqueda (con 0 resultados)')
  ok(sin.some(e => e.tipo === 'sin_cobertura' && e.oficio === 'fontanero'), 'y deja su demanda: oficio «fontanero»')
  await nueva.close()

  console.log('\n── Al darse de alta: quién le busca, y oficios que ya existen ──')
  const darseDeAlta = async (nombre, especialidad) => {
    const p = await pagina(await b.createBrowserContext())
    await p.goto(B + '/register-helper', { waitUntil: 'networkidle0' }); await espera(1500)
    for (const r of [nombre, especialidad]) { await p.type('input', r); await p.keyboard.press('Enter'); await espera(2500) }
    await espera(1500)
    return p
  }
  const fon = await darseDeAlta('Pedro Sanz', 'Fontanero')
  ok(/una persona buscó técnico|buscó fontanero|buscaron fontanero/.test(await texto(fon)) && /Te estaban esperando/.test(await texto(fon)),
    'un fontanero se entera de que alguien lo buscó sin encontrar a nadie')
  ok(/formación/.test(await texto(fon)), 'y sigue con la pregunta siguiente')
  await fon.close()
  // Existe una técnica de electrodomésticos; de electrónica no hay nadie ni lo ha buscado nadie.
  BD.push({ id: 7002, name: 'Rosa Martí Gil', specialty: 'Técnico de electrodomésticos', category: 'tecnico', zone: 'Sants',
    bio: 'Lavadoras y neveras.', rating: 4.7, reviews: 5, services: 9, available: true, presential: true, online: false, verified: true, tags: [] })
  const ele = await darseDeAlta('Luis Pons', 'Técnico de electrónica')
  ok(/Todavía nadie ofrece técnico de electrónica en Nüra y nadie lo ha buscado/.test(await texto(ele)), 'si su profesión no existe y nadie la busca, se le dice')
  ok(!/formación/.test(await texto(ele)), 'y espera a que elija antes de seguir')
  ok(await pulsar(ele, 'Técnico de electrodomésticos'), 'le recomienda una que sí existe y puede elegirla')
  await espera(1500)
  const t2 = await texto(ele)
  ok(/formación/.test(t2) && /Mantener/.test(t2) === false, 'al elegirla sigue el alta, con esa especialidad')
  await ele.close()
  const tar = await darseDeAlta('Ana Ruiz', 'Tarotista')
  ok(/Todavía no conozco «Tarotista» en Nüra/.test(await texto(tar)), 'una profesión que no reconoce: se lo dice y le deja escribirla de otra forma')
  ok(await pulsar(tar, 'Mantener «Tarotista»'), 'o quedarse con la suya')
  await espera(1500)
  ok(/formación/.test(await texto(tar)), 'y el alta sigue')
  await tar.close()

  console.log('\n── El profesional abre una propuesta cuya hora ya pasó ──')
  {
    // 2026-09-30: antes seguía el botón «Aceptar la cita» para una hora pasada.
    const ayer = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
    const tk = azar()
    avisos.push({ helper_id: '7001', mensaje: 'Hola Laura, ¿podrías ver a mi hijo?', token: tk, lectura_hash: sha(azar()), respuesta: null, cita_fecha: ayer, cita_hora: '10:00', cita_estado: 'propuesta' })
    const pro = await pagina()
    await pro.goto(B + '/r/' + tk, { waitUntil: 'networkidle0' }); await espera(1000)
    const t = await texto(pro)
    ok(/Esa hora ya pasó/.test(t) && !/Aceptar la cita/.test(t), 'dice que esa hora ya pasó y no deja aceptarla')
    ok(await pulsar(pro, 'Proponer otro día'), 'ofrece proponer otro día')
    await pro.type('#respuesta', 'el lunes a las 17:00?')
    await pulsar(pro, 'Enviar respuesta'); await espera(800)
    const av = avisos.find(a => a.token === tk)
    ok(av.respuesta && av.cita_estado === 'rechazada', `la respuesta llega y la cita queda como «no le va» (${av.cita_estado})`)
    await pro.close()
  }

  console.log('\n── Al confirmar el correo, vuelve a Nüra ya dentro ──')
  {
    // 2026-09-30: antes veía la pantalla de invitado y tenía que entrar otra vez.
    const ctx = await b.createBrowserContext()
    const pro = await pagina(ctx)
    await pro.goto(B + '/', { waitUntil: 'networkidle0' })
    await pro.evaluate(() => localStorage.clear())
    const exp = Math.floor(Date.now() / 1000) + 3600
    await pro.goto(`${B}/profile#access_token=sesion-pro&refresh_token=r1&expires_in=3600&expires_at=${exp}&token_type=bearer&type=signup`, { waitUntil: 'networkidle0' })
    await espera(2500)
    const u1 = await pro.evaluate(() => JSON.parse(localStorage.getItem('nura_user') || 'null'))
    ok(u1?.isHelper === true && String(u1?.helperId) === '7001', `el profesional queda dentro con su ficha (${u1 ? u1.name + ' · ' + u1.helperId : 'nadie'})`)
    ok(/Ya tienes tu acceso/.test(await texto(pro)), 'y Nüra se lo dice')
    // Cerrar sesión: no vuelve a entrar solo.
    await pulsar(pro, 'Cerrar sesión'); await pulsar(pro, 'Toca otra vez para cerrar sesión')
    await pro.goto(B + '/profile', { waitUntil: 'networkidle0' }); await espera(1500)
    ok(!(await pro.evaluate(() => localStorage.getItem('nura_user') && JSON.parse(localStorage.getItem('nura_user')))), 'al cerrar sesión no vuelve a entrar solo')
    await pro.close(); await ctx.close()

    const ctx2 = await b.createBrowserContext()
    const cli = await pagina(ctx2)
    await cli.goto(`${B}/profile#access_token=sesion-cliente&refresh_token=r2&expires_in=3600&expires_at=${exp}&token_type=bearer&type=signup`, { waitUntil: 'networkidle0' })
    await espera(2500)
    const u2 = await cli.evaluate(() => JSON.parse(localStorage.getItem('nura_user') || 'null'))
    ok(u2 && u2.isHelper === false && u2.name === 'cliente', `sin ficha, entra como quien busca ayuda (${u2 ? u2.name : 'nadie'})`)
    await cli.close(); await ctx2.close()

    // Una profesional que dio un teléfono crea el acceso desde su mensaje:
    // al volver del correo, NO entra como cliente y se le explica.
    const ctx3 = await b.createBrowserContext()
    const tel = await pagina(ctx3)
    await tel.goto(B + '/', { waitUntil: 'networkidle0' })
    await tel.evaluate(() => { localStorage.clear(); localStorage.setItem('nura_acceso_pro', '1') })
    await tel.goto(`${B}/profile#access_token=sesion-telefono&refresh_token=r4&expires_in=3600&expires_at=${exp}&token_type=bearer&type=signup`, { waitUntil: 'networkidle0' })
    await espera(2500)
    const t3 = await texto(tel)
    const e3 = await tel.evaluate(() => ({ user: localStorage.getItem('nura_user'), sesion: localStorage.getItem('nura_sesion') }))
    ok(/\/entrar/.test(tel.url()) && /tu ficha no tiene este correo/.test(t3) && (!e3.user || e3.user === 'null') && !e3.sesion,
      'profesional sin correo en su ficha: no entra como cliente, se le explica y la sesión se cierra')
    // Y si entra con correo y contraseña desde un mensaje (pro=1): lo mismo.
    await tel.goto(B + '/entrar?pro=1&volver=/chats', { waitUntil: 'networkidle0' }); await espera(800)
    await tel.type('#e-email', 'otra@ficticia.test')
    await tel.type('input[type="password"]', 'contrasena-ficticia')
    await pulsar(tel, 'Entrar'); await espera(2000)
    const e4 = await tel.evaluate(() => ({ user: localStorage.getItem('nura_user'), sesion: localStorage.getItem('nura_sesion') }))
    ok(/tu ficha no tiene este correo/.test(await texto(tel)) && (!e4.user || e4.user === 'null') && !e4.sesion && /\/entrar/.test(tel.url()),
      'al entrar desde un mensaje sin ficha con ese correo: tampoco entra como cliente')
    await tel.close(); await ctx3.close()
  }

  console.log('\n── Con mala conexión: reintentar de verdad y no perder lo escrito ──')
  {
    // 2026-10-01: decía «cuando vuelvas, lo intento otra vez» y no lo hacía;
    // un servidor lento salía como «sin conexión»; el borrador se perdía.
    const respuesta = p => p.evaluate(() => (document.querySelector('section[aria-label="Respuesta de Nüra"]')?.innerText || '').replace(/\s+/g, ' '))
    const buscar = async (p, t) => {
      const c = await p.evaluate(() => { const i = [...document.querySelectorAll('textarea,input')].find(x => x.checkVisibility() && x.getBoundingClientRect().width > 100); const r = i.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
      await p.mouse.click(c.x, c.y); await p.keyboard.type(t); await p.keyboard.press('Enter')
    }
    // Un servidor de mentira que de verdad no contesta mientras no hay red.
    const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
    const red = { cortada: false }
    const ctx = await b.createBrowserContext()
    const p = await ctx.newPage()
    await p.setViewport({ width: 390, height: 844 })
    await p.setRequestInterception(true)
    p.on('request', r => {
      const u = r.url()
      if (u.startsWith(B)) return r.continue()
      if (red.cortada) return r.abort('internetdisconnected')
      if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: H })
      return r.respond({ status: 200, headers: H, contentType: 'application/json',
        body: u.includes('/rest/v1/helpers') ? JSON.stringify(BD) : JSON.stringify(u.includes('funcion.ficticia') ? backend(JSON.parse(r.postData() || '{}')) : []) })
    })
    await p.goto(B + '/', { waitUntil: 'networkidle0' }); await espera(1500)
    red.cortada = true
    await p.setOfflineMode(true)
    await buscar(p, 'necesito una logopeda para mi hijo')
    await espera(4000)
    const sin = await respuesta(p)
    ok(/te has quedado sin conexión/.test(sin) && /Buscar otra vez/.test(sin), 'sin conexión: lo dice y ofrece «Buscar otra vez»')
    red.cortada = false
    await p.setOfflineMode(false)
    await espera(6000)
    ok(/Laura/.test(await respuesta(p)), 'al volver la conexión, busca sola y encuentra a Laura')
    await p.close(); await ctx.close()

    // Servidor lento (más que el tiempo máximo): no es «sin conexión».
    const ctx2 = await b.createBrowserContext()
    const q = await ctx2.newPage()
    await q.setViewport({ width: 390, height: 844 })
    await q.setRequestInterception(true)
    q.on('request', async r => {
      const u = r.url()
      if (u.startsWith(B)) return r.continue()
      if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: H })
      if (u.includes('/rest/v1/helpers')) await espera(11000)
      try { await r.respond({ status: 200, headers: H, contentType: 'application/json', body: u.includes('funcion.ficticia') ? '{"ok":true}' : '[]' }) } catch { /* ya cancelada */ }
    })
    await q.goto(B + '/', { waitUntil: 'domcontentloaded' }); await espera(2000)
    await buscar(q, 'necesito una logopeda para mi hijo')
    await espera(16000)
    const lenta = await respuesta(q)
    ok(!/sin conexión/.test(lenta) && /tardando más de lo normal|No he podido completar/.test(lenta), `servidor lento: no dice «sin conexión» (${lenta.slice(-90)})`)
    await q.close(); await ctx2.close()

    // Lo que escribe a un profesional sobrevive a cerrar la app.
    const ctx3 = await b.createBrowserContext()
    const c = await pagina(ctx3)
    await c.goto(B + '/chat/7001', { waitUntil: 'networkidle0' }); await espera(1500)
    // Borra la propuesta y escribe lo suyo.
    await c.$eval(CAMPO, i => i.select()); await c.click(CAMPO); await c.$eval(CAMPO, i => i.select()); await c.keyboard.press('Backspace')
    await c.type(CAMPO, 'Hola Laura, mi hijo tiene 5 años y')
    await espera(500)
    await c.reload({ waitUntil: 'networkidle0' }); await espera(1500)
    ok(await c.$eval(CAMPO, i => i.value) === 'Hola Laura, mi hijo tiene 5 años y', 'el borrador sigue ahí al volver a abrir el chat')
    await c.click(ENVIAR); await espera(1500)
    await c.reload({ waitUntil: 'networkidle0' }); await espera(1500)
    ok(!/mi hijo tiene 5 años y$/.test(await c.$eval(CAMPO, i => i.value)), 'y una vez enviado, ya no se guarda')
    await c.close(); await ctx3.close()
  }

  console.log('\n── Editar mi ficha: «solo online» de verdad ──')
  {
    // 2026-10-01: elegir «Online» solo cambiaba `online`; seguía presencial.
    const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS' }
    const cambios = []
    const ctx = await b.createBrowserContext()
    const f = await ctx.newPage()
    await f.setViewport({ width: 390, height: 844 })
    await f.setRequestInterception(true)
    f.on('request', r => {
      const u = r.url()
      if (u.startsWith(B)) return r.continue()
      if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: H })
      if (u.includes('/rest/v1/helpers') && r.method() === 'PATCH') {
        cambios.push(JSON.parse(r.postData() || '{}'))
        return r.respond({ status: 200, headers: H, contentType: 'application/json', body: '[{"id":7001}]' })
      }
      if (u.includes('/auth/v1/user')) return r.respond({ status: 200, headers: H, contentType: 'application/json', body: JSON.stringify({ id: 'u-pro', aud: 'authenticated', role: 'authenticated', email: 'laura@ficticia.test' }) })
      return r.respond({ status: 200, headers: H, contentType: 'application/json', body: u.includes('funcion.ficticia') ? '{"ok":true,"avisos":[]}' : '[]' })
    })
    await f.goto(B + '/', { waitUntil: 'networkidle0' })
    await f.evaluate(exp => {
      localStorage.clear()
      localStorage.setItem('nura_user', JSON.stringify({ name: 'Laura Vidal Soler', isHelper: true, helperId: 7001, joined: new Date().toISOString(),
        helperProfile: { specialty: 'Logopeda infantil', zone: 'Barcelona, Gràcia', ciudad: 'Barcelona', price: '45 €', contacto: 'laura@ficticia.test', modality: 'Presencial',
          horario: { dias: [1, 2, 3, 4, 5], horas: ['10:00', '17:00'] } } }))
      localStorage.setItem('nura_sesion', JSON.stringify({ access_token: 'sesion-pro', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: exp,
        user: { id: 'u-pro', aud: 'authenticated', role: 'authenticated', email: 'laura@ficticia.test' } }))
    }, Math.floor(Date.now() / 1000) + 3600)
    await f.goto(B + '/profile', { waitUntil: 'networkidle0' }); await espera(1500)
    await pulsar(f, 'Editar mi ficha'); await espera(1200)
    const elegido = await f.evaluate(() => { const b = [...document.querySelectorAll('[role="dialog"] button')].find(x => x.textContent.trim() === 'Online'); b?.click(); return !!b })
    await espera(400)
    await pulsar(f, 'Guardar cambios'); await espera(2500)
    const ultimo = cambios.at(-1) || {}
    ok(elegido && ultimo.online === true && ultimo.presential === false, `al elegir «Online», la ficha deja de ser presencial (${JSON.stringify({ online: ultimo.online, presential: ultimo.presential })})`)
    await f.close(); await ctx.close()
  }

  console.log('\n── La foto del profesional: cambiarla y quitarla ──')
  {
    // 2026-10-01: «Cambiar foto» sobrescribía (y el almacén no deja) y no
    // había forma de quitarla. Ahora cada foto lleva su nombre y el servidor
    // borra las viejas; quitarla deja la ficha sin foto y borra la carpeta.
    const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, OPTIONS' }
    const subidas = [], cambios = [], limpiezas = []
    const ctx = await b.createBrowserContext()
    const f = await ctx.newPage()
    await f.setViewport({ width: 390, height: 844 })
    await f.setRequestInterception(true)
    f.on('request', r => {
      const u = r.url()
      if (u.startsWith(B)) return r.continue()
      if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: H })
      const json = (body, status = 200) => r.respond({ status, headers: H, contentType: 'application/json', body: JSON.stringify(body) })
      if (u.includes('/storage/v1/object/fotos/')) { subidas.push({ ruta: decodeURIComponent(u.split('/storage/v1/object/fotos/')[1]), upsert: r.headers()['x-upsert'] }); return json({ Key: 'fotos/x' }) }
      if (u.includes('/rest/v1/helpers') && r.method() === 'PATCH') { cambios.push(JSON.parse(r.postData() || '{}')); return json([{ id: 7001 }]) }
      if (u.includes('/auth/v1/user')) return json({ id: 'u-pro', aud: 'authenticated', role: 'authenticated', email: 'laura@ficticia.test' })
      if (u.includes('funcion.ficticia')) {
        const c = JSON.parse(r.postData() || '{}')
        if (c.op === 'limpiar-fotos') limpiezas.push(c)
        return json({ ok: true, avisos: [] })
      }
      return json([])
    })
    await f.goto(B + '/', { waitUntil: 'networkidle0' })
    await f.evaluate(exp => {
      localStorage.clear()
      localStorage.setItem('nura_user', JSON.stringify({ name: 'Laura Vidal Soler', isHelper: true, helperId: 7001, joined: new Date().toISOString(),
        avatar: 'https://x.supabase.co/storage/v1/object/public/fotos/u-pro/perfil-1.jpg',
        helperProfile: { specialty: 'Logopeda infantil', zone: 'Barcelona, Gràcia', ciudad: 'Barcelona', price: '45 €', contacto: 'laura@ficticia.test', modality: 'Presencial' } }))
      localStorage.setItem('nura_sesion', JSON.stringify({ access_token: 'sesion-pro', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: exp,
        user: { id: 'u-pro', aud: 'authenticated', role: 'authenticated', email: 'laura@ficticia.test' } }))
    }, Math.floor(Date.now() / 1000) + 3600)
    await f.goto(B + '/profile', { waitUntil: 'networkidle0' }); await espera(1500)
    // Cambiar: una imagen de 2×2 píxeles, elegida como desde la galería.
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64')
    const { writeFileSync } = await import('node:fs')
    writeFileSync('/tmp/nura-foto-prueba.png', png)
    const [elegir] = await Promise.all([f.waitForFileChooser({ timeout: 5000 }), pulsar(f, 'Cambiar foto')])
    await elegir.accept(['/tmp/nura-foto-prueba.png']); await espera(1200)
    await pulsar(f, 'Usar esta foto'); await espera(2000)
    const nueva = subidas.at(-1)?.ruta || ''
    ok(/^u-pro\/perfil-\d+\.jpg$/.test(nueva) && subidas.at(-1)?.upsert !== 'true', `la foto nueva se sube con su propio nombre, sin sobrescribir (${nueva})`)
    ok(String(cambios.at(-1)?.avatarUrl || '').includes(nueva) && limpiezas.at(-1)?.conservar === nueva && limpiezas.at(-1)?.token === 'sesion-pro',
      'la ficha apunta a la nueva y el servidor borra las anteriores')
    // Quitar: pide confirmación y deja la ficha sin foto.
    await pulsar(f, 'Quitar')
    ok(/¿Quitar tu foto\?/.test(await texto(f)) && !cambios.some(c => c.avatarUrl === null), 'quitar la foto pide confirmación antes')
    await pulsar(f, 'Sí, quitarla'); await espera(1500)
    ok(cambios.at(-1)?.avatarUrl === null && limpiezas.at(-1)?.conservar === '' && /Añade tu foto/.test(await texto(f)),
      'al confirmarlo, la ficha queda sin foto y se borran todas las suyas')
    await f.close(); await ctx.close()
  }

  console.log('\n── Correo y móvil, los dos confirmados ──')
  {
    // 2026-10-01 (Sergio): cada cuenta con correo y móvil; ningún cambio
    // se aplica sin confirmarlo (enlace al correo nuevo, código por SMS).
    const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS' }
    const cuenta = { id: 'u-cli', aud: 'authenticated', role: 'authenticated', email: 'ana@ficticia.test', email_confirmed_at: '2026-09-01T00:00:00Z', phone: '' }
    const pedidos = []
    let smsRoto = true
    // NURA_CAPTURAS=carpeta: guarda capturas de cada paso (para enseñarlas).
    const captura = async (pg, n) => { if (process.env.NURA_CAPTURAS) { await pg.evaluate(() => document.querySelector('#acceso-codigo, #acceso-correo, #acceso-movil')?.scrollIntoView({ block: 'center' }) || [...document.querySelectorAll('h2')].find(h => /Tu acceso/.test(h.textContent))?.scrollIntoView({ block: 'start' })); await espera(300); await pg.screenshot({ path: `${process.env.NURA_CAPTURAS}/${n}.png` }) } }
    const sesion = u => ({ access_token: 'sesion-cli', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r9', user: u })
    const ctx = await b.createBrowserContext()
    const f = await ctx.newPage()
    await f.setViewport({ width: 390, height: 844 })
    await f.setRequestInterception(true)
    const manejar = r => {
      const u = r.url()
      if (u.startsWith(B)) return r.continue()
      if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: H })
      const cuerpo = JSON.parse(r.postData() || '{}')
      const json = (status, body) => r.respond({ status, headers: H, contentType: 'application/json', body: JSON.stringify(body) })
      if (u.includes('/auth/v1/user') && r.method() === 'PUT') {
        pedidos.push(cuerpo)
        if (cuerpo.phone && smsRoto) return json(422, { code: 422, error_code: 'sms_send_failed', msg: 'Unsupported phone provider' })
        if (cuerpo.phone) return json(200, { ...cuenta, new_phone: cuerpo.phone.replace('+', '') })
        if (cuerpo.email) return json(200, { ...cuenta, new_email: cuerpo.email })
        return json(200, cuenta)
      }
      if (u.includes('/auth/v1/user')) return json(200, cuenta)
      if (u.includes('/auth/v1/verify')) {
        pedidos.push(cuerpo)
        if (cuerpo.token !== '123456') return json(403, { code: 403, error_code: 'otp_expired', msg: 'Token has expired or is invalid' })
        if (cuerpo.type === 'phone_change') { cuenta.phone = cuerpo.phone.replace('+', ''); cuenta.phone_confirmed_at = new Date().toISOString() }
        return json(200, sesion(cuenta))
      }
      if (u.includes('/auth/v1/otp')) { pedidos.push(cuerpo); return json(200, {}) }
      if (u.includes('/auth/v1/token')) { pedidos.push(cuerpo); return json(200, sesion(cuenta)) }
      return json(200, u.includes('funcion.ficticia') ? { ok: true } : [])
    }
    f.on('request', manejar)
    await f.goto(B + '/', { waitUntil: 'networkidle0' })
    await f.evaluate(ses => {
      localStorage.clear()
      localStorage.setItem('nura_user', JSON.stringify({ name: 'Ana', email: 'ana@ficticia.test', joined: new Date().toISOString() }))
      localStorage.setItem('nura_sesion', JSON.stringify(ses))
    }, sesion(cuenta))
    await f.goto(B + '/profile', { waitUntil: 'networkidle0' }); await espera(1500)
    let t = await texto(f)
    ok(/Tu acceso/.test(t) && /ana@ficticia\.test/.test(t) && /Añade tu móvil/.test(t), 'quien busca ayuda con cuenta ve «Tu acceso»: su correo y «Añade tu móvil»')
    await captura(f, 'acceso-1-sin-movil')
    const escribirCampo = async (sel, v) => { await f.$eval(sel, i => i.select?.()); await f.type(sel, v) }
    // Sin proveedor de SMS: se dice claro y no se guarda nada.
    await pulsar(f, 'Añadir'); await escribirCampo('#acceso-movil', '612 34 56 78'); await pulsar(f, 'Enviarme el código')
    t = await texto(f)
    ok(/Todavía no podemos enviar SMS/.test(t) && !/Confirmado por SMS/.test(t), 'sin SMS configurado, lo dice y no guarda el móvil')
    smsRoto = false
    await pulsar(f, 'Enviarme el código')
    t = await texto(f)
    await captura(f, 'acceso-2-codigo')
    ok(pedidos.some(x => x.phone === '+34612345678') && /código que te hemos enviado por SMS al \+34 612 34 56 78/.test(t), 'pide el código para +34 612 34 56 78 (formato internacional)')
    await escribirCampo('#acceso-codigo', '000000'); await pulsar(f, 'Confirmar mi móvil')
    t = await texto(f)
    ok(/El código no es correcto o ha caducado/.test(t) && !/Confirmado por SMS/.test(t), 'con un código equivocado, no se confirma')
    await f.$eval('#acceso-codigo', i => { i.value = '' }); await f.click('#acceso-codigo', { clickCount: 3 }); await f.keyboard.press('Backspace')
    for (let i = 0; i < 6; i++) await f.keyboard.press('Backspace')
    await f.type('#acceso-codigo', '123456'); await pulsar(f, 'Confirmar mi móvil'); await espera(600)
    t = await texto(f)
    ok(pedidos.some(x => x.type === 'phone_change' && x.token === '123456') && /\+34 612 34 56 78/.test(t) && /Móvil confirmado/.test(t), 'con el código bueno, el móvil queda confirmado')
    // Cambiar el correo: el enlace va al nuevo y, hasta pulsarlo, sigue el de antes.
    await pulsar(f, 'Cambiar'); await escribirCampo('#acceso-correo', 'ana.nueva@ficticia.test'); await pulsar(f, 'Enviarme el enlace')
    t = await texto(f)
    await f.evaluate(() => [...document.querySelectorAll('h2')].find(h => /Tu acceso/.test(h.textContent))?.scrollIntoView({ block: 'start' }))
    if (process.env.NURA_CAPTURAS) { await espera(300); await f.screenshot({ path: `${process.env.NURA_CAPTURAS}/acceso-3-confirmado.png` }) }
    ok(pedidos.some(x => x.email === 'ana.nueva@ficticia.test') && /enlace a ana\.nueva@ficticia\.test\. Tu correo no cambia hasta que lo pulses/.test(t) && /ana@ficticia\.test/.test(t), 'cambiar el correo manda un enlace y no cambia hasta confirmarlo')
    // Entrar con el móvil y la contraseña.
    const g = await ctx.newPage(); await g.setViewport({ width: 390, height: 844 }); await g.setRequestInterception(true)
    g.on('request', manejar)
    await g.goto(B + '/', { waitUntil: 'networkidle0' }); await g.evaluate(() => localStorage.clear())
    await g.goto(B + '/entrar', { waitUntil: 'networkidle0' }); await espera(800)
    await g.type('#e-email', '612 34 56 78'); await g.type('#e-pass', 'contrasena-de-prueba')
    await g.evaluate(() => [...document.querySelectorAll('button[type="submit"]')].find(x => x.offsetParent)?.click()); await espera(2000)
    ok(pedidos.some(x => x.phone === '+34612345678' && x.password === 'contrasena-de-prueba'), 'se puede entrar con el móvil y la contraseña')
    // Sin acceso al correo: código por SMS y contraseña nueva.
    await g.evaluate(() => localStorage.clear())
    await g.goto(B + '/entrar', { waitUntil: 'networkidle0' }); await espera(800)
    await g.evaluate(() => [...document.querySelectorAll('button')].find(x => /olvidado tu contraseña/.test(x.textContent))?.click()); await espera(400)
    await g.type('#e-email', '612345678')
    await g.evaluate(() => [...document.querySelectorAll('button[type="submit"]')].find(x => x.offsetParent)?.click()); await espera(1200)
    if (process.env.NURA_CAPTURAS) await g.screenshot({ path: `${process.env.NURA_CAPTURAS}/acceso-4-recuperar.png` })
    ok(pedidos.some(x => x.phone === '+34612345678' && x.create_user === false), 'olvidé la contraseña con el móvil: pide un código, sin crear cuentas')
    await g.type('#e-codigo', '123456')
    await g.evaluate(() => [...document.querySelectorAll('button[type="submit"]')].find(x => x.offsetParent)?.click()); await espera(1500)
    ok(new URL(g.url()).pathname === '/restablecer', 'con el código, a poner una contraseña nueva (' + new URL(g.url()).pathname + ')')
    await g.close(); await f.close(); await ctx.close()
  }
} catch (e) {
  ok(false, 'el recorrido se ha roto: ' + e.message)
} finally {
  ok(!errores.length, 'sin errores de JavaScript' + (errores.length ? ': ' + errores[0] : ''))
  await b.close(); apagar()
}

console.log(`\n${fallos ? '❌' : '✅'} RECORRIDO REAL ${fallos ? `CON ${fallos} FALLO(S)` : 'COMPLETO'}\n`)
process.exit(fallos ? 1 : 0)
