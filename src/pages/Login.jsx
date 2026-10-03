import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import styles from './Access.module.css'
import { UserRoundPlus, UserRound, KeyRound, ArrowLeft } from 'lucide-react'
import cabecera from '../components/PageHeader.module.css'
import { useVolver } from '../utils/volver'
import { DEMO_MODE, NURA_BUILD } from '../config'
import PasswordField from '../components/PasswordField'
import SmsSimulado from '../components/SmsSimulado'
import { telefonoInternacional, telefonoLegible } from '../utils/telefono'
import { crearCuentaDemo, existeCuentaDemo, codigoSms, MIN_CONTRASENA_DEMO } from '../utils/cuentaDemo'

// ═══════════════════════════════════════════════════════════════
// LOGIN — reescrita desde cero.
// La anterior arrastraba diez ciclos de parches: centrado vertical,
// medidas de viewport, blobs decorativos, scrollIntoView, reglas
// duplicadas en media queries. Nada de eso vuelve.
// Aqui solo hay un contenedor que ocupa lo que le dan y desplaza si
// hace falta, con el contenido apilado de arriba abajo.
// ═══════════════════════════════════════════════════════════════

// CREAR CUENTA (Sergio, 2026-10-03): primero una cuenta completa —nombre,
// teléfono y contraseña—, confirmada con un código por SMS. Con ella se
// entra después desde «Entrar»; ser profesional se pide ya dentro, en el
// perfil. En la demostración el SMS se simula (components/SmsSimulado).

// El autorrelleno del móvil entrega el número como lo tenga guardado:
// «+34 612 34 56 78» o «0034…». Se queda en las 9 cifras nacionales.
const nueveCifras = v => {
  const d = String(v || '').replace(/\D/g, '')
  return (d.length > 9 && /^(0034|34)/.test(d) ? d.replace(/^(0034|34)/, '') : d).slice(0, 9)
}

