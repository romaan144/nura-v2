// ═══════════════════════════════════════════════════════════════
// LA OBRA — publicaciones tipadas de los profesionales
// No existe el post libre: toda pieza nace con tipo y resultado.
// La estructura es el filtro anti-humo. (Nüra Obra · F1)
// ═══════════════════════════════════════════════════════════════

export const TYPE_META = {
  caso:       { label: 'Caso',       icon: '📋' },
  trabajo:    { label: 'Trabajo',    icon: '🔧' },
  consejo:    { label: 'Consejo',    icon: '💡' },
  evolucion:  { label: 'Evolución',  icon: '📈' },
  actualidad: { label: 'Actualidad', icon: '📰' },
  hito:       { label: 'Hito',       icon: '🎓' },
}

export const SEED_OBRA = [
  { id: 'o1', helperId: 1, who: { name: 'Carlos Martínez Vidal', specialty: 'Logopeda infantil' }, type: 'caso', verified: true,
    title: 'El caso de la R', body: 'Llegó con 6 años y la R escondida. Trabajamos con juegos de soplo y espejo, ocho sesiones cortas, sin presión — la familia practicaba dos minutos al día en el coche.', result: 'Hoy pronuncia la R en conversación espontánea.' },
  { id: 'o3', helperId: 3, who: { name: 'Roberto Sánchez Ferrer', specialty: 'Técnico de calderas' }, type: 'trabajo', verified: true,
    title: 'Renovación completa de una instalación de 1987', body: 'Piso en Gràcia con caldera original y radiadores a media vida. Sustitución completa, purga de circuito y termostato inteligente en dos jornadas.', result: 'Consumo estimado un 30% menor este invierno.' },
  { id: 'o8', helperId: 8, who: { name: 'David Moreno Llopis', specialty: 'Entrenador personal' }, type: 'evolucion', verified: true,
    title: 'Seis meses de Jordi: de cero a su primer 10K', body: 'Empezamos caminando 20 minutos. Tres días por semana, progresión suave, cero lesiones. Lo importante no fue el plan: fue que nunca dejó de venir.', result: '10K en 58 minutos y el hábito consolidado.' },
  { id: 'o5', helperId: 5, who: { name: 'Elena Fernández Ros', specialty: 'Auxiliar de geriatría' }, type: 'caso', verified: true,
    title: 'Acompañar sin invadir', body: 'Señora de 84 con Alzheimer inicial que rechazaba "cuidadoras". Entré como compañía de paseos. En tres semanas, las mañanas tenían rutina: mercado, banco del parque, crucigrama.', result: 'La familia recuperó sus mañanas — y ella, las suyas.' },
  { id: 'o10', helperId: 10, who: { name: 'Jordi Prat Vidal', specialty: 'Abogado mercantil' }, type: 'actualidad',
    title: 'Lo que de verdad cambia con la nueva ley de startups', body: 'Tres puntos que afectan a cualquiera que facture como autónomo societario: stock options, deducción I+D y la ventanilla única. El resto es ruido de titulares.' },
  { id: 'o12', helperId: 12, who: { name: 'Marc Tort Alemany', specialty: 'Arquitecto' }, type: 'trabajo',
    title: 'Reforma integral en Sant Antoni', body: 'Sesenta metros con pasillo de los de antes. Tiramos dos tabiques, cocina abierta, luz cruzada. Obra de nueve semanas entregada en plazo.', result: '60 m² que ahora viven como 80.' },
  { id: 'o9', helperId: 9, who: { name: 'Dra. Carme Solà Puig', specialty: 'Psicóloga clínica' }, type: 'consejo',
    title: 'Ansiedad: la regla de los cinco minutos', body: 'Cuando la cabeza va a mil, no intentes calmarla: dale una tarea de cinco minutos con las manos. Fregar, ordenar un cajón, regar. El cuerpo baja primero; la mente le sigue.' },
  { id: 'o7', helperId: 7, who: { name: 'Lucía Vidal Torres', specialty: 'Profesora particular' }, type: 'consejo',
    title: 'Mates de selectividad: por dónde empezar en marzo', body: 'Exámenes de los últimos cinco años, por bloques y no por años. Primero probabilidad (cae siempre), después análisis. Una hora al día gana a un atracón semanal.' },
  { id: 'o6', helperId: 6, who: { name: 'Marta Puig Sala', specialty: 'Cuidadora de animales' }, type: 'consejo',
    title: 'Paseos que cansan la cabeza, no solo las patas', body: 'Diez minutos de olfato libre cansan más que media hora de tirar de correa. Deja que el perro "lea el periódico": el paseo es suyo, no tuyo.' },
  { id: 'o4', helperId: 4, who: { name: 'María López Castillo', specialty: 'Limpiadora de hogar' }, type: 'consejo',
    title: 'El orden que se mantiene solo', body: 'Quince minutos al final del día, siempre a la misma hora, siempre en el mismo orden: cocina, salón, entrada. No es limpiar más — es no dejar que se acumule.' },
  { id: 'o11', helperId: 11, who: { name: 'Dra. Laia Mercadé Font', specialty: 'Médica internista' }, type: 'actualidad',
    title: 'Chequeos que sí importan a partir de los 50', body: 'Colonoscopia, densitometría si hay factores, y la analítica anual bien leída — no la del "todo normal" de dos minutos. Prevenir es aburrido hasta que deja de serlo.' },
  { id: 'o2', helperId: 2, who: { name: 'Sara Gómez Puig', specialty: 'Logopeda' }, type: 'hito',
    title: 'Certificada en terapia miofuncional', body: 'Tres meses de formación para tratar mejor la deglución atípica y los hábitos orales. Lo que aprendo fuera vuelve siempre a la consulta.' },
]

