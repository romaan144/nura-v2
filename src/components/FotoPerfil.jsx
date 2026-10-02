import glass from './ui/glass'
import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'

// ── LA FOTO DE PERFIL (etapa 7 de docs/estudio-perfil.md) ────────────────
//
// La app le decia al profesional "los perfiles con foto reciben mas
// mensajes" y no habia forma de subir una. Para el profesional es la pieza
// de confianza mas importante de su ficha.
//
// Solo con la ficha VINCULADA (etapa 6): sin saber quien es, cualquiera
// podria cambiar la foto de cualquiera. La foto va a `fotos/<su cuenta>/`,
// y el almacenamiento solo le deja escribir en esa carpeta.
//
// Cada foto se sube con su propio nombre (perfil-<hora>.jpg) y el servidor
// borra las anteriores: el almacén no deja «ver» la carpeta desde el
// navegador, y sin eso no se puede sobrescribir una foto. «Quitar foto»
// deja la ficha sin foto y borra las de su carpeta (2026-10-01).
//
// Se recorta en cuadrado y se reduce EN EL MOVIL antes de subir: 480x480 en
// JPEG, unos 50 kB. Una foto de camara pesa 3-5 MB; con mala cobertura no
// subiria nunca, y la ficha la descargaria cada persona que la mire.

const LADO = 480

function recortar(archivo) {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(archivo)
    const img = new Image()
    img.onload = () => {
      const lado = Math.min(img.naturalWidth, img.naturalHeight)
      const x = (img.naturalWidth - lado) / 2, y = (img.naturalHeight - lado) / 2
      const c = document.createElement('canvas'); c.width = LADO; c.height = LADO
      c.getContext('2d').drawImage(img, x, y, lado, lado, 0, 0, LADO, LADO)
      URL.revokeObjectURL(url)
      c.toBlob(b => b ? ok(b) : mal(new Error('sin imagen')), 'image/jpeg', 0.85)
    }
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('no es una imagen')) }
    img.src = url
  })
}

