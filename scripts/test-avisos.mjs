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
const db = { helpers: [], avisos: [], valoraciones: [], alertas: [], ajustes: [], perfil_atributos: [], eventos: [] }
const peticionesBD = []   // todo lo que la funcion le pide a "Supabase"

function coincide(fila, campo, cond) {
  const v = fila[campo]
  if (cond === 'is.null') return v === null || v === undefined
  if (cond === 'not.is.null') return v !== null && v !== undefined
  if (cond.startsWith('eq.')) return String(v) === cond.slice(3)
  if (cond.startsWith('ilike.')) return String(v ?? '').toLowerCase() === cond.slice(6).toLowerCase()
  if (cond.startsWith('in.(')) return cond.slice(4, -1).split(',').includes(String(v))
  if (cond.startsWith('cs.{')) return cond.slice(4, -1).split(',').every(x => (v || []).includes(x))
  if (cond.startsWith('gt.')) return String(v) > cond.slice(3)
  if (cond.startsWith('lt.')) return String(v) < cond.slice(3)
  throw new Error('filtro no soportado: ' + cond)
}

async function postgrest(url, init = {}) {
  const u = new URL(url)
  const metodo = init.method || 'GET'
  peticionesBD.push({ url, metodo, cuerpo: init.body ?? '', cabeceras: JSON.stringify(init.headers ?? {}) })
  const tabla = u.pathname.replace('/rest/v1/', '')
  if (!db[tabla]) return new Response('[]', { status: 404 })
  const filtros = [...u.searchParams].filter(([k]) => !['select', 'order', 'limit', 'on_conflict'].includes(k))
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
    const nueva = JSON.parse(init.body)
    if (Array.isArray(nueva)) {
      for (const n of nueva) db[tabla].push({ ...n })
      return new Response(null, { status: 201 })
    }
    // Como la restriccion `unique` de la base real: una valoracion por aviso.
    if (tabla === 'valoraciones' && db.valoraciones.some(v => v.aviso_id === nueva.aviso_id)) {
      return new Response('{"code":"23505"}', { status: 409 })
    }
    if (tabla === 'ajustes' && db.ajustes.some(f => f.clave === nueva.clave)) return new Response(null, { status: 201 })
    const extra = tabla === 'alertas' ? { caduca_en: new Date(Date.now() + 90 * 864e5).toISOString(), encontrados: [] } : {}
    const fila = { id: db[tabla].length + 1, fecha: new Date().toISOString(), ...extra, ...nueva }
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
    return quiereFilas ? Response.json(cumplen) : new Response(null, { status: 204 })
  }
  return new Response(null, { status: 405 })
}

// Sesiones ficticias: una con el correo confirmado y otra sin confirmar.
const SESIONES = {
  'sesion-confirmada': { id: 'u1', email: 'Cliente@Ficticio.test', email_confirmed_at: '2026-09-01T00:00:00Z' },
  'sesion-sin-confirmar': { id: 'u2', email: 'otra@ficticio.test' },
}
const tocados = []   // notificaciones enviadas al servicio de push ficticio
const correos = []   // correos enviados al proveedor ficticio
let pushResponde = 201

