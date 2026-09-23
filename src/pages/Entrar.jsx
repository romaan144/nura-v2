import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import styles from './Siguiendo.module.css'
import { crearCuenta, entrar, pedirRestablecer, MIN_CONTRASENA } from '../utils/cuenta'

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
  const [params] = useSearchParams()
  const [modo, setModo] = useState(params.get('modo') === 'crear' ? 'crear' : 'entrar')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)

  const titulo = { entrar: 'Entrar', crear: 'Crea tu acceso', olvido: 'Restablecer contraseña' }[modo]
  const listo = email.includes('@') && (modo === 'olvido' || pass.length >= (modo === 'crear' ? MIN_CONTRASENA : 1))
  const cambiar = m => { setModo(m); setError(''); setAviso('') }

  async function enviar() {
    if (!listo || enviando) return
    setEnviando(true); setError(''); setAviso('')
    const r = modo === 'entrar' ? await entrar(email, pass)
      : modo === 'crear' ? await crearCuenta(email, pass)
      : await pedirRestablecer(email)
    setEnviando(false)
    if (r.error) { setError(r.error); return }
    if (modo === 'olvido') { setAviso(`Si hay una cuenta con ${email.trim()}, te hemos enviado un correo con un enlace para poner una contraseña nueva.`); return }
    if (modo === 'crear' && r.pendienteConfirmar) { setAviso(`Te hemos enviado un correo a ${email.trim()}. Pulsa el enlace para confirmarlo y ya podrás entrar.`); return }
    navigate('/profile')
  }

  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.content}>
        <h1 className={styles.title}>{titulo}</h1>
        <p style={{ margin: '0 0 var(--space-20)', fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', lineHeight: 1.5 }}>
          {modo === 'crear' ? 'Con tu correo y una contraseña podrás cambiar tu ficha desde cualquier móvil.'
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
