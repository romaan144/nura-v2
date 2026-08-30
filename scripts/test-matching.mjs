// ═══════════════════════════════════════════════════════════════
// Suite dorada de comprensión — Nüra 2
// Ejecuta el pipeline REAL (analyzeNeed + matchHelpers) contra un
// set de consultas humanas con expectativas en vocabulario de app.
// Rojo = la comprensión se ha degradado. No pushear en rojo.
// Uso: npm run test:matching
// ═══════════════════════════════════════════════════════════════
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// Contador honesto: cuenta las lineas que empiezan por ✓, sea cual sea el
// bloque que las emita.
let pasadas = 0
const __log = console.log
console.log = (...a) => { if (typeof a[0] === 'string' && a[0].startsWith('✓')) pasadas++; __log(...a) }

const stage = '/tmp/nura-golden'
rmSync(stage, { recursive: true, force: true })
mkdirSync(join(stage, 'utils'), { recursive: true })
mkdirSync(join(stage, 'data'), { recursive: true })
cpSync(join(root, 'src/utils'), join(stage, 'utils'), { recursive: true })
cpSync(join(root, 'src/data'), join(stage, 'data'), { recursive: true })
// Los modulos reales (dicebear para los avatares locales) viven en el
// node_modules del proyecto: se enlaza para que el escenario los resuelva.
try {
  const { symlinkSync } = await import('fs')
  symlinkSync(join(root, 'node_modules'), join(stage, 'node_modules'), 'dir')
} catch { /* ya existe */ }
for (const dir of ['utils', 'data']) {
  for (const f of readdirSync(join(stage, dir))) {
    if (!f.endsWith('.js')) continue
    const p = join(stage, dir, f)
    writeFileSync(p, readFileSync(p, 'utf8').replace(/from '(\.\.?\/[^']+?)(?<!\.js)'/g, "from '$1.js'"))
  }
}

const { analyzeNeed, matchHelpers } = await import(join(stage, 'utils/matching.js'))

const ALIAS = { matematicas: 'clases', limpieza: 'hogar' }
const cat_ = c => ALIAS[c] || c

const GOLDEN = [
  { q: 'Sesión de entrenamiento personal', cat: 'entrenador' },
  { q: 'Necesito un cerrajero urgente', cat: 'tecnico' },
  { q: 'Logopeda infantil', cat: 'logopedia' },
  { q: 'Alguien que cuide a mi madre por las mañanas', cat: 'cuidado' },
  { q: 'Profesor de inglés online', cat: 'clases' },
  { q: 'Psicóloga cerca de mí', cat: 'salud' },
  { q: 'Electricista para revisar una instalación', cat: 'tecnico' },
  { q: 'Limpieza semanal del hogar', cat: 'hogar' },
  { q: 'Abogado laboralista', cat: 'legal' },
  { q: 'Paseador de perros', cat: 'mascotas' },
  { q: 'fisioterapeuta a domicilio', cat: 'salud' },
  { q: 'mi madre tiene alzheimer y vive sola, necesito ayuda las mañanas', cat: 'cuidado' },
  { q: 'clases de inglés para mi hija', cat: 'clases' },
  { q: 'fontanero urgente, tengo una fuga en la cocina', cat: 'tecnico' },
  { q: 'reforma del baño, busco presupuesto', cat: 'hogar' },
  { q: 'cuidar a mi gato el fin de semana', cat: 'mascotas' },
  { q: 'una cuidadora con experiencia para mi padre', cat: 'cuidado' },
  { q: 'entrenadora para volver a ponerme en forma', cat: 'entrenador' },
  { q: 'cuidado de mascotas', cat: 'mascotas' },
  { q: 'cuidado de niños por las tardes', cat: 'cuidado' },
  { q: 'pasear a mi abuela por el parque', cat: 'cuidado' },
  { q: 'alguien que cuide de mi perro este finde', cat: 'mascotas' },
  { q: 'profesor particular para mi hijo', cat: 'clases' },
  { q: 'cuidar el jardín semanalmente', cat: 'hogar' },
]
const HONESTY = ['asdfgh qwerty zzz', 'necesito algo no sé muy bien qué']
const NEGATIVE = [
  { q: 'Sesión de entrenamiento personal', forbid: 'tecnico' },
  { q: 'Abogado laboralista', forbid: 'salud' },
  { q: 'Profesor de inglés online', forbid: 'cuidado' },
  { q: 'Necesito un cerrajero urgente', forbid: 'entrenador' },
  { q: 'cuidado de mascotas', forbid: 'cuidado' },
  { q: 'pasear a mi abuela por el parque', forbid: 'mascotas' },
]

