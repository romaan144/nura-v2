import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { Button } from '../components/ui'
import { DEMO_MODE, NURA_BUILD } from '../config'

// ═══════════════════════════════════════════════════════════════
// LOGIN — reescrita desde cero.
// La anterior arrastraba diez ciclos de parches: centrado vertical,
// medidas de viewport, blobs decorativos, scrollIntoView, reglas
// duplicadas en media queries. Nada de eso vuelve.
// Aqui solo hay un contenedor que ocupa lo que le dan y desplaza si
// hace falta, con el contenido apilado de arriba abajo.
// ═══════════════════════════════════════════════════════════════

const S = {
  // La estructura sigue siendo la simple que funciona: altura del padre,
  // flujo normal, cero elementos posicionados a nivel de pagina. Lo bonito
  // de la version original vuelve como SUPERFICIE, no como colocacion.
  page: {
    height: '100%', minHeight: '100dvh',
    overflowY: 'auto', overflowX: 'hidden', overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch',
    // Centrado SEGURO: flex + margin:auto en el hijo. A diferencia de
    // justify-content:center, cuando el contenido no cabe el margen se
    // reduce a cero y vuelve al flujo normal — nunca corta por arriba.
    display: 'flex', flexDirection: 'column',
    background: `radial-gradient(420px 320px at 88% -4%, rgba(255,59,92,0.10), transparent 64%),
                 radial-gradient(520px 360px at 6% 4%, rgba(123,47,255,0.11), transparent 66%),
                 radial-gradient(460px 300px at 50% 104%, rgba(0,212,200,0.08), transparent 62%),
                 var(--paper)`,
    /* Sin reserva de barra: BottomNav se oculta en /login
       (BottomNav.jsx:14 HIDE_ON), asi que reservarla dejaba ~90px muertos. */
    padding: 'var(--space-32) var(--space-20) var(--space-32)',
  },
  inner: { maxWidth: '420px', width: '100%', margin: 'auto' },

  logo: {
    width: '60px', height: '60px', display: 'block', margin: '0 auto',
    animation: 'fadeInUp .36s ease both',
  },
  wordmark: { height: '26px', display: 'block', margin: 'var(--space-14) auto var(--space-6)' },
  lema: {
    fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)',
    textAlign: 'center', margin: '0 0 var(--space-28)', letterSpacing: '-0.1px',
  },

  card: {
    background: 'rgba(255,255,255,0.86)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    backdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid var(--ink-border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
    padding: 'var(--space-24) var(--space-20)',
  },
  pasos: { display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-24)' },
  paso: hecho => ({
    height: '3px', flex: 1, borderRadius: 'var(--radius-full)',
    background: hecho ? 'var(--purple)' : 'var(--surface-muted)',
    transition: 'background 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
  }),

  titulo: {
    fontFamily: 'var(--font-voice)', fontSize: 'var(--text-page-title)', fontWeight: 700,
    letterSpacing: '-0.6px', color: 'var(--ink)', margin: '0 0 var(--space-6)',
    textAlign: 'center',
  },
  ayuda: {
    fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)',
    margin: '0 0 var(--space-20)', lineHeight: 1.5, textAlign: 'center',
  },
  campo: {
    width: '100%', boxSizing: 'border-box',
    border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-card)',
    padding: 'var(--space-14) var(--space-16)',
    fontSize: '16px',
    fontFamily: 'inherit', color: 'var(--ink)', textAlign: 'center',
    background: 'var(--paper)', outline: 'none',
    marginBottom: 'var(--space-14)', letterSpacing: '0.4px',
  },

  // Las casillas del codigo, de la version original
  codeWrap: { position: 'relative', marginBottom: 'var(--space-16)' },
  codeRow: { display: 'flex', gap: 'var(--space-10)', justifyContent: 'center' },
  codeBox: lleno => ({
    width: '54px', height: '62px', borderRadius: 'var(--radius-card)',
    background: lleno ? 'var(--purple-05)' : 'var(--paper)',
    border: '1.5px solid ' + (lleno ? 'var(--purple)' : 'var(--ink-border)'),
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '26px', fontWeight: 700, color: 'var(--ink)',
    transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
  }),
  codeHidden: {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    opacity: 0, border: 'none', background: 'transparent',
    fontSize: '16px', cursor: 'pointer',
  },

  pista: {
    fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)',
    margin: '0 0 var(--space-12)', textAlign: 'center',
  },
  volver: {
    background: 'none', border: 'none', color: 'var(--ink-tertiary)',
    fontSize: 'var(--text-sm)', fontFamily: 'inherit',
    padding: 'var(--space-14) 0 0', cursor: 'pointer', width: '100%',
  },
  confianza: {
    display: 'block', margin: 'var(--space-20) 0 0',
    fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)',
    textAlign: 'center', lineHeight: 1.5,
  },
  sello: {
    textAlign: 'center', fontSize: 'var(--text-xs)',
    color: 'var(--ink-tertiary)', marginTop: 'var(--space-16)', opacity: 0.6,
  },
}

const PASO = { phone: 0, code: 1, name: 2 }

