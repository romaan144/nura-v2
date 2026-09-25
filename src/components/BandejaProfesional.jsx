import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import { misAvisos, porLaFuncion } from '../utils/escrituras'
import styles from '../pages/Chats.module.css'

// ── «TE HAN ESCRITO»: la bandeja de la profesional ──────────────────────
// Antes solo podia contestar desde el enlace de cada aviso. Aqui ve todo lo
// que le han escrito, lo que falta por contestar primero, y al tocarlo
// contesta en /r/:token (la misma pantalla del enlace). Solo con su sesion:
// el servidor solo devuelve los avisos de SU ficha.

const fecha = iso => {
  try {
    const d = new Date(iso), hoy = new Date()
    return d.toDateString() === hoy.toDateString()
      ? d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

/** Lo que pide, sin el saludo de Nüra: la frase entre «» o el primer texto. */
function extracto(mensaje) {
  const t = String(mensaje || '')
  const cita = /«([^»]{3,})»/.exec(t)
  const base = cita ? cita[1] : t.split('\n').filter(l => l.trim() && !/^Hola.*soy Nüra\.?$/.test(l.trim()))[0] || t
  return base.replace(/\s+/g, ' ').trim().slice(0, 140)
}

export default function BandejaProfesional() {
  const navigate = useNavigate()
  const [avisos, setAvisos] = useState(null)   // null = cargando o sin acceso

  useEffect(() => {
    if (!porLaFuncion()) return
    let vivo = true
    ;(async () => {
      const { sesionActual } = await import('../utils/cuenta')
      const sesion = (await sesionActual())?.access_token
      if (!sesion) { if (vivo) setAvisos('sin-sesion'); return }
      const lista = await misAvisos(sesion)
      if (vivo) setAvisos(lista)
    })()
    return () => { vivo = false }
  }, [])

  if (!avisos) return null
  if (avisos === 'sin-sesion') return (
    <section style={{ padding: 'var(--space-8) var(--space-16) var(--space-4)' }}>
      <button className={styles.chatRow} onClick={() => navigate('/entrar?volver=/chats')}>
        <Inbox size={20} aria-hidden="true" style={{ color: 'var(--purple)', flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink)', lineHeight: 1.4 }}>
          <strong>Entra con tu cuenta</strong> para ver aquí quién te ha escrito y contestar sin salir de Nüra.
        </span>
      </button>
    </section>
  )
  const porContestar = avisos.filter(a => !a.respuesta)
  const ordenados = [...porContestar, ...avisos.filter(a => a.respuesta)]

  return (
    <section aria-labelledby="bandeja-titulo" style={{ padding: 'var(--space-8) var(--space-16) var(--space-4)' }}>
      <h2 id="bandeja-titulo" style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink)', margin: '0 0 var(--space-8)', display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
        <Inbox size={16} aria-hidden="true" /> Te han escrito
        {porContestar.length > 0 && (
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'white', background: 'var(--purple)', borderRadius: 'var(--radius-full)', padding: '1px 8px' }}>
            {porContestar.length} sin contestar
          </span>
        )}
      </h2>
      {!avisos.length ? (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', margin: 0 }}>
          Aún nadie. Cuando alguien te escriba, lo verás aquí y podrás contestar sin salir de Nüra.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
          {ordenados.slice(0, 20).map(a => (
            <button key={a.id} className={`${styles.chatRow} ${!a.respuesta ? styles.chatUnread : ''}`}
              onClick={() => navigate(`/r/${a.token}`)}
              aria-label={`${a.respuesta ? 'Contestado' : 'Sin contestar'}: ${extracto(a.mensaje)}`}>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-8)', fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)' }}>
                  <strong style={{ color: a.respuesta ? 'var(--ink-secondary)' : 'var(--purple)' }}>{a.respuesta ? 'Contestado' : 'Sin contestar'}</strong>
                  <span>{fecha(a.fecha)}</span>
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  «{extracto(a.mensaje)}»
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
