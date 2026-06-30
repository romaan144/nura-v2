import { useState, useEffect } from 'react'
import { X, ArrowRight, MessageCircle, Search, Users } from 'lucide-react'
import styles from './Onboarding.module.css'

const STEPS = [
  {
    Icon: MessageCircle,
    title: 'Describe lo que necesitas',
    desc: 'Con tus propias palabras, sin categorías ni formularios. Igual que se lo contarías a un amigo.',
  },
  {
    Icon: Search,
    title: 'Encuentra a la persona adecuada',
    desc: 'En segundos ves profesionales verificados cerca de ti, con valoraciones reales y disponibilidad.',
  },
  {
    Icon: Users,
    title: 'Habla directamente con ellos',
    desc: 'Perfiles verificados con historial real. No anuncios, no CVs inventados. Evidencia de verdad.',
  },
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('nura_onboarding_seen')
    if (!seen) setVisible(true)
  }, [])

  function finish() {
    localStorage.setItem('nura_onboarding_seen', '1')
    setVisible(false)
    onDone?.()
  }

  if (!visible) return null

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <button className={styles.skip} onClick={finish}><X size={16} /></button>

        <div className={styles.icon}><s.Icon size={32} strokeWidth={1.5} /></div>
        <h2 className={styles.title}>{s.title}</h2>
        <p className={styles.desc}>{s.desc}</p>

        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <div key={i} className={`${styles.dot} ${i === step ? styles.dotActive : ''}`} />
          ))}
        </div>

        <button
          className={styles.btn}
          onClick={() => isLast ? finish() : setStep(s => s + 1)}
        >
          {isLast ? 'Empezar' : <><span>Siguiente</span> <ArrowRight size={15} /></>}
        </button>
      </div>
    </div>
  )
}