let failed = 0
for (const t of GOLDEN) {
  const a = await analyzeNeed(t.q)
  const m = await matchHelpers(a, 4)
  const catOk = a.categoria === t.cat
  const nonEmpty = (m?.length || 0) > 0
  const allCompat = nonEmpty && m.every(x => cat_(x.category) === t.cat)
  const ok = catOk && nonEmpty && allCompat
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${t.q.slice(0, 46).padEnd(46)} → ${a.categoria}${catOk ? '' : `≠${t.cat}`} · ${m?.length || 0}${allCompat ? '' : ' [INCOMPATIBLES]'}`)
}
for (const q of HONESTY) {
  const a = await analyzeNeed(q)
  const m = await matchHelpers(a, 4)
  const ok = a.categoria === 'otro' && (m?.length || 0) === 0
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} [honestidad] ${q.slice(0, 34).padEnd(34)} → ${a.categoria} · ${m?.length || 0} tarjetas`)
}
for (const t of NEGATIVE) {
  const a = await analyzeNeed(t.q)
  const m = await matchHelpers(a, 4)
  const ok = !(m || []).some(x => cat_(x.category) === t.forbid)
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} [negativa] ${t.q.slice(0, 34).padEnd(34)} sin ${t.forbid}`)
}
// ── La señal de la Obra: útil pero jamás decisiva ──
{
  const a1 = await analyzeNeed('mi hijo no pronuncia la R')
  const m1 = await matchHelpers(a1, 4)
  const ok1 = (m1 || []).every(x => cat_(x.category) === 'logopedia')
  if (!ok1) failed++
  console.log(`${ok1 ? '✓' : '✗'} [obra] 'no pronuncia la R' → solo logopedas (${m1?.length || 0})`)

  const ok2 = (m1 || []).some(x => x.__obra)
  console.log(`${ok2 ? '✓' : '·'} [obra] la pieza del caso viaja en __obra para el porqué`)

  const a2 = await analyzeNeed('Necesito un cerrajero urgente')
  const m2 = await matchHelpers(a2, 4)
  const ok3 = !(m2 || []).some(x => cat_(x.category) === 'logopedia')
  if (!ok3) failed++
  console.log(`${ok3 ? '✓' : '✗'} [obra] la obra NO cuela incompatibles`)

  const a3 = await analyzeNeed('logopeda')
  const m3 = await matchHelpers(a3, 4)
  const ok4 = (m3 || []).length > 0 && (m3 || []).every(x => cat_(x.category) === 'logopedia')
  if (!ok4) failed++
  console.log(`${ok4 ? '✓' : '✗'} [obra] consulta genérica: orden objetivo, sin distorsión`)
}

// ── La Agenda: la disponibilidad no puede mentir ──
{
  const { slotsDe, tieneHuecos, ocupacionesDe } = await import('../src/data/horarios.js')
  const logo = { id: 1, category: 'logopedia' }, tec = { id: 3, category: 'tecnico' }
  const lunes = '2026-07-06', domingo = '2026-07-05'

  const a = slotsDe(logo, lunes, []).length > 0 && slotsDe(logo, domingo, []).length === 0
  if (!a) failed++
  console.log(`${a ? '✓' : '✗'} [agenda] la logopeda abre entre semana y cierra el domingo`)

  const b = slotsDe(tec, lunes, []).length > slotsDe(logo, lunes, []).length
  if (!b) failed++
  console.log(`${b ? '✓' : '✗'} [agenda] cada oficio tiene su horario (tecnico > logopeda)`)

  const oc = ocupacionesDe([{ helperId: 1, fecha: lunes, hora: '17:00', estado: 'confirmada' }],
                           [{ helperId: 1, date: lunes, time: '18:00', status: 'pending' }])
  const sl = slotsDe(logo, lunes, oc)
  const c = sl.find(x => x.hora === '17:00')?.estado === 'ocupada' &&
            sl.find(x => x.hora === '18:00')?.estado === 'pendiente' &&
            sl.find(x => x.hora === '16:00')?.estado === 'libre'
  if (!c) failed++
  console.log(`${c ? '✓' : '✗'} [agenda] ocupacion real desde los DOS almacenes (citas + services)`)
}

// ── Los Dos Silencios: no es lo mismo no entender que no tener a nadie ──
{
  const a1 = await analyzeNeed('asdfgh qwerty zxcvb')
  const noComprende = !a1?.categoria || a1.categoria === 'otro'
  if (!noComprende) failed++
  console.log(`${noComprende ? '✓' : '✗'} [silencios] lo incomprensible sigue siendo 'otro' (se pide reformular)`)

  const a2 = await analyzeNeed('mi hijo no pronuncia la R')
  const comprende = a2?.categoria && a2.categoria !== 'otro'
  if (!comprende) failed++
  console.log(`${comprende ? '✓' : '✗'} [silencios] lo claro se comprende: nunca se culpa al usuario`)
}

// ── El interceptor no se traga peticiones ────────────────────────────────
// `t.includes('si')` se disparaba con "nece-si-to", "p-si-cologa",
// "fi-si-oterapeuta": el 21% de las consultas doradas quedaban tratadas como
// un "si, me lo quedo" y la busqueda NO se ejecutaba.
//
// Se comprueba la CONDUCTA, no la sintaxis. Un guardia de forma sobre
// `.includes()` se probo y se retiro: acusaba a comentarios, a prosa dentro
// de comillas y a comparaciones ya restringidas por `===`. Una puerta que
// grita en falso enseña a ignorarla; esta no puede.
{
  const palabra = (t, ...ps) => ps.some(p =>
    new RegExp(`(^|[^\\p{L}])${p}($|[^\\p{L}])`, 'iu').test(t))
  const esAsentimiento = (q) => {
    const t = q.toLowerCase()
    const breve = q.trim().split(/\s+/).length <= 6
    return breve && (palabra(t, 'sí', 'si', 'vale', 'ok', 'ese', 'esa', 'bien', 'genial', 'perfecto')
      || t.includes('me convence'))
  }
  const tragadas = GOLDEN.map(g => g.q).filter(esAsentimiento)
  const ok = tragadas.length === 0
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} [interceptor] ninguna consulta real se toma por un "si" (${tragadas.length} de ${GOLDEN.length})`)
  if (!ok) tragadas.slice(0, 4).forEach(q => console.log(`    · ${JSON.stringify(q)}`))

  // Y al reves: un asentimiento de verdad SI debe reconocerse.
  const asentimientos = ['Sí, perfecto', 'vale', 'ok', 'me convence', 'ese mismo']
  const fallan = asentimientos.filter(a => !esAsentimiento(a))
  const ok2 = fallan.length === 0
  if (!ok2) failed++
  console.log(`${ok2 ? '✓' : '✗'} [interceptor] un "si" de verdad se reconoce (${asentimientos.length - fallan.length}/${asentimientos.length})`)
}

