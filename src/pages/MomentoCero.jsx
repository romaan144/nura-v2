import { useState, useEffect } from 'react'
import styles from './MomentoCero.module.css'

// Historias reales y específicas — varían por hora del día
function getStory() {
  const hour = new Date().getHours()
  const stories = [
    {
      need: 'Mi madre tiene Alzheimer y vive sola. Necesito alguien de confianza para las mañanas.',
      person: 'Sergio, 34 años · Eixample',
      match: 'Elena Fernández',
      matchDetail: 'Cuidadora especializada · 12 años · 164 valoraciones',
      result: 'Primera sesión esta semana. Sergio pudo volver al trabajo tranquilo.',
      timeAgo: 'hace 2 horas',
      avatar: 'EF',
      color: 'var(--purple)',
    },
    {
      need: 'Mi hijo de 5 años no pronuncia bien la R. Necesito un logopeda cerca.',
      person: 'María, 31 años · Gràcia',
      match: 'Carlos Martínez',
      matchDetail: 'Logopeda infantil · 8 años · 127 valoraciones',
      result: 'Encontrado en 47 segundos. Empezaron al día siguiente.',
      timeAgo: 'hace 4 horas',
      avatar: 'CM',
      color: '#1A56DB',
    },
    {
      need: 'Tengo una fuga de agua en el baño. Urgente, no sé a quién llamar.',
      person: 'Jordi, 45 años · Sarrià',
      match: 'Antoni Pérez',
      matchDetail: 'Fontanero · 15 años · 156 valoraciones',
      result: 'Resuelto en 90 minutos. Sin sorpresas en el precio.',
      timeAgo: 'hace 1 hora',
      avatar: 'AP',
      color: '#059669',
    },
    {
      need: 'Me han despedido hoy. Necesito un abogado laboralista urgente.',
      person: 'Laura, 28 años · Poble Nou',
      match: 'Joan Mir',
      matchDetail: 'Abogado laboralista · 14 años · 124 valoraciones',
      result: 'Primera consulta gratuita ese mismo día.',
      timeAgo: 'hace 3 horas',
      avatar: 'JM',
      color: '#D97706',
    },
  ]
  return stories[hour % stories.length]
}

const PHASES = ['need', 'analyzing', 'match', 'result']
const PHASE_DURATION = [1400, 1000, 1200, 1200]

export default function MomentoCero({ onFinish }) {
  const [phase, setPhase] = useState(0)
  const [story] = useState(getStory)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let elapsed = 0
    const timers = PHASE_DURATION.map((duration, i) => {
      elapsed += i === 0 ? 0 : PHASE_DURATION[i - 1]
      return setTimeout(() => setPhase(i), elapsed)
    })

    // Fade out and finish
    const total = PHASE_DURATION.reduce((a, b) => a + b, 0)
    const t1 = setTimeout(() => setVisible(false), total + 200)
    const t2 = setTimeout(() => onFinish?.(), total + 600)

    return () => [...timers, t1, t2].forEach(clearTimeout)
  }, [])

  return (
    <div className={`${styles.page} ${!visible ? styles.fadeOut : ''}`}>

      {/* Background pulse */}
      <div className={styles.bgPulse} />

      {/* Logo top */}
      <div className={styles.logoRow}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.logoIso} />
        <span className={styles.logoText}>Nüra</span>
      </div>

      {/* Main card */}
      <div className={styles.card}>

        {/* Phase: need */}
        <div className={`${styles.block} ${phase >= 0 ? styles.in : ''}`}>
          <div className={styles.personRow}>
            <div className={styles.personDot} />
            <span className={styles.personLabel}>{story.person}</span>
            <span className={styles.timeAgo}>{story.timeAgo}</span>
          </div>
          <p className={styles.needText}>"{story.need}"</p>
        </div>

        {/* Phase: analyzing */}
        {phase >= 1 && (
          <div className={`${styles.block} ${styles.analyzingBlock} ${styles.in}`}>
            <div className={styles.analyzingDots}>
              <span /><span /><span />
            </div>
            <span className={styles.analyzingText}>Nüra analizando…</span>
          </div>
        )}

        {/* Phase: match */}
        {phase >= 2 && (
          <div className={`${styles.block} ${styles.matchBlock} ${styles.in}`}>
            <div className={styles.matchAvatar} style={{ background: story.color }}>
              {story.avatar}
            </div>
            <div className={styles.matchInfo}>
              <div className={styles.matchName}>{story.match}</div>
              <div className={styles.matchDetail}>{story.matchDetail}</div>
            </div>
            <div className={styles.matchCheck}>✓</div>
          </div>
        )}

        {/* Phase: result */}
        {phase >= 3 && (
          <div className={`${styles.block} ${styles.resultBlock} ${styles.in}`}>
            <span className={styles.resultEmoji}>🤍</span>
            <span className={styles.resultText}>{story.result}</span>
          </div>
        )}

      </div>

      {/* Bottom label */}
      <p className={styles.bottomLabel}>
        Esto ocurre en Nüra cada día
      </p>

    </div>
  )
}
