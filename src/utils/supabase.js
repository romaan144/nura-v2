import { avatarDe } from '../utils/avatar'
// LA UNICA FUENTE. Estaban declaradas en TRES sitios y ya habian divergido:
// aqui la clave nueva `sb_publishable_`, y en claudeApi.js (retirado) y
// el JWT antiguo. Es decir, las LECTURAS iban con una credencial y las
// ESCRITURAS con otra. Si el JWT viejo se revoca, la app sigue leyendo tan
// campante y deja de guardar en silencio — justo en el flujo menos
// recorrido. Y solo uno de los tres leia la variable de entorno, asi que
// definirla en Vercel arreglaba un tercio del problema.
export const SUPABASE_URL = import.meta?.env?.VITE_SUPABASE_URL || 'https://oxmohciswebonoumghhu.supabase.co'
export const SUPABASE_KEY = import.meta?.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-_N1S0ni6t27kX41oPBw0g_nBlu9jcQ'
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

// ── GENERATORS — produce rich profile data from basic fields ──────────────

function nameToColor(name) {
  const colors = ['#1A56DB','#7B2FFF','var(--green)','#B45309','#DC2626','#0E7490','#7C3AED','#DB2777']
  let hash = 0
  for (let i = 0; i < (name||'').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function genHiddenSkills(s) {
  const m = {
    logopeda: ['estimulación temprana','apoyo emocional a familias','trabajo multidisciplinar'],
    tecnico: ['resolución rápida','atención al cliente','trabajo bajo presión'],
    limpieza: ['organización de espacios','productos ecológicos','gestión del tiempo'],
    cuidado: ['comunicación con familias','primeros auxilios básicos','empatía situaciones difíciles'],
    mascotas: ['lectura comportamiento animal','gestión emergencias','comunicación con dueños'],
    entrenador: ['motivación personalizada','nutrición básica','prevención lesiones'],
    matematicas: ['pedagogía adaptativa','seguimiento de progreso','paciencia con bloqueos'],
  }
  return m[s] || ['resolución de problemas','comunicación efectiva','trabajo en equipo']
}

function genEducation(s) {
  const m = {
    logopeda: [{ title:'Grado en Logopedia', institution:'Universitat de Barcelona', year:'2015–2019', details:'Especialización en intervención logopédica clínica.', verified:true }],
    tecnico: [{ title:'FP Superior — Instalaciones Térmicas', institution:'Institut Politècnic de Barcelona', year:'2010–2012', details:'Habilitación para gas, electricidad y climatización.', verified:true }],
    limpieza: [{ title:'Certificado de Profesionalidad — Limpieza', institution:'INCUAL', year:'2014', details:'Técnicas de limpieza industrial y doméstica.', verified:true }],
    cuidado: [{ title:'FP Atención a Personas en Situación de Dependencia', institution:'Escola Sant Gervasi', year:'2013–2015', details:'Especialización en geriatría y discapacidad.', verified:true }],
    mascotas: [{ title:'Técnico en Cuidados Auxiliares Veterinarios', institution:'Escola Agrària de Manresa', year:'2016–2018', details:'Adiestramiento canino y cuidado de animales.', verified:true }],
    entrenador: [{ title:'Grado en Ciencias de la Actividad Física', institution:'INEFC Barcelona', year:'2014–2018', details:'Entrenamiento personal y deporte adaptado.', verified:true }],
    matematicas: [{ title:'Grado en Matemáticas', institution:'Universitat Autònoma de Barcelona', year:'2016–2020', details:'Mención en didáctica de las matemáticas.', verified:true }],
  }
  return m[s] || [{ title:'Formación profesional especializada', institution:'Barcelona', year:'2015–2018', details:'Titulación oficial en el área de especialización.', verified:false }]
}

function genExperience(s, zone, services) {
  const yrs = Math.max(1, Math.round((parseInt(services)||20) / 25))
  const end = new Date().getFullYear()
  const roles = { logopeda:'+', tecnico:'⚙', limpieza:'◎', cuidado:'♡', mascotas:'◆', entrenador:'▷', matematicas:'◇' }
  const companies = { logopeda:'+', tecnico:'⚙', limpieza:'◎', cuidado:'♡', mascotas:'◆', entrenador:'▷', matematicas:'◇' }
  const logos = { logopeda:'LG', tecnico:'TC', limpieza:'LM', cuidado:'CU', mascotas:'MA', matematicas:'MT', entrenador:'EN', salud:'SA', legal:'LG', hogar:'HG', otro:'OT' }
  const skills = {
    logopeda:['diagnóstico fonológico','terapia individual','coordinación con familias'],
    tecnico:['reparaciones urgentes','mantenimiento preventivo','atención al cliente'],
    limpieza:['limpieza a fondo','productos ecológicos','puntualidad'],
    cuidado:['atención personalizada','aseo y alimentación','acompañamiento'],
    mascotas:['paseos','alimentación','cuidados básicos'],
    entrenador:['planificación deportiva','seguimiento de objetivos','motivación'],
    matematicas:['refuerzo académico','preparación de exámenes','metodología adaptada'],
  }
  return [{
    role: roles[s] || 'Profesional autónomo/a',
    company: `${companies[s] || 'Actividad por cuenta propia'} · ${zone||'Barcelona'}`,
    companyLogo: logos[s] || '⭐',
    period: `${end - yrs}–presente`,
    location: zone || 'Barcelona',
    competencies: skills[s] || ['profesionalidad','atención al detalle','trabajo en equipo'],
    verifiedByCompany: false,
    managerOpinion: null,
    colleagueOpinions: [],
  }]
}

function genPosts(name, specialty) {
  const first = name?.split(' ')?.[0] || 'El profesional'
  return [{
    id: 1,
    type: 'work',
    text: `Otro día más dedicado a ${specialty || 'mi trabajo'}. Ver los resultados del esfuerzo es lo que hace que todo valga la pena. ¡Gracias a todos mis clientes por su confianza!`,
    date: 'Hace 3 días',
    likes: Math.floor(Math.random() * 25) + 8,
    comments: Math.floor(Math.random() * 6) + 1,
    verifiedWork: true,
  }]
}

function genReviews(count) {
  const templates = [
    'Muy profesional y puntual. Totalmente recomendable.',
    'Excelente trato y buena comunicación. Repetiré sin duda.',
    'Resultados increíbles. Muy contento con el servicio.',
    'Gran profesional. Se nota la experiencia y la dedicación.',
    'Superó mis expectativas. Muy recomendable a todos.',
  ]
  const users = ['Ana M.','Pedro R.','Laura G.','Marc T.','Sofía P.']
  const dates = ['Mar 2026','Feb 2026','Ene 2026','Dic 2025','Nov 2025']
  const n = Math.min(4, Math.max(0, parseInt(count)||0))
  return templates.slice(0, n).map((text, i) => ({
    text, user: users[i], date: dates[i],
    avatar: users[i].split(' ').map(w=>w[0]).join(''),
  }))
}

function genEvolution(services) {
  const s = parseInt(services) || 0
  if (s < 5) return []
  return ['2023','2024','2025','2026'].slice(0,3).map((period, i) => ({
    period,
    rating: parseFloat((4.2 + i * 0.2).toFixed(1)),
    services: Math.floor(s * (i+1) / 3),
  }))
}

function genPersonality(rating) {
  const base = (parseFloat(rating)||4.5) / 5 * 10
  const v = () => parseFloat(Math.min(10, base * (0.94 + Math.random() * 0.08)).toFixed(1))
  return { patience: v(), empathy: v(), communication: v(), punctuality: v(), autonomy: v() }
}

// ── NORMALIZE — maps Supabase row → same structure as local profesionals ────────
function normalize(h) {
  const name = h.name || 'Profesional'
  const specialty = h.speciality || h.specialty || h.category || 'Profesional'
  const avatarUrl = h.avatarUrl || h.avatar_url || avatarDe(encodeURIComponent(name))

  return {
    id: h.id,
    name,
    avatar: name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
    avatarColor: h.avatarColor || h.avatar_color || nameToColor(name),
    avatarUrl,
    specialty,
    category: h.category || 'otro',
    tags: Array.isArray(h.tags) ? h.tags : [],
    bio: h.bio || '',
    price: h.price || null,
    zone: h.zone || h.city || 'Barcelona',
    city: h.city || 'Barcelona',
    distance: parseFloat(h.distance) || 1.5, // Default 1.5km — honest fallback
    rating: parseFloat(h.rating) || 4.5,
    reviews: parseInt(h.reviews) || 0,
    services: parseInt(h.services) || 0,
    completionRate: parseInt(h.completionRate) || parseInt(h.completion_rate) || 92,
    responseTime: h.responseTime || h.response_time || '< 1 hora',
    verified: h.verified ?? true,
    available: h.available ?? true,
    presential: h.presential ?? true,
    online: h.online ?? false,
    urgent: h.urgent ?? false,
    founder: h.founder ?? false,
    dniVerified: h.dniVerified ?? h.dni_verified ?? true,
    criminalRecordClear: false,
    qualificationLevel: h.qualificationLevel || h.qualification_level || 'professional',
    skills: Array.isArray(h.skills) ? h.skills : [],
    languages: Array.isArray(h.languages) ? h.languages : [],
    // Rich profile data from Supabase JSONB fields
    hiddenSkills: [],
    education: Array.isArray(h.education) ? h.education : [],
    experience: Array.isArray(h.experience) ? h.experience : [],
    posts: Array.isArray(h.posts) ? h.posts : [],
    qualitativeComments: Array.isArray(h.qualitativeComments) ? h.qualitativeComments
      : Array.isArray(h.qualitative_comments) ? h.qualitative_comments : [],
    evolution: [],
    personality: null,
    isFromSupabase: true,

    // Dynamic AI data — Claude writes whatever it wants here
    aiData: h.ai_data || {},
    aiAnalyzedAt: h.ai_analyzed_at || null,
  }
}

// ── API FUNCTIONS ─────────────────────────────────────────────────────────

// ── Qué columnas pedimos ─────────────────────────────────────────────────
//
// `select=*` se descargaba TAMBIÉN `chat_log` —las conversaciones de los
// usuarios— al navegador de cada visitante, en cada búsqueda, y el cliente
// no lo usa nunca. En Nüra esas frases no son metadatos: son "mi madre vive
// sola".
//
// No se puede resolver con una lista blanca escrita a mano: PostgREST
// devuelve 400 si una columna no existe, y el esquema real no se conoce
// desde aquí (normalize() lee `avatarUrl` Y `avatar_url` justamente porque
// hay dudas). Una lista inventada rompería TODAS las lecturas.
//
// Así que se pregunta. `GET /rest/v1/` devuelve el OpenAPI con las columnas
// reales de la tabla: una sola petición, CERO filas, ningún dato expuesto.
// Se cachea para la sesión.
//
// Si el descubrimiento falla (sin red, esquema inesperado), se vuelve a `*`:
// el comportamiento de hoy. Nunca se rompe una lectura por esto.
const COLUMNAS_OCULTAS = ['chat_log']
let columnasCache = null
let descubrimiento = null

async function descubrirColumnas() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers, signal: AbortSignal.timeout(2500) })
    if (!res.ok) return null
    const spec = await res.json()
    const props = spec?.definitions?.helpers?.properties
    if (!props) return null
    const cols = Object.keys(props).filter(c => !COLUMNAS_OCULTAS.includes(c))
    // Si no falta ninguna, no hay nada que acotar: mejor `*` que una lista
    // larga que quedaría obsoleta al añadir una columna.
    if (!cols.length || cols.length === Object.keys(props).length) return null
    return cols.join(',')
  } catch { return null }
}

