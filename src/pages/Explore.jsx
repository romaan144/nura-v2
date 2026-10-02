import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import PageHeader from '../components/PageHeader'
import ErrorPanel from '../components/ErrorPanel'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, SlidersHorizontal, Check, X, ArrowUpRight,
         Heart, Wrench, BookOpen, Scale, Home, PawPrint,
         Dumbbell, Baby, Star, Laptop, Palette, Car, PartyPopper, Globe } from 'lucide-react'
import { searchHelpers, searchPorEspecialidad } from '../utils/supabase'
import { oficiosDe, esDelOficio, patronesDe, normalizar } from '../data/oficios'
import { HELPERS as LOCAL_DEMO_HELPERS } from '../data/helpers'
import { DEMO_MODE } from '../config'
import HelperCard from '../components/HelperCard'
import styles from './Explore.module.css'
import { EmptyState, Skeleton } from '../components/ui'




// ── CATEGORÍAS ────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'salud',
    label: 'Cuidar mi salud',
    desc: 'Psicólogos, logopedas, médicos y bienestar',
    icon: Heart,
    color: '#FF6B6B',
    bg: 'rgba(255,107,107,0.10)',
    supabaseCategories: ['salud'],
    subcategories: ['Todos', 'Psicóloga', 'Neuropsicóloga', 'Logopeda', 'Fisioterapeuta', 'Nutricionista', 'Dietista', 'Pilates', 'Yoga', 'Osteopatía', 'Masajista', 'Mindfulness y meditación'],
  },
  {
    id: 'tecnico',
    label: 'Arreglar algo en casa',
    desc: 'Fontaneros, electricistas y reparaciones',
    icon: Wrench,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.10)',
    supabaseCategories: ['tecnico'],
    subcategories: ['Todos', 'Fontanero', 'Electricista', 'Albañil', 'Carpintero', 'Cerrajero', 'Técnico aire acondicionado', 'Técnico calefacción', 'Técnico gas natural', 'Técnico electrodomésticos', 'Reparación de móviles'],
  },
  {
    id: 'clases',
    label: 'Aprender algo nuevo',
    desc: 'Idiomas, música y refuerzo escolar',
    icon: BookOpen,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.10)',
    supabaseCategories: ['clases', 'educacion'],
    subcategories: ['Todos', 'Inglés todos los niveles', 'Francés', 'Alemán', 'Chino mandarín', 'Matemáticas ESO y Bachillerato', 'Física y Química', 'Biología y Geología', 'Historia y Ciencias Sociales', 'Lengua y Literatura Española', 'Dibujo artístico', 'Piano y solfeo', 'Guitarra clásica y moderna', 'Programación Python y web', 'EBAU · Preparación acceso'],
    specialtyKeywords: ['profesor', 'clases', 'idiomas', 'inglés', 'matemáticas', 'música', 'guitarra', 'piano', 'refuerzo', 'academia', 'tutor'],
  },
  {
    id: 'asesoria',
    label: 'Resolver un tema legal',
    desc: 'Abogados, gestores y consultoría',
    icon: Scale,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.10)',
    supabaseCategories: ['legal'],
    subcategories: ['Todos', 'Abogado laboralista', 'Abogado penal', 'Abogado de familia', 'Abogado mercantil y startups', 'Abogado extranjería', 'Abogado herencias y sucesiones', 'Abogado arrendamientos y propiedad', 'Abogado administrativo', 'Asesor fiscal', 'Asesora contable', 'Asesor financiero', 'Gestora administrativa'],
  },
  {
    id: 'hogar',
    label: 'Poner mi casa a punto',
    desc: 'Limpieza, cocina y ayuda doméstica',
    icon: Home,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.10)',
    supabaseCategories: ['hogar', 'limpieza'],
    subcategories: ['Todos', 'Limpieza doméstica', 'Limpieza por horas', 'Limpieza profunda', 'Planchado a domicilio', 'Organización del hogar', 'Cocinero a domicilio', 'Manitas del hogar', 'Montador de muebles IKEA y similares', 'Pintor', 'Jardinero y mantenimiento de terrazas', 'Diseñador de interiores', 'Arquitecto reformas domicilio'],
  },
  {
    id: 'mascotas',
    label: 'Cuidar a mi mascota',
    desc: 'Cuidadores, paseos y adiestramiento',
    icon: PawPrint,
    color: '#F97316',
    bg: 'rgba(249,115,22,0.10)',
    supabaseCategories: ['mascotas'],
    subcategories: ['Todos', 'Paseadora de perros', 'Cuidadora de perros domicilio', 'Cuidadora felina en casa', 'Pet sitter vacaciones', 'Grooming y estética canina', 'Adiestrador canino', 'Educación cachorros', 'Veterinario a domicilio'],
  },
  {
    id: 'entrenamiento',
    label: 'Ponerme en forma',
    desc: 'Personal trainers y deportes',
    icon: Dumbbell,
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.10)',
    supabaseCategories: ['entrenador'],
    subcategories: ['Todos', 'Entrenador personal', 'Instructor de yoga', 'Instructora de pilates', 'Coach de running', 'Monitor de pádel', 'Profesor de natación'],
    specialtyKeywords: ['entrenador', 'entrenamiento', 'personal trainer', 'fitness', 'deporte', 'gym', 'pilates', 'yoga', 'crossfit', 'nutricion deportiva'],
  },
  {
    id: 'cuidado',
    label: 'Cuidar a alguien querido',
    desc: 'Cuidadores, auxiliares y compañía',
    icon: Baby,
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.10)',
    supabaseCategories: ['cuidado'],
    subcategories: ['Todos', 'Cuidadora de mayores', 'Cuidadora nocturna', 'Cuidadora personas con Alzheimer', 'Cuidadora post-operatorio', 'Auxiliar geriátrica', 'Auxiliar personas con discapacidad', 'Ayuda a domicilio integral', 'Enfermera domicilio', 'Niñera', 'Canguro', 'Asistente personal'],
  },
  {
    id: 'tecnologia',
    label: 'Ayuda con tecnología',
    desc: 'Técnicos, desarrollo web y apps',
    icon: Laptop,
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.10)',
    supabaseCategories: ['tecnologia'],
    subcategories: ['Todos', 'Técnico informático', 'Reparación de ordenadores', 'Reparación de móviles', 'Especialista WiFi', 'Diseñadora web', 'Desarrollador web', 'Desarrollador de apps', 'Especialista en IA'],
  },
  {
    id: 'diseno',
    label: 'Crear algo',
    desc: 'Fotógrafos, diseñadores y creativos',
    icon: Palette,
    color: '#F43F5E',
    bg: 'rgba(244,63,94,0.10)',
    supabaseCategories: ['diseno'],
    subcategories: ['Todos', 'Diseñadora gráfica', 'Diseñador UX/UI', 'Fotógrafa', 'Videógrafo', 'Editora de vídeo', 'Community manager', 'Copywriter'],
  },
  {
    id: 'automocion',
    label: 'Mi coche o moto',
    desc: 'Mecánicos y cuidado del vehículo',
    icon: Car,
    color: '#64748B',
    bg: 'rgba(100,116,139,0.10)',
    supabaseCategories: ['automocion'],
    subcategories: ['Todos', 'Mecánico', 'Electricidad del automóvil', 'Limpieza de vehículos', 'Detailing'],
  },
  {
    id: 'eventos',
    label: 'Celebrar algo',
    desc: 'DJs, animadores y wedding planners',
    icon: PartyPopper,
    color: '#F97316',
    bg: 'rgba(249,115,22,0.10)',
    supabaseCategories: ['eventos'],
    subcategories: ['Todos', 'DJ profesional', 'Animadora infantil', 'Wedding planner', 'Decorador de eventos', 'Mago'],
  },
  {
    id: 'idiomas',
    label: 'Viajar o hablar otro idioma',
    desc: 'Guías, traductores e intérpretes',
    icon: Globe,
    color: '#0EA5E9',
    bg: 'rgba(14,165,233,0.10)',
    supabaseCategories: ['idiomas'],
    subcategories: ['Todos', 'Guía turístico', 'Traductora chino-español', 'Traductor árabe-español', 'Intérprete', 'Profesora de inglés'],
  },
]

