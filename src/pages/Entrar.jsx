import { showToast } from '../components/Toast'
import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import styles from './Access.module.css'
import PasswordField from '../components/PasswordField'
import { KeyRound, Mail, UserRoundPlus } from 'lucide-react'
import { crearCuenta, entrar, pedirRestablecer, sesionActual, salir, MIN_CONTRASENA, pedirCodigoParaEntrar, entrarConCodigo } from '../utils/cuenta'
import { pareceTelefono, telefonoLegible, telefonoInternacional } from '../utils/telefono'
import { reclamarFicha } from '../utils/escrituras'
import { useUser } from '../context/UserContext'
import { revisarContacto } from '../utils/contactoProfesional'
import { usuarioDeFicha, usuarioCliente } from '../utils/usuarioDeFicha'
import { DEMO_MODE } from '../config'
import { entrarDemo, existeCuentaDemo, nuevaContrasenaDemo, codigoSms } from '../utils/cuentaDemo'
import SmsSimulado from '../components/SmsSimulado'

// El motivo solo cambia el texto: no los permisos ni el destino del acceso.
const TEXTOS_ACCESO = {
  comentarios: {
    crear: 'Crea tu acceso con correo para comentar esta publicación. Después volverás al mismo hilo.',
    entrar: 'Entra con tu correo o tu móvil y tu contraseña para volver a la publicación y comentar.',
  },
  avisos: {
    crear: 'Crea tu acceso con correo. Después vuelve a tu búsqueda y activa el aviso por correo.',
    entrar: 'Entra con tu correo o tu móvil y tu contraseña. Después podrás volver a tu búsqueda y activar el aviso.',
  },
  mensajes: {
    crear: 'Crea tu acceso con correo para continuar con tus mensajes en Nüra.',
    entrar: 'Entra con tu correo o tu móvil y tu contraseña para continuar con tus mensajes.',
  },
  // Desde un mensaje recibido: es la profesional, y su ficha se encuentra por el correo.
  proMensajes: {
    crear: 'Usa el correo que diste al darte de alta en Nüra: así encontramos tu ficha y ves aquí todo lo que te escriban.',
    entrar: 'Entra con el correo de tu alta para ver aquí todo lo que te escriban.',
  },
  // Sin más contexto: vale para quien busca y para quien ofrece (antes solo
  // hablaba de «tu ficha profesional», también a los clientes).
  profesional: {
    crear: 'Con tu correo y una contraseña podrás entrar en tu cuenta desde cualquier móvil.',
    entrar: 'Entra con tu correo o tu móvil y tu contraseña.',
  },
  continuar: {
    crear: 'Crea tu acceso con correo y contraseña. Después volverás a donde estabas.',
    entrar: 'Entra con tu correo o tu móvil y tu contraseña para continuar donde estabas.',
  },
}

// La profesional entra, pero su ficha no tiene ese correo (dio un teléfono u
// otro correo). Perfil trae aquí con `sinFicha=1` al volver del correo de
// confirmación. En los dos casos la sesión se cierra: si quedara abierta,
// más tarde entraría sola como cliente.
const SIN_FICHA = 'Tu acceso está creado, pero tu ficha no tiene este correo: quizá diste un teléfono u otro correo al darte de alta. De momento, sigue contestando desde los enlaces que te llegan con cada mensaje.'

// ── ENTRAR / CREAR ACCESO / OLVIDÉ LA CONTRASEÑA ─────────────────────────
// Etapa 6 de docs/estudio-perfil.md: correo y contraseña, como casi todas
// las apps, y un enlace por correo solo si se olvida la contraseña.
// Tres modos en una pantalla porque son el mismo gesto: demostrar que eres tu.