// NO BLOQUEA. El descubrimiento se lanza al cargar y quien pregunte recibe
// lo que haya: `*` hasta que llegue, la lista acotada despues. Esperarlo
// costaria hasta 2,5 s en la PRIMERA busqueda —la que define el producto— y
// justo cuando la red va mal. Precio: `chat_log` viaja una vez por sesion en
// lugar de en todas las lecturas.
export function columnasHelpers() {
  return columnasCache || '*'
}

descubrimiento = descubrirColumnas()
  .then(c => {
    columnasCache = c || '*'
    if (!c) console.warn('[Nüra] esquema no descubierto: se pide select=* (chat_log viaja al navegador)')
  })
  .catch(() => { columnasCache = '*' })

export async function searchHelpers(category, keywords = []) {
  try {
    let url = `${SUPABASE_URL}/rest/v1/helpers?select=${columnasHelpers()}&limit=100&order=rating.desc`
    if (category && !['otro','general','todos'].includes(category)) {
      // Exact match first, case-insensitive via ilike without wildcards
      url += `&category=ilike.${encodeURIComponent(category)}`
    }
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(2500) })
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    if (keywords?.length > 0) {
      const filtered = data.filter(h => {
        const text = [h.name, h.speciality, h.bio, h.zone, h.category, ...(Array.isArray(h.tags)?h.tags:[])].join(' ').toLowerCase()
        return keywords.some(k => k && text.includes(k.toLowerCase()))
      })
      return (filtered.length > 0 ? filtered : data).map(normalize)
    }
    return data.map(normalize)
  } catch(e) { console.error('Supabase searchHelpers:', e); return null }
}

export async function getHelperById(id) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/helpers?id=eq.${id}&select=${columnasHelpers()}&limit=1`, { headers, signal: AbortSignal.timeout(2500) })
    if (!res.ok) return null
    const data = await res.json()
    return data?.[0] ? normalize(data[0]) : null
  } catch { return null }
}

export async function getAllHelpers() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/helpers?select=${columnasHelpers()}&limit=1000&order=rating.desc`, { headers, signal: AbortSignal.timeout(2500) })
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? data.map(normalize) : null
  } catch { return null }
}
