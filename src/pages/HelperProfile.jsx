import PageHeader from '../components/PageHeader'
import ObraCard from '../components/ObraCard'
import { Button, SectionLabel, Skeleton } from '../components/ui'
import { getObraDeHelper } from '../data/obraPosts'
import ErrorBoundary from '../components/ErrorBoundary'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Star, Shield, MapPin, MessageCircle, Calendar,
         Share2, UserPlus, UserCheck, Briefcase, BookOpen, Award,
         CheckCircle, Check, Globe, Zap, ChevronRight, Clock } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import RatingModal from '../components/RatingModal'
import styles from './HelperProfile.module.css'
import { DEMO_ENRICHMENTS } from '../data/demoEnrichments'
import { showToast } from '../components/Toast'
import RegisterGate from '../components/RegisterGate'
import { getHelperById } from '../utils/supabase'
import { Badge, LiveDot, Bubble, StatBar } from '../components/ui'

// ── HELPERS ─────────────────────────────────────────────────────────────────

function PostCard({ post }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes || 0)
  return (
    <div className={styles.postCard}>
      <p className={styles.postText}>{post.text}</p>
      <div className={styles.postMeta}>
        <span className={styles.postDate}>{post.date}</span>
        <button className={`${styles.postLike} ${liked ? styles.postLikeActive : ''}`}
          onClick={() => { setLiked(l => !l); setLikes(n => liked ? n-1 : n+1) }}>
          <UserPlus size={12}
            color={liked ? 'var(--red)' : 'rgba(33,29,51,0.3)'} />
          <span>{likes}</span>
        </button>
      </div>
    </div>
  )
}

