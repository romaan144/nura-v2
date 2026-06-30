
// ── Contexto de precio por categoría (mercado Barcelona) ──────────────────
// Usado por Nüra para contextualizar el precio de cada helper al usuario
export const PRICE_CONTEXT = {
  logopedia:     { lo: 40,  hi: 70,  unit: 'sesión', label: 'logopedas' },
  tecnico:      { lo: 50,  hi: 100, unit: 'visita',  label: 'técnicos' },
  limpieza:     { lo: 10,  hi: 18,  unit: 'hora',    label: 'limpieza del hogar' },
  cuidado:      { lo: 10,  hi: 20,  unit: 'hora',    label: 'cuidadores' },
  mascotas:     { lo: 12,  hi: 25,  unit: 'hora',    label: 'cuidadores de mascotas' },
  matematicas:  { lo: 20,  hi: 40,  unit: 'hora',    label: 'profesores particulares' },
  entrenador:   { lo: 30,  hi: 60,  unit: 'sesión',  label: 'entrenadores personales' },
  salud:        { lo: 60,  hi: 120, unit: 'consulta', label: 'profesionales de salud' },
  legal:        { lo: 80,  hi: 200, unit: 'hora',    label: 'abogados' },
  hogar:        { lo: 40,  hi: 90,  unit: 'visita',  label: 'profesionales del hogar' },
  psicologia:   { lo: 60,  hi: 100, unit: 'sesión',  label: 'psicólogos' },
  fisioterapia: { lo: 40,  hi: 70,  unit: 'sesión',  label: 'fisioterapeutas' },
  otro:         { lo: 20,  hi: 80,  unit: 'hora',    label: 'profesionales' },
}

// Genera una frase de contexto de precio para el helper top
export function getPriceContext(helper, categoria) {
  const ctx = PRICE_CONTEXT[categoria] || PRICE_CONTEXT.otro
  if (!helper?.price || helper.price === 'Consultar') return null

  const helperNum = parseInt((helper.price || '').replace(/[^0-9]/g, ''))
  if (!helperNum) return null

  const isBelow = helperNum < ctx.lo
  const isAbove = helperNum > ctx.hi
  const isAvg   = helperNum >= ctx.lo && helperNum <= ctx.hi

  const helperName = helper.name?.split(' ')?.[0] || 'Este profesional'

  if (isBelow) {
    return `El precio de ${ctx.label} en Barcelona es ${ctx.lo}–${ctx.hi}€/${ctx.unit}. ${helperName} cobra ${helperNum}€ — por debajo de la media.`
  }
  if (isAbove) {
    return `El precio medio de ${ctx.label} en Barcelona es ${ctx.lo}–${ctx.hi}€/${ctx.unit}. ${helperName} cobra ${helperNum}€.`
  }
  return `El precio de ${ctx.label} en Barcelona suele ser ${ctx.lo}–${ctx.hi}€/${ctx.unit}. ${helperName} cobra ${helperNum}€ — dentro de la media.`
}

import { HELPERS as LOCAL_HELPERS } from '../data/helpers'
import { searchHelpers } from './supabase'

