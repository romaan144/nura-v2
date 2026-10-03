import UserAvatar from '../components/UserAvatar'
import { avatarDe, avatarVigente } from '../utils/avatar'
import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import { Button, SectionLabel } from '../components/ui'
import { useState as useStateObra } from 'react'
import ObraComposer from '../components/ObraComposer'
import PostCard from '../components/PostCard'
import { getObraDeHelper, obraAPost } from '../data/obraPosts'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Edit2, Check, X, Award, MessageCircle, ClipboardList, User, Phone, Star,
         UserPlus, UserCheck, ChevronRight, PenLine, Plus, Mail, CalendarDays, Search,
         Shield, FileText, Trash2, Share2, MapPin } from 'lucide-react'
import { CIUDADES, ciudadEnTexto } from '../data/ciudades'
import { useUser } from '../context/UserContext'
import { Badge, StatBar } from '../components/ui'
import HelperCard from '../components/HelperCard'
import { proSignals } from '../utils/proSignals'
import styles from './Profile.module.css'
import { NURA_BUILD, CONTACTO_EMAIL, DEMO_MODE } from '../config'
import EditarFicha from '../components/EditarFicha'
import { fmtTel, fmtOficio } from '../utils/formato'
import { reclamarFicha, borrarCuenta } from '../utils/escrituras'
import { usuarioDeFicha, usuarioCliente } from '../utils/usuarioDeFicha'
import FotoPerfil from '../components/FotoPerfil'
import AccesoCuenta from '../components/AccesoCuenta'
import MisAlertas from '../components/MisAlertas'
import LoQueSabeNura from '../components/LoQueSabeNura'
import { quitarTodas } from '../utils/alertas'
import { compartirEnlace, enlaceDeFicha } from '../utils/compartir'
import { showToast } from '../components/Toast'

// Acciones de apoyo: contorno visible también sobre las tarjetas blancas.
const professionalInfoButton = {
  minHeight: 48, marginTop: 10, padding: '10px 16px', lineHeight: 1.4,
  border: '1px solid var(--glass-edge)', background: 'var(--glass-control)',
  color: 'var(--purple-ink)', boxShadow: 'var(--glass-control-shadow)',
}


