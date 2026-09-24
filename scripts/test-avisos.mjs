// ── Nüra · pruebas de seguridad de los avisos ───────────────────────────
//
//   npm run test:avisos
//
// Ejecuta la funcion REAL (supabase/functions/helpers-write/index.ts) en
// Node, con una base de datos FICTICIA en memoria que imita a PostgREST.
// No toca Supabase, no lee mensajes reales y no envia nada a nadie.
// Tambien lanza `scripts/avisar.mjs` contra la funcion servida en local.
//
// Requiere Node 22.18+ (ejecuta TypeScript quitando los tipos).

import http from 'node:http'
import { spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const FUNCION = pathToFileURL(join(root, 'supabase/functions/helpers-write/index.ts')).href
const SUPA = 'https://ficticio.supabase.test'
const ORIGEN = 'https://nura.ficticia.test'
const SECRETO = 'a'.repeat(8) + '-secreto-de-prueba-ficticio-0123456789'

let fallos = 0
let pasadas = 0
function ok(cond, texto) {
  if (cond) { pasadas++; console.log('✓ ' + texto) }
  else { fallos++; console.log('✗ ' + texto) }
}

// ── la base de datos ficticia ───────────────────────────────────────────
const db = { helpers: [], avisos: [] }
const peticionesBD = []   // todo lo que la funcion le pide a "Supabase"

function coincide(fila, campo, cond) {
  const v = fila[campo]
  if (cond === 'is.null') return v === null || v === undefined
  if (cond === 'not.is.null') return v !== null && v !== undefined
  if (cond.startsWith('eq.')) return String(v) === cond.slice(3)
  if (cond.startsWith('ilike.')) return String(v ?? '').toLowerCase() === cond.slice(6).toLowerCase()
  if (cond.startsWith('in.(')) return cond.slice(4, -1).split(',').includes(String(v))
  throw new Error('filtro no soportado: ' + cond)
}

async function postgrest(url, init = {}) {
  const u = new URL(url)
  const metodo = init.method || 'GET'
  peticionesBD.push({ url, metodo, cuerpo: init.body ?? '', cabeceras: JSON.stringify(init.headers ?? {}) })
  const tabla = u.pathname.replace('/rest/v1/', '')
  if (!db[tabla]) return new Response('[]', { status: 404 })
  const filtros = [...u.searchParams].filter(([k]) => !['select', 'order', 'limit'].includes(k))
  const cumplen = db[tabla].filter(f => filtros.every(([k, c]) => coincide(f, k, c)))
  const elegir = (f) => {
    const sel = u.searchParams.get('select')
    if (!sel || sel === '*') return { ...f }
    return Object.fromEntries(sel.split(',').map(c => [c, f[c] ?? null]))
  }
  const quiereFilas = String(init.headers?.Prefer ?? '').includes('representation')
  if (metodo === 'GET') {
    const lim = Number(u.searchParams.get('limit') || Infinity)
    return Response.json(cumplen.slice(0, lim).map(elegir))
  }
  if (metodo === 'POST') {
    const fila = { id: db[tabla].length + 1, fecha: new Date().toISOString(), ...JSON.parse(init.body) }
    db[tabla].push(fila)
    return quiereFilas ? Response.json([fila], { status: 201 }) : new Response(null, { status: 201 })
  }
  if (metodo === 'PATCH') {
    const cambios = JSON.parse(init.body)
    for (const f of cumplen) Object.assign(f, cambios)
    return quiereFilas ? Response.json(cumplen) : new Response(null, { status: 204 })
  }
  if (metodo === 'DELETE') {
    db[tabla] = db[tabla].filter(f => !cumplen.includes(f))
    return new Response(null, { status: 204 })
  }
  return new Response(null, { status: 405 })
}

globalThis.fetch = async (url, init) => {
  if (String(url).startsWith(SUPA)) return postgrest(String(url), init)
  throw new Error('salida de red no permitida en la prueba: ' + url)
}

// ── cargar la funcion con un entorno concreto ───────────────────────────
let version = 0
async function cargarFuncion(env) {
  let manejador
  globalThis.Deno = {
    env: { get: (k) => env[k] },
    serve: (fn) => { manejador = fn },
  }
  await import(FUNCION + '?v=' + (++version))
  return manejador
}

const ENV = {
  SUPABASE_URL: SUPA,
  SUPABASE_SERVICE_ROLE_KEY: 'clave-servicio-ficticia',
  NURA_ORIGINS: ORIGEN,
  NURA_ADMIN_SECRET: SECRETO,
}
const funcion = await cargarFuncion(ENV)

async function llamar(fn, cuerpo, cabeceras = {}) {
  const res = await fn(new Request('https://funcion.test/helpers-write', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGEN, ...cabeceras },
    body: JSON.stringify(cuerpo),
  }))
  const texto = await res.text()
  let datos = null
  try { datos = JSON.parse(texto) } catch { /* no json */ }
  return { estado: res.status, datos, texto }
}
const comoAdmin = { 'x-nura-admin': SECRETO }
const respuestasTexto = []
async function llamarG(fn, cuerpo, cab) { const r = await llamar(fn, cuerpo, cab); respuestasTexto.push(r.texto); return r }