// ── OFICIOS QUE SE ENSEÑAN EN OTRA CATEGORÍA ─────────────────────────
// La categoría sale de la ficha, y en la base hay pintores como `tecnico`
// y otros como `hogar`: la madre de Sergio veía «Pintor» en «Arreglar algo
// en casa» y «Pintor de interiores» en «Poner mi casa a punto» (2026-10-02).
// Aquí solo cambia dónde se enseñan; lo guardado y la búsqueda, no.
// Y al revés (Sergio, 2026-10-02): electricista, albañil y carpintero salen
// solo en «Arreglar algo en casa», aunque su ficha diga `hogar`.
const MOVIDOS = [
  { es: h => /^pintor/i.test((h.specialty || '').trim()), de: 'tecnico', a: 'hogar' },
  { es: h => /^(electricista|albañil|carpinter)/i.test((h.specialty || '').trim()), de: 'hogar', a: 'tecnico' },
]

// ── BUSCAR EN «VER TODOS» (Sergio, 2026-10-02) ───────────────────────
// Escribir «pintor» antes de entrar en una categoría enseña a todos los
// pintores, en la misma lista que dentro de las categorías. Se busca por el
// oficio (con sus variantes: «pintora», «pintor de interiores») y, si la
// frase no nombra ninguno, por trozos de la especialidad. La frase no se
// guarda en ningún sitio.
const palabrasDe = q => normalizar(q).split(' ').filter(w => w.length >= 3).slice(0, 4)
async function buscarProfesionales(q) {
  const ids = oficiosDe(q).map(x => x.id)
  const palabras = palabrasDe(q)
  if (!ids.length && !palabras.length) return []
  const encaja = h => ids.length
    ? ids.some(id => esDelOficio(h.specialty || '', id))
    : palabras.every(w => normalizar(h.specialty).includes(w))
  const remotos = await searchPorEspecialidad(ids.length ? patronesDe(ids) : palabras)
  const demo = DEMO_MODE ? LOCAL_DEMO_HELPERS.filter(h => h.id >= 2000) : []
  return [...demo, ...(remotos || [])]
    .filter(h => h && encaja(h))
    .filter((h, i, arr) => arr.findIndex(x => x.id === h.id) === i)
    .sort((a, b) => ((a.id >= 2000) !== (b.id >= 2000) ? (a.id >= 2000 ? -1 : 1) : (b.rating || 0) - (a.rating || 0)))
}

