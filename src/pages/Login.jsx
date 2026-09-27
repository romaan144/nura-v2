import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import styles from './Access.module.css'
import { Phone, UserRound, KeyRound } from 'lucide-react'
import { DEMO_MODE, NURA_BUILD } from '../config'

// ═══════════════════════════════════════════════════════════════
// LOGIN — reescrita desde cero.
// La anterior arrastraba diez ciclos de parches: centrado vertical,
// medidas de viewport, blobs decorativos, scrollIntoView, reglas
// duplicadas en media queries. Nada de eso vuelve.
// Aqui solo hay un contenedor que ocupa lo que le dan y desplaza si
// hace falta, con el contenido apilado de arriba abajo.
// ═══════════════════════════════════════════════════════════════

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
    <div className={styles.loginPage}>
      <div className={styles.loginInner}>
        <div className={styles.brand}>
          <img src="/logo-iso.png" alt="" width="44" height="44" />
          <span className="nura-wordmark">Nüra</span>
        </div>
        <main className={styles.loginCard}>
          <div className={styles.icon} aria-hidden="true">{step === 'phone' ? <Phone size={24} /> : step === 'code' ? <KeyRound size={24} /> : <UserRound size={24} />}</div>
          {DEMO_MODE && <>
            <p className={styles.eyebrow}>Demostración · Paso {PASO[step] + 1} de 3</p>
            <div className={styles.steps} aria-hidden="true">{[0, 1, 2].map(i => <span key={i} className={i <= PASO[step] ? styles.stepActive : ''} />)}</div>
          </>}
          {step === 'phone' && <>
            <h1 className={styles.title}>Tu teléfono</h1>
            <p className={styles.description}>Prueba cómo es entrar en Nüra. En esta demostración no enviamos SMS.</p>
            <div className={styles.field}>
              <label htmlFor="login-phone" className={styles.label}>Número de teléfono</label>
              <input id="login-phone" className={styles.input} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="612 345 678"
                value={phone} maxLength={9} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') handlePhone() }} />
              {phone.length > 0 && phone.length < 9 && <p className={styles.hint} role="status">Faltan {9 - phone.length} cifras</p>}
            </div>
            <button type="button" className={styles.primary} onClick={handlePhone} disabled={phone.length < 9 || loading}>{loading ? 'Un momento…' : 'Continuar'}</button>
          </>}
          {step === 'code' && <>
            <h1 className={styles.title}>Tu código</h1>
            <p className={styles.description}>Para continuar la demostración, escribe cuatro cifras. No necesitas recibir un SMS.</p>
            <label htmlFor="login-code" className={styles.label}>Código de verificación</label>
            <div className={styles.codeWrap}>
              <div className={styles.codeRow} aria-hidden="true">{[0, 1, 2, 3].map(i => <span key={i} className={code[i] ? styles.codeFilled : ''}>{code[i] || ''}</span>)}</div>
              <input id="login-code" className={styles.codeInput} type="tel" inputMode="numeric" autoComplete="one-time-code" value={code} maxLength={4}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyDown={e => { if (e.key === 'Enter') handleCode() }} />
            </div>
            {code.length > 0 && code.length < 4 && <p className={styles.hint} role="status">Faltan {4 - code.length} cifras</p>}
            <button type="button" className={styles.primary} onClick={handleCode} disabled={code.length < 4 || loading}>{loading ? 'Comprobando…' : 'Entrar'}</button>
            <div className={styles.alternative}><button type="button" className={styles.secondary} onClick={() => { setStep('phone'); setCode('') }}>Cambiar de número</button></div>
          </>}
          {step === 'name' && <>
            <h1 className={styles.title}>¿Cómo te llamas?</h1>
            <p className={styles.description}>Así sabrán quién les escribe. Se guarda en este móvil.</p>
            <div className={styles.field}>
              <label htmlFor="login-name" className={styles.label}>Tu nombre</label>
              <input id="login-name" className={styles.input} autoComplete="name" placeholder="Escribe tu nombre" value={name}
                onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleName() }} />
            </div>
            <button type="button" className={styles.primary} onClick={handleName} disabled={!name.trim()}>Entrar en Nüra</button>
            {!DEMO_MODE && <div className={styles.alternative}>
              <p className={styles.hint}>¿Quieres entrar desde cualquier móvil?</p>
              <button type="button" className={styles.secondary} onClick={() => navigate('/entrar?modo=crear&volver=' + encodeURIComponent(sessionStorage.getItem('nura_return_to') || '/'))}>Crea tu acceso con correo</button>
            </div>}
          </>}
        </main>
        <p className={styles.privacy}>{DEMO_MODE ? 'Tu teléfono no se muestra a nadie.' : 'Nunca analizamos tus conversaciones ni lo que buscas.'}</p>
        <p className={styles.build}>{NURA_BUILD}</p>
      </div>
    </div>
  )
}