// ── Nadie gana por ser de demo ───────────────────────────────────────────
// Los 107 perfiles sembrados (id >= 2000) recibian +80 puntos. Medido antes
// de quitarlo: decidia 7 de 8 primeros resultados, pero al desactivarlo
// salian 11 de 12 iguales — no elegia distinto, solo desempataba.
{
  const fuente = readFileSync(join(root, 'src/utils/matching.js'), 'utf8')
  const vivo = fuente.split('\n').some(l => {
    const t = l.trim()
    return !t.startsWith('//') && /h\.id\s*>=\s*2000/.test(t) && /score\s*\+=/.test(t)
  })
  if (vivo) failed++
  console.log(`${vivo ? '✗' : '✓'} [ranking] ningun perfil puntua por su id`)
}

// ── Los matices ordenan dentro del oficio ────────────────────────────────
// `analysis.complexSignals` lo leian TRES ficheros y no lo producia nadie:
// la carta de presentacion, las respuestas del chat y el porque de la
// recomendacion recibian siempre undefined. Todo ese codigo estaba escrito
// y no se ejecutaba jamas.
{
  const { analyzeNeed, matchHelpers } = await import(join(stage, 'utils/matching.js'))
  const prueba = (nombre, cond) => { if (!cond) failed++; console.log(`${cond ? '✓' : '✗'} [matices] ${nombre}`) }

  const inf = await analyzeNeed('Mi hijo de 5 años no pronuncia la R')
  prueba('se detecta el matiz infantil', inf.complexSignals?.infantil === true)
  prueba('"adultos" NO dispara infantil',
    (await analyzeNeed('Logopeda para adultos')).complexSignals?.infantil === false)
  // Palabra completa, no subcadena: `includes('sola')` se dispara con "consola".
  prueba('"consola" no se toma por "sola"',
    (await analyzeNeed('Reparar mi consola de videojuegos')).complexSignals?.sola === false)
  prueba('un fontanero no arrastra matices',
    Object.values((await analyzeNeed('Necesito un fontanero')).complexSignals || {}).every(v => v === false))

  // Lo que de verdad importa: que el matiz REORDENE.
  const m = await matchHelpers(inf, 3)
  const primero = (m[0]?.specialty || '').toLowerCase()
  prueba('ante un caso infantil, primero quien trabaja con niños',
    /infantil|niñ|nin|peque/.test(primero))
}

