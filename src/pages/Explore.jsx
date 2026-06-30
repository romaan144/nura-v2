import { useState, useEffect, useRef } from 'react'
import PageHeader from '../components/PageHeader'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, ArrowLeft, Loader2, SlidersHorizontal,
         Heart, Wrench, BookOpen, Scale, Home, PawPrint,
         Dumbbell, Baby, MapPin, Star, Laptop, Palette, Car, PartyPopper, Globe } from 'lucide-react'
import { searchHelpers, getAllHelpers } from '../utils/supabase'
import { HELPERS as LOCAL_DEMO_HELPERS } from '../data/helpers'
import { analyzeNeed, matchHelpers } from '../utils/matching'
import { useUser } from '../context/UserContext'
import HelperCard from '../components/HelperCard'
import styles from './Explore.module.css'

// ── CATEGORÍAS ────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'salud',
    label: 'Salud y bienestar',
    desc: 'Psicólogos, logopedas, médicos y bienestar',
    icon: Heart,
    color: '#FF6B6B',
    bg: 'rgba(255,107,107,0.10)',
    supabaseCategories: ['salud'],
    subcategories: ['Todos', 'Psicóloga', 'Neuropsicóloga', 'Logopeda', 'Fisioterapeuta', 'Nutricionista', 'Dietista', 'Pilates', 'Yoga', 'Osteopatía', 'Masajista', 'Mindfulness y meditación'],
  },
  {
    id: 'tecnico',
    label: 'Técnicos',
    desc: 'Fontaneros, electricistas y reparaciones',
    icon: Wrench,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.10)',
    supabaseCategories: ['tecnico'],
    subcategories: ['Todos', 'Fontanero', 'Electricista', 'Albañil', 'Pintor', 'Carpintero', 'Cerrajero', 'Técnico aire acondicionado', 'Técnico calefacción', 'Técnico gas natural', 'Técnico electrodomésticos', 'Reparación de móviles'],
  },
  {
    id: 'clases',
    label: 'Clases y formación',
    desc: 'Idiomas, música y refuerzo escolar',
    icon: BookOpen,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.10)',
    supabaseCategories: ['clases', 'educacion'],
    subcategories: ['Todos', 'Inglés todos los niveles', 'Francés', 'Alemán', 'Chino mandarín', 'Matemáticas ESO y Bachillerato', 'Física y Química', 'Biología y Geología', 'Historia y Ciencias Sociales', 'Lengua y Literatura Española', 'Dibujo artístico', 'Piano y solfeo', 'Guitarra clásica y moderna', 'Programación Python y web', 'EBAU — Preparación acceso'],
    specialtyKeywords: ['profesor', 'clases', 'idiomas', 'inglés', 'matemáticas', 'música', 'guitarra', 'piano', 'refuerzo', 'academia', 'tutor'],
  },
  {
    id: 'asesoria',
    label: 'Asesoría',
    desc: 'Abogados, gestores y consultoría',
    icon: Scale,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.10)',
    supabaseCategories: ['legal'],
    subcategories: ['Todos', 'Abogado laboralista', 'Abogado penal', 'Abogado de familia', 'Abogado mercantil y startups', 'Abogado extranjería', 'Abogado herencias y sucesiones', 'Abogado arrendamientos y propiedad', 'Abogado administrativo', 'Asesor fiscal', 'Asesora contable', 'Asesor financiero', 'Gestora administrativa'],
  },
  {
    id: 'hogar',
    label: 'Hogar',
    desc: 'Limpieza, cocina y ayuda doméstica',
    icon: Home,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.10)',
    supabaseCategories: ['hogar', 'limpieza'],
    subcategories: ['Todos', 'Limpieza doméstica', 'Limpieza por horas', 'Limpieza profunda', 'Planchado a domicilio', 'Organización del hogar', 'Cocinero a domicilio', 'Manitas del hogar', 'Montador de muebles IKEA y similares', 'Pintor de interiores', 'Electricista domicilio urgencias', 'Albañil reformas parciales', 'Carpintero a medida', 'Jardinero y mantenimiento de terrazas', 'Diseñador de interiores', 'Arquitecto reformas domicilio'],
  },
  {
    id: 'mascotas',
    label: 'Mascotas',
    desc: 'Cuidadores, paseos y adiestramiento',
    icon: PawPrint,
    color: '#F97316',
    bg: 'rgba(249,115,22,0.10)',
    supabaseCategories: ['mascotas'],
    subcategories: ['Todos', 'Paseadora de perros', 'Cuidadora de perros domicilio', 'Cuidadora felina en casa', 'Pet sitter vacaciones', 'Grooming y estética canina', 'Adiestrador canino', 'Educación cachorros', 'Veterinario a domicilio'],
  },
  {
    id: 'entrenamiento',
    label: 'Entrenamiento',
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
    label: 'Cuidado de personas',
    desc: 'Cuidadores, auxiliares y compañía',
    icon: Baby,
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.10)',
    supabaseCategories: ['cuidado'],
    subcategories: ['Todos', 'Cuidadora de mayores', 'Cuidadora nocturna', 'Cuidadora personas con Alzheimer', 'Cuidadora post-operatorio', 'Auxiliar geriátrica', 'Auxiliar personas con discapacidad', 'Ayuda a domicilio integral', 'Enfermera domicilio', 'Niñera', 'Canguro', 'Asistente personal'],
  },
  {
    id: 'tecnologia',
    label: 'Tecnología',
    desc: 'Técnicos, desarrollo web y apps',
    icon: Laptop,
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.10)',
    supabaseCategories: ['tecnologia'],
    subcategories: ['Todos', 'Técnico informático', 'Reparación de ordenadores', 'Reparación de móviles', 'Especialista WiFi', 'Diseñadora web', 'Desarrollador web', 'Desarrollador de apps', 'Especialista en IA'],
  },
  {
    id: 'diseno',
    label: 'Creatividad y diseño',
    desc: 'Fotógrafos, diseñadores y creativos',
    icon: Palette,
    color: '#F43F5E',
    bg: 'rgba(244,63,94,0.10)',
    supabaseCategories: ['diseno'],
    subcategories: ['Todos', 'Diseñadora gráfica', 'Diseñador UX/UI', 'Fotógrafa', 'Videógrafo', 'Editora de vídeo', 'Community manager', 'Copywriter'],
  },
  {
    id: 'automocion',
    label: 'Automoción',
    desc: 'Mecánicos y cuidado del vehículo',
    icon: Car,
    color: '#64748B',
    bg: 'rgba(100,116,139,0.10)',
    supabaseCategories: ['automocion'],
    subcategories: ['Todos', 'Mecánico', 'Electricidad del automóvil', 'Limpieza de vehículos', 'Detailing'],
  },
  {
    id: 'eventos',
    label: 'Eventos',
    desc: 'DJs, animadores y wedding planners',
    icon: PartyPopper,
    color: '#F97316',
    bg: 'rgba(249,115,22,0.10)',
    supabaseCategories: ['eventos'],
    subcategories: ['Todos', 'DJ profesional', 'Animadora infantil', 'Wedding planner', 'Decorador de eventos', 'Mago'],
  },
  {
    id: 'idiomas',
    label: 'Viajes e idiomas',
    desc: 'Guías, traductores e intérpretes',
    icon: Globe,
    color: '#0EA5E9',
    bg: 'rgba(14,165,233,0.10)',
    supabaseCategories: ['idiomas'],
    subcategories: ['Todos', 'Guía turístico', 'Traductora chino-español', 'Traductor árabe-español', 'Intérprete', 'Profesora de inglés'],
  },
]