// ── SEMANTIC EXPANSION MAP ────────────────────────────────────────────────
// Maps everyday expressions → canonical keywords
// "mi abuela" → "mayor anciano abuelo"
// "no me calienta" → "caldera avería"
const SEMANTIC_MAP = {
  // Cuidado de personas — contexto familiar/emocional
  'abuela': 'mayor anciano abuelo cuidado',
  'abuelo': 'mayor anciano cuidado',
  'padre': 'mayor anciano cuidado',
  'madre': 'mayor anciana cuidado',
  'anciana': 'mayor anciano cuidado',
  'alzheimer': 'alzheimer cuidado mayor dependencia',
  'parkinson': 'parkinson cuidado mayor dependencia',
  'demencia': 'alzheimer cuidado mayor dependencia',
  'postoperatorio': 'cuidado auxiliar enfermera',
  'bebé': 'bebé niñera cuidado niños',
  'recién nacido': 'bebé niñera cuidado',
  'canguro': 'canguro niñera niños cuidado',
  'guardería': 'niños cuidado niñera',
  
  // Técnicos — síntomas no técnicos
  'frío': 'caldera calefacción radiador',
  'no calienta': 'caldera avería reparar calefacción',
  'calienta': 'caldera calefacción radiador',
  'calefaccion': 'caldera calefacción técnico',
  'fuga': 'fontanero tubería agua grifo',
  'humedad': 'humedad gotera fontanero',
  'mancha': 'humedad limpieza',
  'plagas': 'plagas desinfección técnico',
  'nieto': 'niños cuidado canguro',
  'hijo': 'niños clases refuerzo cuidado',
  'hija': 'niños clases refuerzo cuidado',
  'pequeño': 'niños cuidado',
  'crio': 'niños cuidado niñera',
  'crío': 'niños cuidado niñera',
  'infancia': 'niños cuidado logopeda',
  'reuma': 'fisioterapeuta fisioterapia',
  'rodilla': 'fisioterapeuta rehabilitación',
  'columna': 'fisioterapeuta espalda',
  'hernia': 'fisioterapeuta rehabilitación',
  'mudanza': 'mudanza transporte',
  'jardín': 'jardinero jardín plantas',
  'plantas': 'jardinero jardín',
  'pelo': 'peluquero peluquería',
  'corte': 'peluquero peluquería',
  'ordenador': 'informático ordenador técnico',
  'wifi': 'informático wifi redes',
  'móvil': 'informático teléfono',
  'foto': 'fotógrafo fotografía',
  'boda': 'fotógrafo evento',
  'cumpleaños': 'animador fotógrafo evento',
  'cocinar': 'chef cocina comida',
  'menú': 'chef cocina comida',
  'comida': 'chef nutricionista cocina',
  'seguro': 'gestor asesor seguros',
  'impuestos': 'gestor asesor contabilidad',
  'renta': 'gestor asesor impuestos',
  'contrato': 'abogado asesor legal',
  'divorcio': 'abogado legal asesor',
  'tatuaje': 'tatuaje tatuador',
  'alergia': 'nutricionista dietista',
  'celiaco': 'nutricionista dieta',
  'masaje': 'masaje fisioterapeuta quiropráctico',
  'tensión': 'masaje quiropráctico fisioterapeuta',
  'dormir': 'psicólogo terapia insomnio',
  'insomnio': 'psicólogo terapia',
  'pareja': 'psicólogo terapia pareja',
  'duelo': 'psicólogo terapia duelo',
  'tristeza': 'psicólogo terapia',
  'enfado': 'psicólogo terapia',
  'fobia': 'psicólogo terapia fobia',
  'idioma': 'idioma inglés clases',
  'inglés': 'inglés idioma clases',
  'alemán': 'alemán idioma clases',
  'francés': 'francés idioma clases',
  'ajedrez': 'ajedrez clases academia',
  'piano': 'piano música clases',
  'guitarra': 'guitarra música clases',
  'pintura': 'pintura arte clases manualidades',
  'natación': 'natación piscina entrenador deporte',
  'yoga': 'yoga pilates entrenador',
  'correr': 'correr running entrenador',
  'maratón': 'correr running entrenador',
  'ganar peso': 'entrenador nutricionista musculación',
  'bajar peso': 'entrenador nutricionista adelgazar',
  'adoptar': 'veterinario mascota',
  'pulgas': 'veterinario mascota',
  'caída': 'fisioterapeuta mayor cuidado',
  'silla de ruedas': 'cuidado mayor dependencia auxiliar',
  'incontinencia': 'cuidado mayor dependencia auxiliar',
  'medicación': 'cuidado auxiliar enfermera mayor',

  'no funciona': 'avería reparar técnico',
  'se ha roto': 'roto avería reparar',
  'agua': 'fontanero tubería grifo',
  'gotera': 'gotera fontanero humedad',
  'luz': 'electricista luz instalación',
  'enchufe': 'electricista instalación',
  'cerradura': 'cerrajero cerradura puerta',
  'llave': 'cerrajero cerradura',
  'pintar': 'pintor pintura pared',
  'pared': 'pintor albañil yesero',
  
  // Limpieza — expresiones coloquiales
  'ordenar': 'ordenar limpieza hogar',
  'desorden': 'limpieza ordenar hogar',
  'sucio': 'limpiar limpieza',
  'fregona': 'limpiar limpieza',
  
  // Mascotas
  'perrita': 'perro mascota',
  'gatito': 'gato mascota',
  'cachorro': 'cachorro perro mascota',
  'paseo': 'pasear perro mascota',
  'veterinario': 'veterinario mascota',
  
  // Educación
  'suspenso': 'refuerzo clases matemáticas deberes',
  'examen': 'clases refuerzo estudiar',
  'selectividad': 'selectividad clases refuerzo',
  'inglés': 'inglés idioma clases',
  'instituto': 'refuerzo clases eso bachillerato',
  'cole': 'refuerzo clases primaria niños',
  'deberes': 'deberes clases refuerzo',
  
  // Salud / bienestar
  'espalda': 'fisioterapeuta fisioterapia',
  'lesión': 'fisioterapeuta rehabilitación',
  'ansiedad': 'psicólogo psicología terapia',
  'depresión': 'psicólogo psicología terapia',
  'estrés': 'psicólogo terapia',
  'adelgazar': 'nutricionista dieta entrenador',
  'dieta': 'nutricionista nutrición',
  'peso': 'nutricionista entrenador',
  
  // Fitness
  'forma': 'entrenador fitness gym',
  'ponerse en forma': 'entrenador fitness ejercicio',
  'músculo': 'entrenador musculación gym',
  
  // Logopedia — síntomas no técnicos
  'hablar': 'logopeda habla lenguaje',
  'pronunciar': 'logopeda pronunciación habla',
  'tartamudea': 'logopeda tartamudez habla',
  'no habla': 'logopeda habla lenguaje niños',
  'retraso': 'logopeda lenguaje niños',
}

