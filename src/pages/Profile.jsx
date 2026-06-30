import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useNavigate } from 'react-router-dom'
import { LogOut, Edit2, Check, X, Award, MessageCircle,
         Heart, ClipboardList, User, Phone, Search, Star , UserPlus, UserCheck } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './Profile.module.css'

export default function Profile() {
  const {
    user, logout, updateUser,
    chats, ratings, searchHistory, favorites, isFollowing,
    services
  } = useUser()
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
        <div className={styles.identity} style={{animation:`fadeInUp 0.3s ease-out 0ms forwards`}}>
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

        {/* ── ZONA 2: ACTIVIDAD HUMANA ──────────────────── */}
        <div className={styles.activityZone} style={{animation:`fadeInUp 0.3s ease-out 80ms forwards`}}>
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

        {/* ── ZONA 3: BÚSQUEDAS RECIENTES ───────────────── */}
        {recentSearches.length > 0 && (
          <div className={styles.recentZone} style={{animation:`fadeInUp 0.3s ease-out 160ms forwards`}}>
            <p className={styles.zoneLabel}>Búsquedas recientes</p>
            <div className={styles.recentList}>
              {recentSearches.map((q, i) => (
                <button key={i} className={styles.recentItem} onClick={() => navigate('/')}>
                  <Search size={13} color="var(--ink-tertiary)" strokeWidth={1.8} />
                  <span className={styles.recentText}>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ZONA 4: EVOLUCIÓN ─────────────────────────── */}
        {!user.isHelper && (
          <div className={styles.evolutionZone} style={{animation:`fadeInUp 0.3s ease-out 240ms forwards`}}>
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
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/') }}>
          <LogOut size={15} />
          Cerrar sesión
        </button>

        <p className={styles.version}>Nüra · v1.0</p>

      </div>
    </div>
  )
}
