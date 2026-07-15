import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useNavigate } from 'react-router-dom'
import { LogOut, Edit2, Check, X, Award, MessageCircle,
         Heart, ClipboardList, User, Phone, Search, Star , UserPlus, UserCheck } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { Badge, StatBar } from '../components/ui'
import HelperCard from '../components/HelperCard'
import { proSignals } from '../utils/proSignals'
import styles from './Profile.module.css'
import { NURA_BUILD } from '../config'

export default function Profile() {
  const {
    user, logout, updateUser,
    chats, ratings, searchHistory, favorites, isFollowing, following,
    services, personas, removePersona, helpersCache, contactedHelpers, citas
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
        <div style={{display:'flex',flexDirection:'column',gap:'12px',width:'100%',maxWidth:'280px',margin:'20px 0'}}>
          {[
            [MessageCircle, 'Escribe a cualquier profesional'],
            [UserPlus,       'Sigue a tus profesionales favoritos'],
            [ClipboardList, 'Consulta tu historial de búsquedas'],
            [Star,          'Valora a los profesionales que contratas'],
          ].map(([Icon, text]) => (
            <div key={text} style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <Icon size={16} color="var(--purple)" strokeWidth={1.8} style={{flexShrink:0}} />
              <span style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.65)',fontWeight:500}}>{text}</span>
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
              <h2 className={styles.name}>{user.name}</h2>
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
            <div style={{margin:'0 16px 12px',padding:'14px 16px',background:'white',borderRadius:'16px',boxShadow:'0 1px 8px rgba(0,0,0,0.06)',border:'1px solid rgba(0,0,0,0.07)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                <span style={{fontSize:'13px',fontWeight:700,color:'var(--ink)',letterSpacing:'-0.2px'}}>Tu perfil está al {pct}%</span>
                <span style={{fontSize:'11px',color:'rgba(0,0,0,0.38)'}}>Mejora tus matches</span>
              </div>
              <div style={{height:'6px',background:'rgba(0,0,0,0.07)',borderRadius:'99px',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,background:'var(--purple)',borderRadius:'99px',transition:'width 0.6s ease'}} />
              </div>
              {missing.length > 0 && (
                <p style={{fontSize:'12px',color:'rgba(0,0,0,0.45)',marginTop:'8px',lineHeight:1.4}}>
                  Añade: {missing.join(' · ')}
                </p>
              )}
            </div>
          ) : null
        })()}

        {/* ── EL ESPEJO: LAS PERSONAS DE TU VIDA ────────── */}
        {(personas || []).length > 0 && (
          <div style={{margin:'0 0 20px', animation:'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 60ms both'}}>
            <div style={{
              fontSize:'11px', fontWeight:700, color:'var(--purple)',
              letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:'10px'
            }}>Las personas de tu vida</div>
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
              {personas.map(p => {
                const helperNames = (p.contactedHelperIds || [])
                  .map(id => helpersCache?.[id]?.name?.split(' ')?.[0] || helpersCache?.[String(id)]?.name?.split(' ')?.[0])
                  .filter(Boolean)
                return (
                  <div key={p.id} style={{
                    background:'white', borderRadius:'var(--radius-md)',
                    border:'1px solid var(--ink-border)', padding:'12px 14px',
                    display:'flex', alignItems:'flex-start', gap:'10px'
                  }}>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{
                        fontSize:'var(--text-sm)', fontWeight:700, color:'var(--ink)',
                        letterSpacing:'-0.1px', marginBottom:'4px', textTransform:'capitalize'
                      }}>{p.label.replace('tu ', '')}</div>
                      {(p.atributos || []).length > 0 && (
                        <div style={{display:'flex', gap:'4px', flexWrap:'wrap', marginBottom: helperNames.length ? '6px' : 0}}>
                          {p.atributos.map(a => <Badge key={a} variant="neutral">{a}</Badge>)}
                        </div>
                      )}
                      {helperNames.length > 0 && (
                        <div style={{fontSize:'11px', color:'var(--green)', fontWeight:500}}>
                          ✓ {helperNames.join(', ')} {helperNames.length === 1 ? 'ayuda' : 'ayudan'} con esto
                        </div>
                      )}
                    </div>
                    <button onClick={() => removePersona(p.id)} style={{
                      background:'none', border:'none', padding:'2px',
                      color:'var(--ink-disabled)', flexShrink:0, cursor:'pointer'
                    }} aria-label={`Olvidar a ${p.label}`}>
                      <X size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
            <p style={{fontSize:'10px', color:'var(--ink-tertiary)', marginTop:'8px', lineHeight:1.4}}>
              Nüra recuerda esto para ayudarte mejor. Puedes borrar cualquier persona cuando quieras.
            </p>
          </div>
        )}


        {user.isHelper && (
          <div style={{margin:'0 0 20px', animation:'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 240ms both'}}>
            <div style={{fontSize:'11px', fontWeight:700, color:'var(--purple)',
              letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:'10px'}}>
              Así te ven quienes te necesitan
            </div>
            <div style={{pointerEvents:'none'}}>
              <HelperCard helper={proPreview} showPrice />
            </div>
            <div style={{marginTop:'12px', display:'flex', justifyContent:'center'}}>
              <StatBar stats={[
                { value: proSig.vistasHoy, label: 'vistas hoy' },
                { value: proSig.busquedasSemana, label: 'búsquedas en tu zona' },
                { value: '—', label: 'conexiones ✓' },
              ]} />
            </div>
            {!proQuote ? (
              <div style={{marginTop:'12px', background:'var(--purple-10)',
                border:'1px solid var(--purple-20)', borderRadius:'var(--radius-md)', padding:'14px'}}>
                <div style={{fontSize:'13px', fontWeight:700, color:'var(--ink)', marginBottom:'4px'}}>
                  Tu primer paso
                </div>
                <p style={{fontSize:'12px', color:'var(--ink-secondary)', margin:'0 0 10px', lineHeight:1.5}}>
                  Añade tu cita personal — es lo primero que leen, con tu voz.
                  Los perfiles con cita generan mucha más confianza.
                </p>
                <textarea value={quoteDraft} onChange={e => setQuoteDraft(e.target.value)}
                  placeholder="Ej: Cuido a cada persona como cuidaría a mi propia familia."
                  aria-label="Tu cita personal"
                  style={{width:'100%', minHeight:'64px', border:'1px solid var(--ink-border)',
                    borderRadius:'10px', padding:'10px', fontSize:'14px',
                    fontFamily:'var(--font-voice)', fontStyle:'italic', resize:'none', background:'white'}} />
                <button onClick={saveQuote} disabled={!quoteDraft.trim()}
                  style={{marginTop:'8px', background: quoteDraft.trim() ? 'var(--purple)' : 'rgba(0,0,0,0.15)',
                    color:'white', border:'none', borderRadius:'99px', padding:'9px 16px',
                    fontSize:'12px', fontWeight:700}}>
                  Guardar mi cita
                </button>
              </div>
            ) : (
              <div style={{marginTop:'12px', fontSize:'11px', color:'var(--ink-tertiary)',
                display:'flex', alignItems:'center', flexWrap:'wrap', gap:'6px'}}>
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
            <div style={{margin:'0 0 20px', padding:'14px 16px', background:'white',
              border:'1px solid var(--ink-border)', borderRadius:'var(--radius-md)',
              boxShadow:'var(--shadow-sm)', display:'flex', alignItems:'center', gap:'10px'}}>
              <span style={{fontSize:'18px'}}>📅</span>
              <div style={{fontSize:'13px', color:'var(--ink)', lineHeight:1.45}}>
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
          margin:'0 16px 16px', padding:'16px',
          background:'linear-gradient(135deg, rgba(123,47,255,0.06) 0%, rgba(123,47,255,0.02) 100%)',
          borderRadius:'16px', border:'1px solid rgba(123,47,255,0.12)'
        }}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
            <span style={{fontSize:'10px',fontWeight:700,color:'var(--purple)',letterSpacing:'0.8px',textTransform:'uppercase'}}>Próximamente</span>
          </div>
          <p style={{fontSize:'14px',fontWeight:700,color:'var(--ink)',letterSpacing:'-0.2px',marginBottom:'4px'}}>
            Tu reputación profesional verificada
          </p>
          <p style={{fontSize:'12px',color:'rgba(0,0,0,0.45)',lineHeight:1.5}}>
            Nüra construirá tu currículum vivo basado en las ayudas reales que ofrezcas — verificadas y reconocidas por las personas que ayudaste.
          </p>
        </div>

        {/* ── ZONA 5: CONFIGURACIÓN DISCRETA ────────────── */}
        <div style={{textAlign:'center', fontSize:'10px', color:'var(--ink-disabled, rgba(0,0,0,0.25))', margin:'2px 0 10px'}}>
          Nüra 2 · {NURA_BUILD}
        </div>
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/') }}>
          <LogOut size={15} />
          Cerrar sesión
        </button>

        <p className={styles.version}>Nüra · v1.0</p>

      </div>
    </div>
  )
}