// ── datos ficticios ─────────────────────────────────────────────────────
db.helpers.push({ id: 7, name: 'Profesional Ficticia', contacto: '600000000' })
// Un aviso ANTIGUO, como los que hay en produccion: token de 16 cifras y
// sin llave de lectura. Ya respondido.
db.avisos.push({ id: 900, helper_id: '7', helper_nombre: 'Profesional Ficticia',
  mensaje: 'mensaje antiguo ficticio', estado: 'respondido', token: 'abcdef0123456789',
  respuesta: 'RESPUESTA ANTIGUA', respondido_en: '2026-09-01T00:00:00Z', lectura_hash: null })

console.log('\n── Dos personas escriben a la misma profesional ──')
const a = await llamarG(funcion, { op: 'encolar-aviso', helperId: 7, mensaje: 'Hola, soy la persona A (ficticia)' })
const b = await llamarG(funcion, { op: 'encolar-aviso', helperId: 7, mensaje: 'Hola, soy la persona B (ficticia)' })
ok(a.estado === 200 && /^[0-9a-f]{32}$/.test(a.datos?.lectura ?? ''), 'A recibe su llave de lectura')
ok(b.estado === 200 && /^[0-9a-f]{32}$/.test(b.datos?.lectura ?? ''), 'B recibe su llave de lectura')
ok(a.datos?.lectura !== b.datos?.lectura, 'las llaves de A y B son distintas')
const filaA = db.avisos.find(f => f.mensaje.includes('persona A'))
const filaB = db.avisos.find(f => f.mensaje.includes('persona B'))
ok(!JSON.stringify(db.avisos).includes(a.datos.lectura), 'la llave de lectura NO se guarda tal cual en la base de datos')
ok(filaA.token !== a.datos.lectura && /^[0-9a-f]{32}$/.test(filaA.token), 'la llave del profesional es otra, de 32 cifras')

console.log('\n── Operaciones administrativas ──')
let r = await llamarG(funcion, { op: 'pendientes' })
ok(r.estado === 401, `pendientes sin credencial → 401 (dio ${r.estado}), aunque el origen sea el permitido`)
ok(!r.texto.includes(filaA.token) && !r.texto.includes('600000000'), 'y no deja ver llaves ni contactos')
r = await llamarG(funcion, { op: 'pendientes' }, { 'x-nura-admin': SECRETO + 'x' })
ok(r.estado === 401, `pendientes con secreto incorrecto → 401 (dio ${r.estado})`)
r = await llamarG(funcion, { op: 'pendientes' }, { 'x-nura-admin': SECRETO.slice(0, -1) })
ok(r.estado === 401, `pendientes con secreto casi igual → 401 (dio ${r.estado})`)
r = await llamarG(funcion, { op: 'avisar', helperId: 7, mensaje: 'x' })
ok(r.estado === 401 && !r.texto.includes('600000000'), `avisar sin credencial → 401 y sin contacto (dio ${r.estado})`)
r = await llamarG(funcion, { op: 'avisar', helperId: 7, mensaje: 'x' }, { 'x-nura-admin': 'otro' })
ok(r.estado === 401, `avisar con secreto incorrecto → 401 (dio ${r.estado})`)
r = await llamarG(funcion, { op: 'aviso-enviado', avisoId: filaA.id })
ok(r.estado === 401 && filaA.estado === 'pendiente', `aviso-enviado sin credencial → 401 y no cambia nada (dio ${r.estado})`)
r = await llamarG(funcion, { op: 'aviso-enviado', avisoId: filaA.id }, { 'x-nura-admin': '' })
ok(r.estado === 401, `aviso-enviado con credencial vacia → 401 (dio ${r.estado})`)
r = await llamarG(funcion, { op: 'pendientes' }, { ...comoAdmin, origin: 'https://otra-web.test' })
ok(r.estado === 403, `con secreto pero desde un origen no permitido → 403 (dio ${r.estado})`)