// ── CATEGORY KEYWORDS (extended) ─────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  logopedia: ['logopeda','logopedia','habla','lenguaje','pronunciación','pronunciar',
    'fonema','tartamudez','tartamudea','voz','dislalia','disfagia','comunicación',
    'hablar','retraso lenguaje','terapia habla'],
  tecnico: ['caldera','fontanero','fontanería','electricista','técnico','reparar',
    'avería','instalación','grifo','tubería','luz','calefacción','aire acondicionado',
    'pintor','cerrajero','electrodoméstico','lavadora','nevera','frigorífico','horno',
    'microondas','persiana','puerta','cerradura','ventana','gotera','humedad',
    'desatascar','wc','inodoro','ducha','bañera','radiador','termo','mecánico',
    'albañil','yesero','escayola','azulejo','parquet','suelo','techo','pared',
    'carpintero','soldador','pintura','frío','no funciona','roto','agua'],
  limpieza: ['limpiar','limpieza','fregar','barrer','hogar','casa','ordenar',
    'cristales','planchar','sucio','polvo','mancha','fregona','desorden'],
  cuidado: ['cuidar','cuidadora','mayor','anciano','anciana','abuelo','abuela',
    'acompañar','acompañamiento','geriatría','dependencia','niños','bebé','niñera',
    'enfermera','auxiliar','residencia','alzheimer','parkinson','discapacidad',
    'canguro','guardería','padre mayor','madre mayor','sola en casa','vive sola',
    'confía','de confianza','mañanas','entre semana','demencia','postoperatorio','demencia'],
  mascotas: ['perro','gato','mascota','animal','pasear','veterinario','adiestramiento',
    'cachorro','felino','canino','pájaro','conejo','perrita','gatito','paseo'],
  matematicas: ['matemáticas','mates','clases','profesor','refuerzo','estudiar',
    'deberes','física','química','inglés','idioma','piano','música','programación',
    'francés','alemán','italiano','clase particular','academia','tutorías',
    'selectividad','bachillerato','eso','primaria','universidad','oposiciones',
    'guitarra','ballet','ajedrez','suspenso','examen','instituto','cole'],
  entrenador: [
    'perder peso', 'adelgazar', 'bajar de peso', 'dieta y ejercicio','entrenador','gym','gimnasio','deporte','ejercicio','fitness','correr',
    'adelgazar','musculación','yoga','pilates','running','crossfit','natación',
    'ciclismo','spinning','zumba','baile','aeróbic','pesas','cardio','ponerse en forma',
    'músculo','forma'],
  salud: ['psicólogo','psicóloga','psicología','fisioterapeuta','fisioterapia',
    'médico','médica','doctor','doctora','enfermero','enfermera','consulta médica',
    'diagnóstico','síntoma','nutricionista','nutrición','dietista','ansiedad',
    'depresión','estrés','insomnio','fobia','trauma','terapia','terapeuta',
    'rehabilitación','masaje','quiropráctico','acupuntura','espalda','lesión',
    'columna','rodilla','hernia','tensión arterial','glucosa','revisión médica'],
  legal: ['abogado','abogada','asesor legal','asesoría','contrato','demanda',
    'divorcio','herencia','testamento','deuda','hipoteca','alquiler','multa',
    'denuncia','juicio','notario','gestor','gestoría','impuestos','renta','hacienda'],
  hogar: ['arquitecto','arquitecta','reforma','obra','presupuesto reforma',
    'decorador','interiorista','diseño interior','jardín','jardinero','piscina',
    'pintura hogar','papel pintado','suelo','parquet','azulejo','cocina reforma'],
  otro: ['psicólogo','psicóloga','psicología','fisioterapeuta','fisioterapia',
    'nutricionista','nutrición','dietista','chef','cocina','tatuaje','fotógrafo',
    'fotografía','diseñador','abogado','gestor','asesor','traductor','mudanza',
    'jardinero','jardín','masaje','quiropráctico','acupuntura','terapeuta',
    'peluquero','informático','ansiedad','depresión','estrés','espalda','lesión',
    'dieta','peso'],
}

