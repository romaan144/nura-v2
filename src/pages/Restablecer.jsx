import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import styles from './Siguiendo.module.css'
import { nuevaContrasena, sesionActual, escucharSesion, MIN_CONTRASENA } from '../utils/cuenta'

// ── RESTABLECER LA CONTRASEÑA ────────────────────────────────────────────
// Aqui aterriza el enlace del correo de "He olvidado mi contraseña". La
// libreria de Supabase lee la clave del enlace y abre una sesion de
// recuperacion; con ella se puede poner una contraseña nueva.
// Si alguien llega sin enlace (o el enlace caduco), se le dice y se le
// ofrece pedir otro — nunca un formulario que no puede funcionar.

export default function Restablecer() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState('comprobando')   // comprobando | listo | sinEnlace | hecho
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let vivo = true
    const quitar = escucharSesion((evento, sesion) => {
      if (!vivo) return
      if (evento === 'PASSWORD_RECOVERY' || sesion) setEstado(e => e === 'hecho' ? e : 'listo')
    })
    sesionActual().then(s => { if (vivo) setEstado(e => e !== 'comprobando' ? e : (s ? 'listo' : 'sinEnlace')) })
    return () => { vivo = false; quitar() }
  }, [])

  async function guardar() {
    if (pass.length < MIN_CONTRASENA || enviando) return
    setEnviando(true); setError('')
    const r = await nuevaContrasena(pass)
    setEnviando(false)
    if (r.error) { setError(r.error); return }
    setEstado('hecho')
  }

  const listo = pass.length >= MIN_CONTRASENA && !enviando
  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.content}>
        <h1 className={styles.title}>Contraseña nueva</h1>
        {estado === 'comprobando' && <p style={{ color: 'var(--ink-tertiary)', fontSize: 'var(--text-sm)' }}>Comprobando el enlace…</p>}
        {estado === 'sinEnlace' && (
          <>
            <p style={{ margin: '0 0 var(--space-16)', fontSize: 'var(--text-base)', color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
              Este enlace ya no sirve: puede que haya caducado o que ya se usara. Pide uno nuevo y ábrelo desde el correo.
            </p>
            <button onClick={() => navigate('/entrar')} style={{ width: '100%', minHeight: 48, border: 'none', borderRadius: 'var(--radius-full)',
              background: 'var(--purple)', color: 'white', fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer' }}>
              Pedir un enlace nuevo
            </button>
          </>
        )}
        {estado === 'listo' && (
          <form onSubmit={e => { e.preventDefault(); guardar() }} noValidate>
            <label htmlFor="r-pass" style={{ display: 'block', margin: 'var(--space-8) 0 var(--space-6)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink-primary)' }}>
              Tu contraseña nueva
            </label>
            <input id="r-pass" type="password" autoComplete="new-password" value={pass} onChange={e => setPass(e.target.value)}
              placeholder={`Al menos ${MIN_CONTRASENA} caracteres`}
              style={{ width: '100%', boxSizing: 'border-box', padding: 'var(--space-12) var(--space-14)', border: '1px solid var(--ink-border)',
                borderRadius: 'var(--radius-card)', fontSize: 'var(--text-base)', fontFamily: 'inherit', background: 'white', outline: 'none' }} />
            {error && <p role="alert" style={{ margin: 'var(--space-10) 0 0', fontSize: 'var(--text-sm)', color: 'var(--red-ink)' }}>{error}</p>}
            <button type="submit" disabled={!listo} style={{ width: '100%', minHeight: 48, marginTop: 'var(--space-16)', border: 'none',
              borderRadius: 'var(--radius-full)', fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 700,
              cursor: listo ? 'pointer' : 'default', background: listo ? 'var(--purple)' : 'rgba(33,29,51,0.08)',
              color: listo ? 'white' : 'var(--ink-tertiary)' }}>
              {enviando ? 'Un momento…' : 'Guardar la contraseña'}
            </button>
          </form>
        )}
        {estado === 'hecho' && (
          <>
            <p role="status" style={{ margin: '0 0 var(--space-16)', fontSize: 'var(--text-base)', color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
              Listo. Ya puedes entrar con tu contraseña nueva.
            </p>
            <button onClick={() => navigate('/profile')} style={{ width: '100%', minHeight: 48, border: 'none', borderRadius: 'var(--radius-full)',
              background: 'var(--purple)', color: 'white', fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer' }}>
              Ir a mi perfil
            </button>
          </>
        )}
      </div>
    </div>
  )
}
