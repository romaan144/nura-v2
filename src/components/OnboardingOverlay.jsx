import { useState } from 'react'
import { ArrowRight, Search, Briefcase } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './OnboardingOverlay.module.css'

export default function OnboardingOverlay({ onComplete }) {
  const [phase, setPhase]       = useState('welcome')  // welcome | name | choose
  const [finishing, setFinishing] = useState(false)
  const [name, setName]         = useState('')
  const { login }               = useUser()

  function skip() {
    localStorage.setItem('nura_onboarded', '1')
    onComplete()
  }

  function afterName() {
    const trimmed = name.trim()
    if (trimmed) {
      login({ name: trimmed, joined: new Date().toISOString() })
      sessionStorage.setItem('nura_just_onboarded', trimmed)
    }
    setPhase('choose')
  }

  function chooseSeeker() {
    localStorage.setItem('nura_onboarded', '1')
    setFinishing(true)
    setTimeout(onComplete, 360)
  }

  function choosePro() {
    localStorage.setItem('nura_onboarded', '1')
    setFinishing(true)
    setTimeout(() => { onComplete(); window.location.href = '/register-helper' }, 360)
  }

  const overlay = `${styles.overlay} ${finishing ? styles.overlayOut : ''}`

  // ── PHASE: WELCOME ────────────────────────────────────────
  if (phase === 'welcome') return (
    <div className={overlay}>
      <div className={styles.topRow}>
        <button className={styles.skip} onClick={skip}>Saltar</button>
        <button className={styles.loginLink}
          onClick={() => { skip(); window.location.href = '/login' }}>
          Ya tengo cuenta
        </button>
      </div>

      <div className={styles.content} key="welcome">
        <img src="/logo-iso.png" alt="Nüra" className={styles.welcomeIso} />
        <p className={styles.eyebrow}>ENCUENTRA A QUIEN NECESITAS</p>
        <h1 className={styles.title}>La persona adecuada,{'\n'}a un mensaje de distancia.</h1>
        <p className={styles.desc}>
          Cuéntame lo que necesitas — en tus palabras, sin formularios.
          Encuentro a la persona exacta, verificada y disponible.
        </p>
      </div>

      <div className={styles.bottom}>
        <button className={styles.primary} onClick={() => setPhase('name')}>
          Empezar <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )

  // ── PHASE: NAME ───────────────────────────────────────────
  if (phase === 'name') return (
    <div className={overlay}>
      <div className={styles.topRow}>
        <button className={styles.skip} onClick={skip}>Saltar</button>
        <button className={styles.loginLink}
          onClick={() => { skip(); window.location.href = '/login' }}>
          Ya tengo cuenta
        </button>
      </div>
      <div className={styles.namePage} key="name">
        <img src="/logo-iso.png" alt="Nüra" className={styles.nameIso} />
        <h2 className={styles.nameTitle}>¿Cómo te llamas?</h2>
        
        <input
          className={styles.nameInput}
          placeholder="Escribe tu nombre..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && afterName()}
          autoFocus
          maxLength={40}
        />
        <button className={styles.primary} onClick={afterName}>
          {name.trim() ? `Continuar, ${name.split(' ')[0]}` : 'Continuar'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )

  // ── PHASE: CHOOSE ─────────────────────────────────────────
  const firstName = name.trim().split(' ')[0] || ''
  return (
    <div className={overlay}>
      <div className={styles.chooseContent} key="choose">
        <p className={styles.chooseTitle}>
          {firstName ? `${firstName}, ¿cómo usarás Nüra?` : '¿Qué estás buscando?'}
        </p>
        <p className={styles.chooseDesc}>Puedes cambiar esto cuando quieras.</p>

        {/* Card 1 — Buscador (primary) */}
        <button className={styles.chooseCard} onClick={chooseSeeker}>
          <div className={styles.chooseCardIcon} style={{background:'rgba(123,47,255,0.08)'}}>
            <Search size={22} color="var(--purple)" strokeWidth={2} />
          </div>
          <div className={styles.chooseCardText}>
            <span className={styles.chooseCardTitle}>Necesito ayuda</span>
            <span className={styles.chooseCardSub}>Encuentra al profesional perfecto</span>
          </div>
          <ArrowRight size={16} color="var(--purple)" />
        </button>

        {/* Card 2 — Profesional */}
        <button className={`${styles.chooseCard} ${styles.chooseCardPro}`} onClick={choosePro}>
          <div className={styles.chooseCardIcon} style={{background:'rgba(0,0,0,0.04)'}}>
            <Briefcase size={22} color="rgba(0,0,0,0.5)" strokeWidth={1.8} />
          </div>
          <div className={styles.chooseCardText}>
            <span className={styles.chooseCardTitle} style={{color:'rgba(0,0,0,0.75)'}}>Quiero ofrecer mis servicios</span>
            <span className={styles.chooseCardSub}>Crea tu perfil profesional gratis</span>
          </div>
          <ArrowRight size={16} color="rgba(0,0,0,0.3)" />
        </button>
      </div>
    </div>
  )
}