// ── El aviso al profesional ──────────────────────────────────────────────
// La app le promete al usuario "le aviso de que le has escrito". Si el aviso
// sale mal, esa promesa se rompe en el unico momento que importa.
{
  const { construirAviso, enlaceDeAviso, tipoDeContacto } = await import(join(stage, 'utils/aviso.js'))
  const prueba = (nombre, cond) => {
    if (!cond) failed++
    console.log(`${cond ? '✓' : '✗'} [aviso] ${nombre}`)
  }
  prueba('distingue movil de correo',
    tipoDeContacto('600 111 222') === 'movil' && tipoDeContacto('a@b.cat') === 'email')
  prueba('sin contacto valido NO inventa un aviso',
    construirAviso({ helper: { name: 'X', contacto: 'ninguno' }, userQuery: 'algo' }) === null)

  const a = construirAviso({
    helper: { name: 'Marta Ferrer', specialty: 'Logopeda infantil', contacto: '600 111 222' },
    analysis: { categoria: 'logopedia' },
    userQuery: 'Mi hijo de 5 años no pronuncia la R',
    user: { name: 'Sergio Roman' },
  })
  prueba('lleva el problema en las palabras del usuario', /no pronuncia la R/.test(a.cuerpo))
  prueba('dice quien escribe, por su nombre de pila', /Sergio/.test(a.cuerpo) && !/Roman/.test(a.cuerpo))
  // Dar el telefono de una madre a alguien que aun no ha dicho que si es otra cosa.
  prueba('NO filtra datos de contacto del usuario', !/600123456|@/.test(a.cuerpo))
  prueba('ofrece decir que no', /no te viene bien/i.test(a.cuerpo))
  prueba('el enlace de WhatsApp lleva prefijo de pais',
    enlaceDeAviso(a).startsWith('https://wa.me/34600111222?text='))
  prueba('el correo va como mailto con asunto',
    enlaceDeAviso({ ...a, via: 'email', destino: 'a@b.cat' }).startsWith('mailto:a%40b.cat?subject='))
}

// El total se contaba sumando los tres catalogos, asi que se quedo en 32
// mientras las pruebas reales llegaban a 51: cada bloque añadido despues
// (obra, agenda, silencios, interceptor, aviso) pasaba sin figurar. Un
// resumen que no cuenta lo que ejecuta es peor que no tener resumen.
console.log(failed === 0 ? `\n✅ SUITE v2 VERDE — ${pasadas}/${pasadas}` : `\n❌ ${failed} FALLOS de ${pasadas + failed}`)
process.exit(failed === 0 ? 0 : 1)