export default function Explore() {
  const navigate  = useNavigate()
  const inputRef  = useRef(null)

  // ── State ────────────────────────────────────────────────────
  const [searchText,      setSearchText]     = useState('')
  const [activeCategory,  setActiveCategory] = useState(null)  // null = grid view
  const location = useLocation()

  // LA CATEGORÍA VA EN LA DIRECCIÓN (`/explore?c=salud`). Antes solo vivía
  // en la memoria de esta pantalla: al abrir un profesional y volver atrás,
  // la pantalla se creaba de nuevo y aparecía la rejilla de categorías (dos
  // pasos atrás). Ahora «atrás» vuelve a la lista de esa categoría. Sin `c`
  // (o al tocar «Ver todos» otra vez) se ve la rejilla.
  //
  // Explorar sigue montada (oculta) mientras se ve la ficha de alguien. Antes
  // reaccionaba a esa otra dirección: vaciaba la lista y, al volver, la
  // cargaba de nuevo desde arriba. Ahora solo atiende a `/explore`, y si se
  // vuelve al mismo paso del historial lo deja tal cual estaba.
  const visible = location.pathname === '/explore'
  const catId = new URLSearchParams(location.search).get('c')
  const pasoCargado = useRef(null)
  useEffect(() => {
    if (!visible || pasoCargado.current === location.key) return
    pasoCargado.current = location.key
    const cat = catId && CATEGORIES.find(c => c.id === catId)
    if (cat) cargarCategoria(cat)
    else { setActiveCategory(null); setCategoryResults([]); setSearchText('') }
  }, [visible, catId, location.key])

  // EL SITIO EN LA LISTA. Al ocultarse, la pantalla pierde su desplazamiento
  // (y la vuelta a Inicio lo ponía a cero). Se recuerda el de cada paso del
  // historial y se repone al volver a él; un paso nuevo empieza arriba.
  const cuerpoRef = useRef(null)
  const sitios = useRef({})
  const pasoVisible = useRef(null)
  pasoVisible.current = visible ? location.key : null
  function guardarSitio(e) {
    if (pasoVisible.current) sitios.current[pasoVisible.current] = e.currentTarget.scrollTop
  }
  useLayoutEffect(() => {
    const el = cuerpoRef.current
    if (!visible || !el) return
    const y = sitios.current[location.key] || 0
    const poner = () => { if (el.scrollTop !== y) el.scrollTop = y }
    poner()
    // Por si el contenido tarda un instante en tener su altura (imágenes).
    const f = requestAnimationFrame(poner)
    const t = setTimeout(poner, 150)
    return () => { cancelAnimationFrame(f); clearTimeout(t) }
  }, [visible, location.key])
  const [categoryResults, setCategoryResults] = useState([])
  const [loadingCat,      setLoadingCat]     = useState(false)
  const [sinRed,          setSinRed]         = useState(false)
  const [visibleCount,    setVisibleCount]   = useState(20)
  const [filterAvailable,   setFilterAvailable]   = useState(false)
  const [filterRating,      setFilterRating]      = useState(false)
  const [filterOnline,      setFilterOnline]      = useState(false)
  const [activeSubcategory, setActiveSubcategory] = useState('Todos')
  // Lo que se busca desde la rejilla y lo encontrado: { q, lista }. Mientras
  // llega lo nuevo se sigue viendo lo anterior.
  const consulta = activeCategory ? '' : searchText.trim()
  const [hallado, setHallado] = useState(null)
  useEffect(() => {
    if (consulta.length < 3) return
    let vivo = true
    const t = setTimeout(() => {
      buscarProfesionales(consulta).then(lista => {
        if (vivo) { setHallado({ q: consulta, lista }); setVisibleCount(20) }
      })
    }, 300)
    return () => { vivo = false; clearTimeout(t) }
  }, [consulta])

  // ── AI Search ─────────────────────────────────────────────────

  // EL UMBRAL: Explorar ya no busca por su cuenta. Tenia un motor PARALELO
  // (analisis propio + llamada a la API) que servia una version pobre del
  // producto: sin la voz de Nura, sin el porque, sin el silencio honesto,
  // sin la carta. Ahora entrega la frase a Nura, que es quien sabe.
  // Al pulsar Intro solo se cierra el teclado: la lista ya está debajo.
  function handleSearch(e) {
    e.preventDefault()
    inputRef.current?.blur()
  }
  // Si no encuentra a nadie, se lo puede preguntar a Nüra.
  function preguntarANura() {
    const q = searchText.trim()
    setSearchText('')
    navigate('/', { state: { q } })
  }

  function clearSearch() {
    setSearchText('')
    setActiveCategory(null)
    setVisibleCount(20)
  }

  // ── Category navigation ───────────────────────────────────────
  // Abrir una categoría es un paso más en el historial (ver arriba).
  function openCategory(cat) {
    navigate(`/explore?c=${encodeURIComponent(cat.id)}`, { state: { desdeRejilla: true } })
  }

  async function cargarCategoria(cat) {
    setActiveCategory(cat)
    setSearchText('')
    setVisibleCount(20)
    setFilterAvailable(false)
    setFilterRating(false)
    setFilterOnline(false)
    setActiveSubcategory('Todos')
    setLoadingCat(true)
    setCategoryResults([])
    try {
      // Fetch all subcategories in parallel
      const traer = MOVIDOS.filter(m => m.a === cat.id && !cat.supabaseCategories.includes(m.de))
      const [results, deOtras] = await Promise.all([
        Promise.all(cat.supabaseCategories.map(c => searchHelpers(c))),
        Promise.all(traer.map(m => searchHelpers(m.de).then(l => (l || []).filter(m.es)))),
      ])
      // Fuera de la demo, si no contestó ninguna: es la conexión, no que
      // no haya nadie.
      if (!DEMO_MODE && results.every(r => r === null)) { setSinRed(true); setCategoryResults([]); setLoadingCat(false); return }
      setSinRed(false)
      // Los de ejemplo (id >= 2000) solo en la demo.
      const demoHelpers = DEMO_MODE ? LOCAL_DEMO_HELPERS.filter(h =>
        h.id >= 2000 && (cat.supabaseCategories.includes(h.category) || traer.some(m => m.de === h.category && m.es(h)))
      ) : []

      // Los que se enseñan en otra categoría salen de esta.
      const vaAOtra = h => MOVIDOS.some(m => m.a !== cat.id && cat.supabaseCategories.includes(m.de) && m.es(h))
      let merged = [...demoHelpers, ...results.flat().filter(Boolean), ...deOtras.flat()]
        .filter(h => h && !vaAOtra(h))
        .filter((h, i, arr) => arr.findIndex(x => x.id === h.id) === i)
        .sort((a, b) => {
          // Demo helpers always first
          if ((a.id >= 2000) !== (b.id >= 2000)) return a.id >= 2000 ? -1 : 1
          return (b.rating||0) - (a.rating||0)
        })

      // Fallback: if no results, search all and filter by specialty text
      if (merged.length === 0 && cat.specialtyKeywords) {
        const allHelpers = await searchHelpers(null, [])
        if (allHelpers?.length > 0) {
          const kws = cat.specialtyKeywords
          merged = allHelpers.filter(h => {
            const text = [h.specialty, h.name, h.bio, h.category]
              .filter(Boolean).join(' ').toLowerCase()
            return kws.some(kw => text.includes(kw.toLowerCase()))
          })
        }
      }

      setCategoryResults(merged)
    } catch { setCategoryResults([]) }
    setLoadingCat(false)
  }

  // La flecha de la pantalla hace lo mismo que «atrás»; si se entró directo
  // a una categoría (un enlace), vuelve a la rejilla sin salir de Nüra.
  function goBack() {
    if (location.state?.desdeRejilla) navigate(-1)
    else navigate('/explore', { replace: true })
  }

  // ── Display list ──────────────────────────────────────────────
  const baseList = categoryResults
  const displayList = baseList.filter(h => {
    if (filterAvailable && !h.available) return false
    if (filterRating && (h.rating || 0) < 4) return false
    if (filterOnline && !h.online && !h.modality?.includes('online')) return false
    if (activeSubcategory && activeSubcategory !== 'Todos') {
      const spec = (h.specialty || '').toLowerCase()
      const sub = activeSubcategory.toLowerCase()
      // Exact match
      if (spec === sub) return true
      // Merged groups: subcategory covers multiple specialty variants
      const MERGED = {
        'veterinario a domicilio':              ['veterinario a domicilio', 'veterinaria domicilio urgencias'],
        'adiestrador canino':                   ['adiestrador canino', 'adiestradora canina'],
        'entrenador personal':                  ['entrenador personal', 'entrenadora personal'],
        'guía turístico':                       ['guía turístico', 'guía turística'],
        'abogado de familia':                   ['abogado de familia y divorcios', 'abogada de familia'],
        'abogado extranjería':                  ['abogado extranjería e inmigración', 'abogada extranjería'],
        'cuidadora de mayores':                 ['cuidadora de mayores', 'cuidadora de personas mayores'],
        'auxiliar geriátrica':                  ['auxiliar geriátrica', 'auxiliar geriátrica domicilio'],
        'fontanero':                            ['fontanero', 'fontanero urgencias'],
        'electricista':                         ['electricista', 'electricista domicilio'],
        'albañil':                              ['albañil', 'albañil y reformas pequeñas'],
        'técnico calefacción':                  ['técnico calefacción', 'técnico calderas y calefacción'],
        'pintor':                               ['pintor', 'pintor domicilio', 'pintor de interiores'],
        'manitas del hogar':                    ['manitas del hogar', 'manitas'],
        'montador de muebles ikea y similares': ['montador de muebles ikea y similares', 'montaje de muebles'],
        'mecánico':                             ['mecánico', 'mecánico a domicilio'],
        'técnico aire acondicionado':           ['técnico aire acondicionado', 'aire acondicionado y climatización'],
        'grooming y estética canina':           ['grooming y estética canina', 'peluquera canina'],
        'cuidadora de perros domicilio':        ['cuidadora de perros domicilio', 'cuidador de mascotas'],
        'especialista wifi':                    ['especialista wifi'],
        'desarrollador web':                    ['desarrollador web'],
        'desarrollador de apps':                ['desarrollador de apps'],
        'especialista en ia':                   ['especialista en ia', 'especialista ia'],
      }
      const variants = MERGED[sub]
      if (variants && variants.includes(spec)) return true

      // ── EL OFICIO CONTIENE SU ESPECIALIDAD ──────────────────────────
      // Antes esto devolvia `false` y se acabo: solo valia la coincidencia
      // EXACTA o estar en el mapa de variantes escrito a mano.
      // Filtrar por "Logopeda" daba CERO profesionales, porque los suyos se
      // llaman "Logopeda infantil". Medido en navegador: 10 a 0.
      //
      // El mapa MERGED seguira haciendo falta para lo que ninguna regla
      // deduce —genero gramatical, sinonimos—, pero no puede ser la UNICA
      // via: cada profesional nuevo escribe su especialidad a mano, y nadie
      // va a mantener una lista de variantes de 1008 filas.
      const limpia = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const e = limpia(spec)
      const q = limpia(sub)
      // Palabra completa, no subcadena: "dieta" no debe casar con "dietista"
      // por accidente, pero "Logopeda" si con "Logopeda infantil".
      const comoPalabra = (texto, termino) =>
        new RegExp(`(^|[^\\p{L}])${termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'iu').test(texto)
      if (comoPalabra(e, q)) return true
      // Y al reves: filtrar por "Abogado de familia" encuentra "Abogada de
      // familia y divorcios" si el oficio contiene todas sus palabras.
      const palabras = q.split(/\s+/).filter(w => w.length > 3)
      if (palabras.length > 1 && palabras.every(w => comoPalabra(e, w))) return true

      return false
    }
    return true
  })
  const pagedList   = displayList.slice(0, visibleCount)
  const hasMore     = displayList.length > visibleCount
  const isLoading   = loadingCat
  const isListView  = activeCategory !== null
  const enBusqueda  = consulta.length >= 3
  const encontrados = enBusqueda && hallado ? hallado.lista : null
  const buscado     = hallado?.q || ''

  const hasFilters = filterAvailable || filterRating || filterOnline || activeSubcategory !== 'Todos'
  function resetFilters() {
    setFilterAvailable(false)
    setFilterRating(false)
    setFilterOnline(false)
    setActiveSubcategory('Todos')
    setVisibleCount(20)
  }

  /* ── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <PageHeader
        showBack={!!activeCategory}
        onBack={goBack}
      />

      <div className={styles.body} ref={cuerpoRef} onScroll={guardarSitio} data-scroll-propio>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>Explorar profesionales</span>
          <h1>{activeCategory ? activeCategory.label : '¿Qué necesitas resolver?'}</h1>
          {!activeCategory && <p>Elige una categoría o busca un oficio.</p>}
        </div>

        {/* ── SEARCH BAR (solo en la rejilla: dentro de una categoría
            bastan los filtros, Sergio 2026-10-02) ──────────────────── */}
        {!isListView && <div className={styles.searchWrap}>
          <form className={styles.searchBar} onSubmit={handleSearch}>
            <Search size={16} color="var(--ink-tertiary)" style={{flexShrink:0}} />
            <input
              ref={inputRef}
              className={styles.searchInput}
              aria-label="Buscar profesionales"
              placeholder="Busca un oficio: pintor, fontanero…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(e)}
            />
            {searchText && (
              <button type="button" aria-label="Limpiar búsqueda" className={styles.clearBtn} onClick={clearSearch}>
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </form>
        </div>}

        {/* ── LO ENCONTRADO DESDE LA REJILLA ──────────────── */}
        {!isListView && enBusqueda && (
          <section aria-label="Profesionales encontrados">
            {!encontrados ? (
              <div style={{display:'flex',flexDirection:'column',gap:'var(--space-10)',padding:'0 var(--space-16)'}}>
                <Skeleton variant="card" count={3} />
              </div>
            ) : encontrados?.length ? (
              <>
                <div className={styles.resultsHeader}>
                  <span className={styles.resultCount} role="status">
                    <strong>{encontrados.length}</strong> profesional{encontrados.length !== 1 ? 'es' : ''} para «{buscado}»
                  </span>
                </div>
                <div className={styles.list}>
                  {encontrados.slice(0, visibleCount).map((h, i) => (
                    <div className={styles.resultItem} key={h.id} style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}>
                      <HelperCard helper={h} showPrice />
                    </div>
                  ))}
                </div>
                {encontrados.length > visibleCount && (
                  <div className={styles.loadMoreWrap}>
                    <button className={styles.loadMoreBtn} onClick={() => setVisibleCount(v => v + 20)}>
                      Ver más profesionales
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title={`No he encontrado a nadie para «${buscado}».`}
                hint="Prueba con otra palabra, o cuéntaselo a Nüra y lo busco yo."
                actionLabel="Preguntar a Nüra"
                onAction={preguntarANura}
              />
            )}
          </section>
        )}

        {!isListView && !isLoading && !enBusqueda && (
          <div className={styles.catGrid}>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  className={styles.catCard}
                  onClick={() => openCategory(cat)}
                >
                  <div className={styles.catIconWrap} style={{background: cat.bg}}>
                    <Icon size={23} color={cat.color} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <div className={styles.catInfo}>
                    <span className={styles.catLabel}>{cat.label}</span>
                    <span className={styles.catDesc}>{cat.desc}</span>
                  </div>
                  <ArrowUpRight className={styles.catArrow} size={18} aria-hidden="true" />
                </button>
              )
            })}
          </div>
        )}

        {/* ── LOADING ─────────────────────────────────────── */}
        {isLoading && (
          <div style={{display:'flex',flexDirection:'column',gap:'var(--space-10)',padding:'0 var(--space-16)'}}>
            <Skeleton variant="card" count={5} />
          </div>
        )}


        {/* ── RESULTADOS ──────────────────────────────────── */}
        {isListView && !isLoading && (
          <>
            <section className={styles.filterPanel} aria-label="Filtrar profesionales">
              {activeCategory?.subcategories?.length > 0 && (
                <div className={styles.specialtyFilter}>
                  <label htmlFor="explore-specialty"><SlidersHorizontal size={16} aria-hidden="true" />Especialidad</label>
                  <select id="explore-specialty" className={styles.specialtySelect} value={activeSubcategory}
                    onChange={e => { setActiveSubcategory(e.target.value); setVisibleCount(20) }}>
                    {activeCategory.subcategories.map(sub => <option key={sub} value={sub}>{sub === 'Todos' ? 'Todas las especialidades' : sub}</option>)}
                  </select>
                </div>
              )}
              <div className={styles.filtersRow} role="group" aria-label="Preferencias">
                <button type="button" aria-pressed={filterAvailable}
                  className={`${styles.filterPill} ${filterAvailable ? styles.filterActive : ''}`}
                  onClick={() => { setFilterAvailable(v => !v); setVisibleCount(20) }}>
                  {filterAvailable && <Check size={14} aria-hidden="true" />}Disponible ahora
                </button>
                <button type="button" aria-pressed={filterRating}
                  className={`${styles.filterPill} ${filterRating ? styles.filterActive : ''}`}
                  onClick={() => { setFilterRating(v => !v); setVisibleCount(20) }}>
                  <Star size={14} aria-hidden="true" />4 o más
                </button>
                <button type="button" aria-pressed={filterOnline}
                  className={`${styles.filterPill} ${filterOnline ? styles.filterActive : ''}`}
                  onClick={() => { setFilterOnline(v => !v); setVisibleCount(20) }}>
                  <Globe size={14} aria-hidden="true" />Online
                </button>
              </div>
            </section>
            <div className={styles.resultsHeader}>
              <span className={styles.resultCount} role="status">
                <strong>{displayList.length}</strong> profesional{displayList.length !== 1 ? 'es' : ''}
              </span>
              {hasFilters && <button type="button" className={styles.resetFilters} onClick={resetFilters}><X size={14} aria-hidden="true" />Quitar filtros</button>}
            </div>

            {/* Lista */}
            {pagedList.length > 0 ? (
              <>
                <div className={styles.list} key={`${activeCategory?.id}-${activeSubcategory}`}>
                  {pagedList.map((h, i) => (
                    <div className={styles.resultItem} key={h.id} style={{
                      animationDelay: `${Math.min(i, 5) * 40}ms`,
                    }}>
                      <HelperCard helper={h} showPrice />
                    </div>
                  ))}
                </div>
                {hasMore && (
                  <div className={styles.loadMoreWrap}>
                    <button className={styles.loadMoreBtn} onClick={() => setVisibleCount(v => v + 20)}>
                      Ver más profesionales
                    </button>
                  </div>
                )}
              </>
            ) : sinRed ? (
              <ErrorPanel
                title="No he podido cargar esta categoría."
                hint="Parece un problema de conexión. Vuelve a intentarlo en un momento."
                actionLabel="Reintentar"
                onAction={() => cargarCategoria(activeCategory)}
              />
            ) : hasFilters ? (
              <EmptyState
                title="No hay profesionales con estos filtros."
                hint="Quita los filtros para volver a ver esta categoría."
                actionLabel="Ver la categoría completa"
                onAction={resetFilters}
              />
            ) : (
              <EmptyState
                title="En esta categoría todavía no hay profesionales."
                hint="Prueba con otra, o cuéntame qué necesitas y lo busco yo."
                actionLabel="Ver todas las categorías"
                onAction={goBack}
              />
            )}
          </>
        )}

      </div>
    </div>
  )
}
