import glass from '../components/ui/glass'
import ErrorPanel from '../components/ErrorPanel'
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
import { ArrowLeft } from 'lucide-react'
import cabecera from '../components/PageHeader.module.css'
import { hayPasoAnterior } from '../utils/volver'
import { abrirAviso, responderAviso, misAvisos, porLaFuncion } from '../utils/escrituras'
import { DEMO_MODE } from '../config'
import { refrescarSinContestar } from '../utils/sinContestar'
import { yaPaso } from '../utils/citaAviso'
import { partesDelAviso } from '../utils/mensajeAviso'

// RESPUESTAS RAPIDAS: en el movil escribir cuesta. Rellenan la caja (no
// envian): la profesional las retoca y decide. Si el mensaje es una
// propuesta de cita, las del sí/no a esa cita.
// Con una cita PENDIENTE se contesta con sus dos botones (aceptar / no me va
// bien): la rápida «Me va bien» solo escribía el texto y, al enviarlo, la
// cita se quedaba sin aceptar aunque el profesional creyera que sí.
function rapidasPara(mensaje, cita, decision) {
  if (cita?.estado === 'propuesta') {
    if (decision !== 'rechazada') return []
    return [
      ['Proponer otro día', 'Ese momento no me va bien. ¿Te iría bien el '],
      ['No puedo', 'Lo siento, estos días no tengo hueco. Si quieres, Nüra te ayuda a encontrar a otra persona.'],
    ]
  }
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
// «Viernes, 2 de octubre»: solo la primera en mayúscula (el CSS
// `capitalize` daba «2 De Octubre»).
const mayus = t => t.charAt(0).toUpperCase() + t.slice(1)

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
  // El servidor no confirmó la cita porque su hora ya había pasado.
  const [pasadaServidor, setPasadaServidor] = useState(false)
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
  // Le propusieron una hora que ya pasó sin que contestara: no se puede
  // aceptar (antes el botón seguía ahí). Se le ofrece proponer otro día, y
  // al enviar la cita queda como «no le va bien» para quien la pidió.
  const caducada = aviso?.cita?.estado === 'propuesta' && yaPaso(aviso.cita.fecha, aviso.cita.hora) === true
  const decisionVista = caducada ? 'rechazada' : decision

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
    if (estado !== 'enviado' || (!porLaFuncion() && !DEMO_MODE)) return
    let vivo = true
    ;(async () => {
      const { sesionActual } = await import('../utils/cuenta')
      // En la demo no hay cuenta: los mensajes de ejemplo vienen igual.
      const sesion = DEMO_MODE ? 'demo' : (await sesionActual())?.access_token
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
    const r = await responderAviso(token, cuerpo, decision || (caducada ? 'rechazada' : undefined))
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
    if (r?.ok && r.cita === 'hora pasada') setPasadaServidor(true)
    if (r?.ok) {
      refrescarSinContestar()   // uno menos en su barra
      try { localStorage.removeItem(BORRADOR) } catch { /* nada */ }
    }
  }

  const marco = {
    height: 'var(--app-layout-height, 100dvh)', overflowY: 'auto', background: 'var(--paper)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: 'max(env(safe-area-inset-top,0px),24px) var(--space-20) var(--space-32)',
  }
  const caja = {
    width: '100%', maxWidth: 520,
    // Cristal, como el resto del sistema. Esta caja es, casi siempre, la
    // primera impresion de un profesional con Nüra.
    background: 'var(--glass-panel)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    backdropFilter: 'blur(20px) saturate(160%)',
    borderRadius: 'var(--radius-xl)', border: '1px solid var(--ink-border)',
    boxShadow: 'var(--glass-panel-shadow)',
    padding: 'var(--space-28)',
  }

  if (estado === 'cargando') {
    return <div style={{...marco, justifyContent: 'center'}}>
      <img src="/logo-iso.png" alt="" style={{width: 40, opacity: 0.35}} />
    </div>
  }

  if (estado === 'sinred') {
    return <div style={{...marco, justifyContent: 'center'}}>
      <ErrorPanel
        title="No he podido abrir el mensaje"
        hint="Parece un problema de conexión. Puedes intentarlo de nuevo."
        actionLabel="Reintentar"
        onAction={() => { setEstado('cargando'); setIntento(n => n + 1) }}
      />
    </div>
  }

  if (estado === 'error') {
    return <div style={{...marco, justifyContent: 'center'}}>
      <ErrorPanel
        title="Este enlace ya no está disponible"
        hint="Puede que sea antiguo o que se haya copiado a medias. Vuelve a abrir el enlace del mensaje que recibiste."
      />
    </div>
  }

  const nombre = (aviso?.nombre || '').split(' ')[0]

  return (
    <div className="nura-service-flow" style={marco}>
      {/* Quien llega desde su bandeja (dentro de Nüra) puede volver a ella
          (Sergio, 2026-10-02). Desde el enlace del aviso no hay a dónde. */}
      {hayPasoAnterior() && (
        <button type="button" className={cabecera.circleBtn} onClick={() => navigate(-1)} aria-label="Volver"
          style={{ position: 'fixed', zIndex: 5, top: 'max(env(safe-area-inset-top, 0px), 12px)', left: 16 }}>
          <ArrowLeft size={18} />
        </button>
      )}
      <span className="nura-wordmark" style={{marginBottom: 24}}>Nüra</span>
      <div style={caja}>
        <p style={{fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', margin: '0 0 var(--space-12)'}}>
          {nombre ? `Hola, ${nombre}. Alguien te necesita.` : 'Alguien te necesita.'}
        </p>

        {/* Lo que dice la persona, lo primero y más grande; lo que añade Nüra,
            pequeño. Sin el «Hola, Laura. Soy Nüra.» del aviso: ya saluda la
            línea de arriba (ver utils/mensajeAviso). */}
        <div style={{
          background: 'var(--glass-control)', borderRadius: 'var(--radius-card)',
          padding: 'var(--space-16)', margin: '0 0 var(--space-20)',
          fontSize: 'var(--text-base)', lineHeight: 1.6,
          color: 'var(--ink-primary)',
        }}>
          {partesDelAviso(aviso?.mensaje).length ? partesDelAviso(aviso?.mensaje).map((p, i) => (
            p.tipo === 'corte' ? <hr key={i} style={{ border: 0, borderTop: '1px solid var(--ink-border)', margin: 'var(--space-12) 0' }} />
            : p.tipo === 'suyo' ? (
              <p key={i} style={{ margin: '0 0 var(--space-10)', paddingLeft: 'var(--space-12)', borderLeft: '3px solid var(--purple)',
                fontSize: 'var(--text-md)', lineHeight: 1.55, color: 'var(--ink-primary)', whiteSpace: 'pre-wrap' }}>
                {p.texto.replace(/^«|»$/g, '')}
              </p>
            ) : (
              <p key={i} style={{ margin: '0 0 var(--space-8)', fontSize: 'var(--text-sm)', lineHeight: 1.5, color: 'var(--ink-secondary)' }}>{p.texto}</p>
            )
          )) : <span style={{ whiteSpace: 'pre-wrap' }}>{aviso?.mensaje}</span>}
        </div>

        {aviso?.cita?.estado === 'cancelada' && (
          <div role="status" style={{ border: '1px solid var(--ink-border)', background: 'var(--glass-control)',
            borderRadius: 'var(--radius-card)', padding: 'var(--space-14) var(--space-16)', margin: '0 0 var(--space-16)' }}>
            <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--red-ink)' }}>Cita cancelada</p>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--ink-primary)', lineHeight: 1.5 }}>
              {aviso.cita.cancela === 'profesional' ? 'Cancelaste' : 'Ha cancelado'} la cita del {cuandoCita(aviso.cita).replace(' · ', ' a las ')}. Esa hora vuelve a estar libre en tu agenda.
            </p>
          </div>
        )}

        {estado === 'enviado' ? (
          <div style={{textAlign: 'center', padding: 'var(--space-12) 0'}}>
            <p style={{fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--green)', margin: '0 0 var(--space-8)'}}>
              {decision === 'aceptada' && !ocupada && !pasadaServidor ? 'Cita confirmada' : 'Respuesta enviada'}
            </p>
            {decision === 'aceptada' && !ocupada && !pasadaServidor && aviso?.cita && (
              <p style={{fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--ink-primary)', margin: '0 0 var(--space-8)'}}>
                {mayus(cuandoCita(aviso.cita))}
              </p>
            )}
            {ocupada && (
              <p style={{fontSize: 'var(--text-sm)', color: 'var(--red-ink)', margin: '0 0 var(--space-8)'}}>
                Tu respuesta ha llegado, pero esa hora acababa de ocuparse: la cita no ha quedado confirmada.
              </p>
            )}
            {pasadaServidor && (
              <p style={{fontSize: 'var(--text-sm)', color: 'var(--red-ink)', margin: '0 0 var(--space-8)'}}>
                Tu respuesta ha llegado, pero esa hora ya había pasado: la cita no ha quedado confirmada. Se lo digo para que te proponga otro día.
              </p>
            )}
            <p style={{fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', margin: 0, lineHeight: 1.6}}>
              Se la hago llegar. Si quiere seguir contigo, te aviso.
            </p>
            {despues?.conCuenta && (
              <button className="nura-glass-action" onClick={() => navigate(despues.siguiente ? `/r/${despues.siguiente}` : '/chats')}
                style={{ marginTop: 'var(--space-20)',
              width: '100%',
              minHeight: 48,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'var(--text-base)',
              fontWeight: 700,
              ...(glass.primary) }}>
                {despues.siguiente
                  ? `Siguiente mensaje sin contestar${despues.quedan > 1 ? ` (${despues.quedan})` : ''}`
                  : 'Volver a mis mensajes'}
              </button>
            )}
            {despues?.conCuenta && despues.siguiente && (
              <button type="button" onClick={() => navigate('/chats')}
                style={{ marginTop: 'var(--space-8)', width: '100%', minHeight: 44, border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--purple-ink)' }}>
                Volver a mis mensajes
              </button>
            )}
            {despues && !despues.conCuenta && (
              <div style={{ marginTop: 'var(--space-24)', padding: 'var(--space-16)', borderRadius: 'var(--radius-card)',
                background: 'var(--glass-control)', textAlign: 'left' }}>
                <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink-primary)' }}>
                  ¿Quieres verlo todo en un sitio?
                </p>
                <p style={{ margin: '0 0 var(--space-12)', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
                  Con tu acceso ves aquí todo lo que te escriban y te aviso en el móvil. Funciona con el correo que diste al darte de alta; si diste un teléfono, de momento sigue contestando desde estos enlaces.
                </p>
                <button className="nura-glass-action" onClick={() => navigate('/entrar?modo=crear&pro=1&volver=/chats')}
                  style={{ width: '100%',
              minHeight: 44,
              cursor: 'pointer',
              color: 'var(--purple)',
              fontFamily: 'inherit',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              ...(glass.control) }}>
                  Crear mi acceso
                </button>
                <button className="nura-glass-action" onClick={() => navigate('/entrar?pro=1&volver=/chats')}
                  style={{ width: '100%',
              minHeight: 40,
              marginTop: 'var(--space-6)',
              cursor: 'pointer',
              color: 'var(--ink-secondary)',
              fontFamily: 'inherit',
              fontSize: 'var(--text-sm)',
              ...(glass.control) }}>
                  Ya tengo acceso: entrar
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {caducada && (
              <div role="status" style={{ border: '1px solid var(--ink-border)', background: 'var(--glass-control)',
                borderRadius: 'var(--radius-card)', padding: 'var(--space-14) var(--space-16)', margin: '0 0 var(--space-16)' }}>
                <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ink-secondary)' }}>Esa hora ya pasó</p>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--ink-primary)', lineHeight: 1.5 }}>
                  Te propuso el {cuandoCita(aviso.cita).replace(' · ', ' a las ')}. Si aún puedes ayudarle, proponle otro día.
                </p>
              </div>
            )}
            {aviso?.cita?.estado === 'propuesta' && !caducada && decision !== 'rechazada' && (
              <div style={{ border: '1px solid var(--purple-30, rgba(123,47,255,0.3))', background: 'var(--purple-05, #F7F3FF)',
                borderRadius: 'var(--radius-card)', padding: 'var(--space-14) var(--space-16)', margin: '0 0 var(--space-16)' }}>
                <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--purple-ink)' }}>Te propone una cita</p>
                <p style={{ margin: '0 0 var(--space-12)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--ink-primary)' }}>
                  {mayus(cuandoCita(aviso.cita))}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
                  <button className="nura-glass-action" type="button" disabled={enviando}
                    onClick={() => { setDecision('aceptada'); enviarAceptando.current = true }}
                    style={{ flex: 1,
              minHeight: 44,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              ...(glass.primary) }}>
                    {enviando && decision === 'aceptada' ? 'Confirmando…' : 'Aceptar la cita'}
                  </button>
                  <button className="nura-glass-action" type="button" disabled={enviando}
                    onClick={() => {
                      setDecision('rechazada')
                      if (!texto.trim()) setTexto('Esa hora no me va bien. ¿Te iría bien ')
                      requestAnimationFrame(() => { const t = document.getElementById('respuesta'); t?.focus(); t?.setSelectionRange(t.value.length, t.value.length) })
                    }}
                    style={{ flex: 1,
              minHeight: 44,
              cursor: 'pointer',
              color: 'var(--ink-primary)',
              fontFamily: 'inherit',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              ...(glass.control) }}>
                    No me va bien
                  </button>
                </div>
              </div>
            )}
            {decision === 'rechazada' && !caducada && aviso?.cita && (
              <p style={{ margin: '0 0 var(--space-10)', fontSize: 'var(--text-sm)', color: ocupada ? 'var(--red-ink)' : 'var(--ink-secondary)', lineHeight: 1.5 }}>
                {ocupada ? 'Esa hora ya la tienes aceptada con otra persona. ' : ''}Dile qué otro día u hora te va bien.
              </p>
            )}
            <label htmlFor="respuesta" style={{display: 'block', fontSize: 'var(--text-sm)',
              fontWeight: 700, color: 'var(--ink-secondary)', margin: '0 0 var(--space-8)'}}>
              Tu respuesta
            </label>
            {rapidasPara(aviso?.mensaje, aviso?.cita, decisionVista).length > 0 && (
            <div role="group" aria-label="Respuestas rápidas" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', margin: '0 0 var(--space-10)' }}>
              {rapidasPara(aviso?.mensaje, aviso?.cita, decisionVista).map(([etiqueta, frase]) => (
                <button className="nura-glass-action" key={etiqueta} type="button"
                  onClick={() => { setTexto(frase); requestAnimationFrame(() => { const t = document.getElementById('respuesta'); t?.focus(); t?.setSelectionRange(frase.length, frase.length) }) }}
                  style={{ minHeight: 36,
              padding: '0 var(--space-12)',
              cursor: 'pointer',
              color: 'var(--ink-primary)',
              fontFamily: 'inherit',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              ...(glass.control) }}>
                  {etiqueta}
                </button>
              ))}
            </div>
            )}
            <textarea className="nura-glass-field" id="respuesta" value={texto} onChange={e => setTexto(e.target.value)} rows={5}
              placeholder="Puedes decir si tienes hueco, cuándo, o simplemente que ahora no puedes."
              style={{ width: '100%',
              boxSizing: 'border-box',
              padding: 'var(--space-12) var(--space-14)',
              fontSize: 'var(--text-base)',
              lineHeight: 1.6,
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              ...(glass.field) }} />

            {estado === 'fallo' && (
              <p style={{fontSize: 'var(--text-sm)', color: 'var(--red)', margin: 'var(--space-8) 0 0'}}>
                {typeof navigator !== 'undefined' && navigator.onLine === false
                  ? 'Sin conexión. Tu respuesta está guardada: la envío en cuanto vuelva.'
                  : 'No he podido enviarla. Tu respuesta está guardada: inténtalo otra vez en un momento.'}
              </p>
            )}

            <button className="nura-glass-action" onClick={enviar} disabled={!texto.trim() || enviando}
              style={{ width: '100%',
              marginTop: 'var(--space-16)',
              minHeight: 48,
              color: texto.trim() ? 'white' : 'var(--ink-tertiary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              cursor: texto.trim() ? 'pointer' : 'default',
              ...(texto.trim() ? glass.primary : glass.disabled) }}>
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
