import { avatarDe } from '../utils/avatar'
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
    // "Publicar en tu obra" ya vive abajo, en "Así te ven quienes te
    // necesitan", junto a la vista previa de su ficha. Repetirlo aqui daba
    // DOS botones identicos en la misma pantalla. Cuando no hay nada
    // pendiente, lo util es ver como le ven: es de donde sale el impulso de
    // publicar, no al reves.
    : { txt: 'Ver cómo te ven', to: null }
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
    avatarUrl: avatarDe(encodeURIComponent(user.name || 'pro')),
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
    // MISMA RECETA QUE LOGIN, al pixel: el logo cae en el mismo sitio y el
    // salto entre las dos pantallas no se nota. Estructura simple (altura
    // del padre, flujo normal), auroras como fondo, tarjeta de cristal.
    <div style={{
      height: '100%', minHeight: '100dvh',
      overflowY: 'auto', overflowX: 'hidden', overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch',
      display: 'flex', flexDirection: 'column',
      background: `radial-gradient(420px 320px at 88% -4%, rgba(255,59,92,0.10), transparent 64%),
                   radial-gradient(520px 360px at 6% 4%, rgba(123,47,255,0.11), transparent 66%),
                   radial-gradient(460px 300px at 50% 104%, rgba(0,212,200,0.08), transparent 62%),
                   var(--paper)`,
      /* CONTRATO: la reserva al token medido. Aqui la barra SI se muestra
         (a diferencia de Login, donde se oculta). */
      padding: 'var(--space-32) var(--space-20) var(--reserva-nav)',
    }}>
      <div style={{maxWidth:'360px', width:'100%', margin:'auto'}}>
        <img src="/logo-iso.png" alt="" style={{width:'60px', height:'60px', display:'block',
          margin:'0 auto', animation:'pulse 3s ease-in-out infinite'}} />
        <img src="/logo-text.png" alt="Nüra" style={{height:'26px', display:'block',
          margin:'var(--space-14) auto var(--space-6)'}} />
        <p style={{fontSize:'var(--text-sm)', color:'var(--ink-secondary)', textAlign:'center',
          margin:'0 0 var(--space-28)', letterSpacing:'-0.1px'}}>
          Encuentra a la persona adecuada
        </p>

        <div style={{
          background:'rgba(255,255,255,0.86)',
          WebkitBackdropFilter:'blur(24px) saturate(180%)', backdropFilter:'blur(24px) saturate(180%)',
          border:'1px solid var(--ink-border)', borderRadius:'var(--radius-md)',
          boxShadow:'0 8px 32px rgba(33,29,51,0.07)', padding:'var(--space-24) var(--space-20)',
        }}>
          <h2 style={{fontFamily:'var(--font-voice)', fontSize:'var(--text-heading)', fontWeight:700,
            letterSpacing:'-0.6px', color:'var(--ink)', margin:'0 0 var(--space-6)', textAlign:'center'}}>
            Crea tu cuenta gratis
          </h2>
          <p style={{fontSize:'var(--text-sm)', color:'var(--ink-secondary)', textAlign:'center',
            margin:'0 0 var(--space-20)', lineHeight:1.5}}>
            Solo tarda 30 segundos.
          </p>

          <div style={{display:'flex', flexDirection:'column', gap:'var(--space-12)',
            marginBottom:'var(--space-24)'}}>
            {[
              [MessageCircle, 'Escribe a cualquier profesional'],
              [UserPlus,      'Sigue a tus profesionales favoritos'],
              [ClipboardList, 'Consulta tu historial de búsquedas'],
              [Star,          'Valora a los profesionales que contratas'],
            ].map(([Icon, text]) => (
              <div key={text} style={{display:'flex', alignItems:'center', gap:'var(--space-12)'}}>
                <Icon size={16} color="var(--purple)" strokeWidth={1.8} style={{flexShrink:0}} />
                <span style={{fontSize:'var(--text-sm)', color:'var(--ink-secondary)'}}>{text}</span>
              </div>
            ))}
          </div>

          <Button variant="primary" full onClick={() => navigate('/login')}>
            Crear cuenta gratis
          </Button>
          <div style={{height:'var(--space-10)'}} />
          <Button variant="secondary" full onClick={() => navigate('/register-helper')}>
            Quiero ser Profesional
          </Button>
        </div>

        <p style={{fontSize:'var(--text-xs)', color:'var(--ink-tertiary)', textAlign:'center',
          margin:'var(--space-20) 0 0', lineHeight:1.5}}>
          Tu teléfono no se muestra a nadie.<br />Solo sirve para entrar.
        </p>
        <div style={{textAlign:'center', fontSize:'var(--text-xs)', color:'var(--ink-tertiary)',
          marginTop:'var(--space-16)', opacity:0.6}}>{NURA_BUILD}</div>
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
      {/* El boton de cerrar sesion no tenia nombre accesible: un lector de
          pantalla decia solo "boton" sobre la accion mas destructiva de la
          pantalla. El icono no basta. */}
      <PageHeader rightEl={
        <button className={styles.logoutIcon} aria-label="Cerrar sesión"
          onClick={() => { logout(); navigate('/') }}>
          <LogOut size={17} />
        </button>
      } />

      <div className={styles.scroll}>

        {/* ── ZONA 1: IDENTIDAD ─────────────────────────── */}
        <div className={styles.identity} style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards`}}>
          <div className={styles.avatarWrap}>
            <img
              src={avatarDe(encodeURIComponent(user.name || 'user'))}
              alt={user.name} className={styles.avatar}
            />
            {user.isHelper && (
              <div className={styles.avatarBadge}>
                <Award size={12} color="white" />
              </div>
            )}
          </div>
          <div className={styles.identityText}>

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

          {/* LO QUE ERES, COMO EN LA FICHA. Bajo el nombre iba la fecha de
              alta: un profesional no veia su propio oficio en su perfil,
              mientras cualquiera que abre su ficha lo lee lo primero.
              El oficio manda; la fecha pasa detras, que es su sitio. */}
          {(user.isHelper && user.helperProfile?.specialty) ? (
            <p className={styles.memberSince}>
              <span style={{color:'var(--ink-secondary)', fontWeight:600}}>
                {user.helperProfile.specialty}
              </span>
              {joinedDate && <span style={{opacity:0.6}}> · desde {joinedDate}</span>}
            </p>
          ) : joinedDate ? (
            <p className={styles.memberSince}>En Nüra desde {joinedDate}</p>
          ) : null}

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
        </div>

        {/* ── PROFILE COMPLETION ─────────────────────────── */}
        {user && (() => {
          // Solo DATOS DEL PERFIL. Antes contaba actividad ("hacer tu
          // primera busqueda", "seguir profesionales") como si fueran campos
          // que rellenar: eso es lo que hacia el indicador confuso y
          // provisional. Y duplicaba el estado vacio de la zona de actividad,
          // que ya invita a buscar y encima con un boton.
          // Un profesional NO se mide con la regla de un usuario. Medido:
          // quien respondia 2 preguntas en el registro basico salia al 67%,
          // y quien respondia las 6 del alta profesional salia al 33% — al
          // que mas daba se le decia que era el que menos tenia. Y la
          // coletilla "mejora tus matches" no le habla a un profesional:
          // el no busca match, el ES el match.
          const hp = user.helperProfile || {}
          const fields = user.isHelper
            ? [!!user.name, !!hp.specialty, !!hp.formation, !!hp.zone, !!hp.price, !!hp.differentiator, !!user.avatar]
            : [!!user.name, !!user.phone, !!user.avatar]
          const pct = Math.round((fields.filter(Boolean).length / fields.length) * 100)
          const missing = []
          if (user.isHelper) {
            if (!hp.specialty) missing.push('tu especialidad')
            if (!hp.formation) missing.push('tu formación')
            if (!hp.zone) missing.push('tu zona')
            if (!hp.price) missing.push('tu tarifa')
            if (!hp.differentiator) missing.push('qué te diferencia')
          } else if (!user.phone) missing.push('teléfono')
          if (!user.avatar) missing.push('una foto')
          // ── FUERA EL PORCENTAJE (paso 1 de docs/plan-perfil.md) ────────
          // El perfil abria con "Tu perfil esta al 67%" y una lista de
          // deberes. Lo primero que veia alguien al entrar en SU espacio era
          // una nota baja.
          //
          // Para el USUARIO no tiene sentido siquiera: no hay perfil que
          // rellenar, solo busca ayuda. Le pedia algo que no necesita.
          //
          // Para el PROFESIONAL si importa —un perfil incompleto recibe
          // menos contactos— pero como INVITACION CONCRETA y no como nota:
          // una sola cosa, la que mas le falta, con el motivo por el que le
          // conviene. "Añade tu tarifa y te encontraran antes" en vez de
          // "estas al 29%".
          if (!user.isHelper || !missing.length) return null
          const loQueFalta = missing[0]
          const porQue = {
            'tu especialidad': 'sin ella no apareces en las búsquedas',
            'tu formación': 'es lo que más mira quien duda',
            'tu zona': 'así te encuentran los de tu barrio',
            'tu tarifa': 'quien no la ve, casi nunca escribe',
            'qué te diferencia': 'es lo que te separa de los demás',
            'una foto': 'los perfiles con foto reciben más mensajes',
          }[loQueFalta] || 'te encontrarán antes'
          return (
            <div style={{padding:'var(--space-16)',
              background:'rgba(255,255,255,0.96)',
              WebkitBackdropFilter:'blur(20px) saturate(160%)',
              backdropFilter:'blur(20px) saturate(160%)',
              borderRadius:'var(--radius-md)',
              boxShadow:'var(--alzado-reposo)',
              border:'1px solid rgba(255,255,255,0.6)'}}>
              <p style={{margin:0, fontSize:'var(--text-base)', fontWeight:600,
                color:'var(--ink-primary)', letterSpacing:'-0.2px', lineHeight:1.4}}>
                Añade {loQueFalta}
              </p>
              <p style={{margin:'var(--space-6) 0 0', fontSize:'var(--text-sm)',
                color:'var(--ink-tertiary)', lineHeight:1.45}}>
                {porQue.charAt(0).toUpperCase() + porQue.slice(1)}.
              </p>
            </div>
          )
        })()}

        {/* ── EL ESPEJO: LAS PERSONAS DE TU VIDA ────────── */}
        {(personas || []).length > 0 && (
          <div style={{animation:'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 60ms both'}}>
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
            <div style={{padding:'var(--space-16)',
              /* --shadow-md es la sombra de lo que FLOTA (modales, hojas).
                 Esta tarjeta reposa, asi que lleva la del sistema. */
              background:'rgba(255,255,255,0.96)',
              WebkitBackdropFilter:'blur(20px) saturate(160%)',
              backdropFilter:'blur(20px) saturate(160%)',
              border:'1px solid rgba(123,47,255,0.16)', borderRadius:'var(--radius-md)',
              boxShadow:'0 1px 2px rgba(33,29,51,0.04), 0 8px 24px -12px rgba(123,47,255,0.18)',
              animation:'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 200ms both'}}>
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
          <div style={{animation:'fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 240ms both'}}>
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
            {/* Solo si hay cifras. Fuera de la demo proSignals devuelve null:
                eran numeros inventados y no se enseñan a nadie real. */}
            {proSig && (
            <div style={{marginTop:'var(--space-12)', display:'flex', justifyContent:'center'}}>
              <StatBar stats={[
                { value: proSig.vistasHoy, label: 'vistas hoy' },
                { value: proSig.busquedasSemana, label: 'búsquedas en tu zona' },
                { value: '—', label: 'conexiones ✓' },
              ]} />
            </div>
            )}
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
            <div style={{padding:'var(--space-14) var(--space-16)', background:'white',
              border:'1px solid var(--ink-border)', borderRadius:'var(--radius-md)',
              boxShadow:'var(--shadow-sm)', display:'flex', alignItems:'center', gap:'var(--space-10)'}}>
              <span style={{fontSize:'var(--text-md)'}}>📅</span>
              <div style={{fontSize:'var(--text-sm)', color:'var(--ink)', lineHeight:1.45}}>
                El {cp.label}, <strong>{hf}</strong>{cp.personaLabel ? <> está con {cp.personaLabel}</> : <> — vuestra primera cita</>}. Todo listo 💜
              </div>
            </div>
          )
        })()}

        {/* ── ZONA 2: LO QUE HAS BUSCADO ─────────────────────────────
            Este bloque no comprobaba el rol: una profesional veia "Tu
            actividad · Aún no has buscado a nadie · Cuéntame qué necesitas
            y te busco a la persona" en SU propio perfil. Marta no busca
            ayuda, la ofrece — y la app le hablaba como si fuera al reves.
            Un profesional puede buscar tambien, claro, pero entonces tendra
            actividad: lo que no tiene sentido es ofrecerle el hueco vacio
            del usuario cuando lo suyo es otra cosa. */}
        <div className={styles.activityZone} style={{animation:`fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) 80ms forwards`}}>
          <p className={styles.zoneLabel}>{user.isHelper ? 'Tus cosas' : 'Tu actividad'}</p>

          {/* Sin actividad NO se muestran ceros: un cero grande no informa,
              solo rellena. Se dice que hacer, que es lo que falta cuando
              alguien acaba de entrar y no sabe por donde empezar. */}
          {/* El hueco vacio del usuario, SOLO para el usuario. Una
              profesional veia "Aún no has buscado a nadie · Cuéntame qué
              necesitas y te busco a la persona" en su propio perfil: la app
              le hablaba como si ella buscara ayuda, cuando la ofrece. */}
          {/* Sin actividad: al usuario se le invita a buscar; al
              profesional NO se le enseñan ceros. Al ocultarle el hueco del
              usuario (paso 3) caia en la otra rama y veia "0 búsquedas
              realizadas · 0 profesionales contactados". Un cero no informa. */}
          {searchCount === 0 && chatCount === 0 && user.isHelper ? null
          : searchCount === 0 && chatCount === 0 ? (
            <div style={{
              background: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)',
              padding: 'var(--space-20) var(--space-16)', textAlign: 'center',
            }}>
              <p style={{
                fontFamily: 'var(--font-voice)', fontSize: 'var(--text-base)',
                color: 'var(--ink)', lineHeight: 1.55, letterSpacing: '-0.2px',
                margin: '0 0 var(--space-6)',
              }}>
                Aún no has buscado a nadie.
              </p>
              <p style={{
                fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)',
                lineHeight: 1.5, margin: '0 0 var(--space-16)',
              }}>
                Cuéntame qué necesitas y te busco a la persona. Aquí irá quedando
                lo que hagas.
              </p>
              <Button variant="primary" onClick={() => navigate('/')}>
                Buscar a alguien
              </Button>
            </div>
          ) : (
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
          )}

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

        {/* ── PUBLICAR: el gesto que vivia en Comunidad ──────────────
            Comunidad se retira de la barra (ver docs/revision-profunda.md):
            era un muro de 91 acciones y 8,4 pantallas que no ayudaba a nadie
            a encontrar ayuda, y las publicaciones ya vivian en la ficha de
            cada profesional, que es donde sirven —cuando estas decidiendo si
            le escribes—.
            Lo unico que Comunidad aportaba y la ficha no era el gesto de
            PUBLICAR. Vive aqui ahora: en el perfil de quien publica. */}
        {/* AQUI HABIA UN SEGUNDO BOTON DE PUBLICAR, añadido al fundir
            Comunidad. Duplicaba el que ya existia arriba, en "Así te ven
            quienes te necesitan" — que esta mejor situado, junto a la vista
            previa de su ficha.
            Dos botones para lo mismo no es mas facil de encontrar: es una
            pantalla que no sabe cual es el gesto.
            Y su ventana tambien sobraba: habia DOS <ObraComposer> montados
            —este y el del final del fichero— y un solo toque en "Publicar"
            abria dos ventanas superpuestas. Medido en navegador. Se queda
            solo la del final, que esta en la raiz como debe estar un modal. */}

        {/* ── ZONA 3: EVOLUCIÓN ─────────────────────────── */}

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

        {/* ── LO QUE VIENE (solo profesionales) ───────────────────────
            Prometia "tu reputacion profesional verificada" tambien al
            USUARIO, que no es profesional ni va a tener curriculum en Nüra.
            Al profesional si le importa: es la vision del producto y es
            suyo. Y el degradado era de un color al mismo color — no hacia
            nada. */}
        {user.isHelper && (
        <div style={{
          margin:'0 var(--space-16) var(--space-16)', padding:'var(--space-16)',
          background:'var(--purple-05)',
          borderRadius:'var(--radius-md)', border:'1px solid var(--purple-10)'
        }}>
          <div style={{display:'flex',alignItems:'center',gap:'var(--space-8)',marginBottom:'var(--space-8)'}}>
            <span style={{fontSize:'var(--text-xs)',fontWeight:700,color:'var(--purple)',letterSpacing:'0.8px',textTransform:'uppercase'}}>Próximamente</span>
          </div>
          <p style={{fontSize:'var(--text-sm)',fontWeight:700,color:'var(--ink)',letterSpacing:'-0.2px',marginBottom:'var(--space-4)'}}>
            Tu reputación profesional verificada
          </p>
          <p style={{fontSize:'var(--text-xs)',color:'var(--ink-tertiary)',lineHeight:1.5}}>
            Nüra construirá tu currículum vivo basado en las ayudas reales que ofrezcas — verificadas y reconocidas por las personas que ayudaste.
          </p>
        </div>
        )}

        {/* ── ZONA 4: CONFIGURACIÓN, AL FINAL Y DISCRETA ──────────────
            Habia DOS sellos de version que se contradecian —"Nüra 2 ·
            2026.07.08" arriba y "Nüra · v1.0" abajo— con "Cerrar sesión"
            encajado entre los dos. Ahora: cerrar sesion, y debajo un solo
            sello, lo ultimo de la pantalla. */}
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/') }}>
          <LogOut size={15} />
          Cerrar sesión
        </button>
        <p className={styles.version}>Nüra · {NURA_BUILD}</p>

      </div>
    </div>
    {composerOpen && <ObraComposer onClose={() => setComposerOpen(false)} />}
    </>
  )
}