// Comentarios semilla — el tono del mandato: útiles, firmados, sin ruido
export const SEED_COMMENTS = {
  o1: [
    { id: 'c1', author: 'Marta G.', text: 'Gracias por compartir esto. Mi hija tiene 5 años y está igual — me has dado esperanza.', ago: 'hace 6 días' },
    { id: 'c2', author: 'Nuria P.', text: '¿Cuántas sesiones suelen hacer falta en un caso así?', ago: 'hace 4 días' },
  ],
  o3: [
    { id: 'c3', author: 'Albert M.', text: 'Muy interesante el caso. ¿Cuánto tardasteis en total con la purga incluida?', ago: 'hace 3 días' },
  ],
  o8: [
    { id: 'c4', author: 'Pau R.', text: 'Nos pasó algo parecido con mi hermano. Lo difícil no es empezar, es el mes tres.', ago: 'hace 5 días' },
    { id: 'c5', author: 'Laura S.', text: 'Enhorabuena a Jordi. Y a ti por no venderle un plan imposible.', ago: 'hace 2 días' },
  ],
  o5: [
    { id: 'c6', author: 'Rosa V.', text: 'Gracias por explicarlo así. Estamos justo en ese punto con mi padre.', ago: 'hace 7 días' },
  ],
}

export const COMMENT_STARTERS = ['Gracias por compartir esto', '¿Cómo lo resolvisteis?', 'Nos pasó algo parecido']

const dias = h => 1 + ((h * 7) % 9)

// ── La señal de la Obra ──
// Publicar en Nüra = entrenar a tu propia recomendadora. Pequeña (tope 6),
// subordinada a la compatibilidad, y SOLO cuando el contenido casa de verdad.
// Fusión única: las obras propias viven en el espejo global (el módulo de
// datos no tiene React). Las tres funciones beben de aquí — cero divergencia.
const ALL = () => {
  let mias = []
  try { mias = window.__nuraMisObras || [] } catch { /* noop */ }
  return [...mias, ...SEED_OBRA]
}

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
export function obraSignal(helperId, analysis) {
  const kws = (analysis?.palabrasClave || []).map(norm).filter(k => k.length > 3)
  if (!kws.length) return { score: 0, best: null }
  let best = null, bestHits = 0
  for (const p of ALL()) {
    if (p.helperId !== Number(helperId)) continue
    const text = norm(`${p.title} ${p.body} ${p.result || ''}`)
    const hits = kws.filter(k => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text)).length
    if (hits > bestHits) { bestHits = hits; best = p }
  }
  if (!bestHits) return { score: 0, best: null }
  return { score: Math.min(6, bestHits * 3), best }
}

export function getObra(limit = 20) {
  return ALL()
    .map(p => ({ ...p, dateLabel: `hace ${dias(p.helperId)} ${dias(p.helperId) === 1 ? 'día' : 'días'}` }))
    .sort((a, b) => dias(a.helperId) - dias(b.helperId))
    .slice(0, limit)
}

export function getObraDeHelper(helperId, limit = 3) {
  return getObra(99).filter(p => p.helperId === Number(helperId)).slice(0, limit)
}
