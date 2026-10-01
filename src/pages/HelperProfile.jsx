import ErrorPanel from '../components/ErrorPanel'
import errorStyles from '../components/ErrorPanel.module.css'
import { useTitulo } from '../utils/titulo'
import PageHeader from '../components/PageHeader'
import PostCard from '../components/PostCard'
import { proximoHueco, ocupacionesDe } from '../data/horarios'
import CitaModal from '../components/CitaModal'
import { Button, SectionLabel } from '../components/ui'
import { getObraDeHelper, obraAPost } from '../data/obraPosts'
import ErrorBoundary from '../components/ErrorBoundary'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Star, Shield, MapPin, MessageCircle, Calendar,
         Share2, UserPlus, UserCheck, Briefcase, BookOpen, Award,
         CheckCircle, Check, Globe, Zap, ChevronRight, Clock, ThumbsUp, ShieldCheck, ChevronDown } from 'lucide-react'
import { HELPERS_DEMO as HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import RatingModal from '../components/RatingModal'
import { recordarDestino, contextoDeChat } from '../utils/contacto'
import styles from './HelperProfile.module.css'
import PageLoading from '../components/PageLoading'
import { DEMO_ENRICHMENTS } from '../data/demoEnrichments'
import { showToast } from '../components/Toast'
import { compartirEnlace, enlaceDeFicha } from '../utils/compartir'
import RegisterGate from '../components/RegisterGate'
import { getHelperById } from '../utils/supabase'
import { atributosDe, enviarPropuestaCita } from '../utils/escrituras'
import { ETIQUETA_CUALIDAD } from '../utils/cualidades'
import { etiquetaDe } from '../utils/declarado'
import { Badge, LiveDot, Bubble, StatBar } from '../components/ui'
import { getFirstName } from '../utils/name'
import { fmtNota } from '../utils/formato'
import { DEMO_MODE } from '../config'

// ── HELPERS ─────────────────────────────────────────────────────────────────


/** `cambia`: { date, time } de la cita que se está cambiando de hora, si lo es. */
function BookingModal({ helper, onClose, onBook, onNavigate, cambia: cambiaAlAbrir = null }) {
  // Se fija al abrir: al enviar, la cita antigua pasa a cancelada y la ficha
  // deja de pasarla, pero esta hoja sigue siendo un cambio hasta cerrarse.
  const [cambia] = useState(cambiaAlAbrir)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [fallo, setFallo] = useState('')
  const name = getFirstName(helper?.name)
  const diaLargo = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) } catch { return d } }

  // Espera a `onBook`: al cambiar la hora, primero se cancela la antigua y,
  // si no se puede (sin conexión), no se envía nada y se dice.
  async function confirm() {
    setEnviando(true); setFallo('')
    const r = await onBook?.(helper, date, time, note)   // fecha y hora, ya estructuradas
    setEnviando(false)
    if (r === 'fallo') { setFallo('Sin conexión: tu cita sigue como estaba. Prueba otra vez.'); return }
    setDone(true)
  }

  return (
    <CitaModal helper={helper} date={date} time={time} note={note}
      onDate={setDate} onTime={setTime} onNote={setNote} onClose={onClose}
      onConfirm={confirm} submitting={enviando} error={fallo} done={done}
      title={cambia ? 'Cambiar la hora' : 'Solicitar servicio'}
      notice={cambia ? `Tu cita con ${name} del ${diaLargo(cambia.date)}${cambia.time ? ` a las ${cambia.time}` : ''} se cancelará al enviar la nueva hora.` : ''}
      confirmLabel={cambia ? 'Cambiar a esta hora' : 'Enviar solicitud'}
      successTitle={cambia ? '¡Cambio enviado!' : '¡Solicitud enviada!'}
      successText={DEMO_MODE ? `${name} recibirá tu solicitud y confirmará en breve.` : `Se la hago llegar a ${name}. Su respuesta te llegará en el chat.`}
      onServices={() => { onClose(); onNavigate('/my-services') }}
      backLabel="Volver al perfil" />
  )
}

// ── MAIN PROFILE COMPONENT ──────────────────────────────────

// Todo lo que ha publicado, en UNA sola forma. El perfil tenia dos
// conceptos de publicacion conviviendo (Su obra + Publicaciones de v1,
// con componentes y disenos distintos): eso es justo lo que hacia que
// perfil y muro no se parecieran.
function publicacionesDe(helper) {
  const obra = getObraDeHelper(helper?.id, 3).map(obraAPost)
  const viejos = (helper?.posts || []).map((p, i) => ({
    id: 'lp' + i, helperId: helper?.id,
    autor: helper?.name, rol: helper?.specialty, verified: helper?.verified,
    dateLabel: p.date, body: p.text, kind: 'obra',
  }))
  return [...obra, ...viejos].slice(0, 4)
}

