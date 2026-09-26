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
// La configuración (DEMO_MODE): la leen matching.js y supabase.js.
cpSync(join(root, 'src/config.js'), join(stage, 'config.js'))
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

const ALIAS = { matematicas: 'clases', limpieza: 'hogar', educacion: 'clases' }
const cat_ = c => ALIAS[c] || c

const GOLDEN = [
  // Barrido del 2026-09-25: 60 frases nuevas, 45 acertadas. Estas fallaban.
  { q: 'quiero montar una tienda online', cat: 'tecnologia' },
  { q: 'necesito que alguien me pinte el piso', cat: 'tecnico' },
  { q: 'que me planchen la ropa', cat: 'hogar' },
  { q: 'necesito ayuda para mudarme el sábado', cat: 'hogar' },
  { q: 'estoy pasando una mala racha y necesito hablar con alguien', cat: 'salud' },
  { q: 'papeles para la residencia', cat: 'legal' },
  { q: 'cambiar el grifo de la cocina', cat: 'tecnico' },
  { q: 'cortar el césped y podar', cat: 'hogar' },
  { q: 'mi hijo tiene tdah y necesita apoyo con los deberes', cat: 'clases' },
  { q: 'ayuda con el ordenador para mi abuela', cat: 'tecnologia' },
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
  // 2026-09-24: estas tres caian en la categoria `otro` (= cero resultados)
  // o no premiaban al oficio buscado.
  { q: 'busco quien me haga la comida', cat: 'hogar' },
  { q: 'necesito un asesor', cat: 'legal' },
  { q: 'necesito alguien para limpiar mi casa', cat: 'hogar' },
]
// Solo la categoria: en la copia local no hay traductores (viven en
// Supabase), asi que aqui no se exige que haya resultados.
const SOLO_CATEGORIA = [
  { q: 'necesito un traductor de árabe', cat: 'idiomas' },
  { q: 'busco un intérprete', cat: 'idiomas' },
  { q: 'pediatra para mi bebé', cat: 'salud' },
  { q: 'mi bebé tiene fiebre, necesito un pediatra', cat: 'salud' },
  { q: 'canguro para mi bebé', cat: 'cuidado' },
  // Barrido de frases reales (2026-09-24): antes iban a otra categoria o a
  // ninguna. 'logo' iba a logopedia; 'triste', a logopedia.
  { q: 'necesito un logo para mi negocio', cat: 'diseno' },
  { q: 'necesito hablar con alguien, estoy muy triste', cat: 'salud' },
  { q: 'tengo una mancha rara en la piel', cat: 'salud' },
  { q: 'me han despedido sin motivo', cat: 'legal' },
  { q: 'mi casero no me devuelve la fianza', cat: 'legal' },
  { q: 'necesito alguien que recoja a mis hijos del colegio', cat: 'cuidado' },
  { q: 'el váter está atascado', cat: 'tecnico' },
  { q: 'se me ha roto el grifo de la cocina', cat: 'tecnico' },
  { q: 'busco quien me planche la ropa', cat: 'hogar' },
  { q: 'quiero comer más sano', cat: 'salud' },
  { q: 'necesito traducir unos documentos al inglés', cat: 'idiomas' },
  { q: 'traducir mi título al inglés', cat: 'idiomas' },
  // Barrido 2026-09-25: faltas, catalán y casos límite (38 de 50 → 50 de 50).
  { q: 'fontanro urgente', cat: 'tecnico' },
  { q: 'logopeta para mi hijo', cat: 'logopedia' },
  { q: 'sicologa', cat: 'salud' },
  { q: 'fisioterapueta', cat: 'salud' },
  { q: 'cerragero', cat: 'tecnico' },
  { q: 'busco un lampista', cat: 'tecnico' },
  { q: 'necessito un fuster', cat: 'tecnico' },
  { q: 'classes de repàs', cat: 'clases' },
  { q: 'advocat', cat: 'legal' },
  { q: 'gos', cat: 'mascotas' },
  { q: 'monitor de tiempo libre', cat: 'cuidado' },
  { q: 'canguro de gatos', cat: 'mascotas' },
  { q: 'necesito limpiar mi casa mañana', cat: 'hogar' },
  { q: 'fontaneros en Gràcia', cat: 'tecnico' },
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
// Ningun oficio real puede quedarse sin categoria: el alta decide la
// categoria con analyzeNeed(especialidad), y `otro` es invisible.
{
  const { oficios } = JSON.parse(readFileSync(join(root, 'scripts/oficios-reales.json'), 'utf8'))
  const sin = []
  for (const o of oficios) { if ((await analyzeNeed(o)).categoria === 'otro') sin.push(o) }
  const ok = sin.length === 0
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} oficios reales con categoria: ${oficios.length - sin.length}/${oficios.length}${ok ? '' : ' → sin categoria: ' + sin.join(', ')}`)
}
for (const t of SOLO_CATEGORIA) {
  const a = await analyzeNeed(t.q)
  const ok = a.categoria === t.cat
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${t.q.slice(0, 46).padEnd(46)} → ${a.categoria}${ok ? '' : `≠${t.cat}`} (solo categoria)`)
}
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
  const { slotsDe, tieneHuecos, ocupacionesDe, ocupadasDeEjemplo } = await import(join(stage, 'data/horarios.js'))
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
  const c = sl.find(x => x.hora === '17:00')?.estado === 'tuya' &&   // suya, confirmada
            slotsDe(logo, lunes, [{ helperId: 1, fecha: lunes, hora: '19:00', estado: 'confirmada', deOtro: true }]).find(x => x.hora === '19:00')?.estado === 'ocupada' &&
            sl.find(x => x.hora === '18:00')?.estado === 'tuya' &&   // la pidió esta persona
            // 16:00: libre, salvo que la agenda de ejemplo (demo) la dé por cogida
            sl.find(x => x.hora === '16:00')?.estado === (ocupadasDeEjemplo(logo, lunes).has('16:00') ? 'ocupada' : 'libre')
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

