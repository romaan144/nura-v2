// ── FEED GENERATOR ────────────────────────────────────────────────────────
// Genera posts dinámicos y ricos desde datos reales de profesionales.
// Determinístico por día — el feed cambia cada día pero es consistente.

const DAY_MS = 24 * 60 * 60 * 1000

function daysSeed() {
  return Math.floor(Date.now() / DAY_MS)
}

function seededRandom(seed, i = 0) {
  const x = Math.sin(seed * 9301 + i * 49297 + 233720) * 10000
  return x - Math.floor(x)
}

function pickRandom(arr, seed, i = 0) {
  return arr[Math.floor(seededRandom(seed, i) * arr.length)]
}

// ── POST TEMPLATES POR CATEGORÍA ─────────────────────────────────────────
const TEMPLATES = {
  logopedia: [
    (h) => `Hoy hemos cerrado el proceso de intervención con un niño de 6 años. Después de meses de trabajo, ya articula con claridad los fonemas que antes le costaban. Momentos como este son el motor de este trabajo.`,
    (h) => `La logopedia no es solo hablar. Es comunicar, conectar y entenderse. Esta semana hemos trabajado con tres familias nuevas en ${h.zone || 'Barcelona'}. Cada historia es única.`,
    (h) => `Recuerdo por qué elegí esta profesión cada vez que veo el avance de un paciente. No hay mejor recompensa que ver a alguien ganar confianza en su propia voz.`,
  ],
  tecnico: [
    (h) => `Avería resuelta en tiempo récord en ${h.zone || 'Barcelona'}. Caldera que llevaba semanas fallando — diagnosticada y reparada en 90 minutos. La clave está en la experiencia y en llevar siempre el material necesario.`,
    (h) => `Esta semana: 4 instalaciones de climatización, 2 reparaciones urgentes y un mantenimiento preventivo que evitó una avería mayor. El trabajo en casa requiere atención al detalle.`,
    (h) => `Un consejo profesional: el mantenimiento preventivo cuesta un 80% menos que la reparación de emergencia. Esta semana he visto casos que se podrían haber evitado fácilmente.`,
  ],
  limpieza: [
    (h) => `Limpieza a fondo completada en ${h.zone || 'Barcelona'}. Cuando un espacio queda impecable, no solo cambia el ambiente — cambia el estado de ánimo de quien vive en él.`,
    (h) => `Trabajo hoy con productos ecológicos en un piso familiar. Limpiar con responsabilidad no significa limpiar peor — significa limpiar mejor y más seguro para todos.`,
    (h) => `La puntualidad y la discreción son tan importantes como la limpieza en sí. Esta semana he trabajado en 6 hogares diferentes y en cada uno me adapto a las necesidades de la familia.`,
  ],
  cuidado: [
    (h) => `Acompañé hoy a Carmen, 84 años, en su revisión médica. No tenía a nadie que pudiera llevarla. Esos momentos me recuerdan que este trabajo va mucho más allá del cuidado físico.`,
    (h) => `El cuidado de personas mayores requiere paciencia, empatía y mucha presencia. Esta semana: tres familias en ${h.zone || 'Barcelona'} que han podido descansar sabiendo que sus mayores están bien atendidos.`,
    (h) => `No es solo asistencia. Es compañía, es escucha, es presencia. Hoy cumplió años una de las personas a las que cuido y el brillo en sus ojos no tiene precio.`,
  ],
  entrenador: [
    (h) => `Primera sesión de evaluación completada con un nuevo cliente. Partimos de cero, pero con un objetivo claro. Lo más importante no es donde empiezas — es hacia donde vas.`,
    (h) => `Semana intensa de entrenamiento en ${h.zone || 'Barcelona'}. Ver la evolución de mis clientes en los últimos meses es la mejor motivación para seguir dando el 100%.`,
    (h) => `El entrenamiento personal no es solo ejercicio. Es disciplina, constancia y mentalidad. Esta semana uno de mis clientes bajó su marca personal. Sin palabras.`,
  ],
  matematicas: [
    (h) => `Clase de refuerzo completada con un estudiante de 2º de bachillerato. Llevaba meses bloqueado con las derivadas. Hoy lo entendió todo. Eso es lo que hace que esto valga la pena.`,
    (h) => `La matemática no es difícil — la enseñanza habitual la hace difícil. Con el método adecuado y paciencia, cualquier alumno puede avanzar. Esta semana lo demostré en ${h.zone || 'Barcelona'}.`,
    (h) => `Temporada de exámenes a la vista. Si tu hijo o hija necesita refuerzo en matemáticas, física o ciencias, estoy disponible. La constancia hace la diferencia.`,
  ],
  salud: [
    (h) => `Sesión de seguimiento completada. Ver la evolución de pacientes a lo largo de semanas es el mejor indicador de que el trabajo está dando frutos.`,
    (h) => `La salud no es un lujo — es una inversión. Hoy he trabajado con tres personas en ${h.zone || 'Barcelona'} que han decidido tomar el control de su bienestar. Eso merece todo el respeto.`,
    (h) => `El acompañamiento profesional marca la diferencia. No solo en resultados — en motivación, en constancia y en calidad de vida. Esta semana ha sido muy gratificante.`,
  ],
  legal: [
    (h) => `Caso cerrado favorablemente para el cliente. El derecho es complejo, pero con la orientación adecuada los resultados son posibles. La información es el primer paso para defenderse.`,
    (h) => `Consulta completada esta mañana. Muchas personas no saben que tienen derechos que pueden ejercer fácilmente. Asesorar es también empoderar.`,
    (h) => `La prevención legal cuesta mucho menos que el litigio. Esta semana he ayudado a dos familias en ${h.zone || 'Barcelona'} a evitar problemas que podrían haberse complicado mucho.`,
  ],
  mascotas: [
    (h) => `Paseo completado con tres perros esta mañana en ${h.zone || 'Barcelona'}. El tiempo que los dueños no pueden darles, nosotros lo compensamos con atención y cariño.`,
    (h) => `La relación entre un perro y su cuidador se construye con confianza y consistencia. Esta semana un nuevo cliente ya confía en mí para dejarme su compañero de vida.`,
    (h) => `Sesión de adiestramiento positivo completada. Sin castigos, sin gritos — solo refuerzo, paciencia y resultados reales. Los animales responden cuando se les trata con respeto.`,
  ],
  hogar: [
    (h) => `Reforma de cocina completada en ${h.zone || 'Barcelona'}. Ver la cara del cliente cuando entra al espacio transformado es la mejor recompensa de este trabajo.`,
    (h) => `Pequeña avería en el hogar que podría haberse convertido en grande. La intervención a tiempo lo evitó. El hogar necesita atención como cualquier otra cosa.`,
    (h) => `Trabajo de hoy: instalación, pintura y pequeñas reparaciones en un piso de alquiler. Cuando el espacio queda bien, todo el mundo gana.`,
  ],
  otro: [
    (h) => `Otra semana de trabajo en ${h.zone || 'Barcelona'}. Cada proyecto es diferente y cada cliente tiene sus propias necesidades. Adaptarse es parte del trabajo.`,
    (h) => `La profesionalidad no es solo técnica — es puntualidad, comunicación y responsabilidad. Esta semana he podido demostrarlo una vez más.`,
    (h) => `Cuando ayudas a alguien a resolver un problema real, el agradecimiento es genuino. Eso es lo que da sentido a este trabajo cada día.`,
  ],
}

