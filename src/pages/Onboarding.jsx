import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { ArrowRight, MessageCircle, Brain, Users, Sparkles, Shield, Zap } from 'lucide-react'
import styles from './Onboarding.module.css'

// ── LA PROMESA ───────────────────────────────────────────────────────────
//
// Antes eran CUATRO pantallas antes de dejar hacer nada, y la primera decia:
// "La IA que conecta personas reales · Cuéntale a Nüra lo que necesitas con
// tus palabras."
//
// Suena bien y NO DICE QUE HACE. "Conecta personas reales" puede ser una red
// social, una app de citas o un foro. El fundador lo resumio: "la gente al
// entrar no sabe de que va".
//
// Ahora DOS pantallas, y la primera nombra cosas concretas. Un fontanero.
// Alguien que cuide a tu madre. Un profesor para tu hijo. Nadie entiende
// "profesional ideal"; todo el mundo entiende "se me ha roto la caldera".
//
// Las dos que se retiran —verificacion de identidad y presencial/online— no
// desaparecen: se cuentan cuando importan, en la ficha de cada profesional,
// no antes de que nadie sepa para que sirve la app.
const STEPS = [
  {
    Visual: Sparkles,
    eyebrow: 'HOLA',
    title: '¿A quién llamarías\npara esto?',
    desc: 'Se te ha roto la caldera. Tu madre necesita a alguien que la cuide. Tu hijo no pronuncia bien. Cuéntamelo con tus palabras y te digo a quién llamar.',
  },
  {
    Visual: null,
    eyebrow: 'EMPECEMOS',
    title: '¿Qué necesitas?',
    desc: 'Escríbelo como se lo contarías a un amigo. Ya lo entiendo yo.',
    isIntentCapture: true,
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [showName, setShowName] = useState(false)
  const [intentQuery, setIntentQuery] = useState('')
  const navigate = useNavigate()
  const { login } = useUser()

  // Marcar como vista al MOSTRARLA, no al terminarla: si alguien abandona a
  // medias no debe volver a encontrarsela cada vez que abra la app.
  useEffect(() => {
    try { localStorage.setItem('nura_onboarded', '1') } catch { /* sin almacenamiento */ }
  }, [])

  function finish(isHelper) {
    localStorage.setItem('nura_onboarded', '1')
    // Home LEE `nura_just_onboarded` para dar el saludo con el nombre —el
    // "primer momento magico"— y nadie lo escribia: el saludo estaba
    // programado y no se disparaba jamas.
    try { sessionStorage.setItem('nura_just_onboarded', name.trim()) } catch { /* sin almacenamiento */ }
    // MISMA CUENTA POR LAS TRES PUERTAS. Login y RegisterHelper guardaban
    // `joined`; esta no. Quien entraba por el onboarding se quedaba sin el
    // "En Nüra desde marzo" de su perfil, sin que nadie lo hubiera decidido.
    // NADIE SE LLAMA "USUARIO". Si alguien salta el paso del nombre, la app
    // le saludaba con "Buenos dias, Usuario" — el primer saludo de un
    // producto que va de calidez humana. Sin nombre, Nüra no inventa uno:
    // saluda sin el.
    login({ name: name.trim(), isHelper, joined: new Date().toISOString() })
    if (intentQuery.trim()) {
      try { sessionStorage.setItem('nura_intent_query', intentQuery.trim()) } catch {}
    }
    // Navegacion REAL, no de router. Home vive montado desde el arranque
    // (pestañas persistentes), asi que su efecto de bienvenida ya corrio
    // antes de que existieran ni el nombre ni la bandera: con `navigate`
    // se aterrizaba en el saludo generico. Recargar remonta la app y el
    // saludo sale con el nombre. Ocurre UNA vez en la vida del usuario.
    window.location.assign('/')
  }

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  if (showName) return (
    <div className={styles.page}>
      <div className={styles.namePage}>
        <img src="/logo-iso.png" alt="Nüra" className={styles.nameIso} />
        <h1 className={styles.nameTitle}>¿Cómo te llamas?</h1>
        
        <input className={styles.nameInput} placeholder="Tu nombre"
          value={name} onChange={e => setName(e.target.value)} autoFocus
          onKeyDown={e => e.key === 'Enter' && finish(false)} />
        <button className={styles.primary} onClick={() => finish(false)}>
          Empezar <ArrowRight size={17} />
        </button>
        {/* La bifurcacion ocurre ANTES del registro, que es lo que pedia el
            prompt maestro. Y se lleva el nombre ya escrito: volver a
            preguntarlo dos pantallas despues es la clase de friccion que
            se paga en el lado escaso del marketplace. */}
        <button className={styles.helperCta}
          onClick={() => navigate('/register-helper', { state: { name: name.trim() } })}>
          Soy profesional y quiero ofrecer mis servicios →
        </button>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.skip}>
        <button className={styles.skipBtn} onClick={() => setShowName(true)}>Saltar</button>
      </div>

      <div className={styles.content} key={step}>
        <div className={styles.visual}>{s.Visual && <s.Visual size={36} strokeWidth={1.4} color='var(--purple)' />}</div>
        <span className={styles.eyebrow}>{s.eyebrow}</span>
        <h1 className={styles.title}>{s.title}</h1>
        <p className={styles.desc}>{s.desc}</p>
        {s.isIntentCapture && (
          <textarea
            style={{
              marginTop:'var(--space-16)', width:'100%', padding:'var(--space-14) var(--space-16)',
              borderRadius:'var(--radius-card)', border:'1.5px solid var(--purple)',
              fontSize:'var(--text-base)', fontFamily:'inherit', resize:'none',
              background:'var(--purple-05)', color:'var(--ink)',
              outline:'none', minHeight:'80px', lineHeight:'1.5',
            }}
            placeholder='Ej: Busco una cuidadora para mi padre con Alzheimer...'
            value={intentQuery}
            onChange={e => setIntentQuery(e.target.value)}
            autoFocus
          />
        )}
      </div>

      <div className={styles.bottom}>
        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <div key={i} className={`${styles.dot} ${i === step ? styles.dotActive : i < step ? styles.dotDone : ''}`} />
          ))}
        </div>
        <button className={styles.primary} onClick={() => isLast ? setShowName(true) : setStep(i => i + 1)}>
          {isLast ? 'Comenzar' : 'Continuar'} <ArrowRight size={17} />
        </button>
      </div>
    </div>
  )
}
