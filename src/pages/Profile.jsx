import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { Button, SectionLabel } from '../components/ui'
import { useState as useStateObra } from 'react'
import ObraComposer from '../components/ObraComposer'
import PostCard from '../components/PostCard'
import { getObraDeHelper, obraAPost } from '../data/obraPosts'
import { useNavigate } from 'react-router-dom'
import { LogOut, Edit2, Check, X, Award, MessageCircle,
         Heart, ClipboardList, User, Phone, Search, Star , UserPlus, UserCheck } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { Badge, StatBar } from '../components/ui'
import HelperCard from '../components/HelperCard'
import { proSignals } from '../utils/proSignals'
import styles from './Profile.module.css'
import { NURA_BUILD } from '../config'

// ── Tu semana: la voz de Nüra para quien trabaja ──
// Gramática: frase humana primero, cifras discretas después, cero vanidad.
function buildSemana({ contactedHelpers, citas, misObras, obraPropia }) {
  const abiertas = (contactedHelpers || []).filter(c => c && c.confirmed === undefined).length
  const proximas = (citas || []).filter(ci => {
    const c = (contactedHelpers || []).find(x => (x.id || x) === ci.helperId)
    return c && c.confirmed === undefined
  })
  const piezas = (misObras || []).length + (obraPropia || 0)
  const trozos = []
  if (abiertas > 0) trozos.push(`**${abiertas}** ${abiertas === 1 ? 'conversación abierta' : 'conversaciones abiertas'}`)
  if (proximas.length > 0) trozos.push(`una cita el **${proximas[0].label}**`)
  const frase = trozos.length
    ? `Esta semana tienes ${trozos.join(' y ')}.`
    : piezas > 0
    ? 'Semana tranquila. Tu obra sigue trabajando por ti.'
    : 'Semana tranquila. Cuando publiques algo, Nüra sabrá recomendarte mejor.'
  const accion = abiertas > 0
    ? { txt: 'Responder mensajes', to: '/chats' }
    : proximas.length > 0
    ? { txt: 'Ver la cita', to: '/chats' }
    : { txt: 'Publicar en tu obra', to: null }
  return { frase, abiertas, citas: proximas.length, piezas, accion }
}