function getTemplate(helper, index) {
  const cat = helper.category || 'otro'
  const templates = TEMPLATES[cat] || TEMPLATES.otro
  const seed = daysSeed()
  const tmpl = templates[Math.floor(seededRandom(seed + helper.id, index) * templates.length)]
  return tmpl ? tmpl(helper) : null
}

// ── TIPOS DE POST ────────────────────────────────────────────────────────
function makeCasePost(helper, index) {
  const text = getTemplate(helper, index)
  if (!text) return null
  return {
    id: `case_${helper.id}_${daysSeed()}`,
    type: 'work',
    text,
    date: pickRandom(['Hace 1 día', 'Hace 2 días', 'Hace 3 días', 'Esta semana'], daysSeed(), index),
    likes: Math.floor(seededRandom(daysSeed(), helper.id + 1) * 40) + 8,
    comments: Math.floor(seededRandom(daysSeed(), helper.id + 2) * 10) + 1,
    author: helper,
    authorType: 'helper',
    suggested: true,
    dynamic: true,
  }
}

function makeAvailabilityPost(helper, index) {
  if (!helper.available) return null
  const TEXTS = [
    `Tengo huecos disponibles esta semana en ${helper.zone || 'Barcelona'}. Si llevas tiempo buscando ${helper.specialty?.toLowerCase() || 'un profesional'}, ahora es el momento.`,
    `Disponible para nuevos clientes. Primera consulta sin compromiso. Escríbeme.`,
    `Esta semana tengo agenda libre. Si necesitas ${helper.specialty?.toLowerCase() || 'ayuda profesional'} en ${helper.zone || 'Barcelona'}, hablamos.`,
    `Acabo de liberar tiempo para nuevos proyectos. ${helper.specialty || 'Profesional'} disponible.`,
  ]
  const seed = daysSeed()
  return {
    id: `avail_${helper.id}_${seed}`,
    type: 'availability',
    text: pickRandom(TEXTS, seed, index),
    date: 'Hoy',
    likes: Math.floor(seededRandom(seed, helper.id) * 15) + 2,
    comments: Math.floor(seededRandom(seed, helper.id + 1) * 4),
    badge: '🟢 Disponible esta semana',
    author: helper,
    authorType: 'helper',
    suggested: true,
    dynamic: true,
  }
}

