// ── LA VUELTA ────────────────────────────────────────────────────────────
//
// Aqui aterriza un profesional cuando abre el enlace del aviso que le llego
// al movil. Es, casi siempre, su PRIMER contacto con Nüra.
//
// Tres reglas que gobiernan esta pantalla:
//
// 1. SIN CUENTA. No se pide registro ni contraseña. El token del enlace ya
//    prueba quien es: le llego a su propio movil. Pedirle crear una cuenta
//    antes de dejarle contestar es perder a la mitad.
//
// 2. EL MENSAJE PRIMERO. Lo que ve nada mas entrar es lo que esa persona
//    necesita, con sus palabras. No "tienes un mensaje nuevo": el problema
//    entero. Si entrar no aporta valor inmediato, no vuelve a entrar.
//
// 3. SIN VENDER NADA. Ni banners, ni "descarga la app", ni "completa tu
//    perfil". Ha venido a contestar a alguien que le necesita.

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { abrirAviso, responderAviso, misAvisos, porLaFuncion } from '../utils/escrituras'
import { refrescarSinContestar } from '../utils/sinContestar'

// RESPUESTAS RAPIDAS: en el movil escribir cuesta. Rellenan la caja (no
// envian): la profesional las retoca y decide. Si el mensaje es una
// propuesta de cita, las del sí/no a esa cita.
function rapidasPara(mensaje) {
  if (/te propone una cita/i.test(String(mensaje || ''))) return [
    ['Me va bien', '¡Perfecto! Me va bien ese día y a esa hora. Nos vemos.'],
    ['Proponer otro día', 'Ese momento no me va bien. ¿Te iría bien el '],
    ['No puedo', 'Lo siento, estos días no tengo hueco. Si quieres, Nüra te ayuda a encontrar a otra persona.'],
  ]
  return [
    ['Tengo hueco', 'Hola, sí, puedo ayudarte. Tengo hueco '],
    ['Cuéntame más', 'Hola, gracias por escribirme. Para ayudarte mejor, ¿me cuentas un poco más sobre '],
    ['Ahora no puedo', 'Hola, gracias por escribirme. Ahora mismo no tengo hueco. Si quieres, Nüra te ayuda a encontrar a otra persona.'],
  ]
}

// Una pantalla por mensaje: al pasar al siguiente (otro token) se monta de
// nuevo, limpia, sin arrastrar lo escrito en el anterior.
// «lunes 28 de septiembre · 16:00»
function cuandoCita(c) {
  try { return `${new Date(c.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} · ${c.hora}` }
  catch { return `${c.fecha} · ${c.hora}` }
}

export default function Responder() {
  const { token } = useParams()
  return <ResponderAviso key={token} token={token} />
}

