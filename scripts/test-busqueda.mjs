// ═══════════════════════════════════════════════════════════════════════
// LA BÚSQUEDA, MEDIDA — Nüra
//
// La búsqueda es el núcleo de la app. Esta batería no mira la «categoría»
// (una etiqueta interna), sino lo que ve la persona: QUÉ OFICIO tiene la
// primera recomendación. «reparar altavoces 2.1» devolvía un fontanero:
// la categoría («técnico») era la correcta y la respuesta, absurda.
//
// Corre el buscador REAL (analyzeNeed + matchHelpers) contra una copia de
// los 1008 perfiles de la base (scripts/fixtures/profesionales.json: solo
// oficio, categoría, etiquetas, valoración y zona; sin nombres ni
// contactos). Las peticiones a Supabase se contestan desde esa copia.
//
// Cada frase dice qué oficios son una respuesta correcta (`ok`, sobre el
// oficio sin tildes) y, si no hay nadie de ese oficio en la base, lo marca
// con `falta: true`: entonces vale lo más parecido, pero la app tiene que
// DECIRLO (resultado `aproximado`).
//
// Uso: npm run test:busqueda            (resumen y fallos)
//      npm run test:busqueda -- --todo  (cada frase)
// ═══════════════════════════════════════════════════════════════════════
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const TODO = process.argv.includes('--todo')

// ── El escenario: el código de la app, tal cual ──────────────────────────
const stage = '/tmp/nura-busqueda'
rmSync(stage, { recursive: true, force: true })
mkdirSync(stage, { recursive: true })
cpSync(join(root, 'src/utils'), join(stage, 'utils'), { recursive: true })
cpSync(join(root, 'src/data'), join(stage, 'data'), { recursive: true })
cpSync(join(root, 'src/config.js'), join(stage, 'config.js'))
try { symlinkSync(join(root, 'node_modules'), join(stage, 'node_modules'), 'dir') } catch { /* ya existe */ }
for (const dir of ['utils', 'data']) {
  for (const f of readdirSync(join(stage, dir))) {
    if (!f.endsWith('.js')) continue
    const p = join(stage, dir, f)
    writeFileSync(p, readFileSync(p, 'utf8').replace(/from '(\.\.?\/[^']+?)(?<!\.js)'/g, "from '$1.js'"))
  }
}

// ── Supabase, contestado desde la copia ──────────────────────────────────
const FILAS = JSON.parse(readFileSync(join(root, 'scripts/fixtures/profesionales.json'), 'utf8'))
  .map(r => ({ ...r, name: `Profesional ${r.id}`, bio: '', reviews: 10, services: 10 }))