globalThis.fetch = async (url, init) => {
  if (String(url) === SUPA + '/auth/v1/user') {
    const s = SESIONES[String(init?.headers?.Authorization || '').replace('Bearer ', '')]
    return s ? Response.json(s) : new Response('{}', { status: 401 })
  }
  if (String(url).startsWith('https://fcm.googleapis.com/')) { tocados.push({ url: String(url), init }); return new Response(null, { status: pushResponde }) }
  if (String(url) === 'https://api.resend.com/emails') { correos.push(JSON.parse(init.body)); return Response.json({ id: 'x' }) }
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

console.log('\n── Valorar (perfil vivo) ──')
{
  const antesEnviado = filaB.enviado_en
  ok(Boolean(antesEnviado), 'aviso-enviado guarda cuándo le llegó al profesional (enviado_en)')
  r = await llamarG(funcion, { op: 'valorar', llave: a.datos.lectura, estrellas: 5, volveria: true,
    cualidades: ['paciente', 'puntual', 'inventada', 'paciente'], comentario: 'Muy bien', publico: false })
  ok(r.estado === 200, `A valora con su llave → 200 (dio ${r.estado})`)
  const vA = db.valoraciones.at(-1)
  ok(vA?.helper_id === '7' && vA?.aviso_id === filaA.id, 'el profesional sale del aviso, no del móvil')
  ok(JSON.stringify(vA?.cualidades) === '["paciente","puntual"]', 'solo cualidades de la lista, sin repetir')
  ok(vA?.comentario === null, 'un comentario no público ni siquiera se guarda')
  r = await llamarG(funcion, { op: 'valorar', llave: a.datos.lectura, estrellas: 1 })
  ok(r.estado === 409 && db.valoraciones.length === 1, `una segunda valoración de la misma conversación → 409 (dio ${r.estado})`)
  r = await llamarG(funcion, { op: 'valorar', llave: '0'.repeat(32), estrellas: 5 })
  ok(r.estado === 404 && db.valoraciones.length === 1, `sin haber escrito a nadie no se puede valorar → 404 (dio ${r.estado})`)
  r = await llamarG(funcion, { op: 'valorar', llave: filaB.token, estrellas: 5 })
  ok(r.estado === 404, 'la llave del profesional no sirve para valorarse a sí mismo')
  r = await llamarG(funcion, { op: 'valorar', llave: b.datos.lectura, helperId: '999', volveria: false, comentario: 'Público', publico: true })
  const vB = db.valoraciones.at(-1)
  ok(r.estado === 200 && vB?.helper_id === '7', 'mandar otro helperId no cambia a quién se valora')
  ok(vB?.comentario === 'Público' && vB?.comentario_publico === true, 'el comentario público sí se guarda')
  r = await llamarG(funcion, { op: 'valorar', llave: b.datos.lectura })
  ok(r.estado === 400, `una valoración vacía se rechaza → 400 (dio ${r.estado})`)
  r = await llamarG(funcion, { op: 'valorar', llave: a.datos.lectura, estrellas: 9 })
  ok(r.estado === 400, `estrellas fuera de 1–5 no valen → 400 (dio ${r.estado})`)
}


console.log('\n── Te aviso si aparece alguien ──')
{
  const SUB = { endpoint: 'https://fcm.googleapis.com/fcm/send/ficticio-1', keys: { p256dh: 'x', auth: 'y' } }
  let r = await llamarG(funcion, { op: 'clave-push' })
  ok(r.estado === 200 && /^[A-Za-z0-9_-]{80,}$/.test(r.datos?.clave ?? ''), 'la función da su llave pública de notificaciones')
  const clave1 = r.datos.clave
  r = await llamarG(funcion, { op: 'clave-push' })
  ok(r.datos?.clave === clave1 && db.ajustes.length === 1, 'la llave se crea una vez y se reutiliza')
  ok(!respuestasTexto.some(t => t.includes('"d"')), 'la llave privada no sale nunca en una respuesta')

  r = await llamarG(funcion, { op: 'crear-alerta', categorias: ['logopedia'], que: 'Apoyo con el habla', push: SUB })
  ok(r.estado === 200 && /^[0-9a-f]{32}$/.test(r.datos?.llave ?? '') && r.datos?.canales?.movil === true, 'se guarda una alerta con aviso al móvil')
  const llaveMovil = r.datos.llave
  ok(!JSON.stringify(db.alertas).includes(llaveMovil), 'la llave de la alerta no se guarda tal cual')
  const fila = db.alertas.at(-1)
  ok(Object.keys(fila).every(k => ['id','fecha','caduca_en','encontrados','categorias','que','correo','push','llave_hash','baja'].includes(k)),
    'la alerta guarda solo oficio, canales y llaves: ninguna frase')

  r = await llamarG(funcion, { op: 'crear-alerta', categorias: ['logopedia'], que: 'x', push: { endpoint: 'https://atacante.test/robar' } })
  ok(r.estado === 400, `una «suscripción» a una web cualquiera se rechaza → 400 (dio ${r.estado})`)
  r = await llamarG(funcion, { op: 'crear-alerta', categorias: ['DROP TABLE'], que: 'x' })
  ok(r.estado === 400, 'un oficio con forma rara se rechaza')
  r = await llamarG(funcion, { op: 'crear-alerta', categorias: ['logopedia'], que: 'Habla', sesion: 'sesion-sin-confirmar', correo: 'victima@ficticio.test' })
  ok(r.estado === 400 && !db.alertas.some(f => f.correo), 'con el correo sin confirmar no se apunta a nadie')
  r = await llamarG(funcion, { op: 'crear-alerta', categorias: ['logopedia'], que: 'Habla', sesion: 'falsa' })
  ok(r.estado === 401, 'con una sesión falsa → 401')
  r = await llamarG(funcion, { op: 'crear-alerta', categorias: ['logopedia'], que: 'Apoyo con el habla', sesion: 'sesion-confirmada', correo: 'victima@ficticio.test' })
  ok(r.estado === 200 && db.alertas.at(-1).correo === 'cliente@ficticio.test', 'el correo sale de la cuenta confirmada, no del que mande el móvil')
  const llaveCorreo = r.datos.llave
  await llamarG(funcion, { op: 'crear-alerta', categorias: ['mascotas'], que: 'Cuidado de mascotas', push: SUB })

  // Llega una logopeda nueva
  const antes = tocados.length
  r = await llamarG(funcion, { op: 'alta', payload: { name: 'Lucía Ficticia Pérez', category: 'logopedia', specialty: 'Logopeda infantil' } })
  ok(r.estado === 200, 'el alta sigue funcionando')
  ok(tocados.length === antes + 1, `se toca el móvil de quien esperaba una logopeda, y solo ese (${tocados.length - antes})`)
  const t = tocados.at(-1)
  ok(!t.init.body, 'la notificación va vacía: el servicio de push no ve qué se buscaba')
  const [, jwt, k] = /vapid t=([^,]+), k=(.+)$/.exec(t.init.headers.Authorization) || []
  let firmaValida = false
  if (jwt) {
    const [h, c, f] = jwt.split('.')
    const d = x => Uint8Array.from(Buffer.from(x, 'base64url'))
    const pub = await crypto.subtle.importKey('raw', d(k), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    firmaValida = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, d(f), new TextEncoder().encode(h + '.' + c))
      && JSON.parse(Buffer.from(c, 'base64url')).aud === 'https://fcm.googleapis.com'
  }
  ok(firmaValida && k === clave1, 'la firma VAPID es válida con la llave pública')
  ok(correos.length === 0, 'sin proveedor de correo configurado no se envía ningún correo')

  r = await llamarG(funcion, { op: 'alertas', llaves: [llaveMovil] })
  ok(r.estado === 200 && r.datos.alertas.length === 1 && r.datos.alertas[0].encontrados[0]?.nombre === 'Lucía', 'el móvil ve quién ha llegado con su llave')
  ok(!JSON.stringify(r.datos).includes('cliente@ficticio'), 'la consulta del móvil no devuelve correos')
  r = await llamarG(funcion, { op: 'alertas', llaves: ['0'.repeat(32)] })
  ok(r.datos?.alertas?.length === 0, 'una llave inventada no ve nada')

  // Con proveedor de correo
  const conCorreo = await cargarFuncion({ ...ENV, RESEND_API_KEY: 're_ficticia', NURA_EMAIL_FROM: 'Nüra <avisos@ficticio.test>' })
  await llamarG(conCorreo, { op: 'alta', payload: { name: '<b>Marta</b> Ficticia', category: 'logopedia', specialty: 'Logopeda' } })
  ok(correos.length === 1 && correos[0].to[0] === 'cliente@ficticio.test', 'con proveedor configurado, llega el correo a la cuenta')
  ok(correos[0]?.html.includes('&lt;b&gt;') && correos[0]?.html.includes('/baja/'), 'el correo escapa el nombre y lleva enlace para darse de baja')

  // Suscripción caducada: se olvida
  pushResponde = 410
  await llamarG(funcion, { op: 'alta', payload: { name: 'Otra Ficticia', category: 'logopedia' } })
  pushResponde = 201
  ok(db.alertas.find(f => f.categorias.includes('logopedia') && f.correo === null).push === null, 'si el móvil ya no acepta avisos, se olvida su suscripción')

  // Caducadas
  db.alertas.push({ id: 99, categorias: ['logopedia'], que: 'vieja', correo: null, push: null, llave_hash: 'h', baja: 'b'.repeat(32), caduca_en: '2020-01-01T00:00:00Z', encontrados: [] })
  await llamarG(funcion, { op: 'alta', payload: { name: 'Una Más', category: 'logopedia' } })
  ok(!db.alertas.some(f => f.id === 99), 'las alertas caducadas se borran')

  // Quitar
  r = await llamarG(funcion, { op: 'quitar-alerta', llave: llaveMovil })
  ok(r.estado === 200 && !db.alertas.some(f => f.categorias.includes('logopedia') && f.correo === null), 'se quita con la llave del móvil')
  const baja = db.alertas.find(f => f.correo).baja
  r = await llamarG(funcion, { op: 'quitar-alerta', baja })
  ok(r.estado === 200 && !db.alertas.some(f => f.correo), 'se quita con el enlace del correo')
  r = await llamarG(funcion, { op: 'quitar-alerta', llave: llaveCorreo })
  ok(r.estado === 404, 'quitar dos veces → 404')
}


console.log('\n── Lo declarado: solo lo que confirma el profesional ──')
{
  const bueno = [
    { clave: 'vehiculo', valor: true }, { clave: 'anos_experiencia', valor: 9 },
    { clave: 'idioma:catalán', valor: true }, { clave: 'especialidad:alzheimer', valor: true },
    { clave: 'disponibilidad:mañanas', valor: true },
  ]
  const malo = [
    { clave: 'verificado', valor: true }, { clave: 'disponibilidad:siempre', valor: true },
    { clave: 'idioma:<script>', valor: true }, { clave: 'anos_experiencia', valor: 500 },
    { clave: 'vehiculo', valor: 'sí' },
  ]
  let r = await llamarG(funcion, { op: 'alta', payload: { name: 'Pilar Ficticia', category: 'cuidado' }, declarado: [...bueno, ...malo] })
  const id = String(r.datos?.helper?.id)
  const suyos = db.perfil_atributos.filter(a => a.helper_id === id)
  ok(r.estado === 200 && suyos.length === bueno.length, `el alta guarda lo confirmado (${suyos.length} de ${bueno.length}) y descarta lo que no es del vocabulario`)
  ok(suyos.every(a => a.fuente === 'declarado' && /^lo confirmó el \d{4}-\d{2}-\d{2}$/.test(a.prueba)), 'cada dato lleva su fuente «declarado» y la fecha')
  ok(!suyos.some(a => a.clave === 'verificado'), 'nadie puede declararse «verificado»')

  db.helpers.push({ id: 555, name: 'Dueña Ficticia', owner_id: 'u1' })
  r = await llamarG(funcion, { op: 'confirmar-declarado', atributos: bueno })
  ok(r.estado === 401, 'sin sesión no se confirma nada → 401')
  r = await llamarG(funcion, { op: 'confirmar-declarado', sesion: 'sesion-sin-confirmar', atributos: bueno })
  ok(r.estado === 404, 'con sesión pero sin ficha propia → 404')
  r = await llamarG(funcion, { op: 'confirmar-declarado', sesion: 'sesion-confirmada', helperId: id, atributos: [{ clave: 'vehiculo', valor: false }] })
  ok(r.estado === 200 && db.perfil_atributos.filter(a => a.helper_id === '555').length === 1, 'se guarda en SU ficha, no en la que diga el móvil')
  ok(db.perfil_atributos.filter(a => a.helper_id === id).length === bueno.length, 'la ficha de otra persona no se toca')
  r = await llamarG(funcion, { op: 'confirmar-declarado', sesion: 'sesion-confirmada', atributos: [] })
  ok(r.estado === 200 && !db.perfil_atributos.some(a => a.helper_id === '555'), 'confirmar una lista vacía borra lo declarado')
}


console.log('\n── El Pulso: cifras de verdad, solo de la ficha propia ──')
{
  const hoy = new Date().toISOString(), viejo = '2020-01-01T00:00:00.000Z'
  db.helpers.push({ id: 777, name: 'Pulso Ficticia', category: 'limpieza', owner_id: 'u1' })
  db.helpers = db.helpers.filter(h => !(h.owner_id === 'u1' && h.id !== 777))
  db.eventos.push(
    { id: 1, tipo: 'busqueda', categoria: 'hogar', fecha: hoy },
    { id: 2, tipo: 'sin_cobertura', categoria: 'hogar', fecha: hoy },
    { id: 3, tipo: 'busqueda', categoria: 'hogar', fecha: viejo },
    { id: 4, tipo: 'busqueda', categoria: 'salud', fecha: hoy },
    { id: 5, tipo: 'recomendacion_vista', helper_id: '777', fecha: hoy },
    { id: 6, tipo: 'recomendacion_vista', helper_id: '8', fecha: hoy },
  )
  db.avisos.push(
    { id: 70, helper_id: '777', fecha: hoy, respondido_en: hoy },
    { id: 71, helper_id: '777', fecha: hoy, respondido_en: null },
    { id: 72, helper_id: '777', fecha: viejo, respondido_en: null },
  )
  let r = await llamarG(funcion, { op: 'mi-pulso' })
  ok(r.estado === 401, 'sin sesión no hay Pulso → 401')
  r = await llamarG(funcion, { op: 'mi-pulso', sesion: 'sesion-confirmada', helperId: 8 })
  const p = r.datos?.pulso
  ok(r.estado === 200 && p?.busquedas === 2, `cuenta las búsquedas de su oficio de esta semana (limpieza → hogar): ${p?.busquedas}`)
  ok(p?.apariciones === 1, 'cuenta solo las veces que salió SU ficha, no la que diga el móvil')
  ok(p?.recibidos === 2 && p?.respondidos === 1, 'mensajes de esta semana: recibidos y contestados')
  ok(!JSON.stringify(r.datos).includes('mensaje'), 'el Pulso no devuelve ningún mensaje ni frase de nadie')
}

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