function HelperProfileInner() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const location   = useLocation()
  // El regreso desde el acceso puede apuntar a una publicación recogida.
  const [obraView, setObraView] = useState(null)
  const verTodaLaObra = obraView?.hash === location.hash
    ? obraView.expanded : location.hash.startsWith('#comentarios-')
  const [verTrayectoria, setVerTrayectoria] = useState(false)
  const { user, addService, cancelarCita, citas, services } = useUser()

  const [h, setH]             = useState(location.state?.helper || null)

  // Merge demo enrichment for rich profiles
  const enrichedH = h && DEMO_MODE && h.id >= 2000 && DEMO_ENRICHMENTS[h.id]
    ? { ...DEMO_ENRICHMENTS[h.id], ...h, qualitativeComments: h.qualitativeComments || DEMO_ENRICHMENTS[h.id].qualitativeComments }
    : h
  const [loading, setLoading] = useState(!h)
  // Sin red no es lo mismo que «no existe»: se ofrece reintentar.
  const [sinRed, setSinRed]   = useState(false)
  const [intento, setIntento] = useState(0)
  useTitulo(enrichedH?.name ? [enrichedH.name, enrichedH.specialty].filter(Boolean).join(' · ') : null)
  // «Elegir otra hora» (Mis servicios) llega con el id de la cita cancelada:
  // la agenda se abre sola y la cita nueva la sustituye.
  const otraHora = location.state?.otraHora ?? null
  // «Cambiar la hora»: además, la cita antigua (aún en pie) se cancela al
  // enviar la nueva, y al profesional le llega como un cambio.
  const vieja = otraHora != null && location.state?.cambiar ? (services || []).find(s => s.id === otraHora) : null
  const cambia = vieja && ['pending', 'confirmed'].includes(vieja.status) ? { date: vieja.date, time: vieja.time } : null
  const [showConfirm, setShowConfirm] = useState(() => otraHora != null)
  const [showRating, setShowRating]   = useState(false)
  const [showGate, setShowGate]       = useState(false)
  const [shared, setShared]           = useState(false)
  const [following, setFollowing] = useState(false)
  // Perfil vivo: lo medido y lo que dicen sus clientes, cada dato con su prueba.
  const [atributos, setAtributos] = useState([])
  useEffect(() => {
    let vivo = true
    atributosDe(id).then(a => { if (vivo) setAtributos(Array.isArray(a) ? a : []) })
    return () => { vivo = false }
  }, [id])

  useEffect(() => {
    if (!h) {
      const local = HELPERS.find(x => x && String(x.id) === String(id))
      if (local) { setH(local); setLoading(false); return }
      getHelperById(id).then(r => { if (r) setH(r); setSinRed(false); setLoading(false) })
        .catch(() => { setSinRed(true); setLoading(false) })
    }
  }, [id, intento])   // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageLoading kind="helper" />
  if (!h) return (
    <div className={`${errorStyles.frame} ${errorStyles.withHeader}`}>
      <PageHeader showBack />
      <ErrorPanel
        title={sinRed ? 'No he podido cargar esta ficha' : 'Esta ficha ya no está disponible'}
        hint={sinRed ? 'No he podido conectar. Puedes intentarlo de nuevo.' : 'Puede que el enlace sea antiguo. Puedes buscar a otro profesional.'}
        actionLabel={sinRed ? 'Reintentar' : 'Buscar a alguien'}
        onAction={sinRed ? () => { setLoading(true); setIntento(n => n + 1) } : () => navigate('/')}
        secondaryLabel={sinRed ? 'Buscar a alguien' : undefined}
        onSecondary={() => navigate('/')}
      />
    </div>
  )

  const firstName = getFirstName(enrichedH.name) || ''
  // El próximo hueco libre, a la vista sin abrir la agenda.
  const hueco = proximoHueco(enrichedH, ocupacionesDe(citas, services))

  // Resumen de formación en su bloque propio
  const mainEdu = enrichedH.education?.[0]

  function handleContact() {
    if (!user) {
      recordarDestino(enrichedH.id)
      // La ficha abre una reja en vez de llevarte al registro: aqui la
      // persona ya esta leyendo un perfil y sacarla de golpe seria peor.
      setShowGate(true); return
    }
    navigate(`/chat/${enrichedH.id}`, { state: contextoDeChat(h, location.state) })
  }

  async function handleShare() {
    const nombre = getFirstName(enrichedH?.name) || ''
    const r = await compartirEnlace({
      url: enlaceDeFicha(enrichedH?.id ?? id),
      titulo: `${enrichedH?.name || 'Profesional'} en Nüra`,
      texto: `Te paso a ${nombre}${enrichedH?.specialty ? ', ' + enrichedH.specialty.toLowerCase() : ''}. Le puedes escribir por Nüra:`,
    })
    if (r === 'copiado') { setShared(true); showToast('Enlace copiado') }
    else if (r === 'fallo') showToast('No he podido copiar el enlace')
  }

  return (
    <div className={styles.page}>
      <PageHeader showBack rightEl={
        <button className={styles.shareBtn} onClick={handleShare} aria-label="Compartir perfil">
          {shared
            ? <span style={{display:'flex',alignItems:'center',gap:'var(--space-4)',color:'var(--green)',fontSize:'var(--text-xs)',fontWeight:700}}><Check size={11} color='var(--green)' strokeWidth={3}/> Copiado</span>
            : <Share2 size={17} color="rgba(33,29,51,0.55)" />}
        </button>
      } />

      <div className={styles.scroll}>

        {/* ══════════════════════════════════════════════════
            HERO EDITORIAL — la persona, no el formulario
            ══════════════════════════════════════════════════ */}
        <div className={styles.hero}>

          {/* Avatar grande — protagonista */}
          <div style={{
            display:'flex', flexDirection:'column', alignItems:'center',
            paddingTop:'var(--space-8)', paddingBottom:'var(--space-20)',
            borderBottom:'1px solid rgba(33,29,51,0.06)',
            marginBottom:'var(--space-20)'
          }}>
            <div style={{position:'relative', marginBottom:'var(--space-14)'}}>
              {enrichedH.avatarUrl
                ? <img src={enrichedH.avatarUrl} alt={enrichedH.name}
                    style={{
                      width:'96px', height:'96px', borderRadius:'50%', objectFit:'cover',
                      boxShadow:'0 4px 20px rgba(33,29,51,0.12)',
                    }} />
                : <div style={{
                    width:'96px', height:'96px', borderRadius:'50%',
                    background: enrichedH.avatarColor || 'var(--purple)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'var(--text-num)', fontWeight:700, color:'white',
                    boxShadow:'0 4px 20px rgba(33,29,51,0.15)',
                  }}>
                    {enrichedH.name?.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase() || enrichedH.avatar}
                  </div>
              }
              {enrichedH.available && (
                <LiveDot size={20} style={{position:'absolute', bottom:2, right:2, border:'3px solid white'}} />
              )}
            </div>

            {/* Nombre grande */}
            <h1 style={{
              fontFamily:'var(--font-voice)', fontSize:'var(--text-xl)', fontWeight:700, color:'var(--ink)',
              letterSpacing:'-0.5px', margin:'0 0 var(--space-4)', textAlign:'center'
            }}>{enrichedH.name}</h1>

            {/* Especialidad */}
            <div style={{
              fontSize:'var(--text-sm)', color:'var(--ink-tertiary)', fontWeight:500,
              textAlign:'center', marginBottom:'var(--space-10)'
            }}>
              {enrichedH.specialty}
              {enrichedH.dniVerified && (
                <Badge variant="success" size="md" style={{marginLeft:'var(--space-8)', fontWeight:700}}>
                  <Shield size={9} color='#065f46' /> Verificado
                </Badge>
              )}
            </div>

            {/* Stats como logros — no como números */}
            <StatBar stats={[
              enrichedH.rating && { value: `${fmtNota(enrichedH.rating)}★`, label: enrichedH.reviews === 1 ? '1 valoración' : `${enrichedH.reviews} valoraciones` },
              enrichedH.price && enrichedH.price !== 'Consultar' && {
                value: enrichedH.price.split('/')[0],
                label: enrichedH.price.includes('/') ? enrichedH.price.split('/')[1] : 'por sesión'
              },
              enrichedH.responseTime && { value: enrichedH.responseTime, label: 'respuesta', color: 'var(--green)' },
            ].filter(Boolean)} />
          </div>

          {/* La cita — protagonismo editorial */}
          {enrichedH.quote && (
            <div style={{
              margin:'0 0 var(--space-20)', padding:'var(--space-20)',
              background:'linear-gradient(135deg, var(--purple-05) 0%, var(--purple-05) 100%)',
              borderRadius:'var(--radius-card)',
              animation:'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both'
            }}>
              <SectionLabel tone="brand" style={{marginBottom:'var(--space-10)'}}>En sus propias palabras</SectionLabel>
              <p style={{
                fontSize:'var(--text-md)', fontWeight:500, color:'var(--ink)',
                lineHeight:1.55, letterSpacing:'-0.2px', margin:0,
                fontFamily:'var(--font-voice)'
              }}>"{enrichedH.quote}"</p>
            </div>
          )}

          {/* Bio */}
          {enrichedH.bio && (
            <p style={{
              /* Misma receta que "En sus propias palabras": cuerpo, tinta plena,
                 la Voz y linea holgada. Es la presentacion del profesional:
                 estaba a 13px y en gris al 60%. */
              fontSize:'var(--text-base)', color:'var(--ink)', lineHeight:1.55,
              letterSpacing:'-0.2px', margin:'0 0 var(--space-20)',
              fontFamily:'var(--font-voice)'
            }}>{enrichedH.bio}</p>
          )}

          {/* Señales de actividad local */}
          {/* CIFRA INVENTADA, SOLO EN LA DEMO. "N personas cerca de ti
              contactaron con Carlos este mes" se calculaba como
              reviews × 0,08 + 2: no mide nada. Con un profesional real seria
              mentir a quien esta decidiendo si confiar en el — el mismo caso
              que las cifras del perfil (paso 5 de plan-perfil.md). */}
          {DEMO_MODE && enrichedH.reviews >= 30 && (
            <div style={{
              fontSize:'var(--text-sm)', color:'var(--ink-secondary)',
              marginBottom:'var(--space-16)', textAlign:'center',
              animation:'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both'
            }}>
              {Math.floor(enrichedH.reviews * 0.08 + 2)} personas cerca de ti contactaron con {firstName} este mes
              {enrichedH.reviews >= 100 && (
                <Badge variant="warning" style={{marginLeft:'var(--space-8)'}}><Zap size={12} aria-hidden="true" /> Muy solicitado</Badge>
              )}
            </div>
          )}

          {/* Aquí iba «Nüra lo ha comprobado» (identidad, DNI, sin
              antecedentes). Sergio lo quitó el 2026-10-01: es lo obvio en
              todos y repetirlo en cada ficha sobraba. */}

          {/* Nüra recomienda — justo antes del CTA */}
          <div style={{
            margin:'0 0 var(--space-14)', padding:'var(--space-12) var(--space-14)',
            background:'var(--surface-subtle)', borderRadius:'var(--radius-card)',
            display:'flex', alignItems:'flex-start', gap:'var(--space-8)',
            animation:'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both'
          }}>
            <img src="/logo-iso.png" alt="Nüra" style={{width:'18px',height:'18px',flexShrink:0,marginTop:'1px',opacity:0.7}} />
            <p style={{
              fontSize:'var(--text-sm)', color:'var(--ink-secondary)', lineHeight:1.5,
              margin:0
            }}>
              {location.state?.matchReason
                ? `Te recomiendo a ${firstName} porque ${String(location.state.matchReason).replace(/\*\*/g, '').trim().replace(/\.$/, '')}.`
                // Se decia de CUALQUIER profesional, tuviera la nota que
                // tuviera: "uno de los mejor valorados de Barcelona". Ahora
                // solo lo que se sabe.
                : (enrichedH.reviews >= 10
                    ? `${enrichedH.reviews} personas han valorado a ${firstName}, con una media de ${fmtNota(enrichedH.rating)}.`
                    : `${firstName} está empezando en Nüra: aún tiene pocas valoraciones.`)
              }
            </p>
          </div>


        </div>



        {/* ══════════════════════════════════════════════════
            CONTENIDO — flujo continuo, sin tabs
        {/* ══════════════════════════════════════════════════
            PRIMERO LAS PERSONAS, DESPUES LOS PAPELES
            ──────────────────────────────────────────────────
            Medido antes: `Formación académica` ocupaba 672px y
            `Trayectoria profesional` 458 — mas de una pantalla entera
            dedicada a donde estudio Carlos. Y "Lo que dicen de Carlos",
            que es lo que de verdad decide si confias en alguien, iba la
            CUARTA con 360px.
            Era un curriculum, no un perfil. Y el documento de fundacion
            dice que Nüra descubre talento "incluso fuera de titulos
            academicos tradicionales", mientras la ficha ponia el titulo
            academico como lo mas grande de todo.
            ══════════════════════════════════════════════════ */}

{/* ── Perfil vivo: solo lo que tiene prueba (docs/perfil-vivo.md §2) ── */}
        <ConPrueba atributos={atributos} firstName={firstName} sinNota={enrichedH.reviews > 0} />
        <LoQueCuenta atributos={atributos} firstName={firstName} />

{/* ── Valoraciones ── */}
        {enrichedH.reviews > 0 && (
          <section style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 80ms forwards`}} className={styles.section}>
            <h2 className={styles.sectionHeading}>
              <Star size={14} fill="var(--amber)" color="var(--amber)" /> Lo que dicen de {firstName}
            </h2>
            <div className={styles.ratingRow}>
              <span className={styles.ratingBig}>{fmtNota(enrichedH.rating)}</span>
              <div>
                <div className={styles.ratingStars}>
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={13}
                      fill={n <= Math.round(enrichedH.rating) ? 'var(--amber)' : 'rgba(33,29,51,0.1)'}
                      color={n <= Math.round(enrichedH.rating) ? 'var(--amber)' : 'rgba(33,29,51,0.1)'} />
                  ))}
                </div>
                <span className={styles.ratingCount}>{enrichedH.reviews} valoraciones</span>
              </div>
            </div>
            {enrichedH.qualitativeComments?.length > 0 && (
              <div style={{display:'flex',flexDirection:'column',gap:'var(--space-10)',marginTop:'var(--space-4)'}}>
                {enrichedH.qualitativeComments.slice(0,3).map((c, i) => (
                  <Bubble
                    key={i}
                    index={i}
                    text={typeof c === 'string' ? c : c.text}
                    author={typeof c === 'string' ? null : c.user}
                    style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) ${i*80}ms both`}}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Cómo puedo ayudarte ── */}

        {(enrichedH.tags?.length > 0 || enrichedH.specialty) && (
          <section style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards`}} className={`${styles.section} ${styles.sectionFirst}`}>
            <h2 className={styles.sectionHeading}>Puedo ayudarte con</h2>
            <div className={styles.ayudaList}>
              {(() => {
                // Build deduplicated list of real capabilities
                const MODAL_KEYWORDS = ['presencial','online','a domicilio','domicilio','sesion','visita','videollamada','disponib']
                const isModal = s => MODAL_KEYWORDS.some(k => s.toLowerCase().includes(k))
                const isSimilar = (a, b) => {
                  const x = a.toLowerCase().trim(), y = b.toLowerCase().trim()
                  if (x === y) return true
                  if (x.includes(y) || y.includes(x)) return true
                  const stem = Math.min(x.length, y.length) - 2
                  return stem >= 5 && x.slice(0, stem) === y.slice(0, stem)
                }
                const raw = [enrichedH.specialty, ...(enrichedH.tags || [])].filter(Boolean)
                const accepted = []
                const items = raw.filter(s => {
                  if (isModal(s)) return false
                  if (accepted.some(a => isSimilar(a, s))) return false
                  accepted.push(s)
                  return true
                }).slice(0, 8)
                return items.map((item, i) => (
                  <div key={i} className={styles.ayudaItem}>
                    <Check size={13} color="var(--purple)" strokeWidth={2.5} style={{flexShrink:0}} />
                    <span>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                  </div>
                ))
              })()}
              {enrichedH.presential && (
                <div className={styles.ayudaItem}>
                  <Check size={13} color="var(--purple)" strokeWidth={2.5} style={{flexShrink:0}} />
                  <span>Sesiones presenciales</span>
                </div>
              )}
              {enrichedH.online && (
                <div className={styles.ayudaItem}>
                  <Check size={13} color="var(--purple)" strokeWidth={2.5} style={{flexShrink:0}} />
                  <span>Sesiones online</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Experiencia y estudios son una sección propia, antes de los casos. */}
        {(enrichedH.experience?.length > 0 || enrichedH.education?.length > 0) && (
          <section className={`${styles.section} ${styles.career}`} aria-labelledby="trayectoria-titulo">
            <div className={styles.careerHeader}>
              <span className={styles.careerIcon} aria-hidden="true"><Briefcase size={21} /></span>
              <div>
                <h2 id="trayectoria-titulo" className={styles.careerTitle}>Trayectoria y formación</h2>
                <p className={styles.careerLead}>La experiencia y los estudios de {firstName}.</p>
              </div>
            </div>
            {!verTrayectoria && (
              <div className={styles.careerPreview}>
                {enrichedH.experience?.[0] && (
                  <div className={styles.careerFact}>
                    <span className={styles.careerLabel}>Experiencia</span>
                    <p className={styles.careerFactTitle}>{enrichedH.experience[0].role}</p>
                    <p className={styles.careerMeta}>{[enrichedH.experience[0].company, enrichedH.experience[0].period].filter(Boolean).join(' · ')}</p>
                  </div>
                )}
                {mainEdu && (
                  <div className={styles.careerFact}>
                    <span className={styles.careerLabel}>Formación</span>
                    <p className={styles.careerFactTitle}>{mainEdu.title || mainEdu.degree}</p>
                    <p className={styles.careerMeta}>{mainEdu.institution || mainEdu.school}</p>
                  </div>
                )}
              </div>
            )}
            <button type="button" className={styles.careerToggle}
              aria-expanded={verTrayectoria} aria-controls="trayectoria-detalles"
              onClick={() => setVerTrayectoria(v => !v)}>
              <span>{verTrayectoria ? 'Ocultar experiencia y estudios' : 'Ver experiencia y estudios'}</span>
              <ChevronDown size={18} aria-hidden="true" />
            </button>
            <div id="trayectoria-detalles" className={styles.careerDetails} hidden={!verTrayectoria}>
        {/* ── Experiencia ── */}
        {enrichedH.experience?.length > 0 && (
          <section style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 160ms forwards`}} className={styles.section}>
            <h3 className={styles.sectionHeading}>
              <Briefcase size={14} /> Trayectoria profesional
            </h3>
            <div className={styles.expList}>
              {enrichedH.experience.map((exp, i) => (
                <div key={i} className={styles.expItem}>
                  <div className={styles.expDot} />
                  {i < enrichedH.experience.length - 1 && <div className={styles.expLine} />}
                  <div className={styles.expContent}>
                    <div className={styles.expRole}>{exp.role}</div>
                    <div className={styles.expCompany}>
                      {exp.company}
                      {exp.verifiedByCompany && (
                        <span className={styles.expVerified}>
                          <CheckCircle size={9} color="var(--green)" /> Verificado
                        </span>
                      )}
                    </div>
                    <div className={styles.expPeriod}>{exp.period}{exp.location ? ` · ${exp.location}` : ''}</div>
                    {exp.description && <p className={styles.expDesc}>{exp.description}</p>}
                    {exp.achievements?.length > 0 && (
                      <ul className={styles.expAchievements}>
                        {exp.achievements.slice(0,3).map((a,j) => <li key={j}>{a}</li>)}
                      </ul>
                    )}
                    {exp.competencies?.length > 0 && (
                      <div className={styles.expTags}>
                        {exp.competencies.slice(0,4).map((c,j) => (
                          <span key={j} className={styles.expTag}>{c}</span>
                        ))}
                      </div>
                    )}
                    {exp.managerOpinion && (
                      <div className={styles.quote}>
                        <p>"{exp.managerOpinion.text?.slice(0,120)}{exp.managerOpinion.text?.length > 120 ? '…' : ''}"</p>
                        <span>{exp.managerOpinion.name}, {exp.managerOpinion.role}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Formación ── */}
        {enrichedH.education?.length > 0 && (
          <section style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 240ms forwards`}} className={styles.section}>
            <h3 className={styles.sectionHeading}>
              <BookOpen size={14} /> Formación académica
            </h3>
            <div className={styles.expList}>
              {enrichedH.education.map((edu, i) => (
                <div key={i} className={styles.expItem}>
                  <div className={styles.expDot} />
                  {i < enrichedH.education.length - 1 && <div className={styles.expLine} />}
                  <div className={styles.expContent}>
                    <div className={styles.expRole}>{edu.title || edu.degree}</div>
                    <div className={styles.expCompany}>{edu.institution || edu.school}</div>
                    {edu.year && <div className={styles.expPeriod}>{edu.year}</div>}
                    {edu.details && (
                      <p className={styles.expDesc}>{edu.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
            </div>
          </section>
        )}

        {getObraDeHelper(enrichedH.id, 2).length > 0 && (
          <section className={`${styles.section} ${styles.workSection}`} aria-labelledby="su-obra-titulo">
            <div className={styles.workHeading}>
              <h2 id="su-obra-titulo" className={styles.sectionHeading}>Su obra</h2>
              <p>Cómo trabaja, contado por {getFirstName(enrichedH.name)}.</p>
            </div>
            <div id="su-obra-publicaciones" className={styles.workList}>
              {(verTodaLaObra ? publicacionesDe(enrichedH) : publicacionesDe(enrichedH).slice(0, 1))
                .map(p => <PostCard key={p.id} post={p} />)}
            </div>
            {publicacionesDe(enrichedH).length > 1 && (
              <button type="button" onClick={() => setObraView({ hash: location.hash, expanded: !verTodaLaObra })} className={styles.workMore}
                aria-expanded={verTodaLaObra} aria-controls="su-obra-publicaciones">
                <span>{verTodaLaObra ? 'Ver menos publicaciones' : `Ver las ${publicacionesDe(enrichedH).length} publicaciones de ${getFirstName(enrichedH.name)}`}</span>
                <ChevronDown size={18} aria-hidden="true" />
              </button>
            )}
          </section>
        )}

        {/* ── Habilidades ── */}
        {enrichedH.skills?.length > 0 && (
          <section style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 320ms forwards`}} className={styles.section}>
            <h2 className={styles.sectionHeading}>En qué destaca</h2>
            <div className={styles.tags}>
              {enrichedH.skills.map((s, i) => (
                <span key={i} className={styles.tag}>{s}</span>
              ))}
            </div>
          </section>
        )}

        {/* ── Idiomas ── */}
        {enrichedH.languages?.length > 0 && (
          <section style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 400ms forwards`}} className={styles.section}>
            <h2 className={styles.sectionHeading}>
              <Globe size={14} /> Idiomas
            </h2>
            <div className={styles.tags}>
              {enrichedH.languages.map((l, i) => (
                <span key={i} className={`${styles.tag} ${styles.tagIdioma}`}>{l}</span>
              ))}
            </div>
          </section>
        )}

        {/* Bottom padding */}
        {/* El espaciador de 80px a mano murio: .scroll ya reserva el fondo
            con su padding-bottom. Sumaba la reserva DOS veces (medido: 105px
            de hueco entre el ultimo contenido y la barra de accion). */}

      </div>

      {/* Modals */}
      {/* Tras crear la cuenta, directo al chat que quería abrir: antes volvía
          a la ficha (o a Inicio) y tenía que buscar el botón otra vez. */}
      {showGate && <RegisterGate reason="contact" volverA={`/chat/${enrichedH.id}`} onClose={() => setShowGate(false)} />}
      {showRating && <RatingModal helper={h} onClose={() => setShowRating(false)} />}
      {showConfirm && h && (
        <BookingModal
          helper={h}
          onClose={() => {
            setShowConfirm(false)
            // El encargo de «Elegir otra hora» se usa una vez: volver atrás
            // en el historial no debe reabrir la agenda.
            if (otraHora != null) {
              const resto = { ...(location.state || {}) }
              delete resto.otraHora
              delete resto.cambiar
              navigate(location.pathname, { replace: true, state: resto })
            }
          }}
          cambia={cambia}
          onBook={async (hh, date, time, note) => {
            // Cambiar la hora: primero se cancela la antigua (su hora queda
            // libre). Sin conexión no se toca nada.
            if (cambia) {
              const r = await cancelarCita({ helperId: vieja.helperId, fecha: vieja.date, hora: vieja.time, motivo: 'cambio' })
              if (r === 'fallo') return 'fallo'
            }
            addService(hh, date, time, note, otraHora)
            if (!DEMO_MODE) enviarPropuestaCita(hh, date, time, note, user?.name?.split(' ')?.[0], cambia ? { fecha: cambia.date, hora: cambia.time } : null)
          }}
          onNavigate={navigate}
        />
      )}
    
      {/* La Barra de Accion: escribir esta siempre a un pulgar */}
      <div className={styles.actionBar}>
        <Button variant="secondary" style={{flex:'0 1 38%', flexDirection:'column', gap:0, lineHeight:1.15}}
          onClick={() => user ? setShowConfirm(true) : setShowGate(true)}
          aria-label={hueco ? `Disponibilidad. Próximo hueco: ${textoHueco(hueco)}` : 'Disponibilidad'}>
          <span style={{display:'inline-flex', alignItems:'center', gap:'var(--space-6)'}}><Calendar size={14} /> Disponibilidad</span>
          {hueco && <span style={{fontSize:11, fontWeight:600, color:'var(--green-ink, #067647)'}}>{textoHueco(hueco)}</span>}
        </Button>
        <Button variant="primary" style={{flex:'1 1 62%', boxShadow:'0 4px 16px var(--purple-30)'}}
          onClick={handleContact}>
          <MessageCircle size={15} /> Escribir a {firstName}
        </Button>
      </div>
</div>
  )
}

function textoHueco({ fecha, hora, dentro }) {
  if (dentro === 0) return `Hoy ${hora}`
  if (dentro === 1) return `Mañana ${hora}`
  const d = new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }).replace('.', '')
  return `${d} ${hora}`
}

function tiempoHumano(min) {
  if (min < 60) return 'en menos de 1 h'
  if (min < 180) return 'entre 1 y 3 h'
  if (min < 1440) return 'el mismo día'
  return `en ${Math.round(min / 1440)} días`
}

// Un rasgo sin prueba no se enseña: cada línea dice de dónde sale.
function ConPrueba({ atributos, firstName, sinNota }) {
  const de = (clave, fuente) => atributos.find(a => a.clave === clave && a.fuente === fuente)
  const volveria = de('volveria', 'clientes')
  const estrellas = !sinNota && de('estrellas', 'clientes')
  const tiempo = de('tiempo_respuesta', 'medido')
  const tasa = de('tasa_respuesta', 'medido')
  const cualidades = atributos
    .filter(a => a.fuente === 'clientes' && a.clave.startsWith('cualidad:') && ETIQUETA_CUALIDAD[a.clave.slice(9)])
    .sort((a, b) => (b.valor?.n || 0) - (a.valor?.n || 0))
    .slice(0, 6)
  if (!volveria && !estrellas && !tiempo && !tasa && !cualidades.length) return null

  const filas = [
    volveria && { icono: <ThumbsUp size={15} />, texto: `${volveria.valor.si} de ${volveria.valor.total} volverían a llamar a ${firstName}`, fuente: 'Lo dicen sus clientes' },
    estrellas && { icono: <Star size={15} />, texto: `${fmtNota(estrellas.valor.media)} de nota`, fuente: estrellas.prueba },
    tiempo && { icono: <Clock size={15} />, texto: `Suele contestar ${tiempoHumano(tiempo.valor.mediana_minutos)}`, fuente: `Medido por Nüra en ${tiempo.valor.n === 1 ? '1 mensaje' : `${tiempo.valor.n} mensajes`}` },
    tasa && { icono: <MessageCircle size={15} />, texto: `Contesta ${Math.round(100 * tasa.valor.respondidos / tasa.valor.recibidos)} % de los mensajes`, fuente: `Medido por Nüra · ${tasa.prueba}` },
  ].filter(Boolean)

  return (
    <section style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 40ms forwards`}} className={styles.section}>
      <h2 className={styles.sectionHeading}><ShieldCheck size={14} /> Su historial en Nüra</h2>
      {filas.length > 0 && (
        <ul className={styles.pruebas}>
          {filas.map((f, i) => (
            <li key={i} className={styles.prueba}>
              <span className={styles.pruebaIcono}>{f.icono}</span>
              <span>
                <span className={styles.pruebaTexto}>{f.texto}</span>
                <span className={styles.pruebaFuente}>{f.fuente}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {cualidades.length > 0 && (
        <div className={styles.cualidades}>
          {cualidades.map(c => (
            <span key={c.clave} className={styles.cualidad}>
              {ETIQUETA_CUALIDAD[c.clave.slice(9)]}
              <span className={styles.cualidadN}>{c.prueba}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  )
}

// Lo DECLARADO: lo que el profesional dice de si y confirmo (perfil vivo
// §4). Se enseña como suyo, no como comprobado: «lo dice ella».
const ORDEN_DECLARADO = ['vehiculo', 'anos_experiencia', 'personas', 'especialidad', 'idioma', 'disponibilidad', 'titulo']
function LoQueCuenta({ atributos, firstName }) {
  const suyos = atributos.filter(a => a.fuente === 'declarado' && !(a.clave === 'vehiculo' && a.valor === false))
  if (!suyos.length) return null
  const tipo = c => c.includes(':') ? c.slice(0, c.indexOf(':')) : c
  const ordenados = [...suyos].sort((a, b) => ORDEN_DECLARADO.indexOf(tipo(a.clave)) - ORDEN_DECLARADO.indexOf(tipo(b.clave)))
  return (
    <section style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 60ms forwards`}} className={styles.section}>
      <h2 className={styles.sectionHeading}>Lo que cuenta {firstName}</h2>
      <div className={styles.tags}>
        {ordenados.map(a => <span key={a.clave} className={styles.tag}>{etiquetaDe(a.clave, a.valor)}</span>)}
      </div>
      <p className={styles.declaradoPie}>Lo dice {firstName} y lo ha confirmado. Nüra no lo ha comprobado.</p>
    </section>
  )
}

export default function HelperProfile() {
  return (
    <ErrorBoundary>
      <HelperProfileInner />
    </ErrorBoundary>
  )
}
