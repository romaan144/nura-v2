import { useState, useEffect } from 'react'
import { Mail, Phone } from 'lucide-react'
import { Button } from './ui'
import styles from '../pages/Profile.module.css'
import { telefonoLegible } from '../utils/telefono'

// ── TU ACCESO: CORREO Y MÓVIL, LOS DOS CONFIRMADOS (Sergio, 2026-10-01) ──
// Cada cuenta tiene correo y móvil para no perderla si cambia uno de los
// dos. Ningún cambio se aplica hasta confirmarlo: el correo nuevo con el
// enlace que le llega, el móvil nuevo con el código del SMS. Así nadie puede
// poner el correo o el número de otra persona.
// La librería de cuentas (211 kB) se carga solo al pulsar: el perfil no la
// necesita para enseñar los datos, que lee de la sesión guardada.

const cuenta = () => import('../utils/cuenta')

function leerSesion() {
  try { return JSON.parse(localStorage.getItem('nura_sesion') || 'null')?.user || null } catch { return null }
}

const campo = { display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', padding: '0 var(--space-16) var(--space-16)' }
const entrada = { width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '0 var(--space-14)', borderRadius: 'var(--radius-sm)',
  border: '1.5px solid var(--purple)', fontSize: 'var(--text-input, 16px)', fontFamily: 'inherit', background: 'white', outline: 'none' }
const aviso = { margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.45, color: 'var(--ink-secondary)' }
const fallo = { ...aviso, color: 'var(--red, #B42318)' }
const accion = { minHeight: 44, padding: '0 var(--space-12)', border: 'none', background: 'none', color: 'var(--purple-ink)',
  fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }

export default function AccesoCuenta({ detalleCorreo }) {
  const [usuario, setUsuario] = useState(leerSesion)
  // Qué se está editando: null | 'correo' | 'movil' | 'codigo'
  const [editando, setEditando] = useState(null)
  const [texto, setTexto] = useState('')
  const [codigo, setCodigo] = useState('')
  const [movilPedido, setMovilPedido] = useState('')
  const [correoPedido, setCorreoPedido] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [hecho, setHecho] = useState('')

  // Lo que sabe el servidor (p. ej. un cambio de correo a medias), al entrar.
  useEffect(() => { cuenta().then(c => c.usuarioActual()).then(u => { if (u) setUsuario(u) }).catch(() => {}) }, [])
  let paso = ''
  try { paso = sessionStorage.getItem('nura_cambio_correo') || '' } catch { /* nada */ }

  if (!usuario?.email) return null
  const movil = usuario.phone && usuario.phone_confirmed_at ? usuario.phone : ''

  const abrir = (que, valor = '') => { setEditando(que); setTexto(valor); setCodigo(''); setError(''); setHecho('') }
  const cerrar = () => { setEditando(null); setError('') }
  const refrescar = async () => { const c = await cuenta(); const u = await c.usuarioActual(); if (u) setUsuario(u) }

  async function enviarCorreo() {
    const nuevo = texto.trim().toLowerCase()
    if (!nuevo.includes('@')) { setError('Escribe el correo entero, así: nombre@gmail.com'); return }
    if (nuevo === String(usuario.email).toLowerCase()) { setError('Ese ya es tu correo.'); return }
    setOcupado(true); setError('')
    const r = await (await cuenta()).cambiarCorreo(nuevo)
    setOcupado(false)
    if (r.error) { setError(r.error); return }
    setCorreoPedido(nuevo); setEditando(null)
  }

  async function enviarMovil() {
    setOcupado(true); setError('')
    const r = await (await cuenta()).pedirCodigoTelefono(texto)
    setOcupado(false)
    if (r.error) { setError(r.error); return }
    setMovilPedido(r.telefono); setEditando('codigo'); setCodigo('')
  }

  async function confirmarMovil() {
    setOcupado(true); setError('')
    const r = await (await cuenta()).confirmarCodigoTelefono(movilPedido, codigo)
    setOcupado(false)
    if (r.error) { setError(r.error); return }
    if (r.usuario) setUsuario(r.usuario); else await refrescar()
    setEditando(null); setHecho('Móvil confirmado. Ya puedes entrar también con él.')
  }

  return (
    <div className={styles.lista}>
      {/* ── Correo ── */}
      <div className={styles.fila} style={{ cursor: 'default' }}>
        <span className={styles.filaIcono} aria-hidden="true"><Mail size={17} /></span>
        <span className={styles.filaTexto}>
          <span className={styles.filaTitulo} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario.email}</span>
          <span role="status" className={styles.filaDetalle} style={{ whiteSpace: 'normal' }}>
            {/* Dos enlaces, uno a cada correo: hasta pulsar los dos se sigue
                entrando con el de siempre (Sergio, 2026-10-03). */}
            {correoPedido || usuario.new_email
              ? (paso === 'medio'
                ? `Falta un paso: pulsa también el enlace del otro correo. Hasta entonces sigues entrando con ${usuario.email}.`
                : `Te hemos enviado dos enlaces: uno a ${correoPedido || usuario.new_email} y otro a ${usuario.email}. Pulsa los dos; hasta entonces sigues entrando con ${usuario.email}.`)
              : paso === 'hecho' ? 'Correo cambiado. Ya entras con este.'
              : detalleCorreo || 'Con él entras y recuperas tu contraseña.'}
          </span>
        </span>
        {editando !== 'correo' && <button type="button" style={accion} onClick={() => abrir('correo')}>Cambiar</button>}
      </div>
      {editando === 'correo' && (
        <form style={campo} onSubmit={e => { e.preventDefault(); enviarCorreo() }} noValidate>
          <label htmlFor="acceso-correo" style={aviso}>Tu correo nuevo. Te enviaremos un enlace a este correo y otro al de ahora: el cambio se hace al pulsar los dos.</label>
          <input id="acceso-correo" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
            value={texto} onChange={e => setTexto(e.target.value)} placeholder="tucorreo@ejemplo.com" style={entrada} autoFocus />
          {error && <p role="alert" style={fallo}>{error}</p>}
          <Button type="submit" variant="primary" full disabled={ocupado || !texto.trim()}>{ocupado ? 'Un momento…' : 'Enviarme el enlace'}</Button>
          <Button type="button" variant="secondary" full onClick={cerrar}>Cancelar</Button>
        </form>
      )}

      {/* ── Móvil ── */}
      <div className={styles.fila} style={{ cursor: 'default' }}>
        <span className={styles.filaIcono} aria-hidden="true"><Phone size={17} /></span>
        <span className={styles.filaTexto}>
          <span className={styles.filaTitulo}>{movil ? telefonoLegible(movil) : 'Añade tu móvil'}</span>
          <span role="status" className={styles.filaDetalle} style={{ whiteSpace: 'normal' }}>
            {hecho || (movil
              ? 'Confirmado por SMS. También puedes entrar con él.'
              : 'Si un día pierdes tu correo, con tu móvil sigues teniendo tu cuenta.')}
          </span>
        </span>
        {editando !== 'movil' && editando !== 'codigo' &&
          <button type="button" style={accion} onClick={() => abrir('movil')}>{movil ? 'Cambiar' : 'Añadir'}</button>}
      </div>
      {editando === 'movil' && (
        <form style={campo} onSubmit={e => { e.preventDefault(); enviarMovil() }} noValidate>
          <label htmlFor="acceso-movil" style={aviso}>Tu móvil. Te enviaremos un código por SMS para confirmar que es tuyo.</label>
          <input id="acceso-movil" type="tel" inputMode="tel" autoComplete="tel" value={texto}
            onChange={e => setTexto(e.target.value)} placeholder="612 34 56 78" style={entrada} autoFocus />
          {error && <p role="alert" style={fallo}>{error}</p>}
          <Button type="submit" variant="primary" full disabled={ocupado || !texto.trim()}>{ocupado ? 'Un momento…' : 'Enviarme el código'}</Button>
          <Button type="button" variant="secondary" full onClick={cerrar}>Cancelar</Button>
        </form>
      )}
      {editando === 'codigo' && (
        <form style={campo} onSubmit={e => { e.preventDefault(); confirmarMovil() }} noValidate>
          <label htmlFor="acceso-codigo" style={aviso}>Escribe el código que te hemos enviado por SMS al {telefonoLegible(movilPedido)}.</label>
          <input id="acceso-codigo" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigo}
            onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))} placeholder="123456" style={{ ...entrada, letterSpacing: 4, textAlign: 'center' }} autoFocus />
          {error && <p role="alert" style={fallo}>{error}</p>}
          <Button type="submit" variant="primary" full disabled={ocupado || codigo.length < 6}>{ocupado ? 'Un momento…' : 'Confirmar mi móvil'}</Button>
          <Button type="button" variant="secondary" full onClick={() => abrir('movil', movilPedido)}>Cambiar el número o pedir otro código</Button>
        </form>
      )}
    </div>
  )
}