export default function Login() {
  // SIN SMS NO HAY CODIGO de verdad. Fuera de la demo se pide solo el
  // nombre (lo unico que el profesional necesita para saber quien le
  // escribe); el acceso de verdad es el del correo (/entrar).
  const [step, setStep] = useState(DEMO_MODE ? 'datos' : 'name')
  const [phone, setPhone] = useState('')
  const [pass, setPass] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [enviado, setEnviado] = useState('')   // el código del SMS simulado
  const [sms, setSms] = useState('')           // el que se ve llegar arriba
  const [error, setError] = useState('')
  const [yaExiste, setYaExiste] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useUser()
  const navigate = useNavigate()
  const volver = useVolver()
  // Con flecha, como las demás pantallas (Sergio, 2026-10-02): se llega al
  // tocar «Escribir» sin cuenta y no había forma de salir sin registrarse.
  // En el paso del código vuelve a los datos; si no, a donde se estaba.
  const atras = () => (step === 'codigo' ? (setStep('datos'), setCode(''), setError(''), setSms('')) : volver())

  // El SMS «llega» un momento después de pedirlo, como uno de verdad.
  useEffect(() => {
    if (step !== 'codigo' || !enviado) return
    const t = setTimeout(() => setSms(enviado), 1200)
    return () => clearTimeout(t)
  }, [step, enviado])

  const salir = () => {
    const returnTo = sessionStorage.getItem('nura_return_to')
    navigate(returnTo || '/', { replace: true })
    // Se borra DESPUES: la ruta /login, al ver la sesion, tambien redirige
    // leyendo este destino, y si ya no estaba mandaba a Inicio.
    setTimeout(() => { try { sessionStorage.removeItem('nura_return_to') } catch { /* sin memoria */ } }, 1500)
  }

  const telOk = !!telefonoInternacional(phone)
  const datosListos = name.trim() && telOk && pass.length >= MIN_CONTRASENA_DEMO

  function handleDatos() {
    if (!datosListos || loading) return
    setError(''); setYaExiste(false)
    if (existeCuentaDemo(phone)) {
      setYaExiste(true)
      setError('Ya hay una cuenta con este teléfono. Entra con tu contraseña.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setCode(''); setSms('')
      setEnviado(codigoSms())
      setStep('codigo')
    }, 700)
  }

  function reenviar() {
    setCode(''); setError(''); setSms('')
    setEnviado(codigoSms())
  }

  async function handleCode() {
    if (code.length < 6 || loading) return
    if (code !== enviado) { setError('El código no es correcto. Míralo en el SMS que te hemos enviado.'); return }
    setLoading(true)
    const r = await crearCuentaDemo({ telefono: phone, nombre: name, contrasena: pass })
    setLoading(false)
    if (r.error) { setStep('datos'); setYaExiste(!!r.existe); setError(r.error); return }
    setSms('')
    login(r.usuario)
    sessionStorage.setItem('nura_just_registered', '1')
    salir()
  }

  function handleName() {
    if (!name.trim()) return
    login({ name: name.trim(), phone, joined: new Date().toISOString() })
    sessionStorage.setItem('nura_just_registered', '1')
    salir()
  }

  const irAEntrar = () => navigate('/entrar?volver=' + encodeURIComponent(sessionStorage.getItem('nura_return_to') || '/profile'))

  return (
    <div className={styles.loginPage}>
      <button type="button" className={cabecera.circleBtn} onClick={atras} aria-label="Volver"
        style={{ position: 'fixed', zIndex: 5, top: 'max(env(safe-area-inset-top, 0px), 12px)', left: 16 }}>
        <ArrowLeft size={18} />
      </button>
      {step === 'codigo' && <SmsSimulado codigo={sms} onUsar={c => { setCode(c); setError('') }} />}
      <div className={styles.loginInner}>
        <div className={styles.brand}>
          <img src="/logo-iso.png" alt="" width="44" height="44" />
          <span className="nura-wordmark">Nüra</span>
        </div>
        <main className={styles.loginCard}>
          <div className={styles.icon} aria-hidden="true">{step === 'datos' ? <UserRoundPlus size={24} /> : step === 'codigo' ? <KeyRound size={24} /> : <UserRound size={24} />}</div>
          {DEMO_MODE && <>
            <p className={styles.eyebrow}>Crear cuenta · Paso {step === 'datos' ? 1 : 2} de 2</p>
            <div className={styles.steps} aria-hidden="true">{[0, 1].map(i => <span key={i} className={i <= (step === 'datos' ? 0 : 1) ? styles.stepActive : ''} />)}</div>
          </>}
          {step === 'datos' && <form onSubmit={e => { e.preventDefault(); handleDatos() }} noValidate>
            <h1 className={styles.title}>Crea tu cuenta</h1>
            <p className={styles.description}>Con tu teléfono y tu contraseña entrarás desde cualquier móvil. Te enviaremos un SMS para comprobar que el teléfono es tuyo.</p>
            <div className={styles.field}>
              <label htmlFor="login-name" className={styles.label}>Tu nombre</label>
              <input id="login-name" className={styles.input} autoComplete="name" name="name" autoCapitalize="words" placeholder="Escribe tu nombre" value={name}
                onChange={e => setName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="login-phone" className={styles.label}>Teléfono móvil</label>
              <input id="login-phone" className={styles.input} type="tel" inputMode="tel" autoComplete="tel" name="tel" placeholder="612 345 678"
                value={phone} onChange={e => { setPhone(nueveCifras(e.target.value)); setYaExiste(false) }} />
              {phone.length > 0 && phone.length < 9 && <p className={styles.hint} role="status">Faltan {9 - phone.length} cifras</p>}
              {phone.length === 9 && !telOk && <p className={styles.hint} role="status">Escribe un móvil: empieza por 6 o 7.</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="login-pass" className={styles.label}>Contraseña</label>
              <PasswordField id="login-pass" name="new-password" value={pass} onChange={e => setPass(e.target.value)}
                autoComplete="new-password" aria-describedby="login-pass-hint" />
              <p id="login-pass-hint" className={styles.hint}>Al menos {MIN_CONTRASENA_DEMO} caracteres.</p>
            </div>
            {error && <p role="alert" className={styles.error}>{error}</p>}
            {yaExiste
              ? <button type="button" className={styles.primary} onClick={irAEntrar}>Entrar con este teléfono</button>
              : <button type="submit" className={styles.primary} disabled={!datosListos || loading}>{loading ? 'Un momento…' : 'Enviarme el código'}</button>}
            <div className={styles.alternative}>
              <button type="button" className={styles.secondary} onClick={irAEntrar}>¿Ya tienes cuenta? Entra</button>
            </div>
          </form>}
          {step === 'codigo' && <>
            <h1 className={styles.title}>Tu código</h1>
            <p className={styles.description}>Te hemos enviado un SMS al <span style={{ whiteSpace: 'nowrap' }}>{telefonoLegible(telefonoInternacional(phone))}</span>. Escribe el código de seis cifras.</p>
            <label htmlFor="login-code" className={styles.label}>Código del SMS</label>
            <div className={styles.codeWrap}>
              <div className={`${styles.codeRow} ${styles.codeRow6}`} aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(i => <span key={i} className={code[i] ? styles.codeFilled : ''}>{code[i] || ''}</span>)}</div>
              <input id="login-code" className={styles.codeInput} type="tel" inputMode="numeric" autoComplete="one-time-code" value={code} maxLength={6}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                onKeyDown={e => { if (e.key === 'Enter') handleCode() }} />
            </div>
            {code.length > 0 && code.length < 6 && <p className={styles.hint} role="status">Faltan {6 - code.length} cifras</p>}
            {DEMO_MODE && <p className={styles.hint}>Demostración: el SMS no sale de verdad, te aparece arriba. Tócalo para escribir el código.</p>}
            {error && <p role="alert" className={styles.error}>{error}</p>}
            <button type="button" className={styles.primary} onClick={handleCode} disabled={code.length < 6 || loading}>{loading ? 'Comprobando…' : 'Crear mi cuenta'}</button>
            <div className={styles.alternative}>
              <button type="button" className={styles.secondary} onClick={reenviar}>Enviarme otro código</button>
              <button type="button" className={styles.textButton} style={{ margin: '8px auto 0', textAlign: 'center' }} onClick={atras}>Cambiar de número</button>
            </div>
          </>}
          {step === 'name' && <>
            <h1 className={styles.title}>¿Cómo te llamas?</h1>
            <p className={styles.description}>Así sabrán quién les escribe. Se guarda en este móvil.</p>
            <div className={styles.field}>
              <label htmlFor="login-name" className={styles.label}>Tu nombre</label>
              <input id="login-name" className={styles.input} autoComplete="name" name="name" autoCapitalize="words" placeholder="Escribe tu nombre" value={name}
                onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleName() }} />
            </div>
            <button type="button" className={styles.primary} onClick={handleName} disabled={!name.trim()}>Entrar en Nüra</button>
            <div className={styles.alternative}>
              <p className={styles.hint}>¿Quieres entrar desde cualquier móvil?</p>
              <button type="button" className={styles.secondary} onClick={() => navigate('/entrar?modo=crear&volver=' + encodeURIComponent(sessionStorage.getItem('nura_return_to') || '/'))}>Crea tu acceso con correo</button>
            </div>
          </>}
        </main>
        <p className={styles.privacy}>{DEMO_MODE ? 'Tu teléfono no se muestra a nadie.' : 'Nunca analizamos tus conversaciones ni lo que buscas.'}</p>
        <p className={styles.build}>{NURA_BUILD}</p>
      </div>
    </div>
  )
}