// ── Buscar un oficio devuelve a quien lo ejerce ──────────────────────────
// Medido antes: buscar "yoga" daba primero al entrenador personal y al
// instructor de yoga SEGUNDO, por un punto. "abogado de familia" daba el
// mercantil. "masajista" no encontraba al masajista.
//
// Dos causas. Una: `palabrasClave` solo traia terminos del catalogo de la
// categoria, nunca las palabras del usuario — "masajista" daba []. Dos: que
// la especialidad dijera exactamente lo buscado valia 8, menos que una
// etiqueta suelta (10) mas estar disponible (5).
{
  const { analyzeNeed, matchHelpers } = await import(join(stage, 'utils/matching.js'))
  const casos = [
    ['yoga', /yoga/i], ['pilates', /pilates/i], ['masajista', /masaj/i],
    ['abogado de familia', /familia/i], ['logopeda infantil', /infantil/i],
    // Una palabra no puede arrastrar a la categoria equivocada:
    // "cuidadora de animales" caia en cuidado de PERSONAS por `cuidadora`,
    // y "lengua y literatura" en logopedia por `lengua`.
    ['Cuidadora de animales', /animal|perro|gato|mascota/i],
    ['lengua y literatura española', /lengua|literatura/i],
    // Y los que ya funcionaban deben seguir funcionando.
    ['cuidadora de mayores', /cuidador|geriatr|mayor/i],
  ]
  for (const [q, esperado] of casos) {
    const m = await matchHelpers(await analyzeNeed(q), 1)
    const ok = esperado.test(m[0]?.specialty || '')
    if (!ok) failed++
    console.log(`${ok ? '✓' : '✗'} [oficio] "${q}" → ${m[0]?.specialty || 'nadie'}`)
  }
}

