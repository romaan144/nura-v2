import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Send, Sparkles } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { HELPERS } from '../data/helpers'
import { DEMO_ENRICHMENTS } from '../data/demoEnrichments'
import { buildIntroLetter, regenerateIntroLetter } from '../utils/introLetter'
import styles from './IntroLetter.module.css'

export default function IntroLetter() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const textareaRef = useRef(null)

  const passedHelper = location.state?.helper
  const helper = passedHelper && passedHelper.id >= 2000 && DEMO_ENRICHMENTS[passedHelper.id]
    ? { ...DEMO_ENRICHMENTS[passedHelper.id], ...passedHelper }
    : passedHelper || HELPERS.find(h => String(h.id) === String(id))

  const analysis = location.state?.analysis || null
  const userQuery = location.state?.userQuery || window.__nuraLastQuery || ''

  const [letter, setLetter] = useState(() =>
    buildIntroLetter({ helper, analysis, userQuery, user })
  )
  const [regenCount, setRegenCount] = useState(0)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [letter])

  if (!helper) return (
    <div className={styles.page}>
      <div className={styles.notFound}>Perfil no encontrado.</div>
    </div>
  )

  const firstName = helper.name?.split(' ')?.[0] || ''

  function handleRegenerate() {
    const next = regenCount % 2 === 0
      ? regenerateIntroLetter({ helper, analysis, userQuery, user })
      : buildIntroLetter({ helper, analysis, userQuery, user })
    setLetter(next)
    setRegenCount(c => c + 1)
  }

  function handleSend() {
    setSending(true)
    setTimeout(() => {
      navigate(`/chat/${helper.id}`, {
        state: { helper, introLetterText: letter, userQuery },
        replace: true
      })
    }, 350)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div className={styles.headerTitle}>Carta de presentación</div>
        <div style={{ width: 38 }} />
      </header>

      <div className={styles.scroll}>
        <div className={styles.introBlock}>
          <div className={styles.sparkleIcon}><Sparkles size={15} /></div>
          <p className={styles.introText}>
            He escrito esto para presentarte a <strong>{firstName}</strong>, basándome en lo que me has contado.
            Puedes editarlo, regenerarlo o enviarlo tal cual.
          </p>
        </div>

        <div className={styles.helperChip}>
          {helper.avatarUrl
            ? <img src={helper.avatarUrl} alt={helper.name} className={styles.helperAvatar} />
            : <div className={styles.helperAvatarFallback} style={{ background: helper.avatarColor || 'var(--purple)' }}>
                {helper.avatar || helper.name?.[0]}
              </div>
          }
          <div>
            <div className={styles.helperName}>{helper.name}</div>
            <div className={styles.helperSpecialty}>{helper.specialty}</div>
          </div>
        </div>

        <div className={styles.letterCard}>
          <textarea
            ref={textareaRef}
            className={styles.letterText}
            value={letter}
            onChange={e => setLetter(e.target.value)}
            rows={1}
          />
        </div>

        <button className={styles.regenBtn} onClick={handleRegenerate}>
          <RotateCcw size={14} /> Regenerar mensaje
        </button>
      </div>

      <div className={styles.floatBottom}>
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!letter.trim() || sending}
        >
          {sending ? 'Enviando...' : <>Enviar a {firstName} <Send size={15} /></>}
        </button>
      </div>
    </div>
  )
}
