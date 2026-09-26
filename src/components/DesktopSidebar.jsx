import UserAvatar from './UserAvatar'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, MessageCircle, User, UserCheck } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useSinContestar } from '../utils/sinContestar'
import { useRespuestasNuevas } from '../utils/respuestasNuevas'
import styles from './DesktopSidebar.module.css'

export default function DesktopSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalUnreadChats, user } = useUser()
  const sinContestar = useSinContestar(user)
  const { total: respuestas } = useRespuestasNuevas()

  const hideOn = ['/login', '/register-helper', '/splash']
  if (hideOn.some(p => location.pathname.startsWith(p))) return null

  const tabs = [
    { path: '/', icon: <Search size={20} />, label: 'Buscar' },
    { path: '/chats', icon: <MessageCircle size={20} />, label: 'Chats', badge: totalUnreadChats + sinContestar + respuestas },
    { path: '/siguiendo', icon: <UserCheck size={20} />, label: 'Siguiendo' },
    { path: '/profile', icon: <User size={20} />, label: 'Mi perfil' },
  ]

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <img src="/logo-iso.png" alt="" className={styles.logoIso} />
        <span className={styles.wordmark}>Nüra</span>
      </div>

      {/* Nav */}
      <nav className={styles.nav} aria-label="Navegación principal">
        {tabs.map(({ path, icon, label, badge }) => {
          const active = location.pathname === path
          return (
            <button key={path}
              className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => navigate(path)}>
              <span className={styles.navIcon}>{icon}</span>
              <span className={styles.navLabel}>{label}</span>
              {badge > 0 && <span className={styles.navBadge}>{badge}</span>}
            </button>
          )
        })}
      </nav>

      {/* User */}
      {user && (
        <button className={styles.user} onClick={() => navigate('/profile')}>
          <UserAvatar user={user} decorative className={styles.userAvatar} />
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userSub}>{user.isHelper ? 'Profesional' : 'Miembro'}</div>
          </div>
        </button>
      )}

      <div className={styles.footer}>
        <p className={styles.footerVoice}>Personas que<br />hacen bien.</p>
        <p>Nüra · Cerca de ti</p>
      </div>
    </aside>
  )
}