// ── Nadie es invisible ───────────────────────────────────────────────────
// Medido: 32 de 119 especialidades no caian en ninguna categoria. Uno de
// cada cuatro profesionales no aparecia si alguien buscaba su propio
// oficio, porque `diseno`, `tecnologia`, `eventos` y `automocion` tenian
// perfiles pero ninguna palabra clave. Existir en la base y no ser
// encontrable es lo mismo que no existir.
{
  const { analyzeNeed } = await import(join(stage, 'utils/matching.js'))
  const datos = readFileSync(join(root, 'src/data/helpers.js'), 'utf8')
  const esp = [...new Set([...datos.matchAll(/specialty: "([^"]+)"/g)].map(m => m[1]))]
  const mudos = []
  for (const e of esp) {
    const a = await analyzeNeed(e)
    if (a.categoria === 'otro') mudos.push(e)
  }
  // Se permite un margen pequeño: alguna especialidad muy singular puede no
  // tener categoria propia. Lo que no se permite es que sean decenas.
  const ok = mudos.length <= 3
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} [cobertura] las especialidades caen en su categoria (${mudos.length} sin categoria de ${esp.length})`)
  if (!ok) mudos.slice(0, 6).forEach(x => console.log(`    · ${x}`))
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


// ── LA ZONA (2026-09-24) ─────────────────────────────────────────────────
// Antes no se entendia el barrio y la distancia de las tarjetas era
// inventada. Ahora: se entiende, ordena por cercania real, y sin barrio no
// hay distancia.
{
  console.log('\n── La zona ──')
  const prueba = (texto, cond) => { console.log((cond ? '✓ ' : '✗ ') + texto); if (!cond) failed++ }
  const { barrioEnTexto, kmEntre, barrioDeZona } = await import(join(stage, 'data/barrios.js'))
  const nombre = t => barrioEnTexto(t)?.nombre ?? null
  prueba('«cerca de Gràcia» → Gràcia', nombre('logopeda cerca de Gràcia') === 'Gràcia')
  prueba('«gracias» NO es Gràcia', nombre('muchas gracias por la ayuda') === null)
  prueba('«vivo en el Poblenou» → Poblenou', nombre('vivo en el Poblenou') === 'Poblenou')
  prueba('«Sarrià-Sant Gervasi» → Sant Gervasi (el alias más largo)', nombre('en Sarrià-Sant Gervasi') === 'Sant Gervasi')
  prueba('«Sants» no se confunde con «Sant Andreu»', nombre('soy de Sants') === 'Sants' && nombre('en Sant Andreu') === 'Sant Andreu')
  prueba('sin barrio → null', nombre('necesito un fontanero urgente') === null)
  prueba('Gràcia–Vallcarca está cerca (< 2 km)', kmEntre(barrioDeZona('Gràcia'), barrioDeZona('Vallcarca')) < 2)
  prueba('Gràcia–Barceloneta está lejos (> 2,5 km)', kmEntre(barrioDeZona('Gràcia'), barrioDeZona('Barceloneta')) > 2.5)

  for (const [q, cat] of [['fontanero en Horta', 'tecnico'], ['logopeda infantil en Sants', 'logopedia'], ['alguien que cuide a mi madre en Gràcia', 'cuidado']]) {
    const a = await analyzeNeed(q)
    prueba(`el barrio no cambia el oficio: «${q}» → ${cat}`, cat_(a.categoria) === cat && a.zona)
  }
  const cerca = await matchHelpers(await analyzeNeed('logopeda infantil cerca de Gràcia'), 4)
  prueba('con barrio, cada resultado dice su distancia desde ese barrio',
    cerca.length > 0 && cerca.every(h => h.distanciaDesde === 'Gràcia' && (h.distance === null || typeof h.distance === 'number')))
  const conKm = cerca.filter(h => typeof h.distance === 'number')
  prueba('con barrio, el primero está a 3 km o menos (si hay alguien así)', !conKm.length || conKm[0].distance <= 3 || conKm.every(h => h.distance > 3))
  const sin = await matchHelpers(await analyzeNeed('logopeda infantil'), 4)
  prueba('sin barrio, ninguna distancia (antes se inventaba)', sin.length > 0 && sin.every(h => h.distance == null))
}

// ── LO DECLARADO EN LA BUSQUEDA (2026-09-25) ─────────────────────────────
// Lo que el profesional confirma de si mismo ordena cuando la persona lo
// pide. Nunca saca a nadie de su oficio y nunca cuenta lo no confirmado.
{
  console.log('\n── Lo declarado ──')
  const prueba = (texto, cond) => { console.log((cond ? '✓ ' : '✗ ') + texto); if (!cond) failed++ }
  const { pideDeclarado, puntosDeclarados } = await import(join(stage, 'utils/pideDeclarado.js'))
  const { reordenarPorDeclarado } = await import(join(stage, 'utils/matching.js'))
  const p1 = pideDeclarado('Cuidadora que hable catalán y tenga coche para llevar a mi madre al médico por las tardes')
  prueba('entiende idioma, coche y franja', p1.idiomas.includes('catalán') && p1.vehiculo && p1.disponibilidad.includes('tardes'))
  prueba('«mi madre» con Alzheimer → personas mayores', pideDeclarado('mi madre tiene alzheimer').personas.includes('personas mayores'))
  prueba('«mañana» (el día) no es «por las mañanas»', !pideDeclarado('necesito un fontanero mañana').disponibilidad.includes('mañanas'))
  prueba('«por las mañanas» sí', pideDeclarado('alguien por las mañanas').disponibilidad.includes('mañanas'))
  prueba('sin nada comprobable, no pide nada', (() => { const p = pideDeclarado('fontanero'); return !p.idiomas.length && !p.vehiculo && !p.disponibilidad.length && !p.personas.length })())
  prueba('«inglés» se entiende sin tilde', pideDeclarado('profe que hable ingles').idiomas.includes('inglés'))

  const attrs = [{ clave: 'idioma:catalán', valor: true }, { clave: 'vehiculo', valor: true }, { clave: 'disponibilidad:tardes', valor: true }]
  const r = puntosDeclarados(attrs, p1)
  prueba('suma por lo que pide y tiene declarado', r.score === 25 + 20 + 12 && r.motivos.includes('habla catalán') && r.motivos.includes('tiene coche'))
  prueba('lo no declarado no suma', puntosDeclarados([], p1).score === 0)
  prueba('declarar «no tengo coche» resta si lo pide', puntosDeclarados([{ clave: 'vehiculo', valor: false }], p1).score < 0)
  prueba('lo declarado que no pide no suma', puntosDeclarados(attrs, pideDeclarado('cuidadora')).score === 0)

  const candidatos = [{ id: 1, score: 100, category: 'cuidado' }, { id: 2, score: 80, category: 'cuidado' }]
  const orden = reordenarPorDeclarado(candidatos, new Map([['2', attrs]]), p1)
  prueba('quien tiene lo que pides sube, y se sabe por qué', orden[0].id === 2 && orden[0].__declarado?.length === 3)
  const lejos = reordenarPorDeclarado([{ id: 1, score: 200 }, { id: 2, score: 80 }], new Map([['2', attrs]]), p1)
  prueba('no da la vuelta a una diferencia grande (pesa menos que el oficio)', lejos[0].id === 1)
}

// ── La ciudad (2026-09-25): Nüra se usará en más ciudades ──
{
  const { ciudadEnTexto } = await import(join(stage, 'data/ciudades.js'))
  const casos = [
    ['fontanero en Madrid', 'Madrid'], ['busco canguro en valència', 'Valencia'], ['canguro en Valencia', 'Valencia'],
    ['logopeda cerca de Gràcia', 'Barcelona'], ['clases de inglés', null], ['Chamberí, Madrid', 'Madrid'],
    ['mi hijo León necesita un logopeda', null], ['vivo en León y busco fisio', 'León'], ['Granada', 'Granada'],
    ['quiero una granada', null], ['Palma de Mallorca', 'Palma'], ['toda Barcelona', 'Barcelona'], ['bcn', 'Barcelona'],
  ]
  for (const [t, esp] of casos) {
    const r = ciudadEnTexto(t)
    if (r !== esp) failed++
    console.log(`${r === esp ? '✓' : '✗'} ciudad: «${t}» → ${r}${r === esp ? '' : ` (esperado ${esp})`}`)
  }
  const a = await analyzeNeed('fontanero urgente en Madrid')
  const m = await matchHelpers(a, 6)
  const fuera = (m || []).filter(h => !h.online && (h.city || 'Barcelona') !== 'Madrid')
  if (!(a.ciudad === 'Madrid' && fuera.length === 0)) failed++
  console.log(`${a.ciudad === 'Madrid' && fuera.length === 0 ? '✓' : '✗'} buscar en Madrid no da técnicos de Barcelona (${(m || []).length} resultados, ${fuera.length} de fuera)`)
  const b = await matchHelpers(await analyzeNeed('fontanero urgente'), 4)
  if (!(b || []).length) failed++
  console.log(`${(b || []).length > 0 ? '✓' : '✗'} sin ciudad no se filtra (${(b || []).length} resultados)`)
}

// ── El contacto del profesional (2026-09-25): por ahí le llegan los avisos ──
{
  const { revisarContacto } = await import(join(stage, 'utils/contactoProfesional.js'))
  const casos = [
    ['612 345 678', true, '612 345 678'], ['+34 612-345-678', true, '612 345 678'], ['0034612345678', true, '612 345 678'],
    ['Marta@Gmail.com ', true, 'marta@gmail.com'], ['+44 7700 900123', true, '+447700900123'],
    ['61234567', false], ['612345678901', false], ['marta@gmail', false], ['no tengo', false], ['', false],
  ]
  for (const [t, ok, valor] of casos) {
    const r = revisarContacto(t)
    const bien = r.ok === ok && (!ok || r.valor === valor)
    if (!bien) failed++
    console.log(`${bien ? '✓' : '✗'} contacto: «${t}» → ${r.ok ? r.valor : 'rechazado'}`)
  }
  const falta = revisarContacto('marta@gmial.com')
  const bien = !falta.ok && falta.sugerencia === 'marta@gmail.com'
  if (!bien) failed++
  console.log(`${bien ? '✓' : '✗'} contacto: «marta@gmial.com» → sugiere ${falta.sugerencia}`)
}

// ── La agenda de los perfiles de ejemplo (2026-09-25) ──
{
  const H = await import(join(stage, 'data/horarios.js'))
  const { getFirstName } = await import(join(stage, 'utils/name.js'))
  const logopeda = { id: 2001, category: 'logopedia' }
  const dias = Array.from({ length: 60 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return H.isoLocal(d) })
  const laborables = dias.filter(f => H.horarioDe(logopeda).dias.includes(new Date(f + 'T12:00:00').getDay()))
  const igual = laborables.every(f => [...H.ocupadasDeEjemplo(logopeda, f)].join() === [...H.ocupadasDeEjemplo(logopeda, f)].join())
  const cargas = laborables.map(f => H.ocupadasDeEjemplo(logopeda, f).size)
  const total = H.horarioDe(logopeda).horas.length
  const casos = [
    ['la agenda de ejemplo sale igual al repetirla', igual],
    ['hay días con horas ya cogidas', cargas.some(n => n > 0 && n < total)],
    ['hay algún día completo', cargas.some(n => n === total)],
    ['y días con huecos', cargas.some(n => n < total)],
    ['un día que no trabaja no tiene horas', H.slotsDe(logopeda, dias.find(f => !laborables.includes(f)), []).length === 0],
    ['hay un próximo hueco libre', !!H.proximoHueco(logopeda, [])],
    ['la hora que pediste sale como tuya', (() => { const f = laborables[0]; const h = H.horarioDe(logopeda).horas[0]; return H.slotsDe(logopeda, f, [{ helperId: 2001, fecha: f, hora: h, estado: 'pendiente' }]).find(x => x.hora === h)?.estado === 'tuya' })()],
    ['«Dra. Sara Martínez» → Sara', getFirstName('Dra. Sara Martínez') === 'Sara'],
    ['su horario propio manda sobre el del oficio', (() => {
      const propia = { id: 9, category: 'logopedia', horario: { dias: [6], horas: ['10:00', '11:00'] } }
      const sab = dias.find(f => new Date(f + 'T12:00:00').getDay() === 6)
      const lun = dias.find(f => new Date(f + 'T12:00:00').getDay() === 1)
      return H.slotsDe(propia, sab, []).map(x => x.hora).join() === '10:00,11:00' && H.slotsDe(propia, lun, []).length === 0
    })()],
    ['un horario roto no rompe nada: se usa el del oficio', H.horarioDe({ category: 'logopedia', horario: { dias: [], horas: 'x' } }).horas.join() === H.horarioDelOficio('logopedia').horas.join()],
  ]
  for (const [n, ok] of casos) { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} agenda: ${n}`) }
}

