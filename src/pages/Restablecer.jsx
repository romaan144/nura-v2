import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import styles from './Access.module.css'
import PasswordField from '../components/PasswordField'
import { KeyRound, Check, Link2Off } from 'lucide-react'
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
      <main className={styles.card}>
        <div className={`${styles.icon} ${estado === 'hecho' ? styles.successIcon : ''}`} aria-hidden="true">
          {estado === 'hecho' ? <Check size={26} /> : estado === 'sinEnlace' ? <Link2Off size={24} /> : <KeyRound size={24} />}
        </div>
        <p className={styles.eyebrow}>Recuperar tu acceso</p>
        <h1 className={styles.title}>Contraseña nueva</h1>
        {estado === 'comprobando' && <p role="status" className={styles.description}>Comprobando el enlace…</p>}
        {estado === 'sinEnlace' && <>
          <p className={styles.description}>Este enlace ya no sirve: puede que haya caducado o que ya se usara. Pide uno nuevo y ábrelo desde el correo.</p>
          <button type="button" onClick={() => navigate('/entrar')} className={styles.primary}>Pedir un enlace nuevo</button>
        </>}
        {estado === 'listo' && <>
          <p className={styles.description}>Elige una contraseña para volver a entrar en tu cuenta.</p>
          <form onSubmit={e => { e.preventDefault(); guardar() }} noValidate>
            <div className={styles.field}>
              <label htmlFor="r-pass" className={styles.label}>Tu contraseña nueva</label>
              <PasswordField id="r-pass" autoComplete="new-password" value={pass} onChange={e => setPass(e.target.value)} aria-describedby="r-pass-hint" />
              <p id="r-pass-hint" className={styles.hint}>Al menos {MIN_CONTRASENA} caracteres.</p>
            </div>
            {error && <p role="alert" className={styles.error}>{error}</p>}
            <button type="submit" disabled={!listo} className={styles.primary}>{enviando ? 'Un momento…' : 'Guardar la contraseña'}</button>
          </form>
        </>}
        {estado === 'hecho' && <>
          <p role="status" className={styles.notice}>Listo. Ya puedes entrar con tu contraseña nueva.</p>
          <button type="button" onClick={() => navigate('/profile')} className={styles.primary}>Ir a mi perfil</button>
        </>}
      </main>
    </div>
  )
}
