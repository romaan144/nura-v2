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
//      npm run test:busqueda -- --ver "frase"  (quién sale y con cuántos puntos)
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
// NURA_SRC: medir otra versión del buscador (por ejemplo, la publicada) con las mismas frases.
const src = process.env.NURA_SRC || join(root, 'src')
cpSync(join(src, 'utils'), join(stage, 'utils'), { recursive: true })
cpSync(join(src, 'data'), join(stage, 'data'), { recursive: true })
cpSync(join(src, 'config.js'), join(stage, 'config.js'))
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
  // Visto por Codex en la app: salía una médica internista, y luego el psicólogo infantil.
  R('Busco psicólogo para mí en Barcelona', /^(?!.*infant).*(psicolog|cognitiv)/),
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

// ── FRASES NUEVAS (2026-09-29) ─────────────────────────────────────────────
// Escritas DESPUÉS de construir data/oficios.js y sin mirarlo, como las
// escribiría la gente: largas, con faltas, coloquiales o en catalán. Miden
// si la comprensión generaliza o solo se sabe las frases de arriba.
const E = /electrodomest|electronic|informatic|ordenador|movil|sonido/
const NUEVAS = [
  R('hola, mi barra de sonido de la tele ha dejado de sonar', E, { falta: true }),
  R('la play no lee los discos', E, { falta: true }),
  R('se me ha mojado el portatil y no enciende', /informatic|ordenador/),
  R('necesito a alguien que me instale el router nuevo que me ha mandado movistar', /wifi|informatic/),
  R('no me funciona internet en casa', /wifi|informatic/),
  R('se me ha caido el movil al agua', /movil/),
  R('mi lavadora hace un ruido muy fuerte al centrifugar', /electrodomest/),
  R('la nevera hace hielo por dentro y no enfria bien', /electrodomest/),
  R('el horno no calienta por abajo', /electrodomest/),
  R('se ha fundido la luz de todo el piso', /electricista/),
  R('me da calambre la lavadora', /electricista|electrodomest/),
  R('quiero poner un enchufe nuevo en la terraza', /electricista/),
  R('el diferencial salta todo el rato', /electricista/),
  R('la ducha no tiene presion', /fontaner/),
  R('hay agua en el suelo debajo del fregadero', /fontaner/),
  R('la cisterna no para de cargar', /fontaner/),
  R('huele a desague en el baño', /fontaner/),
  R('tengo una mancha de humedad en el techo del vecino de arriba', /fontaner|albanil|pintor/),
  R('se me ha roto la llave dentro de la cerradura', /cerraj/),
  R('quiero cambiar el bombin por seguridad', /cerraj/),
  R('la caldera pierde presion', /calder|calefacc/),
  R('en casa hace mucho frio y los radiadores estan tibios', /calder|calefacc/),
  R('el aire gotea agua dentro de casa', /aire|climatiz/),
  R('instalar un split en el dormitorio', /aire|climatiz/),
  R('la persiana del salon se ha caido', /persiana/),
  R('pintar dos habitaciones de blanco', /pintor/),
  R('se me ha caido un trozo de techo del baño', /albanil/),
  R('cambiar los azulejos de la cocina', /albanil/),
  R('hacer una estanteria de madera a medida para el salon', /carpinter/),
  R('la puerta del armario se ha descolgado', /carpinter|manitas|montador/),
  R('montar una cama y un armario de ikea', /montador|montaje|manitas/),
  R('colgar la tele en la pared', /manitas|montador|electricista/, { alt: E }),
  R('arreglar el jardin de la casa del pueblo', /jardin|paisaj/),
  R('regar mis plantas cuando estoy de vacaciones', /jardin|paisaj/),
  R('alguien que me limpie la casa los lunes', /limpieza/),
  R('dejar el piso limpio para entregarlo al casero', /limpieza/),
  R('limpiar las ventanas de mi local', /cristales|oficinas|limpieza/),
  R('necesito que me hagan la comida para toda la semana', /cociner/),
  R('mi abuelo tiene demencia y no se puede quedar solo', /alzheimer|mayores|geriatr|domicilio|cuidadora/),
  R('busco una señora que cuide a mi madre por las mañanas', /mayores|geriatr|domicilio|cuidadora|alzheimer|nocturna/),
  R('mi madre se ha roto la cadera y necesita ayuda en casa', /post-operatorio|mayores|geriatr|domicilio|cuidadora|rehabilitacion|fisio/),
  R('alguien que se quede con los niños el sabado por la noche', /canguro|ninera/),
  R('recoger a mi hija del cole y quedarse hasta que llegue', /canguro|ninera/),
  R('cuidar a mi bebe de 8 meses', /canguro|ninera/),
  R('mi perro tiene diarrea desde ayer', /veterinari/),
  R('mi gato no come nada', /veterinari/),
  R('mi perro tira mucho de la correa y ladra a otros perros', /adiestr|cachorros/),
  R('alguien que saque a mi perro a mediodia', /paseador/),
  R('me voy de viaje y necesito que alguien cuide a mis gatos', /felina|pet sitter|mascotas/),
  R('llevo meses sin dormir bien y con ataques de ansiedad', /psicolog|cognitivo/),
  R('mi hijo adolescente no quiere ir al instituto y esta muy raro', /infanto|infantil|psicolog/),
  R('mi pareja y yo discutimos todo el rato', /pareja/),
  R('perdi a mi padre hace poco y no levanto cabeza', /psicolog|cognitivo/),
  R('me duele mucho el cuello de estar con el ordenador', /fisio|osteopat|masaj/),
  R('me he torcido el tobillo jugando a baloncesto', /fisio/),
  R('tengo ciatica', /fisio|osteopat/),
  R('quiero un masaje para las contracturas', /masaj|fisio/),
  R('tengo perdidas de orina desde que di a luz', /suelo pelvico/),
  R('mi bebe tiene fiebre y tos', /pediatra/),
  R('me ha salido un lunar raro en la espalda', /dermatolog/),
  R('tengo acne y no se me quita', /dermatolog/),
  R('me duelen las articulaciones de las manos por las mañanas', /reumatolog/),
  R('quiero comer mas sano pero no se por donde empezar', /nutri|dietista/),
  R('me sobran 15 kilos', /nutri|dietista|peso|obesidad|entrenador/),
  R('mi hija de 4 años habla muy poco para su edad', /logoped/),
  R('mi hijo dice "tasa" en vez de "taza"', /logoped/),
  R('se me cansa la voz cuando doy clases', /voz|logoped/),
  R('mi padre tuvo un ictus y le cuesta hablar', /neurologica|adultos|logoped/),
  R('quiero ganar musculo', /entrenador|musculacion|crossfit/),
  R('clases de yoga en casa', /yoga/),
  R('mi hija quiere aprender a nadar este verano', /natacion/),
  R('quiero correr mi primera media maraton', /running|trail/),
  R('mi hijo va fatal en mates', /matematicas/),
  R('necesito aprobar el first de ingles', /ingles/),
  R('mi hija tiene recuperacion de quimica en septiembre', /fisica|quimica/),
  R('quiero aprender a tocar el piano de mayor', /piano/),
  R('preparar el examen de acceso a la universidad', /ebau|selectividad/),
  R('quiero separarme y tenemos dos hijos', /familia|divorcio/),
  R('mi empresa no me paga las horas extra', /laboralista/),
  R('necesito renovar el nie', /extranjeria/),
  R('el propietario me quiere echar del piso', /arrendamientos/),
  R('mi madre ha muerto y no se como hacer la herencia', /herencias|sucesiones/),
  R('me ha llegado una carta de hacienda', /fiscal|gestor|contable/),
  R('quiero hacerme autonomo', /gestor|fiscal|contable/),
  R('me han multado con el coche y quiero recurrir', /administrativo/),
  R('necesito un logo y unas tarjetas para mi peluqueria', /grafic/),
  R('quiero una web para mi restaurante', /web/),
  R('fotos profesionales para mi linkedin', /fotograf/),
  R('editar los videos de mi canal de youtube', /video/),
  R('que alguien me lleve el instagram del negocio', /community/),
  R('quiero salir primero en google cuando buscan fisioterapia en gracia', /seo/),
  R('un dj para la boda de mi hermana', /dj/),
  R('animacion para el cumple de mi hijo de 6 años', /animador|mago/),
  R('el coche pierde aceite', /mecanic/),
  R('el coche no arranca y hace clic clic', /electricidad del automovil|mecanic/),
  R('traducir mi titulo universitario al ingles para trabajar fuera', /traduct/),
  R('una guia que hable ingles para unos clientes', /guia|interprete/),
  R('em cal un electricista', /electricista/),
  R('tinc una fuita d aigua a la cuina', /fontaner/),
  R('busco una cangur per als nens', /canguro|ninera/),
  R('necesito un fontanerro ya', /fontaner/),
  R('electrisista para cambiar un enchufe', /electricista/),
  R('sicologo infantil', /infanto|infantil/),
]

