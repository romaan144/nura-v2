import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, Bell, Mail, Check, MapPin } from 'lucide-react'
import styles from './AlertaSheet.module.css'
import { crearAlerta, suscribirMovil, movilPuedeAvisar, esIphoneSinInstalar } from '../utils/alertas'

// «TE AVISO SI APARECE ALGUIEN» — el SI de la persona (docs/perfil-vivo.md
// §10). Dice exactamente que se guarda antes de guardarlo, y nada se guarda
// hasta que pulsa «Sí, avísame».

function correoDeLaCuenta() {
  try { return JSON.parse(localStorage.getItem('nura_sesion') || 'null')?.user?.email || '' }
  catch { return '' }
}

export default function AlertaSheet({ categoria, que, zona, onClose, onHecho }) {
  const navigate = useNavigate()
  const correo = correoDeLaCuenta()
  const puedeMovil = movilPuedeAvisar() && !esIphoneSinInstalar()
  const [movil, setMovil] = useState(puedeMovil)
  const [porCorreo, setPorCorreo] = useState(Boolean(correo))
  const [guardando, setGuardando] = useState(false)
  // Si buscaba en un barrio, por defecto solo avisa de quien trabaja cerca.
  const [soloCerca, setSoloCerca] = useState(Boolean(zona?.nombre))

  async function confirmar() {
    if (guardando) return
    setGuardando(true)
    let suscripcion = null, motivoMovil = null
    if (movil) {
      const r = await suscribirMovil()
      suscripcion = r.suscripcion || null
      motivoMovil = r.motivo || null
    }
    let sesion = null
    if (porCorreo && correo) {
      const { sesionActual } = await import('../utils/cuenta')
      sesion = (await sesionActual())?.access_token || null
    }
    const r = await crearAlerta({ categoria, que, movil: suscripcion, sesion, zona: soloCerca ? zona : null })
    setGuardando(false)
    onHecho?.({ ...r, motivoMovil, pidioCorreo: porCorreo && Boolean(correo), cerca: soloCerca ? zona.nombre : null })
  }

  // En el cuerpo de la pagina: dentro de Buscar quedaba debajo de la barra.
  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="alerta-titulo">
        <button className={styles.close} onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
        <div className={styles.icono}><Bell size={24} /></div>
        <h3 id="alerta-titulo" className={styles.title}>¿Te aviso si llega alguien?</h3>
        <p className={styles.desc}>Cuando se dé de alta en Nüra alguien de <b>{que.toLowerCase()}</b>{soloCerca ? <> cerca de <b>{zona.nombre}</b></> : null}, te lo digo.</p>

        <div className={styles.guardo}>
          <p className={styles.guardoTit}>Solo guardo esto</p>
          <p className={styles.guardoTxt}>«{que}»{soloCerca ? ` y el barrio (${zona.nombre})` : ''}. No guardo lo que escribiste. Se borra solo a los 3 meses, o cuando quieras desde tu perfil.</p>
        </div>

        {zona?.nombre && (
          <button type="button" className={`${styles.canal} ${soloCerca ? styles.canalOn : ''}`}
            aria-pressed={soloCerca} onClick={() => setSoloCerca(v => !v)}>
            <MapPin size={18} />
            <span className={styles.canalTxt}>
              <span className={styles.canalTit}>Solo si trabaja cerca de {zona.nombre}</span>
              <span className={styles.canalNota}>A 5 km o menos, online o en toda Barcelona.</span>
            </span>
            <span className={styles.check}>{soloCerca && <Check size={14} />}</span>
          </button>
        )}

        <p className={styles.pregunta}>¿Cómo te aviso?</p>
        <button type="button" className={`${styles.canal} ${movil ? styles.canalOn : ''}`}
          aria-pressed={movil} disabled={!puedeMovil} onClick={() => setMovil(v => !v)}>
          <Bell size={18} />
          <span className={styles.canalTxt}>
            <span className={styles.canalTit}>Notificación en este móvil</span>
            {!puedeMovil && <span className={styles.canalNota}>
              {esIphoneSinInstalar()
                ? 'En iPhone: añade Nüra a tu pantalla de inicio (Compartir → Añadir a pantalla de inicio) y vuelve a pedirlo desde allí.'
                : 'Este navegador no permite notificaciones.'}
            </span>}
          </span>
          <span className={styles.check}>{movil && <Check size={14} />}</span>
        </button>

        {correo ? (
          <button type="button" className={`${styles.canal} ${porCorreo ? styles.canalOn : ''}`}
            aria-pressed={porCorreo} onClick={() => setPorCorreo(v => !v)}>
            <Mail size={18} />
            <span className={styles.canalTxt}>
              <span className={styles.canalTit}>Correo</span>
              <span className={styles.canalNota}>{correo}</span>
            </span>
            <span className={styles.check}>{porCorreo && <Check size={14} />}</span>
          </button>
        ) : (
          <button type="button" className={styles.canal} onClick={() => navigate('/entrar?modo=crear&volver=/')}>
            <Mail size={18} />
            <span className={styles.canalTxt}>
              <span className={styles.canalTit}>Correo</span>
              <span className={styles.canalNota}>Necesitas una cuenta con tu correo. Créala aquí y vuelve a pedírmelo.</span>
            </span>
          </button>
        )}

        <button className={styles.btn} onClick={confirmar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Sí, avísame'}
        </button>
        <button className={styles.btnNo} onClick={onClose}>Ahora no</button>
      </div>
    </div>,
    document.body,
  )
}