export default function Entrar() {
  const navigate = useNavigate()
  const { user, login } = useUser()
  const [params] = useSearchParams()
  const [modo, setModo] = useState(params.get('modo') === 'crear' ? 'crear' : 'entrar')
  // El destino puede ser una publicación, un chat o una búsqueda.
  const volver = (params.get('volver') || '').startsWith('/') && !(params.get('volver') || '').startsWith('//') ? params.get('volver') : ''
  const rutaDestino = volver.split(/[?#]/)[0]
  // `pro=1`: viene de un mensaje que le llegó como profesional. Sin ficha con
  // ese correo NO se le deja dentro como cliente (vería una bandeja vacía).
  const esPro = params.get('pro') === '1'
  const contexto = esPro ? 'proMensajes'
    : volver.split('#')[1]?.startsWith('comentarios-') ? 'comentarios'
    : params.get('motivo') === 'avisos' && volver ? 'avisos'
    : rutaDestino === '/chats' || rutaDestino.startsWith('/chat/') ? 'mensajes'
    : !volver ? 'profesional' : 'continuar'
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState(params.get('sinFicha') === '1' ? SIN_FICHA : '')
  const [enviando, setEnviando] = useState(false)
  // Correo con falta en el dominio («gmial.com»): se sugiere el bueno. Si
  // lo vuelve a enviar igual, se respeta (puede que sea así de verdad).
  const [sugerencia, setSugerencia] = useState(null)
  const insistido = useRef('')

  const titulo = { entrar: 'Entrar', crear: 'Crea tu acceso', olvido: 'Restablecer contraseña' }[modo]
  // Entrar y recuperar aceptan el correo o el móvil de la cuenta (Sergio,
  // 2026-10-01): si cambias uno de los dos, sigues teniendo tu cuenta. Crear
  // el acceso es con correo; el móvil se añade y confirma después, por SMS.
  const esMovil = modo !== 'crear' && pareceTelefono(email)
  const listo = (email.includes('@') || esMovil) && (modo === 'olvido' || pass.length >= (modo === 'crear' ? MIN_CONTRASENA : 1))
  // Recuperar con el móvil: código por SMS y, con él, contraseña nueva.
  const [codigoMovil, setCodigoMovil] = useState(null)
  const [codigo, setCodigo] = useState('')
  const cambiar = m => { setModo(m); setError(''); setAviso(''); setCodigoMovil(null); setCodigo(''); setSmsDemo(''); setCodigoDemo(''); setNuevaDemo(false) }
  // Demostración: las cuentas con teléfono viven en este móvil
  // (utils/cuentaDemo.js) y el SMS se simula. Con correo, la cuenta de verdad.
  const demoMovil = DEMO_MODE && esMovil
  const [codigoDemo, setCodigoDemo] = useState('')
  const [smsDemo, setSmsDemo] = useState('')
  const [nuevaDemo, setNuevaDemo] = useState(false)
  // Crear cuenta en la demostración es con teléfono, en su pantalla.
  const irACrear = () => (DEMO_MODE ? navigate('/login') : cambiar('crear'))

  function dentroDemo(usuario) {
    login(usuario)
    showToast(`Has entrado en tu cuenta${usuario.name ? `, ${usuario.name.split(' ')[0]}` : ''}.`)
    navigate(volver || '/profile')
  }

  async function confirmarCodigo() {
    if (enviando || codigo.length < 6) return
    if (codigoDemo) {
      if (codigo !== codigoDemo) { setError('El código no es correcto. Míralo en el SMS que te hemos enviado.'); return }
      setSmsDemo(''); setNuevaDemo(true); setError(''); setPass('')
      return
    }
    setError(''); setEnviando(true)
    const r = await entrarConCodigo(codigoMovil, codigo)
    setEnviando(false)
    if (r.error) { setError(r.error); return }
    navigate('/restablecer')
  }

  async function enviar() {
    if (!listo || enviando) return
    setError(''); setAviso(''); setSugerencia(null)
    if (modo === 'crear') {
      const c = revisarContacto(email)
      if (!c.ok && !(c.sugerencia && insistido.current === email.trim())) {
        insistido.current = email.trim()
        if (c.sugerencia) setSugerencia(c.sugerencia)
        setError(c.sugerencia
          ? `¿Querías decir ${c.sugerencia}? Si no, vuelve a pulsar el botón y lo usaremos tal cual.`
          : 'Ese correo no parece completo. Escríbelo entero, así: nombre@gmail.com')
        return
      }
    }
    if (demoMovil && modo === 'olvido') {
      if (!existeCuentaDemo(email)) { setError('No hay ninguna cuenta con ese móvil. Puedes crearla.'); return }
      const c = codigoSms()
      setCodigoDemo(c); setCodigoMovil(telefonoInternacional(email)); setCodigo(''); setSmsDemo('')
      setTimeout(() => setSmsDemo(c), 1200)
      return
    }
    if (demoMovil && modo === 'entrar') {
      setEnviando(true)
      const r = await entrarDemo(email, pass)
      setEnviando(false)
      if (r.error) { setError(r.error); return }
      dentroDemo(r.usuario)
      return
    }
    if (modo === 'olvido' && esMovil) {
      setEnviando(true)
      const r = await pedirCodigoParaEntrar(email)
      setEnviando(false)
      if (r.error) { setError(r.error); return }
      setCodigoMovil(r.telefono); setCodigo('')
      return
    }
    setEnviando(true)
    const r = modo === 'entrar' ? await entrar(email, pass)
      : modo === 'crear' ? await crearCuenta(email, pass)
      : await pedirRestablecer(email)
    setEnviando(false)
    if (r.error) { setError(r.error); return }
    if (modo === 'olvido') { setAviso(`Si hay una cuenta con ${email.trim()}, te hemos enviado un correo con un enlace para poner una contraseña nueva.`); return }
    // Al volver del correo de confirmación (Perfil) se sabrá que era la profesional.
    if (modo === 'crear' && r.pendienteConfirmar && esPro) { try { localStorage.setItem('nura_acceso_pro', '1') } catch { /* sin almacenamiento */ } }
    if (modo === 'crear' && r.pendienteConfirmar) { setAviso(`Te hemos enviado un correo a ${email.trim()}. Pulsa el enlace para confirmarlo: volverás a Nüra ya dentro. Después, en tu perfil, añade tu móvil: así no pierdes la cuenta si un día cambias de correo.`); return }
    // ── DESDE UN MOVIL NUEVO (etapa 8) ────────────────────────────────
    // Si este movil no sabe quien es (no hay usuario guardado), se pide su
    // ficha al servidor y se reconstruye a la profesional con ella. Antes,
    // quien cambiaba de movil entraba… y el perfil seguia en blanco.
    if (!user) {
      setEnviando(true)
      const ses = await sesionActual()
      const f = ses ? await reclamarFicha(ses.access_token) : null
      // Si entró con el móvil, el correo es el de su cuenta.
      const correo = ses?.user?.email || email
      setEnviando(false)
      if (f?.ok && f.helper) {
        login(usuarioDeFicha(f.helper, correo))
      } else if (esPro && (f?.motivo === 'sin-ficha' || f?.motivo === 'varias')) {
        await salir()
        setAviso(SIN_FICHA)
        return
      } else if (volver || f?.motivo === 'sin-ficha' || f?.motivo === 'varias') {
        // Sin ficha de profesional es, sin más, alguien que busca ayuda
        // (Sergio, 2026-10-03: tras cambiar su correo, entraba y se quedaba
        // en esta pantalla con «no encontramos una ficha de profesional»).
        login(usuarioCliente(correo))
        showToast('Has entrado en tu cuenta.')
      } else {
        setAviso('Has entrado, pero ahora no podemos cargar tu cuenta. Revisa tu conexión y vuelve a pulsar «Entrar».')
        return
      }
    }
    navigate(volver || '/profile')
  }

  return (
    <div className={styles.page}>
      <PageHeader showBack />
      {codigoDemo && <SmsSimulado codigo={smsDemo} onUsar={c => { setCodigo(c); setError('') }} />}
      <main className={styles.card}>
        <div className={styles.icon} aria-hidden="true">{modo === 'olvido' ? <Mail size={24} /> : modo === 'crear' ? <UserRoundPlus size={24} /> : <KeyRound size={24} />}</div>
        <p className={styles.eyebrow}>Tu acceso a Nüra</p>
        <h1 className={styles.title}>{titulo}</h1>
        <p className={styles.description}>
          {modo === 'olvido' ? (nuevaDemo ? 'Código correcto. Escribe tu contraseña nueva: con ella entrarás a partir de ahora.' : codigoMovil
              ? `Escribe el código que te hemos enviado por SMS al ${telefonoLegible(codigoMovil)}. Después pondrás una contraseña nueva.`
              : 'Escribe tu correo o tu móvil. Al correo te llega un enlace; al móvil, un código por SMS. Con cualquiera de los dos pones una contraseña nueva.')
            : TEXTOS_ACCESO[contexto][modo]}
        </p>

        {nuevaDemo ? (
          <form onSubmit={async e => {
            e.preventDefault()
            if (pass.length < MIN_CONTRASENA || enviando) return
            setEnviando(true)
            const r = await nuevaContrasenaDemo(codigoMovil, pass)
            setEnviando(false)
            if (r.error) { setError(r.error); return }
            dentroDemo(r.usuario)
          }} noValidate>
            <div className={styles.field}>
              <label htmlFor="e-nueva" className={styles.label}>Contraseña nueva</label>
              <PasswordField id="e-nueva" value={pass} onChange={e => setPass(e.target.value)} autoComplete="new-password" aria-describedby="e-nueva-hint" />
              <p id="e-nueva-hint" className={styles.hint}>Al menos {MIN_CONTRASENA} caracteres.</p>
            </div>
            {error && <p role="alert" className={styles.error}>{error}</p>}
            <button type="submit" disabled={pass.length < MIN_CONTRASENA || enviando} className={styles.primary}>
              {enviando ? 'Un momento…' : 'Guardar y entrar'}
            </button>
          </form>
        ) : codigoMovil ? (
          <form onSubmit={e => { e.preventDefault(); confirmarCodigo() }} noValidate>
            <div className={styles.field}>
              <label htmlFor="e-codigo" className={styles.label}>Código del SMS</label>
              <input id="e-codigo" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigo}
                onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))} placeholder="123456" className={styles.input} autoFocus />
            </div>
            {error && <p role="alert" className={styles.error}>{error}</p>}
            <button type="submit" disabled={codigo.length < 6 || enviando} className={styles.primary}>
              {enviando ? 'Un momento…' : 'Confirmar el código'}
            </button>
            {codigoDemo && <p className={styles.hint}>Demostración: el SMS no sale de verdad, te aparece arriba. Tócalo para escribir el código.</p>}
            <button type="button" onClick={() => { setCodigoMovil(null); setCodigoDemo(''); setSmsDemo(''); setError('') }} className={styles.textButton} style={{ marginTop: 'var(--space-12)' }}>Cambiar el número o pedir otro código</button>
          </form>
        ) : (
        <form onSubmit={e => { e.preventDefault(); enviar() }} noValidate>
          <div className={styles.field}>
            <label htmlFor="e-email" className={styles.label}>{modo === 'crear' ? 'Correo electrónico' : DEMO_MODE ? 'Tu móvil (o tu correo)' : 'Correo o móvil'}</label>
            <input id="e-email" type={modo === 'crear' ? 'email' : 'text'} inputMode="email" autoComplete={modo === 'crear' ? 'email' : 'username'} autoCapitalize="none" spellCheck={false} value={email}
              onChange={e => setEmail(e.target.value)} placeholder={modo === 'crear' ? 'tucorreo@ejemplo.com' : DEMO_MODE ? '612 34 56 78' : 'tucorreo@ejemplo.com o 612 34 56 78'} className={styles.input} />
          </div>
          {modo !== 'olvido' && (
            <div className={styles.field}>
              <label htmlFor="e-pass" className={styles.label}>Contraseña</label>
              <PasswordField key={modo} id="e-pass" value={pass} onChange={e => setPass(e.target.value)}
                autoComplete={modo === 'crear' ? 'new-password' : 'current-password'}
                aria-describedby={modo === 'crear' ? 'e-pass-hint' : undefined} />
              {modo === 'crear' && <p id="e-pass-hint" className={styles.hint}>Al menos {MIN_CONTRASENA} caracteres.</p>}
            </div>
          )}
          {modo === 'entrar' && <button type="button" onClick={() => cambiar('olvido')} className={styles.textButton}>¿Has olvidado tu contraseña?</button>}
          {error && <p role="alert" className={styles.error}>{error}</p>}
          {sugerencia && <button type="button" className={styles.suggestion}
            onClick={() => { setEmail(sugerencia); setSugerencia(null); setError('') }}>Usar {sugerencia}</button>}
          {aviso && <p role="status" className={styles.notice}>{aviso}</p>}
          <button type="submit" disabled={!listo || enviando} className={styles.primary}>
            {enviando ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : modo === 'crear' ? 'Crear mi acceso' : esMovil ? 'Enviarme el código' : 'Enviarme el enlace'}
          </button>
        </form>
        )}
        <div className={styles.alternative}>
          {modo === 'entrar'
            ? <button type="button" onClick={irACrear} className={styles.secondary}>{DEMO_MODE ? '¿No tienes cuenta? Créala' : '¿Aún no tienes acceso? Créalo'}</button>
            : <button type="button" onClick={() => cambiar('entrar')} className={styles.secondary}>{modo === 'crear' ? '¿Ya tienes acceso? Entra' : 'Volver a entrar'}</button>}
        </div>
      </main>
    </div>
  )
}