const sinTildes = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
// ilike de PostgREST: * es cualquier cosa, _ un carácter; sin distinguir mayúsculas.
const ilike = (valor, patron) => new RegExp('^' + patron.split('').map(c =>
  c === '*' ? '.*' : c === '_' ? '.' : c.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('') + '$', 'is')
  .test(String(valor || ''))
function postgrest(url) {
  const u = new URL(url)
  let filas = FILAS
  for (const [k, v] of u.searchParams) {
    if (k === 'category' && v.startsWith('ilike.')) filas = filas.filter(r => ilike(r.category, v.slice(6)))
    else if (k === 'category' && v.startsWith('in.(')) { const s = v.slice(4, -1).split(','); filas = filas.filter(r => s.includes(r.category)) }
    else if (k === 'id' && v.startsWith('eq.')) filas = filas.filter(r => String(r.id) === v.slice(3))
    else if (k === 'or') {
      const conds = v.slice(1, -1).split(/,(?=\w+\.ilike\.)/).map(c => { const [col, , ...p] = c.split('.'); return [col, p.join('.')] })
      filas = filas.filter(r => conds.some(([col, p]) => ilike(r[col], p)))
    }
  }
  if ((u.searchParams.get('order') || '').startsWith('rating.desc')) filas = [...filas].sort((a, b) => b.rating - a.rating)
  const lim = Number(u.searchParams.get('limit') || 1000)
  return filas.slice(0, lim)
}
globalThis.fetch = async (url) => {
  const s = String(url)
  const cuerpo = /\/rest\/v1\/helpers\?/.test(s) ? postgrest(s) : []
  return new Response(JSON.stringify(cuerpo), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

const { analyzeNeed, matchHelpers } = await import(join(stage, 'utils/matching.js'))

// ── Las frases ───────────────────────────────────────────────────────────
// `ok`: expresión sobre el oficio (sin tildes, minúsculas) de la primera
// recomendación. `falta`: en la base no hay nadie de eso; vale lo más
// parecido si la app lo marca como aproximado. `nadie`: ni parecido; lo
// correcto es no recomendar a nadie.
const R = (q, ok, extra = {}) => ({ q, ok, ...extra })
const ELECTRONICA = /electrodomest|electronic|informatic|ordenador|movil|sonido/
const FRASES = [
  // ── Lo que pasó: aparatos y electrónica ──
  R('reparar altavoces 2.1', ELECTRONICA, { falta: true }),
  R('se me ha roto el equipo de música', ELECTRONICA, { falta: true }),
  R('arreglar la tele que no se enciende', ELECTRONICA, { falta: true }),
  R('mi televisor no tiene imagen', ELECTRONICA, { falta: true }),
  R('reparar una consola que no carga', ELECTRONICA, { falta: true }),
  R('la lavadora no centrifuga', /electrodomest/),
  R('el frigorífico no enfría', /electrodomest/),
  R('se ha estropeado el horno', /electrodomest/),
  R('el lavavajillas pierde agua', /electrodomest|fontaner/),
  R('arreglar la secadora', /electrodomest/),
  R('el microondas no calienta', /electrodomest/),
  R('se me ha roto la pantalla del móvil', /movil/),
  R('cambiar la batería del iphone', /movil/),
  R('mi portátil va muy lento', /informatic|ordenador/),
  R('el ordenador no arranca', /informatic|ordenador/),
  R('instalar windows en mi pc', /informatic|ordenador/),
  R('recuperar fotos de un disco duro', /informatic|ordenador/),
  R('tengo un virus en el ordenador', /informatic|ordenador/),
  R('el wifi no llega a mi habitación', /wifi|informatic/),
  R('configurar la impresora', /informatic|ordenador/),
  R('ayuda con el ordenador para mi abuela', /informatic|ordenador/),
  R('me hace falta un informático', /informatic|ordenador/),
  // ── Electricidad ──
  R('se va la luz cuando enciendo el horno', /electricista/),
  R('saltan los plomos', /electricista/),
  R('instalar una lámpara en el techo', /electricista|manitas/),
  R('cambiar un enchufe', /electricista/),
  R('necesito un electricista urgente', /electricista/),
  R('boletín eléctrico para el piso', /electricista/),
  R('poner puntos de luz en el salón', /electricista/),
  R('no hay corriente en la cocina', /electricista/),
  // ── Fontanería ──
  R('tengo una fuga de agua en el baño', /fontaner/),
  R('el váter está atascado', /fontaner/),
  R('gotea el grifo', /fontaner/),
  R('cambiar el grifo de la cocina', /fontaner/),
  R('desatascar el fregadero', /fontaner/),
  R('no sale agua caliente', /fontaner|calder|calefacc|gas/),
  R('fontanero', /fontaner/),
  R('fontanro urgente', /fontaner/),
  R('instalar un plato de ducha', /fontaner|albanil/),
  R('el termo no calienta', /calder|calefacc|fontaner|electrodomest/),
  // ── Calefacción, gas, clima ──
  R('la caldera no enciende', /calder|calefacc/),
  R('revisión de la caldera', /calder|calefacc|gas/),
  R('los radiadores no calientan', /calder|calefacc/),
  R('huele a gas', /gas/),
  R('instalar aire acondicionado', /aire|climatiz/),
  R('el aire acondicionado no enfría', /aire|climatiz/),
  R('mantenimiento del split', /aire|climatiz/),
  // ── Cerrajería, puertas, persianas ──
  R('me he quedado fuera de casa', /cerraj/),
  R('cambiar la cerradura', /cerraj/),
  R('he perdido las llaves', /cerraj/),
  R('la persiana no sube', /persiana/),
  R('arreglar la cinta de la persiana', /persiana/),
  R('poner estores en el salón', /persiana|estor/),
  // ── Obras, pintura, carpintería, montaje ──
  R('pintar el piso', /pintor/),
  R('necesito que alguien me pinte el piso', /pintor/),
  R('quitar gotelé', /pintor/),
  R('tengo humedad en la pared', /albanil|pintor|fontaner/),
  R('reformar el baño', /albanil|reforma|arquitect/),
  R('alicatar la cocina', /albanil/),
  R('hacer una reforma integral', /arquitect|albanil|aparejador/),
  R('montar un armario de ikea', /montador|montaje|manitas/),
  R('colgar unos cuadros y estanterías', /manitas|montador/),
  R('arreglar una puerta que no cierra', /carpinter|manitas|cerraj/),
  R('hacer un mueble a medida', /carpinter/),
  R('un armario empotrado a medida', /carpinter/),
  R('necesito un manitas', /manitas/),
  R('arquitecto para ampliar la casa', /arquitect/),
  R('certificado energético', /arquitect|aparejador/),
  R('diseño de interiores para mi salón', /interior|decorador/),
  // ── Limpieza, casa ──
  R('limpiar mi casa', /limpieza/),
  R('limpieza a fondo después de una obra', /post-obra|limpieza/),
  R('limpiar los cristales', /cristales|limpieza/),
  R('que me planchen la ropa', /plancha/),
  R('ordenar los armarios', /organizacion|konmari/),
  R('limpieza de oficina', /oficinas/),
  R('alguien que venga a limpiar dos horas por semana', /limpieza/),
  R('cocinero a domicilio para una cena', /cociner/),
  R('busco quien me haga la comida', /cociner/),
  R('mudarme el sábado', null, { nadie: true }),
  R('cortar el césped y podar', /jardin|paisaj/),
  R('arreglar la terraza con plantas', /jardin|paisaj/),
  // ── Cuidado de personas ──
  R('cuidar a mi madre con alzheimer', /alzheimer|mayores|geriatr/),
  R('alguien que acompañe a mi padre por las noches', /nocturna|mayores|geriatr|domicilio/),
  R('cuidadora para mi abuela', /mayores|geriatr|domicilio|alzheimer|cuidadora/),
  R('canguro para mis hijos', /canguro|ninera/),
  R('niñera los viernes por la tarde', /ninera|canguro/),
  R('cuidar a mi hijo de 3 años', /canguro|ninera/),
  R('mi padre sale del hospital tras una operación', /post-operatorio|enfermer/),
  R('enfermera para poner inyecciones en casa', /enfermer/),
  R('ayuda para una persona en silla de ruedas', /discapacidad|domicilio|geriatr/),
  // ── Mascotas ──
  R('pasear a mi perro', /paseador/),
  R('cuidar a mi gato en vacaciones', /felina|pet sitter|mascotas/),
  R('mi perro muerde', /adiestr|educacion cachorros/),
  R('educar a un cachorro', /cachorros|adiestr/),
  R('bañar y cortar el pelo al perro', /grooming|peluquera canina/),
  R('veterinario a domicilio', /veterinari/),
  R('mi perro está enfermo', /veterinari/),
  // ── Salud: psicología ──
  R('tengo ansiedad', /psicolog|cognitivo/),
  R('estoy pasando una mala racha y necesito hablar con alguien', /psicolog|cognitivo|terapeuta/),
  R('psicólogo para mi hijo adolescente', /infanto|infantil/),
  R('terapia de pareja', /pareja/),
  R('estoy quemado en el trabajo', /burnout|laboral/),
  R('depresión posparto', /perinatal/),
  R('tengo un trauma y me han hablado del emdr', /trauma|emdr/),
  R('psiquiatra', /psiquiatr/),
  R('evaluación neuropsicológica', /neuropsicolog/),
  // ── Salud: fisio, cuerpo ──
  R('me duele la espalda', /fisio|osteopat|masaj|quiromasaj/),
  R('fisio para una lesión de rodilla jugando al fútbol', /fisioterapeuta deportiva|fisio/),
  R('rehabilitación después de una operación de cadera', /rehabilitacion|fisio/),
  R('masaje relajante a domicilio', /masaj/),
  R('suelo pélvico después del parto', /suelo pelvico/),
  R('acupuntura', /acupuntura/),
  R('osteópata', /osteopat/),
  R('fisioterapia para mi bebé', /fisioterapeuta pediatrica/),
  // ── Salud: médicos y nutrición ──
  R('pediatra para mi bebé', /pediatra/),
  R('médico a domicilio', /medica|medico/),
  R('dermatólogo por una mancha en la piel', /dermatolog/),
  R('ginecóloga', /ginecolog/),
  R('nutricionista para perder peso', /nutri|dietista|peso|obesidad/),
  R('quiero adelgazar', /nutri|dietista|peso|obesidad|entrenador/),
  R('dieta vegana equilibrada', /vegan|nutri/),
  R('mi hija tiene anorexia', /alimentarios/),
  R('revisión del corazón', /cardiolog/),
  // ── Logopedia ──
  R('logopeda', /logoped/),
  R('mi hijo no pronuncia la r', /logoped/),
  R('mi hijo tartamudea', /tartamudez|logoped/),
  R('logopeda para mi padre tras un ictus', /neurologica|adultos|logoped/),
  R('me quedo afónica al dar clase', /voz|logoped/),
  R('mi hijo tiene autismo y no habla', /tea|logoped/),
  R('problemas para tragar', /disfagia/),
  // ── Deporte ──
  R('entrenador personal', /entrenador/),
  R('quiero ponerme en forma', /entrenador|musculacion|crossfit|funcional/),
  R('clases de yoga', /yoga/),
  R('pilates', /pilates/),
  R('aprender a nadar', /natacion/),
  R('preparar una maratón', /running|trail/),
  R('ejercicio para personas mayores', /mayores|adaptado/),
  R('clases de pádel', /padel/),
  R('meditación para dormir mejor', /meditacion|mindfulness/),
  // ── Clases ──
  R('clases de matemáticas para mi hijo de la eso', /matematicas/),
  R('mi hijo ha suspendido física', /fisica/),
  R('clases de inglés', /ingles/),
  R('aprender alemán', /aleman/),
  R('clases de piano', /piano/),
  R('aprender a tocar la guitarra', /guitarra/),
  R('preparar selectividad', /ebau|selectividad/),
  R('aprender a programar en python', /programacion|python/),
  R('clases de dibujo', /dibujo/),
  R('preparar unas oposiciones', /oposiciones/),
  R('clases de chino', /chino/),
  R('refuerzo de lengua', /lengua/),
  // ── Legal y gestiones ──
  R('me quiero divorciar', /familia|divorcio/),
  R('me han despedido', /laboralista/),
  R('papeles para la residencia', /extranjeria/),
  R('mi casero no me devuelve la fianza', /arrendamientos/),
  R('herencia de mi padre', /herencias|sucesiones/),
  R('hacer la declaración de la renta', /fiscal|gestor|contable/),
  R('darme de alta de autónomo', /gestor|fiscal|contable/),
  R('montar una empresa', /mercantil|gestor/),
  R('me han puesto una multa', /administrativo/),
  R('abogado penal', /penal/),
  // ── Diseño, web, tecnología ──
  R('diseñar un logo para mi negocio', /grafic/),
  R('hacer una página web', /web/),
  R('quiero montar una tienda online', /web|apps/),
  R('hacer una app', /apps/),
  R('fotógrafo para una boda', /fotograf/),
  R('grabar un vídeo para mi empresa', /video/),
  R('llevar las redes sociales de mi restaurante', /community/),
  R('posicionar mi web en google', /seo/),
  R('usar inteligencia artificial en mi empresa', /\bia\b/),
  // ── Eventos ──
  R('mago para un cumpleaños infantil', /mago|animadora/),
  R('dj para una fiesta', /dj/),
  R('organizar mi boda', /wedding/),
  R('animación para la fiesta de mi hija', /animadora|mago/),
  // ── Coche ──
  R('mi coche hace un ruido raro', /mecanic/),
  R('limpiar el coche por dentro', /limpieza de vehiculos|detailing/),
  R('la batería del coche está muerta', /electricidad del automovil|mecanic/),
  // ── Idiomas ──
  R('traducir un documento del árabe', /arabe/),
  R('intérprete para una reunión', /interprete/),
  R('guía para enseñar Barcelona a unos amigos', /guia/),
  // ── Catalán y faltas ──
  R('necessito un lampista', /fontaner/),
  R('busco un electricista a gràcia', /electricista/),
  R('sicologa', /psicolog/),
  R('logopeta para mi hijo', /logoped/),
]

// ── La medición ──────────────────────────────────────────────────────────
let bien = 0, bienTop3 = 0
const fallos = []
for (const f of FRASES) {
  const a = await analyzeNeed(f.q)
  let r = []
  try { r = (await matchHelpers(a, 4)) || [] } catch (e) { r = []; a.__error = e.message }
  const esp = r.map(h => sinTildes(h.specialty))
  const primero = esp[0] || '(nadie)'
  const aproximado = Boolean(r.aproximado || r[0]?.__aproximado)
  // `nadie`: no hay nadie de eso ni parecido; lo correcto es no inventar.
  let acierto = f.nadie ? r.length === 0 : f.ok.test(primero)
  // Si no hay nadie de ese oficio, lo parecido solo vale si se dice.
  if (f.falta && acierto && !aproximado) acierto = false
  if (acierto) bien++
  if (f.nadie ? r.length === 0 : esp.slice(0, 3).some(e => f.ok.test(e))) bienTop3++
  const linea = `${acierto ? '✓' : '✗'} «${f.q}» → ${primero}${aproximado ? ' (aproximado)' : ''}${esp.length > 1 ? ` · luego: ${esp.slice(1, 3).join(', ')}` : ''}`
  if (!acierto) fallos.push(linea)
  if (TODO) console.log(linea)
}
if (!TODO) for (const l of fallos) console.log(l)
const pct = x => Math.round(100 * x / FRASES.length)
console.log(`\nPrimera recomendación correcta: ${bien}/${FRASES.length} (${pct(bien)}%) · alguna correcta entre las 3 primeras: ${bienTop3}/${FRASES.length} (${pct(bienTop3)}%)`)
const minimo = Number(process.env.NURA_BUSQUEDA_MIN || 0)
if (pct(bien) < minimo) { console.log(`✗ Por debajo del mínimo (${minimo}%)`); process.exit(1) }