// ── El recordatorio y la cita cancelada (2026-10-03) ──
{
  const H = await import(join(stage, 'data/horarios.js'))
  const ahora = new Date(2026, 9, 3, 10, 30)          // 3 oct, 10:30
  const s = (date, time, status = 'confirmed', helperId = 7) => ({ helperId, helperName: 'Laura Gómez', specialty: 'Logopeda', date, time, status })
  const casos = [
    ['confirmada mañana a las 9 → sale', H.citaEn24h([s('2026-10-04', '09:00')], [], ahora)?.hora === '09:00'],
    ['a más de 24 horas → no sale', H.citaEn24h([s('2026-10-04', '11:00')], [], ahora) === null],
    ['ya empezada → no sale', H.citaEn24h([s('2026-10-03', '10:00')], [], ahora) === null],
    ['pendiente (sin confirmar) → no sale', H.citaEn24h([s('2026-10-03', '17:00', 'pending')], [], ahora) === null],
    ['cancelada → no sale', H.citaEn24h([s('2026-10-03', '17:00', 'cancelled')], [], ahora) === null],
    ['de dos, sale la más cercana', H.citaEn24h([s('2026-10-04', '08:00'), s('2026-10-03', '12:00')], [], ahora)?.fecha === '2026-10-03'],
    ['una cita del chat confirmada también cuenta', H.citaEn24h([], [{ helperId: 7, helperName: 'Laura', fecha: '2026-10-03', hora: '18:00', estado: 'confirmada' }], ahora)?.hora === '18:00'],
    ['la misma cita en las dos listas: guarda la especialidad', H.citaEn24h([s('2026-10-03', '18:00')], [{ helperId: 7, helperName: 'Laura', fecha: '2026-10-03', hora: '18:00', estado: 'confirmada' }], ahora)?.specialty === 'Logopeda'],
    ['una cita cancelada ya no ocupa la hora', H.ocupacionesDe([{ helperId: 7, fecha: '2026-10-03', hora: '18:00', estado: 'cancelada' }], [s('2026-10-03', '19:00', 'cancelled')]).length === 0],
  ]
  for (const [n, ok] of casos) { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} recordatorio: ${n}`) }
}

// ── La agenda del profesional (2026-10-04) ──
{
  const H = await import(join(stage, 'data/horarios.js'))
  const ahora = new Date(2026, 9, 3, 10, 30)          // 3 oct
  const a = (id, fecha, hora, estado, respuesta = null) => ({ id, token: 't' + id, cita_fecha: fecha, cita_hora: hora, cita_estado: estado, respuesta })
  const ag = H.agendaDe([
    a(1, '2026-10-05', '17:00', 'aceptada'),
    a(2, '2026-10-03', '9:00', 'propuesta'),
    a(3, '2026-10-05', '10:00', 'cancelada'),
    a(4, '2026-10-04', '12:00', 'rechazada'),
    a(5, '2026-10-02', '12:00', 'aceptada'),
    a(6, '2026-10-30', '12:00', 'aceptada'),
    a(7, '2026-10-04', '11:00', 'propuesta', 'Déjame mirarlo'),
    { id: 8, token: 't8', mensaje: 'sin cita' },
  ], ahora)
  const planas = ag.flatMap(d => d.citas)
  const casos = [
    ['agrupa por día, en orden', ag.map(d => d.fecha).join() === '2026-10-03,2026-10-04,2026-10-05'],
    ['dentro del día, por hora (10:00 antes que 17:00)', ag[2].citas.map(c => c.hora).join() === '10:00,17:00'],
    ['aceptada → confirmada', planas.find(c => c.id === 1)?.estado === 'confirmada'],
    ['propuesta sin responder → por contestar', planas.find(c => c.id === 2)?.estado === 'por-contestar'],
    ['respondida sin aceptar → sin confirmar', planas.find(c => c.id === 7)?.estado === 'sin-decidir'],
    ['cancelada sale como cancelada', planas.find(c => c.id === 3)?.estado === 'cancelada'],
    ['la rechazada no sale', !planas.some(c => c.id === 4)],
    ['ni la de ayer, ni la de dentro de un mes, ni un mensaje sin cita', !planas.some(c => [5, 6, 8].includes(c.id))],
    ['sin nada, agenda vacía', H.agendaDe([], ahora).length === 0 && H.agendaDe(null, ahora).length === 0],
  ]
  for (const [n, ok] of casos) { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} agenda del profesional: ${n}`) }
}