export default function Profile() {
  const {
    user, logout, updateUser,
    chats, ratings, searchHistory, favorites, isFollowing, following,
    services, personas, removePersona, helpersCache, contactedHelpers, citas, misObras
  } = useUser()

  // ── El Primer Día del Profesional ──
  const hp = user?.helperProfile || {}
  const proQuote = hp.quote || hp.bio || ''
  const [quoteDraft, setQuoteDraft] = useState('')
  const proSig = proSignals(user?.name || '')
  const proPreview = user?.isHelper ? {
    id: 'me',
    name: user.name,
    specialty: hp.specialty || hp.skill || hp.categoria || 'Profesional de Nüra',
    price: hp.price,
    zone: hp.zone || hp.city || 'Barcelona',
    quote: proQuote || undefined,
    verified: true,
    avatarUrl: `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name || 'pro')}`,
  } : null
  function saveQuote() {
    const v = quoteDraft.trim()
    if (!v) return
    updateUser({ helperProfile: { ...hp, quote: v } })
    setQuoteDraft('')
  }
  const navigate = useNavigate()
  const [composerOpen, setComposerOpen] = useStateObra(false)

  const [editingName, setEditingName]   = useState(false)
  const [nameInput,   setNameInput]     = useState('')
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneInput,  setPhoneInput]    = useState('')

  /* ── Guest ─────────────────────────────────────────────── */
  if (!user) return (
    <div className={styles.page}>
      <div className={styles.noUser}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.noUserLogo} />
        <h2 className={styles.noUserTitle}>Crea tu cuenta gratis</h2>
        <p className={styles.noUserDesc}>Solo tarda 30 segundos.</p>
        <div style={{display:'flex',flexDirection:'column',gap:'var(--space-12)',width:'100%',maxWidth:'280px',margin:'var(--space-20) 0'}}>
          {[
            [MessageCircle, 'Escribe a cualquier profesional'],
            [UserPlus,       'Sigue a tus profesionales favoritos'],
            [ClipboardList, 'Consulta tu historial de búsquedas'],
            [Star,          'Valora a los profesionales que contratas'],
          ].map(([Icon, text]) => (
            <div key={text} style={{display:'flex',alignItems:'center',gap:'var(--space-12)'}}>
              <Icon size={16} color="var(--purple)" strokeWidth={1.8} style={{flexShrink:0}} />
              <span style={{fontSize:'var(--text-sm)',color:'rgba(33,29,51,0.65)',fontWeight:500}}>{text}</span>
            </div>
          ))}
        </div>
        <button className={styles.loginBtn} onClick={() => navigate('/login')}>
          Crear cuenta gratis
        </button>
        <button className={styles.helperBtn} onClick={() => navigate('/register-helper')}>
          Quiero ser Profesional
        </button>
      </div>
    </div>
  )

  /* ── Helpers ────────────────────────────────────────────── */
  function saveName()  { if (nameInput.trim())  updateUser({ name: nameInput.trim() });  setEditingName(false) }
  function savePhone() { if (phoneInput.trim())  updateUser({ phone: phoneInput.trim() }); setEditingPhone(false) }

  const joinedDate = user.joined
    ? new Date(user.joined).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : null

  const searchCount  = searchHistory?.length || 0
  const chatCount    = chats?.length || 0
  const favCount     = favorites?.length || 0

  const recentSearches = [...new Set(
    (searchHistory || []).map(s => typeof s === 'string' ? s : s.query)
  )].slice(0, 3)

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <>
    <div className={styles.page}>
      <PageHeader rightEl={
        <button className={styles.logoutIcon} onClick={() => { logout(); navigate('/') }}>
          <LogOut size={17} />
        </button>
      } />

      <div className={styles.scroll}>

        {/* ── ZONA 1: IDENTIDAD ─────────────────────────── */}
        <div className={styles.identity} style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards`}}>
          <div className={styles.avatarWrap}>
            <img
              src={`https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name || 'user')}`}
              alt={user.name} className={styles.avatar}
            />
            {user.isHelper && (
              <div className={styles.avatarBadge}>
                <Award size={12} color="white" />
              </div>
            )}
          </div>

          {editingName ? (
            <div className={styles.editRow}>
              <input className={styles.editInput} value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') saveName(); if (e.key==='Escape') setEditingName(false) }}
                autoFocus maxLength={40} />
              <button className={styles.editConfirm} onClick={saveName}><Check size={15} /></button>
              <button className={styles.editCancel} onClick={() => setEditingName(false)}><X size={15} /></button>
            </div>
          ) : (
            <button className={styles.nameTap} onClick={() => { setNameInput(user.name); setEditingName(true) }}>
              <h2 className={styles.name} style={{fontFamily:'var(--font-voice)', fontWeight:700, letterSpacing:'-0.7px'}}>{user.name}</h2>
              <Edit2 size={13} className={styles.editHint} />
            </button>
          )}

          {joinedDate && (
            <p className={styles.memberSince}>En Nüra desde {joinedDate}</p>
          )}

          {editingPhone ? (
            <div className={styles.editRow} style={{marginTop: 4}}>
              <input className={styles.editInput} value={phoneInput} placeholder="6XX XXX XXX"
                onChange={e => setPhoneInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') savePhone(); if (e.key==='Escape') setEditingPhone(false) }}
                autoFocus type="tel" maxLength={15} />
              <button className={styles.editConfirm} onClick={savePhone}><Check size={15} /></button>
              <button className={styles.editCancel} onClick={() => setEditingPhone(false)}><X size={15} /></button>
            </div>
          ) : (
            <button className={styles.phoneBtn} onClick={() => { setPhoneInput(user.phone || ''); setEditingPhone(true) }}>
              <Phone size={11} strokeWidth={1.8} />
              {user.phone ? user.phone : 'Añadir teléfono'}
            </button>
          )}
        </div>

        {/* ── PROFILE COMPLETION ─────────────────────────── */}
        {user && (() => {
          const fields = [
            !!user.name, !!user.phone, (searchHistory?.length > 0),
            (following?.length > 0), !!user.avatar
          ]
          const pct = Math.round((fields.filter(Boolean).length / fields.length) * 100)
          const missing = []
          if (!user.phone) missing.push('teléfono')
          if (!following?.length) missing.push('seguir profesionales')
          if (!searchHistory?.length) missing.push('hacer tu primera búsqueda')
          return pct < 100 ? (
            <div style={{margin:'0 var(--space-16) var(--space-12)',padding:'var(--space-14) var(--space-16)',background:'white',borderRadius:'var(--radius-card)',boxShadow:'0 1px 8px rgba(33,29,51,0.06)',border:'1px solid rgba(33,29,51,0.07)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'var(--space-8)'}}>
                <span style={{fontSize:'var(--text-sm)',fontWeight:700,color:'var(--ink)',letterSpacing:'-0.2px'}}>Tu perfil está al {pct}%</span>
                <span style={{fontSize:'var(--text-xs)',color:'rgba(33,29,51,0.38)'}}>Mejora tus matches</span>
              </div>
              <div style={{height:'6px',background:'rgba(33,29,51,0.07)',borderRadius:'var(--radius-full)',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,background:'var(--purple)',borderRadius:'var(--radius-full)',transition:'width 0.6s ease'}} />
              </div>
              {missing.length > 0 && (
                <p style={{fontSize:'var(--text-xs)',color:'rgba(33,29,51,0.45)',marginTop:'var(--space-8)',lineHeight:1.4}}>
                  Añade: {missing.join(' · ')}
                </p>
              )}
            </div>
          ) : null
        })()}

        {/* ── EL ESPEJO: LAS PERSONAS DE TU VIDA ────────── */}
        {(personas || []).length > 0 && (
          <div style={{margin:'0 0 var(--space-20)', animation:'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 60ms both'}}>
            <SectionLabel tone="brand" style={{marginBottom:'var(--space-10)'}}>Las personas de tu vida</SectionLabel>
            <div style={{display:'flex', flexDirection:'column', gap:'var(--space-8)'}}>
              {personas.map(p => {
                const helperNames = (p.contactedHelperIds || [])
                  .map(id => helpersCache?.[id]?.name?.split(' ')?.[0] || helpersCache?.[String(id)]?.name?.split(' ')?.[0])
                  .filter(Boolean)
                return (
                  <div key={p.id} style={{
                    background:'white', borderRadius:'var(--radius-md)',
                    border:'1px solid var(--ink-border)', padding:'var(--space-12) var(--space-14)',
                    display:'flex', alignItems:'flex-start', gap:'var(--space-10)'
                  }}>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{
                        fontSize:'var(--text-sm)', fontWeight:700, color:'var(--ink)',
                        letterSpacing:'-0.1px', marginBottom:'var(--space-4)', textTransform:'capitalize'
                      }}>{p.label.replace('tu ', '')}</div>
                      {(p.atributos || []).length > 0 && (
                        <div style={{display:'flex', gap:'var(--space-4)', flexWrap:'wrap', marginBottom: helperNames.length ? '6px' : 0}}>
                          {p.atributos.map(a => <Badge key={a} variant="neutral">{a}</Badge>)}
                        </div>
                      )}
                      {helperNames.length > 0 && (
                        <div style={{fontSize:'var(--text-xs)', color:'var(--green)', fontWeight:500}}>
                          ✓ {helperNames.join(', ')} {helperNames.length === 1 ? 'ayuda' : 'ayudan'} con esto
                        </div>
                      )}
                    </div>
                    <button onClick={() => removePersona(p.id)} style={{
                      background:'none', border:'none', padding:'var(--space-2)',
                      color:'var(--ink-disabled)', flexShrink:0, cursor:'pointer'
                    }} aria-label={`Olvidar a ${p.label}`}>
                      <X size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
            <p style={{fontSize:'var(--text-xs)', color:'var(--ink-tertiary)', marginTop:'var(--space-8)', lineHeight:1.4}}>
              Nüra recuerda esto para ayudarte mejor. Puedes borrar cualquier persona cuando quieras.
            </p>
          </div>
        )}


        {user.isHelper && (() => {
          const sem = buildSemana({ contactedHelpers, citas, misObras,
            obraPropia: getObraDeHelper(user.helperId || user.id, 9).filter(o => !o.mine).length })
          return (
            <div style={{margin:'0 0 var(--space-20)', padding:'var(--space-16)', background:'white',
              border:'1px solid var(--purple-20)', borderRadius:'var(--radius-md)',
              boxShadow:'var(--shadow-md)', animation:'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 200ms both'}}>
              <SectionLabel tone="brand" style={{marginBottom:'var(--space-8)'}}>
                Tu semana
              </SectionLabel>
              <p style={{fontFamily:'var(--font-voice)', fontSize:'var(--text-base)', fontWeight:600,
                letterSpacing:'-0.4px', lineHeight:1.4, color:'var(--ink)', margin:'0 0 var(--space-12)'}}
                dangerouslySetInnerHTML={{__html: sem.frase.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}} />
              <div style={{display:'flex', gap:'18px', marginBottom:'var(--space-12)'}}>
                {[[sem.abiertas, 'abiertas'], [sem.citas, 'citas'], [sem.piezas, 'publicaciones']].map(([n, l]) => (
                  <div key={l}>
                    <div style={{fontSize:'var(--text-heading)', fontWeight:700, color:'var(--ink)', lineHeight:1}}>{n}</div>
                    <div style={{fontSize:'var(--text-xs)', color:'var(--ink-tertiary)', marginTop:'var(--space-3)'}}>{l}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => sem.accion.to ? navigate(sem.accion.to) : setComposerOpen(true)}
                style={{width:'100%', background:'var(--purple-10)', color:'var(--purple)',
                  border:'none', borderRadius:'var(--radius-full)', padding:'11px',
                  fontSize:'var(--text-sm)', fontWeight:700, cursor:'pointer'}}>
                {sem.accion.txt} →
              </button>
            </div>
          )
        })()}

        {user.isHelper && (
          <div style={{margin:'0 0 var(--space-20)', animation:'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 240ms both'}}>
            <SectionLabel tone="brand" style={{marginBottom:'var(--space-10)'}}>
              Así te ven quienes te necesitan
            </SectionLabel>
            <Button variant="primary" full onClick={() => setComposerOpen(true)}
              style={{margin:'var(--space-12) 0 var(--space-10)'}}>
              ✍️ Publicar en tu obra
            </Button>
            {getObraDeHelper(user.helperId || user.id, 2).length > 0 && (
              <div style={{display:'flex', flexDirection:'column', gap:'var(--space-10)', marginBottom:'var(--space-12)'}}>
                {getObraDeHelper(user.helperId || user.id, 2).map(o => <PostCard key={o.id} post={obraAPost(o)} />)}
              </div>
            )}

            <div style={{pointerEvents:'none'}}>
              <HelperCard helper={proPreview} showPrice />
            </div>
            <div style={{marginTop:'var(--space-12)', display:'flex', justifyContent:'center'}}>
              <StatBar stats={[
                { value: proSig.vistasHoy, label: 'vistas hoy' },
                { value: proSig.busquedasSemana, label: 'búsquedas en tu zona' },
                { value: '—', label: 'conexiones ✓' },
              ]} />
            </div>
            {!proQuote ? (
              <div style={{marginTop:'var(--space-12)', background:'var(--purple-10)',
                border:'1px solid var(--purple-20)', borderRadius:'var(--radius-md)', padding:'var(--space-14)'}}>
                <div style={{fontSize:'var(--text-sm)', fontWeight:700, color:'var(--ink)', marginBottom:'var(--space-4)'}}>
                  Tu primer paso
                </div>
                <p style={{fontSize:'var(--text-xs)', color:'var(--ink-secondary)', margin:'0 0 var(--space-10)', lineHeight:1.5}}>
                  Añade tu cita personal — es lo primero que leen, con tu voz.
                  Los perfiles con cita generan mucha más confianza.
                </p>
                <textarea value={quoteDraft} onChange={e => setQuoteDraft(e.target.value)}
                  placeholder="Ej: Cuido a cada persona como cuidaría a mi propia familia."
                  aria-label="Tu cita personal"
                  style={{width:'100%', minHeight:'64px', border:'1px solid var(--ink-border)',
                    borderRadius:'var(--radius-sm)', padding:'var(--space-10)', fontSize:'var(--text-sm)',
                    fontFamily:'var(--font-voice)', resize:'none', background:'white'}} />
                <button onClick={saveQuote} disabled={!quoteDraft.trim()}
                  style={{marginTop:'var(--space-8)', background: quoteDraft.trim() ? 'var(--purple)' : 'rgba(33,29,51,0.15)',
                    color:'white', border:'none', borderRadius:'var(--radius-full)', padding:'9px var(--space-16)',
                    fontSize:'var(--text-xs)', fontWeight:700}}>
                  Guardar mi cita
                </button>
              </div>
            ) : (
              <div style={{marginTop:'var(--space-12)', fontSize:'var(--text-xs)', color:'var(--ink-tertiary)',
                display:'flex', alignItems:'center', flexWrap:'wrap', gap:'var(--space-6)'}}>
                <Badge variant="success" size="xs">✓ Cita añadida</Badge>
                <span>Tu primera conexión verificada aparecerá aquí cuando ocurra.</span>
              </div>
            )}
          </div>
        )}

        {/* ── TU MUNDO: la cita próxima ── */}
        {(() => {
          const cp = (citas || []).slice().reverse().find(ci => {
            const c = (contactedHelpers || []).find(x => (x.id || x) === ci.helperId)
            return c && c.confirmed === undefined
          })
          if (!cp) return null
          const hf = cp.helperName?.split(' ')?.[0] || cp.helperName
          return (
            <div style={{margin:'0 0 var(--space-20)', padding:'var(--space-14) var(--space-16)', background:'white',
              border:'1px solid var(--ink-border)', borderRadius:'var(--radius-md)',
              boxShadow:'var(--shadow-sm)', display:'flex', alignItems:'center', gap:'var(--space-10)'}}>
              <span style={{fontSize:'var(--text-md)'}}>📅</span>
              <div style={{fontSize:'var(--text-sm)', color:'var(--ink)', lineHeight:1.45}}>
                El {cp.label}, <strong>{hf}</strong>{cp.personaLabel ? <> está con {cp.personaLabel}</> : <> — vuestra primera cita</>}. Todo listo 💜
              </div>
            </div>
          )
        })()}

        {/* ── ZONA 2: ACTIVIDAD HUMANA ──────────────────── */}
        <div className={styles.activityZone} style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 80ms forwards`}}>
          <p className={styles.zoneLabel}>Tu actividad</p>
          <div className={styles.activityGrid}>
            <button className={styles.activityCard} onClick={() => navigate('/')}>
              <span className={styles.activityNum}>{searchCount}</span>
              <span className={styles.activityDesc}>
                {searchCount === 1 ? 'búsqueda realizada' : 'búsquedas realizadas'}
              </span>
              <Search size={16} className={styles.activityIcon} strokeWidth={1.5} />
            </button>
            <button className={styles.activityCard} onClick={() => navigate('/chats')}>
              <span className={styles.activityNum}>{chatCount}</span>
              <span className={styles.activityDesc}>
                {chatCount === 1 ? 'profesional contactado' : 'profesionales contactados'}
              </span>
              <MessageCircle size={16} className={styles.activityIcon} strokeWidth={1.5} />
            </button>
          </div>

          <button className={styles.favRow} onClick={() => navigate('/my-services')}>
            <ClipboardList size={15} color="var(--purple)" strokeWidth={1.8} />
            <span className={styles.favText}>Mis servicios e historial</span>
          </button>

          {favCount > 0 ? (
            <button className={styles.favRow} onClick={() => navigate('/siguiendo')}>
              <UserCheck size={15} color="var(--purple)" strokeWidth={1.8} />
              <span className={styles.favText}>
                {favCount === 1 ? '1 profesional al que sigues' : `${favCount} profesionales que sigues`}
              </span>
            </button>
          ) : (
            <div className={styles.favEmpty}>
              <UserPlus size={14} strokeWidth={1.5} color="var(--ink-disabled)" />
              <span className={styles.favEmptyText}>
                Guarda profesionales que te interesen para encontrarlos rápido
              </span>
            </div>
          )}
        </div>

        {/* ── ZONA 4: EVOLUCIÓN ─────────────────────────── */}

        {!user.isHelper && (
          <div className={styles.evolutionZone} style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 240ms forwards`}}>
            <p className={styles.evolutionQ}>¿Tienes algo que ofrecer?</p>
            <p className={styles.evolutionSub}>
              Muchas personas de Nüra también ayudan a otros. Crea tu perfil profesional y empieza a recibir solicitudes.
            </p>
            <button className={styles.evolutionBtn} onClick={() => navigate('/register-helper')}>
              <User size={15} strokeWidth={1.8} />
              Crear perfil profesional
            </button>
          </div>
        )}

        {/* ── PRÓXIMAMENTE ────────────────────────────────── */}
        <div style={{
          margin:'0 var(--space-16) var(--space-16)', padding:'var(--space-16)',
          background:'linear-gradient(135deg, var(--purple-05) 0%, var(--purple-05) 100%)',
          borderRadius:'var(--radius-card)', border:'1px solid var(--purple-10)'
        }}>
          <div style={{display:'flex',alignItems:'center',gap:'var(--space-8)',marginBottom:'var(--space-8)'}}>
            <span style={{fontSize:'var(--text-xs)',fontWeight:700,color:'var(--purple)',letterSpacing:'0.8px',textTransform:'uppercase'}}>Próximamente</span>
          </div>
          <p style={{fontSize:'var(--text-sm)',fontWeight:700,color:'var(--ink)',letterSpacing:'-0.2px',marginBottom:'var(--space-4)'}}>
            Tu reputación profesional verificada
          </p>
          <p style={{fontSize:'var(--text-xs)',color:'rgba(33,29,51,0.45)',lineHeight:1.5}}>
            Nüra construirá tu currículum vivo basado en las ayudas reales que ofrezcas — verificadas y reconocidas por las personas que ayudaste.
          </p>
        </div>

        {/* ── ZONA 5: CONFIGURACIÓN DISCRETA ────────────── */}
        <div style={{textAlign:'center', fontSize:'var(--text-xs)', color:'var(--ink-disabled, rgba(33,29,51,0.25))', margin:'var(--space-2) 0 var(--space-10)'}}>
          Nüra 2 · {NURA_BUILD}
        </div>
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/') }}>
          <LogOut size={15} />
          Cerrar sesión
        </button>

        <p className={styles.version}>Nüra · v1.0</p>

      </div>
    </div>
    {composerOpen && <ObraComposer onClose={() => setComposerOpen(false)} />}
    </>
  )
}