function makeNewHelperPost(helper) {
  if (!helper.specialty) return null
  const name = helper.name?.split(' ')?.[0] || 'Hola'
  return {
    id: `new_${helper.id}`,
    type: 'new_helper',
    text: `¡Hola! Soy ${name}, ${helper.specialty?.toLowerCase() || 'profesional'}${helper.zone ? ` en ${helper.zone}` : ''}. ${helper.bio ? helper.bio.slice(0, 150) + (helper.bio.length > 150 ? '...' : '') : 'Estoy disponible y con muchas ganas de ayudar. Escríbeme sin compromiso.'}`,
    date: 'Nuevo',
    likes: Math.floor(Math.random() * 12) + 2,
    comments: 1,
    badge: '👋 Nuevo profesional',
    author: helper,
    authorType: 'helper',
    suggested: true,
    dynamic: true,
  }
}

// ── MAIN GENERATOR ────────────────────────────────────────────────────────
export function generateDynamicPosts(helpers, limit = 20) {
  if (!helpers?.length) return []
  const seed = daysSeed()
  const posts = []

  // Shuffle helpers deterministically for the day
  const shuffled = [...helpers]
    .filter(h => h?.name && h?.specialty)
    .sort((a, b) => seededRandom(seed, a.id) - seededRandom(seed, b.id))

  // Mix: case posts, availability posts, new helper posts
  shuffled.slice(0, Math.min(shuffled.length, limit * 2)).forEach((h, i) => {
    const roll = seededRandom(seed, i * 7)
    let post = null
    if (roll < 0.55) {
      post = makeCasePost(h, i)
    } else if (roll < 0.85) {
      post = makeAvailabilityPost(h, i)
    } else {
      post = makeNewHelperPost(h)
    }
    if (post) posts.push(post)
  })

  return posts.slice(0, limit)
}

export function generateAvailabilityPost(helper, index) {
  return makeAvailabilityPost(helper, index)
}

export function generateNuraTip() { return null } // eliminado — sin auto-referencias
export function generateNewHelperPost(helper) { return makeNewHelperPost(helper) }