// ── TERCERA TANDA (2026-09-29) ─────────────────────────────────────────────
// Escrita tras corregir las dos anteriores y medida UNA vez antes de tocar
// nada: es la cifra honesta de cuánto generaliza. Luego queda como las demás.
const TERCERA = [
  R('mi microondas echa chispas', /electrodomest/),
  R('la tele se apaga sola', E, { falta: true }),
  R('no me carga el movil, creo que es el conector', /movil/),
  R('el ordenador se calienta mucho y se apaga', /informatic|ordenador/),
  R('pasar las fotos del movil al ordenador', /informatic|ordenador|movil/),
  R('me han hackeado el correo', /informatic|ordenador/),
  R('poner una lampara en el pasillo', /electricista|manitas/),
  R('los enchufes de la cocina no funcionan', /electricista/),
  R('el grifo del lavabo gotea toda la noche', /fontaner/),
  R('el agua del lavabo no baja', /fontaner/),
  R('cambiar el termo electrico', /calder|calefacc|fontaner|electrodomest|electricista/),
  R('hace un ruido raro la caldera', /calder|calefacc/),
  R('la puerta de casa no abre con la llave', /cerraj/),
  R('quiero poner una puerta blindada', /cerraj|carpinter/),
  R('arreglar las grietas de la pared del salon', /albanil|pintor/),
  R('pintar la fachada de la casa', /pintor/),
  R('lacar las puertas de casa', /pintor|carpinter/),
  R('montar el mueble del tv', /montador|montaje|manitas/),
  R('poner un toldo en el balcon', /persiana/),
  R('podar un olivo', /jardin|paisaj/),
  R('limpieza despues de una fiesta en casa', /limpieza/),
  R('alguien para planchar las camisas de mi marido', /plancha/),
  R('mi padre no puede ducharse solo', /mayores|geriatr|domicilio|cuidadora|discapacidad/),
  R('necesito a alguien que duerma con mi abuela', /nocturna|mayores|geriatr|cuidadora/),
  R('curar una herida de mi madre en casa', /enfermer/),
  R('una canguro que hable ingles con mis hijos', /canguro|ninera/),
  R('mi perra esta vomitando', /veterinari/),
  R('mi cachorro se hace pis en casa', /adiestr|cachorros/),
  R('cortar las uñas a mi perro', /grooming|peluquera canina|veterinari/),
  R('tengo panico a volar', /psicolog|cognitivo/),
  R('me cuesta mucho relacionarme con la gente', /psicolog|cognitivo/),
  R('mi hijo de 7 años tiene rabietas muy fuertes', /infanto|infantil/),
  R('estoy embarazada y muy nerviosa', /perinatal|psicolog/),
  R('tengo lumbago', /fisio|osteopat/),
  R('rehabilitacion de hombro despues de una luxacion', /fisio|rehabilitacion/),
  R('me mareo cuando me levanto', /medic/),
  R('tengo el colesterol alto', /cardiolog|nutri|medic/),
  R('quiero adelgazar sin pasar hambre', /nutri|dietista|peso|obesidad/),
  R('dieta para correr una maraton', /nutri|dietista|running/),
  R('mi hijo come fatal', /nutri|pediatr/),
  R('mi abuela se atraganta al comer', /disfagia|logoped/),
  R('tartamudeo cuando estoy nervioso', /tartamudez|logoped/),
  R('estiramientos para mayores', /mayores|adaptado|fisio|entrenador|yoga|pilates/),
  R('quiero hacer ejercicio en casa con alguien', /entrenador/),
  R('mejorar mi tiempo en 10k', /running|trail/),
  R('clases de refuerzo de matematicas de 2 de la eso', /matematicas/),
  R('mi hija tiene que aprender a hacer comentarios de texto', /lengua/),
  R('aprender frances para un viaje', /frances/),
  R('clases de guitarra electrica', /guitarra/),
  R('aprender python para analisis de datos', /programacion|python/),
  R('me quieren despedir estando de baja', /laboralista/),
  R('no me pagan la pension de mis hijos', /familia|divorcio/),
  R('mi vecino me ha denunciado', /penal/),
  R('quiero hacer testamento', /herencias|sucesiones/),
  R('el inquilino no me paga', /arrendamientos/),
  R('llevar la contabilidad de mi tienda', /contable|gestor|fiscal/),
  R('diseñar la carta de mi restaurante', /grafic/),
  R('necesito una app para reservas de mi gimnasio', /apps|web/),
  R('fotografo para la comunion de mi hija', /fotograf/),
  R('hacer un video promocional de mi empresa', /video/),
  R('quiero automatizar mi negocio con inteligencia artificial', /\bia\b/),
  R('magia para una cena de empresa', /mago/),
  R('la moto hace un ruido al frenar', /mecanic/),
  R('lavar la tapiceria del coche', /limpieza de vehiculos|detailing/),
  R('interprete de arabe para el medico', /interprete|arabe/),
  R('traducir una carta del chino', /chino|traduct/),
  R('em cal algu que cuidi la meva mare', /mayores|geriatr|domicilio|cuidadora|alzheimer/),
  R('classes de mates per al meu fill', /matematicas/),
  R('pintor per pintar el pis', /pintor/),
  R('fisioterapueta para la espalda', /fisio/),
]

