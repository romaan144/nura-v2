import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, Star, Zap, MapPin, UserCheck } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import styles from './HowItWorks.module.css'

const STEPS = [
  {
    n: '01',
    title: 'Cuéntale qué necesitas',
    desc: 'Escribe en lenguaje natural. "Necesito una cuidadora para mi madre con Alzheimer en el Eixample" — Nüra entiende el contexto completo.',
    example: '"Mi hijo de 5 años tiene problemas con la pronunciación, busco logopeda esta semana"',
    color: '#7B2FFF',
  },
  {
    n: '02',
    title: 'Nüra analiza y selecciona',
    desc: 'La IA evalúa más de 1.200 perfiles verificados. Filtra por especialidad, zona, disponibilidad, valoraciones y compatibilidad con tu caso.',
    example: 'En segundos te presenta las personas más adecuadas — no una lista genérica.',
    color: 'var(--green)',
  },
  {
    n: '03',
    title: 'Contacta directamente',
    desc: 'Escribe al profesional, pregunta lo que necesites y solicita el servicio. Nüra te ayuda a cerrar el acuerdo en el chat.',
    example: 'Sin intermediarios. Sin comisiones ocultas. Tú y el profesional.',
    color: '#1A56DB',
  },
]

const TRUST = [
  { icon: <Shield size={20} />, title: 'Identidad verificada', desc: 'Cada profesional verifica su DNI. Una persona, un perfil. Sin duplicados.' },
  { icon: <Star size={20} />, title: 'Valoraciones auténticas', desc: 'Solo pueden valorar quienes han contratado. Sin reseñas falsas.' },
  { icon: <MapPin size={20} />, title: 'Cerca de ti', desc: 'Profesionales en tu zona. Presencial cuando lo necesites.' },
  { icon: <Zap size={20} />, title: 'Respuesta rápida', desc: 'La mayoría responde en menos de 1 hora. Urgencias disponibles.' },
]

const DIFFERENCE = [
  { label: 'Buscadores', pro: false, desc: 'Te dan una lista de páginas' },
  { label: 'Directorios', pro: false, desc: 'Te dan una lista de profesionales' },
  { label: 'Nüra', pro: true, desc: 'Entiende lo que necesitas y selecciona quién puede ayudarte' },
]

