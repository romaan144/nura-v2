import { useNavigate, useLocation } from 'react-router-dom'
import { Shield, Star, MessageCircle, UserPlus, ArrowRight, User, Sparkles } from 'lucide-react'

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
      Icon: UserPlus,
      title: 'Sigue a profesionales',
      desc: 'Sigue a los profesionales que te interesan y encuéntralos fácilmente cuando los necesites.',
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
    { icon: <MessageCircle size={15} color="#7B2FFF" />, text: 'Contacto directo con profesionales' },
    { icon: <Shield size={15} color="var(--green)" />, text: 'Acceso a más de 900 profesionales en Barcelona' },
    { icon: <Star size={15} color="var(--amber)" />, text: 'Historial y valoraciones de tus servicios' },
    { icon: <UserPlus size={15} color="var(--purple)" />, text: 'Sigue profesionales y accede a ellos cuando quieras' },
  ]

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderRadius: '24px 24px 0 0',
        padding: '8px 22px 32px',
        width: '100%', maxWidth: '500px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.1)',
        animation: 'slideUp 0.28s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}>
        {/* Handle */}
        <div style={{width:36,height:4,borderRadius:2,background:'rgba(0,0,0,0.1)',margin:'12px auto 20px'}} />

        {/* Icon + headline */}
        <div style={{textAlign:'center',marginBottom:'20px'}}>
          <div style={{fontSize:'44px',marginBottom:'12px',lineHeight:1}}>{(() => { const IC = r.Icon; return IC ? <IC size={36} strokeWidth={1.4} color='var(--purple)' /> : null })()}</div>
          <h2 style={{fontSize:'var(--text-md)',fontWeight:800,color:'rgba(0,0,0,0.85)',letterSpacing:'-0.4px',margin:'0 0 8px'}}>
            {r.title}
          </h2>
          <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.45)',lineHeight:1.65,margin:0,maxWidth:'280px',marginInline:'auto'}}>
            {r.desc}
          </p>
        </div>

        {/* Benefits */}
        <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'24px',
          background:'rgba(0,0,0,0.03)',borderRadius:'16px',padding:'14px 16px'}}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:'10px'}}>
              {b.icon}
              <span style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.65)',fontWeight:500}}>{b.text}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          <button
            onClick={() => { onClose(); sessionStorage.setItem('nura_return_to', location.pathname + location.search); navigate('/login') }}
            style={{
              display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
              width:'100%',padding:'15px',
              background:'var(--purple)',color:'white',
              border:'none',borderRadius:'100px',
              fontSize:'var(--text-base)',fontWeight:700,
              cursor:'pointer',letterSpacing:'-0.2px',
            }}>
            Crear cuenta gratis <ArrowRight size={16} />
          </button>
          <button
            onClick={() => { onClose(); sessionStorage.setItem('nura_return_to', location.pathname + location.search); navigate('/login') }}
            style={{
              width:'100%',padding:'13px',
              background:'rgba(0,0,0,0.05)',color:'rgba(0,0,0,0.55)',
              border:'none',borderRadius:'100px',
              fontSize:'var(--text-sm)',fontWeight:600,
              cursor:'pointer',
            }}>
            Ya tengo cuenta
          </button>
        </div>

        <p style={{textAlign:'center',fontSize:'var(--text-xs)',color:'rgba(0,0,0,0.25)',marginTop:'14px',marginBottom:0}}>
          Gratis · Sin tarjeta · Sin compromiso
        </p>
      </div>
    </div>
  )
}
