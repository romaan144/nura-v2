import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Compass, MessageCircle, User, Rss, UserCheck, UserPlus } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './DesktopSidebar.module.css'

export default function DesktopSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalUnreadChats, user } = useUser()

  const hideOn = ['/login', '/register-helper', '/splash', '/onboarding']
  if (hideOn.some(p => location.pathname.startsWith(p))) return null

  const tabs = [
    { path: '/', icon: <Search size={20} />, label: 'Nüra' },
    { path: '/explore', icon: <Compass size={20} />, label: 'Explorar' },
    { path: '/chats', icon: <MessageCircle size={20} />, label: 'Chats', badge: totalUnreadChats },
    { path: '/feed', icon: <Rss size={20} />, label: 'Feed' },
    { path: '/siguiendo', icon: <UserCheck size={20} />, label: 'Siguiendo' },
    { path: '/profile', icon: <User size={20} />, label: 'Mi perfil' },
  ]

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <img src="/logo-iso.png" alt="" className={styles.logoIso} />
        <img src="/logo-text.png" alt="Nüra" className={styles.logoText} />
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {tabs.map(({ path, icon, label, badge }) => {
          const active = location.pathname === path
          return (
            <button key={path}
              className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
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
        <div className={styles.user} onClick={() => navigate('/profile')}>
          <img
            src={`https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(user.name)}`}
            alt="" className={styles.userAvatar} />
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userSub}>{user.isHelper ? 'Profesional' : 'Miembro'}</div>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <p>Nüra · Barcelona · 2026</p>
      </div>
    </aside>
  )
}