export default function HowItWorks() {
  const navigate = useNavigate()
  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <div className={styles.content}>

        {/* Header */}
        <div className={styles.hero}>
          <p className={styles.eyebrow}>CÓMO FUNCIONA</p>
          <h1 className={styles.heroTitle}>La IA que conecta<br/>personas reales</h1>
          <p className={styles.heroDesc}>No es un buscador. No es un directorio. Es una inteligencia artificial que entiende lo que necesitas y encuentra a la persona exacta que puede ayudarte.</p>
        </div>

        {/* Philosophy statement */}
      <div style={{
        textAlign:'center', padding:'0 20px 8px',
        borderBottom:'1px solid rgba(0,0,0,0.06)', marginBottom:'4px',
      }}>
        <p style={{
          fontSize:'var(--text-md)', fontWeight:800, color:'rgba(0,0,0,0.8)',
          letterSpacing:'-0.4px', lineHeight:1.5, margin:0,
          fontStyle:'italic',
        }}>
          "La IA no reemplaza humanos.<br/>Nüra conecta humanos."
        </p>
      </div>

      {/* Steps */}
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.stepNum} style={{color: s.color}}>{s.n}</div>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
                <div className={styles.stepExample}>{s.example}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Diferenciador */}
        <div className={styles.diffCard}>
          <h3 className={styles.sectionTitle}>¿En qué se diferencia Nüra?</h3>
          {DIFFERENCE.map((d, i) => (
            <div key={i} className={styles.diffRow}>
              <span className={d.pro ? styles.diffPro : styles.diffCon}>{d.pro ? '✓' : '×'}</span>
              <div>
                <span className={styles.diffLabel}>{d.label}</span>
                <span className={styles.diffDesc}> — {d.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust */}
        <div className={styles.trustGrid}>
          {TRUST.map((t, i) => (
            <div key={i} className={styles.trustCard}>
              <div className={styles.trustIcon}>{t.icon}</div>
              <div className={styles.trustTitle}>{t.title}</div>
              <div className={styles.trustDesc}>{t.desc}</div>
            </div>
          ))}
        </div>

        {/* Sobre Nüra */}
        <div id="about" style={{
          background:'rgba(255,255,255,0.7)',
          border:'1px solid rgba(0,0,0,0.06)',
          borderRadius:'20px', padding:'24px 20px',
          marginBottom:'12px',
        }}>
          <p style={{fontSize:'var(--text-xs)',fontWeight:700,color:'rgba(123,47,255,0.6)',
            letterSpacing:'0.5px',textTransform:'uppercase',margin:'0 0 10px'}}>
            Sobre Nüra
          </p>
          <h3 style={{fontSize:'var(--text-md)',fontWeight:800,color:'rgba(0,0,0,0.85)',
            letterSpacing:'-0.4px',margin:'0 0 10px',lineHeight:1.3}}>
            Construida para conectar personas reales
          </h3>
          <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.55)',lineHeight:1.7,margin:'0 0 12px'}}>
            Nüra nació de una pregunta simple: ¿por qué es tan difícil encontrar a la persona adecuada cuando más la necesitas?
          </p>
          <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.55)',lineHeight:1.7,margin:'0 0 12px'}}>
            No creemos que la IA deba reemplazar el contacto humano. Creemos que debe facilitar que dos personas se encuentren — la que necesita ayuda y la que puede darla.
          </p>
          <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.55)',lineHeight:1.7,margin:0,
            fontStyle:'italic',borderLeft:'3px solid rgba(123,47,255,0.2)',paddingLeft:'12px'}}>
            "La tecnología más poderosa es la que pone en contacto a personas."
          </p>
        </div>

        {/* Helper CTA */}
        <div style={{
          background:'linear-gradient(135deg,rgba(123,47,255,0.06),rgba(0,212,200,0.04))',
          border:'1px solid rgba(123,47,255,0.12)',
          borderRadius:'20px',padding:'24px 20px',
          textAlign:'center',display:'flex',flexDirection:'column',
          alignItems:'center',gap:'10px',marginBottom:'12px',
        }}>
          <UserCheck size={28} color='var(--purple)' strokeWidth={1.6} />
          <h3 style={{fontSize:'var(--text-md)',fontWeight:800,margin:0,
            color:'rgba(0,0,0,0.8)',letterSpacing:'-0.3px'}}>
            ¿Eres profesional?
          </h3>
          <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.45)',margin:0,
            lineHeight:1.6,maxWidth:'260px'}}>
            Ofrece tus servicios. Nüra construye tu perfil automáticamente y te conecta con quienes te necesitan.
          </p>
          <button
            onClick={() => navigate('/register-helper')}
            style={{
              padding:'12px 24px',
              background:'linear-gradient(135deg,#7B2FFF,#00D4C8)',
              color:'white',border:'none',borderRadius:'100px',
              fontSize:'var(--text-sm)',fontWeight:700,cursor:'pointer',
              fontFamily:'-apple-system,"Inter",sans-serif',
            }}>
            Crear mi perfil profesional
          </button>
        </div>

        {/* CTA */}
        <div className={styles.ctaCard}>
          <img src="/logo-iso.png" alt="Nüra" className={styles.ctaIso} />
          <h3 className={styles.ctaTitle}>¿Qué necesitas hoy?</h3>
          <p className={styles.ctaDesc}>Cuéntaselo a Nüra. En menos de un minuto tienes candidatos.</p>
          <button className={styles.ctaBtn} onClick={() => navigate('/')}>
            Hablar con Nüra <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  )
}