const URGENCY_KEYWORDS = ['urgente','urgencia','hoy','ahora','inmediatamente','rápido',
  'no funciona','roto','avería','24h','cuanto antes','lo antes posible']
const PRESENTIAL_KEYWORDS = ['casa','domicilio','presencial','venir','viene','zona',
  'cerca','barrio','a domicilio','en persona']
const ONLINE_KEYWORDS = ['online','videoconferencia','remoto','internet','videollamada',
  'zoom','google meet','a distancia']

// ── TEXT NORMALIZATION ─────────────────────────────────────────────────────
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── SEMANTIC EXPANSION ────────────────────────────────────────────────────
function expandText(text) {
  let expanded = text
  const normText = normalize(text)
  
  for (const [trigger, expansion] of Object.entries(SEMANTIC_MAP)) {
    const normTrigger = normalize(trigger)
    if (normText.includes(normTrigger)) {
      expanded += ' ' + expansion
    }
  }
  return expanded
}

// ── REFINEMENT ────────────────────────────────────────────────────────────
function applyRefinement(helpers, refinementText) {
  const text = normalize(refinementText)
  let filtered = [...helpers]
  if (text.includes('online') || text.includes('videoconferencia') || text.includes('distancia'))
    filtered = filtered.filter(h => h.online)
  if (text.includes('domicilio') || text.includes('casa') || text.includes('venga') || text.includes('presencial'))
    filtered = filtered.filter(h => h.presential)
  if (text.includes('hoy') || text.includes('urgente') || text.includes('ahora') || text.includes('rapido')) {
    filtered = filtered.filter(h => h.urgent || h.available)
    filtered.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0))
  }
  const distMatch = text.match(/menos de (\d+)\s*km/)
  if (distMatch) filtered = filtered.filter(h => h.distance <= parseInt(distMatch[1]))
  const priceMatch = text.match(/menos de (\d+)|maximo (\d+)|hasta (\d+)/)
  if (priceMatch) {
    const maxP = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3])
    filtered = filtered.filter(h => parseInt((h.price || '').replace(/[^0-9]/g,'')) <= maxP)
  }
  if (text.includes('mejor valorado') || text.includes('mas valorado'))
    filtered.sort((a, b) => b.rating - a.rating)
  if (text.includes('mas cercano') || text.includes('cerca'))
    filtered.sort((a, b) => a.distance - b.distance)
  if (text.includes('mas barato') || text.includes('economico') || text.includes('precio'))
    filtered.sort((a, b) => parseInt(a.price||'999') - parseInt(b.price||'999'))
  return filtered.length > 0 ? filtered : helpers
}

// ── ANALYZE NEED ──────────────────────────────────────────────────────────
export function analyzeNeed(userText) {
  // Expand text with semantic synonyms first
  const expanded = expandText(userText)
  const normExpanded = normalize(expanded)
  const normOriginal = normalize(userText)
  
  // Score each category
  let categoria = 'otro'
  let maxScore = 0
  
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      const normKw = normalize(kw)
      if (normOriginal.includes(normKw)) score += 3      // exact match in original = high weight
      else if (normExpanded.includes(normKw)) score += 1  // semantic expansion match
    }
    if (score > maxScore) { maxScore = score; categoria = cat }
  }
  
  // If still no clear match, try partial word matching
  if (maxScore === 0) {
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const words = normOriginal.split(' ').filter(w => w.length > 3)
      const partialMatches = keywords.filter(kw => 
        words.some(w => normalize(kw).includes(w) || w.includes(normalize(kw)))
      ).length
      if (partialMatches > maxScore) { maxScore = partialMatches; categoria = cat }
    }
  }
  
  const urgente = URGENCY_KEYWORDS.some(k => normExpanded.includes(normalize(k)))
  const hasOnline = ONLINE_KEYWORDS.some(k => normExpanded.includes(normalize(k)))
  const hasPresential = PRESENTIAL_KEYWORDS.some(k => normExpanded.includes(normalize(k)))
  const presencial = hasPresential || (!hasOnline && ['tecnico','cuidado','limpieza','mascotas'].includes(categoria))
  
  const QUALIFICATION_MAP = {
    logopedia: 'professional', tecnico: 'professional', cuidado: 'experienced',
    mascotas: 'experienced', limpieza: 'experienced', matematicas: 'student',
    entrenador: 'professional', otro: 'professional',
  }
  const nivelRequerido = QUALIFICATION_MAP[categoria] || 'experienced'
  
  // Extract meaningful keywords from expanded text for Supabase search
  const palabrasClave = (CATEGORY_KEYWORDS[categoria] || [])
    .filter(k => normalize(expanded).includes(normalize(k)))
    .slice(0, 5)
  
  const resumenMap = {
    logopedia: 'Busca un logopeda', tecnico: 'Necesita un técnico o profesional del hogar',
    limpieza: 'Busca servicio de limpieza', cuidado: 'Busca cuidado de personas',
    mascotas: 'Necesita cuidado de mascota', matematicas: 'Busca clases o formación',
    entrenador: 'Busca entrenador personal', otro: 'Busca un profesional',
  }
  
  return Promise.resolve({
    categoria, presencial, urgente, nivelRequerido,
    resumen: resumenMap[categoria] || 'Busca ayuda',
    palabrasClave,
    confidence: maxScore, // so UI can show fallback if confidence is 0
  })
}