// `local` (solo en la demo, sin acceso creado): la foto se guarda en este
// móvil, como el resto de cambios de la ficha de demostración. Así se puede
// probar lo que recomienda la portada («una foto ayuda a que te escriban»).
export default function FotoPerfil({ actual, helperId, onCambio, local = false }) {
  const entrada = useRef(null)
  const [previa, setPrevia] = useState(null)   // { blob, url }
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [quitando, setQuitando] = useState(false)   // pidiendo confirmación

  async function elegida(e) {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    setError('')
    try { const blob = await recortar(f); setPrevia({ blob, url: URL.createObjectURL(blob) }) }
    catch { setError('No hemos podido abrir esa imagen. Prueba con otra foto.') }
  }

  async function usar() {
    if (!previa || subiendo) return
    setSubiendo(true); setError('')
    if (local) {
      const lector = new FileReader()
      lector.onload = () => { onCambio(lector.result); URL.revokeObjectURL(previa.url); setPrevia(null); setSubiendo(false) }
      lector.onerror = () => { setError('No hemos podido guardar esa foto. Prueba con otra.'); setSubiendo(false) }
      lector.readAsDataURL(previa.blob)
      return
    }
    try {
      const { cuentas } = await import('../utils/cuenta')
      const { data: { session } } = await cuentas.auth.getSession()
      if (!session) throw new Error('sin sesion')
      const ruta = `${session.user.id}/perfil-${Date.now()}.jpg`
      const sub = await cuentas.storage.from('fotos').upload(ruta, previa.blob, { contentType: 'image/jpeg' })
      if (sub.error) throw sub.error
      // ?v= para que nadie siga viendo la foto anterior guardada en cache.
      const url = cuentas.storage.from('fotos').getPublicUrl(ruta).data.publicUrl + '?v=' + Date.now()
      const { data, error } = await cuentas.from('helpers').update({ avatarUrl: url }).eq('id', helperId).select('id')
      if (error || !data?.length) throw error || new Error('ninguna fila')
      URL.revokeObjectURL(previa.url); setPrevia(null)
      onCambio(url)
      // Las anteriores sobran. Si falla, se reintenta en el próximo cambio.
      const { limpiarFotos } = await import('../utils/escrituras')
      limpiarFotos(session.access_token, ruta)
    } catch {
      setError('No se ha podido subir la foto. Revisa tu conexión y vuelve a probar.')
    } finally { setSubiendo(false) }
  }

  async function quitar() {
    if (subiendo) return
    if (local) { setQuitando(false); onCambio(null); return }
    setSubiendo(true); setError('')
    try {
      const { cuentas } = await import('../utils/cuenta')
      const { data: { session } } = await cuentas.auth.getSession()
      if (!session) throw new Error('sin sesion')
      const { data, error } = await cuentas.from('helpers').update({ avatarUrl: null }).eq('id', helperId).select('id')
      if (error || !data?.length) throw error || new Error('ninguna fila')
      setQuitando(false)
      onCambio(null)
      const { limpiarFotos } = await import('../utils/escrituras')
      limpiarFotos(session.access_token, '')
    } catch {
      setError('No se ha podido quitar la foto. Revisa tu conexión y vuelve a probar.')
    } finally { setSubiendo(false) }
  }

  const circulo = { width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
    background: 'var(--purple-05)', border: '2px solid white', boxShadow: 'var(--alzado-reposo)' }
  const boton = (fondo, color, borde) => ({ minHeight: 44, padding: '0 var(--space-16)', borderRadius: 'var(--radius-full)',
    border: borde || 'none', background: fondo, color, cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 'var(--text-sm)', fontWeight: 700 })

  return (
    <div style={{ padding: 'var(--space-16)', background: 'var(--glass-panel)', borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--glass-panel-shadow)', border: '1px solid var(--glass-edge)', marginBottom: 'var(--space-12)' }}>
      <input ref={entrada} type="file" accept="image/*" onChange={elegida} style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-14)' }}>
        {previa || actual
          ? <img src={previa ? previa.url : actual} alt={previa ? 'Así se verá tu foto' : 'Tu foto'} style={circulo} />
          : <div style={{ ...circulo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={26} color="var(--purple-ink)" /></div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--ink-primary)' }}>
            {previa ? 'Así se verá en tu ficha' : quitando ? '¿Quitar tu foto?' : actual ? 'Tu foto' : 'Añade tu foto'}
          </p>
          <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', lineHeight: 1.45 }}>
            {previa ? 'Se recorta en cuadrado.' : quitando ? 'Tu ficha se quedará sin foto y la borraremos.' : actual ? 'Es lo primero que ven de ti.' : 'Los perfiles con foto reciben más mensajes.'}
          </p>
        </div>
      </div>
      {error && <p role="alert" style={{ margin: 'var(--space-10) 0 0', fontSize: 'var(--text-sm)', color: 'var(--red-ink)', lineHeight: 1.45 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-12)' }}>
        {previa ? (<>
          <button className="nura-glass-action" onClick={() => entrada.current?.click()} disabled={subiendo}
            style={{ ...boton('none', 'var(--ink-secondary)', '1px solid var(--ink-border)'),
              flex: 1,
              ...(glass.control) }}>Elegir otra</button>
          <button className="nura-glass-action" onClick={usar} disabled={subiendo} style={{ ...boton('var(--purple)', 'white'),
              flex: 2,
              ...(glass.primary) }}>
            {subiendo ? 'Subiendo…' : 'Usar esta foto'}</button>
        </>) : quitando ? (<>
          <button className="nura-glass-action" onClick={() => setQuitando(false)} disabled={subiendo}
            style={{ ...boton('none', 'var(--ink-secondary)', '1px solid var(--ink-border)'), flex: 1, ...(glass.control) }}>Mantenerla</button>
          <button className="nura-glass-action" onClick={quitar} disabled={subiendo}
            style={{ ...boton('none', 'var(--red-ink)', '1px solid var(--ink-border)'), flex: 1, ...(glass.control) }}>
            {subiendo ? 'Quitando…' : 'Sí, quitarla'}</button>
        </>) : (<>
          <button className="nura-glass-action" onClick={() => entrada.current?.click()}
            style={{ ...boton('white', 'var(--purple-ink)', '1px solid var(--ink-border)'),
              flex: 2,
              ...(glass.control) }}>
            {actual ? 'Cambiar foto' : 'Elegir una foto'}</button>
          {actual && (
            <button className="nura-glass-action" onClick={() => { setError(''); setQuitando(true) }}
              style={{ ...boton('none', 'var(--ink-secondary)', '1px solid var(--ink-border)'), flex: 1, ...(glass.control) }}>
              Quitar</button>
          )}
        </>)}
      </div>
    </div>
  )
}
