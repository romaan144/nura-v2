import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { requestNotificationPermission, scheduleRetentionNotifications } from '../utils/notifications'
import styles from './Login.module.css'

export default function Login() {
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useUser()
  const navigate = useNavigate()

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
      // Check if we have a name from onboarding
      const savedUser = JSON.parse(localStorage.getItem('nura_user') || 'null')
      if (savedUser?.name && savedUser.name !== 'Usuario') {
        login({ ...savedUser, phone, verified: true })
        requestNotificationPermission().then(g => { if(g) scheduleRetentionNotifications(savedUser.name) })
        const returnTo = sessionStorage.getItem('nura_return_to')
        sessionStorage.removeItem('nura_return_to')
        navigate(returnTo || '/')
      } else {
        setStep('name')
      }
    }, 700)
  }
  function handleName() {
    if (!name.trim()) return
    login({ name: name.trim(), phone, joined: new Date().toISOString() })
    sessionStorage.setItem('nura_just_registered', '1')
    requestNotificationPermission().then(granted => {
      if (granted) scheduleRetentionNotifications(name.trim())
    })
    const returnTo = sessionStorage.getItem('nura_return_to')
    sessionStorage.removeItem('nura_return_to')
    navigate(returnTo || '/')
  }

  const steps = ['phone', 'code', 'name']
  const progress = ((steps.indexOf(step) + 1) / steps.length) * 100

  return (
    <div className={styles.page}>
      {/* Background blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={styles.top}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.iso} />
        <img src="/logo-text.png" alt="Nüra" className={styles.wordmark} />
        <p className={styles.tagline}>Encuentra a la persona adecuada</p>
      </div>

      <div className={styles.card}>
        {/* Progress */}
        <div className={styles.progress}>
          <div className={styles.progressFill} style={{width:`${progress}%`}} />
        </div>

        {step === 'phone' && (
          <div className={styles.step}>
            <h2 className={styles.stepTitle}>Accede a Nüra</h2>
            <p className={styles.stepDesc}>Para contactar profesionales y guardar tu historial necesitas una cuenta. Es gratis y tarda 30 segundos.</p>
            <div className={styles.phoneRow}>
              <div className={styles.flag}>+34</div>
              <input className={styles.input} type="tel" placeholder="612 345 678"
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
                maxLength={9} autoFocus
                onKeyDown={e => e.key === 'Enter' && handlePhone()} />
            </div>
            <button className={styles.btn} onClick={handlePhone}
              disabled={phone.length < 9 || loading}>
              {loading ? <span className={styles.spinner} /> : <><ArrowRight size={17} /> Continuar</>}
            </button>
          </div>
        )}

        {step === 'code' && (
          <div className={styles.step}>
            <h2 className={styles.stepTitle}>Código de verificación</h2>
            <p className={styles.stepDesc}>Enviado al +34 {phone}. Puede tardar hasta 30 segundos.</p>
            <div className={styles.codeWrap}>
              {[0,1,2,3].map(i => (
                <div key={i} className={`${styles.codeBox} ${code.length > i ? styles.codeBoxFilled : ''}`}>
                  {code[i] || ''}
                </div>
              ))}
              <input className={styles.codeHidden} type="tel" value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,4))}
                autoFocus />
            </div>
            <button className={styles.btn} onClick={handleCode}
              disabled={code.length < 4 || loading}>
              {loading ? <span className={styles.spinner} /> : <><ArrowRight size={17} /> Verificar</>}
            </button>
            <button className={styles.link} onClick={() => { setStep('phone'); setCode('') }}>
              ← Cambiar número
            </button>
          </div>
        )}

        {step === 'name' && (
          <div className={styles.step}>
            <h2 className={styles.stepTitle}>¿Cómo te llamas?</h2>
            <p className={styles.stepDesc}>Para que los profesionales sepan quién les contacta.</p>
            <input className={styles.input} placeholder="Tu nombre completo"
              value={name} onChange={e => setName(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleName()} />
            <button className={styles.btn} onClick={handleName} disabled={!name.trim()}>
              <ArrowRight size={17} /> Crear cuenta gratis
            </button>
          </div>
        )}
      </div>

      <p className={styles.terms}>
        Al continuar aceptas los <button className={styles.termsLink}>Términos de uso</button> y la <button className={styles.termsLink}>Privacidad</button> de Nüra
      </p>
    </div>
  )
}