// ── Ver una frase por dentro: npm run test:busqueda -- --ver "frase" ─────
const iVer = process.argv.indexOf('--ver')
if (iVer > 0) {
  const q = process.argv[iVer + 1]
  const a = await analyzeNeed(q)
  console.log('oficios:', a.oficios, '· categoría:', a.categoria)
  for (const h of (await matchHelpers(a, 8)) || []) console.log(`  ${Math.round(h.score)}  ${h.specialty} (${h.category}, ${h.rating})${h.__aproximado ? ' aproximado' : ''}`)
  process.exit(0)
}

// ── La medición ──────────────────────────────────────────────────────────
async function medir(nombre, frases) {
let bien = 0, bienTop3 = 0
const fallos = []
for (const f of frases) {
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
const pct = x => Math.round(100 * x / frases.length)
console.log(`${nombre}: primera recomendación correcta ${bien}/${frases.length} (${pct(bien)}%) · alguna correcta entre las 3 primeras ${bienTop3}/${frases.length} (${pct(bienTop3)}%)\n`)
return pct(bien)
}
const p1 = await medir('Frases de construcción', FRASES)
const p2 = await medir('Frases nuevas', NUEVAS)
const p3 = await medir('Tercera tanda', TERCERA)
// Mínimos: si una mejora baja de aquí, se ha roto algo que ya funcionaba.
const MIN1 = Number(process.env.NURA_BUSQUEDA_MIN || 0), MIN2 = Number(process.env.NURA_BUSQUEDA_MIN_NUEVAS || 0)
if (p1 < MIN1 || p2 < MIN2 || p3 < MIN2) { console.log(`✗ Por debajo del mínimo (${MIN1}% / ${MIN2}%)`); process.exit(1) }