// ── Días u horas bloqueadas (2026-10-05) ──
{
  const H = await import(join(stage, 'data/horarios.js'))
  const horas = ['16:00', '17:00', '18:00', '19:00']
  const pro = { id: 55, category: 'logopedia', horario: { dias: [1, 2, 3, 4, 5], horas } }
  const lunes = (() => { for (let i = 1; i < 14; i++) { const d = new Date(); d.setDate(d.getDate() + i); if (d.getDay() === 1) return H.isoLocal(d) } })()
  const martes = (() => { const d = new Date(lunes + 'T12:00:00'); d.setDate(d.getDate() + 1); return H.isoLocal(d) })()
  const conDia = { ...pro, bloqueos: [{ fecha: lunes }] }
  const conHoras = { ...pro, bloqueos: [{ fecha: lunes, horas: ['17:00'] }] }
  let b = H.alternarHora([], lunes, '17:00', horas)
  const c1 = b.length === 1 && b[0].horas.join() === '17:00'
  b = H.alternarHora(b, lunes, '17:00', horas)
  const c2 = b.length === 0
  b = H.alternarDia([], lunes)
  const c3 = b.length === 1 && !b[0].horas
  b = H.alternarHora(b, lunes, '16:00', horas)
  const c4 = b[0].horas?.join() === '17:00,18:00,19:00'
  b = H.alternarHora(b, lunes, '16:00', horas)
  const c5 = b.length === 1 && !b[0].horas
  const casos = [
    ['un día entero bloqueado no tiene horas', H.slotsDe(conDia, lunes, []).length === 0],
    ['y dice «no disponible», no «no trabaja» ni «completo»', H.motivoSinHuecos(conDia, lunes) === 'bloqueado'],
    ['el día siguiente, igual que sin bloqueos', JSON.stringify(H.slotsDe(conDia, martes, [])) === JSON.stringify(H.slotsDe(pro, martes, []))],
    ['una hora bloqueada sale ocupada; las demás, como sin bloqueos', (() => {
      const sin = H.slotsDe(pro, lunes, []), con = H.slotsDe(conHoras, lunes, [])
      return con.length === 4 && con.every((x, i) => x.hora === '17:00' ? x.estado === 'ocupada' : x.estado === sin[i].estado)
    })()],
    ['el próximo hueco salta lo bloqueado', H.proximoHueco(conDia, []).fecha !== lunes],
    ['bloquear una hora y volver a tocarla la libera', c1 && c2],
    ['bloquear el día entero', c3],
    ['quitar una hora a un día entero deja «todas menos esa»', c4],
    ['bloquear todas las horas vuelve a ser el día entero', c5],
    ['los bloqueos rotos se ignoran', H.bloqueosValidos([{ fecha: 'mañana' }, { fecha: lunes, horas: ['25:00'] }, null, 'x']).length === 0],
    ['los días pasados se olvidan', H.bloqueosVigentes([{ fecha: '2020-01-01' }, { fecha: lunes }]).map(x => x.fecha).join() === lunes],
    ['sin bloqueos, todo como antes', H.slotsDe(pro, lunes, []).length === 4 && H.bloqueoDe(pro, lunes) === null],
  ]
  for (const [n, ok] of casos) { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} bloqueos: ${n}`) }
}

// ── Bloquear un día con citas confirmadas (2026-10-06) ──
{
  const H = await import(join(stage, 'data/horarios.js'))
  const ahora = new Date(2026, 9, 3, 10, 0)
  const av = (id, fecha, hora, estado = 'aceptada') => ({ id, token: 't' + id, cita_fecha: fecha, cita_hora: hora, cita_estado: estado })
  const avisos = [
    av(1, '2026-10-05', '17:00'), av(2, '2026-10-05', '10:00'), av(3, '2026-10-06', '17:00'),
    av(4, '2026-10-06', '18:00'), av(5, '2026-10-05', '12:00', 'propuesta'), av(6, '2026-10-05', '9:00', 'cancelada'),
    av(7, '2026-10-01', '17:00'), { id: 8, mensaje: 'sin cita' },
  ]
  const bloqueos = [{ fecha: '2026-10-05' }, { fecha: '2026-10-06', horas: ['18:00'] }, { fecha: '2026-10-01' }]
  const af = H.citasAfectadas(bloqueos, avisos, ahora)
  const casos = [
    ['día entero bloqueado: salen sus citas confirmadas, por hora', af.filter(c => c.fecha === '2026-10-05').map(c => c.id).join() === '2,1'],
    ['hora bloqueada: solo la cita de esa hora', af.filter(c => c.fecha === '2026-10-06').map(c => c.id).join() === '4'],
    ['las propuestas, canceladas y pasadas no cuentan', !af.some(c => [5, 6, 7, 8].includes(c.id))],
    ['sin bloqueos, ninguna', H.citasAfectadas([], avisos, ahora).length === 0],
    ['trae el id para poder cancelarla', af.every(c => Number.isInteger(c.id))],
  ]
  for (const [n, ok] of casos) { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} citas y bloqueos: ${n}`) }
}

