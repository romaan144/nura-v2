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
  page: {
    height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    background: 'var(--paper)',
    padding: 'var(--space-24) var(--space-20) calc(var(--nav-h) + var(--space-24))',
  },
  inner: { maxWidth: '380px', margin: '0 auto' },
  logo: { width: '52px', height: '52px', display: 'block', margin: '0 auto' },
  marca: {
    fontFamily: 'var(--font-voice)', fontSize: 'var(--text-xl)', fontWeight: 700,
    letterSpacing: '-0.8px', color: 'var(--ink)', textAlign: 'center',
    margin: 'var(--space-12) 0 var(--space-4)',
  },
  lema: {
    fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)',
    textAlign: 'center', margin: '0 0 var(--space-28)',
  },
  titulo: { fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--ink)', margin: '0 0 var(--space-6)' },
  ayuda: { fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', margin: '0 0 var(--space-16)', lineHeight: 1.5 },
  campo: {
    width: '100%', boxSizing: 'border-box',
    border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-card)',
    padding: 'var(--space-14) var(--space-16)',
    fontSize: '16px',
    fontFamily: 'inherit', color: 'var(--ink)',
    background: 'white', outline: 'none', marginBottom: 'var(--space-12)',
  },
  volver: {
    background: 'none', border: 'none', color: 'var(--ink-tertiary)',
    fontSize: 'var(--text-sm)', fontFamily: 'inherit',
    padding: 'var(--space-12) 0 0', cursor: 'pointer', width: '100%',
  },
  sello: { textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)', marginTop: 'var(--space-24)' },
}

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
            <input style={{ ...S.campo, letterSpacing: '8px', textAlign: 'center', fontSize: '22px' }}
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

        <div style={S.sello}>{NURA_BUILD}</div>
      </div>
    </div>
  )
}
