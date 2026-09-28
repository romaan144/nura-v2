import { useId, useState } from 'react'
import useModalSheet from './useModalSheet'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, Bell, Mail, Check, MapPin, ShieldCheck, ArrowUpRight } from 'lucide-react'
import styles from './AlertaSheet.module.css'
import { crearAlerta, suscribirMovil, movilPuedeAvisar, esIphoneSinInstalar } from '../utils/alertas'

// «TE AVISO SI APARECE ALGUIEN» — el SI de la persona (docs/perfil-vivo.md
// §10). Dice exactamente que se guarda antes de guardarlo, y nada se guarda
// hasta que pulsa «Sí, avísame».

function correoDeLaCuenta() {
  try { return JSON.parse(localStorage.getItem('nura_sesion') || 'null')?.user?.email || '' }
  catch { return '' }
}

export default function AlertaSheet({ categoria, que, zona, ciudad, onClose, onHecho }) {
  const navigate = useNavigate()
  const titleId = useId()
  const descriptionId = useId()
  const { dialog, body } = useModalSheet(onClose)
  const correo = correoDeLaCuenta()
  const puedeMovil = movilPuedeAvisar() && !esIphoneSinInstalar()
  const [movil, setMovil] = useState(puedeMovil)
  const [porCorreo, setPorCorreo] = useState(Boolean(correo))
  const [guardando, setGuardando] = useState(false)
  // Si buscaba en un barrio, por defecto solo avisa de quien trabaja cerca.
  const [soloCerca, setSoloCerca] = useState(Boolean(zona?.nombre))
  // Sin barrio, la ciudad donde busca: solo avisa de quien trabaja allí u online.
  const enCiudad = !soloCerca && ciudad ? ciudad : null

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
    const r = await crearAlerta({ categoria, que, movil: suscripcion, sesion, zona: soloCerca ? zona : null, ciudad: enCiudad })
    setGuardando(false)
    onHecho?.({ ...r, motivoMovil, pidioCorreo: porCorreo && Boolean(correo), cerca: soloCerca ? zona.nombre : null, ciudad: enCiudad })
  }

  const viasElegidas = [movil && 'móvil', porCorreo && correo && 'correo'].filter(Boolean)

  // Portal y pie separado: confirmar nunca queda bajo el menú de Buscar.
  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <section ref={dialog} className={styles.card} onClick={e => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1}>
        <header className={styles.header}>
          <span className={styles.icono} aria-hidden="true"><Bell size={22} /></span>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>Aviso de búsqueda</p>
            <h2 id={titleId} className={styles.title}>Si aparece alguien</h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar aviso"><X size={20} /></button>
        </header>

        <div ref={body} className={styles.body}>
          <p id={descriptionId} className={styles.desc}>Guarda esta búsqueda para saber cuándo se une a Nüra alguien que pueda ayudarte.</p>
          <div className={styles.search}>
            <span className={styles.searchLabel}>Lo que buscas</span>
            <strong>{que}</strong>
            <span className={styles.location}><MapPin size={16} aria-hidden="true" />
              {soloCerca ? `Cerca de ${zona.nombre}` : enCiudad ? `${enCiudad} u online` : 'Sin limitar la zona'}
            </span>
          </div>

          {zona?.nombre && (
            <section className={styles.group} aria-label="Zona del aviso">
              <h3 className={styles.pregunta}>Dónde te interesa</h3>
              <button type="button" className={`${styles.canal} ${soloCerca ? styles.canalOn : ''}`}
                aria-pressed={soloCerca} onClick={() => setSoloCerca(v => !v)}>
                <MapPin size={20} aria-hidden="true" />
                <span className={styles.canalTxt}>
                  <span className={styles.canalTit}>Cerca de {zona.nombre}</span>
                  <span className={styles.canalNota}>A 5 km o menos, online o en toda Barcelona.</span>
                </span>
                <span className={styles.check} aria-hidden="true">{soloCerca && <Check size={15} />}</span>
              </button>
            </section>
          )}

          <section className={styles.group} aria-labelledby={`${titleId}-canales`}>
            <h3 id={`${titleId}-canales`} className={styles.pregunta}>Cómo quieres enterarte</h3>
            <p className={styles.hint}>Podrás consultarlo en tu perfil. Si quieres, añade móvil, correo o ambos.</p>
            <div className={styles.options}>
              <button type="button" className={`${styles.canal} ${movil ? styles.canalOn : ''}`}
                aria-pressed={movil} disabled={!puedeMovil} onClick={() => setMovil(v => !v)}>
                <Bell size={20} aria-hidden="true" />
                <span className={styles.canalTxt}>
                  <span className={styles.canalTit}>En este móvil</span>
                  <span className={styles.canalNota}>{puedeMovil ? 'Una notificación cuando haya novedades.' : 'No disponible en este navegador.'}</span>
                </span>
                <span className={styles.check} aria-hidden="true">{movil && <Check size={15} />}</span>
              </button>
              {!puedeMovil && esIphoneSinInstalar() && <p className={styles.deviceNote}>
                En iPhone, abre Compartir → Añadir a pantalla de inicio. Después abre Nüra desde ese icono y vuelve a pedir el aviso.
              </p>}

              {correo ? (
                <button type="button" className={`${styles.canal} ${porCorreo ? styles.canalOn : ''}`}
                  aria-pressed={porCorreo} onClick={() => setPorCorreo(v => !v)}>
                  <Mail size={20} aria-hidden="true" />
                  <span className={styles.canalTxt}>
                    <span className={styles.canalTit}>Por correo</span>
                    <span className={styles.canalNota}>{correo}</span>
                  </span>
                  <span className={styles.check} aria-hidden="true">{porCorreo && <Check size={15} />}</span>
                </button>
              ) : (
                <button type="button" className={styles.canal} onClick={() => { onClose(); navigate('/entrar?modo=crear&volver=/&motivo=avisos') }}>
                  <Mail size={20} aria-hidden="true" />
                  <span className={styles.canalTxt}>
                    <span className={styles.canalTit}>Crear acceso con correo</span>
                    <span className={styles.canalNota}>Crea tu cuenta y vuelve a pedir el aviso.</span>
                  </span>
                  <ArrowUpRight size={20} aria-hidden="true" />
                </button>
              )}
            </div>
          </section>

          <div className={styles.guardo}>
            <ShieldCheck size={19} aria-hidden="true" />
            <div>
              <h3 className={styles.guardoTit}>Qué se guarda</h3>
              <p className={styles.guardoTxt}>La especialidad{soloCerca ? ` y el barrio (${zona.nombre})` : enCiudad ? ` y la ciudad (${enCiudad})` : ''}, no el texto de tu conversación. El aviso caduca a los 3 meses. Puedes quitarlo antes desde tu perfil.</p>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <p className={styles.selection} aria-live="polite">
            {viasElegidas.length ? <>Has elegido: <strong>{viasElegidas.join(' y ')}</strong></> : <>Solo en tu perfil, al abrir Nüra.</>}
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.btnNo} onClick={onClose}>Ahora no</button>
            <button type="button" className={styles.btn} onClick={confirmar} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Sí, avísame'}
            </button>
          </div>
        </footer>
      </section>
    </div>, document.body,
  )
}