// ── El profesional se entera de las cancelaciones (2026-10-08) ──
{
  const H = await import(join(stage, 'data/horarios.js'))
  const ahora = new Date(2026, 9, 3, 10, 0)
  const av = (id, fecha, hora, estado, cancela) => ({ id, token: 't' + id, cita_fecha: fecha, cita_hora: hora, cita_estado: estado, cita_cancela: cancela })
  const avisos = [
    av(1, '2026-10-06', '17:00', 'cancelada', 'cliente'), av(2, '2026-10-04', '9:00', 'cancelada', 'cliente'),
    av(3, '2026-10-05', '10:00', 'cancelada', 'profesional'), av(4, '2026-10-01', '17:00', 'cancelada', 'cliente'),
    av(5, '2026-10-05', '12:00', 'aceptada', null), { id: 6, mensaje: 'sin cita' },
  ]
  const n = H.cancelacionesNuevas(avisos, [], ahora)
  const casos = [
    ['las que canceló quien las pidió, en orden de fecha', n.map(c => c.id).join() === '2,1'],
    ['las que canceló él mismo no son novedad', !n.some(c => c.id === 3)],
    ['ni las pasadas, ni las que siguen en pie', !n.some(c => [4, 5, 6].includes(c.id))],
    ['las ya vistas dejan de salir', H.cancelacionesNuevas(avisos, [2], ahora).map(c => c.id).join() === '1' && H.cancelacionesNuevas(avisos, ['1', '2'], ahora).length === 0],
    ['en la agenda, cada cancelada dice quién la canceló', H.agendaDe(avisos, ahora).flatMap(d => d.citas).find(c => c.id === 3)?.cancela === 'profesional'],
  ]
  for (const [nombre, ok] of casos) { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} cancelaciones: ${nombre}`) }
}

// ── Un solo aviso cuando cambian la hora (2026-10-10) ──
{
  const H = await import(join(stage, 'data/horarios.js'))
  const ahora = new Date(2026, 9, 3, 10, 0)
  const avisos = [
    { id: 1, token: 't1', cita_fecha: '2026-10-06', cita_hora: '17:00', cita_estado: 'cancelada', cita_cancela: 'cambio', respuesta: 'Te espero' },
    { id: 2, token: 't2', cita_fecha: '2026-10-08', cita_hora: '16:00', cita_estado: 'propuesta', cita_cambia_de: '2026-10-06 17:00', respuesta: null },
    { id: 3, token: 't3', cita_fecha: '2026-10-09', cita_hora: '10:00', cita_estado: 'propuesta', cita_cambia_de: '2026-10-07 9:00', respuesta: 'Vale' },
    { id: 4, token: 't4', cita_fecha: '2026-10-09', cita_hora: '12:00', cita_estado: 'propuesta', respuesta: null },
  ]
  const cam = H.cambiosNuevos(avisos, [], ahora)
  const casos = [
    ['un cambio sin contestar sale con su hora antigua y la nueva', cam.length === 1 && cam[0].id === 2 && cam[0].antes.fecha === '2026-10-06' && cam[0].antes.hora === '17:00' && cam[0].hora === '16:00'],
    ['la cancelada «por cambio» no sale como cancelación', H.cancelacionesNuevas(avisos, [], ahora).length === 0],
    ['ya contestado, o una propuesta normal, no es un cambio nuevo', !cam.some(c => [3, 4].includes(c.id))],
    ['visto, deja de salir', H.cambiosNuevos(avisos, [2], ahora).length === 0],
    ['en la agenda, la antigua dice que fue por cambio', H.agendaDe(avisos, ahora).flatMap(d => d.citas).find(c => c.id === 1)?.cancela === 'cambio'],
  ]
  for (const [nombre, ok] of casos) { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} cambios de hora: ${nombre}`) }
}

