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

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { abrirAviso, responderAviso } from '../utils/escrituras'

export default function Responder() {
  const { token } = useParams()
  const [estado, setEstado] = useState('cargando')   // cargando|listo|enviado|fallo|error
  const [aviso, setAviso] = useState(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let vivo = true
    abrirAviso(token).then(r => {
      if (!vivo) return
      if (r?.ok && r.aviso) {
        setAviso(r.aviso)
        // Si ya contesto, no se le pide otra vez.
        setEstado(r.aviso.respuesta ? 'enviado' : 'listo')
        if (r.aviso.respuesta) setTexto(r.aviso.respuesta)
      } else setEstado('error')
    })
    return () => { vivo = false }
  }, [token])

  async function enviar() {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    const r = await responderAviso(token, texto.trim())
    setEnviando(false)
    // Si falla, se dice. Un "enviado" falso deja a una familia esperando
    // una respuesta que no existe.
    setEstado(r?.ok ? 'enviado' : 'fallo')
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

        {estado === 'enviado' ? (
          <div style={{textAlign: 'center', padding: 'var(--space-12) 0'}}>
            <p style={{fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--green)', margin: '0 0 var(--space-8)'}}>
              Respuesta enviada
            </p>
            <p style={{fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', margin: 0, lineHeight: 1.6}}>
              Se la hago llegar. Si quiere seguir contigo, te aviso.
            </p>
          </div>
        ) : (
          <>
            <label htmlFor="respuesta" style={{display: 'block', fontSize: 'var(--text-sm)',
              fontWeight: 700, color: 'var(--ink-secondary)', margin: '0 0 var(--space-8)'}}>
              Tu respuesta
            </label>
            <textarea id="respuesta" value={texto} onChange={e => setTexto(e.target.value)} rows={5}
              placeholder="Puedes decir si tienes hueco, cuándo, o simplemente que ahora no puedes."
              style={{width: '100%', boxSizing: 'border-box', padding: 'var(--space-12) var(--space-14)',
                border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-card)',
                fontSize: 'var(--text-base)', lineHeight: 1.6, fontFamily: 'inherit',
                background: 'var(--surface-subtle)', resize: 'vertical', outline: 'none'}} />

            {estado === 'fallo' && (
              <p style={{fontSize: 'var(--text-sm)', color: 'var(--red)', margin: 'var(--space-8) 0 0'}}>
                No he podido enviarla. Inténtalo otra vez en un momento.
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
              Si ahora no puedes, dilo sin más. Buscaré a otra persona.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
