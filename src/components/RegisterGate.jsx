import { useNavigate, useLocation } from 'react-router-dom'
import { Shield, Star, MessageCircle, UserPlus, ArrowRight, User, Sparkles } from 'lucide-react'
import { Button } from './ui'

/**
 * RegisterGate — bottom sheet that appears when unregistered user
 * tries to do something that requires an account.
 * Shows VALUE before asking to register. (Airbnb/Tinder pattern)
 */
export default function RegisterGate({ onClose, reason = 'contact' }) {
  const navigate = useNavigate()
  const location = useLocation()

  const REASONS = {
    contact: {
      Icon: MessageCircle,
      title: 'Escríbele directamente',
      desc: 'Crea tu cuenta gratis para contactar con este profesional y gestionar todos tus servicios desde un solo lugar.',
    },
    follow: {
      Icon: User,
      title: 'Sigue a este profesional',
      desc: 'Crea tu cuenta para seguir a profesionales y ver sus actualizaciones de disponibilidad.',
    },
    default: {
      Icon: Sparkles,
      title: 'Encuentra a quien necesitas',
      desc: 'Crea tu cuenta gratis y empieza a encontrar a la persona adecuada para lo que necesitas.',
    },
  }

  const r = REASONS[reason] || REASONS.default

  const BENEFITS = [
    { icon: <MessageCircle size={15} color="var(--purple)" />, text: 'Contacto directo con profesionales' },
    { icon: <Shield size={15} color="var(--green)" />, text: 'Acceso a más de 900 profesionales en Barcelona' },
    { icon: <Star size={15} color="var(--amber)" />, text: 'Historial y valoraciones de tus servicios' },
    { icon: <UserPlus size={15} color="var(--purple)" />, text: 'Sigue profesionales y accede a ellos cuando quieras' },
  ]

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(30,25,40,0.35)',  /* Aire: sombra tibia */
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'rgba(252,251,248,0.98)',  /* papel cálido */
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderRadius: '28px 28px 0 0',
        /* LA HOJA: nunca crece fuera de la pantalla. 88dvh usa el viewport
           VISUAL (descuenta el teclado en iOS) y el relleno inferior reserva
           la barra: la ultima accion queda siempre por encima del menu. */
        maxHeight: '88dvh',
        overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        padding: 'var(--space-8) 22px calc(var(--nav-h) + var(--space-12))',
        width: '100%', maxWidth: '500px',
        boxShadow: '0 -8px 40px rgba(33,29,51,0.1)',
        animation: 'slideUp 0.28s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}>
        {/* Handle */}
        <div style={{width:36,height:4,borderRadius:2,background:'var(--surface-muted)',margin:'var(--space-12) auto var(--space-20)'}} />

        {/* Icon + headline */}
        <div style={{textAlign:'center',marginBottom:'var(--space-20)'}}>
          <div style={{fontSize:'44px',marginBottom:'var(--space-12)',lineHeight:1}}>{(() => { const IC = r.Icon; return IC ? <IC size={36} strokeWidth={1.4} color='var(--purple)' /> : null })()}</div>
          <h2 style={{fontFamily:'var(--font-voice)',fontSize:'var(--text-heading)',fontWeight:500,color:'var(--ink)',letterSpacing:'-0.4px',margin:'0 0 var(--space-8)'}}>
            {r.title}
          </h2>
          <div className="hilo" style={{width:'56px', margin:'var(--space-2) 0 var(--space-10)'}} />
          <p style={{fontSize:'var(--text-sm)',color:'rgba(33,29,51,0.45)',lineHeight:1.65,margin:0,maxWidth:'280px',marginInline:'auto'}}>
            {r.desc}
          </p>
        </div>

        {/* Benefits */}
        <div style={{display:'flex',flexDirection:'column',gap:'var(--space-10)',marginBottom:'var(--space-24)',
          background:'var(--surface-subtle)',borderRadius:'var(--radius-card)',padding:'var(--space-14) var(--space-16)'}}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:'var(--space-10)'}}>
              {b.icon}
              <span style={{fontSize:'var(--text-sm)',color:'rgba(33,29,51,0.65)',fontWeight:500}}>{b.text}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{display:'flex',flexDirection:'column',gap:'var(--space-10)'}}>
          <Button variant="primary" full
            onClick={() => { onClose(); sessionStorage.setItem('nura_return_to', location.pathname + location.search); navigate('/login') }}
            style={{fontSize:'var(--text-base)',letterSpacing:'-0.2px'}}>
            Crear cuenta gratis <ArrowRight size={16} />
          </Button>
          <button
            onClick={() => { onClose(); sessionStorage.setItem('nura_return_to', location.pathname + location.search); navigate('/login') }}
            style={{
              width:'100%',padding:'13px',
              background:'var(--surface-subtle)',color:'rgba(33,29,51,0.55)',
              border:'none',borderRadius:'var(--radius-full)',
              fontSize:'var(--text-sm)',fontWeight:600,
              cursor:'pointer',
            }}>
            Ya tengo cuenta
          </button>
        </div>

        <p style={{textAlign:'center',fontSize:'var(--text-xs)',color:'rgba(33,29,51,0.25)',marginTop:'var(--space-14)',marginBottom:0}}>
          Gratis · Sin tarjeta · Sin compromiso
        </p>
      </div>
    </div>
  )
}
