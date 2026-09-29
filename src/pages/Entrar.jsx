import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import styles from './Access.module.css'
import PasswordField from '../components/PasswordField'
import { KeyRound, Mail, UserRoundPlus } from 'lucide-react'
import { crearCuenta, entrar, pedirRestablecer, sesionActual, MIN_CONTRASENA } from '../utils/cuenta'
import { reclamarFicha } from '../utils/escrituras'
import { useUser } from '../context/UserContext'
import { revisarContacto } from '../utils/contactoProfesional'

// El motivo solo cambia el texto: no los permisos ni el destino del acceso.
const TEXTOS_ACCESO = {
  comentarios: {
    crear: 'Crea tu acceso con correo para comentar esta publicación. Después volverás al mismo hilo.',
    entrar: 'Entra con tu correo y contraseña para volver a la publicación y comentar.',
  },
  avisos: {
    crear: 'Crea tu acceso con correo. Después vuelve a tu búsqueda y activa el aviso por correo.',
    entrar: 'Entra con tu correo y contraseña. Después podrás volver a tu búsqueda y activar el aviso.',
  },
  mensajes: {
    crear: 'Crea tu acceso con correo para continuar con tus mensajes en Nüra.',
    entrar: 'Entra con tu correo y contraseña para continuar con tus mensajes.',
  },
  profesional: {
    crear: 'Con tu correo y una contraseña podrás cambiar tu ficha desde cualquier móvil.',
    entrar: 'Entra con el correo de tu cuenta para gestionar tu ficha profesional.',
  },
  continuar: {
    crear: 'Crea tu acceso con correo y contraseña. Después volverás a donde estabas.',
    entrar: 'Entra con tu correo y contraseña para continuar donde estabas.',
  },
}

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
  const contexto = volver.split('#')[1]?.startsWith('comentarios-') ? 'comentarios'
    : params.get('motivo') === 'avisos' && volver ? 'avisos'
    : rutaDestino === '/chats' || rutaDestino.startsWith('/chat/') ? 'mensajes'
    : !volver ? 'profesional' : 'continuar'
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  // Correo con falta en el dominio («gmial.com»): se sugiere el bueno. Si
  // lo vuelve a enviar igual, se respeta (puede que sea así de verdad).
  const [sugerencia, setSugerencia] = useState(null)
  const insistido = useRef('')

  const titulo = { entrar: 'Entrar', crear: 'Crea tu acceso', olvido: 'Restablecer contraseña' }[modo]
  const listo = email.includes('@') && (modo === 'olvido' || pass.length >= (modo === 'crear' ? MIN_CONTRASENA : 1))
  const cambiar = m => { setModo(m); setError(''); setAviso('') }

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
    setEnviando(true)
    const r = modo === 'entrar' ? await entrar(email, pass)
      : modo === 'crear' ? await crearCuenta(email, pass)
      : await pedirRestablecer(email)
    setEnviando(false)
    if (r.error) { setError(r.error); return }
    if (modo === 'olvido') { setAviso(`Si hay una cuenta con ${email.trim()}, te hemos enviado un correo con un enlace para poner una contraseña nueva.`); return }
    if (modo === 'crear' && r.pendienteConfirmar) { setAviso(`Te hemos enviado un correo a ${email.trim()}. Pulsa el enlace para confirmarlo y ya podrás entrar.`); return }
    // ── DESDE UN MOVIL NUEVO (etapa 8) ────────────────────────────────
    // Si este movil no sabe quien es (no hay usuario guardado), se pide su
    // ficha al servidor y se reconstruye a la profesional con ella. Antes,
    // quien cambiaba de movil entraba… y el perfil seguia en blanco.
    if (!user) {
      setEnviando(true)
      const ses = await sesionActual()
      const f = ses ? await reclamarFicha(ses.access_token) : null
      setEnviando(false)
      if (f?.ok && f.helper) {
        const h = f.helper
        login({ name: h.name || email.split('@')[0], isHelper: true, helperId: h.id, joined: new Date().toISOString(),
          helperProfile: { specialty: h.specialty || '', zone: h.zone || '', price: h.price || '', contacto: h.contacto || '',
            formation: h.bio || '', modality: h.online ? 'Las dos' : 'Presencial' } })
      } else if (volver) {
        login({ name: email.trim().split('@')[0], isHelper: false, joined: new Date().toISOString() })
      } else {
        setAviso('Has entrado, pero no encontramos una ficha de profesional con este correo. Si te diste de alta con otro contacto, escríbenos.')
        return
      }
    }
    navigate(volver || '/profile')
  }

  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <main className={styles.card}>
        <div className={styles.icon} aria-hidden="true">{modo === 'olvido' ? <Mail size={24} /> : modo === 'crear' ? <UserRoundPlus size={24} /> : <KeyRound size={24} />}</div>
        <p className={styles.eyebrow}>Tu acceso a Nüra</p>
        <h1 className={styles.title}>{titulo}</h1>
        <p className={styles.description}>
          {modo === 'olvido' ? 'Escribe tu correo y te enviaremos un enlace para poner una contraseña nueva.'
            : TEXTOS_ACCESO[contexto][modo]}
        </p>

        <form onSubmit={e => { e.preventDefault(); enviar() }} noValidate>
          <div className={styles.field}>
            <label htmlFor="e-email" className={styles.label}>Correo electrónico</label>
            <input id="e-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email}
              onChange={e => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" className={styles.input} />
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
            {enviando ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : modo === 'crear' ? 'Crear mi acceso' : 'Enviarme el enlace'}
          </button>
        </form>
        <div className={styles.alternative}>
          {modo === 'entrar'
            ? <button type="button" onClick={() => cambiar('crear')} className={styles.secondary}>¿Aún no tienes acceso? Créalo</button>
            : <button type="button" onClick={() => cambiar('entrar')} className={styles.secondary}>{modo === 'crear' ? '¿Ya tienes acceso? Entra' : 'Volver a entrar'}</button>}
        </div>
      </main>
    </div>
  )
}