function ResponderAviso({ token }) {
  const [estado, setEstado] = useState('cargando')   // cargando|listo|enviado|fallo|error|sinred
  const [aviso, setAviso] = useState(null)
  // Lo que lleva escrito se guarda en este móvil: si cierra la página o se
  // queda sin cobertura, no tiene que escribirlo otra vez.
  const BORRADOR = 'nura_borrador_' + token
  const [texto, setTexto] = useState(() => { try { return localStorage.getItem(BORRADOR) || '' } catch { return '' } })
  const [intento, setIntento] = useState(0)
  // La cita propuesta: 'aceptada' | 'rechazada' | null (aún no ha decidido).
  const [decision, setDecision] = useState(null)
  const [ocupada, setOcupada] = useState(false)
  // «Aceptar la cita» envía en cuanto la decisión está puesta.
  const enviarAceptando = useRef(false)
  useEffect(() => {
    if (decision !== 'aceptada' || !enviarAceptando.current) return
    enviarAceptando.current = false
    enviar(`¡Hecho! Te espero el ${aviso?.cita ? cuandoCita(aviso.cita).replace(' · ', ' a las ') : 'día que dices'}.`)
  }, [decision])   // eslint-disable-line react-hooks/exhaustive-deps
  const enviandoRef = useRef(false)
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()
  // Despues de contestar (y SOLO despues: la regla 3 sigue en pie mientras
  // escribe), que hacer ahora: con cuenta, el siguiente mensaje o su bandeja;
  // sin cuenta, la invitacion a verlo todo en Nüra. null = aun no se sabe.
  const [despues, setDespues] = useState(null)

  useEffect(() => {
    let vivo = true
    abrirAviso(token).then(r => {
      if (!vivo) return
      if (r?.ok && r.aviso) {
        setAviso(r.aviso)
        // Si ya contesto, no se le pide otra vez.
        setEstado(r.aviso.respuesta ? 'enviado' : 'listo')
        if (r.aviso.respuesta) setTexto(r.aviso.respuesta)
      } else setEstado(r?.sinRed ? 'sinred' : 'error')
    })
    return () => { vivo = false }
  }, [token, intento])

  useEffect(() => {
    if (estado !== 'listo' && estado !== 'fallo') return
    try { texto.trim() ? localStorage.setItem(BORRADOR, texto) : localStorage.removeItem(BORRADOR) } catch { /* sin almacenamiento */ }
  }, [texto, estado, BORRADOR])

  // Si falló por la conexión, sale sola en cuanto vuelva.
  useEffect(() => {
    if (estado !== 'fallo') return
    const alVolver = () => enviar()
    window.addEventListener('online', alVolver)
    return () => window.removeEventListener('online', alVolver)
  })

  useEffect(() => {
    if (estado !== 'enviado' || !porLaFuncion()) return
    let vivo = true
    ;(async () => {
      const { sesionActual } = await import('../utils/cuenta')
      const sesion = (await sesionActual())?.access_token
      if (!sesion) { if (vivo) setDespues({ conCuenta: false }); return }
      const lista = await misAvisos(sesion)
      const pendientes = (lista || []).filter(a => !a.respuesta && a.token !== token)
      if (vivo) setDespues({ conCuenta: Array.isArray(lista), siguiente: pendientes[0]?.token || null, quedan: pendientes.length })
    })()
    return () => { vivo = false }
  }, [estado, token])

  // `forzado`: el texto que manda el botón «Aceptar la cita» si no ha escrito nada.
  async function enviar(forzado) {
    const cuerpo = (texto.trim() || forzado || '').trim()
    // El ref, no solo el estado: dos toques (o dos avisos de «vuelve la
    // conexión») en el mismo instante verían `enviando` aún en false.
    if (!cuerpo || enviandoRef.current) return
    enviandoRef.current = true
    setEnviando(true)
    const r = await responderAviso(token, cuerpo, decision || undefined)
    enviandoRef.current = false
    setEnviando(false)
    // Esa hora ya la tiene aceptada con otra persona: no se guarda nada y
    // se le pide que proponga otra.
    if (r?.estado === 409 && decision === 'aceptada') {
      setDecision('rechazada'); setOcupada(true)
      if (!texto.trim()) setTexto(`Esa hora ya la tengo ocupada. ¿Te iría bien `)
      requestAnimationFrame(() => document.getElementById('respuesta')?.focus())
      return
    }
    // Si falla, se dice. Un "enviado" falso deja a una familia esperando
    // una respuesta que no existe.
    setEstado(r?.ok ? 'enviado' : 'fallo')
    if (r?.ok && r.cita === 'hora ocupada') setOcupada(true)
    if (r?.ok) {
      refrescarSinContestar()   // uno menos en su barra
      try { localStorage.removeItem(BORRADOR) } catch { /* nada */ }
    }
  }

  const marco = {
    minHeight: '100dvh', background: 'var(--paper)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: 'max(env(safe-area-inset-top,0px),24px) var(--space-20) var(--space-32)',
  }
  const caja = {
    width: '100%', maxWidth: 520,
    // Cristal, como el resto del sistema. Esta caja es, casi siempre, la
    // primera impresion de un profesional con Nüra.
    background: 'rgba(255,255,255,0.96)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    backdropFilter: 'blur(20px) saturate(160%)',
    borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: 'var(--alzado-flota)',
    padding: 'var(--space-20)',
  }

  if (estado === 'cargando') {
    return <div style={{...marco, justifyContent: 'center'}}>
      <img src="/logo-iso.png" alt="" style={{width: 40, opacity: 0.35}} />
    </div>
  }

  if (estado === 'sinred') {
    return <div style={{...marco, justifyContent: 'center'}}>
      <div style={{...caja, textAlign: 'center'}}>
        <p style={{fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 var(--space-8)'}}>
          No he podido abrir el mensaje
        </p>
        <p style={{fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', margin: '0 0 var(--space-16)', lineHeight: 1.6}}>
          Parece un problema de conexión. El mensaje sigue esperándote.
        </p>
        <button onClick={() => { setEstado('cargando'); setIntento(n => n + 1) }}
          style={{ width: '100%', minHeight: 48, border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-full)',
            background: 'var(--purple)', color: 'white', fontFamily: 'inherit', fontSize: 'var(--text-base)', fontWeight: 700 }}>
          Reintentar
        </button>
      </div>
    </div>
  }

  if (estado === 'error') {
    return <div style={{...marco, justifyContent: 'center'}}>
      <div style={{...caja, textAlign: 'center'}}>
        <p style={{fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--ink-primary)', margin: '0 0 var(--space-8)'}}>
          Este enlace ya no sirve
        </p>
        <p style={{fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', margin: 0, lineHeight: 1.6}}>
          Puede que sea antiguo o que se haya copiado a medias. Si alguien te
          escribió, vuelve a abrir el mensaje que te llegó.
        </p>
      </div>
    </div>
  }

  const nombre = (aviso?.nombre || '').split(' ')[0]

  return (
    <div style={marco}>
      <img src="/logo-text.png" alt="Nüra" style={{height: 22, opacity: 0.8, margin: '0 0 var(--space-24)'}} />
      <div style={caja}>
        <p style={{fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', margin: '0 0 var(--space-12)'}}>
          {nombre ? `Hola ${nombre}, alguien te necesita.` : 'Alguien te necesita.'}
        </p>

        <div style={{
          background: 'var(--surface-subtle)', borderRadius: 'var(--radius-card)',
          padding: 'var(--space-16)', margin: '0 0 var(--space-20)',
          fontSize: 'var(--text-base)', lineHeight: 1.6,
          color: 'var(--ink-primary)', whiteSpace: 'pre-wrap',
        }}>{aviso?.mensaje}</div>

        {aviso?.cita?.estado === 'cancelada' && (
          <div role="status" style={{ border: '1px solid var(--ink-border)', background: 'var(--surface-subtle)',
            borderRadius: 'var(--radius-card)', padding: 'var(--space-14) var(--space-16)', margin: '0 0 var(--space-16)' }}>
            <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--red-ink)' }}>Cita cancelada</p>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--ink-primary)', lineHeight: 1.5 }}>
              Ha cancelado la cita del {cuandoCita(aviso.cita).replace(' · ', ' a las ')}. Esa hora vuelve a estar libre en tu agenda.
            </p>
          </div>
        )}

        {estado === 'enviado' ? (
          <div style={{textAlign: 'center', padding: 'var(--space-12) 0'}}>
            <p style={{fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--green)', margin: '0 0 var(--space-8)'}}>
              {decision === 'aceptada' && !ocupada ? 'Cita confirmada' : 'Respuesta enviada'}
            </p>
            {decision === 'aceptada' && !ocupada && aviso?.cita && (
              <p style={{fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 var(--space-8)', textTransform: 'capitalize'}}>
                {cuandoCita(aviso.cita)}
              </p>
            )}
            {ocupada && (
              <p style={{fontSize: 'var(--text-sm)', color: 'var(--red-ink)', margin: '0 0 var(--space-8)'}}>
                Tu respuesta ha llegado, pero esa hora acababa de ocuparse: la cita no ha quedado confirmada.
              </p>
            )}
            <p style={{fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', margin: 0, lineHeight: 1.6}}>
              Se la hago llegar. Si quiere seguir contigo, te aviso.
            </p>
            {despues?.conCuenta && (
              <button onClick={() => navigate(despues.siguiente ? `/r/${despues.siguiente}` : '/chats')}
                style={{ marginTop: 'var(--space-20)', width: '100%', minHeight: 48, border: 'none', cursor: 'pointer',
                  borderRadius: 'var(--radius-full)', background: 'var(--purple)', color: 'white',
                  fontFamily: 'inherit', fontSize: 'var(--text-base)', fontWeight: 700 }}>
                {despues.siguiente
                  ? `Siguiente mensaje sin contestar${despues.quedan > 1 ? ` (${despues.quedan})` : ''}`
                  : 'Volver a mis mensajes'}
              </button>
            )}
            {despues && !despues.conCuenta && (
              <div style={{ marginTop: 'var(--space-24)', padding: 'var(--space-16)', borderRadius: 'var(--radius-card)',
                background: 'var(--surface-subtle)', textAlign: 'left' }}>
                <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink-primary)' }}>
                  ¿Quieres verlo todo en un sitio?
                </p>
                <p style={{ margin: '0 0 var(--space-12)', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
                  Con tu acceso ves aquí todo lo que te escriban y te aviso en el móvil. Usa el mismo correo que diste en Nüra.
                </p>
                <button onClick={() => navigate('/entrar?modo=crear&volver=/chats')}
                  style={{ width: '100%', minHeight: 44, border: '1px solid var(--purple)', cursor: 'pointer', borderRadius: 'var(--radius-full)',
                    background: 'transparent', color: 'var(--purple)', fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                  Crear mi acceso
                </button>
                <button onClick={() => navigate('/entrar?volver=/chats')}
                  style={{ width: '100%', minHeight: 40, marginTop: 'var(--space-6)', border: 'none', cursor: 'pointer', background: 'transparent',
                    color: 'var(--ink-secondary)', fontFamily: 'inherit', fontSize: 'var(--text-sm)' }}>
                  Ya tengo acceso: entrar
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {aviso?.cita?.estado === 'propuesta' && decision !== 'rechazada' && (
              <div style={{ border: '1px solid var(--purple-30, rgba(123,47,255,0.3))', background: 'var(--purple-05, #F7F3FF)',
                borderRadius: 'var(--radius-card)', padding: 'var(--space-14) var(--space-16)', margin: '0 0 var(--space-16)' }}>
                <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--purple-ink)' }}>Te propone una cita</p>
                <p style={{ margin: '0 0 var(--space-12)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--ink-primary)', textTransform: 'capitalize' }}>
                  {cuandoCita(aviso.cita)}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
                  <button type="button" disabled={enviando}
                    onClick={() => { setDecision('aceptada'); enviarAceptando.current = true }}
                    style={{ flex: 1, minHeight: 44, border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer',
                      background: 'var(--purple)', color: 'white', fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                    {enviando && decision === 'aceptada' ? 'Confirmando…' : 'Aceptar la cita'}
                  </button>
                  <button type="button" disabled={enviando}
                    onClick={() => {
                      setDecision('rechazada')
                      if (!texto.trim()) setTexto('Esa hora no me va bien. ¿Te iría bien ')
                      requestAnimationFrame(() => { const t = document.getElementById('respuesta'); t?.focus(); t?.setSelectionRange(t.value.length, t.value.length) })
                    }}
                    style={{ flex: 1, minHeight: 44, border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-full)', cursor: 'pointer',
                      background: 'white', color: 'var(--ink-primary)', fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    No me va bien
                  </button>
                </div>
              </div>
            )}
            {decision === 'rechazada' && aviso?.cita && (
              <p style={{ margin: '0 0 var(--space-10)', fontSize: 'var(--text-sm)', color: ocupada ? 'var(--red-ink)' : 'var(--ink-secondary)', lineHeight: 1.5 }}>
                {ocupada ? 'Esa hora ya la tienes aceptada con otra persona. ' : ''}Dile qué otro día u hora te va bien.
              </p>
            )}
            <label htmlFor="respuesta" style={{display: 'block', fontSize: 'var(--text-sm)',
              fontWeight: 700, color: 'var(--ink-secondary)', margin: '0 0 var(--space-8)'}}>
              Tu respuesta
            </label>
            <div role="group" aria-label="Respuestas rápidas" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', margin: '0 0 var(--space-10)' }}>
              {rapidasPara(aviso?.mensaje).map(([etiqueta, frase]) => (
                <button key={etiqueta} type="button"
                  onClick={() => { setTexto(frase); requestAnimationFrame(() => { const t = document.getElementById('respuesta'); t?.focus(); t?.setSelectionRange(frase.length, frase.length) }) }}
                  style={{ minHeight: 36, padding: '0 var(--space-12)', borderRadius: 'var(--radius-full)', cursor: 'pointer',
                    border: '1px solid var(--ink-border)', background: 'white', color: 'var(--ink-primary)',
                    fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {etiqueta}
                </button>
              ))}
            </div>
            <textarea id="respuesta" value={texto} onChange={e => setTexto(e.target.value)} rows={5}
              placeholder="Puedes decir si tienes hueco, cuándo, o simplemente que ahora no puedes."
              style={{width: '100%', boxSizing: 'border-box', padding: 'var(--space-12) var(--space-14)',
                border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-card)',
                fontSize: 'var(--text-base)', lineHeight: 1.6, fontFamily: 'inherit',
                background: 'var(--surface-subtle)', resize: 'vertical', outline: 'none'}} />

            {estado === 'fallo' && (
              <p style={{fontSize: 'var(--text-sm)', color: 'var(--red)', margin: 'var(--space-8) 0 0'}}>
                {typeof navigator !== 'undefined' && navigator.onLine === false
                  ? 'Sin conexión. Tu respuesta está guardada: la envío en cuanto vuelva.'
                  : 'No he podido enviarla. Tu respuesta está guardada: inténtalo otra vez en un momento.'}
              </p>
            )}

            <button onClick={enviar} disabled={!texto.trim() || enviando}
              style={{width: '100%', marginTop: 'var(--space-16)', minHeight: 48,
                background: texto.trim() ? 'var(--purple)' : 'rgba(33,29,51,0.1)',
                color: texto.trim() ? 'white' : 'var(--ink-tertiary)',   // desactivado, pero legible
                border: 'none', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)', fontWeight: 700,
                cursor: texto.trim() ? 'pointer' : 'default'}}>
              {enviando ? 'Enviando…' : 'Enviar respuesta'}
            </button>

            {/* No se puede pedir un si sin ofrecer decir que no. */}
            <p style={{fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)', textAlign: 'center',
              margin: 'var(--space-12) 0 0', lineHeight: 1.5}}>
              Si ahora no puedes, dilo sin más: se lo haré saber enseguida.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
