import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { atributosDe } from '../utils/escrituras'
import { etiquetaDe, confirmarDeclarado } from '../utils/declarado'
import { ETIQUETA_CUALIDAD } from '../utils/cualidades'

// «La persona puede ver y corregir todo lo que Nüra sabe de ella»
// (docs/perfil-vivo.md §6). Lo mismo que enseña su ficha publica, agrupado
// por DE DONDE SALE. Lo que cuenta ella se puede quitar aqui mismo; lo
// medido y lo que dicen sus clientes no lo decide ella, pero lo ve entero.

function texto(a) {
  if (a.fuente === 'declarado') return etiquetaDe(a.clave, a.valor)
  if (a.clave === 'volveria') return `${a.valor.si} de ${a.valor.total} volverían a llamarte`
  if (a.clave === 'estrellas') return `${String(a.valor.media).replace('.', ',')} de nota`
  if (a.clave.startsWith('cualidad:')) return ETIQUETA_CUALIDAD[a.clave.slice(9)] || a.clave.slice(9)
  if (a.clave === 'tiempo_respuesta') {
    const m = a.valor.mediana_minutos
    return `Sueles contestar ${m < 60 ? 'en menos de 1 h' : m < 180 ? 'en 1–3 h' : m < 1440 ? 'el mismo día' : `en ${Math.round(m / 1440)} días`}`
  }
  if (a.clave === 'tasa_respuesta') return `Contestas ${Math.round(100 * a.valor.respondidos / a.valor.recibidos)} % de los mensajes`
  return a.clave
}

// La prueba, sin repetir lo que ya dice la linea de arriba.
function prueba(a) {
  if (a.clave === 'volveria' || a.clave === 'estrellas') return a.clave === 'estrellas' ? a.prueba : ''
  const m = /^lo confirmó el (\d{4}-\d{2}-\d{2})$/.exec(a.prueba || '')
  if (m) {
    try { return 'Lo confirmaste el ' + new Date(m[1] + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) }
    catch { return a.prueba }
  }
  return a.prueba
}

const GRUPOS = [
  ['medido', 'Medido por Nüra', 'Con lo que pasa en la app. Nunca leemos tus chats.'],
  ['clientes', 'Lo dicen tus clientes', 'Al terminar un servicio, con un toque.'],
  ['declarado', 'Lo cuentas tú', 'Lo confirmaste tú. Puedes quitar lo que ya no sea cierto.'],
]

export default function LoQueSabeNura({ helperId, estilos: s, puedeCorregir }) {
  const [attrs, setAttrs] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let vivo = true
    atributosDe(helperId).then(a => { if (vivo) setAttrs(Array.isArray(a) ? a : []) })
    return () => { vivo = false }
  }, [helperId])

  async function quitar(clave) {
    const resto = attrs.filter(a => a.fuente === 'declarado' && a.clave !== clave)
    const antes = attrs
    setAttrs(attrs.filter(a => !(a.fuente === 'declarado' && a.clave === clave)))
    setError('')
    const { sesionActual } = await import('../utils/cuenta')
    const ok = await confirmarDeclarado(resto, (await sesionActual())?.access_token)
    if (!ok) { setAttrs(antes); setError('No se ha podido quitar ahora. Vuelve a probar en un momento.') }
  }

  if (attrs === null) return null
  return (
    <section className={s.seccion} aria-labelledby="lo-que-sabe">
      <h2 id="lo-que-sabe" className={s.titulo}>Lo que Nüra sabe de ti</h2>
      {!attrs.length ? (
        <p className={s.tarjetaTexto}>
          Aún nada. Cuando te escriban y te valoren, aparecerá aquí y en tu ficha, siempre con su prueba. Nunca leemos tus chats.
        </p>
      ) : (
        <div className={s.pila}>
          {GRUPOS.map(([fuente, titulo, explica]) => {
            const suyos = attrs.filter(a => a.fuente === fuente && !(a.clave === 'vehiculo' && a.valor === false))
            if (!suyos.length) return null
            return (
              <div key={fuente} className={s.lista}>
                <div className={s.fila} style={{ cursor: 'default', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                  <span className={s.filaTitulo}>{titulo}</span>
                  <span className={s.filaDetalle} style={{ whiteSpace: 'normal' }}>{explica}</span>
                </div>
                {suyos.map(a => (
                  <div key={a.fuente + a.clave} className={s.fila} style={{ cursor: 'default' }}>
                    <span className={s.filaTexto}>
                      <span className={s.filaTitulo} style={{ fontWeight: 600 }}>{texto(a)}</span>
                      {prueba(a) && <span className={s.filaDetalle}>{prueba(a)}</span>}
                    </span>
                    {fuente === 'declarado' && puedeCorregir && (
                      <button className={s.quitar} onClick={() => quitar(a.clave)} aria-label={`Quitar «${texto(a)}» de tu ficha`}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
          {error && <p role="alert" className={s.tarjetaTexto} style={{ color: 'var(--red-ink)' }}>{error}</p>}
        </div>
      )}
    </section>
  )
}