function normalizeHelper(h) {
  if (!h) return null
  return {
    ...h,
    avatarColor: h.avatar_color || h.avatarColor || '#1A56DB',
    avatarUrl: h.avatarUrl || `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent((h.name || '').split(' ')[0])}`,
    avatar: (h.name || 'H').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase(),
    responseTime: h.response_time || h.responseTime || '< 1 hora',
    completionRate: h.completion_rate || h.completionRate || 95,
    qualificationLevel: h.qualification_level || h.qualificationLevel || 'experienced',
    dniVerified: h.dni_verified !== undefined ? h.dni_verified : (h.dniVerified !== undefined ? h.dniVerified : true),
    specialty: h.specialty || h.speciality || (h.tags && h.tags[0]) || '',
    tags: h.tags || [],
    skills: h.skills || [],
    rating: parseFloat(h.rating) || 4.5,
    distance: parseFloat(h.distance) || 1.5,
    reviews: parseInt(h.reviews) || 0,
    services: parseInt(h.services) || 0,
    price: h.price || null,
  }
}

export async function matchHelpers(analysis, limit = 4, refinement = null, previousResults = null) {
  // Refinement mode
  if (refinement && previousResults?.length > 0) {
    return applyRefinement(previousResults, refinement).slice(0, limit)
  }

  const levelOrder = { student: 0, experienced: 1, professional: 2 }
  const required = levelOrder[analysis.nivelRequerido] ?? 1

  let pool = []

  // Always include demo helpers (id >= 2000) that match the category
  const demoPool = LOCAL_HELPERS
    .filter(h => h?.id >= 2000 && h?.category === analysis.categoria)
    .map(normalizeHelper).filter(Boolean)

  // Try Supabase
  try {
    const remote = await searchHelpers(analysis.categoria, analysis.palabrasClave)
    if (remote && remote.length > 0) {
      pool = [...demoPool, ...remote.map(normalizeHelper).filter(Boolean)]
    }
  } catch (e) {
    console.warn('Supabase error:', e)
  }

  // Fallback to all local
  if (pool.length === 0) {
    pool = LOCAL_HELPERS.filter(Boolean).map(normalizeHelper).filter(Boolean)
  }

  // Deduplicate
  pool = pool.filter((h, i, arr) => arr.findIndex(x => x?.id === h?.id) === i)

  // Score helpers
  const scored = pool.map(h => {
    let score = 0
    // Demo helpers (id >= 2000) get priority boost — rich profiles, verified data
    if (h.id >= 2000) score += 80
    if (h.category === analysis.categoria) score += 40
    const keywords = analysis.palabrasClave || []
    keywords.forEach(kw => {
      const normKw = normalize(kw)
      if ((h.tags || []).some(t => normalize(String(t)).includes(normKw))) score += 10
      if (normalize(h.bio || '').includes(normKw)) score += 5
      if (normalize(h.specialty || '').includes(normKw)) score += 8
    })
    if (analysis.presencial && h.presential) score += 15
    if (analysis.urgente && h.urgent) score += 20
    if (h.available) score += 5
    score += (h.rating || 4.5) * 2
    score -= (h.distance || 1) * 2
    return { ...h, score }
  })

  const sorted = scored.sort((a, b) => b.score - a.score)
  
  // Filter: must have some content
  const withContent = sorted.filter(h => h.bio || h.specialty || (h.tags||[]).length > 0)
  const results = (withContent.length > 0 ? withContent : sorted).slice(0, limit)
  
  return results
}
