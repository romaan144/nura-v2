import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { requestNotificationPermission, scheduleRetentionNotifications } from '../utils/notifications'
import { Button } from '../components/ui'
import { NURA_BUILD } from '../config'

// ═══════════════════════════════════════════════════════════════
// LOGIN — reescrita desde cero.
// La anterior arrastraba diez ciclos de parches: centrado vertical,
// medidas de viewport, blobs decorativos, scrollIntoView, reglas
// duplicadas en media queries. Nada de eso vuelve.
// Aqui solo hay un contenedor que ocupa lo que le dan y desplaza si
// hace falta, con el contenido apilado de arriba abajo.
// ═══════════════════════════════════════════════════════════════

const S = {
  // La estructura no se toca: contenedor con altura del padre y flujo
  // normal. Todo lo que sigue es superficie, no colocacion.
  page: {
    height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    // El degradado va en el FONDO, no en un elemento posicionado: cero
    // riesgo para el layout.
    background: `radial-gradient(680px 320px at 80% -6%, rgba(123,47,255,0.10), transparent 62%),
                 radial-gradient(560px 280px at 10% 2%, rgba(255,59,92,0.07), transparent 60%),
                 var(--paper)`,
    padding: 'var(--space-28) var(--space-20) calc(var(--nav-h) + var(--space-24))',
  },
  inner: { maxWidth: '380px', margin: '0 auto' },

  logo: { width: '54px', height: '54px', display: 'block', margin: '0 auto' },
  marca: {
    fontFamily: 'var(--font-voice)', fontSize: 'var(--text-xl)', fontWeight: 700,
    letterSpacing: '-0.9px', color: 'var(--ink)', textAlign: 'center',
    margin: 'var(--space-12) 0 var(--space-4)',
  },
  lema: {
    fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)',
    textAlign: 'center', margin: '0 0 var(--space-24)', letterSpacing: '-0.1px',
  },

  // La tarjeta: la piel canon de la app (curva 18, sombra de reposo)
  card: {
    background: 'white', border: '1px solid var(--ink-border)',
    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)',
    padding: 'var(--space-20) var(--space-20) var(--space-24)',
  },
  pasos: { display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-20)' },
  paso: hecho => ({
    height: '3px', flex: 1, borderRadius: '99px',
    background: hecho ? 'var(--purple)' : 'var(--surface-muted)',
    transition: 'background 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
  }),

  titulo: {
    fontFamily: 'var(--font-voice)', fontSize: 'var(--text-heading)', fontWeight: 700,
    letterSpacing: '-0.6px', color: 'var(--ink)', margin: '0 0 var(--space-6)',
  },
  ayuda: {
    fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)',
    margin: '0 0 var(--space-16)', lineHeight: 1.5,
  },
  campo: {
    width: '100%', boxSizing: 'border-box',
    border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-card)',
    padding: 'var(--space-14) var(--space-16)',
    fontSize: '16px',   // 16px: por debajo, iOS hace zoom al enfocar
    fontFamily: 'inherit', color: 'var(--ink)',
    background: 'var(--paper)', outline: 'none',
    marginBottom: 'var(--space-12)',
  },
  volver: {
    background: 'none', border: 'none', color: 'var(--ink-tertiary)',
    fontSize: 'var(--text-sm)', fontFamily: 'inherit',
    padding: 'var(--space-14) 0 0', cursor: 'pointer', width: '100%',
  },

  // La confianza, donde mas se duda: antes de dar el telefono
  confianza: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 'var(--space-6)', margin: 'var(--space-16) 0 0',
    fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)', textAlign: 'center',
  },
  sello: {
    textAlign: 'center', fontSize: 'var(--text-xs)',
    color: 'var(--ink-tertiary)', marginTop: 'var(--space-20)', opacity: 0.7,
  },
}

const PASO = { phone: 0, code: 1, name: 2 }

export default function Login() {
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useUser()
  const navigate = useNavigate()

  const salir = () => {
    const returnTo = sessionStorage.getItem('nura_return_to')
    sessionStorage.removeItem('nura_return_to')
    navigate(returnTo || '/')
  }

  function handlePhone() {
    if (phone.length < 9) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setStep('code') }, 900)
  }

  function handleCode() {
    if (code.length < 4) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      const savedUser = JSON.parse(localStorage.getItem('nura_user') || 'null')
      if (savedUser?.name && savedUser.name !== 'Usuario') {
        login({ ...savedUser, phone, verified: true })
        requestNotificationPermission().then(g => { if (g) scheduleRetentionNotifications(savedUser.name) })
        salir()
      } else {
        setStep('name')
      }
    }, 700)
  }

  function handleName() {
    if (!name.trim()) return
    login({ name: name.trim(), phone, joined: new Date().toISOString() })
    sessionStorage.setItem('nura_just_registered', '1')
    requestNotificationPermission().then(g => { if (g) scheduleRetentionNotifications(name.trim()) })
    salir()
  }

  return (
    <div style={S.page}>
      <div style={S.inner}>
        <img src="/logo-iso.png" alt="" style={S.logo} />
        <div style={S.marca}>Nüra</div>
        <p style={S.lema}>Encuentra a la persona adecuada</p>

        <div style={S.card}>
          <div style={S.pasos}>
            {[0, 1, 2].map(i => <div key={i} style={S.paso(i <= PASO[step])} />)}
          </div>

          {step === 'phone' && (
            <>
              <h1 style={S.titulo}>Tu teléfono</h1>
              <p style={S.ayuda}>Te enviamos un código para confirmar que eres tú.</p>
              <input style={S.campo} type="tel" inputMode="numeric" placeholder="612 345 678"
                value={phone} maxLength={9}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') handlePhone() }} />
              <Button variant="primary" full onClick={handlePhone} disabled={phone.length < 9 || loading}>
                {loading ? 'Enviando…' : 'Continuar'}
              </Button>
            </>
          )}

          {step === 'code' && (
            <>
              <h1 style={S.titulo}>Tu código</h1>
              <p style={S.ayuda}>Te lo hemos enviado al {phone}.</p>
              <input style={{ ...S.campo, letterSpacing: '10px', textAlign: 'center', fontSize: '24px', fontWeight: 700 }}
                type="tel" inputMode="numeric" placeholder="0000" value={code} maxLength={4}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyDown={e => { if (e.key === 'Enter') handleCode() }} />
              <Button variant="primary" full onClick={handleCode} disabled={code.length < 4 || loading}>
                {loading ? 'Comprobando…' : 'Entrar'}
              </Button>
              <button style={S.volver} onClick={() => { setStep('phone'); setCode('') }}>
                Cambiar de número
              </button>
            </>
          )}

          {step === 'name' && (
            <>
              <h1 style={S.titulo}>¿Cómo te llamas?</h1>
              <p style={S.ayuda}>Así sabrán quién les escribe.</p>
              <input style={S.campo} placeholder="Tu nombre" value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleName() }} />
              <Button variant="primary" full onClick={handleName} disabled={!name.trim()}>
                Entrar en Nüra
              </Button>
            </>
          )}
        </div>

        <p style={S.confianza}>
          🔒 Tu teléfono no se muestra a nadie. Solo sirve para entrar.
        </p>

        <div style={S.sello}>{NURA_BUILD}</div>
      </div>
    </div>
  )
}