export default function Explore() {
  const navigate  = useNavigate()
  const { addSearch, cacheHelpers } = useUser()
  const inputRef  = useRef(null)

  // ── State ────────────────────────────────────────────────────
  const [searchText,      setSearchText]     = useState('')
  const [activeCategory,  setActiveCategory] = useState(null)  // null = grid view
  const location = useLocation()

  // Reset to grid when user taps Profesionales in BottomNav while already in /explore
  useEffect(() => {
    setActiveCategory(null)
    setSearchText('')
  }, [location.key])
  const [categoryResults, setCategoryResults] = useState([])
  const [loadingCat,      setLoadingCat]     = useState(false)
  const [aiResults,       setAiResults]      = useState(null)
  const [aiSearching,     setAiSearching]    = useState(false)
  const [visibleCount,    setVisibleCount]   = useState(20)
  const [filterAvailable,   setFilterAvailable]   = useState(false)
  const [filterRating,      setFilterRating]      = useState(false)
  const [filterOnline,      setFilterOnline]      = useState(false)
  const [activeSubcategory, setActiveSubcategory] = useState('Todos')

  // ── AI Search ─────────────────────────────────────────────────
  async function runAiSearch(query) {
    if (!query.trim()) return
    setAiSearching(true)
    setAiResults(null)
    setActiveCategory(null)
    addSearch?.(query)
    try {
      const need    = analyzeNeed(query)
      const remote  = await searchHelpers(need.category, need.keywords)
      if (remote?.length > 0) { setAiResults(remote); setAiSearching(false); return }
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 200,
          messages: [{ role: 'user', content: `Clasifica esta búsqueda en una categoría: "${query}". Categorías: logopedia, tecnico, limpieza, cuidado, mascotas, matematicas, entrenador, salud, legal, hogar. Responde solo la categoría.` }]
        })
      })
      const aiCat = (await res.json())?.content?.[0]?.text?.trim().toLowerCase() || need.category
      const fallback = await searchHelpers(aiCat, need.keywords)
      setAiResults(fallback || [])
    } catch { setAiResults([]) }
    setAiSearching(false)
  }

  function handleSearch(e) {
    e.preventDefault()
    if (searchText.trim()) runAiSearch(searchText)
  }

  function clearSearch() {
    setSearchText('')
    setAiResults(null)
    setActiveCategory(null)
    setVisibleCount(20)
  }

  // ── Category navigation ───────────────────────────────────────
  async function openCategory(cat) {
    setActiveCategory(cat)
    setAiResults(null)
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
      const results = await Promise.all(
        cat.supabaseCategories.map(c => searchHelpers(c))
      )
      // Inject local demo helpers (id >= 2000) that match this category — they appear first
      const demoHelpers = LOCAL_DEMO_HELPERS.filter(h =>
        h.id >= 2000 && cat.supabaseCategories.includes(h.category)
      )

      let merged = [...demoHelpers, ...results.flat().filter(Boolean)]
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

  function goBack() {
    setActiveCategory(null)
    setCategoryResults([])
    setVisibleCount(20)
  }

  // ── Display list ──────────────────────────────────────────────
  const baseList = aiResults ?? categoryResults
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
        'pintor':                               ['pintor', 'pintor domicilio'],
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
      return false
    }
    return true
  })
  const pagedList   = displayList.slice(0, visibleCount)
  const hasMore     = displayList.length > visibleCount
  const isLoading   = aiSearching || loadingCat
  const isListView  = activeCategory !== null || aiResults !== null

  /* ── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <PageHeader
        showBack={!!activeCategory}
        onBack={goBack}
      />

      <div className={styles.body}>

        {/* ── SEARCH BAR ──────────────────────────────────── */}
        <div className={styles.searchWrap}>
          <form className={styles.searchBar} onSubmit={handleSearch}>
            {aiSearching
              ? <Loader2 size={16} color="var(--purple)" style={{animation:'spin 1.2s linear infinite', flexShrink:0}} />
              : <Search size={16} color="var(--ink-tertiary)" style={{flexShrink:0}} />
            }
            <input
              ref={inputRef}
              className={styles.searchInput}
              placeholder="Buscar profesionales..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(e)}
            />
            {(searchText || isListView) && (
              <button type="button" className={styles.clearBtn} onClick={clearSearch}>
                ✕
              </button>
            )}
          </form>
        </div>

        {/* ── GRID DE CATEGORÍAS ──────────────────────────── */}
        {!isListView && !isLoading && (
          <div style={{
            padding:'8px 16px 4px', textAlign:'center',
            fontSize:'11px', color:'rgba(0,0,0,0.32)',
            fontWeight:500, letterSpacing:'0.2px'
          }}>
            🏘 47 personas en Barcelona usan Nüra esta semana · 1.008 profesionales verificados
          </div>
        )}
        {!isListView && !isLoading && (
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
                    <Icon size={24} color={cat.color} strokeWidth={1.8} />
                  </div>
                  <div className={styles.catInfo}>
                    <span className={styles.catLabel}>{cat.label}</span>
                    <span className={styles.catDesc}>{cat.desc}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* ── LOADING ─────────────────────────────────────── */}
        {isLoading && (
          <div style={{display:'flex',flexDirection:'column',gap:'10px',padding:'0 16px'}}>
            {[0,1,2,3,4].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton skeleton-avatar" />
                <div className="skeleton-body">
                  <div className="skeleton skeleton-line-lg" />
                  <div className="skeleton skeleton-line-md" />
                  <div className="skeleton skeleton-line-sm" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── RESULTADOS ──────────────────────────────────── */}
        {isListView && !isLoading && (
          <>
            {/* Header de resultados */}
            <div className={styles.resultsHeader} style={{animation:"fadeInUp 0.25s ease-out forwards"}}>
              {activeCategory && (
                <div className={styles.catPill} style={{ '--cat-color': activeCategory.color, '--cat-bg': activeCategory.bg }}>
                  {(() => { const Icon = activeCategory.icon; return <Icon size={13} color={activeCategory.color} /> })()}
                  <span>{activeCategory.label}</span>
                </div>
              )}
              <span className={styles.resultCount}>
                {displayList.length} profesional{displayList.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {/* Subcategorías */}
            {activeCategory?.subcategories?.length > 0 && (
              <div className={styles.subCatRow}>
                {activeCategory.subcategories.map(sub => (
                  <button
                    key={sub}
                    className={`${styles.subCatPill} ${activeSubcategory === sub ? styles.subCatActive : ''}`}
                    style={activeSubcategory === sub ? {background: activeCategory.color, borderColor: activeCategory.color} : {}}
                    onClick={() => { setActiveSubcategory(sub); setVisibleCount(20) }}>
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {/* Filtros */}
            <div className={styles.filtersRow}>
              <button
                className={`${styles.filterPill} ${filterAvailable ? styles.filterActive : ''}`}
                onClick={() => { setFilterAvailable(v => !v); setVisibleCount(20) }}>
                Disponible ahora
              </button>
              <button
                className={`${styles.filterPill} ${filterRating ? styles.filterActive : ''}`}
                onClick={() => { setFilterRating(v => !v); setVisibleCount(20) }}>
                4★ o más
              </button>
              <button
                className={`${styles.filterPill} ${filterOnline ? styles.filterActive : ''}`}
                onClick={() => { setFilterOnline(v => !v); setVisibleCount(20) }}>
                Online
              </button>
            </div>

            {/* Lista */}
            {pagedList.length > 0 ? (
              <>
                <div className={styles.list} key={`${activeCategory}-${activeSubcategory}`}>
                  {pagedList.map((h, i) => (
                    <div key={h.id} style={{
                      animation: `cardCascade 0.35s ease-out ${i * 55}ms both`,
                    }}>
                      <HelperCard helper={h} onClick={() => navigate(`/helper/${h.id}`)} />
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
            ) : (
              <div className={styles.empty}>
                <Search size={40} color="var(--ink-border)" strokeWidth={1.3} />
                <p>No encontramos profesionales en esta categoría.</p>
                <button className={styles.emptyBtn} onClick={goBack}>
                  Ver todas las categorías
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
