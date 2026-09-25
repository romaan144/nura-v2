import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import styles from './Siguiendo.module.css'
import { crearCuenta, entrar, pedirRestablecer, sesionActual, MIN_CONTRASENA } from '../utils/cuenta'
import { reclamarFicha } from '../utils/escrituras'
import { useUser } from '../context/UserContext'
import { revisarContacto } from '../utils/contactoProfesional'

// ── ENTRAR / CREAR ACCESO / OLVIDÉ LA CONTRASEÑA ─────────────────────────
// Etapa 6 de docs/estudio-perfil.md: correo y contraseña, como casi todas
// las apps, y un enlace por correo solo si se olvida la contraseña.
// Tres modos en una pantalla porque son el mismo gesto: demostrar que eres tu.

const campo = {
  width: '100%', boxSizing: 'border-box', padding: 'var(--space-12) var(--space-14)',
  border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-card)', fontSize: 'var(--text-base)',
  fontFamily: 'inherit', color: 'var(--ink-primary)', background: 'white', outline: 'none',
}
const etiqueta = { display: 'block', margin: '0 0 var(--space-6)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink-primary)' }
const enlace = { background: 'none', border: 'none', padding: 'var(--space-8) 0', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--purple-ink)' }

export default function Entrar() {
  const navigate = useNavigate()
  const { user, login } = useUser()
  const [params] = useSearchParams()
  const [modo, setModo] = useState(params.get('modo') === 'crear' ? 'crear' : 'entrar')
  // Quien llega desde «te aviso si aparece alguien» busca, no ofrece: su
  // cuenta es para recibir el aviso por correo, no para una ficha.
  const volver = (params.get('volver') || '').startsWith('/') && !(params.get('volver') || '').startsWith('//') ? params.get('volver') : ''
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
      <div className={styles.content}>
        <h1 className={styles.title}>{titulo}</h1>
        <p style={{ margin: '0 0 var(--space-20)', fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', lineHeight: 1.5 }}>
          {modo === 'crear' && volver ? 'Con tu correo te aviso cuando llegue alguien que buscas. Solo lo usamos para eso y para entrar.'
            : modo === 'crear' ? 'Con tu correo y una contraseña podrás cambiar tu ficha desde cualquier móvil.'
            : modo === 'olvido' ? 'Escribe tu correo y te enviaremos un enlace para poner una contraseña nueva.'
            : 'Con el correo y la contraseña de tu acceso.'}
        </p>

        <form onSubmit={e => { e.preventDefault(); enviar() }} noValidate>
          <div style={{ marginBottom: 'var(--space-14)' }}>
            <label htmlFor="e-email" style={etiqueta}>Correo</label>
            <input id="e-email" type="email" inputMode="email" autoComplete="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" style={campo} />
          </div>
          {modo !== 'olvido' && (
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <label htmlFor="e-pass" style={etiqueta}>Contraseña</label>
              <input id="e-pass" type="password" value={pass} onChange={e => setPass(e.target.value)}
                autoComplete={modo === 'crear' ? 'new-password' : 'current-password'}
                placeholder={modo === 'crear' ? `Al menos ${MIN_CONTRASENA} caracteres` : ''} style={campo} />
            </div>
          )}
          {modo === 'entrar' && (
            <button type="button" onClick={() => cambiar('olvido')} style={enlace}>¿Has olvidado tu contraseña?</button>
          )}

          {error && <p role="alert" style={{ margin: 'var(--space-10) 0 0', fontSize: 'var(--text-sm)', color: 'var(--red-ink)', lineHeight: 1.45 }}>{error}</p>}
          {sugerencia && (
            <button type="button" onClick={() => { setEmail(sugerencia); setSugerencia(null); setError('') }}
              style={{ marginTop: 'var(--space-8)', padding: 'var(--space-8) var(--space-14)', minHeight: 40, background: 'var(--purple-10, #F1ECFF)',
                color: 'var(--purple-ink)', border: 'none', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer' }}>
              Usar {sugerencia}
            </button>
          )}
          {aviso && <p role="status" style={{ margin: 'var(--space-10) 0 0', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', lineHeight: 1.5 }}>{aviso}</p>}

          <button type="submit" disabled={!listo || enviando}
            style={{ width: '100%', minHeight: 48, marginTop: 'var(--space-16)', border: 'none', borderRadius: 'var(--radius-full)',
              cursor: listo && !enviando ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 700,
              background: listo && !enviando ? 'var(--purple)' : 'rgba(33,29,51,0.08)',
              color: listo && !enviando ? 'white' : 'var(--ink-tertiary)' }}>
            {enviando ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : modo === 'crear' ? 'Crear mi acceso' : 'Enviarme el enlace'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--space-16)', textAlign: 'center' }}>
          {modo === 'entrar'
            ? <button onClick={() => cambiar('crear')} style={enlace}>¿Aún no tienes acceso? Créalo</button>
            : <button onClick={() => cambiar('entrar')} style={enlace}>{modo === 'crear' ? '¿Ya tienes acceso? Entra' : 'Volver a entrar'}</button>}
        </div>
      </div>
    </div>
  )
}
