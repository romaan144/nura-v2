import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Mail, X, ChevronRight } from 'lucide-react'
import { misAlertas, quitarAlerta, marcarVistas, alertasGuardadas } from '../utils/alertas'

// «Te aviso si aparece: …» (docs/perfil-vivo.md §10, punto 4). Lo que Nüra
// recuerda de quien busca, visible y con su botón para quitarlo. Usa las
// clases del perfil (`estilos`) para ser una sección más, no un añadido.

const fecha = iso => { try { return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) } catch { return '' } }

export default function MisAlertas({ estilos: s, destacar = false }) {
  const navigate = useNavigate()
  const [lista, setLista] = useState(() => alertasGuardadas().map(a => ({ ...a, encontrados: [] })))
  const ref = useRef(null)

  useEffect(() => {
    let vivo = true
    misAlertas().then(l => { if (vivo) { setLista(l); marcarVistas(l) } })
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    if (destacar && lista.length) ref.current?.scrollIntoView({ block: 'start' })
  }, [destacar, lista.length])

  if (!lista.length) return null

  async function quitar(llave) {
    setLista(l => l.filter(a => a.llave !== llave))
    await quitarAlerta(llave)
  }

  return (
    <section ref={ref} className={s.seccion} aria-labelledby="mis-alertas">
      <h2 id="mis-alertas" className={s.titulo}>Te aviso si aparece</h2>
      <div className={s.lista}>
        {lista.map(a => {
          const nuevos = (a.encontrados || []).slice((a.visto || 0))
          return (
            <div key={a.llave} className={s.fila} style={{ cursor: 'default', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <span className={s.filaIcono} aria-hidden="true" style={{ color: 'var(--purple)' }}>
                {a.canales?.correo && !a.canales?.movil ? <Mail size={17} /> : <Bell size={17} />}
              </span>
              <span className={s.filaTexto}>
                <span className={s.filaTitulo}>{a.que}{a.zona ? ` · cerca de ${a.zona}` : ''}</span>
                <span className={s.filaDetalle}>
                  {[a.canales?.movil && 'Notificación', a.canales?.correo && 'correo'].filter(Boolean).join(' y ') || 'Lo verás aquí'}
                  {a.caduca_en ? ` · hasta el ${fecha(a.caduca_en)}` : ''}
                </span>
              </span>
              <button className={s.quitar} onClick={() => quitar(a.llave)} aria-label={`Dejar de avisarme de ${a.que}`}>
                <X size={16} />
              </button>
              {(a.encontrados || []).length > 0 && (
                <span style={{ flexBasis: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingLeft: 48 }}>
                  {[...a.encontrados].reverse().map(e => (
                    <button key={e.id + e.fecha} onClick={() => navigate(`/helper/${e.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', minHeight: 40, padding: '0 var(--space-12)',
                        borderRadius: 'var(--radius-card)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        background: nuevos.includes(e) ? 'var(--green-light)' : 'var(--surface-subtle)', color: 'var(--ink-primary)' }}>
                      <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>
                        <strong>Ha llegado {e.nombre}</strong>{e.especialidad ? ` · ${e.especialidad}` : ''}
                      </span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  ))}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <p className={s.pie}>Solo guardo el oficio, nunca lo que escribiste. Cada aviso se borra solo a los 3 meses.</p>
    </section>
  )
}