const sinSecreto = await cargarFuncion({ ...ENV, NURA_ADMIN_SECRET: undefined })
r = await llamar(sinSecreto, { op: 'pendientes' }, comoAdmin)
ok(r.estado === 503, `sin secreto configurado, cerrado aunque se mande uno → 503 (dio ${r.estado})`)
r = await llamar(sinSecreto, { op: 'pendientes' }, { 'x-nura-admin': '' })
ok(r.estado === 503, `sin secreto configurado y credencial vacia → 503 (dio ${r.estado})`)
const secretoCorto = await cargarFuncion({ ...ENV, NURA_ADMIN_SECRET: 'corto' })
r = await llamar(secretoCorto, { op: 'avisar', helperId: 7, mensaje: 'x' }, { 'x-nura-admin': 'corto' })
ok(r.estado === 503, `con un secreto demasiado corto, cerrado → 503 (dio ${r.estado})`)

r = await llamarG(funcion, { op: 'pendientes' }, comoAdmin)
ok(r.estado === 200 && r.datos.avisos.length === 2, `pendientes con el secreto correcto → 200 y 2 avisos (dio ${r.estado})`)
ok(r.datos.avisos.every(x => decodeURIComponent(x.enlace ?? '').includes(`${ORIGEN}/r/`)), 'cada aviso trae su enlace de vuelta')
const enlaces = r.datos.avisos.map(x => decodeURIComponent(x.enlace))
ok(enlaces.some(e => e.endsWith('/r/' + filaA.token)) && enlaces.some(e => e.endsWith('/r/' + filaB.token)), 'y el enlace lleva la llave del profesional, no la de lectura')
ok(!r.texto.includes('abcdef0123456789'), 'el aviso antiguo no aparece en pendientes')
ok(!r.texto.includes(a.datos.lectura) && !r.texto.includes(b.datos.lectura), 'pendientes no revela las llaves de lectura')
r = await llamarG(funcion, { op: 'avisar', helperId: 7, mensaje: 'prueba' }, comoAdmin)
ok(r.estado === 200 && r.datos.enlace?.startsWith('https://wa.me/34600000000'), 'avisar con el secreto correcto → 200 con enlace (no se abre)')

console.log('\n── El solicitante no puede hacerse pasar por la profesional ──')
r = await llamarG(funcion, { op: 'abrir-aviso', token: a.datos.lectura })
ok(r.estado === 404, `abrir-aviso con la llave de lectura de A → 404 (dio ${r.estado})`)
r = await llamarG(funcion, { op: 'responder-aviso', token: a.datos.lectura, respuesta: 'suplantacion' })
ok(r.estado === 404, `responder-aviso con la llave de lectura de A → 404 (dio ${r.estado})`)
ok(!JSON.stringify(db.avisos).includes('suplantacion'), 'y no se guarda nada')

console.log('\n── El flujo valido ──')
r = await llamarG(funcion, { op: 'abrir-aviso', token: filaA.token })
ok(r.estado === 200 && r.datos.aviso.mensaje.includes('persona A'), 'la profesional abre el aviso de A con su enlace')
r = await llamarG(funcion, { op: 'responder-aviso', token: filaA.token, respuesta: 'Respuesta para A' })
ok(r.estado === 200, `responde a A → 200 (dio ${r.estado})`)
r = await llamarG(funcion, { op: 'responder-aviso', token: filaB.token, respuesta: 'Respuesta para B' })
ok(r.estado === 200, `responde a B → 200 (dio ${r.estado})`)
r = await llamarG(funcion, { op: 'responder-aviso', token: filaA.token, respuesta: 'reescrita' })
ok(r.estado === 409 && filaA.respuesta === 'Respuesta para A', `una segunda respuesta no reescribe la primera → 409 (dio ${r.estado})`)
r = await llamarG(funcion, { op: 'aviso-enviado', avisoId: filaB.id }, comoAdmin)
ok(r.estado === 200 && filaB.estado === 'enviado', 'aviso-enviado con el secreto correcto funciona')

console.log('\n── Cada una lee solo su respuesta ──')
r = await llamarG(funcion, { op: 'respuestas', llaves: [a.datos.lectura] })
ok(r.estado === 200 && r.datos.respuestas.length === 1 && r.datos.respuestas[0].respuesta === 'Respuesta para A', 'A ve solo la respuesta para A')
ok(r.datos.respuestas[0].llave === a.datos.lectura, 'la respuesta viene ligada a la llave de A')
r = await llamarG(funcion, { op: 'respuestas', llaves: [b.datos.lectura] })
ok(r.datos.respuestas.length === 1 && r.datos.respuestas[0].respuesta === 'Respuesta para B', 'B ve solo la respuesta para B')