export default function Login() {
  // SIN SMS NO HAY CODIGO. La pantalla decia «te lo hemos enviado» y no se
  // enviaba nada: valia cualquier numero de 4 cifras, y una persona real se
  // quedaria esperando un mensaje que nunca llega. Fuera de la demo se pide
  // solo el nombre (lo unico que el profesional necesita para saber quien
  // le escribe); el acceso de verdad es el del correo (/entrar).
  const [step, setStep] = useState(DEMO_MODE ? 'phone' : 'name')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useUser()
  const navigate = useNavigate()

  const salir = () => {
    const returnTo = sessionStorage.getItem('nura_return_to')
    navigate(returnTo || '/', { replace: true })
    // Se borra DESPUES: la ruta /login, al ver la sesion, tambien redirige
    // leyendo este destino, y si ya no estaba mandaba a Inicio.
    setTimeout(() => { try { sessionStorage.removeItem('nura_return_to') } catch { /* sin memoria */ } }, 1500)
  }

  function handlePhone() {
    if (phone.length < 9) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setStep('code') }, 900)
  }

  function handleCode() {
    if (code.length < 4) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      // Protegido: un dato corrupto reventaba la verificacion del codigo y
      // dejaba al usuario encerrado sin poder entrar.
      let savedUser = null
      try { savedUser = JSON.parse(localStorage.getItem('nura_user') || 'null') }
      catch { savedUser = null }
      if (savedUser?.name && savedUser.name !== 'Usuario') {
        login({ ...savedUser, phone, verified: true })
        salir()
      } else {
        setStep('name')
      }
    }, 700)
  }

  function handleName() {
    if (!name.trim()) return
    login({ name: name.trim(), phone, joined: new Date().toISOString() })
    sessionStorage.setItem('nura_just_registered', '1')
    salir()
  }

  return (
    <div style={S.page}>
      <div style={S.inner}>
        <img src="/logo-iso.png" alt="" style={S.logo} />
        <span className="nura-wordmark" style={{textAlign: 'center', margin: '12px auto 6px'}}>Nüra</span>
        <p style={S.lema}>Encuentra a la persona adecuada</p>

        <div style={S.card}>
          {DEMO_MODE && (
            <div style={S.pasos}>
              {[0, 1, 2].map(i => <div key={i} style={S.paso(i <= PASO[step])} />)}
            </div>
          )}

          {step === 'phone' && (
            <>
              <h1 style={S.titulo}>Tu teléfono</h1>
              <p style={S.ayuda}>Te enviamos un código para confirmar que eres tú.</p>
              <input style={S.campo} type="tel" inputMode="numeric" placeholder="612 345 678"
                value={phone} maxLength={9}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') handlePhone() }} />
              {/* La pista aparece solo si ya empezaste: explicar antes de que
                nadie lo intente es regañar de entrada. */}
            {phone.length > 0 && phone.length < 9 && (
              <p style={S.pista}>Faltan {9 - phone.length} cifras</p>
            )}
            <Button variant="primary" full onClick={handlePhone} disabled={phone.length < 9 || loading}>
                {loading ? 'Enviando…' : 'Continuar'}
              </Button>
            </>
          )}

          {step === 'code' && (
            <>
              <h1 style={S.titulo}>Tu código</h1>
              <p style={S.ayuda}>Te lo hemos enviado al {phone}.</p>
              <div style={S.codeWrap}>
                <div style={S.codeRow}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={S.codeBox(!!code[i])}>{code[i] || ''}</div>
                  ))}
                </div>
                <input style={S.codeHidden} type="tel" inputMode="numeric" value={code} maxLength={4}
                  aria-label="Código de verificación"
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onKeyDown={e => { if (e.key === 'Enter') handleCode() }} />
              </div>
              {code.length > 0 && code.length < 4 && (
              <p style={S.pista}>Faltan {4 - code.length} cifras</p>
            )}
            <Button variant="primary" full onClick={handleCode} disabled={code.length < 4 || loading}>
                {loading ? 'Comprobando…' : 'Entrar'}
              </Button>
              <button style={S.volver} onClick={() => { setStep('phone'); setCode('') }}>
                Cambiar de número
              </button>
            </>
          )}

          {step === 'name' && (
            <>
              <h1 style={S.titulo}>¿Cómo te llamas?</h1>
              <p style={S.ayuda}>Así sabrán quién les escribe. Se guarda en este móvil.</p>
              <input style={S.campo} placeholder="Tu nombre" value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleName() }} />
              <Button variant="primary" full onClick={handleName} disabled={!name.trim()}>
                Entrar en Nüra
              </Button>
              {!DEMO_MODE && (
                <button style={S.volver} onClick={() => navigate('/entrar?modo=crear&volver=' + encodeURIComponent(sessionStorage.getItem('nura_return_to') || '/'))}>
                  ¿Quieres entrar desde cualquier móvil? Crea tu acceso con correo
                </button>
              )}
            </>
          )}
        </div>

        <p style={S.confianza}>
          {DEMO_MODE
            ? <>Tu teléfono no se muestra a nadie.<br />Solo sirve para entrar.</>
            : <>Nunca analizamos tus conversaciones ni lo que buscas.</>}
        </p>

        <div style={S.sello}>{NURA_BUILD}</div>
      </div>
    </div>
  )
}