// ── Tu semana: la voz de Nüra para quien trabaja ──
// Gramática: frase humana primero, cifras discretas después, cero vanidad.
// CONTABA MAL: "abiertas" y "citas" salian de `contactedHelpers`, que son
// las conversaciones que el profesional empezo COMO CLIENTE con otros
// profesionales — no las que le llegan. Con un mensaje sin leer de una
// clienta, el panel decia "0 abiertas". En produccion diria cero siempre.
// Lo unico suyo como profesional que existe en el movil son sus
// publicaciones. Lo que le llega (los avisos) llegara con la identidad del
// profesional (etapa 6 de estudio-perfil.md). Hasta entonces, no se cuenta
// lo que no se sabe.
function buildSemana({ misObras, obraPropia }) {
  const abiertas = 0
  const proximas = []
  const piezas = (misObras || []).length + (obraPropia || 0)
  const trozos = []
  if (abiertas > 0) trozos.push(`**${abiertas}** ${abiertas === 1 ? 'conversación abierta' : 'conversaciones abiertas'}`)
  if (proximas.length > 0) trozos.push(`una cita el **${proximas[0].label}**`)
  const frase = trozos.length
    ? `Esta semana tienes ${trozos.join(' y ')}.`
    : piezas > 0
    ? 'Semana tranquila. Tu obra sigue trabajando por ti.'
    : 'Cuando alguien te escriba, te llegará un aviso con su mensaje. Publicar un caso ayuda a que te encuentren.'
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
    user, login, logout, updateUser,
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
    // Ponia `verified: true` a todo profesional: la vista previa le enseñaba
    // el ✓ de verificado mientras su ficha publica real (la del alta) dice
    // verified: false. "Así te ven" le mentia a ella misma.
    verified: hp.verified === true,
    // La misma cara que ven los clientes (normalize() usa avatarVigente, con
    // el nombre de pila): con el nombre completo salía otra (2026-10-01).
    avatarUrl: user.avatar || avatarVigente('', user.name) || avatarDe('pro'),
  } : null
  function saveQuote() {
    const v = quoteDraft.trim()
    if (!v) return
    updateUser({ helperProfile: { ...hp, quote: v } })
    setQuoteDraft('')
  }
  const navigate = useNavigate()
  // Al tocar la notificacion «ha llegado alguien» se abre /profile?alertas=1
  const verAlertas = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('alertas')
  const [composerOpen, setComposerOpen] = useStateObra(false)
  const [campoAbierto, setCampoAbierto] = useState(null)
  const [campoDraft, setCampoDraft] = useState('')
  const [ciudadAbierta, setCiudadAbierta] = useState(false)
  const [ciudadDraft, setCiudadDraft] = useState('')
  const [ciudadFallo, setCiudadFallo] = useState('')
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const [editarAbierto, setEditarAbierto] = useState(false)
  // «Bloquear días u horas» desde Mi agenda llega con ese encargo: la hoja
  // se abre en ese apartado. Al cerrarla se borra, para que no vuelva a abrirse.
  const location = useLocation()
  const pideBloqueos = location.state?.editar === 'bloqueos'
  // Desde Inicio («Editar mi ficha») se llega con la hoja ya abierta.
  const pideFicha = location.state?.editar === 'ficha'
  const cerrarEditar = () => {
    setEditarAbierto(false)
    if (pideBloqueos || pideFicha) navigate(location.pathname, { replace: true, state: null })
  }
  const [borrarAbierto, setBorrarAbierto] = useState(false)
  const [vinculo, setVinculo] = useState('')
  const [borrando, setBorrando] = useState(false)
  const [borrarError, setBorrarError] = useState('')
  let tieneCuenta = false
  try { tieneCuenta = !!JSON.parse(localStorage.getItem('nura_sesion') || 'null')?.access_token } catch { /* sin sesion */ }

  // ── VINCULAR LA CUENTA CON SU FICHA (etapa 6b) ───────────────────────
  // Si la profesional tiene acceso pero el movil no sabe cual es su ficha,
  // se pide al servidor que la encuentre: su correo confirmado tiene que
  // coincidir con el contacto que puso en el alta. La libreria de cuentas se
  // importa AQUI DENTRO, solo si hay sesion: no entra en lo que descarga
  // todo el mundo.
  useEffect(() => {
    if (!user?.isHelper || user?.helperId != null) return
    let hay = null
    try { hay = JSON.parse(localStorage.getItem('nura_sesion') || 'null') } catch { /* sin sesion */ }
    if (!hay?.access_token) return
    let vivo = true
    import('../utils/cuenta').then(async ({ sesionActual }) => {
      const s = await sesionActual()
      if (!s || !vivo) return
      const r = await reclamarFicha(s.access_token)
      if (!vivo) return
      if (r?.ok && r.helper?.id != null) updateUser({ helperId: r.helper.id })
      else setVinculo(r?.motivo || 'error')
    })
    return () => { vivo = false }
  }, [user?.isHelper, user?.helperId])

  // ── LA VUELTA DEL CORREO DE CONFIRMACIÓN ──────────────────────────────
  // Quien crea su acceso confirma el correo y vuelve aquí con la sesión en
  // la dirección. Si este móvil no le conocía (lo normal: abrió el enlace de
  // su primer mensaje), antes veía la pantalla de invitado y tenía que
  // entrar otra vez. Ahora se busca su ficha y queda dentro: profesional si
  // la tiene, si no quien busca ayuda. Solo con sesión de verdad (la de la
  // dirección o una guardada): al cerrar sesión se borra y esto no corre.
  const haySesionQueLeer = () => {
    if (/access_token=|[?&]code=|error_description=/.test(window.location.hash + window.location.search)) return true
    try { return Boolean(JSON.parse(localStorage.getItem('nura_sesion') || 'null')?.access_token) } catch { return false }
  }
  const [reconociendo, setReconociendo] = useState(() => !user && haySesionQueLeer())

  // ── LA VUELTA DE LOS ENLACES DE CAMBIO DE CORREO (Sergio, 2026-10-03) ──
  // Supabase manda dos enlaces (al correo actual y al nuevo) y el cambio se
  // hace al pulsar los dos. Al volver del primero la dirección trae un
  // «message» y la app no decía nada: parecía que no había pasado nada. Se
  // anota en qué punto está para que «Tu acceso» lo diga claro.
  useEffect(() => {
    const h = decodeURIComponent((window.location.hash || '').replace(/\+/g, ' '))
    const anotar = estado => { try { sessionStorage.setItem('nura_cambio_correo', estado) } catch { /* nada */ } }
    const limpiar = () => window.history.replaceState(window.history.state, '', window.location.pathname)
    if (/other email/i.test(h)) {
      anotar('medio'); limpiar()
      showToast('Primer enlace confirmado. Falta pulsar el del otro correo.')
    } else if (/type=email_change/.test(h)) {
      anotar('hecho')
      showToast('Listo: ya puedes entrar con tu correo nuevo.')
    } else if (user && /error_description=/.test(h)) {
      anotar('caducado'); limpiar()
      showToast('Ese enlace ya se usó o caducó.')
    }
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user || !haySesionQueLeer()) return
    let vivo = true
    import('../utils/cuenta').then(async ({ sesionActual, salir }) => {
      const s = await sesionActual()
      if (!vivo) return
      if (!s) {
        setReconociendo(false)
        if (/error_description=/.test(window.location.hash + window.location.search)) {
          showToast('Ese enlace ya no vale. Entra con tu correo y tu contraseña.')
          navigate('/entrar', { replace: true })
        }
        return
      }
      const email = s.user?.email || ''
      const r = await reclamarFicha(s.access_token)
      if (!vivo) return
      setReconociendo(false)
      // ¿Creó el acceso desde un mensaje que le llegó como profesional?
      let comoPro = false
      try { comoPro = localStorage.getItem('nura_acceso_pro') === '1' } catch { /* sin almacenamiento */ }
      if (r?.ok && r.helper) {
        try { localStorage.removeItem('nura_acceso_pro') } catch { /* nada */ }
        login(usuarioDeFicha(r.helper, email))
        showToast('Ya tienes tu acceso. Lo que te escriban, en «Chats».')
      } else if (comoPro && (r?.motivo === 'sin-ficha' || r?.motivo === 'varias')) {
        // No como cliente: vería una bandeja vacía. Se le explica en «Entrar».
        try { localStorage.removeItem('nura_acceso_pro') } catch { /* nada */ }
        await salir()
        navigate('/entrar?pro=1&sinFicha=1&volver=/chats', { replace: true })
      } else if (r?.motivo === 'sin-ficha' || r?.motivo === 'varias') {
        login(usuarioCliente(email))
        showToast('Ya tienes tu acceso.')
      }
    })
    return () => { vivo = false }
  }, [user])   // eslint-disable-line react-hooks/exhaustive-deps

  const [editingName, setEditingName]   = useState(false)
  const [nameInput,   setNameInput]     = useState('')
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneInput,  setPhoneInput]    = useState('')

  // Mientras se reconoce a quien vuelve del correo: ni la pantalla de invitado.
  if (!user && reconociendo) return (
    <div role="status" aria-label="Entrando" style={{ height: '100%', minHeight: 'var(--app-layout-height, 100dvh)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
      <img src="/logo-iso.png" alt="" style={{ width: 40, opacity: 0.35 }} />
    </div>
  )

  /* ── Guest ─────────────────────────────────────────────── */
  if (!user) return (
    // MISMA RECETA QUE LOGIN, al pixel: el logo cae en el mismo sitio y el
    // salto entre las dos pantallas no se nota. Estructura simple (altura
    // del padre, flujo normal), auroras como fondo, tarjeta de cristal.
    <div style={{
      height: '100%', minHeight: 'var(--app-layout-height, 100dvh)',
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
      <div style={{maxWidth:'420px', width:'100%', margin:'auto'}}>
        {/* Desde la notificacion «ha llegado alguien»: eso primero. */}
        {verAlertas && (
          <div style={{margin:'0 calc(var(--space-20) * -1) var(--space-16)'}}>
            <MisAlertas estilos={styles} />
          </div>
        )}
        <img src="/logo-iso.png" alt="" style={{width:'60px', height:'60px', display:'block',
          margin:'0 auto', animation:'fadeInUp .36s ease both'}} />
        <span className="nura-wordmark" style={{textAlign:'center', margin:'12px auto 6px'}}>Nüra</span>
        <p style={{fontSize:'var(--text-sm)', color:'var(--ink-secondary)', textAlign:'center',
          margin:'0 0 var(--space-28)', letterSpacing:'-0.1px'}}>
          Encuentra a la persona adecuada
        </p>

        <div style={{
          background:'var(--glass-panel)',
          WebkitBackdropFilter:'var(--glass-filter)', backdropFilter:'var(--glass-filter)',
          border:'1px solid var(--glass-edge)', borderRadius:'var(--radius-glass)',
          boxShadow:'var(--glass-panel-shadow)', padding:'var(--space-24) var(--space-20)',
        }}>
          <h2 style={{fontFamily:'var(--font-voice)', fontSize:'var(--text-heading)', fontWeight:700,
            letterSpacing:'-0.6px', color:'var(--ink)', margin:'0 0 var(--space-6)', textAlign:'center'}}>
            Crea tu cuenta gratis
          </h2>
          <p style={{fontSize:'var(--text-sm)', color:'var(--ink-secondary)', textAlign:'center',
            margin:'0 0 var(--space-20)', lineHeight:1.5}}>
            Solo tarda 30 segundos.
          </p>

          {/* Lo que da una cuenta, con los iconos en su circulo: la misma
              forma que las filas del perfil con sesion. El marco de la
              tarjeta NO cambia: es el mismo que el de Entrar, al pixel. */}
          <ul style={{listStyle:'none', margin:'0 0 var(--space-24)', padding:0,
            display:'flex', flexDirection:'column', gap:'var(--space-10)'}}>
            {[
              [MessageCircle, 'Escribe a cualquier profesional'],
              [UserPlus,      'Sigue a tus profesionales favoritos'],
              [ClipboardList, 'Consulta tu historial de búsquedas'],
              [Star,          'Valora a quien contratas'],
            ].map(([Icon, text]) => (
              <li key={text} style={{display:'flex', alignItems:'center', gap:'var(--space-12)'}}>
                <span className={styles.filaIcono} aria-hidden="true"><Icon size={17} strokeWidth={1.9} /></span>
                <span style={{fontSize:'var(--text-base)', color:'var(--ink-primary)', lineHeight:1.35}}>{text}</span>
              </li>
            ))}
          </ul>

          {/* DOS PUERTAS (Sergio, 2026-10-03): crear cuenta o entrar, igual
              para todos. Ser profesional se pide ya dentro, en el perfil: antes
              quien tenía una cuenta normal no sabía por dónde entrar. */}
          <Button variant="primary" full style={{minHeight:48}} onClick={() => {
            try { sessionStorage.setItem('nura_return_to', '/profile') } catch { /* sin memoria */ }
            navigate(DEMO_MODE ? '/login' : '/entrar?modo=crear')
          }}>
            Crear cuenta
          </Button>
          <Button variant="secondary" full onClick={() => navigate('/entrar')}
            style={{minHeight:48, marginTop:'var(--space-10)', color:'var(--purple-ink)', boxShadow:'var(--glass-control-shadow)'}}>
            Entrar
          </Button>
        </div>

        <p style={{fontSize:'var(--text-xs)', color:'var(--ink-tertiary)', textAlign:'center',
          margin:'var(--space-20) 0 0', lineHeight:1.5}}>
          {DEMO_MODE ? <>Tu teléfono no se muestra a nadie.<br />Solo sirve para entrar.</> : <>Nunca analizamos tus conversaciones ni lo que buscas.</>}
        </p>
        {/* Quien busca sin cuenta tambien puede pedir «te aviso»: lo ve aqui. */}
        {!verAlertas && (
          <div style={{margin:'var(--space-16) calc(var(--space-20) * -1) 0'}}>
            <MisAlertas estilos={styles} />
          </div>
        )}
        {/* Sin opacity: aclaraba el texto por encima de su color, y el medidor
            de contraste mira el color, no la opacidad del elemento. Mismo sello
            que el perfil con cuenta. */}
        <div style={{textAlign:'center', fontSize:'var(--text-xs)', color:'var(--ink-tertiary)',
          marginTop:'var(--space-16)'}}>Nüra · {NURA_BUILD}</div>
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
  // EL MISMO LENGUAJE QUE LA FICHA DE UN PROFESIONAL (el fundador la señala
  // como el nivel a alcanzar): cabecera blanca y centrada que sube bajo la
  // barra, y debajo secciones con titulo sobre el papel, separadas por una
  // linea fina. Dentro de las secciones, DOS formas y ninguna mas:
  //   · .tarjeta  un bloque para leer y actuar
  //   · .lista    filas que llevan a otra pantalla (icono · texto · flecha)
  // Antes convivian seis estilos de caja (gris, lila, blanca con borde,
  // pildora, borde lila, sin borde) y una regla que forzaba el mismo relleno
  // a todo: tarjetas que se salian del borde y un "Cerrar sesión" descolocado.
  // Un boton desactivado se ve apagado pero se LEE: el de la primitiva baja
  // la opacidad y dejaba blanco sobre lila claro, ilegible.
  const apagado = { background: 'rgba(33,29,51,0.08)', color: 'var(--ink-tertiary)', opacity: 1 }

  // «TU CIUDAD»: la elige la persona (no se deduce de lo que busca). Solo
  // ordena sus búsquedas: primero quien trabaja allí o atiende online.
  const guardarCiudad = () => {
    const c = ciudadEnTexto(ciudadDraft.trim()) || ciudadEnTexto('en ' + ciudadDraft.trim())
    if (!c) { setCiudadFallo('No conozco esa ciudad. Escríbela como «Madrid» o «Valencia».'); return }
    updateUser({ ciudad: c }); setCiudadAbierta(false); setCiudadFallo('')
    showToast(`Hecho: buscaré primero en ${c}.`)
  }
  const quitarCiudad = () => {
    updateUser({ ciudad: null }); setCiudadAbierta(false); setCiudadFallo('')
  }
  const entrada = ms => ({ animation: `fadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) ${ms}ms both` })

  let correoAcceso = ''
  try { correoAcceso = JSON.parse(localStorage.getItem('nura_sesion') || 'null')?.user?.email || '' } catch { /* sin sesion */ }
  const cuentaTelefono = DEMO_MODE && !!user?.cuentaDemo && !correoAcceso

  // ── Lo que le falta a la ficha: UNA invitacion concreta, nunca una nota ──
  // (paso 1 de docs/plan-perfil.md: fuera el porcentaje). Un profesional con
  // la ficha incompleta recibe menos mensajes; se le pide la cosa que mas
  // falta, con el motivo, y se escribe ahi mismo.
  const faltaEnFicha = (() => {
    if (!user.isHelper) return null
    const orden = [
      ['specialty', 'tu especialidad', 'sin ella no apareces en las búsquedas', 'Ej: logopeda infantil'],
      ['formation', 'tu formación', 'es lo que más mira quien duda', 'Ej: Grado en Logopedia, UB'],
      ['zone', 'tu zona', 'así te encuentran los de tu barrio', 'Ej: Gràcia, Barcelona'],
      ['price', 'tu tarifa', 'quien no la ve, casi nunca escribe', 'Ej: 45 € la sesión'],
      ['differentiator', 'qué te diferencia', 'es lo que te separa de los demás', 'Ej: trabajo con juego, sin prisas'],
    ]
    const f = orden.find(([c]) => !hp[c])
    return f ? { campo: f[0], nombre: f[1], porQue: f[2], ejemplo: f[3] } : null
  })()
  const guardarCampo = () => {
    const v = campoDraft.trim(); if (!v || !faltaEnFicha) return
    updateUser({ helperProfile: { ...hp, [faltaEnFicha.campo]: v } })
    setCampoAbierto(null); setCampoDraft('')
  }

  // ── Lo que tienes a medias (etapa 4 de estudio-perfil.md) ──
  // Con nombre propio y cada cosa lleva a donde se continua: nadie abre su
  // perfil para contar busquedas, lo abre para encontrar la cita del jueves.
  const nombre = n => (n || '').split(' ')[0]
  const aMedias = (() => {
    const pendientes = (services || [])
      .filter(sv => sv && sv.status !== 'completed')
      .slice(0, 2)
      .map(sv => ({ k: 'c' + sv.id, to: `/chat/${sv.helperId}`,
        titulo: `Cita con ${nombre(sv.helperName)}`,
        detalle: [sv.date, sv.time, sv.status === 'confirmed' ? 'Confirmada' : 'Pendiente de confirmar'].filter(Boolean).join(' · ') }))
    const conCita = new Set(pendientes.map(p => p.to))
    const charlas = [...(chats || [])]
      .filter(c => c && !conCita.has(`/chat/${c.helperId}`))
      .sort((a, b) => (b.unread || 0) - (a.unread || 0) || String(b.lastTime || '').localeCompare(String(a.lastTime || '')))
      .slice(0, 3 - pendientes.length)
      .map(c => ({ k: 'h' + c.helperId, to: `/chat/${c.helperId}`,
        titulo: nombre(c.helperName) || 'Conversación',
        detalle: c.lastMsg ? `«${String(c.lastMsg).slice(0, 60)}${String(c.lastMsg).length > 60 ? '…' : ''}»` : '',
        sinLeer: c.unread || 0 }))
    return [...pendientes, ...charlas]
  })()

  const citaProxima = (citas || []).slice().reverse().find(ci => {
    const c = (contactedHelpers || []).find(x => (x.id || x) === ci.helperId)
    return c && c.confirmed === undefined
  })

  const sem = user.isHelper ? buildSemana({ misObras,
    obraPropia: getObraDeHelper(user.helperId || user.id, 9).filter(o => !o.mine).length }) : null
  const obraPropia = user.isHelper ? getObraDeHelper(user.helperId || user.id, 2) : []

  return (
    <>
    <div className={styles.page}>
      {/* Un solo "Cerrar sesión", al final y con confirmacion: habia otro
          arriba, de un toque, donde se pulsa por accidente. */}
      <PageHeader />

      <div className={styles.scroll}>

        {/* ── LA CABECERA: como la de una ficha ───────────────────── */}
        <header className={styles.hero} style={entrada(0)}>
          <div className={styles.avatarWrap}>
            <UserAvatar user={user} className={styles.avatar} />
            {user.isHelper && (
              <div className={styles.avatarBadge} aria-hidden="true">
                <Award size={13} color="white" />
              </div>
            )}
          </div>

          {editingName ? (
            <div className={styles.editRow}>
              <input className={styles.editInput} value={nameInput} aria-label="Tu nombre"
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') saveName(); if (e.key==='Escape') setEditingName(false) }}
                autoFocus maxLength={40} />
              <button className={styles.editConfirm} onClick={saveName} aria-label="Guardar nombre"><Check size={16} /></button>
              <button className={styles.editCancel} onClick={() => setEditingName(false)} aria-label="Cancelar"><X size={16} /></button>
            </div>
          ) : (
            <button className={styles.nameTap} onClick={() => { setNameInput(user.name); setEditingName(true) }}
              aria-label={`Cambiar tu nombre, ${user.name}`}>
              <h1 className={styles.name}>{user.name}</h1>
              <Edit2 size={14} className={styles.editHint} aria-hidden="true" />
            </button>
          )}

          {/* Lo que eres, como en la ficha: el oficio manda y la fecha va
              detras. Al usuario, desde cuando esta en Nüra. */}
          {user.isHelper && hp.specialty ? (
            <p className={styles.subtitulo}>
              <span className={styles.oficio}>{fmtOficio(hp.specialty)}</span>
              {joinedDate && <> · desde {joinedDate}</>}
            </p>
          ) : joinedDate ? (
            <p className={styles.subtitulo}>En Nüra desde {joinedDate}</p>
          ) : null}

          {/* El teléfono de verdad es el de la cuenta, confirmado por SMS (en
              «Tu acceso»). Este, guardado solo en el móvil y sin confirmar,
              queda para la demo. */}
          {!DEMO_MODE ? null : editingPhone ? (
            <div className={styles.editRow} style={{marginTop:'var(--space-8)'}}>
              <input className={styles.editInput} value={phoneInput} placeholder="6XX XXX XXX" aria-label="Tu teléfono"
                onChange={e => setPhoneInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') savePhone(); if (e.key==='Escape') setEditingPhone(false) }}
                autoFocus type="tel" maxLength={15} />
              <button className={styles.editConfirm} onClick={savePhone} aria-label="Guardar teléfono"><Check size={16} /></button>
              <button className={styles.editCancel} onClick={() => setEditingPhone(false)} aria-label="Cancelar"><X size={16} /></button>
            </div>
          ) : user.cuentaDemo ? (
            // Con cuenta, el teléfono es con el que entra: no se cambia aquí
            // sin confirmarlo por SMS.
            <span className={styles.dato}>
              <Phone size={13} strokeWidth={2} aria-hidden="true" />
              {fmtTel(user.phone)}
            </span>
          ) : (
            <button className={`${styles.dato} ${user.phone ? '' : styles.datoVacio}`}
              onClick={() => { setPhoneInput(user.phone || ''); setEditingPhone(true) }}>
              <Phone size={13} strokeWidth={2} aria-hidden="true" />
              {user.phone ? fmtTel(user.phone) : 'Añadir teléfono'}
            </button>
          )}

          {/* Solo con cifras: fuera de la demo proSignals devuelve null, y
              numeros inventados no se enseñan a nadie real. */}
          {user.isHelper && proSig && (
            <div className={styles.heroStats}>
              <StatBar stats={[
                { value: proSig.vistasHoy, label: 'vistas hoy' },
                { value: proSig.busquedasSemana, label: 'búsquedas en tu zona' },
                { value: proSig.vistasSemana, label: 'vistas esta semana' },
              ]} />
            </div>
          )}
        </header>

        {/* ── TU TRABAJO (profesional) ─────────────────────────────── */}
        {user.isHelper && (
          <section className={styles.seccion} style={entrada(80)}>
            <h2 className={styles.titulo}>Tu trabajo</h2>
            <div className={styles.tarjeta}>
              <p className={styles.frase}
                dangerouslySetInnerHTML={{__html: sem.frase.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}} />
              {/* Sin ceros: solo lo que existe y es verdad. */}
              {sem.piezas > 0 && (
                <p className={styles.cifra}><strong>{sem.piezas}</strong> {sem.piezas === 1 ? 'publicación' : 'publicaciones'}</p>
              )}
              <Button variant="primary" full onClick={() => setComposerOpen(true)} style={{marginTop:'var(--space-16)'}}>
                <PenLine size={16} aria-hidden="true" /> Publicar un caso
              </Button>
            </div>
          </section>
        )}

        {/* ── TU FICHA (profesional) ───────────────────────────────── */}
        {user.isHelper && (
          <section id="asi-te-ven" className={styles.seccion} style={{...entrada(140), scrollMarginTop:'80px'}}>
            <h2 className={styles.titulo}>Tu ficha</h2>
            <div className={styles.pila}>

              {faltaEnFicha && (campoAbierto === faltaEnFicha.campo ? (
                <div className={styles.tarjeta}>
                  <label htmlFor="campo-perfil" className={styles.tarjetaTitulo}>Añade {faltaEnFicha.nombre}</label>
                  <input id="campo-perfil" className={styles.campo} autoFocus value={campoDraft} placeholder={faltaEnFicha.ejemplo}
                    onChange={e => setCampoDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') guardarCampo(); if (e.key === 'Escape') setCampoAbierto(null) }} />
                  <div className={styles.acciones}>
                    <Button variant="secondary" onClick={() => setCampoAbierto(null)} style={{flex:1}}>Cancelar</Button>
                    <Button variant="primary" disabled={!campoDraft.trim()} onClick={guardarCampo} style={{flex:2, ...(campoDraft.trim() ? {} : apagado)}}>Guardar</Button>
                  </div>
                </div>
              ) : (
                <div className={styles.lista}>
                  <Fila icono={Plus} titulo={`Añade ${faltaEnFicha.nombre}`}
                    detalle={faltaEnFicha.porQue.charAt(0).toUpperCase() + faltaEnFicha.porQue.slice(1) + '.'}
                    envolver onClick={() => { setCampoAbierto(faltaEnFicha.campo); setCampoDraft('') }} />
                </div>
              ))}

              {/* La foto, solo con la ficha vinculada (etapa 7): sin saber
                  quien es, cualquiera podria cambiar la foto de cualquiera. */}
              {((user.helperId != null && tieneCuenta) || (DEMO_MODE && !tieneCuenta)) && (
                <FotoPerfil actual={user.avatar} helperId={user.helperId} local={!tieneCuenta} onCambio={url => updateUser({ avatar: url })} />
              )}

              <div>
                <SectionLabel tone="brand" style={{margin:'var(--space-4) 0 var(--space-10)'}}>
                  Así te ven · vista previa
                </SectionLabel>
                {obraPropia.length > 0 && (
                  <div className={styles.pila} style={{marginBottom:'var(--space-12)'}}>
                    {obraPropia.map(o => <PostCard key={o.id} post={obraAPost(o)} />)}
                  </div>
                )}
                {/* `inert`, no solo pointer-events: con teclado o VoiceOver
                    el "Escribir" abria /chat/me, un chat consigo misma. Una
                    vista previa se mira, no se usa. */}
                <div inert style={{pointerEvents:'none'}}>
                  <HelperCard helper={proPreview} showPrice />
                </div>
              </div>

              <Button variant="secondary" full onClick={() => setEditarAbierto(true)}
                style={{color:'var(--purple-ink)', boxShadow:'var(--glass-control-shadow)', minHeight:48}}>
                <Edit2 size={15} aria-hidden="true" /> Editar mi ficha
              </Button>

              {/* Su ficha es su tarjeta de visita: se manda por WhatsApp a
                  quien le pregunte, y al abrirla le pueden escribir. */}
              {user.helperId != null && (
                <Button variant="secondary" full
                  onClick={async () => {
                    const r = await compartirEnlace({
                      url: enlaceDeFicha(user.helperId),
                      titulo: `${user.name || 'Mi ficha'} en Nüra`,
                      texto: 'Esta es mi ficha en Nüra. Me puedes escribir por aquí:',
                    })
                    if (r === 'copiado') showToast('Enlace de tu ficha copiado')
                    else if (r === 'fallo') showToast('No he podido copiar el enlace')
                  }}
                  style={{boxShadow:'var(--glass-control-shadow)', minHeight:48}}>
                  <Share2 size={15} aria-hidden="true" /> Compartir mi ficha
                </Button>
              )}

              {/* La cita: es lo primero que leen, con su voz. */}
              {!proQuote ? (
                <div className={styles.tarjeta}>
                  <label htmlFor="cita-personal" className={styles.tarjetaTitulo}>Tu frase</label>
                  <p className={styles.tarjetaTexto}>
                    Es lo primero que leen, con tu voz: ayuda a que te conozcan antes de escribirte.
                  </p>
                  <textarea id="cita-personal" className={styles.campo} value={quoteDraft}
                    onChange={e => setQuoteDraft(e.target.value)} rows={3}
                    placeholder="Ej: Cuido a cada persona como cuidaría a mi propia familia."
                    style={{marginTop:'var(--space-12)', fontFamily:'var(--font-voice)', resize:'none'}} />
                  <Button variant="primary" full disabled={!quoteDraft.trim()} onClick={saveQuote}
                    style={{marginTop:'var(--space-12)', ...(quoteDraft.trim() ? {} : apagado)}}>
                    Guardar mi frase
                  </Button>
                </div>
              ) : (
                <p className={styles.nota}>
                  <Badge variant="success" size="xs">✓ Cita añadida</Badge>
                  Tu primera conexión verificada aparecerá aquí cuando ocurra.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── LO QUE NÜRA SABE DE TI (perfil vivo) ─────────────────── */}
        {user.isHelper && user.helperId != null && (
          <LoQueSabeNura helperId={user.helperId} estilos={styles} puedeCorregir={tieneCuenta} />
        )}

        {/* ── TU ACCESO (etapa 6 de estudio-perfil.md) ─────────────────
            Correo y contraseña. La sesion se lee de `nura_sesion` sin
            importar la libreria de Supabase: el perfil no arrastra 211 kB
            que solo necesitan Entrar y Restablecer. */}
        {!cuentaTelefono && (user.isHelper || correoAcceso) && (
          <section className={styles.seccion} style={entrada(200)}>
            <h2 className={styles.titulo}>Tu acceso</h2>
            {correoAcceso ? (
              <AccesoCuenta detalleCorreo={!user.isHelper ? null
                : user.helperId != null ? 'Tu ficha está vinculada: lo que cambies se publica.'
                : vinculo === 'sin-confirmar' ? 'Confirma tu correo con el enlace que te enviamos para vincular tu ficha.'
                : vinculo === 'sin-ficha' ? 'No encontramos una ficha dada de alta con este correo.'
                : vinculo === 'varias' ? 'Hay varias fichas con este correo: escríbenos y lo resolvemos.'
                : vinculo ? 'No hemos podido vincular tu ficha ahora. Lo intentaremos al volver.'
                : 'Buscando tu ficha…'} />
            ) : (
              <div className={styles.tarjeta}>
                <p className={styles.tarjetaTitulo}>Crea tu acceso</p>
                <p className={styles.tarjetaTexto}>
                  Con tu correo y una contraseña podrás cambiar tu ficha desde cualquier móvil.
                </p>
                <Button variant="primary" full onClick={() => navigate('/entrar?modo=crear')} style={{marginTop:'var(--space-16)'}}>
                  Crear mi acceso
                </Button>
                <Button variant="secondary" full onClick={() => navigate('/entrar')} style={professionalInfoButton}>
                  ¿Ya tienes acceso? Entra
                </Button>
              </div>
            )}
          </section>
        )}

        {/* ── TU PROXIMA CITA ───────────────────────────────────────── */}
        {citaProxima && (
          <section className={styles.seccion} style={entrada(60)}>
            <h2 className={styles.titulo}>Tu próxima cita</h2>
            <div className={styles.tarjeta} style={{display:'flex', alignItems:'center', gap:'var(--space-12)'}}>
              <span className={styles.filaIcono} aria-hidden="true"><CalendarDays size={17} /></span>
              <p className={styles.tarjetaTexto} style={{color:'var(--ink)'}}>
                El {citaProxima.label}, <strong>{nombre(citaProxima.helperName)}</strong>
                {citaProxima.personaLabel ? <> está con {citaProxima.personaLabel}</> : <> tiene su primera cita contigo</>}. Todo listo.
              </p>
            </div>
          </section>
        )}

        {/* ── TE AVISO SI APARECE ─────────────────────────────────── */}
        <MisAlertas estilos={styles} destacar={verAlertas} />

        {/* ── LAS PERSONAS DE TU VIDA ─────────────────────────────── */}
        {(personas || []).length > 0 && (
          <section className={styles.seccion} style={entrada(60)}>
            <h2 className={styles.titulo}>Las personas de tu vida</h2>
            <div className={styles.lista}>
              {personas.map(p => {
                const ayudan = (p.contactedHelperIds || [])
                  .map(id => nombre(helpersCache?.[id]?.name || helpersCache?.[String(id)]?.name))
                  .filter(Boolean)
                return (
                  <div key={p.id} className={styles.fila} style={{cursor:'default', alignItems:'flex-start'}}>
                    <span className={styles.filaTexto}>
                      <span className={styles.filaTitulo} style={{textTransform:'capitalize'}}>{p.label.replace('tu ', '')}</span>
                      {(p.atributos || []).length > 0 && (
                        <span style={{display:'flex', gap:'var(--space-4)', flexWrap:'wrap', marginTop:'var(--space-6)'}}>
                          {p.atributos.map(a => <Badge key={a} variant="neutral">{a}</Badge>)}
                        </span>
                      )}
                      {ayudan.length > 0 && (
                        <span className={styles.filaDetalle} style={{color:'var(--green)', marginTop:'var(--space-6)'}}>
                          ✓ {ayudan.join(', ')} {ayudan.length === 1 ? 'ayuda' : 'ayudan'} con esto
                        </span>
                      )}
                    </span>
                    <button className={styles.quitar} onClick={() => removePersona(p.id)} aria-label={`Olvidar a ${p.label}`}>
                      <X size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
            <p className={styles.pie}>
              Nüra recuerda esto para ayudarte mejor. Puedes borrar cualquier persona cuando quieras.
            </p>
          </section>
        )}

        {/* ── LO TUYO ──────────────────────────────────────────────────
            El hueco vacio del usuario ("Aún no has buscado a nadie") solo al
            usuario: una profesional no busca ayuda, la ofrece. */}
        <section className={styles.seccion} style={entrada(user.isHelper ? 240 : 80)}>
          <h2 className={styles.titulo}>{user.isHelper ? 'Tus cosas' : 'Lo tuyo'}</h2>
          <div className={styles.pila}>
            {!user.isHelper && searchCount === 0 && chatCount === 0 && (
              <div className={`${styles.tarjeta} ${styles.tarjetaCentrada}`}>
                <p className={styles.tarjetaTitulo} style={{fontFamily:'var(--font-voice)'}}>Aún no has buscado a nadie</p>
                <p className={styles.tarjetaTexto}>
                  Cuéntame qué necesitas y te busco a la persona. Aquí irá quedando lo que hagas.
                </p>
                <Button variant="primary" onClick={() => navigate('/')} style={{marginTop:'var(--space-16)'}}>
                  <Search size={15} aria-hidden="true" /> Buscar a alguien
                </Button>
              </div>
            )}

            {aMedias.length > 0 && (
              <div className={styles.lista}>
                {aMedias.map(it => (
                  <Fila key={it.k} icono={it.k.startsWith('c') ? CalendarDays : MessageCircle}
                    titulo={it.titulo} detalle={it.detalle} sinLeer={it.sinLeer} onClick={() => navigate(it.to)} />
                ))}
              </div>
            )}

            <div className={styles.lista}>
              <Fila icono={ClipboardList} titulo="Mis servicios e historial"
                detalle="Tus citas y lo que ya has resuelto" onClick={() => navigate('/my-services')} />
              <Fila icono={favCount > 0 ? UserCheck : UserPlus} titulo="Profesionales que sigues"
                detalle={favCount > 0
                  ? (favCount === 1 ? 'Sigues a 1 profesional' : `Sigues a ${favCount} profesionales`)
                  : 'Guarda a quien te interese'}
                onClick={() => navigate('/siguiendo')} />
              {!user.isHelper && !ciudadAbierta && (
                <Fila icono={MapPin} titulo={user.ciudad ? `Tu ciudad: ${user.ciudad}` : 'Tu ciudad'}
                  detalle={user.ciudad ? 'Te enseño primero a quienes trabajan allí' : 'Dime dónde buscas y te enseño primero a quienes trabajan allí'}
                  envolver onClick={() => { setCiudadAbierta(true); setCiudadDraft(user.ciudad || ''); setCiudadFallo('') }} />
              )}
            </div>
            {!user.isHelper && ciudadAbierta && (
              <div className={styles.tarjeta}>
                <label htmlFor="campo-ciudad" className={styles.tarjetaTitulo}>Tu ciudad</label>
                <p className={styles.tarjetaTexto} style={{margin:'0 0 var(--space-10)'}}>
                  Cuando busques sin decir dónde, te enseño primero a quienes trabajan allí o atienden online. No escondo a nadie.
                </p>
                <input id="campo-ciudad" className={styles.campo} autoFocus value={ciudadDraft} placeholder="Madrid, Valencia, Barcelona…"
                  list="ciudades-nura" autoComplete="off"
                  onChange={e => { setCiudadDraft(e.target.value); setCiudadFallo('') }}
                  onKeyDown={e => { if (e.key === 'Enter') guardarCiudad(); if (e.key === 'Escape') setCiudadAbierta(false) }} />
                <datalist id="ciudades-nura">{CIUDADES.map(([c]) => <option key={c} value={c} />)}</datalist>
                {ciudadFallo && <p role="alert" className={styles.tarjetaTexto} style={{margin:'var(--space-8) 0 0', color:'var(--red-ink)'}}>{ciudadFallo}</p>}
                <div className={styles.acciones}>
                  <Button variant="secondary" onClick={() => setCiudadAbierta(false)} style={{flex:1}}>Cancelar</Button>
                  <Button variant="primary" disabled={!ciudadDraft.trim()} onClick={guardarCiudad} style={{flex:2, ...(ciudadDraft.trim() ? {} : apagado)}}>Guardar</Button>
                </div>
                {user.ciudad && (
                  <Button variant="ghost" full onClick={quitarCiudad} style={{marginTop:'var(--space-6)'}}>Quitar mi ciudad</Button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── ¿TIENES ALGO QUE OFRECER? (usuario) ─────────────────── */}
        {!user.isHelper && (
          <section className={styles.seccion} style={entrada(160)}>
            <h2 className={styles.titulo}>Hazte profesional</h2>
            <div className={styles.tarjeta}>
              <p className={styles.tarjetaTexto}>
                ¿Ayudas a otras personas con lo que sabes hacer? Crea tu ficha con tu cuenta: te encontrarán en Nüra y te llegarán los mensajes de quien te necesite.
              </p>
              <Button variant="primary" full onClick={() => navigate('/register-helper')}
                style={{marginTop:'var(--space-16)'}}>
                <User size={15} aria-hidden="true" /> Hazte profesional
              </Button>
              <Button variant="secondary" full onClick={() => navigate('/profesionales')} style={professionalInfoButton}>
                Cómo funciona para profesionales
              </Button>
            </div>
          </section>
        )}

        {/* ── LO QUE VIENE (profesional) ───────────────────────────────
            La reputacion verificada es suya, no del usuario. */}
        {user.isHelper && (
          <section className={styles.seccion} style={entrada(280)}>
            <div className={styles.tarjeta}>
              <SectionLabel tone="brand" style={{marginBottom:'var(--space-8)'}}>Próximamente</SectionLabel>
              <p className={styles.tarjetaTitulo}>Tu reputación profesional verificada</p>
              <p className={styles.tarjetaTexto}>
                Nüra construirá tu currículum vivo con las ayudas reales que ofrezcas, verificadas por las personas que ayudaste.
              </p>
            </div>
          </section>
        )}

        {/* Demostración con cuenta de teléfono: ya la tiene; no se le ofrece
            «Crea tu acceso» con correo como si le faltara (va abajo, con Ajustes). */}
        {cuentaTelefono && (
          <section className={styles.seccion}>
            <h2 className={styles.titulo}>Tu cuenta</h2>
            <div className={styles.tarjeta}>
              <p className={styles.tarjetaTexto}>
                Entras con tu teléfono {fmtTel(user.phone)} y tu contraseña. Si la olvidas, en «Entrar» toca «¿Has olvidado tu contraseña?» y te llegará un código por SMS.
              </p>
            </div>
          </section>
        )}

        {/* ── AJUSTES (etapa 3 de estudio-perfil.md) ───────────────────
            Lo legal primero, y BORRAR LOS DATOS, que el RGPD exige. Al
            final y discreto; un solo sello de version, lo ultimo. */}
        <section className={styles.seccion}>
          <h2 className={styles.titulo}>Ajustes</h2>
          <div className={styles.pila}>
            <div className={styles.lista}>
              <Fila icono={Shield} titulo="Privacidad" onClick={() => navigate('/legal/privacidad')} />
              <Fila icono={FileText} titulo="Términos de uso" onClick={() => navigate('/legal/terminos')} />
              {CONTACTO_EMAIL && (
                <Fila icono={Mail} titulo="Ayuda y contacto" onClick={() => { window.location.href = 'mailto:' + CONTACTO_EMAIL }} />
              )}
              <Fila icono={Trash2} peligro titulo={tieneCuenta || cuentaTelefono ? 'Borrar mi cuenta' : 'Borrar mis datos de este móvil'}
                abierta={borrarAbierto} onClick={() => setBorrarAbierto(v => !v)} />
              {borrarAbierto && (
                <div className={styles.borrar}>
                  <p className={styles.tarjetaTexto}>
                    {tieneCuenta
                      ? `Se borra tu acceso${user.helperId != null ? ', tu ficha pública y los mensajes que te han llegado' : ''}, y todo lo que Nüra guarda en este teléfono. No se puede deshacer.`
                      : cuentaTelefono
                      ? `Se borra al momento tu cuenta${user.isHelper ? ', tu ficha' : ''} y todo lo que Nüra guarda en este teléfono: tus búsquedas, tus conversaciones y a quién sigues. No se puede deshacer.`
                      : 'Se borra al momento todo lo que Nüra guarda en este teléfono: tus búsquedas, tus conversaciones y a quién sigues. No se puede deshacer.'}
                    {!tieneCuenta && !cuentaTelefono && user.isHelper && ' Tu ficha pública no se borra desde aquí: para eso, crea tu acceso y bórralo desde él.'}
                  </p>
                  {borrarError && <p role="alert" className={styles.tarjetaTexto} style={{color:'var(--red-ink)', marginTop:'var(--space-10)'}}>{borrarError}</p>}
                  <div className={styles.acciones}>
                    <Button variant="secondary" onClick={() => setBorrarAbierto(false)} style={{flex:1}}>Cancelar</Button>
                    <Button variant="primary" disabled={borrando} style={{flex:1, background:'var(--red-ink)'}} onClick={async () => {
                        // CON CUENTA (etapa 6c): primero el servidor — avisos,
                        // ficha publica y cuenta. Si falla, NO se borra nada
                        // del movil: tiene que poder reintentarlo con su sesion.
                        if (tieneCuenta) {
                          setBorrando(true); setBorrarError('')
                          try {
                            const { sesionActual } = await import('../utils/cuenta')
                            const ses = await sesionActual()
                            const r = ses ? await borrarCuenta(ses.access_token) : { ok: false }
                            if (!r?.ok) throw new Error('rechazado')
                          } catch {
                            setBorrando(false)
                            setBorrarError('No se ha podido borrar tu cuenta ahora. No hemos tocado nada: vuelve a probar en un momento.')
                            return
                          }
                        }
                        // Los avisos «te aviso si aparece» viven tambien en el
                        // servidor: se quitan antes de olvidar sus llaves.
                        await quitarTodas()
                        // Todo lo que empieza por nura_ es de Nüra y nada mas
                        // lo es. Luego se recarga: nada sobrevive en memoria.
                        for (const st of [localStorage, sessionStorage]) {
                          try { Object.keys(st).filter(k => k.startsWith('nura_')).forEach(k => st.removeItem(k)) } catch { /* sin almacenamiento */ }
                        }
                        window.location.replace('/')
                      }}>
                      {borrando ? 'Borrando…' : 'Borrar todo'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.lista}>
              <button className={styles.salir} onClick={() => {
                  if (!confirmarSalida) { setConfirmarSalida(true); setTimeout(() => setConfirmarSalida(false), 4000); return }
                  // El acceso tambien se cierra: si no, el siguiente que use
                  // este movil entraria con la cuenta de otra persona.
                  try { localStorage.removeItem('nura_sesion') } catch { /* sin almacenamiento */ }
                  logout(); navigate('/')
                }}
                style={confirmarSalida ? {color:'var(--red-ink)'} : undefined}>
                <LogOut size={16} aria-hidden="true" />
                {confirmarSalida ? 'Toca otra vez para cerrar sesión' : 'Cerrar sesión'}
              </button>
            </div>
          </div>
          <p className={styles.version}>Nüra · {NURA_BUILD}</p>
        </section>

      </div>
    </div>
    {composerOpen && <ObraComposer onClose={() => setComposerOpen(false)} />}
    {(editarAbierto || pideBloqueos || pideFicha) && <EditarFicha foco={pideBloqueos ? 'bloqueos' : undefined} onClose={cerrarEditar} />}
    </>
  )
}

/** Una fila de lista: icono en su circulo, texto y flecha. La misma forma
 *  para todo lo que lleva a otra pantalla. */
function Fila({ icono: Icono, titulo, detalle, sinLeer, peligro, abierta, envolver, onClick }) {
  return (
    <button className={`${styles.fila} ${peligro ? styles.filaPeligro : ''}`} onClick={onClick}
      aria-expanded={abierta}>
      {Icono && <span className={styles.filaIcono} aria-hidden="true"><Icono size={17} strokeWidth={1.9} /></span>}
      <span className={styles.filaTexto}>
        <span className={styles.filaTitulo}>{titulo}</span>
        {detalle && <span className={styles.filaDetalle} style={envolver ? {whiteSpace:'normal'} : undefined}>{detalle}</span>}
      </span>
      {sinLeer > 0 && <span className={styles.contador} aria-label={`${sinLeer} sin leer`}>{sinLeer}</span>}
      {abierta === undefined
        ? <ChevronRight size={18} className={styles.chevron} aria-hidden="true" />
        : <ChevronRight size={18} className={styles.chevron} aria-hidden="true"
            style={{transform: abierta ? 'rotate(90deg)' : 'none', transition:'transform 0.2s'}} />}
    </button>
  )
}