function BookingModal({ helper, onClose, onBook, onNavigate }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const name = helper?.name?.split(' ')?.[0] || helper?.name || ''

  function confirm() {
    onBook?.(helper, date, time, note)
    setDone(true)
  }

  const style = {
    overlay: {position:'fixed',inset:0,background:'var(--surface-scrim)',WebkitBackdropFilter: 'blur(8px)', backdropFilter:'blur(8px)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center'},
    sheet: {background:'rgba(255,255,255,0.96)',WebkitBackdropFilter: 'blur(32px)', backdropFilter:'blur(32px)',borderRadius:'24px 24px 0 0',padding:'var(--space-24) var(--space-20) 36px',width:'100%',maxWidth:'500px'},
    handle: {width:'36px',height:'4px',background:'var(--surface-muted)',borderRadius:'2px',margin:'0 auto var(--space-20)'},
    input: {width:'100%',padding:'var(--space-12) var(--space-16)',border:'1px solid rgba(33,29,51,0.1)',borderRadius:'var(--radius-card)',fontSize:'var(--text-base)',outline:'none',fontFamily:'-apple-system,Inter,sans-serif',background:'var(--surface-subtle)',boxSizing:'border-box'},
    btnPrimary: {width:'100%',padding:'var(--space-14)',background:'var(--purple)',color:'white',border:'none',borderRadius:'var(--radius-full)',fontSize:'var(--text-sm)',fontWeight:700,cursor:'pointer',transition:'opacity 0.2s'},
    btnSecondary: {width:'100%',padding:'var(--space-12)',background:'var(--surface-subtle)',color:'rgba(33,29,51,0.55)',border:'none',borderRadius:'var(--radius-full)',fontSize:'var(--text-sm)',fontWeight:600,cursor:'pointer'},
  }

  return (
    <div style={style.overlay}>
      <div style={style.sheet}>
        <div style={style.handle} />
        {done ? (
          <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:'var(--space-12)',padding:'var(--space-16) 0'}}>
            {/* Helper avatar */}
            <div style={{position:'relative'}}>
              {helper?.avatarUrl
                ? <img src={helper.avatarUrl} alt={name}
                    style={{width:'68px',height:'68px',borderRadius:'50%',border:'3px solid var(--green-dot)'}} />
                : <div style={{width:'68px',height:'68px',borderRadius:'50%',background:helper?.avatarColor||'var(--purple)',
                    display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'24px',fontWeight:700,
                    border:'3px solid var(--green-dot)'}}>
                    {helper?.avatar||name?.[0]}
                  </div>
              }
              <span style={{position:'absolute',bottom:-2,right:-2,width:'22px',height:'22px',background:'var(--green-dot)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width='12' height='12' viewBox='0 0 12 12' fill='none'><path d='M2 6l3 3 5-5' stroke='white' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'/></svg></span>
            </div>
            <div>
              <h3 style={{fontSize:'var(--text-heading)',fontWeight:800,margin:'0 0 var(--space-4)',color:'rgba(33,29,51,0.85)',letterSpacing:'-0.3px'}}>
                ¡Solicitud enviada!
              </h3>
              <p style={{fontSize:'var(--text-sm)',color:'rgba(33,29,51,0.5)',margin:0,lineHeight:1.6}}>
                {name} recibirá tu solicitud y confirmará en breve.
              </p>
            </div>
            {/* Booking summary */}
            {(date || time) && (
              <div style={{background:'var(--surface-subtle)',border:'1px solid rgba(33,29,51,0.06)',
                borderRadius:'var(--radius-card)',padding:'var(--space-12) var(--space-16)',width:'100%',textAlign:'left'}}>
                {date && <p style={{margin:'0 0 var(--space-4)',fontSize:'var(--text-sm)',color:'rgba(33,29,51,0.6)'}}>
                  {new Date(date).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}
                </p>}
                {time && <p style={{margin:0,fontSize:'var(--text-sm)',color:'rgba(33,29,51,0.6)'}}><Clock size={12} style={{marginRight:'var(--space-4)',verticalAlign:'middle'}}/>{time}h</p>}
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'var(--space-8)',width:'100%',marginTop:'var(--space-4)'}}>
              <Button variant="primary" full onClick={() => { onClose(); onNavigate('/my-services') }}>
                Ver Mis servicios
              </Button>
              <button onClick={onClose} style={style.btnSecondary}>Volver al perfil</button>
            </div>
          </div>
        ) : (
          <>
            <h3 style={{fontSize:'var(--text-md)',fontWeight:800,margin:'0 0 var(--space-4)',color:'rgba(33,29,51,0.85)',letterSpacing:'-0.3px'}}>Solicitar servicio</h3>
            <p style={{fontSize:'var(--text-sm)',color:'rgba(33,29,51,0.4)',margin:'0 0 var(--space-20)'}}>{name} · {helper?.price || 'Precio a consultar'}</p>
            <div style={{display:'flex',flexDirection:'column',gap:'var(--space-10)',marginBottom:'var(--space-20)'}}>
              {/* Day pills */}
              <div>
                <SectionLabel tone="muted" style={{margin:'0 0 var(--space-8)',color:'rgba(33,29,51,0.4)'}}>Fecha</SectionLabel>
                <div className={styles.rowScroll}>
                  {Array.from({length:7},(_,i)=>{
                    const d=new Date(); d.setDate(d.getDate()+i)
                    const iso=d.toISOString().split('T')[0]
                    const lbl=i===0?'Hoy':i===1?'Mañana':d.toLocaleDateString('es-ES',{weekday:'short',day:'numeric'})
                    return (
                      <button key={i} onClick={()=>setDate(iso)} style={{
                        flexShrink:0,padding:'var(--space-8) var(--space-14)',
                        background:date===iso?'var(--purple)':'rgba(33,29,51,0.05)',
                        color:date===iso?'white':'rgba(33,29,51,0.6)',
                        border:'none',borderRadius:'var(--radius-full)',fontSize:'var(--text-xs)',fontWeight:600,
                        cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
                        whiteSpace:'nowrap',
                      }}>{lbl}</button>
                    )
                  })}
                </div>
              </div>
              {/* Time pills */}
              <div>
                <SectionLabel tone="muted" style={{margin:'0 0 var(--space-8)',color:'rgba(33,29,51,0.4)'}}>Hora</SectionLabel>
                <div style={{display:'flex',gap:'var(--space-6)',flexWrap:'wrap'}}>
                  {['9:00','10:00','11:00','12:00','16:00','17:00','18:00','19:00'].map(t=>(
                    <button key={t} onClick={()=>setTime(t)} style={{
                      padding:'7px var(--space-12)',
                      background:time===t?'var(--purple)':'rgba(33,29,51,0.05)',
                      color:time===t?'white':'rgba(33,29,51,0.6)',
                      border:'none',borderRadius:'var(--radius-full)',fontSize:'var(--text-xs)',fontWeight:600,
                      cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
                    }}>{t}</button>
                  ))}
                </div>
              </div>
              <textarea value={note} onChange={e=>setNote(e.target.value)}
                placeholder="Detalles adicionales (opcional)..." rows={3}
                style={{...style.input, resize:'none'}} />
            </div>
            <div className={styles.rowGap8}>
              <button onClick={onClose} style={{...style.btnSecondary,flex:1}}>Cancelar</button>
              <Button variant="primary" onClick={confirm} disabled={!date}
                style={{flex:2}}>
                Enviar solicitud
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── MAIN PROFILE COMPONENT ──────────────────────────────────

function HelperProfileInner() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const location   = useLocation()
  const { user, addService } = useUser()

  const [h, setH]             = useState(location.state?.helper || null)

  // Merge demo enrichment for rich profiles
  const enrichedH = h && h.id >= 2000 && DEMO_ENRICHMENTS[h.id]
    ? { ...DEMO_ENRICHMENTS[h.id], ...h, qualitativeComments: h.qualitativeComments || DEMO_ENRICHMENTS[h.id].qualitativeComments }
    : h
  const [loading, setLoading] = useState(!h)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showRating, setShowRating]   = useState(false)
  const [showGate, setShowGate]       = useState(false)
  const [shared, setShared]           = useState(false)
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    if (!h) {
      const local = HELPERS.find(x => String(x.id) === String(id))
      if (local) { setH(local); setLoading(false); return }
      getHelperById(id).then(r => { if (r) setH(r); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [id])

  if (loading) return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div style={{padding:'var(--space-24) var(--space-16)'}}>
        <Skeleton variant="card" />
        <Skeleton variant="block" style={{marginTop:'var(--space-24)'}} />
        <Skeleton variant="block" />
      </div>
    </div>
  )
  if (!h) return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.notFound}>Perfil no encontrado.</div>
    </div>
  )

  const firstName = enrichedH.name?.split(' ')?.[0] || ''

  // Primary education for hero display
  const mainEdu = enrichedH.education?.[0]

  function handleContact() {
    if (!user) {
      try {
        sessionStorage.setItem('nura_pending_chat', JSON.stringify({ helperId: enrichedH.id, helperName: enrichedH.name }))
        sessionStorage.setItem('nura_return_to', `/chat/${enrichedH.id}`)
      } catch {}
      setShowGate(true); return
    }
    const hasContext = location.state?.userQuery || location.state?.analysis || window.__nuraLastQuery
    if (hasContext) {
      navigate(`/intro/${enrichedH.id}`, {
        state: {
          helper: h,
          userQuery: location.state?.userQuery,
          analysis: location.state?.analysis || window.__nuraLastAnalysis
        }
      })
      return
    }
    navigate(`/chat/${enrichedH.id}`, { state: { helper: h, userQuery: location.state?.userQuery } })
  }

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href)
      .then(() => { setShared(true); showToast('Enlace copiado') })
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
        <div className={`${styles.hero} aurora`}>

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
                      opacity:0, animation:'popIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards'
                    }} />
                : <div style={{
                    width:'96px', height:'96px', borderRadius:'50%',
                    background: enrichedH.avatarColor || 'var(--purple)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'var(--text-num)', fontWeight:700, color:'white',
                    boxShadow:'0 4px 20px rgba(33,29,51,0.15)',
                    animation:'popIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards'
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
              fontFamily:'var(--font-voice)', fontSize:'var(--text-xl)', fontWeight:700, letterSpacing:'-0.8px', color:'var(--ink)',
              letterSpacing:'-0.5px', margin:'0 0 var(--space-4)', textAlign:'center'
            }}>{enrichedH.name}</h1>

            {/* Especialidad */}
            <div style={{
              fontSize:'var(--text-sm)', color:'rgba(33,29,51,0.45)', fontWeight:500,
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
              enrichedH.rating && { value: `${enrichedH.rating}★`, label: `${enrichedH.reviews} valoraciones` },
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
              fontSize:'var(--text-sm)', color:'rgba(33,29,51,0.6)', lineHeight:1.65,
              letterSpacing:'-0.1px', margin:'0 0 var(--space-20)',
              animation:'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both'
            }}>{enrichedH.bio}</p>
          )}

          {/* Señales de actividad local */}
          {enrichedH.reviews >= 30 && (
            <div style={{
              fontSize:'var(--text-xs)', color:'rgba(33,29,51,0.4)',
              marginBottom:'var(--space-16)', textAlign:'center',
              animation:'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both'
            }}>
              {Math.floor(enrichedH.reviews * 0.08 + 2)} personas cerca de ti contactaron con {firstName} este mes
              {enrichedH.reviews >= 100 && (
                <Badge variant="warning" style={{marginLeft:'var(--space-8)'}}>🔥 Muy solicitado</Badge>
              )}
            </div>
          )}

          {/* Trust badges */}
          <div style={{
            display:'flex', gap:'var(--space-6)', flexWrap:'wrap',
            justifyContent:'center', marginBottom:'var(--space-14)',
            animation:'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both'
          }}>
            {[
              enrichedH.verified && '✓ Identidad verificada',
              enrichedH.dniVerified && '✓ DNI comprobado',
              enrichedH.criminalRecordClear && '✓ Sin antecedentes',
            ].filter(Boolean).map(badge => (
              <Badge key={badge} variant="success" size="md">{badge}</Badge>
            ))}
          </div>

          {/* Nüra recomienda — justo antes del CTA */}
          <div style={{
            margin:'0 0 var(--space-14)', padding:'var(--space-12) var(--space-14)',
            background:'var(--surface-subtle)', borderRadius:'var(--radius-card)',
            display:'flex', alignItems:'flex-start', gap:'var(--space-8)',
            animation:'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both'
          }}>
            <img src="/logo-iso.png" alt="Nüra" style={{width:'18px',height:'18px',flexShrink:0,marginTop:'1px',opacity:0.7}} />
            <p style={{
              fontSize:'var(--text-xs)', color:'rgba(33,29,51,0.5)', lineHeight:1.5,
              margin:0
            }}>
              {location.state?.matchReason
                ? `Te recomiendo a ${firstName} porque ${String(location.state.matchReason).replace(/\*\*/g, '').trim().replace(/\.$/, '')}.`
                : `${firstName} es uno de los profesionales mejor valorados en su categoría en Barcelona.`
              }
            </p>
          </div>


        </div>



        {/* ══════════════════════════════════════════════════
            CONTENIDO — flujo continuo, sin tabs
            La persona es la protagonista
            ══════════════════════════════════════════════════ */}

        {getObraDeHelper(enrichedH.id, 2).length > 0 && (
          <section style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards`}} className={styles.section}>
            <h2 className={styles.sectionHeading}>Su obra</h2>
            <div style={{display:'flex', flexDirection:'column', gap:'var(--space-10)'}}>
              {getObraDeHelper(enrichedH.id, 2).map(post => <ObraCard key={post.id} post={post} />)}
            </div>
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

{/* ── Valoraciones ── */}
        {enrichedH.reviews > 0 && (
          <section style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 80ms forwards`}} className={styles.section}>
            <h2 className={styles.sectionHeading}>
              <Star size={14} fill="var(--amber)" color="var(--amber)" /> Lo que dicen de {firstName}
            </h2>
            <div className={styles.ratingRow}>
              <span className={styles.ratingBig}>{enrichedH.rating}</span>
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

        {/* ── Experiencia ── */}
        {enrichedH.experience?.length > 0 && (
          <section style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 160ms forwards`}} className={styles.section}>
            <h2 className={styles.sectionHeading}>
              <Briefcase size={14} /> Trayectoria profesional
            </h2>
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
                        <span>— {exp.managerOpinion.name}, {exp.managerOpinion.role}</span>
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
            <h2 className={styles.sectionHeading}>
              <BookOpen size={14} /> Formación académica
            </h2>
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

        {/* ── Publicaciones ── */}
        {enrichedH.posts?.length > 0 && (
          <section style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 480ms forwards`}} className={styles.section}>
            <h2 className={styles.sectionHeading}>Publicaciones</h2>
            {enrichedH.posts.slice(0,2).map((post, i) => (
              <PostCard key={i} post={post} />
            ))}
          </section>
        )}

        {/* Bottom padding */}
        <div style={{height: '80px'}} />

      </div>

      {/* Modals */}
      {showGate && <RegisterGate reason="contact" onClose={() => setShowGate(false)} />}
      {showRating && <RatingModal helper={h} onClose={() => setShowRating(false)} />}
      {showConfirm && (
        <BookingModal
          helper={h}
          onClose={() => setShowConfirm(false)}
          onBook={addService}
          onNavigate={navigate}
        />
      )}
    
      {/* La Barra de Accion: escribir esta siempre a un pulgar */}
      <div className={styles.actionBar}>
        <Button variant="secondary" style={{flex:'0 1 38%'}}
          onClick={() => user ? setShowConfirm(true) : setShowGate(true)}>
          <Calendar size={14} /> Disponibilidad
        </Button>
        <Button variant="primary" style={{flex:'1 1 62%', boxShadow:'0 4px 16px var(--purple-30)'}}
          onClick={handleContact}>
          <MessageCircle size={15} /> Escribir a {firstName}
        </Button>
      </div>
</div>
  )
}

export default function HelperProfile() {
  return (
    <ErrorBoundary>
      <HelperProfileInner />
    </ErrorBoundary>
  )
}