console.log('\n── Sin autorizacion no se lee nada ──')
r = await llamarG(funcion, { op: 'respuestas', helperIds: ['7'] })
ok(r.estado === 200 && r.datos.respuestas.length === 0, 'preguntar por la profesional (forma antigua) → nada')
r = await llamarG(funcion, { op: 'respuestas' })
ok(r.datos.respuestas.length === 0, 'sin llaves → nada')
r = await llamarG(funcion, { op: 'respuestas', llaves: ['0'.repeat(32), 'f'.repeat(32)] })
ok(r.datos.respuestas.length === 0, 'con llaves inventadas → nada')
r = await llamarG(funcion, { op: 'respuestas', llaves: [filaA.token] })
ok(r.datos.respuestas.length === 0, 'con la llave del profesional → nada (no sirve para leer)')
r = await llamarG(funcion, { op: 'respuestas', llaves: ['*', ')', '7', 'x,y'] })
ok(r.datos.respuestas.length === 0, 'con llaves mal formadas → nada')
ok(!respuestasTexto.some(t => t.includes('RESPUESTA ANTIGUA')), 'la respuesta del aviso antiguo no sale por ningun sitio')
r = await llamarG(funcion, { op: 'abrir-aviso', token: 'abcdef0123456789' })
ok(r.estado === 404, 'el enlace antiguo (16 cifras) ya no abre nada')

console.log('\n── El secreto no se filtra ──')
ok(!peticionesBD.some(p => (p.url + p.cuerpo + p.cabeceras).includes(SECRETO)), 'el secreto no viaja a la base de datos')
ok(!respuestasTexto.some(t => t.includes(SECRETO)), 'el secreto no aparece en ninguna respuesta')
const cors = (await funcion(new Request('https://funcion.test/', { method: 'OPTIONS', headers: { origin: ORIGEN } })))
  .headers.get('access-control-allow-headers')
ok(cors === 'content-type', 'el CORS no admite la cabecera del secreto: un navegador no puede mandarla')

// ── el guion administrativo, contra la funcion servida en local ─────────
console.log('\n── npm run avisar ──')
const servidor = http.createServer(async (req, res) => {
  let cuerpo = ''
  for await (const t of req) cuerpo += t
  const r2 = await funcion(new Request('https://funcion.test' + req.url, {
    method: req.method, headers: req.headers, body: req.method === 'POST' ? cuerpo : undefined,
  }))
  res.writeHead(r2.status, Object.fromEntries(r2.headers))
  res.end(await r2.text())
})
await new Promise(ok2 => servidor.listen(0, '127.0.0.1', ok2))
const EDGE = `http://127.0.0.1:${servidor.address().port}/helpers-write`
async function guion(args, secreto) {
  const env = { ...process.env, NURA_EDGE_URL: EDGE, NURA_ORIGIN: ORIGEN }
  delete env.NURA_ADMIN_SECRET
  if (secreto !== undefined) env.NURA_ADMIN_SECRET = secreto
  // Asincrono: uno sincrono bloquearia el servidor de este mismo proceso.
  return await new Promise(fin => {
    const p = spawn(process.execPath, [join(root, 'scripts/avisar.mjs'), ...args], { env })
    let salida = ''
    p.stdout.on('data', d => { salida += d })
    p.stderr.on('data', d => { salida += d })
    p.on('close', codigo => fin({ codigo, salida }))
  })
}
let g = await guion(['--pendientes'], undefined)
ok(g.codigo === 1 && g.salida.includes('Falta NURA_ADMIN_SECRET'), 'sin secreto en la terminal, el guion se niega antes de llamar')
g = await guion(['--pendientes'], 'secreto-equivocado')
ok(g.codigo === 1 && g.salida.includes('401') && !g.salida.includes('secreto-equivocado'), 'con secreto incorrecto: 401, y no lo imprime')
g = await guion(['--pendientes'], SECRETO)
ok(g.codigo === 0 && !g.salida.includes(SECRETO), 'con el secreto correcto funciona y no lo imprime')
servidor.close()

console.log(`\n${pasadas} pasadas · ${fallos} fallidas\n`)
process.exit(fallos ? 1 : 0)