// ── «Tu ciudad»: la elige la persona y ordena sus búsquedas (2026-10-11) ──
{
  const M = await import(join(stage, 'utils/matching.js'))
  const madrid = { id: 1, city: 'Madrid' }, bcn = { id: 2, zone: 'Gràcia' }, online = { id: 3, city: 'Barcelona', online: true }, sinCiudad = { id: 4 }
  const antes = globalThis.localStorage
  const guardado = {}
  globalThis.localStorage = { getItem: k => guardado[k] ?? null, setItem: (k, v) => { guardado[k] = String(v) } }
  const sinElegir = (await M.analyzeNeed('necesito un fontanero')).ciudadElegida
  guardado.nura_user = JSON.stringify({ name: 'Marta', ciudad: 'Madrid' })
  const elegida = (await M.analyzeNeed('necesito un fontanero')).ciudadElegida
  const nombrada = await M.analyzeNeed('necesito un fontanero en Valencia')
  guardado.nura_user = 'esto no es json'
  const rota = (await M.analyzeNeed('necesito un fontanero')).ciudadElegida
  globalThis.localStorage = antes
  const casos = [
    ['sin ciudad elegida, no se ordena por ciudad', sinElegir === null && M.puntosCiudad(bcn, null) === 0],
    ['la ciudad elegida en el perfil llega a la búsqueda', elegida === 'Madrid'],
    ['si la frase nombra otra ciudad, manda la frase', nombrada.ciudad === 'Valencia' && nombrada.ciudadElegida === null],
    ['los de su ciudad y los online suben; los de otra, bajan', M.puntosCiudad(madrid, 'Madrid') > 0 && M.puntosCiudad(online, 'Madrid') > 0 && M.puntosCiudad(bcn, 'Madrid') < 0],
    ['quien no dice su ciudad no sube ni baja', M.puntosCiudad(sinCiudad, 'Madrid') === 0],
    ['un perfil guardado roto no rompe la búsqueda', rota === null],
  ]
  for (const [nombre, ok] of casos) { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} tu ciudad: ${nombre}`) }
}

// El total se contaba sumando los tres catalogos, asi que se quedo en 32
// mientras las pruebas reales llegaban a 51: cada bloque añadido despues
// (obra, agenda, silencios, interceptor, aviso) pasaba sin figurar. Un
// resumen que no cuenta lo que ejecuta es peor que no tener resumen.
console.log(failed === 0 ? `\n✅ SUITE v2 VERDE — ${pasadas}/${pasadas}` : `\n❌ ${failed} FALLOS de ${pasadas + failed}`)
process.exit(failed === 0 ? 0 : 1)
